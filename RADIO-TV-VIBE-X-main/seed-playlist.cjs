const Database = require('better-sqlite3');
const db = new Database('/Users/333e/Projects/vibe-x/RADIO-TV-VIBE-X-main/station.db');

const tracks = [
  {id: 's1', title: 'Basstripper - In The City', artist: 'Basstripper', duration: '3:45', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/Basstripper - In The City.mp4'},
  {id: 's2', title: 'Cyantific - Dont Follow -feat. Diane Charlemagne', artist: 'Cyantific', duration: '4:00', genre: 'Liquid DnB', mood: 'relax', audioUrl: '/music/Cyantific - Dont Follow -feat. Diane Charlemagne.mp4'},
  {id: 's3', title: 'DJ Aphrodite - Rinsing Quince -Slider Mix-', artist: 'DJ Aphrodite', duration: '5:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/DJ Aphrodite - Rinsing Quince -Slider Mix-.mp4'},
  {id: 's4', title: 'DJ Aphrodite - Stalker -Original Mix-', artist: 'DJ Aphrodite', duration: '5:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/DJ Aphrodite - Stalker -Original Mix-.mp4'},
  {id: 's5', title: 'Degs - Levitate Your Mind -feat. Unglued-', artist: 'Degs', duration: '4:00', genre: 'Liquid DnB', mood: 'exercise', audioUrl: '/music/Degs - Levitate Your Mind -feat. Unglued-.mp4'},
  {id: 's6', title: 'Dillinja - Mystery - Deep Love', artist: 'Dillinja', duration: '4:15', genre: 'Liquid DnB', mood: 'chilling', audioUrl: '/music/Dillinja - Mystery - Deep Love.mp4'},
  {id: 's7', title: 'JOY -404-', artist: 'JOY', duration: '4:00', genre: 'UK Drill', mood: 'getting-ready', audioUrl: '/music/JOY -404-.mp4'},
  {id: 's8', title: 'Jungliss', artist: 'Unknown', duration: '3:30', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/Jungliss.mp4'},
  {id: 's9', title: 'London Elektricity - Tenderless -feat. Emer Dineen- -Whiney Remix-', artist: 'London Elektricity', duration: '5:00', genre: 'Liquid DnB', mood: 'relax', audioUrl: '/music/London Elektricity - Tenderless -feat. Emer Dineen- -Whiney Remix-.mp4'},
  {id: 's10', title: 'M-Beat feat. Nazlyn - Sweet Love', artist: 'M-Beat feat. Nazlyn', duration: '4:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/M-Beat feat. Nazlyn - Sweet Love.mp4'},
  {id: 's11', title: 'MASSIVE', artist: 'Unknown', duration: '3:20', genre: 'Jungle', mood: 'exercise', audioUrl: '/music/MASSIVE.mp4'},
  {id: 's12', title: 'Mark Ruff Ryder feat MC Kie MC Sparks - Joy', artist: 'Mark Ruff Ryder feat MC Kie MC Sparks', duration: '4:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/Mark Ruff Ryder feat MC Kie MC Sparks - Joy.mp4'},
  {id: 's13', title: 'NuTone - One Day At A Time -feat. Lalin St. Juste- -Official Video-', artist: 'NuTone', duration: '4:00', genre: 'Liquid DnB', mood: 'relax', audioUrl: '/music/NuTone - One Day At A Time -feat. Lalin St. Juste- Official Video.mp4'},
  {id: 's14', title: 'P Money x Whiney - Sorry I-m Not Sorry', artist: 'P Money x Whiney', duration: '3:30', genre: 'Jungle', mood: 'getting-ready', audioUrl: '/music/P Money x Whiney - Sorry I-m Not Sorry.mp4'},
  {id: 's15', title: 'Ray Keith - Renegade vs Limb By Limb -Aries Remix-', artist: 'Ray Keith', duration: '5:00', genre: 'Jungle', mood: 'exercise', audioUrl: '/music/Ray Keith - Renegade vs Limb By Limb -Aries Remix-.mp4'},
  {id: 's16', title: 'Shy FX - Badboy Business -ft. Kate Stewart - Mr. Williamz-', artist: 'Shy FX', duration: '4:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/Shy FX - Badboy Business -ft. Kate Stewart - Mr. Williamz-.mp4'},
  {id: 's17', title: 'Tion Wayne - IFTK -Feat. La Roux- -Vibe Chemistry', artist: 'Tion Wayne', duration: '3:00', genre: 'UK Drill', mood: 'getting-ready', audioUrl: '/music/Tion Wayne - IFTK -Feat. La Roux- -Vibe Chemistry.mp4'},
  {id: 's18', title: 'UK Apache with Shy FX - Original Nuttah 25 -Chase - Status Remix ft. Irah-', artist: 'UK Apache with Shy FX', duration: '4:00', genre: 'Jungle', mood: 'exercise', audioUrl: '/music/UK Apache with Shy FX - Original Nuttah 25 -Chase - Status Remix ft. Irah-.mp4'},
  {id: 's19', title: 'Whiney - Back In Action -feat. Slay-', artist: 'Whiney feat. Slay', duration: '3:30', genre: 'Liquid DnB', mood: 'getting-ready', audioUrl: '/music/Whiney - Back In Action -feat. Slay-.mp4'},
  {id: 's20', title: 'Zed Bias - Pick Up The Pieces -ft. Boudah- -Skeptical Remix-', artist: 'Zed Bias ft. Boudah', duration: '3:00', genre: 'Jungle', mood: 'chilling', audioUrl: '/music/Zed Bias - Pick Up The Pieces -ft. Boudah- -Skeptical Remix-.mp4'},
];

const deleteAll = db.prepare('DELETE FROM playlist');
const insert = db.prepare('INSERT OR REPLACE INTO playlist (id, title, artist, duration, genre, videoUrl, audioUrl, visualUrl) VALUES (@id, @title, @artist, @duration, @genre, NULL, @audioUrl, NULL)');

db.transaction(() => {
  deleteAll.run();
  for (const t of tracks) {
    insert.run(t);
  }
})();

console.log('Seeded:', db.prepare('SELECT COUNT(*) as c FROM playlist').get().c, 'tracks');
console.log('Sample:', db.prepare('SELECT * FROM playlist LIMIT 2').all().map(t => t.title));