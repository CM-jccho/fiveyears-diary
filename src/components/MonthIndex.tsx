import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import { useT } from '../i18n'
import { formatMonthName } from '../lib/date'
import type { DayCursor } from '../lib/types'

interface MonthIndexProps {
  cursor: DayCursor
  onPick: (month: number) => void
}

export function MonthIndex({ cursor, onPick }: MonthIndexProps) {
  const { t, lang } = useT()
  const months = Array.from({ length: 12 }, (_, index) => index + 1)
  const stripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const strip = stripRef.current
    if (!strip) return
    const active = strip.querySelector<HTMLElement>('[aria-current="true"]')
    active?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [cursor.month])

  return (
    <>
      <nav className="month-index" aria-label={t('monthIndex.label')}>
        {months.map((month) => (
          <button
            key={month}
            type="button"
            className="month-tab"
            style={{ '--step': month - 1 } as CSSProperties}
            aria-current={cursor.month === month ? 'true' : undefined}
            aria-label={formatMonthName(month, lang)}
            title={formatMonthName(month, lang)}
            onClick={() => onPick(month)}
          >
            {formatMonthName(month, lang, 'short')}
          </button>
        ))}
      </nav>

      <div className="month-strip" role="group" aria-label={t('monthIndex.label')} ref={stripRef}>
        {months.map((month) => (
          <button
            key={month}
            type="button"
            className="month-strip__tab"
            aria-current={cursor.month === month ? 'true' : undefined}
            aria-label={formatMonthName(month, lang)}
            onClick={() => onPick(month)}
          >
            {formatMonthName(month, lang, 'short')}
          </button>
        ))}
      </div>
    </>
  )
}
