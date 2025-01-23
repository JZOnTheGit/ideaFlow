import { useSubscriptionContext } from '../contexts/SubscriptionContext';

export const useSubscription = () => {
  const { subscription, loading, checkUploadLimit } = useSubscriptionContext();

  return {
    loading,
    subscription,
    checkUploadLimit,
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
    ]
  };
};

export default useSubscription; 