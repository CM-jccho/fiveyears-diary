import { useRef } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { MOODS, WEATHERS, useT } from '../i18n'
import type { MessageKey } from '../i18n'
import type { DayNote } from '../lib/types'
import { useMediaQuery } from '../lib/useMediaQuery'
import { useAutosize } from '../lib/useAutosize'

interface NotePageProps {
  note: DayNote
  years: number[]
  filledCount: number
  photoError: string | null
  onFreeNote: (text: string) => void
  onToggleMood: (mood: string) => void
  onToggleWeather: (weather: string) => void
  onHighlight: (year: number, text: string) => void
  onAddPhotos: (files: FileList | null) => void
  onRemovePhoto: (index: number) => void
}

export function NotePage({
  note,
  years,
  filledCount,
  photoError,
  onFreeNote,
  onToggleMood,
  onToggleWeather,
  onHighlight,
  onAddPhotos,
  onRemovePhoto,
}: NotePageProps) {
  const { t } = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLTextAreaElement>(null)
  const narrow = useMediaQuery('(max-width: 768px)')
  const canAdd = note.photos.length < 3

  useAutosize(noteRef, note.freeNote, narrow)

  return (
    <section className="page page--right" aria-label={t('page.tabNote')}>
      <div className="note-head">
        <h2 className="note-title">{t('note.title')}</h2>
        <span className="note-count">{t('note.count', { n: filledCount })}</span>
      </div>

      <div className="free-note">
        <textarea
          className="entry"
          ref={noteRef}
          value={note.freeNote}
          placeholder={t('note.placeholder')}
          aria-label={t('note.title')}
          onChange={(event) => onFreeNote(event.target.value)}
        />
      </div>

      <div className="note-section">
        <div className="note-section__head">
          <h3 className="note-section__title">{t('note.mood')}</h3>
        </div>
        <div className="chip-row">
          {MOODS.map((mood) => (
            <button
              key={mood}
              type="button"
              className="chip"
              aria-pressed={note.mood === mood}
              onClick={() => onToggleMood(mood)}
            >
              {t(`mood.${mood}` as MessageKey)}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {WEATHERS.map((weather) => (
            <button
              key={weather}
              type="button"
              className="chip"
              aria-pressed={note.weather === weather}
              onClick={() => onToggleWeather(weather)}
            >
              {t(`weather.${weather}` as MessageKey)}
            </button>
          ))}
        </div>
      </div>

      <div className="note-section">
        <div className="note-section__head">
          <h3 className="note-section__title">{t('note.photos')}</h3>
          <span className="note-section__hint">{t('note.photoHint')}</span>
        </div>

        <div className="photo-grid">
          {note.photos.map((photo, index) => (
            <div className="photo" key={`${photo.slice(-16)}-${index}`}>
              <img src={photo} alt={t('note.photoAlt', { n: index + 1 })} />
              <button
                type="button"
                className="photo__remove"
                onClick={() => onRemovePhoto(index)}
                aria-label={t('note.removePhoto')}
                title={t('note.removePhoto')}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}

          {note.photos.length === 0 ? (
            <button
              type="button"
              className="photo-add photo-add--wide"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus size={18} aria-hidden="true" />
              <span>{t('note.addPhoto')}</span>
            </button>
          ) : canAdd ? (
            <button type="button" className="photo-add" onClick={() => inputRef.current?.click()}>
              <ImagePlus size={18} aria-hidden="true" />
              <span>{t('note.addPhoto')}</span>
            </button>
          ) : null}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={t('note.addPhoto')}
          onChange={(event) => {
            onAddPhotos(event.target.files)
            event.target.value = ''
          }}
        />
        {photoError ? <p className="photo-error">{photoError}</p> : null}
      </div>

      <div className="note-section">
        <div className="note-section__head">
          <h3 className="note-section__title">{t('note.highlights')}</h3>
          <span className="note-section__hint">{t('note.highlightHint')}</span>
        </div>
        <div className="highlights">
          {years.map((year) => (
            <div className="highlight-row" key={year}>
              <span className="highlight-row__year">{year}</span>
              <input
                type="text"
                value={note.highlights[String(year)] ?? ''}
                placeholder={t('note.highlightPlaceholder')}
                aria-label={`${year} ${t('note.highlights')}`}
                maxLength={80}
                onChange={(event) => onHighlight(year, event.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
