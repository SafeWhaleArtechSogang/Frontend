import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (_provider: string) => {
    // TODO: Implement OAuth login
    navigate("/school/search");
  };

  return (
    <div className="flex flex-col min-h-dvh px-page">
      {/* Logo Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <img src={logo} alt="안전고래" className="w-[160px] h-[160px] rounded-xl mb-4" />
        <h1 className="text-2xl font-bold text-text-primary">안전고래</h1>
        <p className="mt-2 text-base text-text-secondary">
          더 안전한 등굣길을 함께
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
        <p className="text-sm text-text-tertiary text-center mt-3">다른 계정으로 계속하기</p>
        <div className="flex items-center justify-center gap-4 mt-3">
          {/* Google */}
          <button
            className="w-12 h-12 rounded-full border border-border-default bg-bg-primary flex items-center justify-center"
            onClick={() => handleLogin("google")}
          >
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path d="M18.171 8.368h-.67v-.035H10v3.333h4.709A5.001 5.001 0 011.667 10 5 5 0 0110 5c1.275 0 2.434.48 3.317 1.266l2.357-2.357A8.295 8.295 0 0010 1.667a8.333 8.333 0 100 16.666 8.333 8.333 0 008.171-9.965z" fill="#FFC107"/>
              <path d="M2.627 6.121l2.74 2.009A5.002 5.002 0 0110 5c1.275 0 2.434.48 3.317 1.266l2.357-2.357A8.295 8.295 0 0010 1.667a8.33 8.33 0 00-7.373 4.454z" fill="#FF3D00"/>
              <path d="M10 18.333a8.294 8.294 0 005.587-2.163l-2.579-2.183A4.963 4.963 0 0110 15a5.001 5.001 0 01-4.701-3.316l-2.72 2.095A8.327 8.327 0 0010 18.333z" fill="#4CAF50"/>
              <path d="M18.171 8.368H17.5v-.035H10v3.333h4.709a5.023 5.023 0 01-1.7 2.32l2.578 2.184c-.182.166 2.746-2.003 2.746-6.17 0-.56-.057-1.104-.163-1.632z" fill="#1976D2"/>
            </svg>
          </button>
          {/* Naver */}
          <button
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#03C75A' }}
            onClick={() => handleLogin("naver")}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10.849 8.557L4.916 0H0v16h5.151V7.443L11.084 16H16V0h-5.151v8.557z" fill="#FFFFFF"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
