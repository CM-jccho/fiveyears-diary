import { dayKey, formatNumber, isLeapYear, monthStartWeek, shiftDay, weekOfYear } from './date'
import type { DemoData } from './demo'
import type { DiaryState } from './types'

export interface Stats {
  totalDays: number
  entryCount: number
  streak: number
  longestStreak: number
  topMonth: number | null
  topMonthDays: number
  monthCounts: number[]
  heat: Record<number, number[]>
  years: number[]
  totalDaysInRange: number
}

function collectDays(state: DiaryState, demo: DemoData | null): Set<string> {
  const days = new Set<string>()
  const ownEntries = state.entries
  const demoEntries = state.demoActive && demo ? demo.entries : {}
  for (const source of [demoEntries, ownEntries]) {
    for (const [key, text] of Object.entries(source)) {
      if (text.trim()) days.add(key.slice(5))
    }
  }
  const ownNotes = state.notes
  const demoNotes = state.demoActive && demo ? demo.notes : {}
  for (const source of [demoNotes, ownNotes]) {
    for (const [key, note] of Object.entries(source)) {
      const filled =
        note.freeNote.trim() ||
        note.mood ||
        note.weather ||
        note.photos.length > 0 ||
        Object.values(note.highlights).some((text) => text.trim())
      if (filled) days.add(key)
    }
  }
  return days
}

export function computeStats(state: DiaryState, demo: DemoData | null, now = new Date()): Stats {
  const days = collectDays(state, demo)
  const years = Array.from({ length: 5 }, (_, i) => state.startYear + i)
  const monthCounts = Array.from({ length: 12 }, () => 0)
  let entryCount = 0

  const mergedEntries: Record<string, string> = { ...(state.demoActive && demo ? demo.entries : {}), ...state.entries }
  const heat: Record<number, number[]> = {}
  for (const year of years) heat[year] = Array.from({ length: 53 }, () => 0)

  for (const [key, text] of Object.entries(mergedEntries)) {
    if (!text.trim()) continue
    entryCount += 1
    const [yearText, monthText, dayText] = key.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    if (heat[year]) {
      const week = Math.min(52, weekOfYear(year, month, day))
      heat[year][week] += 1
    }
  }

  for (const key of days) {
    const month = Number(key.slice(0, 2))
    if (month >= 1 && month <= 12) monthCounts[month - 1] += 1
  }

  // Current streak: consecutive calendar days ending today (or yesterday when today is empty).
  const today = dayKey(now.getMonth() + 1, now.getDate())
  let cursor = days.has(today) ? { month: now.getMonth() + 1, day: now.getDate() } : shiftDay(
    { month: now.getMonth() + 1, day: now.getDate() },
    -1,
  )
  let streak = 0
  for (let i = 0; i < 4000; i += 1) {
    if (!days.has(dayKey(cursor.month, cursor.day))) break
    streak += 1
    cursor = shiftDay(cursor, -1)
  }

  // Longest streak across every written day.
  let longestStreak = 0
  for (const key of days) {
    const prev = shiftDay({ month: Number(key.slice(0, 2)), day: Number(key.slice(3)) }, -1)
    if (days.has(dayKey(prev.month, prev.day))) continue
    let run = 1
    let next = shiftDay({ month: Number(key.slice(0, 2)), day: Number(key.slice(3)) }, 1)
    while (days.has(dayKey(next.month, next.day))) {
      run += 1
      next = shiftDay(next, 1)
    }
    longestStreak = Math.max(longestStreak, run)
  }

  let topMonth: number | null = null
  let topMonthDays = 0
  monthCounts.forEach((count, index) => {
    if (count > topMonthDays) {
      topMonthDays = count
      topMonth = index + 1
    }
  })

  const totalDaysInRange = years.reduce((sum, year) => sum + (isLeapYear(year) ? 366 : 365), 0)

  return {
    totalDays: days.size,
    entryCount,
    streak,
    longestStreak,
    topMonth,
    topMonthDays,
    monthCounts,
    heat,
    years,
    totalDaysInRange,
  }
}

export function heatLevel(count: number): 0 | 1 | 2 | 3 {
  if (count <= 0) return 0
  if (count <= 2) return 1
  if (count <= 4) return 2
  return 3
}

export function monthLabelPosition(year: number, month: number): number {
  return monthStartWeek(year, month) + 1
}
export function formatCount(value: number, lang: 'ko' | 'en' | 'ja'): string {
  return formatNumber(value, lang)
}

export function recordedDayList(state: DiaryState, demo: DemoData | null): { month: number; day: number }[] {
  const list: { month: number; day: number }[] = []
  for (const key of collectDays(state, demo)) {
    const month = Number(key.slice(0, 2))
    const day = Number(key.slice(3))
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) list.push({ month, day })
  }
  return list
}
