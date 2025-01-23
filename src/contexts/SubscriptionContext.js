import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  // Memoize the initializeUser function
  const initializeUser = useCallback(async (userRef) => {
    try {
      const docSnap = await getDoc(userRef);
      
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          email: auth.currentUser.email,
          subscription: 'free',
          limits: {
            pdfUploads: { used: 0, limit: 2 },
            websiteUploads: { used: 0, limit: 1 }
          },
          generationsPerUpload: 1
        });
        return;
      }
      
      const userData = docSnap.data();
      if (!userData.limits) {
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
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      setLoading(false);
      return;
    }

    console.log('Setting up subscription listener for:', auth.currentUser.uid);
    const userRef = doc(db, 'users', auth.currentUser.uid);

    // Initialize user data once
    initializeUser(userRef).then(() => {
      // Set up listener only after initialization
      let unsubscribe;
      unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          console.log('Subscription data updated:', userData);
          // Only update if data has changed
          setSubscription(prev => {
            if (prev !== userData.subscription) {
              return userData.subscription;
            }
            return prev;
          });
          
          setUsage(prev => {
            const newLimits = userData.limits || {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            };
            if (JSON.stringify(prev) !== JSON.stringify(newLimits)) {
              return newLimits;
            }
            return prev;
          });
        }
        setLoading(false);
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }, [auth.currentUser?.uid, initializeUser]);

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