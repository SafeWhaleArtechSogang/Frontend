export interface School {
  id: string
  name: string
  address: string
}

export type DangerLevel = 'low' | 'medium' | 'high'

export type ReportStatus = 'received' | 'confirmed' | 'reviewing' | 'complete'

export interface Category {
  id: number
  label: string
}

export const CATEGORIES: Category[] = [
  { id: 1, label: '스쿨존 불법주정차' },
  { id: 2, label: '일반 불법주정차' },
  { id: 3, label: '안전시설 파손 · 부재' },
  { id: 4, label: '노면 파손' },
  { id: 5, label: '포트홀 · 지반침하' },
  { id: 6, label: '맨홀 · 배수시설' },
  { id: 7, label: '보행 공간 점유물' },
  { id: 8, label: 'PM · 자전거 방치' },
  { id: 9, label: '횡단보도 훼손' },
  { id: 10, label: '공사 구간 위험' },
  { id: 11, label: '기타(직접입력)' },
]

export interface SafetyPin {
  id: string
  title: string
  description: string
  category: Category
  dangerLevel: DangerLevel
  status: ReportStatus
  school: School
  address: string
  latitude: number
  longitude: number
  images: string[]
  createdAt: string
  isMine: boolean
  likeCount: number
}

export interface ReportDraft {
  images: string[]
  category: Category | null
  dangerLevel: DangerLevel | null
  description: string
  address: string
  school: School | null
  latitude: number | null
  longitude: number | null
}
