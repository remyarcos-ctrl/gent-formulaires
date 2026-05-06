'use client'

export default function GlobalError({ error, reset }) {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">⚠️</div>
        <h2 className="text-xl font-bold text-white">Erreur serveur</h2>
        <p className="text-gray-400 text-sm">{error?.message || 'Une erreur inattendue est survenue.'}</p>
        <button onClick={reset} className="btn-primary">Réessayer</button>
      </div>
    </div>
  )
}
