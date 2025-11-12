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
 * Make the current logged-in user a mayor
 * Usage in browser console: window.makeCurrentUserMayor('Batangas City')
 */
export const makeCurrentUserMayor = async (city) => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ No user is currently logged in. Please log in first.');
    return { success: false, error: 'No user logged in' };
  }

  if (!city) {
    console.error('❌ Please provide a city name.');
    console.log('💡 Usage: window.makeCurrentUserMayor("Batangas City")');
    console.log('Available cities: Batangas City, Lipa City, Tanauan City, Santo Tomas, etc.');
    return { success: false, error: 'No city provided' };
  }

  console.log(`🔄 Making user ${currentUser.email} (${currentUser.uid}) a mayor of ${city}...`);

  const result = await setUserRole(currentUser.uid, 'mayor', city);

  if (result.success) {
    console.log(`✅ Success! You are now the Mayor of ${city}. Please refresh the page.`);
    console.log('🔄 Refreshing page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    console.error('❌ Failed to set mayor role:', result.error);
  }

  return result;
};

/**
 * Make the current logged-in user a governor
 * Usage in browser console: window.makeCurrentUserGovernor()
 */
export const makeCurrentUserGovernor = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    console.error('❌ No user is currently logged in. Please log in first.');
    return { success: false, error: 'No user logged in' };
  }

  console.log(`🔄 Making user ${currentUser.email} (${currentUser.uid}) a governor...`);

  const result = await setUserRole(currentUser.uid, 'governor');

  if (result.success) {
    console.log('✅ Success! You are now a Governor. Please refresh the page.');
    console.log('🔄 Refreshing page in 2 seconds...');
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  } else {
    console.error('❌ Failed to set governor role:', result.error);
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
  console.log('\n💡 Available commands:');
  console.log('  window.makeCurrentUserGovernor() - Become a Governor');
  console.log('  window.makeCurrentUserMayor("Batangas City") - Become a Mayor');
  console.log('  window.makeCurrentUserAdmin() - Become an Admin (same as Governor)');

  return {
    email: currentUser.email,
    uid: currentUser.uid,
    displayName: currentUser.displayName
  };
};
