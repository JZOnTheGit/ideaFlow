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

    // Verify Stripe key exists
    if (!env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

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

    if (request.url.includes('/verify-session')) {
      return handleVerifySession(request, stripe, db);
    }

    return new Response('Not found', { status: 404 });
  }
};

// Verify session endpoint
async function handleVerifySession(request, stripe, db) {
  const { sessionId, userId } = await request.json();

  try {
    // Retrieve the session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === 'paid') {
      // Get subscription details
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Update user's subscription status in Firebase
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionId: session.subscription,
        priceId: subscription.items.data[0].price.id,
        customerId: session.customer,
        plan: 'pro',  // Set plan to pro
        limits: {
          pdfUploads: {
            used: 0,
            limit: 80  // Premium plan limit
          },
          websiteUploads: {
            used: 0,
            limit: 50  // Premium plan limit
          }
        }
      });

      console.log('Successfully updated user subscription status');
      return new Response(JSON.stringify({ status: 'success' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Payment not completed' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

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
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('Received webhook event:', event.type);

  try {
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session);
        
        // Update user's subscription status in Firebase
        const userRef = doc(db, 'users', session.client_reference_id);
        
        // Get the subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        await updateDoc(userRef, {
          subscriptionStatus: 'active',
          subscriptionId: session.subscription,
          priceId: subscription.items.data[0].price.id,
          customerId: session.customer,
          plan: 'pro',  // Set plan to pro
          limits: {
            pdfUploads: {
              used: 0,
              limit: 80  // Premium plan limit
            },
            websiteUploads: {
              used: 0,
              limit: 50  // Premium plan limit
            }
          }
        });
        console.log('Updated user document in Firestore');
        break;
      
      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        // Update user's subscription status when cancelled
        const q = query(collection(db, 'users'), where('subscriptionId', '==', canceledSubscription.id));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(userDoc.ref, {
            subscriptionStatus: 'cancelled',
            subscriptionId: null,
            priceId: null,
            plan: 'free',  // Reset plan to free
            limits: {
              pdfUploads: {
                used: 0,
                limit: 2  // Free plan limit
              },
              websiteUploads: {
                used: 0,
                limit: 1  // Free plan limit
              }
            }
          });
        }
        break;
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// Create checkout session endpoint
async function handleCheckoutSession(request, stripe) {
  const { priceId, userId, email } = await request.json();

  // Get origin or use default
  const origin = request.headers.get('Origin') || 'https://ideaflow.uk';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${origin}/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      client_reference_id: userId,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: email,
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