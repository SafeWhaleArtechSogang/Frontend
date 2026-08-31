/** 요약 카드 (Figma 323:5402) */
export default function AdminStatCard({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="flex-1 rounded-[10px] bg-gray-10 px-5 py-4 shadow-[0px_2px_5px_0px_rgba(0,0,0,0.05)]">
      <p className="text-xs font-medium tracking-[-0.4px] text-neutral-400">{label}</p>
      <p
        className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.4px] ${
          accent ? "text-sogang-500" : "text-neutral-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
