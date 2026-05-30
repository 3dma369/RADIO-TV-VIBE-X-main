const { initializeApp } = require('firebase/app');
const { getStorage, ref, listAll, getDownloadURL } = require('firebase/storage');

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

async function getUrls() {
  const storagePath = ref(storage, 'music_mp3');
  const result = await listAll(storagePath);
  
  const urls = [];
  for (const item of result.items) {
    const url = await getDownloadURL(item);
    urls.push({ name: item.name, url });
    console.log(`${item.name}|${url}`);
  }
}

getUrls().catch(console.error);