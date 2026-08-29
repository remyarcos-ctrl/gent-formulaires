'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

function countSections(content) {
  if (!content) return { total: 0, complete: 0 }
  const total = (content.match(/^## /gm) || []).length
  const incomplete = (content.match(/À COMPLÉTER/g) || []).length
  return { total, complete: Math.max(0, total - incomplete) }
}

export default function KnowledgePage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showFile, setShowFile] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [progress, setProgress] = useState({ total: 0, complete: 0 })
  const messagesEndRef = useRef(null)

  useEffect(() => { startChat() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function fetchFileContent() {
    try {
      const res = await fetch('/api/admin/knowledge-chat')
      const data = await res.json()
      setFileContent(data.content || '')
      setProgress(countSections(data.content || ''))
    } catch (e) {}
  }

  async function startChat() {
    await fetchFileContent()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/knowledge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      const initial = [{ role: 'assistant', content: data.response }]
      setMessages(initial)
    } catch (e) {
      setMessages([{ role: 'assistant', content: `Erreur au démarrage : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  async function sendMessage(content) {
    if (!content.trim() || loading) return
    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setSaved(false)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/knowledge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      const updated = [...newMessages, { role: 'assistant', content: data.response }]
      setMessages(updated)
      if (data.saved) {
        setSaved(true)
        await fetchFileContent()
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erreur : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const progressPct = progress.total > 0 ? Math.round((progress.complete / progress.total) * 100) : 0

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-gray-950">
      {/* Header */}
      <div className="shrink-0 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">
            ← Admin
          </Link>
          <div className="w-px h-5 bg-gray-700" />
          <div className="w-8 h-8 bg-violet-600 rounded-xl flex items-center justify-center text-sm font-bold text-white">
            🧠
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Base de connaissance</p>
            <p className="text-gray-400 text-xs">Chloé apprend sur Happy Confort</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress indicator */}
          {progress.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">
                {progress.complete}/{progress.total} sections
              </div>
              <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-xs text-sky-400 font-medium">{progressPct}%</div>
            </div>
          )}
          <button
            onClick={() => { setShowFile(true); fetchFileContent() }}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Voir le fichier
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="app-scroll max-w-3xl mx-auto w-full px-4 pt-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
                C
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-sky-600 text-white rounded-tr-sm'
                  : 'bg-gray-800 text-gray-100 rounded-tl-sm'
              }`}
              dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.content)}</p>` }}
            />
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center text-xs font-bold text-white mr-2 mt-1 shrink-0">
              C
            </div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {saved && !loading && (
          <div className="flex justify-center">
            <div className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full">
              Base de connaissance mise à jour
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="app-bar bg-gray-950 border-t border-gray-800 max-w-3xl mx-auto w-full">
        <div className="flex gap-2 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Répondez à Chloé…"
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-40 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold"
          >
            ↑
          </button>
        </div>
      </div>

      {/* File modal */}
      {showFile && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowFile(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <p className="text-white font-semibold text-sm">knowledge.md</p>
              <button onClick={() => setShowFile(false)} className="text-gray-400 hover:text-white transition-colors text-lg leading-none">×</button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              <pre className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap font-mono">{fileContent || 'Chargement…'}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
