'use client'

import { useEffect, useState } from 'react'
import { getTimeUntilExpiry, isSessionActive } from '@/lib/auth/persistentStorage'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Clock } from 'lucide-react'

export function SessionStatus() {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    const updateStatus = () => {
      const remaining = getTimeUntilExpiry()
      const active = isSessionActive()
      setTimeRemaining(remaining)
      setIsActive(active)
    }

    updateStatus()
    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // Don't show if no session or plenty of time left (> 10 min)
  if (!isActive || !timeRemaining || timeRemaining > 10 * 60 * 1000) {
    return null
  }

  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)

  return (
    <Alert
      variant={timeRemaining < 5 * 60 * 1000 ? "destructive" : "default"}
      className="fixed bottom-4 right-4 w-auto max-w-md z-50 shadow-lg"
    >
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <strong>Session Expiring:</strong> {minutes}m {seconds}s remaining
      </AlertDescription>
    </Alert>
  )
}
