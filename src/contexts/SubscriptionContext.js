import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';
import { loadStripe } from '@stripe/stripe-js';

// Create the context
const SubscriptionContext = createContext({
  subscription: null,
  loading: true,
  checkUploadLimit: async () => {},
  checkRateLimit: async () => {},
  incrementUploadCount: async () => {},
});

// Custom hook to use the subscription context
export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      price: '0',
      features: [
        '2 PDF uploads per day',
        '1 website link per day',
        '1 generation per content type',
        'Basic features'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '15',
      features: [
        '80 PDF uploads per month',
        '50 website uploads per month',
        '3 generations per content type',
        'Priority support',
        'Advanced features'
      ]
    }
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);

    const unsubscribe = onSnapshot(userRef, async (doc) => {
      if (!doc.exists()) {
        // Initialize new user with free plan
        await setDoc(userRef, {
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          subscription: 'free',
          subscriptionStatus: 'inactive',
          limits: {
            pdfUploads: {
              used: 0,
              max: 3 // Free tier limit
            }
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        setSubscription(doc.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkUploadLimit = useCallback(async (type) => {
    if (!auth.currentUser) return false;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return false;

    const userData = userDoc.data();
    const isPro = userData.subscription === 'pro' && userData.subscriptionStatus === 'active';
    const limit = isPro ? 80 : 3; // Pro: 80, Free: 3
    const used = userData.limits?.pdfUploads?.used || 0;

    return used < limit;
  }, []);

  const incrementUploadCount = useCallback(async (type) => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, {
      'limits.pdfUploads.used': increment(1),
      updatedAt: serverTimestamp()
    });
  }, []);

  const checkGenerationLimit = useCallback(async (docId) => {
    if (!auth.currentUser) return false;
    
    try {
      // Get fresh data from Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) return false;
      
      const userData = docSnap.data();
      const generationLimits = userData.limits?.generations || { perDocument: 1, documents: {} };
      const docGenerations = generationLimits.documents[docId] || { used: 0 };
      
      return docGenerations.used < generationLimits.perDocument;
    } catch (error) {
      console.error('Error checking generation limit:', error);
      return false;
    }
  }, []);

  const incrementGenerationCount = useCallback(async (docId) => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Use a transaction to safely increment the counter
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(userRef);
        if (!docSnap.exists()) return;
        
        const userData = docSnap.data();
        const generationLimits = userData.limits?.generations || { perDocument: 1, documents: {} };
        const docGenerations = generationLimits.documents[docId] || { used: 0 };
        
        // Update the generation count
        transaction.update(userRef, {
          [`limits.generations.documents.${docId}.used`]: docGenerations.used + 1,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error incrementing generation count:', error);
      throw error;
    }
  }, []);

  const checkRateLimit = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error('User document does not exist');
      }

      const userData = userDoc.data();
      const lastGeneration = userData.lastGeneration?.toDate() || new Date(0);
      const now = new Date();
      const timeDiff = now - lastGeneration;
      const cooldown = userData.subscription === 'pro' ? 2000 : 3000; // 2s for pro, 3s for free

      if (timeDiff < cooldown) {
        throw new Error(`Please wait ${Math.ceil((cooldown - timeDiff) / 1000)} seconds before generating again`);
      }

      // Update last generation timestamp
      await updateDoc(userRef, {
        lastGeneration: serverTimestamp()
      });

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      throw error;
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!auth.currentUser) {
        throw new Error('You must be logged in to subscribe');
      }

      const response = await fetch('https://idea-flow-server.vercel.app/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
          email: auth.currentUser.email,
          priceId: process.env.REACT_APP_STRIPE_PRICE_ID,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/dashboard?canceled=true`
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      // Initialize Stripe
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      
      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      // Redirect to Checkout
      const { error } = await stripe.redirectToCheckout({
        sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    subscription,
    loading,
    plans,
    checkUploadLimit,
    incrementUploadCount,
    checkGenerationLimit,
    incrementGenerationCount,
    checkRateLimit,
    handleSubscribe
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Export the hook for using subscription
export function useSubscription() {
  return useSubscriptionContext();
} 