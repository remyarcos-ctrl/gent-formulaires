import './globals.css'

export const metadata = {
  title: 'Happy Confort — Gestion Interventions',
  description: 'Plateforme IA de gestion des interventions terrain',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  )
}
