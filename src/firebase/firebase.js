import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const updateUsage = async (userId, type) => {
  const userRef = doc(db, 'users', userId);
  
  const docSnap = await getDoc(userRef);
  if (!docSnap.exists()) {
    throw new Error('User document does not exist!');
  }

  const userData = docSnap.data();
  const limits = userData.limits || {};
  const currentUsage = limits[type] || { used: 0, limit: type === 'pdfUploads' ? 2 : 1 };
  
  if (currentUsage.used >= currentUsage.limit) {
    throw new Error('Usage limit reached');
  }

  return db.runTransaction(async (transaction) => {
    transaction.update(userRef, {
      [`limits.${type}.used`]: db.FieldValue.increment(1)
    });
  });
};

export const resetUsageLimits = async (userId) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const userData = docSnap.data();
      const isProUser = userData.subscription === 'pro';
      
      await setDoc(userRef, {
        limits: {
          pdfUploads: {
            used: 0,
            limit: isProUser ? 80 : 2
          },
          websiteUploads: {
            used: 0,
            limit: isProUser ? 50 : 1
          }
        },
        generationsPerUpload: isProUser ? 3 : 1
      }, { merge: true });
    }
  } catch (error) {
    console.error('Error resetting usage limits:', error);
    throw error;
  }
};

export default app; 