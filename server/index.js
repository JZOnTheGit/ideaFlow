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
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();

// Auth middleware for protected routes
const authMiddleware = async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Missing or invalid auth header:', authHeader);
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    console.log('Verifying token...');
    await admin.auth().verifyIdToken(idToken);
    console.log('Token verified successfully');
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Apply auth middleware to specific routes that need it
app.use('/create-checkout-session', authMiddleware);
app.use('/cancel-subscription', authMiddleware);

const corsOptions = {
  origin: 'https://ideaflow.uk',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Handle preflight requests
app.options('/create-checkout-session', cors(corsOptions));

// Handle actual requests
app.post('/create-checkout-session', cors(corsOptions), authMiddleware, async (req, res) => {
  try {
    const { priceId, userId, email, successUrl, cancelUrl } = req.body;
    
    console.log('Creating checkout session for:', { userId, email, priceId });

    if (!userId || !email || !priceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      customer_email: email,
      success_url: successUrl || `${process.env.FRONTEND_URL}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.FRONTEND_URL}/dashboard/subscription?canceled=true`,
      metadata: {
        userId: userId
      }
    });

    console.log('Checkout session created:', session.id);
    res.json({ url: session.url });
    
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook Error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received webhook event:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Handle successful payment
    try {
      await admin.firestore().collection('users').doc(session.client_reference_id).update({
        'subscription.status': 'active',
        'subscription.plan': 'pro',
        'subscription.stripeCustomerId': session.customer,
        'subscription.stripeSubscriptionId': session.subscription
      });
    } catch (error) {
      console.error('Error updating user subscription:', error);
    }
  }

  res.json({received: true});
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 