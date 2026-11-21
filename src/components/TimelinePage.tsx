import { useEffect, useRef } from 'react'
import { Sparkles } from 'lucide-react'
import { useT } from '../i18n'
import { formatFullDate, formatMonthDay } from '../lib/date'
import type { DayCursor } from '../lib/types'
import { YearSlot } from './YearSlot'

interface TimelinePageProps {
  years: number[]
  cursor: DayCursor
  currentYear: number
  userName: string
  resolveEntry: (year: number) => string
  onChangeEntry: (year: number, text: string) => void
  recallYear: number | null
  recalledYear: number | null
  onRecall: (year: number) => void
}

export function TimelinePage({
  years,
  cursor,
  currentYear,
  userName,
  resolveEntry,
  onChangeEntry,
  recallYear,
  recalledYear,
  onRecall,
}: TimelinePageProps) {
  const { t, lang } = useT()
  const inputs = useRef<Map<number, HTMLTextAreaElement | null>>(new Map())

  useEffect(() => {
    if (recalledYear === null) return
    inputs.current.get(recalledYear)?.focus({ preventScroll: true })
  }, [recalledYear])

  return (
    <section className="page page--left" aria-label={t('page.tabTimeline')}>
      <div className="page__head">
        <div>
          <h1 className="page__date">{formatMonthDay(cursor.month, cursor.day, lang)}</h1>
          <p className="page__sub">{formatFullDate(currentYear, cursor.month, cursor.day, lang)}</p>
        </div>
        {userName.trim() ? <p className="page__owner">{t('page.ownerName', { name: userName.trim() })}</p> : null}
      </div>

      {recallYear !== null ? (
        <button type="button" className="recall" onClick={() => onRecall(recallYear)}>
          <Sparkles size={14} className="recall__icon" aria-hidden="true" />
          <span>{t('recall.text', { n: currentYear - recallYear })}</span>
        </button>
      ) : null}

      <div className="year-list">
        {years.map((year) => (
          <YearSlot
            key={year}
            year={year}
            cursor={cursor}
            currentYear={currentYear}
            value={resolveEntry(year)}
            recalled={recalledYear === year}
            onChange={(text) => onChangeEntry(year, text)}
            registerInput={(element) => {
              if (element) inputs.current.set(year, element)
              else inputs.current.delete(year)
            }}
          />
        ))}
      </div>
    </section>
  )
}
