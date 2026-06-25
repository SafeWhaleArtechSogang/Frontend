import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/App";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // 로그인 후 돌아갈 경로 (없으면 /map)
  const from = (location.state as { from?: string })?.from || "/map";

  const handleLogin = (_provider: string) => {
    // TODO: Implement OAuth login
    login();
    navigate(from, { replace: true });
  };

  return (
    <div className="flex flex-col min-h-dvh px-page">
      {/* Logo Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <img src={logo} alt="안전고래" className="w-[160px] h-[160px] rounded-xl mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">안전고래</h1>
        <p className="mt-2 text-base text-text-secondary">
          로그인하고 안전 신고를 시작하세요
        </p>
      </div>

      {/* Login Buttons */}
      <div className="flex flex-col gap-3 pb-12">
        <button
          className="relative flex items-center justify-center w-full h-[52px] rounded-[12px] font-semibold"
          style={{ backgroundColor: '#FEE500', color: 'rgba(0, 0, 0, 0.85)' }}
          onClick={() => handleLogin("kakao")}
        >
          <svg
            className="absolute left-4"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M9 0.6C4.03 0.6 0 3.713 0 7.554c0 2.465 1.617 4.634 4.06 5.876l-1.03 3.766c-.09.33.287.59.573.396l4.5-2.97c.296.022.596.033.897.033 4.97 0 9-3.113 9-6.955S13.97.6 9 .6"
              fill="#000000"
            />
          </svg>
          카카오 로그인
        </button>
      </div>
    </div>
  );
}
