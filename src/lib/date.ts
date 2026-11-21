import type { DayCursor, Lang } from './types'

export const LOCALES: Record<Lang, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
}

export const MAX_DAYS = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28
  return MAX_DAYS[month - 1]
}

export function dayKey(month: number, day: number): string {
  return `${pad2(month)}-${pad2(day)}`
}

export function entryKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** Moves a month/day cursor by whole days, using a leap year so 02-29 stays reachable. */
export function shiftDay(cursor: DayCursor, delta: number): DayCursor {
  const base = new Date(2024, cursor.month - 1, cursor.day + delta)
  return { month: base.getMonth() + 1, day: base.getDate() }
}

export function weekdayIndex(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay()
}

export function todayCursor(now = new Date()): DayCursor {
  return { month: now.getMonth() + 1, day: now.getDate() }
}

export function formatMonthDay(month: number, day: number, lang: Lang): string {
  if (lang === 'ko') return `${month}월 ${day}일`
  if (lang === 'ja') return `${month}月${day}日`
  return new Intl.DateTimeFormat(LOCALES.en, { month: 'long', day: 'numeric' }).format(new Date(2026, month - 1, day))
}

export function formatWeekday(year: number, month: number, day: number, lang: Lang, width: 'short' | 'long' = 'short'): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { weekday: width }).format(new Date(year, month - 1, day))
}

export function formatFullDate(year: number, month: number, day: number, lang: Lang): string {
  return new Intl.DateTimeFormat(LOCALES[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(new Date(year, month - 1, day))
}

export function formatMonthName(month: number, lang: Lang, width: 'short' | 'long' = 'long'): string {
  return new Intl.DateTimeFormat(LOCALES[lang], { month: width }).format(new Date(2026, month - 1, 1))
}

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(LOCALES[lang]).format(n)
}

/** Weeks in a year row, Sunday-first, 0..53. */
export function weekOfYear(year: number, month: number, day: number): number {
  const start = Date.UTC(year, 0, 1)
  const point = Date.UTC(year, month - 1, day)
  const dayOfYear = Math.round((point - start) / 86400000)
  const jan1 = new Date(Date.UTC(year, 0, 1)).getUTCDay()
  return Math.floor((dayOfYear + jan1) / 7)
}

export function monthStartWeek(year: number, month: number): number {
  return weekOfYear(year, month, 1)
}

export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}
