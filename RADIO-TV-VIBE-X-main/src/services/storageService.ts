import { storage } from '../firebaseConfig';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., 'products/file.pdf')
 * @returns Upload result with download URL
 */
export const uploadProductFile = async (
  file: File,
  path: string
): Promise<UploadResult> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url,
      path,
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return {
      success: false,
      error: error.message || 'Upload failed',
    };
  }
};

/**
 * Get a download URL for a file in Firebase Storage
 * @param path - The storage path
 * @returns Download URL or null
 */
export const getDownloadUrl = async (path: string): Promise<string | null> => {
  try {
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error: any) {
    console.error('Error getting download URL:', error);
    return null;
  }
};

/**
 * Delete a file from Firebase Storage
 * @param path - The storage path
 */
export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return false;
  }
};

/**
 * Generate a unique file path for product downloads
 * @param productId - Product ID
 * @param filename - Original filename
 * @returns Unique storage path
 */
export const generateProductFilePath = (
  productId: string,
  filename: string
): string => {
  const timestamp = Date.now();
  const ext = filename.split('.').pop() || 'bin';
  return `products/${productId}/${timestamp}.${ext}`;
};

/**
 * Generate a unique file path for digital music
 * @param artist - Artist name
 * @param trackTitle - Track title
 * @param filename - Original filename
 * @returns Unique storage path
 */
export const generateMusicFilePath = (
  artist: string,
  trackTitle: string,
  filename: string
): string => {
  const timestamp = Date.now();
  const sanitizedArtist = artist.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedTitle = trackTitle.replace(/[^a-zA-Z0-9]/g, '_');
  const ext = filename.split('.').pop() || 'mp3';
  return `music/${sanitizedArtist}/${sanitizedTitle}_${timestamp}.${ext}`;
};