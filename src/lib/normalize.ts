import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import { getCountryCodeForRegion } from './africa' // On va créer ça pour mapper "Sénégal" -> "SN"

export function normalizeLeads(items: any[], searchId: string, userId: string) {
  const leads: any[] = []

  for (const item of items) {
    let telephoneE164 = null
    let isMobile = false
    let lienWhatsapp = null

    if (item.phone) {
      try {
        // En théorie, le pays doit être passé pour savoir quel code utiliser. 
        // Par défaut on tente une analyse flexible ou on force le parse avec le code du pays.
        // Google Maps renvoie souvent des numéros avec l'indicatif.
        const phoneNumber = parsePhoneNumber(item.phone, 'SN') // On mettra SN par défaut, mais ça devrait être dynamique
        if (phoneNumber.isValid()) {
          telephoneE164 = phoneNumber.number
          // Vérification basique du type (libphonenumber-js max permet de vérifier le type exact, on utilise une version basique)
          const type = phoneNumber.getType()
          isMobile = type === 'MOBILE' || type === 'FIXED_LINE_OR_MOBILE'
          
          if (isMobile) {
            lienWhatsapp = `https://wa.me/${telephoneE164.replace('+', '')}`
          }
        }
      } catch (e) {
        // Numéro invalide
      }
    }

    // Prendre la première catégorie si elle est dispo
    const categorie = item.categories && item.categories.length > 0 ? item.categories[0] : null

    leads.push({
      user_id: userId,
      search_id: searchId,
      place_id: item.placeId || item.title || Math.random().toString(), // fallback si placeId manque
      nom: item.title,
      categorie: categorie,
      adresse: item.address,
      telephone_brut: item.phone,
      telephone_e164: telephoneE164,
      is_mobile: isMobile,
      lien_whatsapp: lienWhatsapp,
      email: item.email || item.emails?.[0] || null,
      site_web: item.website,
      lien_google_maps: item.url,
      note: item.totalScore,
      nb_avis: item.reviewsCount,
      lat: item.location?.lat,
      lng: item.location?.lng,
      statut_prospection: 'nouveau',
    })
  }

  return leads
}
