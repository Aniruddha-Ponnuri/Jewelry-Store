export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  materials: string[];
  category: string;
  inStock: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  isAdmin?: boolean;
  bookmarks: string[];
}

export interface BookmarkContextType {
  bookmarks: string[];
  addBookmark: (productId: string) => void;
  removeBookmark: (productId: string) => void;
  isBookmarked: (productId: string) => boolean;
}
