import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  }).format(new Date(date))
}

import { env } from '@/lib/env'

export function getPublicImageUrl(path: string | null) {
  if (!path) return null
  return `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product_images/${path}`
}
