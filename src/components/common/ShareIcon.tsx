/**
 * share (Figma 287:2371)
 * lucide 기본형과 비율·굵기가 달라 별도 아이콘으로 둔다. 20px 박스 / stroke 1.5
 */
export default function ShareIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 2.96338V12.5M6.66665 6.29671L10 2.96338L13.3333 6.29671M3.33331 10V15.1495C3.33331 15.491 3.50891 15.8184 3.82147 16.0598C4.13403 16.3013 4.55795 16.4369 4.99998 16.4369H15C15.442 16.4369 15.8659 16.3013 16.1785 16.0598C16.4911 15.8184 16.6666 15.491 16.6666 15.1495V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
