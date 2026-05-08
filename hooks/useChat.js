'use client'
import { useState, useEffect } from 'react'

/**
 * Hook générique pour gérer une conversation avec un agent IA.
 * Centralise la logique commune à tous les agents (messages, loading, localStorage, fetch).
 *
 * @param {string} apiEndpoint - Route API à appeler (ex: '/api/deal/chat')
 * @param {string|null} storageKey - Clé localStorage pour persister l'historique (null = pas de persistance)
 * @param {string|null} initialMessage - Message initial de l'assistant si aucun historique trouvé
 */
export function useChat({ apiEndpoint, storageKey, initialMessage = null }) {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [input, setInput] = useState('')

  // Charger l'historique depuis localStorage au montage
  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try { setMessages(JSON.parse(saved)) } catch {}
      } else if (initialMessage) {
        setMessages([{ role: 'assistant', content: initialMessage }])
      }
    } else if (initialMessage) {
      setMessages([{ role: 'assistant', content: initialMessage }])
    }
  }, [])

  // Sauvegarder dans localStorage à chaque changement de messages
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    }
  }, [messages, storageKey])

  /**
   * Envoie un message utilisateur à l'API et ajoute la réponse de l'assistant.
   * @param {string} content - Contenu du message
   */
  async function sendMessage(content) {
    if (!content.trim() || isLoading) return

    const userMsg = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })
      const data = await res.json()
      // Supporte les différents formats de réponse API
      const reply = data.reply || data.message || data.content || 'Pas de réponse.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erreur de connexion.' }])
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Efface l'historique de conversation (mémoire + localStorage).
   */
  function clearHistory() {
    setMessages(initialMessage ? [{ role: 'assistant', content: initialMessage }] : [])
    if (storageKey) localStorage.removeItem(storageKey)
  }

  return { messages, isLoading, input, setInput, sendMessage, clearHistory }
}
