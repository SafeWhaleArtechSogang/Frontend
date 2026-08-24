import ChevronDownIcon from "@/components/common/ChevronDownIcon";

interface SheetCloseButtonProps {
  onClick: () => void;
  className?: string;
}

/** 시트 접기 버튼 (Figma 287:3409 down) — 44px 반투명 원형 + chevron-down 24px */
export default function SheetCloseButton({ onClick, className = "" }: SheetCloseButtonProps) {
  return (
    <button
      type="button"
      aria-label="시트 접기"
      onClick={onClick}
      className={`flex size-11 shrink-0 items-center justify-center rounded-full bg-white/30 p-1 shadow-[0px_2px_20px_0px_rgba(0,0,0,0.1)] backdrop-blur-[20px] transition active:scale-95 ${className}`}
    >
      <ChevronDownIcon className="size-6 text-neutral-800" />
    </button>
  );
}
