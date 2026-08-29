'use client'

import { useState, useEffect, useRef } from 'react'
import PhotoUpload from './PhotoUpload'
import SignaturePad from './SignaturePad'

export default function ChatAgent({ intervention }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [choices, setChoices] = useState([])
  const [showPhoto, setShowPhoto] = useState(false)
  const [showSig, setShowSig] = useState(false)
  const [photos, setPhotos] = useState([])
  const [signatures, setSignatures] = useState({})
  const [completed, setCompleted] = useState(false)
  const [formData, setFormData] = useState({})
  const messagesEndRef = useRef(null)

  useEffect(() => {
    initChat()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function initChat() {
    setLoading(true)
    const systemContext = `Tu guides ${intervention.technicien} pour l'intervention de type ${intervention.type_chantier} chez ${intervention.client_nom} à ${intervention.adresse}. Commence par te présenter brièvement et pose ta première question pour commencer la collecte des informations.`

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        interventionId: intervention.id,
        context: systemContext,
      }),
    })

    const data = await res.json()
    const { text, choices: newChoices } = parseResponse(data.response)
    setMessages([{ role: 'assistant', content: text }])
    setChoices(newChoices)
    setLoading(false)
  }

  function parseResponse(text) {
    const choicesMatch = text.match(/CHOICES:\s*(\[.*?\])/s)
    let choices = []
    let cleanText = text

    if (choicesMatch) {
      try {
        choices = JSON.parse(choicesMatch[1])
        cleanText = text.replace(/CHOICES:\s*\[.*?\]/s, '').trim()
      } catch (e) {}
    }

    if (cleanText.toLowerCase().includes('photo') || cleanText.toLowerCase().includes('cliché')) {
      setShowPhoto(true)
    }
    if (cleanText.toLowerCase().includes('signature')) {
      setShowSig(true)
    }
    if (cleanText.toLowerCase().includes('terminé') || cleanText.toLowerCase().includes('intervention complète') || cleanText.toLowerCase().includes('soumettre')) {
      setCompleted(true)
    }

    return { text: cleanText, choices }
  }

  async function sendMessage(content) {
    if (!content.trim() || loading) return

    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setChoices([])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        interventionId: intervention.id,
      }),
    })

    const data = await res.json()

    if (data.formData) {
      setFormData(prev => ({ ...prev, ...data.formData }))
    }

    const { text, choices: newChoices } = parseResponse(data.response)
    setMessages(prev => [...prev, { role: 'assistant', content: text }])
    setChoices(newChoices)
    setLoading(false)
  }

  async function handleComplete() {
    setLoading(true)
    await fetch(`/api/interventions/${intervention.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statut: 'terminee',
        photos_urls: photos,
        signature_client_url: signatures.client || null,
        signature_tech_url: signatures.tech || null,
        ...formData,
      }),
    })

    await fetch('/api/automatisations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interventionId: intervention.id,
        messages,
        formData,
        photos,
        signatures,
      }),
    })

    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '✅ Intervention soumise avec succès ! La fiche PDF a été générée, l\'événement ajouté au calendrier et le client notifié par email.',
    }])
    setCompleted(false)
    setLoading(false)
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col max-w-2xl mx-auto w-full">
      <div className="app-scroll p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold mr-2 mt-0.5 shrink-0">L</div>
            )}
            <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-sky-600 text-white rounded-br-md'
                : 'bg-gray-800 text-gray-100 rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-xs font-bold mr-2 mt-0.5">L</div>
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0ms]"></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:150ms]"></div>
                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:300ms]"></div>
              </div>
            </div>
          </div>
        )}

        {choices.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 pl-9">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => sendMessage(choice)}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-sky-500 text-gray-200 text-sm px-3 py-1.5 rounded-xl transition-all"
              >
                {choice}
              </button>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="app-bar bg-gray-950 border-t border-gray-800 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-2 max-w-2xl mx-auto w-full">
        {showPhoto && (
          <PhotoUpload
            interventionId={intervention.id}
            onUploaded={(url) => {
              setPhotos(prev => [...prev, url])
              sendMessage(`📸 Photo ajoutée : ${url}`)
              setShowPhoto(false)
            }}
          />
        )}

        {showSig && (
          <SignaturePad
            onSaved={(type, dataUrl) => {
              setSignatures(prev => ({ ...prev, [type]: dataUrl }))
              sendMessage(`✍️ Signature ${type === 'client' ? 'client' : 'technicien'} enregistrée`)
              setShowSig(false)
            }}
          />
        )}

        {completed && (
          <button
            onClick={handleComplete}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Soumission...' : '✅ Valider et soumettre l\'intervention'}
          </button>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
            placeholder="Votre réponse..."
            className="input flex-1 text-base"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="btn-primary px-4 disabled:opacity-50"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
