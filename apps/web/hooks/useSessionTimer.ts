'use client'

import { useState, useEffect } from 'react'

interface UseSessionTimerOptions {
  initialSeconds: number
  onExpire: () => void
}

interface UseSessionTimerResult {
  secondsLeft: number
  isExpired: boolean
  formattedTime: string
}

export function useSessionTimer({
  initialSeconds,
  onExpire,
}: UseSessionTimerOptions): UseSessionTimerResult {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpire()
      return
    }
    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0')
  const secs = (secondsLeft % 60).toString().padStart(2, '0')
  const formattedTime = `${mins}:${secs}`

  return {
    secondsLeft,
    isExpired: secondsLeft <= 0,
    formattedTime,
  }
}
