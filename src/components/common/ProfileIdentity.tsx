import ProfileAvatar from "@/components/common/ProfileAvatar";

interface ProfileIdentityProps {
  name: string;
  /** 학과 · 학번 등 보조 정보 */
  detail: string;
  /** 보조 정보를 말줄임하지 않고 줄바꿈해 전부 보여준다 */
  wrapDetail?: boolean;
  /** 아바타 한 변 길이(px) */
  avatarSize?: number;
  className?: string;
}

/** 프로필 아바타 + 이름/정보 — 지도 바텀시트와 내 프로필에서 공용 */
export default function ProfileIdentity({
  name,
  detail,
  wrapDetail = false,
  avatarSize = 60,
  className = "",
}: ProfileIdentityProps) {
  return (
    <div className={`flex min-w-0 items-center gap-4 ${className}`}>
      <ProfileAvatar size={avatarSize} />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-xl font-semibold leading-[1.48] tracking-[-0.5px] text-neutral-800">
          {name}
        </span>
        <span
          className={`text-sm font-medium leading-[1.48] tracking-[-0.35px] text-neutral-500 ${
            wrapDetail ? "whitespace-pre-line break-keep" : "truncate"
          }`}
        >
          {detail}
        </span>
      </div>
    </div>
  );
}
