import './globals.css'

export const metadata = {
  title: 'Happy Confort — Gestion Interventions',
  description: 'Plateforme IA de gestion des interventions terrain',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Le clavier mobile réduit la hauteur du contenu au lieu de le recouvrir
  interactiveWidget: 'resizes-content',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
