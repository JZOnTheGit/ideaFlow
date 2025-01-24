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

  useEffect(() => {
    if (!auth.currentUser) {
      // Reset subscription state when user logs out
      setSubscription({
        status: 'free',
        isActive: false,
        limits: {
          pdfUploads: { used: 0, limit: 2 },
          websiteUploads: { used: 0, limit: 1 }
        }
      });
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

        // Set up real-time listener
        unsubscribeRef.current = onSnapshot(userRef, (doc) => {
          if (!doc.exists() || !isMounted) return;

          const userData = doc.data();
          
          // Always use Firestore data for limits and status
          setSubscription({
            status: userData.subscription || 'free',
            isActive: userData.subscriptionStatus === 'active',
            limits: userData.limits || {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            },
            stripeCustomerId: userData.customerId,
            stripeSubscriptionId: userData.subscriptionId,
            subscriptionStatus: userData.subscriptionStatus
          });

          setLoading(false);
        }, (error) => {
          console.error('Firestore subscription error:', error);
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

  const checkUploadLimit = useCallback(async (type) => {
    if (!auth.currentUser) return false;
    
    // Always get fresh data from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) return false;
    
    const userData = docSnap.data();
    const limits = userData.limits || {
      pdfUploads: { used: 0, limit: 2 },
      websiteUploads: { used: 0, limit: 1 }
    };
    
    const uploadType = type === 'pdf' ? 'pdfUploads' : 'websiteUploads';
    return limits[uploadType].used < limits[uploadType].limit;
  }, []);

  const incrementUploadCount = useCallback(async (type) => {
    if (!auth.currentUser) return;
    
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const uploadType = type === 'pdf' ? 'pdfUploads' : 'websiteUploads';
    
    await updateDoc(userRef, {
      [`limits.${uploadType}.used`]: increment(1)
    });
  }, []);

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