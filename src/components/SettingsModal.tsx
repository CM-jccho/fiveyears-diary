import { useId, useRef, useState } from 'react'
import { Download, Minus, Plus, Upload } from 'lucide-react'
import { useT } from '../i18n'
import { clamp } from '../lib/date'
import type { DiaryState, FontChoice, Lang } from '../lib/types'
import { Modal } from './Modal'

interface SettingsModalProps {
  state: DiaryState
  onChange: (patch: Partial<DiaryState>) => void
  onExport: () => void
  onImport: (text: string) => boolean
  onDemoReset: () => void
  onClose: () => void
}

const LANGS: { id: Lang; label: string }[] = [
  { id: 'ko', label: '한국어' },
  { id: 'en', label: 'English' },
  { id: 'ja', label: '日本語' },
]

export function SettingsModal({ state, onChange, onExport, onImport, onDemoReset, onClose }: SettingsModalProps) {
  const { t } = useT()
  const nameId = useId()
  const yearId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [message, setMessage] = useState<'ok' | 'error' | null>(null)

  const endYear = state.startYear + 4

  const setFont = (font: FontChoice) => onChange({ font })

  const chooseFile = async (file: File | undefined) => {
    if (!file) return
    const text = await file.text()
    setPending(text)
    setMessage(null)
  }

  const confirmImport = () => {
    if (pending === null) return
    const ok = onImport(pending)
    setPending(null)
    setMessage(ok ? 'ok' : 'error')
  }

  return (
    <Modal
      title={t('settings.title')}
      variant="settings"
      onClose={onClose}
      footer={
        <div className="modal__foot-right">
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {t('settings.close')}
          </button>
        </div>
      }
    >
      <div className="settings-stack">
        <section className="settings-group">
          <div className="field">
            <label className="field__label" htmlFor={nameId}>
              {t('settings.name')}
            </label>
            <input
              id={nameId}
              className="field__input"
              type="text"
              value={state.userName}
              placeholder={t('settings.namePlaceholder')}
              maxLength={24}
              onChange={(event) => onChange({ userName: event.target.value })}
            />
          </div>
        </section>

        <section className="settings-group">
          <div className="settings-row">
            <div>
              <label className="field__label" htmlFor={yearId}>
                {t('settings.startYear')}
              </label>
              <p className="field__note">{t('settings.range', { start: state.startYear, end: endYear })}</p>
            </div>
            <div className="stepper">
              <button
                type="button"
                className="stepper__btn"
                aria-label={t('settings.prevYear')}
                onClick={() => onChange({ startYear: clamp(state.startYear - 1, 1900, 2200) })}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <input
                id={yearId}
                className="stepper__value"
                type="number"
                inputMode="numeric"
                min={1900}
                max={2200}
                value={state.startYear}
                aria-label={t('settings.startYear')}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  if (Number.isFinite(next)) onChange({ startYear: clamp(Math.round(next), 1900, 2200) })
                }}
              />
              <button
                type="button"
                className="stepper__btn"
                aria-label={t('settings.nextYear')}
                onClick={() => onChange({ startYear: clamp(state.startYear + 1, 1900, 2200) })}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
          <p className="field__note settings__note">
            {t('settings.startYearNote')}
          </p>
        </section>

        <section className="settings-group">
          <h3 className="settings-group__title">{t('settings.font')}</h3>
          <div className="font-choice">
            <button
              type="button"
              className="font-card"
              aria-pressed={state.font === 'serif'}
              onClick={() => setFont('serif')}
            >
              <span className="font-card__name">{t('settings.fontSerif')}</span>
              <span className="font-card__sample font-card__sample--serif">가</span>
            </button>
            <button
              type="button"
              className="font-card"
              aria-pressed={state.font === 'sans'}
              onClick={() => setFont('sans')}
            >
              <span className="font-card__name">{t('settings.fontSans')}</span>
              <span className="font-card__sample font-card__sample--sans">가</span>
            </button>
          </div>
        </section>

        <section className="settings-group">
          <h3 className="settings-group__title">{t('settings.language')}</h3>
          <div className="segmented" role="group" aria-label={t('settings.language')}>
            {LANGS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="segmented__item"
                aria-pressed={state.lang === item.id}
                onClick={() => onChange({ lang: item.id })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-group">
          <h3 className="settings-group__title">{t('settings.data')}</h3>
          <p className="field__note settings__data-note">
            {t('settings.importHint')}
          </p>
          <div className="data-row">
            <button type="button" className="btn" onClick={onExport}>
              <Download size={14} aria-hidden="true" />
              <span>{t('settings.export')}</span>
            </button>
            <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
              <Upload size={14} aria-hidden="true" />
              <span>{t('settings.import')}</span>
            </button>
            {state.demoActive ? (
              <button type="button" className="btn btn--ghost" onClick={onDemoReset}>
                {t('settings.demoReset')}
              </button>
            ) : null}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-label={t('settings.import')}
            onChange={(event) => {
              void chooseFile(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          {pending !== null ? (
            <div className="settings__confirm settings__confirm--spaced">
              <span>{t('settings.importConfirm')}</span>
              <button type="button" className="btn btn--sm" onClick={() => setPending(null)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="btn btn--sm btn--danger" onClick={confirmImport}>
                {t('settings.importYes')}
              </button>
            </div>
          ) : null}

          {message ? (
            <p className="settings__msg" role="status">
              {message === 'ok' ? t('settings.importDone') : t('settings.importError')}
            </p>
          ) : null}
        </section>
      </div>
    </Modal>
  )
}
