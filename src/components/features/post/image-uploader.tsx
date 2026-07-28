'use client'

import { useState, useCallback } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/ui/spinner'
import { IMAGE_UPLOAD_MAX_DIMENSION, IMAGE_UPLOAD_QUALITY } from '@/constants'

interface ImageUploaderProps {
  onUploadComplete: (urls: string[]) => void
}

interface UploadedImage {
  url: string
  name: string
}

async function resizeImage(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, IMAGE_UPLOAD_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', IMAGE_UPLOAD_QUALITY)
  )
  if (!blob) return file

  const resizedName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
  return new File([blob], resizedName, { type: 'image/jpeg' })
}

export function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback(
    async (files: FileList) => {
      setUploading(true)
      setError(null)

      const supabase = createBrowserSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('로그인이 필요합니다.')
        setUploading(false)
        return
      }

      const uploaded: UploadedImage[] = []

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue

        const resized = await resizeImage(file).catch(() => file)

        const path = `${user.id}/${Date.now()}_${resized.name}`
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(path, resized)

        if (uploadError) {
          setError('업로드 실패: ' + file.name)
          continue
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(path)

        uploaded.push({ url: publicUrl, name: file.name })
      }

      const next = [...images, ...uploaded]
      setImages(next)
      onUploadComplete(next.map((img) => img.url))
      setUploading(false)
    },
    [images, onUploadComplete]
  )

  const removeImage = useCallback(
    (url: string) => {
      const next = images.filter((img) => img.url !== url)
      setImages(next)
      onUploadComplete(next.map((img) => img.url))
    },
    [images, onUploadComplete]
  )

  return (
    <div className="flex flex-col gap-4">
      <label className="border-border hover:border-foreground/40 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading ? (
          <div className="flex items-center gap-2">
            <Spinner size="sm" />
            <span className="text-muted-foreground text-sm">업로드 중...</span>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium">사진을 선택하거나 드래그하세요</p>
            <p className="text-muted-foreground mt-1 text-xs">여러 장 동시 선택 가능</p>
          </>
        )}
      </label>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((img, i) => (
            <div key={img.url} className="group relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.name}
                className="h-full w-full rounded-md object-cover"
              />
              <div className="bg-black/40 absolute inset-0 flex items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => removeImage(img.url)}
                  className="text-xs text-white"
                >
                  삭제
                </button>
              </div>
              <span className="bg-black/60 absolute bottom-1 left-1 rounded px-1 text-xs text-white">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
