'use client'
import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'

interface Props {
  productId: string
  currentImage?: string | null
  onUpload: (url: string) => void
}

export default function ImageUploader({ productId, currentImage, onUpload }: Props) {
  const [preview, setPreview] = useState<string | null>(currentImage ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se admiten imágenes')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5 MB por imagen')
      return
    }

    setError(null)
    setUploading(true)
    setPreview(URL.createObjectURL(file))

    const fd = new FormData()
    fd.append('file', file)
    fd.append('productId', productId)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()

    if (res.ok) {
      onUpload(json.url)
    } else {
      setError(json.error ?? 'Error al subir')
      setPreview(currentImage ?? null)
    }
    setUploading(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        className="relative border-2 border-dashed border-zinc-700 hover:border-orange/50 rounded-2xl overflow-hidden cursor-pointer transition-colors group"
        style={{ aspectRatio: '4/3' }}
      >
        {preview ? (
          <>
            <Image src={preview} alt="Preview" fill sizes="400px" className="object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload size={24} className="text-white" />
              <span className="text-white text-sm font-medium ml-2">Cambiar imagen</span>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setPreview(null); onUpload('') }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 group-hover:text-zinc-300 transition-colors">
            <Upload size={28} className="mb-2" />
            <p className="text-sm font-medium">Arrastra o haz clic</p>
            <p className="text-xs mt-1">JPG, PNG, WebP — máx. 5 MB</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Loader2 size={28} className="text-orange animate-spin" />
          </div>
        )}
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
