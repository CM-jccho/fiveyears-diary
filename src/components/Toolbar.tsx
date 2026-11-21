import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import { useT } from '../i18n'
import { formatMonthDay, formatWeekday } from '../lib/date'
import type { DayCursor } from '../lib/types'
import { CalendarPicker } from './CalendarPicker'

interface ToolbarProps {
  cursor: DayCursor
  recordedCount: number
  hasRecord: (month: number, day: number) => boolean
  onShift: (delta: number) => void
  onToday: () => void
  onRandom: () => void
  onSelect: (month: number, day: number) => void
}

export function Toolbar({ cursor, recordedCount, hasRecord, onShift, onToday, onRandom, onSelect }: ToolbarProps) {
  const { t, lang } = useT()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const year = new Date().getFullYear()

  return (
    <div className="toolbar">
      <div className="date-nav">
        <button
          type="button"
          className="btn btn--icon btn--ghost"
          onClick={() => onShift(-1)}
          aria-label={t('toolbar.prev')}
          title={t('toolbar.prev')}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>

        <div className="popover-wrap">
          <button
            type="button"
            className="date-nav__label"
            onClick={() => setCalendarOpen((open) => !open)}
            aria-haspopup="dialog"
            aria-expanded={calendarOpen}
            title={t('toolbar.pick')}
          >
            <Calendar size={14} aria-hidden="true" />
            <span>{formatMonthDay(cursor.month, cursor.day, lang)}</span>
            <span className="date-nav__weekday">{formatWeekday(year, cursor.month, cursor.day, lang)}</span>
          </button>
          {calendarOpen ? (
            <CalendarPicker
              cursor={cursor}
              hasRecord={hasRecord}
              onSelect={(month, day) => {
                onSelect(month, day)
                setCalendarOpen(false)
              }}
              onClose={() => setCalendarOpen(false)}
            />
          ) : null}
        </div>

        <button
          type="button"
          className="btn btn--icon btn--ghost"
          onClick={() => onShift(1)}
          aria-label={t('toolbar.next')}
          title={t('toolbar.next')}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="toolbar__right">
        <span className="toolbar__count">{t('toolbar.recorded', { n: recordedCount })}</span>
        <button type="button" className="btn btn--ghost" onClick={onToday}>
          {t('toolbar.today')}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onRandom}>
          <Shuffle size={14} aria-hidden="true" />
          <span className="btn__label">{t('toolbar.random')}</span>
        </button>
      </div>
    </div>
  )
}
