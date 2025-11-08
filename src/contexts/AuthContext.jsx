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
import { setUserProfile, getUserProfile, getUserData } from '../firebase/firestore';

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
  const [userRole, setUserRole] = useState('user'); // 'admin' or 'user'
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Inactivity timeout (2 hours = 7200000 milliseconds)
  const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000;
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in - fetch role from Firestore
        try {
          const userData = await getUserData(firebaseUser.uid);
          const userProfile = await getUserProfile(firebaseUser.uid);

          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: userData?.role || userProfile?.role || 'user',
            province: userProfile?.province || 'Batangas'
          });
          setUserRole(userData?.role || userProfile?.role || 'user');
          setIsAuthenticated(true);
          setLastActivityTime(Date.now());
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Still set user even if profile fetch fails
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
            role: 'user'
          });
          setUserRole('user');
          setIsAuthenticated(true);
          setLastActivityTime(Date.now());
        }
      } else {
        // User is signed out
        setUser(null);
        setUserRole('user');
        setIsAuthenticated(false);
      }
      setLoading(false);
      setInitialLoadComplete(true);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Track user activity and handle inactivity timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    // Update last activity time on user interactions
    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // List of events to track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check for inactivity every minute
    const inactivityCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
        console.log('User logged out due to inactivity');
        logOut();
      }
    }, 60000); // Check every minute

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, [isAuthenticated, lastActivityTime]);

  // Login function
  const login = async (credentials) => {
    try {
      // Only show loading screen if initial load hasn't completed
      if (!initialLoadComplete) {
        setLoading(true);
      }
      const firebaseUser = await signIn(credentials.email, credentials.password);

      // Fetch user data including role
      const userDataFromFirestore = await getUserData(firebaseUser.uid);
      const userProfile = await getUserProfile(firebaseUser.uid);

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        role: userDataFromFirestore?.role || userProfile?.role || 'user',
        province: userProfile?.province || 'Batangas'
      };

      // Update user profile in Firestore on login
      await setUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        lastLogin: new Date().toISOString()
      });

      setUser(userData);
      setUserRole(userDataFromFirestore?.role || userProfile?.role || 'user');
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    } finally {
      if (!initialLoadComplete) {
        setLoading(false);
      }
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      // Only show loading screen if initial load hasn't completed
      if (!initialLoadComplete) {
        setLoading(true);
      }
      const firebaseUser = await signInWithGoogle();

      // Fetch user data including role
      const userDataFromFirestore = await getUserData(firebaseUser.uid);
      const existingProfile = await getUserProfile(firebaseUser.uid);

      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        emailVerified: firebaseUser.emailVerified,
        role: userDataFromFirestore?.role || existingProfile?.role || 'user',
        province: existingProfile?.province || 'Batangas'
      };

      // Save/Update user profile in Firestore for Google login
      await setUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        role: userDataFromFirestore?.role || existingProfile?.role || 'user',
        provider: 'google',
        lastLogin: new Date().toISOString()
      });

      setUser(userData);
      setUserRole(userDataFromFirestore?.role || existingProfile?.role || 'user');
      setIsAuthenticated(true);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login failed:', error);
      return {
        success: false,
        error: error.message || 'Google login failed'
      };
    } finally {
      if (!initialLoadComplete) {
        setLoading(false);
      }
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
        emailVerified: firebaseUser.emailVerified,
        role: 'user', // Default role for new users
        province: userData.province || 'Batangas'
      };

      // Save user profile to Firestore
      await setUserProfile(firebaseUser.uid, {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        role: 'user', // Default role
        province: userData.province || 'Batangas'
      });

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
    userRole, // Expose user role to components
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
