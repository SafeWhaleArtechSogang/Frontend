import { ChevronDown } from "lucide-react";

interface SheetCloseButtonProps {
  onClick: () => void;
  className?: string;
}

/** 시트 접기 버튼 (Figma 301:5315) — neutral/50 원형 + chevron-down 20px */
export default function SheetCloseButton({ onClick, className = "" }: SheetCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="시트 접기"
      onClick={onClick}
      className={`flex shrink-0 items-center justify-center rounded-full bg-neutral-50 p-1 transition active:scale-95 ${className}`}
    >
      <ChevronDown className="size-5 text-neutral-800" />
    </button>
  );
}
