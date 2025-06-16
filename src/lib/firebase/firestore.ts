import { db } from "./config";
import { 
  collection, addDoc, updateDoc, doc, 
  getDocs, query, where, deleteDoc, getDoc,
  orderBy, limit
} from "firebase/firestore";
import { Product } from "@/types/product";

const productsRef = collection(db, "products");
const usersRef = collection(db, "users");

// Product operations
export const addProduct = async (product: Omit<Product, 'id'>) => {
  try {
    const docRef = await addDoc(productsRef, {
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

export const updateProduct = async (id: string, product: Partial<Product>) => {
  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, {
      ...product,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export const deleteProduct = async (id: string) => {
  try {
    await deleteDoc(doc(db, "products", id));
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export const getProducts = async (): Promise<Product[]> => {
  try {
    const snapshot = await getDocs(query(productsRef, orderBy("createdAt", "desc")));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Product);
  } catch (error) {
    console.error("Error getting products:", error);
    throw error;
  }
}

export const getProduct = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error getting product:", error);
    throw error;
  }
}

export const getFeaturedProducts = async (): Promise<Product[]> => {
  try {
    const q = query(productsRef, where("featured", "==", true), limit(6));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }) as Product);
  } catch (error) {
    console.error("Error getting featured products:", error);
    throw error;
  }
}

// User operations
export const createUserProfile = async (uid: string, userData: any) => {
  try {
    await addDoc(usersRef, {
      uid,
      ...userData,
      bookmarks: [],
      createdAt: new Date()
    });
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

export const getUserBookmarks = async (uid: string): Promise<string[]> => {
  try {
    const q = query(usersRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return userData.bookmarks || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting user bookmarks:", error);
    return [];
  }
}

export const updateUserBookmarks = async (uid: string, bookmarks: string[]) => {
  try {
    const q = query(usersRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(userDoc.ref, { bookmarks });
    }
  } catch (error) {
    console.error("Error updating user bookmarks:", error);
    throw error;
  }
}
