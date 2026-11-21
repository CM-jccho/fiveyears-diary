import { useT } from '../i18n'

interface SaveStatusProps {
  status: 'idle' | 'saving' | 'saved' | 'failed'
}

export function SaveStatus({ status }: SaveStatusProps) {
  const { t } = useT()

  return (
    <p className="save-status" data-state={status} role="status" aria-live="polite">
      {status === 'saving' ? <span>{t('status.saving')}</span> : null}
      {status === 'saved' ? <span>{t('status.saved')}</span> : null}
      {status === 'failed' ? <span>{t('status.failed')}</span> : null}
      {status === 'idle' ? <span className="sr-only">{t('status.auto')}</span> : null}
    </p>
  )
}
