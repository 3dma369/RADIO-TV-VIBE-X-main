import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

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

const MUSIC_DIR = '/Volumes/Data3/network/business/musi/';

const files = [
  'DJ Aphrodite - Rinsing Quince.mp4',
  'DJ Aphrodite - Stalker.mp4',
  'Degs - Levitate Your Mind.mp4',
  'JOY -404-.mp4',
  'London Elektricity - Tenderless.mp4',
  'M-Beat feat. Nazlyn - Sweet Love.mp4',
  'MASSIVE.mp4',
  'Mark Ruff Ryder feat MC Kie MC Sparks - Joy.mp4',
  'NuTone - One Day At A Time.mp4',
  'Ray Keith - Renegade vs Limb By Limb.mp4',
  'Shy FX - Badboy Business.mp4',
  'Tion Wayne - IFTK.mp4',
  'UK Apache with Shy FX - Original Nuttah 25.mp4',
  'Zed Bias - Pick Up The Pieces.mp4',
];

async function uploadMusicFile(filename) {
  const filePath = join(MUSIC_DIR, filename);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `music/${filename}`;
  const storageRef = ref(storage, storagePath);
  const contentType = filename.endsWith('.mp4') ? 'audio/mp4' : 'audio/mpeg';

  console.log(`  Uploading ${filename}...`);
  const snapshot = await uploadBytes(storageRef, fileBuffer, { contentType });
  const url = await getDownloadURL(snapshot.ref);
  console.log(`  ✅ ${url}`);
  return { filename, url };
}

async function main() {
  const results = [];
  for (const file of files) {
    try {
      const result = await uploadMusicFile(file);
      results.push(result);
    } catch (e) {
      console.error(`  ❌ Failed: ${file} - ${e.message}`);
    }
  }

  console.log('\n=== UPLOADED ===');
  results.forEach(r => console.log(`${r.filename}: ${r.url}`));
}

main().catch(console.error);