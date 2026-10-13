// Source unique des règles de crédits et des packs vendus via Moneroo.
// Le prix d'un pack est TOUJOURS relu ici côté serveur au moment du checkout :
// ne jamais faire confiance à un montant envoyé par le navigateur.

/** Crédits offerts à chaque nouveau compte (et une fois aux comptes existants, cf. migration 0002). */
export const WELCOME_CREDITS = 5

/** Coût fixe d'une génération de leads (une recherche), quel que soit le volume demandé. */
export const CREDITS_PER_SEARCH = 3

/** Volumes proposés au formulaire ; le serveur refuse toute autre valeur (le coût étant fixe). */
export const SEARCH_VOLUMES = [10, 20, 50, 100, 200] as const

export const CURRENCY = 'XOF' as const

export type CreditPack = {
  id: string
  name: string
  credits: number
  /** Montant en FCFA (XOF, unité entière, pas de centimes). */
  price: number
  description: string
  popular: boolean
  badge?: string
  features: string[]
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'pack_starter',
    name: 'Pack Découverte',
    credits: 100,
    price: 5000,
    description: 'Parfait pour tester une première campagne locale ciblée.',
    popular: false,
    features: [
      'Extraction directe Google Maps & Annuaire',
      'Téléphones normalisés + liens WhatsApp directs',
      'Pitchs personnalisés WhatsApp & Email via IA',
      'Export CSV illimité en 1 clic',
      'Validité des crédits à vie',
    ],
  },
  {
    id: 'pack_pro',
    name: 'Pack Croissance Pro',
    credits: 500,
    price: 20000,
    description: 'Le choix privilégié des commerciaux et agences en expansion.',
    popular: true,
    badge: 'Le Plus Populaire',
    features: [
      'Déduplication automatique intelligente',
      'Génération copywriting IA en Français & Wolof',
      'Lien WhatsApp clic-et-contact instantané',
      'Extraction multi-villes et quartiers',
      'Support prioritaire par WhatsApp dédié',
    ],
  },
  {
    id: 'pack_business',
    name: 'Pack Entreprise',
    credits: 1500,
    price: 50000,
    description: 'Pour les équipes de vente et agences à gros volume panafricain.',
    popular: false,
    badge: 'Meilleur Prix / Crédit',
    features: [
      'Couverture des 54 pays africains',
      'Prix par crédit le plus bas',
      'Accès anticipé aux nouveaux modèles IA',
      'Account Manager dédié 7j/7',
    ],
  },
]

export function getPack(packId: string): CreditPack | undefined {
  return CREDIT_PACKS.find((p) => p.id === packId)
}

/** Nombre de générations de leads qu'un solde permet de lancer. */
export function searchesFor(credits: number): number {
  return Math.floor(credits / CREDITS_PER_SEARCH)
}
