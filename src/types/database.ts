export interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
  is_in_stock: boolean;
  category: string;
  material: string;
  weight: number | null;
  gemstone: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  email: string;
  is_admin: boolean;
  created_at: string;
}

export interface Bookmark {
  user_id: string;
  product_id: string;
  created_at: string;
  products?: Product;
}

export interface Category {
  category_id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'product_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Product, 'product_id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at'>;
        Update: Partial<Omit<User, 'user_id' | 'created_at'>>;
      };      bookmarks: {
        Row: Bookmark;
        Insert: Omit<Bookmark, 'created_at'>;
        Update: Partial<Omit<Bookmark, 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'category_id' | 'created_at'>;
        Update: Partial<Omit<Category, 'category_id' | 'created_at'>>;
      };
    };
  };
};
