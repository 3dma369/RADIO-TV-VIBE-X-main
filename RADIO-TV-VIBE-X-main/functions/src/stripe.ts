import * as functions from 'firebase-functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

const PREMIUM_PRICE_ID = process.env.STRIPE_PREMIUM_PRICE_ID || '';

// ─────────────────────────────────────────────────────────────────────────────
// VIBE X: Premium Subscriptions ($4.99/mo)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /vibex-create-checkout-session
 * Creates Stripe Checkout for $4.99/mo premium subscription
 */
export const createPremiumCheckout = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const { customerId, customerEmail } = req.body;

    if (!PREMIUM_PRICE_ID) {
      return res.status(500).send({ error: 'STRIPE_PREMIUM_PRICE_ID not configured' });
    }

    const params: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PREMIUM_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL || 'https://vibe-x-app.web.app'}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://vibe-x-app.web.app'}/premium/canceled`,
    };

    if (customerId) params.customer = customerId;
    else if (customerEmail) params.customer_email = customerEmail;

    const session = await stripe.checkout.sessions.create(params);
    return res.status(200).send({ url: session.url, sessionId: session.id });
  } catch (err: any) {
    console.error('[createPremiumCheckout]', err.message);
    return res.status(500).send({ error: err.message });
  }
});

/**
 * POST /vibex-create-customer
 */
export const createCustomer = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const { email, name, userId } = req.body;
    if (!email) return res.status(400).send({ error: 'email is required' });

    const customer = await stripe.customers.create({
      email,
      name: name || undefined,
      metadata: { userId: userId || '', app: 'vibe-x' },
    });

    return res.status(200).send({ customerId: customer.id });
  } catch (err: any) {
    console.error('[createCustomer]', err.message);
    return res.status(500).send({ error: err.message });
  }
});

/**
 * POST /vibex-create-portal-session
 * Opens Stripe Customer Portal for billing management
 */
export const createPortalSession = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.body;
    if (!customerId) return res.status(400).send({ error: 'customerId is required' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: process.env.APP_URL || 'https://vibe-x-app.web.app',
    });

    return res.status(200).send({ url: session.url });
  } catch (err: any) {
    console.error('[createPortalSession]', err.message);
    return res.status(500).send({ error: err.message });
  }
});

/**
 * GET /vibex-subscription-status?customerId=cus_xxx
 */
export const getSubscriptionStatus = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  try {
    const { customerId } = req.query;
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).send({ error: 'customerId query param required' });
    }

    const subs = await stripe.subscriptions.list({ customer: customerId, status: 'active', limit: 1 });

    if (subs.data.length === 0) {
      return res.status(200).send({ subscribed: false, status: 'inactive' });
    }

    const sub = subs.data[0];
    return res.status(200).send({
      subscribed: true,
      status: sub.status,
      currentPeriodEnd: sub.current_period_end,
      subscriptionId: sub.id,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (err: any) {
    console.error('[getSubscriptionStatus]', err.message);
    return res.status(500).send({ error: err.message });
  }
});

/**
 * POST /vibex-webhook
 */
export const handleWebhook = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).send({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      console.log(`[Webhook] ${event.type}:`, event.data.object);
      break;
    default:
      console.log(`[Webhook] Unhandled: ${event.type}`);
  }

  return res.status(200).send({ received: true });
});