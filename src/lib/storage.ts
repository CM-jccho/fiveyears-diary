import { emptyNote, STORAGE_KEY } from './types'
import type { DayNote, DiaryState, FontChoice, Lang } from './types'

const LANGS: Lang[] = ['ko', 'en', 'ja']

export function createInitialState(now = new Date()): DiaryState {
  return {
    version: 1,
    startYear: now.getFullYear() - 3,
    userName: '',
    font: 'serif',
    lang: 'ko',
    demoActive: false,
    entries: {},
    notes: {},
  }
}

function coerceNote(value: unknown): DayNote {
  const note = emptyNote()
  if (!value || typeof value !== 'object') return note
  const raw = value as Record<string, unknown>
  if (typeof raw.freeNote === 'string') note.freeNote = raw.freeNote
  if (typeof raw.mood === 'string') note.mood = raw.mood
  if (typeof raw.weather === 'string') note.weather = raw.weather
  if (Array.isArray(raw.photos)) {
    note.photos = raw.photos.filter((p): p is string => typeof p === 'string' && p.startsWith('data:image/')).slice(0, 3)
  }
  if (raw.highlights && typeof raw.highlights === 'object') {
    for (const [year, text] of Object.entries(raw.highlights as Record<string, unknown>)) {
      if (/^\d{4}$/.test(year) && typeof text === 'string') note.highlights[year] = text
    }
  }
  return note
}

export function normalizeState(raw: unknown, fallback: DiaryState): DiaryState | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const entriesRaw = value.entries
  const notesRaw = value.notes
  if (!entriesRaw || typeof entriesRaw !== 'object') return null

  const entries: Record<string, string> = {}
  for (const [key, text] of Object.entries(entriesRaw as Record<string, unknown>)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(key) && typeof text === 'string') entries[key] = text
  }

  const notes: Record<string, DayNote> = {}
  if (notesRaw && typeof notesRaw === 'object') {
    for (const [key, note] of Object.entries(notesRaw as Record<string, unknown>)) {
      if (/^\d{2}-\d{2}$/.test(key)) notes[key] = coerceNote(note)
    }
  }

  const startYear = typeof value.startYear === 'number' && Number.isFinite(value.startYear)
    ? Math.min(2200, Math.max(1900, Math.round(value.startYear)))
    : fallback.startYear

  return {
    version: 1,
    startYear,
    userName: typeof value.userName === 'string' ? value.userName.slice(0, 24) : fallback.userName,
    font: value.font === 'sans' || value.font === 'serif' ? (value.font as FontChoice) : fallback.font,
    lang: LANGS.includes(value.lang as Lang) ? (value.lang as Lang) : fallback.lang,
    demoActive: typeof value.demoActive === 'boolean' ? value.demoActive : fallback.demoActive,
    entries,
    notes,
  }
}

export function loadState(): DiaryState {
  const fallback = createInitialState()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    return normalizeState(JSON.parse(raw), fallback) ?? fallback
  } catch {
    return fallback
  }
}

export function saveState(state: DiaryState): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function parseBackup(text: string, fallback: DiaryState): DiaryState | null {
  try {
    return normalizeState(JSON.parse(text), fallback)
  } catch {
    return null
  }
}

export function backupFileName(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `fiveyears-backup-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`
}
