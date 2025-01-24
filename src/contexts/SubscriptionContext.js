import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

const SubscriptionContext = createContext();

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}

export { SubscriptionContext };

export function useSubscription() {
  return useSubscriptionContext();
}

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState({
    status: 'free',
    isActive: false,
    limits: {
      pdfUploads: { used: 0, limit: 2 },
      websiteUploads: { used: 0, limit: 1 }
    }
  });
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef();

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

  const initializeUser = useCallback(async () => {
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      await setDoc(userRef, {
        email: auth.currentUser.email,
        subscription: 'free',
        isActive: false,
        limits: {
          pdfUploads: { used: 0, limit: 2 },
          websiteUploads: { used: 0, limit: 1 }
        },
        generationsPerUpload: 1
      });
    }

    return userRef;
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const setupSubscription = async () => {
      try {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        
        if (!isMounted) return;

        // Clean up previous subscription if it exists
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }

        unsubscribeRef.current = onSnapshot(userRef, (doc) => {
          if (!doc.exists() || !isMounted) return;

          const userData = doc.data();
          // Determine if subscription is active based on subscriptionStatus
          const isActive = userData.subscriptionStatus === 'active' || 
                         userData.subscription === 'pro';
          
          // Set proper limits based on subscription status
          const limits = {
            pdfUploads: {
              used: userData.limits?.pdfUploads?.used || 0,
              limit: isActive ? 80 : 2
            },
            websiteUploads: {
              used: userData.limits?.websiteUploads?.used || 0,
              limit: isActive ? 50 : 1
            }
          };

          setSubscription(prev => ({
            status: userData.subscription || 'free',
            isActive: isActive,
            limits: limits,
            stripeCustomerId: userData.stripeCustomerId,
            stripeSubscriptionId: userData.stripeSubscriptionId,
            subscriptionStatus: userData.subscriptionStatus
          }));

          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up subscription:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [auth.currentUser?.uid]);

  const checkUploadLimit = async (type) => {
    if (!auth.currentUser) return false;
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      if (!userData?.limits) return false;
      const limits = userData.limits[`${type}Uploads`];
      return limits ? limits.used < limits.limit : false;
    } catch (error) {
      console.error('Error checking upload limit:', error);
      return false;
    }
  };

  const incrementUploadCount = async (type) => {
    if (!auth.currentUser) return;
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        [`limits.${type}Uploads.used`]: increment(1)
      });
    } catch (error) {
      console.error('Error incrementing upload count:', error);
    }
  };

  const checkGenerationLimit = async (docId) => {
    // Add your generation limit check logic here
    return true;
  };

  const incrementUsage = async (docId, type) => {
    // Add your usage increment logic here
  };

  const value = {
    subscription,
    loading,
    plans,
    checkUploadLimit,
    incrementUploadCount,
    checkGenerationLimit,
    incrementUsage
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
} 