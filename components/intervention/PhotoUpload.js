'use client'

import { useState, useRef } from 'react'

export default function PhotoUpload({ interventionId, onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const inputRef = useRef(null)

  async function handleFile(file) {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('interventionId', interventionId)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (data.url) {
      onUploaded(data.url)
    }
    setUploading(false)
    setPreview(null)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3">
      <div className="text-xs text-gray-400 mb-2 font-medium">📸 Ajouter une photo</div>
      {preview ? (
        <div className="relative w-20 h-20">
          <img src={preview} alt="preview" className="w-20 h-20 object-cover rounded-lg" />
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-600 hover:border-sky-500 rounded-lg p-4 text-center text-sm text-gray-500 hover:text-sky-400 transition-colors"
        >
          Appuyer pour photographier
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
