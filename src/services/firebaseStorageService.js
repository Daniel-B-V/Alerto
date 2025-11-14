/**
 * Firebase Storage Service
 * Handles image uploads to Firebase Storage
 */

import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Upload a single image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} folder - The folder path (e.g., 'reports', 'users')
 * @returns {Promise<Object>} - Object with download URL and file metadata
 */
export const uploadImageToFirebase = async (file, folder = 'reports') => {
  try {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${folder}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Upload file with metadata
    const metadata = {
      contentType: file.type,
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        originalName: file.name
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: filePath,
      name: filename,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading image to Firebase Storage:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

/**
 * Upload multiple images to Firebase Storage
 * @param {FileList|Array} files - The image files to upload
 * @param {Function} onProgress - Optional callback for upload progress (current, total)
 * @param {string} folder - The folder path
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleImagesToFirebase = async (files, onProgress, folder = 'reports') => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const result = await uploadImageToFirebase(file, folder);

      if (onProgress) {
        onProgress(index + 1, files.length);
      }

      return result;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images to Firebase:', error);
    throw error;
  }
};

/**
 * Delete an image from Firebase Storage
 * @param {string} filePath - The storage path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteImageFromFirebase = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    console.log('Image deleted successfully:', filePath);
  } catch (error) {
    console.error('Error deleting image from Firebase Storage:', error);
    throw error;
  }
};

/**
 * Delete multiple images from Firebase Storage
 * @param {Array<string>} filePaths - Array of storage paths
 * @returns {Promise<void>}
 */
export const deleteMultipleImagesFromFirebase = async (filePaths) => {
  try {
    const deletePromises = filePaths.map(path => deleteImageFromFirebase(path));
    await Promise.all(deletePromises);
    console.log(`Deleted ${filePaths.length} images successfully`);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw error;
  }
};
