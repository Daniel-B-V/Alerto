/**
 * Suspension Request Service
 * Handles mayor → governor suspension approval workflow
 */

import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';

/**
 * Submit a suspension request (Mayor)
 */
export const submitSuspensionRequest = async (requestData) => {
  try {
    const request = {
      city: requestData.city,
      requestedBy: {
        userId: requestData.userId,
        name: requestData.userName,
        role: 'mayor'
      },
      requestedLevels: requestData.levels || ['k12'],
      requestedDuration: requestData.durationHours || 12,
      reason: requestData.reason || '',
      weatherData: requestData.weatherData || {},
      reportCount: requestData.reportCount || 0,
      criticalReports: requestData.criticalReports || 0,
      status: 'pending',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'suspension_requests'), request);
    console.log('✅ Suspension request submitted:', docRef.id);

    return {
      id: docRef.id,
      ...request
    };
  } catch (error) {
    console.error('❌ Error submitting suspension request:', error);
    throw error;
  }
};

/**
 * Get all pending requests (Governor)
 */
export const getPendingRequests = async () => {
  try {
    const q = query(
      collection(db, 'suspension_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    return requests;
  } catch (error) {
    console.error('❌ Error getting pending requests:', error);
    return [];
  }
};

/**
 * Get requests by city (Mayor)
 */
export const getRequestsByCity = async (city) => {
  try {
    const q = query(
      collection(db, 'suspension_requests'),
      where('city', '==', city),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      reviewedAt: doc.data().reviewedAt?.toDate()
    }));

    return requests;
  } catch (error) {
    console.error('❌ Error getting city requests:', error);
    return [];
  }
};

/**
 * Approve a request (Governor)
 */
export const approveRequest = async (requestId, governorUser, suspensionId, notes = '') => {
  try {
    const requestRef = doc(db, 'suspension_requests', requestId);

    await updateDoc(requestRef, {
      status: 'approved',
      reviewedBy: {
        userId: governorUser.uid,
        name: governorUser.displayName || governorUser.email,
        role: 'governor'
      },
      reviewedAt: Timestamp.now(),
      governorNotes: notes,
      suspensionId: suspensionId,
      updatedAt: Timestamp.now()
    });

    console.log('✅ Request approved:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error approving request:', error);
    throw error;
  }
};

/**
 * Reject a request (Governor)
 */
export const rejectRequest = async (requestId, governorUser, reason) => {
  try {
    const requestRef = doc(db, 'suspension_requests', requestId);

    await updateDoc(requestRef, {
      status: 'rejected',
      reviewedBy: {
        userId: governorUser.uid,
        name: governorUser.displayName || governorUser.email,
        role: 'governor'
      },
      reviewedAt: Timestamp.now(),
      governorNotes: reason,
      updatedAt: Timestamp.now()
    });

    console.log('✅ Request rejected:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error rejecting request:', error);
    throw error;
  }
};

/**
 * Cancel a request (Mayor)
 */
export const cancelRequest = async (requestId) => {
  try {
    const requestRef = doc(db, 'suspension_requests', requestId);

    await updateDoc(requestRef, {
      status: 'cancelled',
      updatedAt: Timestamp.now()
    });

    console.log('✅ Request cancelled:', requestId);
    return true;
  } catch (error) {
    console.error('❌ Error cancelling request:', error);
    throw error;
  }
};

/**
 * Subscribe to pending requests (real-time)
 */
export const subscribeToPendingRequests = (callback) => {
  const q = query(
    collection(db, 'suspension_requests'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    callback(requests);
  }, (error) => {
    console.error('❌ Error in pending requests subscription:', error);
    callback([]);
  });
};

/**
 * Get request count for a city
 */
export const getRequestCount = async (city, status = null) => {
  try {
    let q;
    if (status) {
      q = query(
        collection(db, 'suspension_requests'),
        where('city', '==', city),
        where('status', '==', status)
      );
    } else {
      q = query(
        collection(db, 'suspension_requests'),
        where('city', '==', city)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error('❌ Error getting request count:', error);
    return 0;
  }
};
