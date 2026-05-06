'use client'

export default function AdminError({ error, reset }) {
  const isDbError = error?.message?.includes('DATABASE_URL') || error?.message?.includes('PrismaClient')

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-4xl">{isDbError ? '🗄️' : '⚠️'}</div>
        <h2 className="text-xl font-bold text-white">
          {isDbError ? 'Base de données non configurée' : 'Erreur'}
        </h2>
        {isDbError ? (
          <div className="text-left bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-2">
            <p className="text-gray-300 text-sm font-medium">Action requise :</p>
            <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
              <li>Aller sur <span className="text-sky-400">vercel.com → Storage → Add Postgres</span></li>
              <li>Copier <code className="text-emerald-400">DATABASE_URL</code> dans les variables d'env</li>
              <li>Ajouter votre <code className="text-emerald-400">ANTHROPIC_KEY</code></li>
              <li>Redéployer</li>
            </ol>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">{error?.message}</p>
        )}
        <button onClick={reset} className="btn-primary">Réessayer</button>
      </div>
    </div>
  )
}
