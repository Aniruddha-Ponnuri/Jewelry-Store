export interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  material: string;
  weight: number | null;
  gemstone: string | null;
  dimensions: string | null;
  image_path: string | null;
  is_in_stock: boolean;
  is_featured: boolean;
  stock_quantity: number;
  sku: string | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  admin_id: string;
  user_id: string;
  email: string;
  role: 'super_admin' | 'admin';
  permissions: {
    products: boolean;
    categories: boolean;
    users: boolean;
    admins: boolean;
  };
  is_active: boolean;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface Bookmark {
  bookmark_id: string;
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
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
        Insert: Omit<User, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'user_id' | 'created_at' | 'updated_at'>>;
      };
      bookmarks: {
        Row: Bookmark;
        Insert: Omit<Bookmark, 'bookmark_id' | 'created_at'>;
        Update: Partial<Omit<Bookmark, 'bookmark_id' | 'created_at'>>;
      };
      categories: {
        Row: Category;
        Insert: Omit<Category, 'category_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Category, 'category_id' | 'created_at' | 'updated_at'>>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, 'admin_id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AdminUser, 'admin_id' | 'created_at' | 'updated_at'>>;
      };
    };    Functions: {
      is_admin: {
        Args: { user_uuid?: string };
        Returns: boolean;
      };
      is_super_admin: {
        Args: { user_uuid?: string };
        Returns: boolean;
      };
      get_admin_permissions: {
        Args: { user_uuid?: string };
        Returns: {
          products: boolean;
          categories: boolean;
          users: boolean;
          admins: boolean;
        };
      };
      add_admin: {
        Args: { 
          admin_email: string;
        };
        Returns: string;
      };
      remove_admin: {
        Args: { admin_email: string };
        Returns: string;
      };
      update_admin: {
        Args: { 
          admin_email: string;
          new_role?: 'super_admin' | 'admin';
          new_permissions?: {
            products: boolean;
            categories: boolean;
            users: boolean;
            admins: boolean;
          };
          new_active_status?: boolean;
        };
        Returns: string;
      };
      create_first_super_admin: {
        Args: { super_admin_email: string };
        Returns: string;
      };
    };
  };
};
