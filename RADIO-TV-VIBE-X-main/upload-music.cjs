const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const path = require('path');
const fs = require('fs');

const firebaseConfig = {
  apiKey: "AIzaSyC0cz4RkKF4m3FD0P6n9skA8jCUJroVLdc",
  authDomain: "vibe-x-app.web.app",
  projectId: "vibe-x-app",
  storageBucket: "vibe-x-app.firebasestorage.app",
  messagingSenderId: "426023723852",
  appId: "1:426023723852:web:d230ae1574bdae0847a5e9",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const musicDir = path.join(__dirname, 'public', 'music_mp3');
const files = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp3'));

async function uploadFile(file) {
  const filePath = path.join(musicDir, file);
  const storagePath = `music_mp3/${file}`;
  const fileRef = ref(storage, storagePath);
  
  const data = fs.readFileSync(filePath);
  await uploadBytes(fileRef, data, { contentType: 'audio/mpeg' });
  const url = await getDownloadURL(fileRef);
  
  return { file, url };
}

async function run() {
  console.log(`Starting upload of ${files.length} files...`);
  const start = Date.now();
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    try {
      const result = await uploadFile(file);
      console.log(`[${i+1}/${files.length}] ✅ ${file}`);
    } catch (err) {
      console.log(`[${i+1}/${files.length}] ❌ ${file}: ${err.message}`);
    }
  }
  
  console.log(`\nDone in ${Math.round((Date.now() - start)/1000)}s`);
}

run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});