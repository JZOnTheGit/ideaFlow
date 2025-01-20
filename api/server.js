import { Router } from 'itty-router';
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
    // Handle CORS preflight first
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          ...corsHeaders,
          'Access-Control-Allow-Origin': 'https://ideaflow.uk',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

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

    // Initialize Firebase with all required config
    const firebaseConfig = {
      apiKey: env.FIREBASE_API_KEY,
      authDomain: `${env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: `${env.FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID,
      appId: env.FIREBASE_APP_ID,
      databaseURL: `https://${env.FIREBASE_PROJECT_ID}.firebaseio.com`
    };

    // Function to update Firestore document
    async function updateFirestore(env, userId, data) {
      const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${env.FIREBASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            subscriptionStatus: { stringValue: data.subscriptionStatus },
            subscriptionId: data.subscriptionId ? { stringValue: data.subscriptionId } : { nullValue: null },
            priceId: data.priceId ? { stringValue: data.priceId } : { nullValue: null },
            customerId: data.customerId ? { stringValue: data.customerId } : { nullValue: null },
            plan: { stringValue: data.plan },
            subscription: { stringValue: data.subscription },
            pdfUploadsUsed: { integerValue: 0 },
            pdfUploadsLimit: { integerValue: data.plan === 'pro' ? 80 : 2 },
            websiteUploadsUsed: { integerValue: 0 },
            websiteUploadsLimit: { integerValue: data.plan === 'pro' ? 50 : 1 },
            generationsPerUpload: { integerValue: data.plan === 'pro' ? 3 : 1 }
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to update Firestore: ${error}`);
      }

      return response.json();
    }

    // Route the request
    if (request.url.includes('/user/')) {
      // Extract user ID from URL
      const userId = request.url.split('/user/')[1];
      
      // Verify Firebase ID token
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
      
      try {
        // Fetch user data from Firestore
        const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${userId}`;
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${env.FIREBASE_ACCESS_TOKEN}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        
        const data = await response.json();
        
        // Transform Firestore response to simpler format
        const userData = {
          subscriptionStatus: data.fields?.subscriptionStatus?.stringValue || 'inactive',
          plan: data.fields?.plan?.stringValue || 'free',
          priceId: data.fields?.priceId?.stringValue,
          pdfUploadsUsed: parseInt(data.fields?.pdfUploadsUsed?.integerValue || '0'),
          pdfUploadsLimit: parseInt(data.fields?.pdfUploadsLimit?.integerValue || '2'),
          websiteUploadsUsed: parseInt(data.fields?.websiteUploadsUsed?.integerValue || '0'),
          websiteUploadsLimit: parseInt(data.fields?.websiteUploadsLimit?.integerValue || '1')
        };
        
        return new Response(JSON.stringify(userData), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    if (request.url.includes('/webhook')) {
      console.log('Handling webhook request');
      return handleWebhook(request, env, stripe);
    }

    if (request.url.includes('/create-checkout-session')) {
      try {
        const body = await request.json();
        console.log('Received request body:', body);

        if (!body.priceId) {
          return new Response(JSON.stringify({ error: 'Missing priceId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return handleCheckoutSession(body, stripe);
      } catch (error) {
        console.error('Error parsing request:', error);
        return new Response(JSON.stringify({ error: 'Invalid request body' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    if (request.url.includes('/verify-session')) {
      try {
        const { sessionId, userId } = await request.json();
        console.log('Verifying session:', { sessionId, userId });

        // Retrieve the session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log('Retrieved session:', session);

        if (session.payment_status === 'paid') {
          // Get subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          console.log('Retrieved subscription:', subscription);

          try {
            // Update user's subscription status using REST API
            await updateFirestore(env, userId, {
              subscriptionStatus: 'active',
              subscriptionId: session.subscription,
              priceId: subscription.items.data[0].price.id,
              customerId: session.customer,
              plan: 'pro',
              subscription: 'pro'
            });

            console.log('Successfully updated user subscription status');
            return new Response(JSON.stringify({ status: 'success' }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          } catch (error) {
            console.error('Error updating user subscription status:', error);
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
          }
        }

        return new Response(JSON.stringify({ error: 'Payment not completed' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      } catch (error) {
        console.error('Error in verify-session:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  }
};

// Stripe webhook endpoint
async function handleWebhook(request, env, stripe) {
  const sig = request.headers.get('stripe-signature');
  let event;

  try {
    event = await stripe.webhooks.constructEventAsync(
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
        
        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        
        // Update user's subscription status using REST API
        await updateFirestore(env, session.client_reference_id, {
          subscriptionStatus: 'active',
          subscriptionId: session.subscription,
          priceId: subscription.items.data[0].price.id,
          customerId: session.customer,
          plan: 'pro',
          subscription: 'pro'
        });
        
        console.log('Successfully updated user subscription in webhook');

        return new Response(JSON.stringify({ received: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      
      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        // Find user by subscription ID
        const listUrl = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users`;
        const listResponse = await fetch(`${listUrl}?pageSize=1&orderBy=subscriptionId&where.field=subscriptionId&where.op=EQUAL&where.value.stringValue=${canceledSubscription.id}`, {
          headers: {
            'Authorization': `Bearer ${env.FIREBASE_ACCESS_TOKEN}`
          }
        });
        
        const result = await listResponse.json();
        if (result.documents?.length > 0) {
          const userId = result.documents[0].name.split('/').pop();
          await updateFirestore(env, userId, {
            subscriptionStatus: 'cancelled',
            subscriptionId: null,
            priceId: null,
            plan: 'free',
            subscription: 'free'
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
async function handleCheckoutSession(body, stripe) {
  const { priceId, userId, email } = body;
  const origin = 'https://ideaflow.uk';  // Hardcode the origin since we know it
  
  try {
    console.log('Creating checkout session with:', { priceId, userId, email });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: 'https://ideaflow.uk/dashboard/subscription?success=true&session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ideaflow.uk/dashboard?canceled=true',
      client_reference_id: userId,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: email,
      metadata: {
        userId: userId
      }
    });

    console.log('Created session:', session);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
} 