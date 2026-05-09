'use client'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteProduct } from '@/lib/actions/products'

export default function DeleteProduct({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => startTransition(() => deleteProduct(id))}
          disabled={isPending}
          className="text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded-lg transition-colors"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      aria-label="Eliminar"
    >
      <Trash2 size={14} />
    </button>
  )
}
