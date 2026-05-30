/**
 * firebase-shim.js — VIBE-X
 *
 * Redirects all firebase/* imports to the global `window.firebase` object
 * loaded from CDN in index.html.
 *
 * This eliminates the iOS Safari TDZ bug caused by Vite/esbuild incorrectly
 * ordering Firebase's internal ES module initialization.
 */

const _fb = typeof window !== 'undefined' ? window.firebase : null;

// ─── Core App ───────────────────────────────────────────────────────────────
export const app = _fb ? _fb.app() : null;
export const getApps = _fb ? _fb.getApps.bind(_fb) : () => [];
export function initializeApp(config) {
  if (_fb && _fb.initializeApp) return _fb.initializeApp(config);
  return app;
}

// ─── Services ─────────────────────────────────────────────────────────────
export function getAuth() { return _fb ? _fb.auth(app) : null; }
export function getFirestore() { return _fb ? _fb.firestore(app) : null; }
export function getDatabase() { return _fb ? _fb.database(app) : null; }
export function getStorage() { return _fb ? _fb.storage(app) : null; }

// ─── Auth ─────────────────────────────────────────────────────────────────
export const GoogleAuthProvider = _fb ? _fb.GoogleAuthProvider : function() {};
export function signInWithRedirect(auth, provider) {
  if (!_fb || !auth) return Promise.reject(new Error('Firebase not ready'));
  return auth.signInWithRedirect(provider);
}
export function signInWithPopup(auth, provider) {
  if (!_fb || !auth) return Promise.reject(new Error('Firebase not ready'));
  return auth.signInWithPopup(provider);
}
export function signOut(auth) {
  if (!auth) return Promise.reject(new Error('Firebase not ready'));
  return auth.signOut();
}
export function onAuthStateChanged(auth, cb) {
  if (!auth || !auth.onAuthStateChanged) return () => {};
  return auth.onAuthStateChanged(cb);
}
export function signInWithEmailAndPassword(auth, email, pass) {
  if (!auth || !auth.signInWithEmailAndPassword) return Promise.reject(new Error('Firebase not ready'));
  return auth.signInWithEmailAndPassword(email, pass);
}
export function createUserWithEmailAndPassword(auth, email, pass) {
  if (!auth || !auth.createUserWithEmailAndPassword) return Promise.reject(new Error('Firebase not ready'));
  return auth.createUserWithEmailAndPassword(email, pass);
}

// ─── Firestore ────────────────────────────────────────────────────────────
export function collection(db, path) {
  if (!db || !db.collection) return { id: path, add: async () => ({ id: 'mock' }) };
  return db.collection(path);
}
export function doc(db, path) {
  if (!db || !db.doc) return { id: path, set: async () => {}, update: async () => {}, add: async () => ({ id: 'mock' }) };
  return db.doc(path);
}
export async function addDoc(ref, data) {
  if (!ref || !ref.add) return { id: 'mock' };
  return ref.add(data);
}
export async function getDoc(ref) {
  if (!ref || !ref.get) return { id: 'mock', data: () => ({}), exists: () => false };
  return ref.get();
}
export async function getDocs(q) {
  if (!q || !q.get) return { docs: [] };
  return q.get();
}
export async function setDoc(ref, data) {
  if (!ref || !ref.set) return;
  return ref.set(data);
}
export async function updateDoc(ref, data) {
  if (!ref || !ref.update) return;
  return ref.update(data);
}
export function query(...args) { return args[0]; }
export function orderBy(field, dir) { return { field, dir }; }
export function where(field, op, val) { return { field, op, val }; }
export function limit(n) { return n; }
export function onSnapshot(...args) {
  const cb = typeof args[args.length - 1] === 'function' ? args.pop() : () => {};
  const ref = args[0];
  if (!ref || !ref.onSnapshot) return () => {};
  return ref.onSnapshot(cb);
}
export function serverTimestamp() {
  return _fb && _fb.firestore ? _fb.firestore.FieldValue.serverTimestamp() : () => new Date();
}

// ─── Realtime Database ────────────────────────────────────────────────────
export function ref(rtdb, path) {
  if (!rtdb || !rtdb.ref) return { path };
  return rtdb.ref(path);
}
export function onValue(r, cb) {
  if (!r || !r.on) return () => {};
  return r.on('value', cb);
}
export function set(r, val) {
  if (!r || !r.set) return Promise.resolve();
  return r.set(val);
}
export function remove(r) {
  if (!r || !r.remove) return Promise.resolve();
  return r.remove();
}
export async function get(r) {
  if (!r || !r.get) return null;
  return r.get();
}
export function onDisconnect(r) {
  if (!r || !r.onDisconnect) return { remove: () => {}, set: () => {} };
  return r.onDisconnect();
}

// ─── Storage ──────────────────────────────────────────────────────────────
export function storageRef(storage, path) {
  if (!storage || !storage.ref) return { path };
  return storage.ref(path);
}
export async function uploadBytes(ref, data) {
  if (!ref || !ref.put) return { ref };
  return ref.put(data);
}
export async function getDownloadURL(ref) {
  if (!ref || !ref.getDownloadURL) return '';
  return ref.getDownloadURL();
}

export default { app, getAuth, getFirestore, getDatabase, getStorage, initializeApp, getApps };