export interface Product {
  id?: string // UUID in Supabase
  name: string
  description: string
  price: number
  images: string[]
  materials: string[]
  category: string
  inStock: boolean
  featured: boolean
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  email: string
  displayName?: string
  isAdmin?: boolean
  bookmarks: string[]
}
