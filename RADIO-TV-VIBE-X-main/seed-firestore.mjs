import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, setDoc, doc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, listAll } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC0cz4RkKF4m3FD0P6n9skA8jCUJroVLdc",
  authDomain: "vibe-x-app.web.app",
  projectId: "vibe-x-app",
  storageBucket: "vibe-x-app.firebasestorage.app",
  messagingSenderId: "426023723852",
  appId: "1:426023723852:web:d230ae1574bdae0847a5e9",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BUCKET = 'https://firebasestorage.googleapis.com/v0/b/vibe-x-app.firebasestorage.app/o';
const STORAGE = getStorage(app);

// 20 tracks from station.db mapped to Firebase Storage URLs
const TRACKS = [
  { id: 's1', title: 'Basstripper - In The City', artist: 'Basstripper', duration: '3:45', genre: 'Jungle', mood: 'chilling', audioUrl: `${BUCKET}/music/Basstripper%20-%20In%20The%20City.mp4?alt=media` },
  { id: 's2', title: 'Cyantific - Dont Follow', artist: 'Cyantific', duration: '4:00', genre: 'Liquid DnB', mood: 'relax', audioUrl: `${BUCKET}/music/Cyantific%20-%20Dont%20Follow%20-feat.%20Diane%20Charlemagne.mp4?alt=media` },
  { id: 's3', title: 'DJ Aphrodite - Rinsing Quince', artist: 'DJ Aphrodite', duration: '5:20', genre: 'Jungle', mood: 'exercise', audioUrl: `${BUCKET}/music/DJ%20Aphrodite%20-%20Rinsing%20Quince%20-Slider%20Mix-.mp4?alt=media` },
  { id: 's4', title: 'DJ Aphrodite - Stalker', artist: 'DJ Aphrodite', duration: '5:45', genre: 'Jungle', mood: 'getting-ready', audioUrl: `${BUCKET}/music/DJ%20Aphrodite%20-%20Stalker%20-Original%20Mix-.mp4?alt=media` },
  { id: 's5', title: 'Degs - Levitate Your Mind', artist: 'Degs', duration: '4:30', genre: 'Liquid DnB', mood: 'relax', audioUrl: `${BUCKET}/music/Degs%20-%20Levitate%20Your%20Mind%20-feat.%20Unglued-.mp4?alt=media` },
  { id: 's6', title: 'Dillinja - Mystery (Deep Love)', artist: 'Dillinja', duration: '6:10', genre: 'Jungle', mood: 'chilling', audioUrl: `${BUCKET}/music/Dillinja%20-%20Mystery%20-%20Deep%20Love.mp4?alt=media` },
  { id: 's7', title: 'JOY -404-', artist: 'JOY', duration: '3:20', genre: 'UK Drill', mood: 'getting-ready', audioUrl: `${BUCKET}/music/JOY%20-404-.mp4?alt=media` },
  { id: 's8', title: 'Jungliss', artist: 'Unknown', duration: '3:45', genre: 'Jungle', mood: 'chilling', audioUrl: `${BUCKET}/music/Jungliss.mp4?alt=media` },
  { id: 's9', title: 'London Elektricity - Tenderless', artist: 'London Elektricity', duration: '5:55', genre: 'Liquid DnB', mood: 'relax', audioUrl: `${BUCKET}/music/London%20Elektricity%20-%20Tenderless%20-feat.%20Emer%20Dineen-%20-Whiney%20Remix-.mp4?alt=media` },
  { id: 's10', title: 'M-Beat feat. Nazlyn - Sweet Love', artist: 'M-Beat', duration: '4:15', genre: 'Jungle', mood: 'relax', audioUrl: `${BUCKET}/music/M-Beat%20feat.%20Nazlyn%20-%20Sweet%20Love.mp4?alt=media` },
  { id: 's11', title: 'MASSIVE', artist: 'Unknown', duration: '3:30', genre: 'Jungle', mood: 'exercise', audioUrl: `${BUCKET}/music/MASSIVE.mp4?alt=media` },
  { id: 's12', title: 'Mark Ruff Ryder - Joy', artist: 'Mark Ruff Ryder', duration: '4:40', genre: 'Jungle', mood: 'chilling', audioUrl: `${BUCKET}/music/Mark%20Ruff%20Ryder%20feat%20MC%20Kie%20MC%20Sparks%20-%20Joy.mp4?alt=media` },
  { id: 's13', title: 'NuTone - One Day At A Time', artist: 'NuTone', duration: '4:50', genre: 'Liquid DnB', mood: 'relax', audioUrl: `${BUCKET}/music/NuTone%20-%20One%20Day%20At%20A%20Time%20-feat.%20Lalin%20St.%20Juste-%20-Official%20Video-.mp4?alt=media` },
  { id: 's14', title: 'P Money x Whiney - Sorry I\'m Not Sorry', artist: 'P Money x Whiney', duration: '4:20', genre: 'Liquid DnB', mood: 'getting-ready', audioUrl: `${BUCKET}/music/P%20Money%20x%20Whiney%20-%20Sorry%20I-m%20Not%20Sorry.mp4?alt=media` },
  { id: 's15', title: 'Ray Keith - Renegade (Aries Remix)', artist: 'Ray Keith', duration: '5:30', genre: 'Jungle', mood: 'exercise', audioUrl: `${BUCKET}/music/Ray%20Keith%20-%20Renegade%20vs%20Limb%20By%20Limb%20-Aries%20Remix-.mp4?alt=media` },
  { id: 's16', title: 'Shy FX - Badboy Business', artist: 'Shy FX', duration: '4:55', genre: 'Jungle', mood: 'getting-ready', audioUrl: `${BUCKET}/music/Shy%20FX%20-%20Badboy%20Business%20-ft.%20Kate%20Stewart%20-%20Mr.%20Williamz-.mp4?alt=media` },
  { id: 's17', title: 'Tion Wayne - IFTK', artist: 'Tion Wayne', duration: '3:40', genre: 'UK Drill', mood: 'getting-ready', audioUrl: `${BUCKET}/music/Tion%20Wayne%20-%20IFTK%20-Feat.%20La%20Roux-%20-Vibe%20Chemistry.mp4?alt=media` },
  { id: 's18', title: 'UK Apache - Original Nuttah 25', artist: 'UK Apache', duration: '4:45', genre: 'Jungle', mood: 'exercise', audioUrl: `${BUCKET}/music/UK%20Apache%20with%20Shy%20FX%20-%20Original%20Nuttah%2025%20-Chase%20-%20Status%20Remix%20ft.%20Irah-.mp4?alt=media` },
  { id: 's19', title: 'Whiney - Back In Action', artist: 'Whiney', duration: '4:10', genre: 'Liquid DnB', mood: 'exercise', audioUrl: `${BUCKET}/music/Whiney%20-%20Back%20In%20Action%20-feat.%20Slay-.mp4?alt=media` },
  { id: 's20', title: 'Zed Bias - Pick Up The Pieces', artist: 'Zed Bias', duration: '5:00', genre: 'Jungle', mood: 'chilling', audioUrl: `${BUCKET}/music/Zed%20Bias%20-%20Pick%20Up%20The%20Pieces%20-ft.%20Boudah-%20-Skeptical%20Remix-.mp4?alt=media` },
];

