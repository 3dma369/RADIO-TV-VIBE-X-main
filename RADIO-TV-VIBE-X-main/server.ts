// @ts-ignore - TS might temporarily complain about default exports until IDE restarts
import express from 'express';
// @ts-ignore
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const db = new Database('station.db');

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    image TEXT,
    category TEXT
  );

  CREATE TABLE IF NOT EXISTS djs (
    id TEXT PRIMARY KEY,
    name TEXT,
    bio TEXT,
    image TEXT,
    specialty TEXT,
    socials TEXT
  );

  CREATE TABLE IF NOT EXISTS schedule (
    id TEXT PRIMARY KEY,
    day TEXT,
    time TEXT,
    djId TEXT,
    showName TEXT
  );

  CREATE TABLE IF NOT EXISTS stream_source (
    id TEXT PRIMARY KEY,
    url TEXT,
    type TEXT,
    isActive INTEGER
  );

  CREATE TABLE IF NOT EXISTS playlist (
    id TEXT PRIMARY KEY,
    title TEXT,
    artist TEXT,
    duration TEXT,
    genre TEXT,
    videoUrl TEXT,
    audioUrl TEXT,
    visualUrl TEXT
  );

  CREATE TABLE IF NOT EXISTS donors (
    id TEXT PRIMARY KEY,
    walletAddress TEXT,
    name TEXT,
    discord TEXT,
    message TEXT,
    tier TEXT,
    amount REAL,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS crypto_wallets (
    id TEXT PRIMARY KEY,
    name TEXT,
    address TEXT,
    icon TEXT
  );

  INSERT OR IGNORE INTO crypto_wallets (id, name, address, icon) VALUES 
    ('eth', 'Ethereum / Polygon', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', 'ETH'),
    ('sol', 'Solana', '7xKX8C2n2P4G6X7Y8Z9A1B2C3D4E5F6G7H8I9J0K', 'SOL'),
    ('btc', 'Bitcoin', 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 'BTC');
`);

// API Routes
app.get('/api/products', (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

app.post('/api/products', (req, res) => {
  const products = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO products (id, name, price, image, category) VALUES (@id, @name, @price, @image, @category)');
  const deleteDb = db.prepare('DELETE FROM products');
  
  db.transaction(() => {
    deleteDb.run();
    for (const product of products) {
      insert.run(product);
    }
  })();
  res.json({ success: true });
});

app.get('/api/djs', (req, res) => {
  const djs = db.prepare('SELECT * FROM djs').all().map((dj: any) => ({
    ...dj,
    socials: JSON.parse(dj.socials || '{}')
  }));
  res.json(djs);
});

app.post('/api/djs', (req, res) => {
  const djs = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO djs (id, name, bio, image, specialty, socials) VALUES (@id, @name, @bio, @image, @specialty, @socials)');
  const deleteDb = db.prepare('DELETE FROM djs');
  
  db.transaction(() => {
    deleteDb.run();
    for (const dj of djs) {
      insert.run({ ...dj, socials: JSON.stringify(dj.socials) });
    }
  })();
  res.json({ success: true });
});

app.get('/api/schedule', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedule').all();
  res.json(schedule);
});

app.post('/api/schedule', (req, res) => {
  const schedule = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO schedule (id, day, time, djId, showName) VALUES (@id, @day, @time, @djId, @showName)');
  const deleteDb = db.prepare('DELETE FROM schedule');
  
  db.transaction(() => {
    deleteDb.run();
    for (const entry of schedule) {
      insert.run(entry);
    }
  })();
  res.json({ success: true });
});

app.get('/api/stream', (req, res) => {
  const stream = db.prepare('SELECT * FROM stream_source ORDER BY ROWID LIMIT 1').get() || { id: '1', url: '', type: 'video', isActive: 1 };
  res.json({ ...stream, isActive: stream.isActive === 1 });
});

app.post('/api/stream', (req, res) => {
  const stream = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO stream_source (id, url, type, isActive) VALUES (@id, @url, @type, @isActive)');
  const deleteDb = db.prepare('DELETE FROM stream_source');
  
  db.transaction(() => {
    deleteDb.run();
    insert.run({ ...stream, isActive: stream.isActive ? 1 : 0 });
  })();
  res.json({ success: true });
});

app.get('/api/playlist', (req, res) => {
  const playlist = db.prepare('SELECT * FROM playlist').all();
  res.json(playlist);
});

app.post('/api/playlist', (req, res) => {
  const playlist = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO playlist (id, title, artist, duration, genre, videoUrl, audioUrl, visualUrl) VALUES (@id, @title, @artist, @duration, @genre, @videoUrl, @audioUrl, @visualUrl)');
  const deleteDb = db.prepare('DELETE FROM playlist');
  
  db.transaction(() => {
    deleteDb.run();
    for (const track of playlist) {
      insert.run(track);
    }
  })();
  res.json({ success: true });
});

app.get('/api/donors', (req, res) => {
  const donors = db.prepare('SELECT * FROM donors ORDER BY timestamp DESC').all();
  res.json(donors);
});

app.post('/api/donors', (req, res) => {
  const donor = req.body;
  const insert = db.prepare('INSERT INTO donors (id, walletAddress, name, discord, message, tier, amount, timestamp) VALUES (@id, @walletAddress, @name, @discord, @message, @tier, @amount, @timestamp)');
  insert.run({
    id: Date.now().toString(),
    walletAddress: donor.walletAddress || '',
    name: donor.name || '',
    discord: donor.discord || '',
    message: donor.message || '',
    tier: donor.tier || '',
    amount: donor.amount || 0,
    timestamp: Date.now()
  });
  res.json({ success: true });
});

app.get('/api/wallets', (req, res) => {
  const wallets = db.prepare('SELECT * FROM crypto_wallets').all();
  res.json(wallets);
});

app.post('/api/wallets', (req, res) => {
  const wallets = req.body;
  const insert = db.prepare('INSERT OR REPLACE INTO crypto_wallets (id, name, address, icon) VALUES (@id, @name, @address, @icon)');
  
  db.transaction(() => {
    for (const wallet of wallets) {
      insert.run(wallet);
    }
  })();
  res.json({ success: true });
});

// Configure Vite or serve static files
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
