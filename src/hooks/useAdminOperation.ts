import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Hook for performing admin operations with privilege loss protection
 * This wraps admin operations to prevent losing admin state during network errors or form submissions
 */
export function useAdminOperation() {
  const { refreshAdminStatus } = useAuth()

  const executeWithPrivilegeProtection = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      const result = await operation()
      
      // Refresh admin status after successful operation to maintain privileges
      setTimeout(() => {
        refreshAdminStatus()
      }, 100)
      
      return result
    } catch (error) {
      // If the error is related to admin privileges, refresh status
      if (error instanceof Error && (
        error.message?.includes('admin') ||
        error.message?.includes('permission') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('forbidden')
      )) {
        console.log('Admin privilege error detected, refreshing admin status')
        refreshAdminStatus()
      }
      
      throw error
    }
  }, [refreshAdminStatus])

  return { executeWithPrivilegeProtection }
}
