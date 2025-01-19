export type SubscriptionTier = 'free' | 'pro';

export interface UsageLimit {
  pdfUploads: {
    used: number;
    limit: number;
  };
  websiteUploads: {
    used: number;
    limit: number;
  };
  generationsPerUpload: number;
  generationsUsed: {
    [docId: string]: {
      twitter: number;
      youtube: number;
      tiktok: number;
    };
  };
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  limits: {
    pdfUploads: number;
    websiteUploads: number;
    generationsPerUpload: number;
  };
} 