export interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  material: string;
  weight: number | null;
  gemstone: string | null;
  image_path: string | null;
  is_in_stock: boolean;
  is_featured: boolean;
  stock_quantity: number;
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
  admin_id?: string; // May not exist depending on table setup
  user_id: string;
  email: string;
  role: 'master_admin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed/virtual fields for compatibility
  permissions?: {
    products: boolean;
    categories: boolean;
    users: boolean;
    admins: boolean;
  };
  created_by?: string | null;
  full_name?: string; // For UI display purposes
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
        Insert: Omit<AdminUser, 'admin_id' | 'created_at' | 'updated_at' | 'role' | 'permissions' | 'created_by' | 'full_name'>;
        Update: Partial<Omit<AdminUser, 'admin_id' | 'created_at' | 'updated_at' | 'role' | 'permissions' | 'created_by' | 'full_name'>>;
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_super_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_admin_permissions: {
        Args: Record<string, never>;
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
          admin_role?: string;
        };
        Returns: string;
      };
      remove_admin: {
        Args: { admin_email: string };
        Returns: string;
      };
      is_master_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_master_admin_emails: {
        Args: Record<string, never>;
        Returns: string[];
      };
      debug_admin_status: {
        Args: Record<string, never>;
        Returns: {
          user_id: string | null;
          is_admin_function_result: boolean | null;
          is_master_admin_function_result: boolean | null;
          total_active_admins: number;
          total_master_admins: number;
          master_admin_emails: string[];
          user_admin_record_exists: boolean;
          user_admin_is_active: boolean | null;
          admin_role: string | null;
          admin_email: string | null;
          timestamp: string;
          error?: boolean;
          message?: string;
        };
      };

    };
  };
};
