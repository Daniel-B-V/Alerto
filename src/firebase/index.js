// Firebase - Main Export File
// This file exports all Firebase services for easy importing

// Config
export { default as app, auth, db, storage } from './config';

// Auth Services
export {
  signUp,
  signIn,
  signInWithGoogle,
  logOut,
  updateUserProfile,
  changePassword,
  resetPassword,
  onAuthChange,
  getCurrentUser
} from './auth';

// Firestore Services
export {
  getReports,
  getReport,
  createReport,
  updateReport,
  rejectReport,
  deleteReport,
  toggleLike,
  getComments,
  addComment,
  getUserProfile,
  setUserProfile,
  getUserReports,
  subscribeToReports,
  subscribeToReport,
  subscribeToComments,
  COLLECTIONS
} from './firestore';

// Storage Services
export {
  uploadImage,
  uploadMultipleImages,
  uploadImageWithProgress,
  deleteImage
} from './storage';
