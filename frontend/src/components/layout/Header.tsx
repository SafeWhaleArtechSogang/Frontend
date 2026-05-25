import { ChevronLeft, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  title: string
  onBack?: () => void
  closeMode?: boolean
  rightAction?: {
    label: string
    onClick: () => void
  }
}

export default function Header({ title, onBack, closeMode = false, rightAction }: HeaderProps) {
  const navigate = useNavigate()
  const handleBack = onBack || (() => navigate(-1))

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-12 px-page bg-bg-primary">
      <button onClick={handleBack} className="flex items-center justify-center w-8 h-8 -ml-1">
        {closeMode ? (
          <X className="w-5 h-5 text-text-primary" />
        ) : (
          <ChevronLeft className="w-6 h-6 text-text-primary" />
        )}
      </button>
      <h1 className="absolute left-1/2 -translate-x-1/2 text-base font-semibold text-text-primary">
        {title}
      </h1>
      {rightAction ? (
        <button
          onClick={rightAction.onClick}
          className="text-base text-text-secondary"
        >
          {rightAction.label}
        </button>
      ) : (
        <div className="w-8" />
      )}
    </header>
  )
}
