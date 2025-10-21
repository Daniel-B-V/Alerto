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
import { auth } from './config';

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

    return userCredential.user;
  } catch (error) {
    throw error;
  }
};

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
