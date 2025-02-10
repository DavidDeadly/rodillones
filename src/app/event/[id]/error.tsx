'use client'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}
 
export default function Error({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  error: _,
  reset,
}: ErrorProps) {
  return (
    <div>
        <h2>Something went wrong trying to access this event!</h2>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try again
      </button>
    </div>
  )
}
