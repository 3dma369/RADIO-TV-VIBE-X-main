import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithRedirect, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDatabase, ref, onDisconnect, onValue, set, remove, get, serverTimestamp as rtdbTimestamp } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC0cz4RkKF4m3FD0P6n9skA8jCUJroVLdc",
  authDomain: "vibe-x-app.web.app",
  projectId: "vibe-x-app",
  storageBucket: "vibe-x-app.firebasestorage.app",
  messagingSenderId: "426023723852",
  appId: "1:426023723852:web:d230ae1574bdae0847a5e9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.useDeviceLanguage();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);
export { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithRedirect };

// Firestore exports for chat, playlist, products
export { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, setDoc, updateDoc };

// Realtime Database helpers for presence
export const presenceRef = (sessionId: string) => ref(rtdb, `presence/${sessionId}`);
export const onlineCountRef = () => ref(rtdb, 'presence/online_count');
export { onDisconnect, onValue, set, remove, get, rtdbTimestamp };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async () => {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    console.error("Error logging in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out", error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Firebase Storage helpers
export { ref, uploadBytes, getDownloadURL };

/**
 * Upload a file to Firebase Storage and return the public download URL.
 * @param path - Storage path, e.g. "music/track-title.mp3" or "visuals/cover.jpg"
 * @param file - The File object to upload
 * @returns The public download URL
 */
export async function uploadToStorage(path: string, file: File): Promise<string> {
  const storageRef = ref(storage, path);
  // Detect MIME type override for common types that browsers may misdetect
  const contentType = file.type || guessContentType(path);
  await uploadBytes(storageRef, file, { contentType });
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Sanitize a string into a safe Firebase Storage path segment.
 * Removes characters that are invalid in Storage paths.
 */
export function sanitizePathSegment(input: string): string {
  const invalid = ['.', '#', '$', '[', ']'];
  return invalid.reduce((str, ch) => str.split(ch).join('_'), input)
    .replace(/\s+/g, '-').toLowerCase();
}

/**
 * Guess content-type from file extension when browser can't detect it.
 */
function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mkv: 'video/x-matroska',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return map[ext || ''] || 'application/octet-stream';
}

export type { User };