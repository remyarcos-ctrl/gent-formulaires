'use client'

import { useEffect, useRef } from 'react'
import { useChat } from '@/hooks/useChat'

/**
 * Rendu Markdown minimal pour les messages de Chloé.
 */
function renderMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
}

/**
 * Extrait les CHOICES et détecte le signal DEAL_DATA dans la réponse de l'IA.
 * @param {string} text - Texte brut renvoyé par l'API
 * @returns {{ text: string, choices: string[], completed: boolean }}
 */
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
  const completed = clean.includes('DEAL_DATA:') || clean.toLowerCase().includes('deal enregistré')
  return { text: clean, choices, completed }
}

export default function DealAgent({ dealId, onComplete, savedMessages = [] }) {
  // useChat gère : messages, loading, input, localStorage, fetch vers l'API
  const { messages, isLoading, input, setInput, sendMessage, clearHistory } = useChat({
    apiEndpoint: '/api/deal/chat',
    storageKey: `dealMessages_${dealId}`,
  })

  const messagesEndRef = useRef(null)

  // Défilement automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Initialisation : si des messages sauvegardés sont passés en props, on les utilise directement.
  // Sinon, l'appel d'ouverture est déclenché manuellement au montage.
  useEffect(() => {
    if (savedMessages.length > 0) return // localStorage ou props déjà chargé
    // Déclenche le message d'ouverture de Chloé
    sendMessage(`Commence la saisie d'un nouveau deal. Utilise la phrase d'ouverture de style n°${Math.ceil(Math.random() * 5)} parmi tes 5 variantes.`)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Wrapper autour de sendMessage : parse la réponse pour extraire
   * les CHOICES et détecter le signal DEAL_DATA.
   * Note : useChat stocke le texte brut ; on parse côté affichage.
   */
  async function handleSend(content) {
    await sendMessage(content)
    // La détection onComplete est faite via les messages à l'affichage
  }

  // Dériver choices et completed depuis le dernier message assistant
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
  const { choices, completed } = lastAssistant
    ? parseResponse(lastAssistant.content)
    : { choices: [], completed: false }

  // Déclencher onComplete si le deal vient d'être enregistré
  useEffect(() => {
    if (completed && onComplete) {
      // Tente d'extraire les dealData du dernier message
      const match = lastAssistant?.content.match(/DEAL_DATA:\s*(\{[\s\S]*\})/)
      if (match) {
        try { onComplete(JSON.parse(match[1])) } catch (e) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completed])

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5 pb-52">
        {messages.map((msg, i) => {
          const { text } = parseResponse(msg.content)
          return msg.role === 'assistant' ? (
            <div key={i} className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-sky-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-sky-500/20">C</div>
              <div className="flex-1 bg-gray-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-md">
                <p className="text-xs font-semibold text-sky-400 mb-2 uppercase tracking-wide">Chloé · Assistante HC</p>
                <div
                  className="text-white text-base leading-relaxed space-y-1 [&_strong]:text-sky-300 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdown(text)}</p>` }}
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
        })}
        {isLoading && (
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
        {choices.length > 0 && !isLoading && (
          <div className="px-4 pt-4 pb-2 space-y-2">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleSend(choice)}
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
            onKeyDown={e => e.key === 'Enter' && handleSend(input)}
            placeholder="Tapez votre réponse..."
            disabled={isLoading}
            className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20"
          />
          <button
            onClick={() => handleSend(input)}
            disabled={!input.trim() || isLoading}
            className="bg-sky-600 hover:bg-sky-500 active:scale-95 disabled:opacity-40 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all text-xl font-bold"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
