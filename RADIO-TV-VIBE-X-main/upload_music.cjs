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

async function uploadFile(filePath) {
  const fileName = path.basename(filePath);
  const storagePath = `music/${fileName}`;
  const storageRef = ref(storage, storagePath);
  const fileBuffer = fs.readFileSync(filePath);
  await uploadBytes(storageRef, fileBuffer, { contentType: 'video/mp4' });
  const url = await getDownloadURL(storageRef);
  return { fileName, url };
}

async function main() {
  const musicDir = '/tmp/vibe_music/';
  const files = fs.readdirSync(musicDir).filter(f => f.endsWith('.mp4'));
  
  console.log(`Found ${files.length} files`);
  
  for (const file of files) {
    const filePath = path.join(musicDir, file);
    try {
      const result = await uploadFile(filePath);
      console.log(`SUCCESS: ${result.fileName}`);
      console.log(`URL: ${result.url}`);
    } catch (e) {
      console.error(`ERROR: ${file}: ${e.code || e.message}`);
      // Try with smaller chunk
      try {
        const stats = fs.statSync(filePath);
        console.log(`  File size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
      } catch(s) {}
    }
  }
}

main();