const PRODUCTS = [
  { id: 'prod_merch_001', name: 'VIBE-X Tee', price: 29.99, image: 'https://picsum.photos/seed/vibex-tee/400/400', category: 'merch', description: 'Official VIBE-X t-shirt', stock: 50 },
  { id: 'prod_merch_002', name: 'VIBE-X Hoodie', price: 59.99, image: 'https://picsum.photos/seed/vibex-hoodie/400/400', category: 'merch', description: 'VIBE-X hoodie - jungle green', stock: 30 },
  { id: 'prod_ticket_001', name: 'VIBE-X Festival 2026', price: 49.99, image: 'https://picsum.photos/seed/vibexfest/400/400', category: 'ticket', description: 'VIP Access - All stages included', stock: 100, isTicket: true, eventDate: '2026-07-15' },
  { id: 'prod_ticket_002', name: 'VIBE-X Festival 2026 - General', price: 29.99, image: 'https://picsum.photos/seed/vibexfest2/400/400', category: 'ticket', description: 'General Admission', stock: 500, isTicket: true, eventDate: '2026-07-15' },
  { id: 'prod_music_001', name: 'Jungle Essentials Vol.1', price: 9.99, image: 'https://picsum.photos/seed/jungle1/400/400', category: 'digital', description: 'Digital Album - 15 tracks', stock: 999, isDigital: true },
  { id: 'prod_music_002', name: 'Jungle Essentials Vol.2', price: 9.99, image: 'https://picsum.photos/seed/jungle2/400/400', category: 'digital', description: 'Digital Album - 15 tracks', stock: 999, isDigital: true },
];

