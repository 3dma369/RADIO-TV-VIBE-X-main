const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyC0cz4RkKF4m3FD0P6n9skA8jCUJroVLdc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "vibe-x-app.web.app",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "vibe-x-app",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "vibe-x-app.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "426023723852",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:426023723852:web:d230ae1574bdae0847a5e9",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const musicDir = '/tmp/vibe_music/';
const files = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp4'));

async function uploadAll() {
  const results = [];
  for (const file of files) {
    const filePath = path.join(musicDir, file);
    const storagePath = `music/${file}`;
    const storageRef = ref(storage, storagePath);
    try {
      const chunk = fs.readFileSync(filePath);
      await uploadBytes(storageRef, chunk, { contentType: 'video/mp4' });
      const url = await getDownloadURL(storageRef);
      results.push({ file, url });
      console.log(`✓ ${file}`);
    } catch (e) {
      console.error(`✗ ${file}: ${e.message}`);
    }
  }
  console.log('\n=== URLS ===');
  results.forEach(r => console.log(`${r.file}: ${r.url}`));
}

uploadAll();
