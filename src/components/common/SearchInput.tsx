import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void
}

export default function SearchInput({
  placeholder = '검색',
  className = '',
  ...props
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C4C4C4]" />
      <input
        type="text"
        className="w-full py-2.5 pl-10 pr-4 bg-[#F5F5F5] rounded-[4px] text-base text-text-primary tracking-[-0.35px] placeholder:text-[#C4C4C4] outline-none"
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}
