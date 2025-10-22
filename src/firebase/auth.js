// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

// Helper function to create user document in Firestore
const createUserDocument = async (user, additionalData = {}) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userRef);

  // Only create if user document doesn't exist
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;

    try {
      await setDoc(userRef, {
        email,
        displayName: displayName || additionalData.displayName || '',
        photoURL: photoURL || '',
        role: 'user', // Default role
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData
      });
      console.log('✅ User document created in Firestore');
    } catch (error) {
      console.error('Error creating user document:', error);
    }
  } else {
    // Update last login time if user already exists
    try {
      await setDoc(userRef, {
        lastLogin: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error('Error updating user document:', error);
    }
  }
};

// Sign up with email and password
export const signUp = async (email, password, displayName) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile with display name
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
    }

    // Create user document in Firestore
    await createUserDocument(userCredential.user, { displayName });

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login time
    await createUserDocument(userCredential.user);

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Add prompt to ensure account selection
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(auth, provider);

    // Create/update user document in Firestore
    await createUserDocument(result.user);

    return result.user;
  } catch (error) {
    console.error('Google Sign-In Error Details:', error);

    // Provide more specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      const customError = new Error('Sign-in popup was closed. Please try again.');
      customError.code = error.code;
      throw customError;
    } else if (error.code === 'auth/popup-blocked') {
      const customError = new Error('Popup was blocked by your browser. Please allow popups for this site.');
      customError.code = error.code;
      throw customError;
    } else if (error.code === 'auth/cancelled-popup-request') {
      const customError = new Error('Sign-in was cancelled. Please try again.');
      customError.code = error.code;
      throw customError;
    } else if (error.code === 'auth/unauthorized-domain') {
      const customError = new Error('This domain is not authorized. Please contact support.');
      customError.code = error.code;
      throw customError;
    }

    throw error;
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    await updateProfile(auth.currentUser, updates);
    return auth.currentUser;
  } catch (error) {
    throw error;
  }
};

// Change password
export const changePassword = async (newPassword) => {
  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (error) {
    throw error;
  }
};

// Send password reset email
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw error;
  }
};

// Auth state observer
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};
