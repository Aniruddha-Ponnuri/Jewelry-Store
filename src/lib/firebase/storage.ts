import { storage } from "./config";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export const uploadImage = async (file: File, path: string): Promise<string> => {
  try {
    const imageRef = ref(storage, path);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export const deleteImage = async (path: string) => {
  try {
    const imageRef = ref(storage, path);
    await deleteObject(imageRef);
  } catch (error) {
    console.error("Error deleting image:", error);
    throw error;
  }
}

export const uploadProductImages = async (files: FileList, productId: string): Promise<string[]> => {
  try {
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const path = `products/${productId}/image_${index}_${Date.now()}`;
      return uploadImage(file, path);
    });
    
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading product images:", error);
    throw error;
  }
}
