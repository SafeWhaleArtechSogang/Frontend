type Status = 'received' | 'confirmed' | 'reviewing' | 'complete'

interface StatusBadgeProps {
  status: Status
}

const STATUS_MAP: Record<Status, { label: string; active: boolean }> = {
  received: { label: '접수중', active: true },
  confirmed: { label: '접수완료', active: false },
  reviewing: { label: '검토중', active: false },
  complete: { label: '처리완료', active: false },
}

const ALL_STATUSES: Status[] = ['received', 'confirmed', 'reviewing', 'complete']

export default function StatusBadge({ status }: StatusBadgeProps) {
  const currentIndex = ALL_STATUSES.indexOf(status)

  return (
    <div className="flex items-center gap-2">
      {ALL_STATUSES.map((s, i) => {
        const isActive = i <= currentIndex
        return (
          <span
            key={s}
            className={`px-3 py-1 rounded-full text-xs border ${
              isActive
                ? 'bg-primary text-text-inverse border-primary'
                : 'bg-bg-primary text-text-tertiary border-border-default'
            }`}
          >
            {STATUS_MAP[s].label}
          </span>
        )
      })}
    </div>
  )
}
