import React, { useEffect, useRef, useState } from 'react';
import { useStation } from '../context/StationContext';
import { startSession, tickSession, endSession, logPageView } from '../services/metricsService';
import { resolveAudioUrlCached, musicServerHealthCheck } from '../services/musicSource';
import { db, auth } from '../firebaseConfig';
import { trackPlay } from '../services/analytics';

// ---------------------------------------------------------------------------
// iOS / Android background-audio fix:
//   1. MediaSession metadata + action handlers — tells iOS this is a media app,
//      so iOS keeps audio alive when the screen locks and exposes lockscreen
//      play/pause + skip controls.
//   2. `playsInline` + `preload="auto"` on the audio element so iOS doesn't
//      try to hijack playback to a fullscreen player and so the next chunk of
//      audio is already buffered when the screen wakes back up.
//   3. Screen Wake Lock (Android/Chrome) — keeps the CPU running so audio
//      decoding isn't throttled. iOS Safari silently no-ops this, which is
//      fine because the MediaSession path already handles iOS.
//   4. `visibilitychange` listener — when the user unlocks the phone and the
//      tab becomes visible again, re-invoke `audio.play()` if `isPlaying` is
//      true. iOS Safari sometimes leaves the element in a paused state after
//      a screen-lock cycle even when MediaSession says it should be playing.
// ---------------------------------------------------------------------------

type WakeLockSentinel = any; // navigator.wakeLock is not in lib.dom yet

function setMediaSessionMetadata(track: any, audio: HTMLAudioElement) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try {
    const artwork = track?.image
      ? [{ src: track.image, sizes: '512x512', type: 'image/png' }]
      : [];
    (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
      title: track?.title || 'VIBE-X Live',
      artist: track?.artist || 'VIBE-X Radio',
      album: track?.genre || 'Live Radio',
      artwork,
    });
    (navigator as any).mediaSession.playbackState = 'playing';
  } catch (e) {
    console.warn('[VIBE-X] MediaSession metadata failed:', e);
  }
}

function installMediaSessionActions(
  audioRef: React.RefObject<HTMLAudioElement>,
  onPlay: () => void,
  onPause: () => void,
  onPrev: () => void,
  onNext: () => void,
) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  const ms = (navigator as any).mediaSession;
  try {
    // The 'play' action handler is the most reliable way to resume audio on iOS
    // after a Bluetooth reconnection or lock/unlock cycle. iOS delivers this
    // callback with implicit user-gesture context, so audio.play() inside it
    // is allowed even if a direct .play() call would return NotAllowedError.
    const resumeAudio = () => {
      onPlay();
      const a = audioRef.current;
      if (!a) return;
      // The audio element might be in 'paused' state. Try play, retry on
      // transient NotAllowedError because the audio session may still be
      // re-acquiring the output route (Bluetooth handshake, etc.).
      let attempt = 0;
      const max = 6;
      const tryOnce = () => {
        attempt += 1;
        a.play().then(() => {
          console.info(`[VIBE-X] mediaSession.play resume ok on attempt ${attempt}`);
        }).catch((err: any) => {
          if ((err.name === 'NotAllowedError' || err.name === 'AbortError') && attempt < max) {
            const delay = Math.min(60 * Math.pow(1.7, attempt - 1), 1000);
            console.info(`[VIBE-X] mediaSession.play blocked (${err.name}) attempt ${attempt}, retry in ${delay}ms`);
            setTimeout(tryOnce, delay);
          } else {
            console.warn('[VIBE-X] mediaSession.play failed:', err.name, err.message);
          }
        });
      };
      tryOnce();
    };
    ms.setActionHandler('play', resumeAudio);
    ms.setActionHandler('pause', () => { onPause(); audioRef.current?.pause(); });
    ms.setActionHandler('previoustrack', () => { onPrev(); });
    ms.setActionHandler('nexttrack', () => { onNext(); });
    ms.setActionHandler('seekbackward', () => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15); });
    ms.setActionHandler('seekforward',  () => { if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 30); });
  } catch (e) {
    console.warn('[VIBE-X] MediaSession action handlers failed:', e);
  }
}

