import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signIn,
  signUp,
  logOut,
  onAuthChange,
  updateUserProfile,
  changePassword as firebaseChangePassword,
  signInWithGoogle,
  getCurrentUser
} from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified
        });
        setIsAuthenticated(true);
      } else {
        // User is signed out
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      setLoading(true);
      const firebaseUser = await signIn(credentials.email, credentials.password);

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      };

      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const firebaseUser = await signInWithGoogle();

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      };

      setUser(userData);
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login failed:', error);
      return {
        success: false,
        error: error.message || 'Google login failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      const firebaseUser = await signUp(
        userData.email,
        userData.password,
        userData.name || userData.displayName
      );

      const newUserData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified
      };

      setUser(newUserData);
      setIsAuthenticated(true);
      return { success: true, user: newUserData };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await logOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const updatedUser = await updateUserProfile(profileData);

      const userData = {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL,
        emailVerified: updatedUser.emailVerified
      };

      setUser(userData);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Profile update failed:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      await firebaseChangePassword(passwordData.newPassword);
      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      return {
        success: false,
        error: error.message || 'Password change failed'
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
