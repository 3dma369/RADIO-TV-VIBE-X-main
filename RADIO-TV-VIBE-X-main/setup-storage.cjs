import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL, listAll } from 'firebase/storage';

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

const BUCKET_BASE = 'https://firebasestorage.googleapis.com/v0/b/vibe-x-app.firebasestorage.app/o/';

async function createPlaceholder(folder, filename) {
  const path = `${folder}/${filename}`;
  const storageRef = ref(storage, path);
  const contentType = filename.endsWith('.mp4') ? 'audio/mp4' :
                     filename.endsWith('.mp3') ? 'audio/mpeg' :
                     filename.endsWith('.png') ? 'image/png' :
                     filename.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream';
  const buf = Buffer.from('placeholder');
  try {
    await uploadBytes(storageRef, buf, { contentType });
    const url = BUCKET_BASE + encodeURIComponent(path) + '?alt=media';
    console.log(`  Created: ${path}`);
    return url;
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('conflict')) {
      console.log(`  Exists:  ${path}`);
      return BUCKET_BASE + encodeURIComponent(path) + '?alt=media';
    }
    console.error(`  Error:  ${path} — ${e.message}`);
    return null;
  }
}

async function main() {
  const folders = [
    { name: 'music', files: ['.placeholder'] },
    { name: 'visuals', files: ['.placeholder'] },
    { name: 'logos', files: ['.placeholder'] },
    { name: 'thumbnails', files: ['.placeholder'] },
    { name: 'ads', files: ['.placeholder'] },
    { name: 'banners', files: ['.placeholder'] },
  ];

  console.log('Creating storage folder structure...\n');
  for (const folder of folders) {
    console.log(`Folder: ${folder.name}/`);
    for (const file of folder.files) {
      await createPlaceholder(folder.name, file);
    }
  }

  console.log('\n✅ Storage structure ready at gs://vibe-x-app.firebasestorage.app/');
  console.log('Folders: music/, visuals/, logos/, thumbnails/, ads/, banners/');
}

main().catch(console.error);