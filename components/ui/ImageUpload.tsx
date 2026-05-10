'use client'
import { useRef, useState, useCallback } from 'react'
import { Upload, X, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface Props {
  bucket: string
  onUpload: (url: string) => void
  currentUrl?: string | null
  className?: string
}

export default function ImageUpload({ bucket, onUpload, currentUrl, className = '' }: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const upload = useCallback(async (file: File) => {
    setError(null)
    if (file.size > 5 * 1024 * 1024) {
      setError('El archivo no puede superar 5 MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Solo se permiten archivos JPG, PNG o WEBP')
      return
    }

    setUploading(true)
    setProgress(10)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const supabase = createClient()

    setProgress(40)
    const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      setError(uploadError.message)
      setUploading(false)
      setProgress(0)
      return
    }

    setProgress(80)
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    setProgress(100)
    setPreview(data.publicUrl)
    onUpload(data.publicUrl)
    setUploading(false)
    setTimeout(() => setProgress(0), 600)
  }, [bucket, onUpload])

  const handleFile = useCallback((file: File | undefined) => {
    if (file) upload(file)
  }, [upload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  const handleRemove = () => {
    setPreview(null)
    setProgress(0)
    onUpload('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={className}>
      {preview ? (
        <div className="relative rounded-3xl overflow-hidden border-2 border-cream-deep group">
          <div className="relative aspect-video w-full bg-cream-warm">
            <Image src={preview} alt="Preview" fill className="object-cover" sizes="600px" />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
            ${dragging ? 'border-orange bg-orange-50' : 'border-cream-deep hover:border-orange/40 hover:bg-orange-50/30'}`}
        >
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange/15 flex items-center justify-center">
            <ImageIcon size={20} className="text-orange" />
          </div>
          <div className="text-center">
            <p className="font-bold text-text-primary text-sm">Arrastra una imagen o haz clic para seleccionar</p>
            <p className="text-text-muted text-xs mt-1">JPG, PNG o WEBP · máx. 5 MB</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange text-white rounded-full text-xs font-bold">
            <Upload size={13} /> Seleccionar imagen
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {uploading && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>Subiendo...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-cream-deep rounded-full overflow-hidden">
            <div
              className="h-full bg-orange rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  )
}
