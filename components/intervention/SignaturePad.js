'use client'

import { useRef, useState, useEffect } from 'react'

export default function SignaturePad({ onSaved }) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [type, setType] = useState('client')
  const [hasSignature, setHasSignature] = useState(false)
  const lastPos = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = canvas.offsetWidth
    canvas.height = 160
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#e2e8f0'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e) {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const touch = e.touches?.[0] || e
    return {
      x: (touch.clientX - rect.left) * (canvas.width / rect.width),
      y: (touch.clientY - rect.top) * (canvas.height / rect.height),
    }
  }

  function startDraw(e) {
    e.preventDefault()
    setIsDrawing(true)
    lastPos.current = getPos(e)
  }

  function draw(e) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
    setHasSignature(true)
  }

  function stopDraw(e) {
    e.preventDefault()
    setIsDrawing(false)
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1f2937'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  function save() {
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSaved(type, dataUrl)
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 font-medium">✍️ Signature</span>
        <div className="flex gap-1">
          {['client', 'tech'].map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-xs px-2 py-1 rounded transition-colors ${type === t ? 'bg-sky-600 text-white' : 'bg-gray-700 text-gray-400'}`}
            >
              {t === 'client' ? 'Client' : 'Technicien'}
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="w-full rounded-lg touch-none cursor-crosshair"
        style={{ height: 160 }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />

      <div className="flex gap-2">
        <button onClick={clear} className="btn-ghost flex-1 text-xs py-1.5">Effacer</button>
        <button
          onClick={save}
          disabled={!hasSignature}
          className="btn-primary flex-1 text-xs py-1.5 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  )
}
