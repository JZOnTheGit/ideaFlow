import { Router } from 'itty-router';
import { initializeApp } from '@firebase/app';
import { getFirestore, collection, doc, updateDoc, query, where, getDocs } from '@firebase/firestore';
import Stripe from 'stripe';

const router = Router();

// Cors headers
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://ideaflow.uk',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Credentials': 'true'
};

// Create fetch handler
export default {
  async fetch(request, env, ctx) {
    // Log the request details
    console.log('Request URL:', request.url);
    console.log('Request method:', request.method);
    console.log('Request headers:', Object.fromEntries(request.headers));

    // Initialize Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY);

    // Initialize Firebase
    const firebaseConfig = {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Route the request
    if (request.url.includes('/webhook')) {
      return handleWebhook(request, env, stripe, db);
    }

    if (request.url.includes('/create-checkout-session')) {
      return handleCheckoutSession(request, stripe);
    }

    return new Response('Not found', { status: 404 });
  }
};

// Stripe webhook endpoint
async function handleWebhook(request, env, stripe, db) {
  const sig = request.headers.get('stripe-signature');
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      await request.text(),
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Update user's subscription status in Firebase
      const userRef = doc(db, 'users', session.client_reference_id);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionId: session.subscription,
        priceId: session.line_items?.data[0]?.price?.id
      });
      break;
    
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Update user's subscription status when cancelled
      const q = query(collection(db, 'users'), where('subscriptionId', '==', subscription.id));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          subscriptionStatus: 'cancelled',
          subscriptionId: null,
          priceId: null
        });
      }
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

// Create checkout session endpoint
async function handleCheckoutSession(request, stripe) {
  const { priceId, userId } = await request.json();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${request.headers.get('Origin')}/dashboard?success=true`,
      cancel_url: `${request.headers.get('Origin')}/dashboard?canceled=true`,
      client_reference_id: userId,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
} 