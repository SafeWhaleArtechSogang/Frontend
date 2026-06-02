import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

export default function BottomSheet({ open, onClose, children, className = '' }: BottomSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end">
      {onClose && (
        <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} />
      )}
      <div
        className={`relative w-full max-w-[430px] mx-auto bg-bg-primary rounded-t-xl shadow-lg animate-slide-up ${className}`}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-border-default rounded-full" />
        </div>
        {children}
      </div>
    </div>
  )
}
