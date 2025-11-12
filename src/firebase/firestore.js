// Firestore Database Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './config';

// Collections
const COLLECTIONS = {
  REPORTS: 'reports',
  USERS: 'users',
  COMMENTS: 'comments',
  WEATHER: 'weather'
};

// ==================== USERS ====================

// Get user data including role
export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return {
        uid,
        ...userSnap.data()
      };
    } else {
      // User document doesn't exist, return default role
      return { uid, role: 'user' };
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return { uid, role: 'user' }; // Default to user role on error
  }
};

// Set or update user role
export const setUserRole = async (uid, role, city = null) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, uid);

    // Check if document exists first
    const docSnap = await getDoc(userRef);

    const updateData = {
      role,
      updatedAt: serverTimestamp()
    };

    // If role is mayor, store the city
    if (role === 'mayor' && city) {
      updateData.city = city;
    }

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userRef, updateData);
    } else {
      // Create new document with role
      await setDoc(userRef, {
        ...updateData,
        createdAt: serverTimestamp()
      });
    }

    const cityInfo = city ? ` of ${city}` : '';
    console.log(`✅ User role updated to "${role}"${cityInfo} for UID: ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('Error setting user role:', error);
    return { success: false, error: error.message };
  }
};

// ==================== WEATHER ====================

// Get all weather data from Firestore
export const getWeatherData = async () => {
  try {
    const weatherRef = collection(db, COLLECTIONS.WEATHER);
    const q = query(weatherRef, orderBy('lastUpdated', 'desc'));
    const snapshot = await getDocs(q);

    const weatherData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data from Firestore:', error);
    return [];
  }
};

// Subscribe to real-time weather data updates
export const subscribeToWeatherData = (callback) => {
  try {
    const weatherRef = collection(db, COLLECTIONS.WEATHER);
    const q = query(weatherRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const weatherData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(weatherData);
    }, (error) => {
      console.error('Error in weather subscription:', error);
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to weather data:', error);
    return () => {};
  }
};

// ==================== REPORTS ====================

// Get all reports with filters
export const getReports = async (filters = {}) => {
  try {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    let q = query(reportsRef, orderBy('createdAt', 'desc'));

    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters.severity) {
      q = query(q, where('severity', '==', filters.severity));
    }
    if (filters.category) {
      q = query(q, where('category', '==', filters.category));
    }
    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
};

// Get single report by ID
export const getReport = async (reportId) => {
  try {
    const reportDoc = await getDoc(doc(db, COLLECTIONS.REPORTS, reportId));
    if (reportDoc.exists()) {
      return { id: reportDoc.id, ...reportDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting report:', error);
    throw error;
  }
};

// Create new report
export const createReport = async (reportData, userId) => {
  try {
    const report = {
      ...reportData,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'pending',
      likes: [],
      commentsCount: 0,
      viewsCount: 0
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), report);
    return { id: docRef.id, ...report };
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

// Update report
export const updateReport = async (reportId, updates) => {
  try {
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    await updateDoc(reportRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
};

// Delete report
export const deleteReport = async (reportId) => {
  try {
    await deleteDoc(doc(db, COLLECTIONS.REPORTS, reportId));
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
};

// Like/Unlike report
export const toggleLike = async (reportId, userId) => {
  try {
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    const reportDoc = await getDoc(reportRef);

    if (reportDoc.exists()) {
      const likes = reportDoc.data().likes || [];
      const isLiked = likes.includes(userId);

      await updateDoc(reportRef, {
        likes: isLiked ? arrayRemove(userId) : arrayUnion(userId)
      });

      return !isLiked;
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

// ==================== COMMENTS ====================

// Get comments for a report
export const getComments = async (reportId) => {
  try {
    const commentsRef = collection(db, COLLECTIONS.COMMENTS);
    const q = query(
      commentsRef,
      where('reportId', '==', reportId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting comments:', error);
    throw error;
  }
};

// Add comment to report
export const addComment = async (reportId, userId, text, userName) => {
  try {
    const comment = {
      reportId,
      userId,
      userName,
      text,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.COMMENTS), comment);

    // Increment comment count on report
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    await updateDoc(reportRef, {
      commentsCount: increment(1)
    });

    return { id: docRef.id, ...comment };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// ==================== USERS ====================

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

// Create/Update user profile
export const setUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    // Try to get the document first to check if it exists
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      // Document exists, update it
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
      });
    } else {
      // Document doesn't exist, create it with setDoc
      await setDoc(userRef, {
        ...profileData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error setting user profile:', error);
    throw error;
  }
};

// Get user's reports
export const getUserReports = async (userId) => {
  try {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    const q = query(
      reportsRef,
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by createdAt in JavaScript to avoid needing a composite index
    return reports.sort((a, b) => {
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime; // desc order
    });
  } catch (error) {
    console.error('Error getting user reports:', error);
    throw error;
  }
};

// ==================== REAL-TIME LISTENERS ====================

// Listen to reports updates
export const subscribeToReports = (callback, filters = {}) => {
  try {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    let q;

    // Build query based on filters
    if (filters.status) {
      q = query(
        reportsRef,
        where('status', '==', filters.status),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(reportsRef, orderBy('createdAt', 'desc'));
    }

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const reports = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(reports);
      },
      (error) => {
        console.error('Error in reports snapshot listener:', error);
        // If index error, try without orderBy
        if (error.code === 'failed-precondition' || error.message.includes('index')) {
          console.log('Firestore index needed, fetching without orderBy...');
          const simpleQuery = query(reportsRef, limit(filters.limit || 20));
          return onSnapshot(simpleQuery, (snapshot) => {
            const reports = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            callback(reports);
          });
        }
        callback([]);
      }
    );
  } catch (error) {
    console.error('Error setting up reports listener:', error);
    callback([]);
    return () => {}; // Return empty unsubscribe function
  }
};

// Listen to single report updates
export const subscribeToReport = (reportId, callback) => {
  const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);

  return onSnapshot(reportRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  });
};

// Listen to comments updates
export const subscribeToComments = (reportId, callback) => {
  const commentsRef = collection(db, COLLECTIONS.COMMENTS);
  const q = query(
    commentsRef,
    where('reportId', '==', reportId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const comments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(comments);
  });
};

export { COLLECTIONS };
