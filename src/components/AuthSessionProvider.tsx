'use client'

/**
 * AuthSessionProvider - Minimal wrapper for auth-related functionality
 * The main auth logic is handled by AuthContext
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  // AuthContext handles all auth logic - this is now a pass-through
  return <>{children}</>
}
