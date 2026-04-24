'use client'
import { clientLogger } from '@/lib/clientLogger'

export default function GlobalError({ error, reset }: { error: unknown; reset: () => void }) {
  // Safely extract message/stack for unknown error shapes
  let message = 'Unknown error'
  let stack: string | undefined = undefined

  try {
    if (error && typeof (error as any).message === 'string') {
      message = (error as any).message
    } else if (error) {
      message = String(error)
    }

    if (error && typeof (error as any).stack === 'string') {
      stack = (error as any).stack
    }
  } catch (_e) {
    // ignore extraction failures
  }

  try {
    clientLogger.error('global_error', { message, stack })
  } catch (_e) {
    // swallow logging errors to avoid secondary crashes
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold text-destructive">Something went wrong</h1>
      <p className="text-muted-foreground">{message}</p>
      <button
        onClick={() => reset()}
        className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
      >
        Try Again
      </button>
    </div>
  )
}

