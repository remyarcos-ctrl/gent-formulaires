'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateInterventionModal() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [createdLink, setCreatedLink] = useState(null)
  const router = useRouter()

  const [form, setForm] = useState({
    technicien: '',
    client_nom: '',
    client_email: '',
    client_telephone: '',
    type_chantier: 'PAC',
    adresse: '',
  })

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/interventions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()
    if (data.id) {
      const link = `${window.location.origin}/intervention/${data.id}`
      setCreatedLink(link)
      router.refresh()
    }
    setLoading(false)
  }

  function copyAndClose() {
    navigator.clipboard.writeText(createdLink)
    setOpen(false)
    setCreatedLink(null)
    setForm({ technicien: '', client_nom: '', client_email: '', client_telephone: '', type_chantier: 'PAC', adresse: '' })
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
        <span>+</span> Nouvelle intervention
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl my-auto max-h-[90dvh] overflow-y-auto">
            {createdLink ? (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
                <h2 className="font-bold text-white text-lg">Intervention créée !</h2>
                <p className="text-sm text-gray-400">Lien à envoyer par SMS/WhatsApp au technicien :</p>
                <div className="bg-gray-800 rounded-lg p-3 text-xs text-sky-400 break-all font-mono">{createdLink}</div>
                <div className="flex gap-3">
                  <button onClick={copyAndClose} className="btn-primary flex-1">📋 Copier & Fermer</button>
                  <button onClick={() => { setOpen(false); setCreatedLink(null) }} className="btn-ghost flex-1">Fermer</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-white">Nouvelle intervention</h2>
                  <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">✕</button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Technicien *</label>
                      <input className="input" value={form.technicien} onChange={e => setForm({...form, technicien: e.target.value})} required />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Type *</label>
                      <select className="input" value={form.type_chantier} onChange={e => setForm({...form, type_chantier: e.target.value})}>
                        <option value="PAC">PAC</option>
                        <option value="ballon_thermodynamique">Ballon thermo.</option>
                        <option value="photovoltaique">Photovoltaïque</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Client *</label>
                    <input className="input" value={form.client_nom} onChange={e => setForm({...form, client_nom: e.target.value})} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email client</label>
                      <input type="email" className="input" value={form.client_email} onChange={e => setForm({...form, client_email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
                      <input className="input" value={form.client_telephone} onChange={e => setForm({...form, client_telephone: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Adresse *</label>
                    <input className="input" value={form.adresse} onChange={e => setForm({...form, adresse: e.target.value})} required />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
                      {loading ? 'Création...' : 'Créer & générer lien'}
                    </button>
                    <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Annuler</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
