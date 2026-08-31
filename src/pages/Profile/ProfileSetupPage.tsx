import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { meApi } from "@/api";
import { useAuth } from "@/auth";

interface LocationState {
  from?: string;
}

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, isAuthLoading, user, refreshProfile } = useAuth();
  const [name, setName] = useState("");
  const [major, setMajor] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !isLoggedIn) {
      navigate("/login", { replace: true, state: { from: "/profile" } });
    }
  }, [isAuthLoading, isLoggedIn, navigate]);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? "");
    setMajor(user.major ?? "");
    setStudentNo(user.studentNo ?? "");
    setPhone(user.phone ?? "");
  }, [user]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await meApi.updateProfile({ name, major, studentNo, phone });
      await refreshProfile();
      const from = (location.state as LocationState | null)?.from;
      navigate(from ?? "/map", { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "프로필을 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="app-shell min-h-svh bg-gray-10 px-5 pb-8 pt-3">
      <button
        type="button"
        aria-label="뒤로"
        onClick={() => navigate("/map")}
        className="flex size-10 items-center justify-center rounded-full transition active:bg-neutral-100"
      >
        <ChevronLeft className="size-6 text-neutral-800" />
      </button>

      <section className="mx-auto mt-10 max-w-sm">
        <h1 className="text-2xl font-bold tracking-[-0.6px] text-neutral-800">프로필 정보를 입력해 주세요</h1>
        <p className="mt-3 text-sm leading-6 tracking-[-0.3px] text-neutral-600">
          신고 확인과 필요한 안내를 위해 사용합니다.
        </p>

        <form onSubmit={submit} className="mt-10 space-y-5">
          <Field label="이름" value={name} onChange={setName} autoComplete="name" />
          <Field label="학과" value={major} onChange={setMajor} placeholder="예: 컴퓨터공학과" />
          <Field label="학번" value={studentNo} onChange={setStudentNo} inputMode="numeric" placeholder="예: 20241234" />
          <Field label="연락처" value={phone} onChange={setPhone} inputMode="tel" autoComplete="tel" placeholder="예: 010-1234-5678" />
          {error && <p className="text-sm text-sogang-500">{error}</p>}
          <button
            type="submit"
            disabled={saving || !name.trim() || !major.trim() || !studentNo.trim() || !phone.trim()}
            className="mt-4 h-12 w-full rounded-xl bg-sogang-500 text-sm font-semibold text-white transition disabled:bg-neutral-300 active:brightness-95"
          >
            {saving ? "저장 중..." : "저장하고 시작하기"}
          </button>
        </form>
      </section>
    </main>
  );
}

function Field({ label, value, onChange, ...inputProps }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-neutral-800">{label}</span>
      <input
        {...inputProps}
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-neutral-800 outline-none transition placeholder:text-neutral-400 focus:border-sogang-500"
      />
    </label>
  );
}
