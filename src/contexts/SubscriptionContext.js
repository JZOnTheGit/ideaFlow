import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [subscription, setSubscription] = useState('free');
  const [usage, setUsage] = useState({
    pdfUploads: { used: 0, limit: 2 },
    websiteUploads: { used: 0, limit: 1 },
    generationsPerUpload: 1,
    generationsUsed: {}
  });
  const [loading, setLoading] = useState(true);

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

  const refreshSubscription = () => {
    // Trigger a refresh of the subscription data
    const userRef = doc(db, 'users', auth.currentUser?.uid);
    getDoc(userRef).then((doc) => {
      if (doc.exists()) {
        setSubscription(doc.data().subscription);
        setUsage(doc.data().limits);
      }
    });
  };

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      setLoading(false);
      return;
    }

    console.log('Setting up subscription listener for:', auth.currentUser.uid);
    const userRef = doc(db, 'users', auth.currentUser.uid);

    // Initialize user document if it doesn't exist
    const initializeUser = async () => {
      try {
        const docSnap = await getDoc(userRef);
        console.log('Current user document:', docSnap.exists() ? docSnap.data() : 'No document');

        if (!docSnap.exists()) {
          console.log('Creating new user document with default limits');
          await setDoc(userRef, {
            email: auth.currentUser.email,
            subscription: 'free',
            limits: {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            },
            generationsPerUpload: 1
          });
        } else if (!docSnap.data().limits && docSnap.exists()) {
          console.log('Adding limits to existing user document');
          await setDoc(userRef, {
            limits: {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            }
          }, { merge: true });
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };

    // Only initialize once
    let initialized = false;
    if (!initialized) {
      initializeUser();
      initialized = true;
    }

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        console.log('Subscription data updated:', userData);
        // Only update if data has changed
        if (userData.subscription !== subscription) {
          setSubscription(userData.subscription);
        }
        if (JSON.stringify(userData.limits) !== JSON.stringify(usage)) {
          setUsage(userData.limits);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser?.uid]); // Only re-run if user ID changes

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
    usage,
    loading,
    plans,
    setUsage,
    refreshSubscription,
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