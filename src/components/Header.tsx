import { ChartNoAxesColumn, RotateCcw, Settings, Sparkles } from 'lucide-react'
import { useT } from '../i18n'
import type { Lang } from '../lib/types'

const LANGS: { id: Lang; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
]

interface HeaderProps {
  userName: string
  lang: Lang
  demoActive: boolean
  onLang: (lang: Lang) => void
  onToggleDemo: () => void
  onOpenStats: () => void
  onOpenSettings: () => void
}

export function Header({ userName, lang, demoActive, onLang, onToggleDemo, onOpenStats, onOpenSettings }: HeaderProps) {
  const { t } = useT()

  return (
    <header className="topbar">
      <div className="shell topbar__inner">
        <div className="brand">
          <span className="brand__mark">FiveYears</span>
          <span className="brand__sub">
            {userName.trim() ? t('page.ownerName', { name: userName.trim() }) : t('app.subtitle')}
          </span>
        </div>

        <div className="topbar__lang" role="group" aria-label={t('header.language')}>
          {LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="lang-btn"
              aria-pressed={lang === item.id}
              aria-label={item.label}
              onClick={() => onLang(item.id)}
            >
              {item.id}
            </button>
          ))}
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="btn btn--sm"
            onClick={onToggleDemo}
            aria-pressed={demoActive}
            aria-label={demoActive ? t('header.demoReset') : t('header.demoFill')}
            title={demoActive ? t('header.demoReset') : t('header.demoFill')}
          >
            {demoActive ? (
              <RotateCcw size={14} aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            <span className="btn__label">{demoActive ? t('header.demoReset') : t('header.demoFill')}</span>
          </button>
          <button
            type="button"
            className="btn btn--icon btn--ghost"
            onClick={onOpenStats}
            aria-label={t('header.stats')}
            title={t('header.stats')}
          >
            <ChartNoAxesColumn size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className="btn btn--icon btn--ghost"
            onClick={onOpenSettings}
            aria-label={t('header.settings')}
            title={t('header.settings')}
          >
            <Settings size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  )
}
