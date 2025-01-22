import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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
  const userRef = db.collection('users').doc(userId);
  
  return db.runTransaction(async (transaction) => {
    const doc = await transaction.get(userRef);
    if (!doc.exists) {
      throw new Error('User document does not exist!');
    }

    const userData = doc.data();
    const limits = userData.limits || {};
    const currentUsage = limits[type] || { used: 0, limit: type === 'pdfUploads' ? 2 : 1 };
    
    if (currentUsage.used >= currentUsage.limit) {
      throw new Error('Usage limit reached');
    }

    transaction.update(userRef, {
      [`limits.${type}.used`]: db.FieldValue.increment(1)
    });
  });
};

export default app; 