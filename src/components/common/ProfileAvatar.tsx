import alos from "@/assets/alos-default.png";

interface ProfileAvatarProps {
  /** 정사각형 한 변 길이(px) */
  size?: number;
  className?: string;
}

/** 프로필 이미지 — sogang/50 배경 위에 알로스 캐릭터 */
export default function ProfileAvatar({ size = 60, className = "" }: ProfileAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-end justify-center overflow-hidden rounded-[6px] bg-sogang-50 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={alos}
        alt=""
        aria-hidden="true"
        className="w-auto max-w-none select-none object-contain"
        style={{ height: size * 1.125, transform: `translateY(${size * 0.1875}px)` }}
      />
    </div>
  );
}
