import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSubscription } from '../contexts/SubscriptionContext';
import { loadStripe } from '@stripe/stripe-js';
import { auth } from '../firebase/firebase';
import { Elements } from '@stripe/react-stripe-js';

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

const Subscription = () => {
  const { subscription, usage, plans, refreshSubscription } = useSubscription();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (subscription && usage) {
      setIsLoading(false);
    }
  }, [subscription, usage]);

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
          const response = await fetch(`https://ideaflow-api.jass150505.workers.dev/verify-session`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              sessionId,
              userId: auth.currentUser.uid
            }),
            mode: 'cors'
          });

          const data = await response.json();
          console.log('Verify response:', data);

          if (response.ok) {
            // Clear the URL parameters
            window.history.replaceState({}, '', '/dashboard/subscription');
            // Wait a moment for Firestore to update
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Refresh the subscription data
            refreshSubscription();
          } else {
            throw new Error(data.error || 'Failed to verify session');
          }
        } catch (error) {
          console.error('Error verifying session:', error);
          setError('Failed to verify subscription. Please contact support.');
        }
      };

      verifySession();
    }
  }, [auth.currentUser, refreshSubscription]);

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

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      const stripe = await stripePromise;
      
      console.log('API URL:', process.env.REACT_APP_API_URL);
      console.log('Starting subscription process...');
      
      if (!stripe) {
        console.error('Stripe not initialized');
        throw new Error('Payment system is not available. Please try again later.');
      }
      
      const requestData = {
        priceId: process.env.REACT_APP_STRIPE_PRICE_ID,
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
      };
      
      console.log('Request data:', requestData);
      
      // Create a checkout session using Firebase Function
      let response;
      try {
        console.log('Fetching from:', `${process.env.REACT_APP_API_URL}/create-checkout-session`);
        response = await fetch('https://ideaflow-api.jass150505.workers.dev/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
          mode: 'cors'
        });
        console.log('Response received:', response);
      } catch (fetchError) {
        console.error('Network error:', fetchError);
        throw new Error(`Network error: ${fetchError.message}`);
      }
  
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
  
      const session = await response.json();
      console.log('Session data received:', session);
      
      if (!session || !session.url) {
        console.error('Invalid session data:', session);
        throw new Error('Failed to create checkout session');
      }
      
      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe checkout...');
      window.location.href = session.url;

    } catch (error) {
      console.error('Error creating checkout session:', error);
      console.error('Full error object:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setError(error.message || 'Failed to process subscription. Please try again.');
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
          'Authorization': `Bearer ${await auth.currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          userId: auth.currentUser.uid,
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
                usage?.pdfUploads.used || 0,
                usage?.pdfUploads.limit || 1
              )} 
            />
          </UsageBar>
          <UsageText>
            {usage?.pdfUploads.used || 0} / {usage?.pdfUploads.limit || 0} uploads used
          </UsageText>
        </UsageBlock>
        
        <UsageBlock>
          <UsageText>Website Links</UsageText>
          <UsageBar>
            <UsageProgress 
              $percentage={calculateUsagePercentage(
                usage?.websiteUploads.used || 0,
                usage?.websiteUploads.limit || 1
              )} 
            />
          </UsageBar>
          <UsageText>
            {usage?.websiteUploads.used || 0} / {usage?.websiteUploads.limit || 0} links used
          </UsageText>
        </UsageBlock>
      </UsageSection>

      <PlansContainer>
        {Object.values(plans).map((plan) => (
          <PlanCard key={plan.id} $active={subscription === plan.id}>
            <PlanTitle>{plan.name}</PlanTitle>
            <PlanPrice>
              £{plan.price}<span>/month</span>
            </PlanPrice>
            <FeaturesList>
              {plan.features.map((feature, index) => (
                <Feature key={index}>{feature}</Feature>
              ))}
            </FeaturesList>
            {subscription === plan.id ? (
              plan.id === 'pro' && (
                <Button 
                  $secondary 
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                >
                  Cancel Subscription
                </Button>
              )
            ) : (
              plan.id === 'pro' && (
                <Button
                  onClick={handleSubscribe}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Upgrade Now'}
                </Button>
              )
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
  return (
    <Elements stripe={stripePromise}>
      <Subscription />
    </Elements>
  );
} 