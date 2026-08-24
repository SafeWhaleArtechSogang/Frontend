interface DepartmentChipProps {
  label: string;
  className?: string;
}

/** 담당 부서 칩 (Figma 155:1593) */
export default function DepartmentChip({ label, className = "" }: DepartmentChipProps) {
  return (
    <span
      className={`flex h-8 shrink-0 items-center whitespace-nowrap rounded-full bg-neutral-100 px-2.5 text-sm font-medium leading-[1.48] tracking-[-0.35px] text-neutral-500 ${className}`}
    >
      {label}
    </span>
  );
}
