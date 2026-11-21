import { useRef } from 'react'
import { useT } from '../i18n'
import { formatWeekday, isLeapYear } from '../lib/date'
import type { DayCursor } from '../lib/types'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useAutosize } from '../lib/useAutosize'

interface YearSlotProps {
  year: number
  cursor: DayCursor
  currentYear: number
  value: string
  recalled: boolean
  onChange: (text: string) => void
  registerInput: (element: HTMLTextAreaElement | null) => void
}

export function YearSlot({ year, cursor, currentYear, value, recalled, onChange, registerInput }: YearSlotProps) {
  const { t, lang } = useT()
  const narrow = useMediaQuery('(max-width: 768px)')
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const isCurrent = year === currentYear
  const isFuture = year > currentYear
  const leapBlocked = cursor.month === 2 && cursor.day === 29 && !isLeapYear(year)

  useAutosize(ref, value, narrow && !leapBlocked)

  return (
    <div
      className={[
        'year-slot',
        isCurrent ? 'year-slot--current' : '',
        isFuture ? 'year-slot--future' : '',
        leapBlocked ? 'year-slot--leap-off' : '',
        recalled ? 'year-slot--recalled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="year-slot__label">
        <span className="year-slot__year">
          {year}
          {!leapBlocked ? (
            <span className="year-slot__wd">({formatWeekday(year, cursor.month, cursor.day, lang)})</span>
          ) : null}
        </span>
        <span className="year-slot__meta">
          {leapBlocked ? (
            <span>{t('slot.leapOff')}</span>
          ) : isCurrent ? (
            <span className="year-slot__flag">{t('slot.thisYear')}</span>
          ) : isFuture ? (
            <span>{t('slot.future')}</span>
          ) : null}
          {cursor.month === 2 && cursor.day === 29 && !leapBlocked ? <span>{t('slot.leapOn')}</span> : null}
        </span>
      </div>

      <div className="year-slot__body">
        {leapBlocked ? (
          <p className="year-slot__note">{t('slot.leapOffBody')}</p>
        ) : (
          <textarea
            className="entry"
            ref={(element) => {
              ref.current = element
              registerInput(element)
            }}
            value={value}
            placeholder={isFuture ? t('slot.futurePlaceholder') : isCurrent ? t('slot.todayPlaceholder') : t('slot.placeholder')}
            aria-label={t('slot.aria', { year, month: cursor.month, day: cursor.day })}
            spellCheck={false}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>
    </div>
  )
}
