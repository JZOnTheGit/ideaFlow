import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSubscription } from '../contexts/SubscriptionContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/firebase';
import { auth } from '../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || '', {
  stripeAccount: process.env.REACT_APP_STRIPE_ACCOUNT_ID,
  apiVersion: '2020-08-27',
  locale: 'en',
});

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PlansContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  margin-top: 2rem;
`;

const PlanCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 2rem;
  border: 2px solid ${props => props.$active ? '#c49952' : 'rgba(196, 153, 82, 0.3)'};
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    border-color: #c49952;
  }
`;

const PlanTitle = styled.h2`
  color: #c49952;
  font-size: 1.8rem;
  margin-bottom: 1rem;
`;

const PlanPrice = styled.div`
  font-size: 2.5rem;
  color: #ffffff;
  margin-bottom: 2rem;

  span {
    font-size: 1rem;
    opacity: 0.7;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin-bottom: 2rem;
`;

const Feature = styled.li`
  color: #ffffff;
  margin-bottom: 0.8rem;
  display: flex;
  align-items: center;

  &:before {
    content: "✓";
    color: #c49952;
    margin-right: 0.5rem;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${props => props.$secondary ? 'transparent' : '#c49952'};
  color: ${props => props.$secondary ? '#c49952' : 'black'};
  border: 2px solid #c49952;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$secondary ? 'rgba(196, 153, 82, 0.1)' : '#b38a43'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UsageSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  padding: 2rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
`;

const UsageBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

const UsageTitle = styled.h3`
  color: #c49952;
  margin-bottom: 1.5rem;
`;

const UsageBar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  height: 20px;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const UsageProgress = styled.div`
  background: #c49952;
  height: 100%;
  width: ${props => props.$percentage}%;
  transition: width 0.3s ease;
`;

const UsageText = styled.p`
  color: #ffffff;
  margin-bottom: 1.5rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #1a1a1a;
  padding: 2rem;
  border-radius: 10px;
  max-width: 400px;
  width: 90%;
  text-align: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid #c49952;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.div`
  color: #ffffff;
  font-size: 1.1rem;
`;

const CouponInput = styled.input`
  width: 100%;
  padding: 12px;
  margin: 10px 0;
  border: 1px solid rgba(196, 153, 82, 0.3);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: #ffffff;
  font-size: 14px;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #c49952;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CouponText = styled.p`
  color: #c49952;
  font-size: 12px;
  margin: 5px 0 15px;
  text-align: center;
