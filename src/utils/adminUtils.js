// Admin Utilities for Browser Console
// Make functions available globally for easy access

import { setUserRole } from '../firebase/firestore';
import { auth } from '../firebase/config';

/**
 * Make the current logged-in user an admin
 * Usage in browser console: window.makeCurrentUserAdmin()
 */
export const makeCurrentUserAdmin = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ No user is currently logged in. Please log in first.');
    return { success: false, error: 'No user logged in' };
  }

  console.log(`🔄 Making user ${currentUser.email} (${currentUser.uid}) an admin...`);

  const result = await setUserRole(currentUser.uid, 'admin');

  if (result.success) {
    console.log('✅ Success! You are now an admin. Please refresh the page to see the admin interface.');
    console.log('🔄 Refreshing page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    console.error('❌ Failed to set admin role:', result.error);
  }

  return result;
};

/**
 * Make any user an admin by their UID
 * Usage in browser console: window.makeUserAdmin('user-uid-here')
 */
export const makeUserAdmin = async (uid) => {
  if (!uid) {
    console.error('❌ Please provide a user UID. Usage: window.makeUserAdmin("user-uid-here")');
    return { success: false, error: 'No UID provided' };
  }

  console.log(`🔄 Making user ${uid} an admin...`);

  const result = await setUserRole(uid, 'admin');

  if (result.success) {
    console.log('✅ Success! User is now an admin.');
  } else {
    console.error('❌ Failed to set admin role:', result.error);
  }

  return result;
};

/**
 * Check current user's role
 * Usage in browser console: window.checkMyRole()
 */
export const checkCurrentUserRole = () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ No user is currently logged in.');
    return null;
  }

  console.log('👤 Current User:');
  console.log('  Email:', currentUser.email);
  console.log('  UID:', currentUser.uid);
  console.log('  Display Name:', currentUser.displayName);
  console.log('\n💡 To make yourself admin, run: window.makeCurrentUserAdmin()');

  return {
    email: currentUser.email,
    uid: currentUser.uid,
    displayName: currentUser.displayName
  };
};
