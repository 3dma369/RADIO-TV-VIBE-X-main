const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL } = require('firebase/storage');
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

async function updatePlaylist() {
  const playlist = JSON.parse(fs.readFileSync('public/playlist.json', 'utf8'));
  const storageRef = ref(storage, 'music_mp3');
  const result = await listAll(storageRef);
  
  // Get download URLs for all files
  const urlMap = {};
  for (const item of result.items) {
    const url = await getDownloadURL(item);
    urlMap[item.name] = url;
  }
  
  // Update playlist with new URLs
  let updated = 0;
  for (const track of playlist) {
    const filename = track.audioUrl.split('/').pop();
    if (urlMap[filename]) {
      track.audioUrl = urlMap[filename];
      updated++;
      console.log(`✅ ${filename}`);
    } else {
      console.log(`❌ Not found: ${filename}`);
    }
  }
  
  // Save updated playlist
  fs.writeFileSync('public/playlist.json', JSON.stringify(playlist, null, 2));
  console.log(`\nUpdated ${updated}/${playlist.length} tracks`);
}

updatePlaylist().catch(console.error);