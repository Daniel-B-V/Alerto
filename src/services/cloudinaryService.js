/**
 * Cloudinary Service
 * Handles image uploads to Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY;

/**
 * Upload a single image to Cloudinary
 * @param {File} file - The image file to upload
 * @returns {Promise<Object>} - The Cloudinary response with image URL
 */
export const uploadImageToCloudinary = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    formData.append('folder', 'alerto/reports');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {FileList|Array} files - The image files to upload
 * @param {Function} onProgress - Optional callback for upload progress
 * @returns {Promise<Array>} - Array of Cloudinary responses
 */
export const uploadMultipleImagesToCloudinary = async (files, onProgress) => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const result = await uploadImageToCloudinary(file);
      if (onProgress) {
        onProgress(index + 1, files.length);
      }
      return result;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - The deletion response
 */
export const deleteImageFromCloudinary = async (publicId) => {
  try {
    // Note: Deleting images requires authentication with API secret
    // This should be done from the backend for security
    // For now, we'll just skip deletion as it requires backend setup
    console.warn('Image deletion should be handled by the backend');
    return { success: true };
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};

/**
 * Get optimized image URL with transformations
 * @param {string} url - The original Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string} - The transformed image URL
 */
export const getOptimizedImageUrl = (url, options = {}) => {
  const {
    width = 800,
    height,
    quality = 'auto',
    format = 'auto',
  } = options;

  // Extract the upload path from the URL
  const uploadIndex = url.indexOf('/upload/');
  if (uploadIndex === -1) return url;

  const beforeUpload = url.substring(0, uploadIndex + 8);
  const afterUpload = url.substring(uploadIndex + 8);

  // Build transformation string
  const transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);

  return `${beforeUpload}${transformations.join(',')}/${afterUpload}`;
};
