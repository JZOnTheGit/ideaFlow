require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});
const admin = require('firebase-admin');
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Verify Stripe key is loaded
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY is not set in environment variables');
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    console.log('Received checkout request:', req.body);
    console.log('Stripe Key available:', !!process.env.STRIPE_SECRET_KEY);
    const { userId, priceId, returnUrl } = req.body;
    
    console.log('Auth header:', req.headers.authorization);
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      client_reference_id: userId,
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cancel Subscription
app.post('/cancel-subscription', async (req, res) => {
  try {
    console.log('=== CANCEL SUBSCRIPTION PROCESS ===');
    const { userId } = req.body;
    console.log('User ID:', userId);
    
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);

    // Get user's subscription from Firestore
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscriptionId = userDoc.data()?.stripeSubscriptionId;
    
    if (!subscriptionId) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Immediately cancel the subscription
    await stripe.subscriptions.cancel(subscriptionId);

    // First, update the subscription status and Stripe IDs
    await userRef.update({
      subscription: 'free',
      stripeCustomerId: null,
      stripeSubscriptionId: null
    });

    // Then, force update the usage limits
    await userRef.update({
      'usage.pdfUploads.limit': 2,
      'usage.pdfUploads.used': 0,
      'usage.websiteUploads.limit': 1,
      'usage.websiteUploads.used': 0,
      'usage.generationsPerUpload': 1,
      'usage.generationsUsed': {}
    });

    // Verify the update was successful
    const updatedDoc = await userRef.get();
    console.log('Updated user data:', updatedDoc.data());

    res.json({ success: true });
  } catch (error) {
    console.error('Cancellation error details:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Handle Stripe webhook
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  console.log('=== WEBHOOK UPGRADE PROCESS ===');
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('Webhook event type:', event.type);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id;
    console.log('Webhook - User ID:', userId);

    // Get current user data before update
    const beforeDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    console.log('Webhook - User data before update:', beforeDoc.data());

    // Update user's subscription status in Firestore
    await admin.firestore()
      .collection('users')
      .doc(userId)
      .set({
        subscription: 'pro',
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription,
        usage: {
          pdfUploads: { used: 0, limit: 80 },
          websiteUploads: { used: 0, limit: 50 },
          generationsPerUpload: 3,
          generationsUsed: {}
        }
      });

    // Get user data after update
    const afterDoc = await admin.firestore()
      .collection('users')
      .doc(userId)
      .get();
    console.log('Webhook - User data after update:', afterDoc.data());
  }

  res.json({received: true});
});

app.post('/verify-session', async (req, res) => {
  try {
    console.log('=== VERIFY SESSION UPGRADE PROCESS ===');
    const { sessionId } = req.body;
    console.log('Session ID:', sessionId);
    
    // Verify Firebase Auth token
    const authHeader = req.headers.authorization;
    console.log('Auth header present:', !!authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const token = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(token);
    console.log('Auth token verified successfully');

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('Session payment status:', session.payment_status);
    
    if (session.payment_status === 'paid') {
      const userId = session.client_reference_id;
      console.log('Verify Session - User ID:', userId);

      // Get current user data before update
      const beforeDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      console.log('Verify Session - User data before update:', beforeDoc.data());

      await admin.firestore()
        .collection('users')
        .doc(session.client_reference_id)
        .set({
          subscription: 'pro',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
          usage: {
            pdfUploads: { used: 0, limit: 80 },
            websiteUploads: { used: 0, limit: 50 },
            generationsPerUpload: 3,
            generationsUsed: {}
          }
        });

      // Get user data after update
      const afterDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();
      console.log('Verify Session - User data after update:', afterDoc.data());

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }
  } catch (error) {
    console.error('Verify Session Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 