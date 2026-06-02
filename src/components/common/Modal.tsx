import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function Modal({ open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-bg-overlay" onClick={onClose} />
      <div className="relative bg-bg-primary rounded-xl mx-6 p-6 w-full max-w-sm shadow-lg">
        {children}
      </div>
    </div>
  )
}
