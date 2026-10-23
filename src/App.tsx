// App.tsx — Minimal shell; screens arrive with tranche 1.

import logo from '../Liaotao-logo.svg'

export default function App() {
  return (
    <main className="flex h-full flex-col items-center justify-center gap-6">
      <img src={logo} alt="Liaotao" className="h-32 w-32" />
      <h1 className="text-lg text-liaotao-accent">Liaotao</h1>
    </main>
  )
}
