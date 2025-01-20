import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
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
        // Get the user's ID token
        const idToken = await auth.currentUser.getIdToken();
        
        // Fetch user data from your API endpoint
        const response = await fetch(`${process.env.REACT_APP_API_URL}/user/${auth.currentUser.uid}`, {
          headers: {
            'Authorization': `Bearer ${idToken}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }

        const userData = await response.json();
        console.log('Raw user data:', userData);

        setSubscription({
          status: userData.subscriptionStatus || 'inactive',
          plan: userData.plan || 'free',
          priceId: userData.priceId,
        });

        setUsage({
          pdfUploads: {
            used: parseInt(userData.pdfUploadsUsed || 0),
            limit: parseInt(userData.pdfUploadsLimit || 2),
          },
          websiteUploads: {
            used: parseInt(userData.websiteUploadsUsed || 0),
            limit: parseInt(userData.websiteUploadsLimit || 1),
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