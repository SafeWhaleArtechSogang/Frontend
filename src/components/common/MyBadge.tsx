interface MyBadgeProps {
  /** 원형 배지 크기(px). 기본 32 */
  size?: number;
  className?: string;
}

/** "My" 원형 배지 — 내가 신고한 항목 표시 */
export default function MyBadge({ size = 32, className = "" }: MyBadgeProps) {
  return (
    <span
      className={`rounded-full bg-white border border-[#e9e9e9] flex items-center justify-center text-xs font-semibold text-[#7b7b7b] shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      My
    </span>
  );
}
