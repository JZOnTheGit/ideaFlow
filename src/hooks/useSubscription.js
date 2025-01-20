import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const refreshSubscription = () => {
    setLastUpdate(Date.now());
  };

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!auth.currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        console.log('Fetched user data:', userData); // Debug log

        setSubscription({
          status: userData?.subscriptionStatus || 'inactive',
          plan: userData?.plan || 'free',
          priceId: userData?.priceId,
        });

        setUsage({
          pdfUploads: {
            used: userData?.limits?.pdfUploads?.used || 0,
            limit: userData?.limits?.pdfUploads?.limit || 2,
          },
          websiteUploads: {
            used: userData?.limits?.websiteUploads?.used || 0,
            limit: userData?.limits?.websiteUploads?.limit || 1,
          },
        });

        setLoading(false);

      } catch (error) {
        console.error('Error fetching subscription:', error);
        setLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [auth.currentUser, lastUpdate]);

  return {
    loading,
    subscription,
    usage,
    plans: [
      {
        name: 'Free Plan',
        price: '£0',
        features: [
          '2 PDF uploads per day',
          '1 website link per day',
          '1 generation per content type',
          'Basic features'
        ]
      },
      {
        name: 'Pro Plan',
        price: '£15',
        features: [
          '80 PDF uploads per month',
          '50 website uploads per month',
          '3 generations per content type',
          'Priority support',
          'Advanced features'
        ]
      }
    ],
    refreshSubscription,
  };
};

export default useSubscription; 