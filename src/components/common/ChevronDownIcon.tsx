/**
 * chevron-down (Figma 287:2383)
 * lucide 기본형보다 폭·깊이가 커서 별도 아이콘으로 둔다.
 * 24px 박스 기준 path: (3.5, 8.83) → (12, 17.33) → (20.5, 8.83)
 */
export default function ChevronDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3.5 8.83L12 17.33L20.5 8.83"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
