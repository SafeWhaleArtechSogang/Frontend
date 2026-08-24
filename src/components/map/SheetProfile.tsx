import ProfileIdentity from "@/components/common/ProfileIdentity";

interface SheetProfileProps {
  name: string;
  /** 학과 · 학번 등 보조 정보 */
  detail: string;
  onClick?: () => void;
}

/** 바텀시트 상단 프로필 (Figma 289:3543) */
export default function SheetProfile({ name, detail, onClick }: SheetProfileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-[10px] px-1 text-left transition active:bg-neutral-100"
    >
      <ProfileIdentity name={name} detail={detail} />
    </button>
  );
}
