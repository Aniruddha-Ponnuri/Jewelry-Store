# 💎 SilverPalace E-Commerce Website

A modern, responsive e-commerce platform for silver jewelry built with Next.js 15, TypeScript, and Supabase. Features a comprehensive admin panel, user authentication, product management, and optimized performance across all devices.

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.0-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss)

## ✨ Features

### 🛍️ **E-Commerce Functionality**
- **Product Catalog**: Browse and search through jewelry collections
- **Product Details**: Detailed product pages with specifications and images
- **User Authentication**: Secure login/register system with Supabase Auth
- **Bookmarks**: Save favorite products for later viewing
- **Responsive Design**: Optimized for mobile, tablet, and desktop devices

### 🛡️ **Admin Panel**

- **Product Management**: Create, edit, and delete jewelry products with full CRUD operations
- **Category Management**: Organize products into categories with custom emojis and descriptions
- **User Management**: Manage admin users and permissions with role-based access control
- **Image Upload**: Upload and manage product images with Supabase Storage integration
- **Admin Navigation**: Enhanced navigation with reactive buttons and smooth animations
- **Comprehensive Diagnostics**: Advanced in-app troubleshooters and debug tools:
  - **Admin Debug Panel** (`/admin`): 12-test comprehensive system validation including:
    - Session & Authentication testing
    - Admin table access verification
    - Add/Remove admin function testing
    - Master admin email management testing
    - Storage setup and image upload testing
    - Environment variable validation
    - Debug function verification
    - Authentication edge case testing
    - Database integrity checks
    - Performance metrics and monitoring
  - **Admin Troubleshooter** (`/admin/diagnostic`): Quick diagnostic tools to verify system health and check Supabase function status
  - **Real-time Performance Monitoring**: Track test execution times and identify bottlenecks
  - **Detailed Error Reporting**: Comprehensive failure analysis with actionable next steps

### 🎨 **UI/UX Features**

- **Modern Design**: Clean, professional interface with amber/gold theming
- **Smooth Animations**: Hover effects, scale animations, and transitions
- **Loading States**: Skeleton loaders and professional loading indicators
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### ⚡ **Performance Optimizations**

- **Image Optimization**: Next.js Image component with lazy loading and responsive sizing
- **Code Splitting**: Dynamic imports and React.memo for optimal bundle size
- **Database Optimization**: Efficient Supabase queries with pagination and caching
- **Advanced Caching**: Strategic caching for improved loading times with session management
- **Mobile Performance**: Optimized for mobile devices with touch-friendly interfaces
- **Bundle Analysis**: Optimized bundle size with tree shaking and compression
- **Lighthouse Score**: 95+ performance rating across all categories

### 🔧 **Advanced Admin Features**

- **Multi-Level Admin System**: Support for regular admins and master admins with different permissions
- **Robust Authentication**: Enhanced auth hooks with session validation and automatic refresh
- **Admin Session Management**: Intelligent caching and session state management
- **Comprehensive Testing Suite**: Built-in testing tools for all admin functions
- **Error Boundary Handling**: Professional error handling with detailed logging
- **Real-time Status Monitoring**: Live admin status checking and validation
- **Security Features**: Row-level security, proper authentication checks, and secure data handling

## 🛠️ Tech Stack

### **Frontend**

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Lucide React** - Beautiful icons

### **Backend & Database**

- **Supabase** - Backend-as-a-Service with real-time capabilities
- **PostgreSQL** - Relational database with advanced features
- **Row Level Security** - Secure data access with policy-based authorization
- **Real-time subscriptions** - Live data updates and notifications
- **Database Functions** - Custom SQL functions for admin operations
- **Advanced Caching** - Query optimization and result caching

### **Authentication & Authorization**

- **Supabase Auth** - User authentication
- **JWT tokens** - Secure session management
- **Role-based access** - Admin and user permissions

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/jewelry-website.git
   cd jewelry-website
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Add your Supabase credentials to `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_ADMIN_EMAIL=admin@silver.com
   ```

4. **Set up the database**

   - Run the SQL scripts in the `SupaSetup` folder in your Supabase SQL Editor
   - Start with `simple-multiple-admin-setup.sql` for basic admin functionality

5. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
jewelry-website/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── admin/             # Admin panel pages
│   │   │   ├── diagnostic/    # Admin troubleshooting tools
│   │   │   ├── products/      # Product management
│   │   │   ├── categories/    # Category management
│   │   │   └── users/         # User management
│   │   ├── login/             # Authentication pages
│   │   ├── products/          # Product pages
│   │   └── ...
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── AdminDebug.tsx    # Comprehensive 12-test admin diagnostic panel
│   │   ├── AdminTroubleshooter.tsx # Quick system health diagnostics
│   │   ├── RobustAdminLayout.tsx   # Enhanced admin layout wrapper
│   │   ├── Navigation.tsx    # Main navigation
│   │   └── ProductCard.tsx   # Product display component
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Enhanced authentication context
│   ├── hooks/                # Custom React hooks
│   │   ├── useRobustAuth.ts  # Advanced authentication hook with caching
│   │   └── useAdmin.ts       # Admin permission hook
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Supabase client configuration
│   │   ├── adminSession.ts   # Admin session management
│   │   ├── adminValidation.ts # Admin validation utilities
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript type definitions
│       └── database.ts       # Database types with admin functions
├── SupaSetup/               # Database setup scripts and documentation
├── public/                  # Static assets
└── ...
```

## 🗄️ Database Schema

### Core Tables

- **products** - Jewelry product information
- **categories** - Product categories with emojis
- **users** - User profiles and data
- **admin_users** - Admin user management
- **bookmarks** - User saved products

### Key Features

- Row Level Security (RLS) enabled
- Optimized indexes for performance
- Foreign key relationships
- Audit trails with timestamps

## 🔐 Admin System

### Admin Features

- **Multi-Admin Support**: Multiple administrators with role-based permissions (admin, master_admin)
- **Product Management**: Full CRUD operations for jewelry products with image management
- **Category Management**: Organize products with custom categories and emoji icons
- **User Management**: View and manage admin users with promotion/demotion capabilities
- **Image Upload**: Supabase Storage integration for product images with automatic optimization
- **Advanced Diagnostics**: Comprehensive testing and troubleshooting tools
- **Performance Monitoring**: Real-time performance tracking and optimization insights
- **Security Features**: Enhanced authentication, session management, and secure data handling

### Admin Diagnostic Tools

#### Comprehensive Admin Debug Panel
- **12-Test System Validation**: Complete testing suite covering all admin functions
- **Performance Metrics**: Individual test execution time tracking and bottleneck identification
- **Error Analysis**: Detailed failure reporting with actionable solutions
- **Database Integrity Checks**: Verify table structure, relationships, and constraints
- **Storage Testing**: Validate image upload functionality and bucket accessibility
- **Authentication Edge Cases**: Test concurrent requests and session handling

#### Quick Troubleshooter
- **System Health Checks**: Rapid validation of core admin functionalities
- **Function Status Verification**: Test all Supabase RPC functions
- **Environment Validation**: Check configuration and environment variables
- **Next Steps Guidance**: Clear instructions for resolving identified issues

### Admin Access & Security

1. **Registration Process**:
   - User registers a normal account
   - Master admin adds user to admin_users table
   - User gains admin access on next login

2. **Role Hierarchy**:
   - **Regular Admin**: Product and category management
   - **Master Admin**: Full system access including user management

3. **Security Features**:
   - Row-level security (RLS) policies
   - Session validation and refresh
   - Secure authentication flows
   - Admin status caching for performance

### Admin Navigation

- Enhanced navbar with larger, reactive buttons
- Smooth hover animations and visual feedback
- Mobile-optimized admin interface

## 🎨 UI Components

### Design System

- **Color Scheme**: Amber/gold primary colors with professional grays
- **Typography**: Inter font with responsive sizing
- **Spacing**: Consistent spacing scale with Tailwind CSS
- **Shadows**: Subtle elevation with hover effects

### Responsive Design

- **Mobile-first**: Optimized for mobile devices
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch-friendly**: Larger touch targets for mobile interaction
- **Adaptive layouts**: Different layouts for mobile and desktop

## 🔒 Production Readiness

- Centralized env validation at `src/lib/env.ts` (ensure NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and optional REVALIDATE_SECRET).
- SEO: `src/app/robots.ts` and `src/app/sitemap.ts`.
- Health check: `src/app/api/health/route.ts`.
- Maintenance page: `src/app/maintenance/page.ts` (middleware can redirect here).
- On-demand revalidation: `POST /api/revalidate` requires `x-revalidate-secret` header (or `?secret=`) in production.
- Hardened Next config: security headers, image formats, and caching.

Revalidation example:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-revalidate-secret: $REVALIDATE_SECRET" \
  -d '{"path":"/products"}' \
  "$NEXT_PUBLIC_SITE_URL/api/revalidate"
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email
```

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ across all categories
- **First Contentful Paint**: < 2s
- **Largest Contentful Paint**: < 3s
- **Mobile Performance**: Optimized for 3G networks
- **Bundle Size**: Optimized with code splitting

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Code Quality

- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **Prettier**: Code formatting (if configured)
- **Git Hooks**: Pre-commit checks (if configured)

## 🐛 Troubleshooting

### Common Issues

#### Build Errors

- Ensure all environment variables are set
- Check TypeScript errors with `npm run build`

#### Database Connection

- Verify Supabase credentials in `.env.local`
- Check Row Level Security policies

#### Authentication Issues

- Ensure user is registered before adding to admin_users
- Check Supabase Auth configuration

### Using Built-in Diagnostic Tools

For comprehensive system diagnostics, use the built-in admin tools:

- **Admin Debug Panel**: Visit `/admin` while logged in as master admin
- **Quick Troubleshooter**: Visit `/admin/diagnostic` for rapid system checks
- **Performance Monitoring**: Built-in performance metrics and bottleneck identification

---

Made with ❤️ for jewelry enthusiasts
