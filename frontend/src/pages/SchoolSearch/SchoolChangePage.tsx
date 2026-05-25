import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import { SearchInput } from '@/components/common'
import type { School } from '@/types'

// Mock data
const CURRENT_SCHOOL: School = { id: '1', name: '한빛유치원', address: '서울 서대문구 연세로 50' }
const RECENT_SCHOOLS: School[] = [
  { id: '2', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '3', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '4', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '5', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
]

export default function SchoolChangePage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleSelect = (_school: School) => {
    // TODO: Update selected school
    navigate('/map')
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header
        title="학교 선택"
        rightAction={{ label: '건너뛰기', onClick: () => navigate('/map') }}
      />

      <div className="px-page pt-2">
        <SearchInput
          placeholder="학교명 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Current School */}
      <div className="mt-4">
        <p className="px-page text-sm text-text-secondary font-medium">현재 학교</p>
        <div className="mt-1 mx-page px-4 py-3.5 bg-bg-secondary rounded-[4px]">
          <p className="text-base font-semibold text-text-primary">{CURRENT_SCHOOL.name}</p>
          <p className="text-sm text-text-secondary mt-0.5">{CURRENT_SCHOOL.address}</p>
        </div>
      </div>

      {/* Recent Schools */}
      <div className="mt-6">
        <p className="px-page text-sm text-text-secondary font-medium">최근본 학교</p>
        <ul className="mt-1">
          {RECENT_SCHOOLS.map((school) => (
            <li
              key={school.id}
              className="flex items-center justify-between px-page py-4 border-b border-border-light cursor-pointer hover:bg-bg-secondary"
              onClick={() => handleSelect(school)}
            >
              <div>
                <p className="text-base font-semibold text-text-primary">{school.name}</p>
                <p className="text-sm text-text-secondary mt-0.5">{school.address}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
