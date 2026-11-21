import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useT } from '../i18n'
import { daysInMonth, formatMonthDay, formatMonthName, isLeapYear, todayCursor, weekdayIndex } from '../lib/date'
import type { DayCursor } from '../lib/types'

interface CalendarPickerProps {
  cursor: DayCursor
  hasRecord: (month: number, day: number) => boolean
  onSelect: (month: number, day: number) => void
  onClose: () => void
}

export function CalendarPicker({ cursor, hasRecord, onSelect, onClose }: CalendarPickerProps) {
  const { t, lang } = useT()
  const [month, setMonth] = useState(cursor.month)
  const rootRef = useRef<HTMLDivElement>(null)
  const today = todayCursor()
  const currentYear = new Date().getFullYear()
  const renderYear = month === 2 && !isLeapYear(currentYear) ? 2028 : currentYear

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) onClose()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const cells = useMemo(() => {
    const total = daysInMonth(renderYear, month)
    const offset = weekdayIndex(renderYear, month, 1)
    const list: (number | null)[] = Array.from({ length: offset }, () => null)
    for (let day = 1; day <= total; day += 1) list.push(day)
    return list
  }, [month, renderYear])

  const recorded = cells.filter((day): day is number => day !== null && hasRecord(month, day)).length
  const weekdays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(lang === 'ko' ? 'ko-KR' : lang === 'ja' ? 'ja-JP' : 'en-US', { weekday: 'narrow' }).format(
      new Date(2026, 10, 1 + index),
    ),
  )

  return (
    <div className="popover" role="dialog" aria-label={t('calendar.title')} ref={rootRef}>
      <div className="cal__head">
        <span className="cal__month">{formatMonthName(month, lang)}</span>
        <div className="cal__nav">
          <button
            type="button"
            className="btn btn--icon btn--ghost btn--sm"
            aria-label={t('calendar.prev')}
            onClick={() => setMonth((value) => (value === 1 ? 12 : value - 1))}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn--icon btn--ghost btn--sm"
            aria-label={t('calendar.next')}
            onClick={() => setMonth((value) => (value === 12 ? 1 : value + 1))}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="cal__grid" aria-hidden="false">
        {weekdays.map((label, index) => (
          <span className="cal__dow" key={`${label}-${index}`} aria-hidden="true">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          if (day === null) return <span key={`empty-${index}`} aria-hidden="true" />
          const selected = month === cursor.month && day === cursor.day
          const isToday = month === today.month && day === today.day
          return (
            <button
              key={day}
              type="button"
              className="cal__day"
              data-today={isToday}
              aria-pressed={selected}
              aria-label={formatMonthDay(month, day, lang)}
              onClick={() => onSelect(month, day)}
            >
              <span>{day}</span>
              <span className={`cal__dot${hasRecord(month, day) ? '' : ' cal__dot--off'}`} aria-hidden="true" />
            </button>
          )
        })}
      </div>

      <div className="cal__foot">
        <span>{t('calendar.recorded', { n: recorded })}</span>
        <span>{formatMonthDay(today.month, today.day, lang)}</span>
      </div>
      {month === 2 ? <p className="cal__leap">{t('calendar.leapNote')}</p> : null}
    </div>
  )
}
