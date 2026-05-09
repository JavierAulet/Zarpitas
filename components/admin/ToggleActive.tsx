'use client'
import { useState, useTransition } from 'react'
import { toggleProductActive } from '@/lib/actions/products'

export default function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const [checked, setChecked] = useState(active)
  const [isPending, startTransition] = useTransition()

  const handleChange = () => {
    const next = !checked
    setChecked(next)
    startTransition(async () => {
      try {
        await toggleProductActive(id, next)
      } catch {
        setChecked(!next)
      }
    })
  }

  return (
    <button
      onClick={handleChange}
      disabled={isPending}
      className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-orange' : 'bg-zinc-700'} disabled:opacity-50`}
      aria-label={checked ? 'Desactivar' : 'Activar'}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-4' : 'translate-x-0'}`}
      />
    </button>
  )
}
