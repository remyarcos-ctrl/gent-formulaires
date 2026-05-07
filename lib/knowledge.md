# Base de connaissance Chloé — Happy Confort

## L'entreprise
- **Nom** : Happy Confort
- **Secteur** : Installation d'équipements énergétiques (pompes à chaleur, photovoltaïque, climatisation, ballon thermodynamique, poêles)
- **Zone géographique** : Saint-Étienne et alentours (Loire, Haute-Loire, Rhône)
- **Interlocuteur principal** : le beau gosse (gérant)

## Produits installés
- **PAC air/eau** : pompe à chaleur pour chauffage central (radiateurs ou plancher chauffant)
- **PAC air/air / Climatisation** : unités intérieures et extérieures, réversibles
- **Ballon thermodynamique** : production d'eau chaude sanitaire
- **Panneaux photovoltaïques (PV)** : production d'électricité, avec ou sans batterie
- **Poêle** : bois ou granulés, appoint chauffage
- **Climatisation** : mono ou multi-split

## Aides financières disponibles
- **MaPrimeRénov (MPR)** : selon revenus du foyer (barèmes ANAH), vérifier toujours l'éligibilité
- **CEE** (Certificats d'Économie d'Énergie) : prime énergie versée par les fournisseurs
- **Aides locales** : selon département/région, variables
- Règle : toujours vérifier les revenus et la composition du foyer pour estimer les aides

## Workflow standard
1. **Deal** — le commercial saisit la vente via Chloé sur /deal/new
2. **Assignation technicien** — le beau gosse assigne un tech via l'admin
3. **Notification** — le tech reçoit un lien WhatsApp + Telegram vers sa fiche intervention
4. **Visite technique (VT)** — avant chantier, pour valider les mesures et commandes
5. **Chantier** — installation par le technicien
6. **PV de réception** — signature client + tech sur /pv/[id], envoi email au client

## Délais standards (À COMPLÉTER par le gérant)
- Entre vente et visite technique : ~XX jours
- Entre VT et chantier : ~XX jours
- Délai réserve (date administrative) : au moins J+30 après vente

## Commerciaux (À COMPLÉTER)
- À renseigner : noms des commerciaux et leurs zones/spécialités

## Techniciens et spécialités (À COMPLÉTER)
- À renseigner : qui fait quoi (PAC, PV, clim, polyvalent…)

## Fourchettes de prix moyens (À COMPLÉTER — pour détecter les anomalies)
- PAC air/eau : entre XXX€ et XXX€ CAHT
- PAC air/air / Clim : entre XXX€ et XXX€ CAHT
- Ballon thermodynamique : entre XXX€ et XXX€ CAHT
- Panneaux PV : entre XXX€ et XXX€ CAHT
- Poêle : entre XXX€ et XXX€ CAHT

## Règles métier importantes
- Désembouage recommandé si radiateurs anciens (fonte) + remplacement par PAC
- Toujours vérifier la puissance électrique disponible avant PAC triphasée
- Pour PV : vérifier orientation toiture (sud idéal, sud-est/sud-ouest acceptables)
- Date administrative = date de fin de délai de rétractation (14 jours légaux minimum, J+30 si réserves)
- Avis d'imposition obligatoire pour calculer les aides MPR

## Alertes à surveiller
- Deal sans technicien assigné depuis plus de 3 jours → alerter le beau gosse
- VT prévue dans moins de 48h sans confirmation → signaler
- Deal "complet" sans date de chantier → relancer
- Marge inférieure à XX% → signaler comme anomalie (À COMPLÉTER)

## Navigation dans l'application
- Créer un deal : /deal/new
- Liste des deals : /admin/deals
- Détail d'un deal : /admin/deals/[id]
- Fiche intervention technicien : /intervention/[id]
- PV de réception : /pv/[id]
- Dashboard analytics : /admin/analytics