`;

const Subscription = () => {
  const { subscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  // Check both subscription status and subscriptionStatus from Stripe
  const isProActive = (subscription?.status === 'pro' || 
                      subscription?.subscriptionStatus === 'active') && 
                      subscription?.isActive;

  useEffect(() => {
    if (subscription) {
      console.log('Current subscription state:', subscription);
      setIsLoading(false);
    }
  }, [subscription]);

  useEffect(() => {
    // Verify Stripe key is available
    if (!process.env.REACT_APP_STRIPE_PUBLIC_KEY) {
      console.error('Stripe public key is missing');
      setError('Stripe configuration is missing');
    }
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const success = queryParams.get('success');
    const sessionId = queryParams.get('session_id');

    if (success && sessionId) {
      console.log('Payment successful, verifying session:', sessionId);
      const verifySession = async () => {
        try {
          const response = await fetch(
            `${process.env.REACT_APP_API_URL}/verify-session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await currentUser.getIdToken()}`
              },
              body: JSON.stringify({
                sessionId,
                userId: currentUser.uid
              })
            }
          );

          if (response.ok) {
            window.history.replaceState({}, '', '/dashboard/subscription');
          } else {
            throw new Error('Failed to verify session');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
          setError('Failed to verify subscription. Please contact support.');
        }
      };

      verifySession();
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchUsage = async () => {
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            console.log('Fetched user data:', userData); // Debug log
            
            // Set default limits if not present
            const defaultLimits = {
              pdfUploads: { used: 0, limit: 2 },
              websiteUploads: { used: 0, limit: 1 }
            };
            
            // Ensure the database has the correct structure
            if (!userData.limits) {
              await setDoc(userRef, {
                limits: defaultLimits,
                generationsPerUpload: userData.subscription === 'pro' ? 3 : 1
              }, { merge: true });
            }
          } else {
            console.log('No user document found, creating one with default limits');
            // Create new user document with default limits
            await setDoc(userRef, {
              email: currentUser.email,
              subscription: 'free',
              createdAt: new Date(),
              limits: {
                pdfUploads: { used: 0, limit: 2 },
                websiteUploads: { used: 0, limit: 1 }
              },
              generationsPerUpload: 1,
              stripeCustomerId: null,
              stripeSubscriptionId: null
            });
          }
        } catch (error) {
          console.error('Error fetching usage:', error);
          setError('Failed to fetch usage data');
        }
      }
    };
    fetchUsage();
  }, [currentUser]);

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: '/dashboard/subscription' }} />;
  }

  if (isLoading) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading subscription data...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <div style={{ color: 'red' }}>Error: {error}</div>
      </Container>
    );
  }

  const handleSubscribe = async (priceId) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!currentUser) {
        throw new Error('Please sign in to upgrade');
      }

      const idToken = await currentUser.getIdToken(true);
      
      const checkoutUrl = 'https://idea-flow-server.vercel.app/create-checkout-session';
      
      const requestBody = {
        priceId,
        email: currentUser.email,
        successUrl: `${window.location.origin}/dashboard/subscription?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/subscription?canceled=true`,
        allow_promotion_codes: true // This is the parameter Stripe expects
      };

      const response = await fetch(checkoutUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Server response:', errorData);
        throw new Error(errorData || 'Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setLoading(true);
      
      await fetch(`${process.env.REACT_APP_API_URL}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userId: currentUser.uid,
        }),
      });

      // Wait a moment for Firestore to update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh the page to show new limits
      window.location.href = '/dashboard/subscription';

      setShowCancelModal(false);
    } catch (error) {
      console.error('Cancel subscription error:', error);
      setError('Failed to cancel subscription. Please try again.');
      setLoading(false);
    }
  };

  const calculateUsagePercentage = (used, limit) => {
    return Math.min((used / limit) * 100, 100);
  };

  return (
    <Container>
      <UsageSection>
        <UsageTitle style={{ gridColumn: '1 / -1' }}>Current Usage</UsageTitle>
        
        <UsageBlock>
          <UsageText>PDF Uploads</UsageText>
          <UsageBar>
            <UsageProgress 
              $percentage={calculateUsagePercentage(
                subscription?.pdfUploads?.used ?? 0,
                subscription?.pdfUploads?.limit ?? (isProActive ? 80 : 2)
              )} 
            />
          </UsageBar>
          <UsageText>
            {subscription?.pdfUploads?.used ?? 0} / {subscription?.pdfUploads?.limit ?? (isProActive ? 80 : 2)} uploads used
          </UsageText>
        </UsageBlock>
        
        <UsageBlock>
          <UsageText>Website Links</UsageText>
          <UsageBar>
            <UsageProgress 
              $percentage={calculateUsagePercentage(
                subscription?.websiteUploads?.used ?? 0,
                subscription?.websiteUploads?.limit ?? 1
              )} 
            />
          </UsageBar>
          <UsageText>
            {subscription?.websiteUploads?.used ?? 0} / {subscription?.websiteUploads?.limit ?? 1} links used
          </UsageText>
        </UsageBlock>
      </UsageSection>

      <PlansContainer>
        {Object.values(plans).map((plan) => (
          <PlanCard key={plan.id} $active={isProActive && plan.id === 'pro'}>
            <PlanTitle>{plan.name}</PlanTitle>
            <PlanPrice>
              £{plan.price}<span>/month</span>
            </PlanPrice>
            <FeaturesList>
              {plan.features.map((feature, index) => (
                <Feature key={index}>{feature}</Feature>
              ))}
            </FeaturesList>
            {plan.id === 'pro' && (
              <>
                {isProActive ? (
                  <Button 
                    $secondary 
                    onClick={() => setShowCancelModal(true)}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleSubscribe(process.env.REACT_APP_STRIPE_PRICE_ID)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Upgrade Now'}
                  </Button>
                )}
              </>
            )}
          </PlanCard>
        ))}
      </PlansContainer>

      {showCancelModal && (
        <Modal onClick={() => setShowCancelModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <h2>Cancel Subscription</h2>
            <p>Are you sure you want to cancel your subscription? You'll lose access to pro features.</p>
            <Button 
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Yes, Cancel'}
            </Button>
            <Button 
              $secondary
              onClick={() => setShowCancelModal(false)}
              style={{ marginTop: '1rem' }}
            >
              No, Keep Subscription
            </Button>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

export default function StripeWrapper() {
  const { currentUser } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  if (!authChecked) {
    return (
      <Container>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Checking authentication...</LoadingText>
        </LoadingContainer>
      </Container>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: '/dashboard/subscription' }} />;
  }

  return (
    <Elements stripe={stripePromise}>
      <Subscription />
    </Elements>
  );
} 