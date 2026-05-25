import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Header from '@/components/layout/Header'
import { SearchInput } from '@/components/common'
import type { School } from '@/types'

// Mock data
const MOCK_RESULTS: School[] = [
  { id: '1', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '2', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '3', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
  { id: '4', name: '한빛유치원', address: '서울 서대문구 연세로 50' },
]

export default function SchoolSearchPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<School[]>([])

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value.trim().length > 0) {
      // TODO: Replace with API call
      setResults(MOCK_RESULTS)
    } else {
      setResults([])
    }
  }

  const handleSelect = (_school: School) => {
    // TODO: Save selected school
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
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {results.length === 0 && !query ? (
        <div className="px-page pt-8">
          <h2 className="text-xl font-bold text-text-primary">학교를 검색하세요</h2>
          <p className="mt-2 text-base text-text-secondary leading-relaxed">
            스쿨존 위험을 신고할 학교를 선택합니다.
            <br />
            언제든지 변경할 수 있어요.
          </p>
        </div>
      ) : (
        <ul className="mt-2">
          {results.map((school) => (
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
      )}
    </div>
  )
}
