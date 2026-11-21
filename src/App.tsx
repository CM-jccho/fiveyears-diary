import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { BookSpread } from './components/BookSpread'
import { DemoBanner } from './components/DemoBanner'
import { Header } from './components/Header'
import { SaveStatus } from './components/SaveStatus'
import { SettingsModal } from './components/SettingsModal'
import { StatsModal } from './components/StatsModal'
import { Toolbar } from './components/Toolbar'
import { I18nProvider, useT } from './i18n'
import { backupFileName, loadState, parseBackup, saveState } from './lib/storage'
import { dayKey, entryKey, shiftDay, todayCursor } from './lib/date'
import { buildDemo } from './lib/demo'
import { recordedDayList } from './lib/stats'
import { resizePhoto } from './lib/photos'
import { emptyNote } from './lib/types'
import type { DayCursor, DayNote, DiaryState, Lang, Tab } from './lib/types'

type ModalKind = 'stats' | 'settings' | null
type SaveStatusState = 'idle' | 'saving' | 'saved' | 'failed'

export default function App() {
  const [state, setState] = useState<DiaryState>(() => loadState())
  return (
    <I18nProvider lang={state.lang}>
      <Diary state={state} setState={setState} />
    </I18nProvider>
  )
}

function Diary({ state, setState }: { state: DiaryState; setState: Dispatch<SetStateAction<DiaryState>> }) {
  const { t } = useT()
  const [cursor, setCursor] = useState<DayCursor>(() => todayCursor())
  const [tab, setTab] = useState<Tab>('timeline')
  const [modal, setModal] = useState<ModalKind>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatusState>('idle')
  const [recalledYear, setRecalledYear] = useState<number | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const today = todayCursor()
  const currentYear = new Date().getFullYear()
  const demo = useMemo(() => buildDemo(today), [today.month, today.day])
  const years = useMemo(() => Array.from({ length: 5 }, (_, index) => state.startYear + index), [state.startYear])

  const firstState = useRef(state)
  const noticeTimer = useRef<number | undefined>(undefined)
  const recallTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (state === firstState.current) return
    setSaveStatus('saving')
    const timer = window.setTimeout(() => {
      const ok = saveState(state)
      setSaveStatus(ok ? 'saved' : 'failed')
    }, 500)
    return () => window.clearTimeout(timer)
  }, [state])

  useEffect(() => {
    document.documentElement.lang = state.lang
    document.title = t('app.title')
  }, [state.lang, t])

  useEffect(() => {
    document.documentElement.dataset.font = state.font
  }, [state.font])

  useEffect(() => {
    return () => {
      window.clearTimeout(noticeTimer.current)
      window.clearTimeout(recallTimer.current)
    }
  }, [])

  const showNotice = useCallback((message: string) => {
    setNotice(message)
    window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => setNotice(null), 3400)
  }, [])

  const dayKeyNow = dayKey(cursor.month, cursor.day)
  const ownNote = state.notes[dayKeyNow]
  const demoNote = state.demoActive ? demo.notes[dayKeyNow] : undefined
  const note = useMemo<DayNote>(() => ownNote ?? demoNote ?? emptyNote(), [ownNote, demoNote])

  const resolveEntry = useCallback(
    (year: number): string => {
      const key = entryKey(year, cursor.month, cursor.day)
      const own = state.entries[key]
      if (own !== undefined) return own
      if (state.demoActive) return demo.entries[key] ?? ''
      return ''
    },
    [state.entries, state.demoActive, demo, cursor.month, cursor.day],
  )

  const filledCount = useMemo(
    () =>
      (note.freeNote.trim() ? 1 : 0) +
      (note.mood ? 1 : 0) +
      (note.weather ? 1 : 0) +
      note.photos.length +
      Object.values(note.highlights).filter((text) => text.trim()).length,
    [note],
  )

  const recordedList = useMemo(() => recordedDayList(state, demo), [state, demo])
  const recordedSet = useMemo(() => new Set(recordedList.map((item) => dayKey(item.month, item.day))), [recordedList])
  const hasRecord = useCallback((month: number, day: number) => recordedSet.has(dayKey(month, day)), [recordedSet])

  const recallYear = useMemo(() => {
    let found: number | null = null
    for (const year of years) {
      if (year < currentYear && resolveEntry(year).trim()) found = year
    }
    return found
  }, [years, currentYear, resolveEntry])

  const mutateNote = useCallback(
    (fn: (current: DayNote) => DayNote) => {
      setState((prev) => {
        const key = dayKey(cursor.month, cursor.day)
        const base = prev.notes[key] ?? (prev.demoActive ? demo.notes[key] : undefined) ?? emptyNote()
        return { ...prev, notes: { ...prev.notes, [key]: fn(base) } }
      })
    },
    [cursor.month, cursor.day, demo, setState],
  )

  const changeEntry = useCallback(
    (year: number, text: string) => {
      setState((prev) => ({
        ...prev,
        entries: { ...prev.entries, [entryKey(year, cursor.month, cursor.day)]: text },
      }))
    },
    [cursor.month, cursor.day, setState],
  )

  const handleFreeNote = useCallback((text: string) => mutateNote((current) => ({ ...current, freeNote: text })), [mutateNote])
  const handleMood = useCallback(
    (mood: string) => mutateNote((current) => ({ ...current, mood: current.mood === mood ? '' : mood })),
    [mutateNote],
  )
  const handleWeather = useCallback(
    (weather: string) => mutateNote((current) => ({ ...current, weather: current.weather === weather ? '' : weather })),
    [mutateNote],
  )
  const handleHighlight = useCallback(
    (year: number, text: string) =>
      mutateNote((current) => ({ ...current, highlights: { ...current.highlights, [String(year)]: text } })),
    [mutateNote],
  )

  const handleAddPhotos = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return
      const incoming = Array.from(files)
      const remaining = 3 - note.photos.length
      if (remaining <= 0) {
        setPhotoError(t('note.photoLimit'))
        return
      }
      const picked = incoming.slice(0, remaining)
      try {
        const data: string[] = []
        for (const file of picked) {
          data.push(await resizePhoto(file))
        }
        mutateNote((current) => ({ ...current, photos: [...current.photos, ...data].slice(0, 3) }))
        setPhotoError(incoming.length > remaining ? t('note.photoLimit') : null)
      } catch {
        setPhotoError(t('note.photoError'))
      }
    },
    [note.photos.length, mutateNote, t],
  )

  const handleRemovePhoto = useCallback(
    (index: number) => mutateNote((current) => ({ ...current, photos: current.photos.filter((_, i) => i !== index) })),
    [mutateNote],
  )

  const handleRecall = useCallback((year: number) => {
    setRecalledYear(year)
    window.clearTimeout(recallTimer.current)
    recallTimer.current = window.setTimeout(() => setRecalledYear(null), 2800)
  }, [])

  const handleRandom = useCallback(() => {
    if (recordedList.length === 0) {
      showNotice(t('random.empty'))
      return
    }
    const pool = recordedList.filter((item) => !(item.month === cursor.month && item.day === cursor.day))
    const source = pool.length > 0 ? pool : recordedList
    const pick = source[Math.floor(Math.random() * source.length)]
    setCursor({ month: pick.month, day: pick.day })
    setTab('timeline')
  }, [recordedList, cursor.month, cursor.day, showNotice, t])

  const openDemo = useCallback(() => {
    setState((prev) => ({ ...prev, demoActive: true }))
    setCursor(todayCursor())
    setTab('timeline')
  }, [setState])

  const resetDemo = useCallback(() => {
    setState((prev) => ({ ...prev, demoActive: false }))
  }, [setState])

  const handleExport = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = backupFileName()
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }, [state])

  const handleImport = useCallback(
    (text: string): boolean => {
      const next = parseBackup(text, state)
      if (!next) return false
      setState(next)
      return true
    },
    [state, setState],
  )

  const handleLang = useCallback((next: Lang) => setState((prev) => ({ ...prev, lang: next })), [setState])
  const closeModal = useCallback(() => setModal(null), [])
  const isToday = cursor.month === today.month && cursor.day === today.day

  return (
    <div className="app">
      <Header
        userName={state.userName}
        lang={state.lang}
        demoActive={state.demoActive}
        onLang={handleLang}
        onToggleDemo={state.demoActive ? resetDemo : openDemo}
        onOpenStats={() => setModal('stats')}
        onOpenSettings={() => setModal('settings')}
      />

      <main className="shell">
        <DemoBanner active={state.demoActive} onEnable={openDemo} onReset={resetDemo} />

        <Toolbar
          cursor={cursor}
          recordedCount={recordedSet.size}
          hasRecord={hasRecord}
          onShift={(delta) => setCursor((prev) => shiftDay(prev, delta))}
          onToday={() => setCursor(todayCursor())}
          onRandom={handleRandom}
          onSelect={(month, day) => setCursor({ month, day })}
        />

        {notice ? (
          <p className="app-notice" role="status">
            {notice}
          </p>
        ) : null}

        <BookSpread
          cursor={cursor}
          years={years}
          currentYear={currentYear}
          userName={state.userName}
          tab={tab}
          isToday={isToday}
          resolveEntry={resolveEntry}
          note={note}
          filledCount={filledCount}
          photoError={photoError}
          recallYear={recallYear}
          recalledYear={recalledYear}
          onChangeEntry={changeEntry}
          onTab={setTab}
          onPickMonth={(month) => setCursor({ month, day: 1 })}
          onRecall={handleRecall}
          onFreeNote={handleFreeNote}
          onToggleMood={handleMood}
          onToggleWeather={handleWeather}
          onHighlight={handleHighlight}
          onAddPhotos={handleAddPhotos}
          onRemovePhoto={handleRemovePhoto}
        />

        <footer className="app__foot">
          <div className="foot__meta">
            <span>{t('footer.note')}</span>
            {state.demoActive ? <span>{t('banner.activeTitle')}</span> : null}
          </div>
          <SaveStatus status={saveStatus} />
        </footer>
      </main>

      {modal === 'stats' ? (
        <StatsModal state={state} demo={demo} onExport={handleExport} onClose={closeModal} />
      ) : null}
      {modal === 'settings' ? (
        <SettingsModal
          state={state}
          onChange={(patch) => setState((prev) => ({ ...prev, ...patch }))}
          onExport={handleExport}
          onImport={handleImport}
          onDemoReset={resetDemo}
          onClose={closeModal}
        />
      ) : null}
    </div>
  )
}
