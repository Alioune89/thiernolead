# Walkthrough — Guide Complet du Projet Laplead (thiernilead) de A à Z

> **Règle Fondamentale pour l'Agent :**
> À chaque fois que tu t'adresses à l'utilisateur, tu DOIS TOUJOURS commencer ton message par la salutation suivante :  
> `assalamu alaykoum alioune.`

---

## 1. Vue d'Ensemble & Mission

* **Nom du Produit :** Laplead (Répertoire du projet : `thiernilead`)
* **Mission :** Le 1er Moteur B2B de génération de leads et de prospection intelligente par IA (Texte & Note Vocale) conçu pour le continent africain (54 pays).
* **Cible :** Agences web/marketing, commerciaux B2B, entrepreneurs et prestataires de services qui ciblent les entreprises locales (pharmacies, restaurants, cliniques, commerces, etc.) en Afrique.
* **Modèle Économique :** Système de crédits sans abonnement contraignant. 1 crédit = 1 prospect complet qualifié (téléphone, adresse, avis, site web, et pitch de contact IA). Recharges par Mobile Money (Wave, Orange Money, MTN MoMo, Free Money, Moov Money) et Cartes Bancaires.

---

## 2. Stack Technique

* **Framework :** Next.js 16 (App Router), React 19, TypeScript strict.
* **Styling :** Tailwind CSS v4, Vanilla CSS (`globals.css`), Radix UI / Shadcn, Lucide React, Sonner (Toaster).
* **Base de Données & Authentification :** Supabase (PostgreSQL, Supabase Auth, Row Level Security - RLS).
* **Moteur d'Extraction B2B :** Apify API (`compass/crawler-google-places`) pour scraper Google Maps / Google Places en temps réel.
* **Normalisation Téléphonique :** `libphonenumber-js` (format international E.164, détection automatique des mobiles et génération instantanée des liens `wa.me`).
* **Intelligence Artificielle & Copywriting :** Google Gemini API (`@google/genai` avec `gemini-3.5-flash-lite`), générant des messages personnalisés en **Français 🇫🇷** et en **Wolof sénégalais authentique 🇸🇳**.
* **Studio Vocal :** Web Audio API / MediaRecorder dans le navigateur, formaté façon **Wave** (écoute avec onde sonore interactive waveform, bouton de suppression immédiate, téléchargement `.webm`, ouverture WhatsApp direct).

---

## 3. Architecture & Structure des Fichiers (A à Z)

### Configuration & Base
* `next.config.ts` : Configuration Next.js (optimisée sans flags expérimentaux conflictuels).
* `package.json` : Dépendances clés (`@google/genai`, `apify-client`, `@supabase/ssr`, `libphonenumber-js`, `sonner`, `lucide-react`).
* `.env.local` : Variables d'environnement (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `APIFY_TOKEN`, `GEMINI_API_KEY`, `GEMINI_MODEL`).
* `src/app/globals.css` : Thème signature (`#082115` fond émeraude profond, `#F05A5A` corail vivant, panneaux en verre dépoli `.glass-panel`, protection anti-débordement mobile `overflow-x: hidden`).
* `src/app/layout.tsx` : Root layout avec polices Google (*Plus Jakarta Sans* et *JetBrains Mono*) et `<Toaster richColors position="top-right" />`.

### Authentification & Shell Applicatif
* `src/app/page.tsx` : Landing Page vitrine haute conversion (Mockup interactif, 54 pays africains, 3 étapes, tarifs, social proof).
* `src/app/(auth)/login/page.tsx` : Page de connexion et création de compte instantanée avec 20 crédits offerts.
* `src/app/(app)/layout.tsx` : Layout sécurisé avec en-tête en verre dépoli, pilule de crédits avec lien de recharge rapide, avatar utilisateur et barre de navigation mobile responsive.

### Dashboard & Recherches
* `src/app/(app)/dashboard/page.tsx` :
  * 4 Cartes KPI : Total Leads extraits, Recherches réussies, Marchés africains, Couverture B2B.
  * Formulaire de recherche `SearchForm.tsx`.
  * Liste chronologique de l'historique des recherches avec badges de statut (`Prêt`, `En cours`, `Échec`).
* `src/components/dashboard/SearchForm.tsx` :
  * Sélection interactive parmi les 54 pays africains (`AFRICAN_COUNTRIES`).
  * Détection automatique de la capitale et des villes majeures, avec option "Autre ville personnalisée".
  * Chips de suggestions rapides (`+Dentiste`, `+Pharmacie`, `+Restaurant`, etc.).
  * Choix du volume (20, 50, 100, 200 leads).
* `src/actions/searches.ts` :
  * Action serveur orchestrant la vérification de l'utilisateur et de son solde de crédits.
  * Déduction / réservation des crédits dans `profiles` et `credit_transactions`.
  * Lancement synchrone d'Apify Google Maps Scraper (`runGoogleMapsScraperSync`).
  * Déduplication des doublons par `place_id`.
  * Insertion des leads via le client administrateur `createAdminClient()`.
  * **Protection Garantie Zéro Perte :** En cas d'erreur ou de résultat vide, remboursement automatique des crédits à l'utilisateur.

