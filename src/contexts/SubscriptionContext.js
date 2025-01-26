import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, onSnapshot, getDoc, updateDoc, increment, runTransaction, serverTimestamp } from 'firebase/firestore';

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

export const SubscriptionProvider = ({ children }) => {
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

    const userRef = doc(db, 'users', auth.currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        // Subscription data updated
        const isProUser = userData.subscription === 'pro';
        
        setSubscription({
          status: userData.subscription || 'free',
          isActive: userData.subscriptionStatus === 'active',
          limits: {
            pdfUploads: {
              used: userData.limits?.pdfUploads?.used || 0,
              limit: isProUser ? 80 : 2
            },
            websiteUploads: {
              used: userData.limits?.websiteUploads?.used || 0,
              limit: isProUser ? 50 : 1
            }
          },
          stripeSubscriptionId: userData.stripeSubscriptionId,
          stripeCustomerId: userData.stripeCustomerId
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const checkUploadLimit = useCallback(async (type) => {
    if (!auth.currentUser) return false;
    
    // Always get fresh data from Firestore
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (!docSnap.exists()) return false;
    
    const userData = docSnap.data();
    const isProUser = userData.subscription === 'pro';
    const limits = {
      pdfUploads: {
        used: userData.limits?.pdfUploads?.used || 0,
        limit: isProUser ? 80 : 2
      },
      websiteUploads: {
        used: userData.limits?.websiteUploads?.used || 0,
        limit: isProUser ? 50 : 1
      }
    };
    
    // Check if user has reached their limit
    if (limits[type].used >= limits[type].limit) {
      return false;
    }
    return true;
  }, []);

  const incrementUploadCount = async (type) => {
    try {
      if (!auth.currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      // Get current user data
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) return;
      
      const userData = docSnap.data();
      const currentLimits = userData.limits || {};
      
      // Check if user has reached their limit before incrementing
      const isProUser = userData.subscription === 'pro';
      const limit = isProUser ? (type === 'pdfUploads' ? 80 : 50) : (type === 'pdfUploads' ? 2 : 1);
      const currentUsed = currentLimits[type]?.used || 0;
      
      if (currentUsed >= limit) {
        throw new Error(`Upload limit reached for ${type}`);
      }

      await updateDoc(userRef, {
        limits: {
          ...currentLimits,
          [type]: {
            used: currentUsed + 1,
            limit
          }
        }
      });

      // Update local state
      setSubscription(prev => ({
        ...prev,
        limits: {
          ...prev.limits,
          [type]: {
            ...prev.limits[type],
            used: prev.limits[type].used + 1
          }
        }
      }));
    } catch (error) {
      console.error('Error incrementing upload count:', error);
      throw error;
    }
  };

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
    incrementGenerationCount
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
} 