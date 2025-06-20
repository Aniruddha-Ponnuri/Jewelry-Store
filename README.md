# 💎 Silver Jewelry E-Commerce Website

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
- **Product Management**: Create, edit, and delete jewelry products
- **Category Management**: Organize products into categories with emojis
- **User Management**: Manage admin users and permissions
- **Image Upload**: Upload and manage product images with Supabase Storage
- **Admin Navigation**: Enhanced navigation with reactive buttons and smooth animations

### 🎨 **UI/UX Features**
- **Modern Design**: Clean, professional interface with amber/gold theming
- **Smooth Animations**: Hover effects, scale animations, and transitions
- **Loading States**: Skeleton loaders and professional loading indicators
- **Error Handling**: Comprehensive error boundaries and user-friendly messages
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support

### ⚡ **Performance Optimizations**
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Dynamic imports and React.memo for optimal bundle size
- **Database Optimization**: Efficient Supabase queries with pagination
- **Caching**: Strategic caching for improved loading times
- **Mobile Performance**: Optimized for mobile devices with touch-friendly interfaces

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI components
- **Lucide React** - Beautiful icons

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Relational database
- **Row Level Security** - Secure data access
- **Real-time subscriptions** - Live data updates

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
│   │   ├── login/             # Authentication pages
│   │   ├── products/          # Product pages
│   │   └── ...
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── AdminLayout.tsx   # Admin layout wrapper
│   │   ├── Navigation.tsx    # Main navigation
│   │   └── ProductCard.tsx   # Product display component
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/                # Custom React hooks
│   │   └── useAdmin.ts       # Admin permission hook
│   ├── lib/                  # Utility libraries
│   │   ├── supabase/         # Supabase client configuration
│   │   └── utils.ts          # Helper functions
│   └── types/                # TypeScript type definitions
│       └── database.ts       # Database types
├── SupaSetup/               # Database setup scripts
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
- **Multi-Admin Support**: Multiple administrators with full permissions
- **Product Management**: CRUD operations for jewelry products
- **Category Management**: Organize products with custom categories
- **User Management**: View and manage admin users
- **Image Upload**: Supabase Storage integration for product images

### Admin Access
1. Register a user account normally
2. Add the user email to admin_users table via SQL
3. User will have admin access on next login

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

**Build Errors**
- Ensure all environment variables are set
- Check TypeScript errors with `npm run build`

**Database Connection**
- Verify Supabase credentials in `.env.local`
- Check Row Level Security policies

**Authentication Issues**
- Ensure user is registered before adding to admin_users
- Check Supabase Auth configuration


**Made with ❤️ for jewelry enthusiasts**