### Page de Détail & Prospection IA
* `src/app/(app)/searches/[id]/page.tsx` : Route serveur chargeant les détails de la recherche et les leads associés, passant les données à `SearchDetailView`.
* `src/components/searches/SearchDetailView.tsx` :
  * Stepper visuel animé en 3 étapes avec chronomètre en direct pour les recherches en cours.
  * Polling automatique toutes les 2,5s via `/api/searches/[id]/status`.
  * Bouton d'export CSV complet (`/api/searches/[id]/export`).
  * **Barre de filtres intelligents :** `Tous`, `Avec WhatsApp`, `Avec Site Web`, et **`Sans Site Web`** (pour cibler les commerces sans présence en ligne).
  * **Modale de Pitch Commercial IA :**
    * Switch de langue instantané : 🇫🇷 Français vs 🇸🇳 Wolof.
    * Switch de canal : `WhatsApp Texte`, `Note Vocale` (Studio Wave), `Email`.
    * **Studio Note Vocale Style Wave :**
      * Prompteur oral IA sous les yeux.
      * Bouton d'enregistrement avec ondes sonores animées et timer.
      * Lecteur Waveform audio sur-mesure (barres interactives qui se colorent au fil de l'écoute).
      * Bouton **Supprimer 🗑️** pour jeter le vocal et recommencer si besoin.
      * Bouton **Télécharger (.webm)** et Bouton **Ouvrir WhatsApp direct (`wa.me`)**.

### Facturation & Paramètres
* `src/app/(app)/billing/page.tsx` :
  * Packs de crédits : Pack Découverte (100 crédits / 5 000 FCFA), Pack Croissance Pro (500 crédits / 20 000 FCFA), Pack Entreprise (1 500 crédits / 50 000 FCFA).
  * Badges des moyens de paiement africains : Wave, Orange Money, MTN MoMo, Free Money, Moov Money, Cartes Bancaires.
  * Historique détaillé des transactions de crédits.
* `src/app/(app)/settings/page.tsx` :
  * Profil commercial : Entreprise, Expéditeur, Numéro WhatsApp, Langue par défaut, Offre commerciale et Bénéfice client.
  * Aperçu en direct du gabarit de prospection utilisé par Gemini.

### API Routes & Libs
* `src/app/api/searches/[id]/status/route.ts` : Endpoint renvoyant le statut en direct de la recherche.
* `src/app/api/searches/[id]/export/route.ts` : Téléchargement du fichier CSV formaté.
* `src/app/api/leads/[id]/generate-message/route.ts` : Endpoint recevant `langue` et `canal` et appelant Gemini pour sauvegarder le résultat dans `messages`.
* `src/lib/gemini.ts` : Moteur de génération IA avec consignes culturelles sénégalaises et africaines rigoureuses.
* `src/lib/apify.ts` : Client Apify pour Google Places.
* `src/lib/africa.ts` : Données structurées des 54 pays africains, indicatifs téléphoniques et capitales.
* `src/lib/normalize.ts` : Normalisation E.164 et détection WhatsApp via `libphonenumber-js`.
* `src/lib/supabase/` : `client.ts` (browser), `server.ts` (SSR avec cookies), `admin.ts` (service role bypass RLS pour les tâches de fond).

---

## 4. Schéma de la Base de Données (PostgreSQL / Supabase)

* `profiles` : `id (UUID FK auth.users)`, `credits (INT)`, `entreprise (TEXT)`, `offre (TEXT)`, `benefice_client (TEXT)`, `nom_expediteur (TEXT)`, `telephone_expediteur (TEXT)`, `langue_defaut (TEXT)`, `onboarded (BOOLEAN)`.
* `searches` : `id (UUID)`, `user_id (UUID)`, `secteur (TEXT)`, `ville (TEXT)`, `pays (TEXT)`, `statut (TEXT)`, `results_count (INT)`, `credits_reserved (INT)`, `credits_billed (INT)`, `error (TEXT)`.
* `leads` : `id (UUID)`, `search_id (UUID)`, `user_id (UUID)`, `place_id (TEXT)`, `nom (TEXT)`, `categorie (TEXT)`, `adresse (TEXT)`, `telephone_brut (TEXT)`, `telephone_e164 (TEXT)`, `is_mobile (BOOLEAN)`, `lien_whatsapp (TEXT)`, `site_web (TEXT)`, `lien_google_maps (TEXT)`, `note (NUMERIC)`, `nb_avis (INT)`.
* `credit_transactions` : `id (UUID)`, `user_id (UUID)`, `amount (INT)`, `motif (TEXT)`, `created_at (TIMESTAMP)`.
* `messages` : `id (UUID)`, `lead_id (UUID)`, `user_id (UUID)`, `canal (TEXT)`, `langue (TEXT)`, `objet (TEXT)`, `corps (TEXT)`, `modele (TEXT)`.

---

## 5. Règles Critiques d'Exécution pour les Futurs Agents

1. **Salutation Obligatoire :** Tout agent DOIT saluer Alioune avec `assalamu alaykoum alioune.`.
2. **Next.js 16 :** Utiliser `await connection()` dans les pages serveur accédant aux cookies ou headers.
3. **Sécurité des Crédits :** Ne jamais débiter de crédits si une recherche échoue. Toujours prévoir le remboursement automatique.
4. **Design & Esthétique :** Respecter l'identité visuelle de `gemini.md` : fond vert forêt `#082115`, accent corail `#F05A5A`, cartes blanches lumineuses, responsive mobile irréprochable sans débordement horizontal.
5. **Walkthrough Systématique de Clôture :** À chaque finition d'un projet, d'un chantier majeur ou d'une demande utilisateur, l'agent DOIT AUTOMATIQUEMENT fournir un **Walkthrough complet** détaillant tout ce qui a été fait, comment tester chaque élément, les routes concernées et les bénéfices apportés.
