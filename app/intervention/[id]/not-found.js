export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className="text-5xl">🔗</div>
        <h1 className="text-xl font-bold text-white">Lien invalide</h1>
        <p className="text-gray-400 text-sm">Ce lien d'intervention n'existe pas ou a expiré.</p>
        <p className="text-gray-500 text-xs">Contactez votre responsable pour obtenir un nouveau lien.</p>
      </div>
    </div>
  )
}
