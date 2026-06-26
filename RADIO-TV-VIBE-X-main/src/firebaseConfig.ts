import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, User } from "firebase/auth";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Unsubscribe } from "firebase/firestore";
import { getDatabase, ref, onDisconnect, onValue, set, remove, get, serverTimestamp as rtdbTimestamp } from "firebase/database";
import { getStorage, ref as fbStorageRef, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, getMetadata, listAll } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "vibe-x-app.web.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "vibe-x-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "vibe-x-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "426023723852",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:426023723852:web:d230ae1574bdae0847a5e9",
};

// Use getApps() to prevent duplicate init — critical for bundled builds
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.useDeviceLanguage();
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const storage = getStorage(app);

export { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup };

// Firestore
export { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc };
export { app };
export type { Unsubscribe };

// RTDB
export const presenceRef = (sessionId: string) => ref(rtdb, `presence/${sessionId}`);
export const onlineCountRef = () => ref(rtdb, 'presence/online_count');
export { onDisconnect, onValue, set, remove, get, rtdbTimestamp };

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
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

// Storage helpers
export { ref as storageRefFn, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject, getMetadata, listAll };

export async function uploadToStorage(path: string, file: File, onProgress?: (pct: number) => void): Promise<string> {
  const sr = fbStorageRef(storage, path);
  const contentType = file.type || guessContentType(path);
  if (onProgress) {
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(sr, file, { contentType });
      task.on('state_changed',
        (snap) => onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
        (err) => reject(err),
        async () => {
          try { resolve(await getDownloadURL(task.snapshot.ref)); }
          catch (e) { reject(e); }
        }
      );
    });
  }
  await uploadBytes(sr, file, { contentType });
  const url = await getDownloadURL(sr);
  return url;
}

export async function deleteFromStorage(path: string): Promise<void> {
  await deleteObject(fbStorageRef(storage, path));
}

export async function listFolder(prefix: string): Promise<{ name: string; url: string; size: number; fullPath: string; updated: string }[]> {
  const sr = fbStorageRef(storage, prefix);
  const result = await listAll(sr);
  const items = await Promise.all(result.items.map(async (item) => {
    const url = await getDownloadURL(item);
    let size = 0;
    let updated = '';
    try {
      // getMetadata returns full metadata incl. size and updated time
      const meta = await getMetadata(item);
      size = Number(meta.size || 0);
      updated = meta.updated || '';
    } catch {}
    return { name: item.name, url, size, fullPath: item.fullPath, updated };
  }));
  return items;
}

export function sanitizePathSegment(input: string): string {
  const invalid = ['.', '#', '$', '[', ']'];
  return invalid.reduce((str, ch) => str.split(ch).join('_'), input)
    .replace(/\s+/g, '-').toLowerCase();
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg',
    aac: 'audio/aac', flac: 'audio/flac', mp4: 'video/mp4', webm: 'video/webm',
    mkv: 'video/x-matroska', mov: 'video/quicktime', avi: 'video/x-msvideo',
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
    webp: 'image/webp', svg: 'image/svg+xml',
  };
  return map[ext || ''] || 'application/octet-stream';
}

export type { User };