const DJS = [
  { id: 'dj_001', name: 'DJ Nexus', genre: 'Jungle/DnB', image: 'https://picsum.photos/seed/djnexus/200/200', bio: 'Jungle veteran since 1994', show: 'Jungle Rituals', schedule: 'Mon/Wed/Fri 8PM-12AM' },
  { id: 'dj_002', name: 'Liquid Luna', genre: 'Liquid DnB', image: 'https://picsum.photos/seed/liquidluna/200/200', bio: 'Smooth liquid vibes', show: 'Midnight Fluid', schedule: 'Tue/Thu 10PM-2AM' },
  { id: 'dj_003', name: 'Ruff Ryder', genre: 'UK Drum & Bass', image: 'https://picsum.photos/seed/ruffryder/200/200', bio: 'Hard-hitting beats', show: 'Ruff Ride', schedule: 'Sat/Sun 6PM-12AM' },
];

const SCHEDULE = [
  { id: 'sch_001', day: 'Monday', time: '8PM - 12AM', dj: 'DJ Nexus', genre: 'Jungle', title: 'Jungle Rituals' },
  { id: 'sch_002', day: 'Tuesday', time: '10PM - 2AM', dj: 'Liquid Luna', genre: 'Liquid DnB', title: 'Midnight Fluid' },
  { id: 'sch_003', day: 'Wednesday', time: '8PM - 12AM', dj: 'DJ Nexus', genre: 'Jungle', title: 'Jungle Rituals' },
  { id: 'sch_004', day: 'Thursday', time: '10PM - 2AM', dj: 'Liquid Luna', genre: 'Liquid DnB', title: 'Midnight Fluid' },
  { id: 'sch_005', day: 'Friday', time: '8PM - 12AM', dj: 'DJ Nexus', genre: 'Jungle', title: 'Jungle Rituals' },
  { id: 'sch_006', day: 'Saturday', time: '6PM - 12AM', dj: 'Ruff Ryder', genre: 'UK DnB', title: 'Ruff Ride' },
  { id: 'sch_007', day: 'Sunday', time: '6PM - 12AM', dj: 'Ruff Ryder', genre: 'UK DnB', title: 'Ruff Ride' },
];

async function clearAndSeed(collectionName, data) {
  const col = collection(db, collectionName);
  const existing = await getDocs(col);
  console.log(`Clearing ${collectionName} (${existing.size} docs)...`);
  for (const d of existing.docs) {
    await deleteDoc(doc(db, collectionName, d.id));
  }
  console.log(`Seeding ${data.length} docs to ${collectionName}...`);
  for (const item of data) {
    await setDoc(doc(db, collectionName, item.id), item);
  }
  console.log(`✅ ${collectionName}: ${data.length} docs seeded`);
}

async function main() {
  console.log('🔥 Seeding Firestore for VIBE-X...\n');
  
  await clearAndSeed('vibe_x_playlist', TRACKS);
  await clearAndSeed('vibe_x_products', PRODUCTS);
  await clearAndSeed('vibe_x_djs', DJS);
  await clearAndSeed('vibe_x_schedule', SCHEDULE);
  
  console.log('\n✅ ALL FIRESTORE DATA SEEDED');
  console.log('Playlist tracks:', TRACKS.length);
  console.log('Products:', PRODUCTS.length);
  console.log('DJs:', DJS.length);
  console.log('Schedule:', SCHEDULE.length);
}

main().catch(console.error);
