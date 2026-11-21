import { RotateCcw, Sparkles } from 'lucide-react'
import { useT } from '../i18n'

interface DemoBannerProps {
  active: boolean
  onEnable: () => void
  onReset: () => void
}

export function DemoBanner({ active, onEnable, onReset }: DemoBannerProps) {
  const { t } = useT()

  return (
    <div className="demo-slot">
      <div className={`demo-banner${active ? ' demo-banner--active' : ''}`}>
        <span className="demo-banner__icon" aria-hidden="true">
          <Sparkles size={15} />
        </span>
        <div className="demo-banner__text">
          <p className="demo-banner__title">{active ? t('banner.activeTitle') : t('banner.title')}</p>
          <p className="demo-banner__body">{active ? t('banner.activeBody') : t('banner.body')}</p>
        </div>
        <div className="demo-banner__actions">
          {active ? (
            <button type="button" className="btn btn--sm" onClick={onReset}>
              <RotateCcw size={13} aria-hidden="true" />
              <span className="btn__label">{t('banner.reset')}</span>
            </button>
          ) : (
            <button type="button" className="btn btn--primary btn--sm" onClick={onEnable}>
              {t('banner.cta')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
