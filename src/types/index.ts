export interface School {
  id: string
  name: string
  address: string
}

export type DangerLevel = 'low' | 'medium' | 'high'

export type ReportStatus = 'received' | 'confirmed' | 'reviewing' | 'complete'

export type CategoryAxis = 'A' | 'B' | 'C' | 'D'

export interface Category {
  id: number
  axis: CategoryAxis
  axisLabel: string
  label: string
  definition: string
  examples: string
  department: string
  visionType: '정적' | '맥락'
}

export const CATEGORIES: Category[] = [
  {
    id: 1,
    axis: 'A',
    axisLabel: '교육시설 안전',
    label: '보행 표면 위험',
    definition: '바닥·계단·보도의 물리적 결함',
    examples: '균열, 미끄러움, 단차, 보도블록 들뜸, 빙판',
    department: '시설팀',
    visionType: '정적',
  },
  {
    id: 2,
    axis: 'A',
    axisLabel: '교육시설 안전',
    label: '구조물 위험',
    definition: '건물 구조체·내장재 결함',
    examples: '천장/벽체 누수·박리·균열, 출입문 파손, 유리 깨짐',
    department: '시설팀',
    visionType: '정적',
  },
  {
    id: 3,
    axis: 'A',
    axisLabel: '교육시설 안전',
    label: '조명·전기 위험',
    definition: '조명 불량 및 전기 시설 위험',
    examples: '꺼진 조명, 노출 배선, 콘센트 손상, 분전반 개방',
    department: '시설팀',
    visionType: '정적',
  },
  {
    id: 4,
    axis: 'A',
    axisLabel: '교육시설 안전',
    label: '옥외 시설 위험',
    definition: '옥외 공간의 시설·환경 위험',
    examples: '조경 낙하 우려, 맨홀 손상, 옥외 조형물 결함, 배수 불량',
    department: '시설팀',
    visionType: '정적',
  },
  {
    id: 5,
    axis: 'B',
    axisLabel: '보행·교통 안전',
    label: '교내 교통 위험',
    definition: '차량·보행 동선 충돌 위험',
    examples: '시야 차단 구간, 위험 횡단 구간, 차량 진입 통제 부재',
    department: '안전관리센터',
    visionType: '맥락',
  },
  {
    id: 6,
    axis: 'B',
    axisLabel: '보행·교통 안전',
    label: '퍼스널 모빌리티 위험',
    definition: '킥보드·자전거·오토바이 관련',
    examples: '보행로 방치 PM, 위험 운행 구간, 주차 혼잡',
    department: '안전관리센터',
    visionType: '맥락',
  },
  {
    id: 7,
    axis: 'C',
    axisLabel: '산업재해 환경',
    label: '작업장·공사장 위험',
    definition: '공사·작업 중 안전조치 미흡',
    examples: '개방된 공사 구간, 자재 방치, 안전펜스 부재',
    department: '안전관리센터',
    visionType: '정적',
  },
  {
    id: 8,
    axis: 'C',
    axisLabel: '산업재해 환경',
    label: '추락·낙하 위험',
    definition: '추락 또는 낙하물 위험',
    examples: '난간 미설치/파손, 노출된 개구부, 낙하 우려 자재',
    department: '안전관리센터',
    visionType: '정적',
  },
  {
    id: 9,
    axis: 'C',
    axisLabel: '산업재해 환경',
    label: '화재 안전 위험',
    definition: '소방 시설·피난 동선 결함',
    examples: '소화기 부재·만료, 비상구 폐쇄·물건 적치, 위험 전열기구',
    department: '안전관리센터',
    visionType: '정적',
  },
  {
    id: 10,
    axis: 'D',
    axisLabel: '범죄예방 환경',
    label: 'CPTED 환경 위험',
    definition: '범죄 유발 가능 환경 요소',
    examples: '어두운 통로, 사각지대, 야간 무조명 구역, 시야 차단 구조',
    department: '안전관리센터+인사총무팀(다중 라우팅)',
    visionType: '맥락',
  },
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
