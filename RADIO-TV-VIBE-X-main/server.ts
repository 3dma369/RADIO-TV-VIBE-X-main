// @ts-ignore - TS might temporarily complain about default exports until IDE restarts
import express from 'express';
// @ts-ignore
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Stripe from 'stripe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const db = new Database('station.db');

// Stripe configuration - GET THIS FROM DASHBOARD.STRIPE.COM > DEVELOPERS > API KEYS
// Use STRIPE_SECRET_KEY from environment or .env file
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
});

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

// ============================================
// STRIPE PAYMENT ENDPOINTS
// ============================================

interface OrderItemData {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface ShippingAddressData {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { items, shippingAddress, userId, donorTier, discountPercent } = req.body as {
      items: OrderItemData[];
      shippingAddress: ShippingAddressData;
      userId: string;
      donorTier?: string;
      discountPercent?: number;
    };

    if (!items || items.length === 0) {
      res.status(400).json({ error: 'No items provided' });
      return;
    }

    // Calculate total
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discount = subtotal * ((discountPercent || 0) / 100);
    const total = subtotal - discount;

    // Create Stripe PaymentIntent (amount in cents)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId || 'anonymous',
        donorTier: donorTier || 'none',
        discountPercent: String(discountPercent || 0),
        itemCount: String(items.length),
        itemNames: items.map(i => i.name).join(', ').slice(0, 500), // Stripe metadata limit
      },
      description: `VIBE-X Store Order - ${items.length} item(s)`,
      receipt_email: undefined, // Will be set if user is authenticated
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      total: Math.round(total * 100),
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent' });
  }
});

app.get('/api/payment-intent/:id', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      currency: paymentIntent.currency,
    });
  } catch (error: any) {
    console.error('Error retrieving payment intent:', error);
    res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
});

// ============================================
// STRIPE WEBHOOK
// ============================================

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret || webhookSecret === 'whsec_placeholder_replace_with_webhook_signing_secret') {
    console.warn('Stripe webhook secret not configured — skipping verification');
    res.json({ received: true, warning: 'webhook secret not configured' });
    return;
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    res.status(400).json({ error: `Webhook Error: ${err.message}` });
    return;
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded':
      console.log('Payment succeeded:', (event.data.object as any).id);
      break;
    case 'payment_intent.payment_failed':
      console.error('Payment failed:', (event.data.object as any).id);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as any;
      console.log(`Subscription ${event.type}:`, sub.id, 'Status:', sub.status);
      break;
    }
    case 'invoice.payment_succeeded':
      console.log('Invoice payment succeeded');
      break;
    case 'invoice.payment_failed':
      console.error('Invoice payment failed');
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// STRIPE CUSTOMER & SUBSCRIPTION ENDPOINTS
// ============================================

app.post('/api/stripe/create-customer', async (req, res) => {
  try {
    const { email, name, metadata } = req.body;
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: metadata || {},
    });
    res.json({ customerId: customer.id, email: customer.email, name: customer.name });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/create-subscription', async (req, res) => {
  try {
    const { customerId, priceId, metadata } = req.body;
    if (!customerId || !priceId) {
      res.status(400).json({ error: 'customerId and priceId are required' });
      return;
    }
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: metadata || {},
    });
    const invoice = subscription.latest_invoice as any;
    const paymentIntent = invoice?.payment_intent;
    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stripe/subscription-status/:subscriptionId', async (req, res) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(req.params.subscriptionId);
    res.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });
  } catch (error: any) {
    console.error('Error retrieving subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/cancel-subscription', async (req, res) => {
  try {
    const { subscriptionId, cancelNow } = req.body;
    if (!subscriptionId) {
      res.status(400).json({ error: 'subscriptionId is required' });
      return;
    }
    const subscription = cancelNow
      ? await stripe.subscriptions.cancel(subscriptionId)
      : await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
    res.json({ subscriptionId: subscription.id, status: subscription.status, cancelAtPeriodEnd: subscription.cancel_at_period_end });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/stripe/create-portal-session', async (req, res) => {
  try {
    const { customerId } = req.body;
    if (!customerId) {
      res.status(400).json({ error: 'customerId is required' });
      return;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.FRONTEND_URL || 'http://localhost:5173',
    });
    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
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
