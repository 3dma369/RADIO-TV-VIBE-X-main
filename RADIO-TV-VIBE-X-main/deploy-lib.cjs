#!/usr/bin/env node
/**
 * Deploy via firebase-tools library (proper auth + flow).
 * Bypasses the `firebase deploy` CLI which hangs on Tailscale for this Mac.
 *
 * Pre-loads auth state by calling requireAuth with the account from
 * ~/.config/configstore/firebase-tools.json
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

// Load firebase-tools modules
const api = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/hosting/api.js');
const Uploader = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/deploy/hosting/uploader.js').Uploader;
const requireAuth = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/requireAuth.js');
const listFiles = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/listFiles.js').listFiles;

const DIST_DIR = path.resolve(process.argv[2] || './dist');
const PROJECT_ID = process.argv[3] || 'vibe-x-app';
const SITE_ID = process.argv[4] || 'vibe-x-app';
const CHANNEL = 'live';

function listDirFiles(dir) {
  // firebase-tools listFiles uses glob.sync, returns POSIX-style paths relative to cwd.
  // Also skip music files (served via Tailscale Funnel from local Mac server).
  return listFiles(dir, [
    '**/firebase-debug.log',
    '**/firebase-debug.*.log',
    'music_mp3/**',
    'music/**',
  ]).filter(f => !f.startsWith('music_mp3/') && !f.startsWith('music/'));
}

(async () => {
  // Pre-load auth state
  const cfgPath = path.join(os.homedir(), '.config/configstore/firebase-tools.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const account = { user: cfg.user, tokens: cfg.tokens };
  console.log('[deploy] initializing auth…');
  await requireAuth.requireAuth(account, true);
  console.log('[deploy]   auth OK');

  console.log('[deploy] creating version…');
  const versionName = await api.createVersion(SITE_ID, {});
  console.log(`[deploy]   ${versionName}`);

  console.log('[deploy] listing files…');
  const files = listDirFiles(DIST_DIR);
  console.log(`[deploy]   ${files.length} files`);

  console.log('[deploy] uploading files…');
  const uploader = new Uploader({
    version: versionName,
    files: files,
    cwd: DIST_DIR,
    projectRoot: DIST_DIR,
    public: DIST_DIR,
    hashConcurrency: 50,
    populateConcurrency: 10,
    uploadConcurrency: 50,
    gzipLevel: 9,
  });
  uploader.start();
  console.log(`[deploy]   waiting for upload queue…`);
  await uploader.wait();
  console.log('[deploy]   uploads complete');

  console.log('[deploy] finalizing version…');
  // PATCH status=FINALIZED with updateMask=status
  const versionId = versionName.split('/').pop();
  await api.updateVersion(SITE_ID, versionId, { status: 'FINALIZED' });
  console.log('[deploy]   FINALIZED');

  console.log('[deploy] releasing to channel…');
  const release = await api.createRelease(SITE_ID, CHANNEL, versionName, {});
  console.log(`[deploy] ✓ LIVE — release ${release.name}`);

  fs.writeFileSync('/tmp/vibex_last_deploy.txt',
    `${versionName}\nreleased=${release.name}\nat=${new Date().toISOString()}\n`);
})().catch(e => {
  console.error('[deploy] ERROR:', e.message || e);
  console.error(e.stack);
  process.exit(1);
});