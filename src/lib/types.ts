export type Lang = 'ko' | 'en' | 'ja'
export type FontChoice = 'serif' | 'sans'
export type Tab = 'timeline' | 'note'

export interface DayNote {
  freeNote: string
  mood: string
  weather: string
  photos: string[]
  highlights: Record<string, string>
}

export interface DiaryState {
  version: 1
  startYear: number
  userName: string
  font: FontChoice
  lang: Lang
  demoActive: boolean
  entries: Record<string, string>
  notes: Record<string, DayNote>
}

export interface DayCursor {
  month: number
  day: number
}

export const STORAGE_KEY = 'five_years_diary_v1'
export const DEMO_YEARS = [2023, 2024, 2025, 2026] as const

export function emptyNote(): DayNote {
  return { freeNote: '', mood: '', weather: '', photos: [], highlights: {} }
}
