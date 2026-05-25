import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface MapSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

export default function MapSearchInput({
  placeholder = '검색',
  className = '',
  ...props
}: MapSearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-primary" />
      <input
        type="text"
        className="w-full py-2.5 pl-11 pr-4 bg-white rounded-[4px] shadow-[0px_4px_20px_0px_rgba(0,0,0,0.15)] text-base font-semibold text-text-primary tracking-[-0.35px] placeholder:text-[#7B7B7B] placeholder:font-semibold outline-none"
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}
