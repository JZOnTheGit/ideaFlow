import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to create initial user data
const createInitialUserData = (email) => ({
  email,
  subscription: 'free',
  createdAt: new Date(),
  stripeCustomerId: null,
  stripeSubscriptionId: null
});

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check and create user document if it doesn't exist
  const ensureUserDocument = async (user) => {
    if (!user) return;
    
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      await setDoc(userRef, createInitialUserData(user.email));
    }
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      const result = await signInWithPopup(auth, provider);
      
      // Initialize user data in Firestore for Google sign-in
      await setDoc(doc(db, 'users', result.user.uid), {
        email: result.user.email,
        subscription: 'free',
        createdAt: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null
      }, { merge: true });

      console.log('Successfully signed in:', result.user);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      if (error.code === 'auth/popup-blocked') {
        alert('Please allow popups for this site to sign in with Google');
      } else if (error.code === 'auth/popup-closed-by-user') {
        console.log('Sign-in popup closed by user');
      } else {
        alert('Error signing in: ' + error.message);
      }
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
      if (user) {
        ensureUserDocument(user);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  async function signup(email, password) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(
        doc(db, 'users', userCredential.user.uid), 
        createInitialUserData(userCredential.user.email)
      );
      return userCredential;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signOut,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 