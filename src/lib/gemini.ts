import { GoogleGenAI } from '@google/genai'

export interface OutreachGenerationParams {
  leadName: string
  leadCategory?: string | null
  leadCity?: string | null
  entrepriseExpediteur?: string | null
  nomExpediteur?: string | null
  offre?: string | null
  beneficeClient?: string | null
  langue?: 'fr' | 'wo'
  canal?: 'whatsapp' | 'email' | 'voice'
}

export async function generateOutreachMessage({
  leadName,
  leadCategory,
  leadCity,
  entrepriseExpediteur,
  nomExpediteur,
  offre,
  beneficeClient,
  langue = 'fr',
  canal = 'whatsapp',
}: OutreachGenerationParams): Promise<{ objet?: string; corps: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY non configurée')
  }

  const ai = new GoogleGenAI({ apiKey })
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

  const senderName = nomExpediteur || 'notre équipe commerciale'
  const company = entrepriseExpediteur || 'notre entreprise'
  const offer = offre || 'nos solutions de croissance commerciale et digitale'
  const benefit = beneficeClient || 'développer votre visibilité et attirer de nouveaux clients'

  let prompt = ''

  if (canal === 'voice') {
    // Mode Note Vocale WhatsApp (Script parlé pour prompteur)
    if (langue === 'wo') {
      prompt = `Tu es un commercial sénégalais expert à Dakar.
Rédige un SCRIPT ORAL DE NOTE VOCALE WHATSAPP de 20 à 30 secondes, 100% en WOLOF SÉNÉGALAIS AUTHENTIQUE destiné à être lu au micro pour l'entreprise "${leadName}" (${leadCategory || 'commerce/entreprise'} à ${leadCity || 'Dakar'}).

Détails de l'expéditeur :
- Prénom/Nom : ${senderName} de l'entreprise ${company}
- Offre : ${offer}
- Bénéfice client : ${benefit}

Consignes strictes :
1. LE TEXTE DOIT ÊTRE ENTIÈREMENT EN WOLOF ORAL NATUREL (comme dans un vrai vocal WhatsApp).
2. Salutation chaleureuse sénégalaise ("Salaam aleekum, mbaa yàgg nga ci jàmm...").
3. Présentation directe et courtoise de ${senderName} (${company}).
4. Explique pourquoi tu envoies cette note vocale : proposition concrète avec ${offer} pour leur permettre d'obtenir ${benefit}.
5. Proposition orale amicale pour échanger quelques instants sur WhatsApp.
6. Ne renvoie AUCUN texte explicatif, AUCUNE mention de prompteur, UNIQUEMENT le texte en Wolof à prononcer au micro.`
    } else {
      prompt = `Tu es un commercial B2B chaleureux et dynamique.
Rédige un SCRIPT ORAL DE NOTE VOCALE WHATSAPP de 20 à 30 secondes, naturel et percutant en FRANÇAIS parlé, destiné à être enregistré au micro pour l'entreprise "${leadName}" (${leadCategory || 'commerce/entreprise'} à ${leadCity || 'Afrique'}).

Détails de l'expéditeur :
- Prénom/Nom : ${senderName} de l'entreprise ${company}
- Offre : ${offer}
- Bénéfice client : ${benefit}

Consignes strictes :
1. Ton oral, vivant et direct (comme une vraie note vocale spontanée et professionnelle).
2. Salutation polie et personnalisée ("Bonjour l'équipe de ${leadName}, c'est ${senderName}...").
3. Message concis (environ 4 à 5 phrases orales claires).
4. Mettre en valeur le bénéfice clé (${benefit}) sans jargon.
5. Inviter simplement le prospect à répondre par message texte ou vocal.
6. Ne renvoie AUCUN texte explicatif, UNIQUEMENT le texte à lire au micro.`
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })

    return { corps: response.text ? response.text.trim() : '' }
  } else if (canal === 'whatsapp') {
    if (langue === 'wo') {
      prompt = `Tu es un entrepreneur et commercial sénégalais expert à Dakar.
Rédige un message d'accroche WhatsApp COURT, percutant et 100% en WOLOF SÉNÉGALAIS authentique destiné à l'entreprise "${leadName}" (${leadCategory || 'commerce/entreprise'} à ${leadCity || 'Dakar'}).

Détails de l'expéditeur :
- Prénom/Nom : ${senderName} de l'entreprise ${company}
- Offre : ${offer}
- Bénéfice client : ${benefit}

Consignes strictes :
1. LE TEXTE DOIT ÊTRE ENTIÈREMENT EN WOLOF. Ne mets aucune phrase en français sauf le nom de l'entreprise si nécessaire.
2. Démarre par les salutations sénégalaises naturelles et respectueuses (ex: "Salaam aleekum, nanga def..." ou "Mbaa yàgg nga ci jàmm...").
3. Explique brièvement en Wolof que tu es ${senderName} de ${company} et ce que tu proposes (${offer}) pour leur permettre d'obtenir (${benefit}).
4. Message court (maximum 4 à 5 lignes), aéré avec 1 ou 2 emojis (👋, 🚀).
5. Termine par un appel à l'action simple en Wolof pour convenir d'un échange rapide (ex: "Ndax mën nañoo waxtaan 2 minutes ci WhatsApp ?").
6. Ne renvoie AUCUN texte explicatif, AUCUNE traduction en français, seulement le message prêt à envoyer.`
    } else {
      prompt = `Tu es un expert en prospection commerciale B2B en Afrique francophone.
Rédige un message d'accroche WhatsApp COURT, chaleureux, professionnel et percutant en FRANÇAIS adressé à l'entreprise "${leadName}" (${leadCategory || 'commerce'} à ${leadCity || 'Dakar'}).

Détails de l'expéditeur :
- Nom : ${senderName} de l'entreprise ${company}
- Offre : ${offer}
- Bénéfice : ${benefit}

Règles impératives :
- Salutation polie et personnalisée
- Court (maximum 4 à 5 lignes), adapté à WhatsApp, avec 1 ou 2 emojis professionnels
- Appel à l'action clair et direct (proposition d'un bref échange de 2 minutes)
- Ne renvoie QUE le texte du message prêt à être envoyé, sans fioritures ni guillemets.`
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })

    return { corps: response.text ? response.text.trim() : '' }
  } else {
    // Canal Email
    if (langue === 'wo') {
      prompt = `Tu es un copywriter sénégalais expert en prospection B2B à Dakar.
Rédige un email de prospection percutant ENTIÈREMENT EN WOLOF SÉNÉGALAIS adressé aux dirigeants de l'entreprise "${leadName}" (${leadCategory || 'commerce'} à ${leadCity || 'Dakar'}).

Expéditeur : ${senderName} (${company})
Offre : ${offer}
Bénéfice : ${benefit}

Consignes strictes :
1. L'OBJET et le CORPS du mail DOIVENT ÊTRE EN WOLOF SÉNÉGALAIS AUTHENTIQUE.
2. Ton professionnel, respectueux de la culture sénégalaise (Teranga).
3. Expose la valeur ajoutée en Wolof et propose un court rendez-vous ou appel.

Donne ta réponse exactement au format suivant :
OBJET: [L'objet de l'email en Wolof]
CORPS:
[Le corps du mail en Wolof, clair, poli avec appel à l'action en Wolof]`
    } else {
      prompt = `Tu es un copywriter B2B expert en Afrique francophone. Rédige un email de prospection percutant en FRANÇAIS pour l'entreprise "${leadName}" (${leadCategory || 'commerce'} à ${leadCity || 'Afrique'}).
Expéditeur : ${senderName} (${company})
Offre : ${offer}
Bénéfice : ${benefit}
Langue : Français

Donne ta réponse exactement au format suivant :
OBJET: [L'objet de l'email accrocheur en Français]
CORPS:
[Le corps du mail en Français, professionnel, clair, avec appel à l'action]`
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    })

    const text = response.text || ''
    const match = text.match(/OBJET:\s*(.*?)\n+CORPS:\s*([\s\S]*)/i)

    if (match) {
      return { objet: match[1].trim(), corps: match[2].trim() }
    }

    const fallbackSubject =
      langue === 'wo'
        ? `Waxtaan ak ${company} ngir ${leadName}`
        : `Opportunité de partenariat avec ${company}`

    return { objet: fallbackSubject, corps: text.trim() }
  }
}
