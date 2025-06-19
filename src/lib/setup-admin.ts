/**
 * Admin Setup Instructions for admin@silver.com
 * 
 * To create the admin user, you have two options:
 * 
 * Option 1: Via Supabase Dashboard (Recommended)
 * 1. Go to https://app.supabase.com
 * 2. Navigate to Authentication > Users
 * 3. Click "Add user"
 * 4. Enter email: admin@silver.com
 * 5. Set a secure password
 * 6. Click "Add user"
 * 7. Register on your website with the same email to create the user profile
 * 
 * Option 2: Via Registration Page
 * 1. Go to /register on your website
 * 2. Register with email: admin@silver.com
 * 3. Use any secure password
 * 4. Complete the registration form
 * 
 * The system will automatically:
 * - Recognize admin@silver.com as an admin user
 * - Redirect to /admin/products after login
 * - Show admin navigation options
 * - Grant access to product management
 * 
 * Security Notes:
 * - Passwords are encrypted by Supabase Auth using bcrypt
 * - No passwords are stored in your database
 * - Only user metadata (email, is_admin) is stored in your users table
 * - Admin access is controlled by email comparison with environment variable
 */

export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@silver.com'

export function isAdminUser(email: string | null | undefined): boolean {
  return email === ADMIN_EMAIL
}

/**
 * Check if the current environment has admin email configured
 */
export function getAdminConfig() {
  return {
    adminEmail: ADMIN_EMAIL,
    isConfigured: !!process.env.NEXT_PUBLIC_ADMIN_EMAIL
  }
}
