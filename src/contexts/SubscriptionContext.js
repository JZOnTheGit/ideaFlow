import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

export const SubscriptionContext = createContext();

export const useSubscriptionContext = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('No user logged in');
      return;
    }

    console.log('Setting up subscription listener for:', auth.currentUser.uid);
    const userRef = doc(db, 'users', auth.currentUser.uid);

    // Initialize user document if it doesn't exist
    const initializeUser = async () => {
      const docSnap = await getDoc(userRef);
      console.log('Current user document:', docSnap.exists() ? docSnap.data() : 'No document');

      if (!docSnap.exists() || !docSnap.data().limits) {
        console.log('Initializing user document with default limits');
        await setDoc(userRef, {
          email: auth.currentUser.email,
          subscription: 'free',
          limits: {
            pdfUploads: { used: 0, limit: 2 },
            websiteUploads: { used: 0, limit: 1 }
          },
          generationsPerUpload: 1
        }, { merge: true });
      }
    };

    initializeUser();

    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        console.log('Subscription data updated:', userData);
        setSubscription(userData);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    subscription,
    loading,
    checkUploadLimit: async (type) => {
      if (!subscription?.limits) return false;
      const limits = subscription.limits[`${type}Uploads`];
      return limits ? limits.used < limits.limit : false;
    }
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 