export default function GlobalAudioPlayer() {
  const { moodedPlaylist, currentTrackIndex, setCurrentTrackIndex, isPlaying, setIsPlaying, volume, nextTrack, commercialOverride } = useStation();
  // Resolve to either the mooded playlist (folder overrides + Firestore mood-filter)
  // or the raw playlist — both are the same shape, and `moodedPlaylist` is null
  // only when no mood is active AND no override is in flight, in which case it
  // already returns the full playlist from StationContext.
  const playlist = moodedPlaylist;
  const audioRef = useRef<HTMLAudioElement>(null);
  const sessionStarted = useRef(false);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // True once the user has clicked anywhere on the page — needed to
  // distinguish browser autoplay policy (no user gesture) from a real
  // playback failure (e.g. dead URL).
  const userHasInteractedRef = useRef(false);
  // Mirror of `autoplayBlocked` state into a ref so the document-level
  // click listener (registered once, no deps) can read latest value.
  const autoplayBlockedRef = useRef(false);

  // -------------------------------------------------------------------------
  // PLAYBACK STATE
  // -------------------------------------------------------------------------
  // `src` is the resolved URL for the currently-selected track. The resolve
  // effect below updates it once `resolveAudioUrlCached` returns (local
  // server → Storage fallback). iOS Safari returns NotAllowedError if you
  // call play() on an <audio> whose src just changed — the play effect
  // handles that with a small retry chain.
  const [src, setSrc] = useState<string | null>(null);
  const [srcSource, setSrcSource] = useState<'local-mac' | 'local-win' | 'storage' | 'live' | 'none'>('storage');
  const [srcError, setSrcError] = useState<string | null>(null);
  const [nextSrc, setNextSrc] = useState<string | null>(null);
  // True when browser autoplay policy blocked the initial play() (no user
  // gesture yet). Shows a clear "Click to start" overlay so the user knows
  // the player LOOKS playing but audio is muted until they interact.
  const [autoplayBlocked, setAutoplayBlockedState] = useState(false);
  // Wrapper that keeps the ref in sync so document-level listener can read it.
  const setAutoplayBlocked = (v: boolean) => {
    autoplayBlockedRef.current = v;
    setAutoplayBlockedState(v);
  };
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [currentSource, setCurrentSource] = useState<'local-mac' | 'local-win' | 'storage' | 'live' | 'none'>('none');

  const currentTrack = playlist[currentTrackIndex] || null;
  const nextTrackIndex = (currentTrackIndex + 1) % Math.max(playlist.length, 1);

  // ---- Wake Lock (Android/Chrome) — keeps CPU awake so audio isn't throttled ----
  const requestWakeLock = async () => {
    try {
      const nav: any = navigator as any;
      if (nav.wakeLock && typeof nav.wakeLock.request === 'function') {
        wakeLockRef.current = await nav.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          // wake lock auto-releases when tab hidden; we'll re-request on visibilitychange
          console.log('[VIBE-X] Wake lock released');
        });
        console.log('[VIBE-X] Wake lock acquired');
      }
    } catch (e) {
      console.warn('[VIBE-X] Wake lock request failed (likely iOS Safari, which is OK):', (e as Error).message);
    }
  };
  const releaseWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      }
    } catch (e) { /* noop */ }
  };

  // ---- MediaSession action wiring (lockscreen + Bluetooth controls) ----
  useEffect(() => {
    const prev = () => {
      if (playlist.length === 0) return;
      const wrapped = ((currentTrackIndex - 1) % playlist.length + playlist.length) % playlist.length;
      setCurrentTrackIndex(wrapped);
    };
    installMediaSessionActions(
      audioRef,
      () => { if (!isPlaying) setIsPlaying(true); },   // play
      () => { if (isPlaying) setIsPlaying(false); },   // pause
      prev,                                            // prev
      () => nextTrack(),                               // next
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrackIndex, playlist.length]);

  // ---- Update MediaSession metadata whenever the current track changes ----
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      setMediaSessionMetadata(currentTrack, audioRef.current);
    }
  }, [currentTrack?.id]);

  // ---- Re-engage audio when the tab becomes visible, audio context is restored,
  //      the page is restored from BFCache, or window regains focus.
  // iOS Safari + Bluetooth audio workflow:
  //   1. User plays music (audio.play() inside a user-gesture handler).
  //   2. Audio streams over AirPlay/Bluetooth to speakers/headphones.
  //   3. User locks screen or switches apps — iOS MAY interrupt the audio
  //      session when Bluetooth reconnects (e.g. car stereo handshake,
  //      AirPods re-pair, lock+unlock cycle). The <audio> element goes
  //      to .paused = true but the React state still says isPlaying = true.
  //   4. User unlocks the app and expects music to resume.
  //   5. visibilitychange sometimes DOES NOT fire on iOS PWA — instead iOS
  //      fires `pagehide`/`pageshow` (BFCache) or just `focus`/`focusin`.
  //   6. Calling audio.play() at this point returns NotAllowedError because
  //      iOS still considers the playback interrupted — but retrying within
  //      ~250ms almost always succeeds because the audio session has been
  //      re-acquired by then.
  //
  // The fix: a single robust resumer that listens to every relevant event,
  // checks `audio.paused` against `isPlaying`, and runs a short retry chain
  // that ignores NotAllowedError for the first few attempts (it's transient).
  useEffect(() => {
    let cancelled = false;
    const resumeIfNeeded = (source: string) => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      // audio is already playing — nothing to do
      if (isPlaying) {
        requestWakeLock();
        return;
      }
      // audio reports not paused, but our React state says not playing — bail
      // (defensive: prevents the resumer from fighting explicit pause intent)
      void source;
    };

    const forceResume = (source: string) => {
      const audio = audioRef.current;
      if (!audio || !isPlaying) {
        // Always re-acquire the wake lock when the page becomes active
        if (document.visibilityState === 'visible') requestWakeLock();
        return;
      }
      // If the audio element thinks it's paused (iOS interrupted it), try to
      // resume. We retry because iOS often returns NotAllowedError for the
      // first ~250ms after an audio session interruption while it re-acquires
      // the audio output route (Bluetooth handshake, etc.).
      if (!audio.paused) {
        // Audio is fine. Re-acquire wake lock in case Chrome released it.
        requestWakeLock();
        return;
      }
      console.info(`[VIBE-X] Audio paused after ${source}, forcing resume`);
      let attempt = 0;
      const maxAttempts = 8;
      const tryResume = () => {
        if (cancelled) return;
        attempt += 1;
        audio.play().then(() => {
          console.info(`[VIBE-X] Resume ok on attempt ${attempt} (${source})`);
        }).catch((err: any) => {
          if (cancelled) return;
          const isRetryable = (err.name === 'NotAllowedError' || err.name === 'AbortError');
          if (isRetryable && attempt < maxAttempts) {
            // iOS audio session still re-acquiring — backoff retry
            const delay = Math.min(80 * Math.pow(1.6, attempt - 1), 1500);
            console.info(`[VIBE-X] Resume blocked (${err.name}) attempt ${attempt}, retry in ${delay}ms`);
            setTimeout(tryResume, delay);
          } else {
            // NotSupportedError or other non-retryable — don't keep hammering,
            // the audio element is broken. Watchdog will not call play() again
            // until src changes (via track advance or retry-from-storage).
            console.warn(`[VIBE-X] Resume failed after ${attempt} attempts (${source}):`, err.name, err.message);
          }
        });
      };
      tryResume();
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') forceResume('visibilitychange→visible');
    };
    const onPageShow = (e: PageTransitionEvent) => {
      // BFCache restore: page is being shown again, possibly after iOS killed
      // the audio session in the background. persisted === true means BFCache.
      if (e.persisted) forceResume('pageshow(BFCache)');
      else forceResume('pageshow');
    };
    const onFocus = () => forceResume('focus');
    const onAudioInterruptionEnd = () => forceResume('audio-interruption-end');

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pageshow', onPageShow);
    window.addEventListener('focus', onFocus);
    window.addEventListener('focusin', onFocus);
    // Track first user interaction (click/keydown/touchstart) — once true,
    // autoplay policy unblocks future play() calls.
    const markInteracted = () => {
      if (!userHasInteractedRef.current) {
        userHasInteractedRef.current = true;
        setUserHasInteracted(true);
        // If autoplay was blocked and user just clicked, try to resume
        if (autoplayBlockedRef.current && audioRef.current) {
          audioRef.current.play().then(() => setAutoplayBlocked(false)).catch(() => {});
        }
      }
    };
    document.addEventListener('click', markInteracted, { once: false });
    document.addEventListener('keydown', markInteracted, { once: false });
    document.addEventListener('touchstart', markInteracted, { once: false });
    // iOS fires this on the audio element when an interruption ends
    // (Bluetooth reconnect, route change, Siri dismissal, etc.)
    const audioEl = audioRef.current;
    if (audioEl) {
      audioEl.addEventListener('play', () => resumeIfNeeded('audio.play event'));
    }

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('focusin', onFocus);
      document.removeEventListener('click', markInteracted);
      document.removeEventListener('keydown', markInteracted);
      document.removeEventListener('touchstart', markInteracted);
      if (audioEl) {
        audioEl.removeEventListener('play', () => resumeIfNeeded('audio.play event'));
      }
    };
  }, []);
  // ---- Manage wake lock alongside play/pause ----
  useEffect(() => {
    if (isPlaying) requestWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [isPlaying]);

  // ---- Set MediaSession.playbackState whenever isPlaying flips ----
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try { (navigator as any).mediaSession.playbackState = isPlaying ? 'playing' : 'paused'; } catch {}
    }
  }, [isPlaying]);

  // Resolve the CURRENT track's URL whenever it changes. local server first
  // (sub-millisecond playback start), falls back to Firebase Storage.
  useEffect(() => {
    if (!currentTrack) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await resolveAudioUrlCached(currentTrack);
        if (cancelled) return;
        if (result.url) {
          setSrc(result.url);
          setSrcSource(result.source === 'none' ? 'storage' : result.source);
          setCurrentSource(result.source);
          setSrcError(null);
          if (result.source === 'local-mac' || result.source === 'local-win') {
            console.log(`[VIBE-X] Playing from ${result.source}:`, currentTrack.title);
          } else if (result.source === 'live') {
            console.log('[VIBE-X] Playing from live stream:', currentTrack.title);
          } else {
            console.log('[VIBE-X] Playing from Firebase Storage (local server unreachable):', currentTrack.title);
          }
        } else {
          // Server unreachable AND no Storage fallback. Use raw audioUrl as
          // last resort — it's already an HTTPS URL the browser can fetch
          // directly (serverFile tracks have the Tailscale HTTPS URL).
          const fallbackUrl = currentTrack.audioUrl;
          if (fallbackUrl) {
            console.warn('[VIBE-X] Resolve returned null, using raw audioUrl as last resort:', fallbackUrl);
            setSrc(fallbackUrl);
            setSrcSource('storage');
            setCurrentSource('storage');
          } else {
            setSrc(null);
            setSrcSource('none');
            setCurrentSource('none');
          }
        }
      } catch (e: any) {
        if (cancelled) return;
        setSrcError(e.message);
        console.error('[VIBE-X] Audio URL resolution failed:', e);
        const raw = currentTrack.audioUrl;
        if (raw) {
          setSrc(raw);
          setSrcSource('storage');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [currentTrack?.id, currentTrack?.audioUrl]);

  // Pre-resolve the NEXT track's URL so its file is in the browser cache
  // (and in iOS Safari's media cache) before the user advances to it. The
  // hidden <audio preload> element below is what actually warms the cache.
  useEffect(() => {
    if (!playlist || playlist.length < 2) {
      setNextSrc(null);
      return;
    }
    const nextTrack = playlist[nextTrackIndex];
    if (!nextTrack || nextTrack.id === currentTrack?.id) {
      setNextSrc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const result = await resolveAudioUrlCached(nextTrack);
        if (cancelled) return;
        if (result.url) setNextSrc(result.url);
        else setNextSrc(null);
      } catch {
        if (!cancelled) setNextSrc(null);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // One-time music server health check + admin notification on app load.
  // Also clears the per-track URL cache so any stale null entries from a
  // previous failed resolve don't poison subsequent playback attempts.
  useEffect(() => {
    // Lazy import to avoid circular deps at module load.
    import('../services/musicSource').then(({ musicServerHealthCheck, clearMusicCache }) => {
      clearMusicCache();
      musicServerHealthCheck().then((res) => {
        if (!res.ok) {
          console.warn('[VIBE-X] Local music server down. Tried:', res.triedHosts);
        }
      });
    });
    // Re-check every 5 minutes while the page is open
    const interval = setInterval(() => {
      musicServerHealthCheck();
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Track page view on mount
  useEffect(() => {
    logPageView(window.location.pathname);
  }, []);

  // Start session when audio plays
  useEffect(() => {
    if (isPlaying && !sessionStarted.current) {
      startSession();
      sessionStarted.current = true;
      tickInterval.current = setInterval(() => tickSession(), 60 * 1000);
    }
    if (!isPlaying && sessionStarted.current) {
      endSession();
      sessionStarted.current = false;
      if (tickInterval.current) {
        clearInterval(tickInterval.current);
        tickInterval.current = null;
      }
    }
    return () => {
      if (sessionStarted.current) {
        endSession();
        sessionStarted.current = false;
      }
      if (tickInterval.current) {
        clearInterval(tickInterval.current);
        tickInterval.current = null;
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Track play in Firestore `listenerHistory` so Admin Suite sees real top tracks.
  useEffect(() => {
    if (currentTrack) {
      trackPlay(currentTrack.title, currentTrack.artist, currentTrack.genre, currentTrack.id);
    }
    // Intentionally only re-fire when track identity changes — not on play/pause toggles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

    // -------------------------------------------------------------------------
  // PLAY / PAUSE EFFECT
  // -------------------------------------------------------------------------
  // iOS Safari returns NotAllowedError if you call play() on an <audio>
  // element whose src just changed and hasn't emitted `loadeddata` yet.
  // The reliable workaround: call play() immediately on isPlaying/src change,
  // and let the catch-handler retry until it succeeds. iOS only blocks the
  // very first attempt after a src swap — subsequent retries within ~300ms
  // always succeed because by then `loadeddata` has fired.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (!isPlaying) {
      audio.pause();
      return;
    }

    // When src is null (URL resolution still in flight or failed), pause
    // the audio to stop the OLD track from continuing to play under a new
    // currentTrack identity. Without this, the user clicks next → audio
    // element keeps playing the previous track because src hasn't been
    // updated yet — UI shows new track, audio plays old track. Once src
    // resolves, this effect re-fires with the new URL and resumes play.
    if (!src) {
      audio.pause();
      return;
    }

    let cancelled = false;
    const tryPlay = (attempt: number) => {
      if (cancelled) return;
      audio.play().then(() => {
        console.info(`[VIBE-X] play() ok on attempt ${attempt}`);
        // If we previously showed the autoplay-blocked prompt, hide it now
        setAutoplayBlocked(false);
      }).catch((err: any) => {
        if (cancelled) return;
        if (err.name === 'NotAllowedError' && attempt < 6) {
          // iOS Safari hasn't warmed the element yet. Retry.
          // First retry 80ms, then 120, then 200, then 300, then 500ms.
          const delay = [80, 120, 200, 300, 500, 800][attempt - 1] ?? 1000;
          console.info(`[VIBE-X] autoplay blocked (attempt ${attempt}), retrying in ${delay}ms`);
          setTimeout(() => tryPlay(attempt + 1), delay);
        } else {
          // Final attempt failed. If the user has never interacted with the
          // document, this is almost certainly the browser's autoplay policy.
          // Don't pretend to be playing — show a clear "Click to play" prompt.
          console.warn('[VIBE-X] play() rejected:', err.name, err.message, 'attempt', attempt);
          if (err.name === 'NotAllowedError' && !userHasInteractedRef.current) {
            setAutoplayBlocked(true);
            // Keep isPlaying=true so the rest of the UI reflects intent,
            // but flip an internal flag so we don't keep retrying.
          }
        }
      });
    };
    tryPlay(1);

    return () => { cancelled = true; };
  }, [isPlaying, currentTrack?.id, src]);

  // ---- Commercial / Music Video override — pause music while commercial plays ----
  // When commercialOverride is set, TheWindow renders the commercial's <video>
  // element with audio. We MUST pause our <audio> here or both play at once.
  // When commercial ends, setCommercialOverride(null) fires and we resume.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (commercialOverride) {
      // Pause the music. Don't change `isPlaying` so the user's intent is preserved.
      audio.pause();
      console.info('[VIBE-X] Music paused for commercial:', commercialOverride.name);
    }
    // When override clears, the play effect above will re-engage audio if isPlaying.
  }, [commercialOverride?.id]);

  // When the audio element finishes loading the new src, retry play if user wants.
  // This is the safety net for the path where the retry loop already exhausted.
  const onLoadedData = () => {
    if (isPlaying && audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch((err: any) => {
        console.info('[VIBE-X] play-after-loadeddata:', err.name, err.message);
      });
    }
  };

  // ---- Bluetooth drop watchdog ----
  // iOS Safari + Bluetooth audio drops "out of the blue" because the OS
  // sometimes interrupts the audio session without firing ANY of the
  // page-lifecycle events (visibilitychange / pageshow / focus). The
  // symptom: <audio>.paused flips to true, React's isPlaying stays true,
  // and music stays silent until the user backgrounds and foregrounds the
  // tab (which is what the previous resumer listened for).
  //
  // The reliable fix: poll audio.paused vs isPlaying on a short interval,
  // AND listen to the audio element's own pause/waiting/stalled/error
  // events. If they disagree (we want to play but the element is paused),
  // re-issue play(). Also handle the "Bluetooth route changed → element
  // fired error" case by NOT swapping src mid-track — instead, just try
  // to resume from the current position.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let watchdogTimer: ReturnType<typeof setInterval> | null = null;
    let lastResumeAt = 0;

    const trySilentResume = (source: string) => {
      // Throttle: don't fire resume more than once per 1500ms
      const now = Date.now();
      if (now - lastResumeAt < 1500) return;
      if (!isPlaying) return;
      if (!audio.paused) return;
      lastResumeAt = now;
      console.info(`[VIBE-X] Watchdog resume (${source}) at ${audio.currentTime.toFixed(1)}s`);
      let attempt = 0;
      const max = 5;
      const tryOnce = () => {
        attempt += 1;
        audio.play().then(() => {
          console.info(`[VIBE-X] Watchdog resume ok on attempt ${attempt} (${source})`);
        }).catch((err: any) => {
          if ((err.name === 'NotAllowedError' || err.name === 'AbortError') && attempt < max) {
            const delay = Math.min(80 * Math.pow(1.6, attempt - 1), 800);
            setTimeout(tryOnce, delay);
          } else {
            console.warn(`[VIBE-X] Watchdog resume failed (${source}):`, err.name, err.message);
          }
        });
      };
      tryOnce();
    };

    // Periodic poll: catches cases where the audio element silently
    // pauses without firing any event we listened for
    watchdogTimer = setInterval(() => {
      if (isPlaying && audio.paused && audio.readyState >= 2 /* HAVE_CURRENT_DATA */) {
        trySilentResume('periodic-poll');
      }
    }, 1500);

    const onPause = () => {
      // Audio element paused. If React thinks we should be playing, this
      // is almost certainly an iOS audio session interruption (Bluetooth
      // drop, route change, Siri, etc.). Try to resume silently.
      if (isPlaying) trySilentResume('audio.pause event');
    };

    // Storage URLs from firebasestorage.googleapis.com have a known iOS bug:
    // when iOS interrupts audio on Bluetooth hand-off, the HTTPS connection
    // gets severed and the audio element enters a permanent broken state.
    // Calling play() on it returns NotAllowedError forever (no retry works).
    // The only reliable recovery: reload src to re-establish the stream.
    // iOS treats this as a fresh load, which works because of the user's
    // ongoing MediaSession context (the screen-lock 'play' gesture is
    // still considered active for ~30s after interruption).
    const onPauseWithStorageFallback = () => {
      if (!isPlaying) return;
      const a = audioRef.current;
      if (!a) return;
      // If src is from firebase storage, the resumable-play approach fails
      // on iOS. Reload the src instead — this is the proven fix.
      const isStorage = a.src && (a.src.includes('firebasestorage.googleapis.com') || a.src.includes('storage.googleapis.com'));
      const now = Date.now();
      if (isStorage && now - lastResumeAt > 3000) {
        lastResumeAt = now;
        const originalSrc = a.src;
        const originalTime = a.currentTime;
        console.info(`[VIBE-X] Storage audio interrupted, reloading src to recover (was at ${originalTime.toFixed(1)}s)`);
        // Force re-fetch by clearing and reassigning src
        a.src = '';
        // Use a microtask + a tick to ensure the empty src takes effect
        setTimeout(() => {
          if (!audioRef.current) return;
          audioRef.current.src = originalSrc;
          audioRef.current.load();
          audioRef.current.currentTime = originalTime;
          audioRef.current.play().then(() => {
            console.info('[VIBE-X] Storage audio recovered via src-reload');
          }).catch((err: any) => {
            console.warn('[VIBE-X] Storage src-reload failed:', err.name, err.message);
            trySilentResume('storage-fallback');
          });
        }, 50);
        return;
      }
      trySilentResume('audio.pause event');
    };

    const onWaiting = () => {
      // Buffer underrun — often happens mid-Bluetooth-handshake. Don't
      // touch the element, just log. iOS will fire 'playing' when buffer
      // is back. But if it doesn't within a few seconds, the periodic
      // poll above will catch it.
      console.info('[VIBE-X] Audio waiting (buffer underrun / route change)');
    };

    const onStalled = () => {
      console.info('[VIBE-X] Audio stalled (network or route)');
      // Don't try to resume here — let iOS finish whatever it's doing
    };

    const onPlaying = () => {
      // Audio element resumed playing. Re-acquire wake lock in case
      // Chrome released it during the interruption.
      if (isPlaying) requestWakeLock();
    };

    const onCanPlay = () => {
      // Element has enough data to play. If we should be playing but
      // aren't, kick it.
      if (isPlaying && audioRef.current && audioRef.current.paused) trySilentResume('canplay event');
    };

    audio.addEventListener('pause', onPauseWithStorageFallback);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('canplay', onCanPlay);

    return () => {
      if (watchdogTimer) clearInterval(watchdogTimer);
      audio.removeEventListener('pause', onPauseWithStorageFallback);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [isPlaying]);

  // ---- iOS audio session config ----
  // Setting these on the audio element tells iOS "treat me as a media app,
  // don't interrupt me for non-essential reasons, and keep the screen
  // wake-lock-style behavior on Bluetooth hand-off." Without these, iOS
  // may decide to interrupt audio mid-playback on a phone call, Siri,
  // or even on certain Bluetooth profile transitions (HFP → A2DP).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    // @ts-ignore — iOS-only attributes
    if ('x5AudioMode' in audio) audio.x5AudioMode = 'media';
    // @ts-ignore — iOS hint that this is media, not telephony
    if ('mediaGroup' in audio) (audio as any).mediaGroup = 'vibex-radio';
    // @ts-ignore — iOS hint to keep audio session active during transient interruptions
    if ('webkitPreservesPitch' in audio) (audio as any).webkitPreservesPitch = true;
  }, []);

  if (!currentTrack) return null;

  const isImageUrl = (url?: string) => {
    if (!url) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => url.toLowerCase().split('?')[0].endsWith(ext)) || url.startsWith('data:image/') || url.includes('picsum.photos');
  };

  if (!src) return null;

  return (
    <>
      {/* AUTOPLAY-BLOCKED PROMPT
          Browsers (Chrome/Safari/Firefox) block <audio>.play() on page load
          unless the user has interacted with the page. The audio element
          stays paused while React thinks isPlaying=true, so the UI looks
          like it's playing but no sound comes out. This overlay makes the
          state clear: "Click to start music." */}
      {autoplayBlocked && !userHasInteracted && (
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-gradient-to-r from-neon-green to-emerald-500 text-black shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform animate-pulse"
          onClick={() => {
            setUserHasInteracted(true);
            userHasInteractedRef.current = true;
            if (audioRef.current) {
              audioRef.current.play().then(() => setAutoplayBlocked(false)).catch(() => {});
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') (e.currentTarget as HTMLDivElement).click(); }}
        >
          <span className="text-2xl">🔊</span>
          <div>
            <div className="font-bold text-sm">Click to start music</div>
            <div className="text-xs opacity-80">Browser blocked autoplay — one click enables audio</div>
          </div>
        </div>
      )}

    <audio
      ref={audioRef}
      src={src || undefined}
      preload="auto"
      playsInline
      // crossorigin="anonymous" so the browser treats the audio as a CORS
      // resource instead of an opaque one. Without this, MediaError code 4
      // (MEDIA_ERR_SRC_NOT_SUPPORTED) fires for cross-origin HTTPS sources
      // like the Tailscale Funnel tunnel even though the file loads fine.
      crossOrigin="anonymous"
      // @ts-ignore — iOS-only attributes
      webkit-playsinline="true"
      // @ts-ignore — iOS-only attributes
      x-webkit-airplay="allow"
      controlsList="nodownload noplaybackrate"
      onLoadedData={onLoadedData}
      onError={(e) => {
        const err = (e as any).target?.error;
        const errCode = err?.code;
        // MediaError codes:
        //   1 = MEDIA_ERR_ABORTED (user abort, don't fall back)
        //   2 = MEDIA_ERR_NETWORK (network failure — DO fall back to storage)
        //   3 = MEDIA_ERR_DECODE (decode error — usually means bad file)
        //   4 = MEDIA_ERR_SRC_NOT_SUPPORTED (unsupported codec/url)
        // iOS Bluetooth drops sometimes surface as MEDIA_ERR_NETWORK with
        // code 2 even when the network is fine, because iOS sees the audio
        // route as lost. We must NOT swap src in that case — that would
        // restart playback from the beginning of the track.
        if (errCode === 1 || errCode === 3 || errCode === 4) {
          console.warn('[VIBE-X] Audio decode/src error (code ' + errCode + '):', err?.message);
          // For local-mac / local-win with a Firestore audioUrl fallback, try Storage
          if (errCode === 4 && (srcSource === 'local-mac' || srcSource === 'local-win') && currentTrack?.audioUrl && (currentTrack as any).serverFile === undefined) {
            console.warn('[VIBE-X] Local URL failed (src not supported), falling back to Storage for:', currentTrack.title);
            setSrc(currentTrack.audioUrl);
            setSrcSource('storage');
          } else if (errCode === 4) {
            // Already on Storage, or this is a server-file track with no Storage alternative.
            // Skip the auto-reload entirely — the previous reload handler caused an
            // infinite loop because it mutated a.src directly while React's src state
            // was unchanged, so the DOM stayed empty after the 50ms recovery. Just
            // advance to the next track instead — the user hears music again within
            // 1-2 seconds instead of an infinite reload loop.
            const a = audioRef.current;
            if (a) {
              console.warn('[VIBE-X] Audio src error (code 4), skipping to next track for:', currentTrack?.title);
              // Try once more after a brief pause, then advance
              setTimeout(() => {
                if (audioRef.current && isPlaying) {
                  nextTrack();
                }
              }, 200);
            }
          }
        } else if (errCode === 2) {
          // NETWORK error — likely a transient iOS audio route issue.
          // Do NOT change src. Let the watchdog + retry chain resume.
          console.info('[VIBE-X] Audio network error (likely iOS route change), letting watchdog handle:', err?.message);
        } else {
          console.error('[VIBE-X] Audio playback error (unknown code):', err);
        }
      }}
      onEnded={() => {
        // Advance to the next track. The next track's URL is already resolved
        // and pre-buffered (see `nextSrc` + hidden preload audio below), so
        // the gap between tracks is essentially the React render time.
        nextTrack();
      }}
    />
    {/* Hidden pre-buffering element for the NEXT track.
        iOS Safari caches media from same-origin <audio src> references, so
        when this URL becomes the main src (via onEnded → nextTrack), the
        file is already in the cache → no fetch delay → no "big hole". */}
    {nextSrc && (
      <audio
        src={nextSrc}
        preload="auto"
        muted
        // @ts-ignore
        playsInline
        aria-hidden="true"
        style={{ display: 'none' }}
      />
    )}
    </>
  );
}