interface TagProps {
  label: string
  selected?: boolean
  variant?: 'default' | 'danger'
  dangerLevel?: 'low' | 'medium' | 'high'
  onClick?: () => void
}

export default function Tag({
  label,
  selected = false,
  variant = 'default',
  dangerLevel,
  onClick,
}: TagProps) {
  if (variant === 'danger' && dangerLevel) {
    const dotColors = {
      low: 'bg-danger-low',
      medium: 'bg-danger-medium',
      high: 'bg-danger-high',
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border ${
          selected
            ? 'border-primary bg-primary text-text-inverse'
            : 'border-border-default bg-bg-primary text-text-primary'
        }`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
      >
        <span className={`w-2 h-2 rounded-full ${selected ? 'bg-white' : dotColors[dangerLevel]}`} />
        {label}
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? 'border-primary bg-primary text-text-inverse'
          : 'border-border-default bg-bg-primary text-text-primary hover:bg-bg-secondary'
      } ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {label}
    </span>
  )
}
