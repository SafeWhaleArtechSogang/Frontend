import ProfileAvatar from "@/components/common/ProfileAvatar";

interface ProfileIdentityProps {
  name: string;
  /** 학과 · 학번 등 보조 정보 */
  detail: string;
  className?: string;
}

/** 프로필 아바타 + 이름/정보 — 지도 바텀시트와 내 프로필에서 공용 */
export default function ProfileIdentity({ name, detail, className = "" }: ProfileIdentityProps) {
  return (
    <div className={`flex min-w-0 items-center gap-4 ${className}`}>
      <ProfileAvatar size={60} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xl font-semibold leading-[1.48] tracking-[-0.5px] text-neutral-800">
          {name}
        </span>
        <span className="truncate text-sm font-medium leading-[1.48] tracking-[-0.35px] text-neutral-500">
          {detail}
        </span>
      </div>
    </div>
  );
}
