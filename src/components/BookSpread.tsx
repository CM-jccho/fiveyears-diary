import { motion, useReducedMotion } from 'framer-motion'
import { useT } from '../i18n'
import type { DayCursor, Tab } from '../lib/types'
import type { DayNote } from '../lib/types'
import { MonthIndex } from './MonthIndex'
import { NotePage } from './NotePage'
import { TimelinePage } from './TimelinePage'

interface BookSpreadProps {
  cursor: DayCursor
  years: number[]
  currentYear: number
  userName: string
  tab: Tab
  isToday: boolean
  resolveEntry: (year: number) => string
  note: DayNote
  filledCount: number
  photoError: string | null
  recallYear: number | null
  recalledYear: number | null
  onChangeEntry: (year: number, text: string) => void
  onTab: (tab: Tab) => void
  onPickMonth: (month: number) => void
  onRecall: (year: number) => void
  onFreeNote: (text: string) => void
  onToggleMood: (mood: string) => void
  onToggleWeather: (weather: string) => void
  onHighlight: (year: number, text: string) => void
  onAddPhotos: (files: FileList | null) => void
  onRemovePhoto: (index: number) => void
}

export function BookSpread({
  cursor,
  years,
  currentYear,
  userName,
  tab,
  isToday,
  resolveEntry,
  note,
  filledCount,
  photoError,
  recallYear,
  recalledYear,
  onChangeEntry,
  onTab,
  onPickMonth,
  onRecall,
  onFreeNote,
  onToggleMood,
  onToggleWeather,
  onHighlight,
  onAddPhotos,
  onRemovePhoto,
}: BookSpreadProps) {
  const { t } = useT()
  const reduce = useReducedMotion()

  return (
    <div className="book-wrap">
      <div className="segment" role="group" aria-label={t('page.tabTimeline')}>
        <button
          type="button"
          className="segment__item"
          aria-pressed={tab === 'timeline'}
          onClick={() => onTab('timeline')}
        >
          {t('page.tabTimeline')}
        </button>
        <button type="button" className="segment__item" aria-pressed={tab === 'note'} onClick={() => onTab('note')}>
          {t('page.tabNote')}
        </button>
      </div>

      <MonthIndex cursor={cursor} onPick={onPickMonth} />

      <div className="book">
        <div className="book__stitch" aria-hidden="true" />
        {isToday ? <div className="book__ribbon" aria-hidden="true" /> : null}

        <motion.div
          key={`${cursor.month}-${cursor.day}`}
          initial={reduce ? false : { opacity: 0.86, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="spread" data-tab={tab}>
            <div className="spread__spine" aria-hidden="true" />
            <TimelinePage
              years={years}
              cursor={cursor}
              currentYear={currentYear}
              userName={userName}
              resolveEntry={resolveEntry}
              onChangeEntry={onChangeEntry}
              recallYear={recallYear}
              recalledYear={recalledYear}
              onRecall={onRecall}
            />
            <NotePage
              note={note}
              years={years}
              filledCount={filledCount}
              photoError={photoError}
              onFreeNote={onFreeNote}
              onToggleMood={onToggleMood}
              onToggleWeather={onToggleWeather}
              onHighlight={onHighlight}
              onAddPhotos={onAddPhotos}
              onRemovePhoto={onRemovePhoto}
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
