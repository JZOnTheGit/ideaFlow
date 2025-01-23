import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/firebase';
import { doc, onSnapshot, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

const SubscriptionContext = createContext();

export function useSubscription() {
  return useContext(SubscriptionContext);
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

  const plans = {
    free: {
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
    pro: {
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
  };

  useEffect(() => {
    let unsubscribe;

    const setupSubscriptionListener = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      // Initialize user limits if they don't exist
      const initializeUser = async () => {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists() || !docSnap.data().limits) {
          await setDoc(userRef, {
            limits: {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            },
            subscription: 'free'
          }, { merge: true });
        }
      };
      
      initializeUser();

      // Subscribe to user document changes
      unsubscribe = onSnapshot(
        doc(db, 'users', auth.currentUser.uid),
        (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setSubscription(data.subscription || 'free');
            setUsage(data.usage || {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 },
              generationsPerUpload: 1,
              generationsUsed: {}
            });
          } else {
            // Set default values for new users
            setSubscription('free');
            setUsage({
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 },
              generationsPerUpload: 1,
              generationsUsed: {}
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching subscription:', error);
          setLoading(false);
        }
      );
    };

    // Set up listener when auth state changes
    const authUnsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setupSubscriptionListener();
      } else {
        setSubscription('free');
        setUsage({
          pdfUploads: { used: 0, limit: 2 },
          websiteUploads: { used: 0, limit: 1 },
          generationsPerUpload: 1,
          generationsUsed: {}
        });
        setLoading(false);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const resetUsage = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        usage: {
          pdfUploads: { used: 0, limit: subscription === 'pro' ? 80 : 2 },
          websiteUploads: { used: 0, limit: subscription === 'pro' ? 50 : 1 },
          generationsPerUpload: subscription === 'pro' ? 3 : 1,
          generationsUsed: {}
        }
      }, { merge: true });
    } catch (error) {
      console.error('Error resetting usage:', error);
    }
  };

  // Check if user has reached their upload limit
  const checkUploadLimit = async (type) => {
    if (!auth.currentUser) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData || !userData.usage) return false;
      
      if (type === 'pdf') {
        return userData.usage.pdfUploads.used < userData.usage.pdfUploads.limit;
      } else if (type === 'website') {
        return userData.usage.websiteUploads.used < userData.usage.websiteUploads.limit;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking upload limit:', error);
      return false;
    }
  };

  // Check if user has reached their generation limit for a document
  const checkGenerationLimit = async (docId, type) => {
    if (!auth.currentUser) return false;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      
      if (!userData || !userData.usage) return false;
      
      // Get the number of generations used for this document and type
      const generationsUsed = userData.usage.generationsUsed?.[docId]?.[type] || 0;
      
      // Compare with the limit based on subscription
      return generationsUsed < userData.usage.generationsPerUpload;
    } catch (error) {
      console.error('Error checking generation limit:', error);
      return false;
    }
  };

  // Increment the upload counter
  const incrementUploadCount = async (type) => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      if (type === 'pdf') {
        await updateDoc(userRef, {
          'usage.pdfUploads.used': increment(1)
        });
      } else if (type === 'website') {
        await updateDoc(userRef, {
          'usage.websiteUploads.used': increment(1)
        });
      }
    } catch (error) {
      console.error('Error incrementing upload count:', error);
    }
  };

  // Track generation usage for a document
  const incrementUsage = async (docId, type) => {
    if (!auth.currentUser) return;
    
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const docRef = doc(db, 'pdf-contents', docId);
      
      // Update the generations tracking
      await updateDoc(userRef, {
        [`usage.generationsUsed.${docId}.${type}`]: increment(1)
      });
      
      // Mark the document as processed
      await updateDoc(docRef, {
        processed: true
      });
    } catch (error) {
      console.error('Error incrementing generation usage:', error);
    }
  };

  const value = {
    subscription,
    usage,
    setUsage,
    plans,
    loading,
    resetUsage,
    checkUploadLimit,
    incrementUploadCount,
    incrementUsage,
    checkGenerationLimit
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
} 