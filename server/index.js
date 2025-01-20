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
  if (req.path === '/health') return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    await admin.auth().verifyIdToken(idToken);
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// Apply auth middleware to all routes except health check
app.use('/api', authMiddleware);

app.use(cors({
  origin: 'https://ideaflow.uk',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Get user data
app.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    res.json({
      subscriptionStatus: userData?.subscriptionStatus || 'inactive',
      plan: userData?.plan || 'free',
      priceId: userData?.priceId,
      pdfUploadsUsed: userData?.pdfUploadsUsed || 0,
      pdfUploadsLimit: userData?.pdfUploadsLimit || 2,
      websiteUploadsUsed: userData?.websiteUploadsUsed || 0,
      websiteUploadsLimit: userData?.websiteUploadsLimit || 1
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    // Verify Firebase token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    const { userId, email } = req.body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: process.env.STRIPE_PRICE_ID,
        quantity: 1,
      }],
      success_url: `${process.env.FRONTEND_URL}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/subscription?canceled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: {
        userId: userId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update Firestore with new subscription data
        await db.collection('users').doc(session.client_reference_id).update({
          subscriptionStatus: 'active',
          subscriptionId: session.subscription,
          priceId: subscription.items.data[0].price.id,
          customerId: session.customer,
          plan: 'pro',
          subscription: 'pro',
          pdfUploadsUsed: 0,
          pdfUploadsLimit: 80,
          websiteUploadsUsed: 0,
          websiteUploadsLimit: 50,
          generationsPerUpload: 3
        });
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        const snapshot = await db.collection('users')
          .where('subscriptionId', '==', canceledSubscription.id)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          await snapshot.docs[0].ref.update({
            subscriptionStatus: 'cancelled',
            subscriptionId: null,
            priceId: null,
            plan: 'free',
            subscription: 'free',
            pdfUploadsUsed: 0,
            pdfUploadsLimit: 2,
            websiteUploadsUsed: 0,
            websiteUploadsLimit: 1,
            generationsPerUpload: 1
          });
        }
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 