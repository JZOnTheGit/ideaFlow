import React, { useEffect, useState } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { auth } from '../firebase';
import { useSubscriptionContext } from '../contexts/SubscriptionContext';

const useSubscription = () => {
  const { setSubscription, setUsage } = useSubscriptionContext();
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

      } catch (error) {
        console.error('Error fetching subscription:', error);
      }
    };

    fetchSubscriptionData();
  }, [auth.currentUser, lastUpdate]);

  return {
    loading,
    subscription: setSubscription,
    usage: setUsage,
    plans: [],
    refreshSubscription,
  };
};

export default useSubscription; 