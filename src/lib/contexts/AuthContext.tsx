'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserBookmarks, updateUserBookmarks } from '@/lib/firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bookmarks: string[];
  addBookmark: (productId: string) => void;
  removeBookmark: (productId: string) => void;
  isBookmarked: (productId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userBookmarks = await getUserBookmarks(user.uid);
        setBookmarks(userBookmarks);
      } else {
        setBookmarks([]);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const addBookmark = async (productId: string) => {
    if (!user) return;
    const newBookmarks = [...bookmarks, productId];
    setBookmarks(newBookmarks);
    await updateUserBookmarks(user.uid, newBookmarks);
  };

  const removeBookmark = async (productId: string) => {
    if (!user) return;
    const newBookmarks = bookmarks.filter(id => id !== productId);
    setBookmarks(newBookmarks);
    await updateUserBookmarks(user.uid, newBookmarks);
  };

  const isBookmarked = (productId: string) => {
    return bookmarks.includes(productId);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    logout,
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
