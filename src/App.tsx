// App.tsx — Minimal shell; screens arrive with tranche 1.

import { useTranslation } from 'react-i18next'
import logo from '../Liaotao-logo.svg'

export default function App() {
  const { t } = useTranslation()
  return (
    <main className="flex h-full flex-col items-center justify-center gap-6">
      <img src={logo} alt={t('app.name')} className="h-32 w-32" />
      <h1 className="text-lg text-liaotao-accent">{t('app.name')}</h1>
    </main>
  )
}
