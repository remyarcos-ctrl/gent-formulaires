'use client'

import { useState, useEffect, useRef } from 'react'

function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

export default function DealAgent({ dealId, onComplete, savedMessages = [] }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [choices, setChoices] = useState([])
  const [completed, setCompleted] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => { initChat() }, [])
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function initChat() {
    if (savedMessages.length > 0) {
      const lastAssistant = [...savedMessages].reverse().find(m => m.role === 'assistant')
      if (lastAssistant) {
        setMessages(savedMessages)
        return
      }
    }
    setLoading(true)
    try {
      const res = await fetch('/api/deal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [], dealId, context: "Commence la saisie d'un nouveau deal." }),
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
    if (clean.includes('DEAL_DATA:') || clean.toLowerCase().includes('deal enregistré')) setCompleted(true)
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
      const res = await fetch('/api/deal/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          dealId,
        }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const data = await res.json()
      if (data.dealData && onComplete) onComplete(data.dealData)
      const { text, choices: c } = parseResponse(data.response)
      setMessages(prev => [...prev, { role: 'assistant', content: text }])
      setChoices(c)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ Erreur : ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-52">
        {messages.map((msg, i) => (
          msg.role === 'assistant' ? (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">C</div>
              <div className="flex-1 bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
                <p className="text-xs font-semibold text-sky-400 mb-2 uppercase tracking-wide">Chloé · Assistante HC</p>
                <div
                  className="text-white text-base leading-relaxed space-y-1 [&_strong]:text-sky-300 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(msg.content)}</p>` }}
                />
              </div>
            </div>
          ) : (
            <div key={i} className="flex justify-end">
              <div className="max-w-[80%] bg-sky-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 text-base leading-relaxed shadow-md">
                {msg.content}
              </div>
            </div>
          )
        ))}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm">C</div>
            <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4">
              <div className="flex gap-1.5 items-center h-5">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 max-w-2xl mx-auto w-full">
        {choices.length > 0 && !loading && (
          <div className="px-4 pt-4 pb-2 space-y-2">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => sendMessage(choice)}
                className="w-full text-left bg-gray-800 hover:bg-gray-700 active:bg-sky-600/30 border border-gray-700 hover:border-sky-500 text-white text-base font-medium px-5 py-3.5 rounded-xl transition-all flex items-center gap-3"
              >
                <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {choice}
              </button>
            ))}
          </div>
        )}
        {completed && (
          <div className="px-4 pt-3">
            <div className="w-full bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 font-semibold text-base py-3 px-5 rounded-2xl text-center">
              ✅ Deal enregistré avec succès
            </div>
          </div>
        )}
        <div className="flex gap-2 p-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Tapez votre réponse..."
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
    </div>
  )
}
