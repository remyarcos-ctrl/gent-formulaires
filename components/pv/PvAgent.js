'use client'

import { useState, useEffect, useRef } from 'react'
import SignaturePad from '@/components/intervention/SignaturePad'

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function PvAgent({ pv }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [choices, setChoices] = useState([])
  const [showSigTech, setShowSigTech] = useState(false)
  const [showSigClient, setShowSigClient] = useState(false)
  const [signatures, setSignatures] = useState({ tech: null, client: null })
  const [completed, setCompleted] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => { initChat() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function initChat() {
    setLoading(true)
    try {
      const res = await fetch('/api/pv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], pvId: pv.id }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      const { text, choices: c } = parseResponse(data.response)
      setMessages([{ role: 'assistant', content: text }])
      setChoices(c)
    } catch (e) {
      setMessages([{ role: 'assistant', content: `⚠️ Erreur : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function parseResponse(text) {
    const choicesMatch = text.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    let clean = text
    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        clean = text.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }
    if (clean.toLowerCase().includes('signature') && clean.toLowerCase().includes('technicien')) setShowSigTech(true)
    if (clean.toLowerCase().includes('signature') && clean.toLowerCase().includes('client')) setShowSigClient(true)
    if (clean.includes('PV_COMPLETE') || clean.toLowerCase().includes('pv signé') || clean.toLowerCase().includes('réception validée')) setCompleted(true)
    return { text: clean, choices }
  }

  async function sendMessage(content) {
    if (!content.trim() || loading) return
    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChoices([])
    setLoading(true)
    try {
      const res = await fetch('/api/pv/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          pvId: pv.id,
        }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      if (data.pvComplete) setCompleted(true)
      const { text, choices: c } = parseResponse(data.response)
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
      setChoices(c)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Erreur : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  async function handleSignature(type, dataUrl) {
    setSignatures(prev => ({ ...prev, [type]: dataUrl }))
    const field = type === 'tech' ? 'signature_tech_url' : 'signature_client_url'
    await fetch(`/api/pv/${pv.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: dataUrl }),
    })
    if (type === 'tech') setShowSigTech(false)
    if (type === 'client') setShowSigClient(false)
    sendMessage(`✍️ Signature ${type === 'tech' ? 'technicien' : 'client'} enregistrée`)
  }

  const deal = pv.deal

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0">PV</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">PV de Réception</p>
            <p className="text-gray-400 text-xs truncate">
              {deal?.client_prenom} {deal?.client_nom} · {deal?.produits?.join(', ')}
            </p>
          </div>
          {completed && (
            <span className="shrink-0 bg-emerald-500/15 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Signé ✓
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-52">
        {messages.map((msg, i) => (
          msg.role === 'assistant' ? (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-purple-500/20">C</div>
              <div className="flex-1 bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
                <p className="text-xs font-semibold text-purple-400 mb-2 uppercase tracking-wide">Chloé · PV Réception</p>
                <div
                  className="text-white text-base leading-relaxed space-y-1 [&_strong]:text-purple-300 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.content)}</p>` }}
                />
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] bg-purple-700 text-white rounded-2xl rounded-tr-sm px-5 py-3 text-base leading-relaxed shadow-md">
                {msg.content}
              </div>
            </div>
          )
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm">C</div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Zone fixe bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 max-w-2xl mx-auto w-full">
        {choices.length > 0 && !loading && (
          <div className="px-4 pt-4 pb-2 space-y-2">
            {choices.map((choice, i) => (
              <button key={i} onClick={() => sendMessage(choice)}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 active:bg-purple-600/30 border border-gray-700 hover:border-purple-500 text-white text-base font-medium px-5 py-3.5 rounded-xl transition-all flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                {choice}
              </button>
            ))}
          </div>
        )}

        {showSigTech && (
          <div className="px-4 pt-3">
            <p className="text-xs text-gray-400 mb-2">Signature du technicien</p>
            <SignaturePad onSaved={(type, dataUrl) => handleSignature('tech', dataUrl)} />
          </div>
        )}

        {showSigClient && (
          <div className="px-4 pt-3">
            <p className="text-xs text-gray-400 mb-2">Signature du client</p>
            <SignaturePad onSaved={(type, dataUrl) => handleSignature('client', dataUrl)} />
          </div>
        )}

        {completed && (
          <div className="px-4 pt-3">
            <button
              onClick={() => window.print()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
            >
              Télécharger / Imprimer le PV
            </button>
          </div>
        )}

        <div className="flex gap-2 p-4">
          <input type="text" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Tapez votre réponse..."
            disabled={loading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
          />
          <button onClick={() => sendMessage(input)} disabled={!input.trim() || loading}
            className="bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold">
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
