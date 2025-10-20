// Firebase Storage Service
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { storage } from './config';

// Upload image file
export const uploadImage = async (file, folder = 'reports') => {
  try {
    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file);

    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Upload multiple images
export const uploadMultipleImages = async (files, folder = 'reports') => {
  try {
    const uploadPromises = Array.from(files).map(file => uploadImage(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

// Upload with progress tracking
export const uploadImageWithProgress = (file, folder = 'reports', onProgress) => {
  return new Promise((resolve, reject) => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) {
          onProgress(progress);
        }
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            url: downloadURL,
            path: uploadTask.snapshot.ref.fullPath,
            name: fileName
          });
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};

// Delete image
export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
