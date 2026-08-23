import { useNavigate } from "react-router-dom";
import { useAuth } from "@/App";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (_provider: string) => {
    // TODO: Implement OAuth login
    login();
    // 로그인 후 항상 지도로 이동
    navigate("/map", { replace: true });
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
          className="relative flex items-center justify-center w-full h-[52px] rounded-[12px] font-semibold border border-[#E5E5E5] bg-white text-[rgba(0,0,0,0.85)]"
          onClick={() => handleLogin("google")}
        >
          <svg className="absolute left-4" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M18.171 8.368h-.67v-.035H10v3.333h4.709A5.001 5.001 0 011.667 10 5 5 0 0110 5c1.275 0 2.434.48 3.317 1.266l2.357-2.357A8.295 8.295 0 0010 1.667a8.333 8.333 0 100 16.666 8.333 8.333 0 008.171-9.965z" fill="#FFC107" />
            <path d="M2.627 6.121l2.74 2.009A5.002 5.002 0 0110 5c1.275 0 2.434.48 3.317 1.266l2.357-2.357A8.295 8.295 0 0010 1.667a8.33 8.33 0 00-7.373 4.454z" fill="#FF3D00" />
            <path d="M10 18.333a8.294 8.294 0 005.587-2.163l-2.579-2.183A4.963 4.963 0 0110 15a5.001 5.001 0 01-4.701-3.316l-2.72 2.095A8.327 8.327 0 0010 18.333z" fill="#4CAF50" />
            <path d="M18.171 8.368H17.5v-.035H10v3.333h4.709a5.023 5.023 0 01-1.7 2.32l2.578 2.184c-.182.166 2.746-2.003 2.746-6.17 0-.56-.057-1.104-.163-1.632z" fill="#1976D2" />
          </svg>
          Google로 계속하기
        </button>
      </div>
    </div>
  );
}
