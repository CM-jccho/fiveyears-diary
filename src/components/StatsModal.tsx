import { Download } from 'lucide-react'
import { useT } from '../i18n'
import { formatMonthName, formatNumber, monthStartWeek } from '../lib/date'
import { computeStats, heatLevel } from '../lib/stats'
import type { DemoData } from '../lib/demo'
import type { DiaryState } from '../lib/types'
import { Modal } from './Modal'

interface StatsModalProps {
  state: DiaryState
  demo: DemoData | null
  onExport: () => void
  onClose: () => void
}

const MONTH_ANCHORS = [1, 3, 5, 7, 9, 11]

export function StatsModal({ state, demo, onExport, onClose }: StatsModalProps) {
  const { t, lang } = useT()
  const stats = computeStats(state, demo)
  const firstYear = stats.years[0]

  return (
    <Modal
      title={t('stats.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onExport}>
            <Download size={14} aria-hidden="true" />
            <span>{t('stats.export')}</span>
          </button>
          <div className="modal__foot-right">
            <button type="button" className="btn btn--primary" onClick={onClose}>
              {t('stats.close')}
            </button>
          </div>
        </>
      }
    >
      {stats.totalDays === 0 ? (
        <p className="stats__empty">{t('stats.empty')}</p>
      ) : (
        <>
          <div className="figures">
            <div className="figure">
              <p className="figure__value">
                {formatNumber(stats.totalDays, lang)}
                <span className="figure__unit">{t('stats.dayUnit')}</span>
              </p>
              <p className="figure__label">{t('stats.days')}</p>
              <p className="figure__sub">{t('stats.entries', { n: stats.entryCount })}</p>
            </div>
            <div className="figure">
              <p className="figure__value">
                {formatNumber(stats.streak, lang)}
                <span className="figure__unit">{t('stats.dayUnit')}</span>
              </p>
              <p className="figure__label">{t('stats.streak')}</p>
              <p className="figure__sub">{t('stats.longest', { n: stats.longestStreak })}</p>
            </div>
            <div className="figure">
              <p className="figure__value">
                {stats.topMonth ? formatNumber(stats.topMonth, lang) : '0'}
                <span className="figure__unit">{t('stats.monthUnit')}</span>
              </p>
              <p className="figure__label">{t('stats.topMonth')}</p>
              <p className="figure__sub">{t('toolbar.recorded', { n: stats.topMonthDays })}</p>
            </div>
          </div>

          <section className="heatmap" aria-labelledby="heatmap-title">
            <div className="heatmap__head">
              <h3 className="heatmap__title" id="heatmap-title">
                {t('stats.heatmap')}
              </h3>
              <div className="heatmap__scale">
                <span>{t('stats.legendLow')}</span>
                <span className="heatmap__swatch heatmap__swatch--0" aria-hidden="true" />
                <span className="heatmap__swatch heatmap__swatch--1" aria-hidden="true" />
                <span className="heatmap__swatch heatmap__swatch--2" aria-hidden="true" />
                <span className="heatmap__swatch heatmap__swatch--3" aria-hidden="true" />
                <span>{t('stats.legendHigh')}</span>
              </div>
            </div>

            <div className="heatmap__scroll">
              <div className="heatmap__months" aria-hidden="true">
                {MONTH_ANCHORS.map((month) => (
                  <span
                    className="heatmap__month"
                    key={month}
                    style={{ gridColumn: monthStartWeek(firstYear, month) + 1 }}
                  >
                    {formatMonthName(month, lang, 'short')}
                  </span>
                ))}
              </div>
              <div className="heatmap__rows" role="img" aria-label={t('stats.heatmap')}>
                {stats.years.map((year) => (
                  <div className="heatmap__row" key={year}>
                    <span className="heatmap__year">{year}</span>
                    <div className="heatmap__weeks">
                      {stats.heat[year].map((count, week) => (
                        <span
                          className="heatmap__cell"
                          key={week}
                          data-level={heatLevel(count)}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="stats__summary">
              {t('stats.summary', {
                start: stats.years[0],
                end: stats.years[stats.years.length - 1],
                total: formatNumber(stats.totalDaysInRange, lang),
                days: formatNumber(stats.totalDays, lang),
              })}
            </p>
          </section>
        </>
      )}
    </Modal>
  )
}
