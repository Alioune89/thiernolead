'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Download,
  MapPin,
  Globe,
  Phone,
  MessageSquare,
  Sparkles,
  Search as SearchIcon,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RotateCcw,
  Star,
  Check,
  Send,
  Mic,
  Square,
  Radio,
  Volume2,
  Trash2,
  Play,
  Pause,
} from 'lucide-react'
import { toast } from 'sonner'

interface Lead {
  id: string
  nom: string
  categorie: string | null
  adresse: string | null
  telephone_brut: string | null
  telephone_e164: string | null
  is_mobile: boolean
  lien_whatsapp: string | null
  email: string | null
  site_web: string | null
  lien_google_maps: string | null
  note: number | null
  nb_avis: number | null
}

interface SearchItem {
  id: string
  secteur: string
  ville: string
  pays: string
  statut: 'pending' | 'running' | 'succeeded' | 'failed'
  results_count: number
  credits_reserved: number
  credits_billed: number
  error: string | null
  created_at: string
  updated_at: string
}

const WAVE_BARS = [35, 60, 85, 45, 95, 70, 50, 80, 100, 65, 40, 90, 75, 55, 85, 95, 40, 70, 85, 60, 45, 75, 50, 85, 65, 40, 60, 50]

export function SearchDetailView({
  search: initialSearch,
  leads: initialLeads,
}: {
  search: SearchItem
  leads: Lead[]
}) {
  const [search, setSearch] = useState<SearchItem>(initialSearch)
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [searchFilter, setSearchFilter] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'whatsapp' | 'website' | 'no-website'>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [pitchLang, setPitchLang] = useState<'fr' | 'wo'>('fr')
  const [pitchChannel, setPitchChannel] = useState<'whatsapp' | 'voice' | 'email'>('whatsapp')
  const [isGeneratingPitch, setIsGeneratingPitch] = useState(false)
  const [generatedPitch, setGeneratedPitch] = useState<{ objet?: string; corps: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Voice recording state & refs
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  const [audioCurrentTime, setAudioCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

  const router = useRouter()
  const isRunning = search.statut === 'pending' || search.statut === 'running'

  // Synchronisation des props serveur avec le state React
  useEffect(() => {
    if (initialLeads && initialLeads.length > 0) {
      setLeads(initialLeads)
    }
  }, [initialLeads])

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch)
    }
  }, [initialSearch])

  // Timer & Real-time Polling ultra-réactif (1.5s avec anti-cache pour mobile)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      const startTime = Date.now()
      interval = setInterval(async () => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))

        try {
          const res = await fetch(`/api/searches/${search.id}/status?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
          })

          if (res.ok) {
            const data = await res.json()
            if (data.search && data.search.statut !== 'running' && data.search.statut !== 'pending') {
              if (interval) clearInterval(interval)
              setSearch((prev) => ({ ...prev, ...data.search }))
              if (data.leads && Array.isArray(data.leads) && data.leads.length > 0) {
                setLeads(data.leads)
              }
              // Rechargement immédiat et sans cache pour afficher les résultats sur mobile et desktop
              window.location.reload()
            }
          }
        } catch (err) {
          console.error('Erreur polling:', err)
        }
      }, 1500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, search.id, router])

  // Nettoyage de l'enregistrement audio
  const cleanupAudio = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.error(e)
      }
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setIsRecording(false)
    setRecordingTime(0)
    setAudioUrl(null)
    setIsPlayingAudio(false)
    setAudioCurrentTime(0)
    setAudioDuration(0)
  }

  // Fermeture du modal
  const handleCloseModal = () => {
    cleanupAudio()
    setSelectedLead(null)
    setGeneratedPitch(null)
  }

  // Démarrer l'enregistrement vocal
  const startRecording = async () => {
    try {
      cleanupAudio()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      audioChunksRef.current = []

      let mimeType = 'audio/webm'
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus'
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm'
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4'
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg'
        }
      }

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType })
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)
      }

      recorder.start(100)
      setIsRecording(true)
      setRecordingTime(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err: any) {
      console.error('Erreur accès micro:', err)
      toast.error('Accès au microphone refusé ou non disponible. Veuillez autoriser le micro.')
    }
  }

  // Arrêter l'enregistrement vocal
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
        recordingTimerRef.current = null
      }
      setIsRecording(false)
      toast.success('Note vocale prête ! Écoutez-la ou supprimez-la avant envoi.')
    }
  }

  // Lecture / Pause Audio
  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return
    if (isPlayingAudio) {
      audioPlayerRef.current.pause()
      setIsPlayingAudio(false)
    } else {
      audioPlayerRef.current.play()
      setIsPlayingAudio(true)
    }
  }

  // Sauter dans l'audio via l'onde sonore
  const seekAudio = (percent: number) => {
    if (!audioPlayerRef.current) return
    const dur = audioPlayerRef.current.duration || audioDuration || recordingTime
    if (dur > 0) {
      const newTime = percent * dur
      audioPlayerRef.current.currentTime = newTime
      setAudioCurrentTime(newTime)
    }
  }

  // Supprimer la note vocale (fonction style Wave demandée par l'utilisateur)
  const handleDeleteAudio = () => {
    cleanupAudio()
    toast.info('Message vocal supprimé. Vous pouvez réenregistrer.')
  }

  // Télécharger la note vocale
  const downloadVoiceNote = () => {
    if (!audioUrl || !selectedLead) return
    const a = document.createElement('a')
    a.href = audioUrl
    const safeName = selectedLead.nom.replace(/[^a-zA-Z0-9]/g, '_')
    a.download = `vocal_${safeName}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success('Fichier vocal téléchargé ! Glissez-le directement dans votre conversation WhatsApp.')
  }

  // Formatage des secondes
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = Math.floor(sec % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Génération du pitch par IA
  const handleOpenPitchModal = async (lead: Lead) => {
    setSelectedLead(lead)
    cleanupAudio()
    setGeneratedPitch(null)
    setCopied(false)
    await generatePitch(lead, pitchLang, pitchChannel)
  }

  const generatePitch = async (lead: Lead, lang: 'fr' | 'wo', channel: 'whatsapp' | 'voice' | 'email') => {
    setIsGeneratingPitch(true)
    setGeneratedPitch(null)
    try {
      const res = await fetch(`/api/leads/${lead.id}/generate-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ langue: lang, canal: channel }),
      })
      const data = await res.json()
      if (data.success) {
        setGeneratedPitch({ objet: data.objet, corps: data.corps })
      } else {
        toast.error(data.error || 'Erreur lors de la génération')
      }
    } catch {
      toast.error('Erreur de connexion au service IA')
    } finally {
      setIsGeneratingPitch(false)
    }
  }

  const handleCopyPitch = () => {
    if (!generatedPitch) return
    const textToCopy = generatedPitch.objet
      ? `Objet: ${generatedPitch.objet}\n\n${generatedPitch.corps}`
      : generatedPitch.corps
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    toast.success('Message copié dans le presse-papier !')
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtrage des leads
  const filteredLeads = leads.filter((lead) => {
    const matchesText =
      lead.nom.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.categorie || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (lead.adresse || '').toLowerCase().includes(searchFilter.toLowerCase())

    if (!matchesText) return false
    if (filterType === 'whatsapp') return !!lead.lien_whatsapp || !!lead.telephone_e164
    if (filterType === 'website') return !!lead.site_web
    if (filterType === 'no-website') return !lead.site_web
    return true
  })

  const whatsappLeadsCount = leads.filter((l) => l.lien_whatsapp || l.telephone_e164).length
  const websiteLeadsCount = leads.filter((l) => l.site_web).length
  const noWebsiteLeadsCount = leads.filter((l) => !l.site_web).length

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-16 w-full overflow-hidden">
      {/* 1. ÉCRAN TEMPS RÉEL DE CHARGEMENT */}
      {isRunning && (
        <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-2xl overflow-hidden p-5 sm:p-8">
          <div className="max-w-2xl mx-auto space-y-5 text-center">
            <div className="inline-flex p-3 bg-red-50 text-[#E55B5B] rounded-2xl animate-pulse">
              <Sparkles className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Extraction des entreprises en direct...
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm">
                Cible : <span className="font-semibold text-slate-900">{search.secteur}</span> à{' '}
                <span className="font-semibold text-slate-900">{search.ville}, {search.pays}</span>
              </p>
            </div>

            {/* Stepper visuel à 3 étapes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#E55B5B]">
                  <span className="flex h-2 w-2 rounded-full bg-[#E55B5B] animate-ping" />
                  Étape 1
                </div>
                <p className="text-xs font-semibold text-slate-800">Scraping Google Maps</p>
                <p className="text-[11px] text-slate-500">Collecte des fiches d'entreprises locales</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 opacity-80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Étape 2
                </div>
                <p className="text-xs font-semibold text-slate-800">Nettoyage & Déduplication</p>
                <p className="text-[11px] text-slate-500">Filtrage des numéros au format WhatsApp</p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 opacity-80">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Étape 3
                </div>
                <p className="text-xs font-semibold text-slate-800">Enrichissement IA</p>
                <p className="text-[11px] text-slate-500">Préparation des pitchs personnalisés</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 font-mono">
              Temps écoulé : {elapsedSeconds} secondes (généralement 15 à 45s)
            </div>
          </div>
        </Card>
      )}

      {/* 2. ÉCRAN EN CAS D'ÉCHEC AVEC REMBOURSEMENT */}
      {search.statut === 'failed' && (
        <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-2xl overflow-hidden p-6 sm:p-8 border-l-4 border-l-red-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-red-100 text-red-600 shrink-0">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                La recherche n'a pas pu aboutir
              </h2>
              <p className="text-sm text-slate-600">
                {search.error || "Aucun établissement n'a été trouvé pour ces critères de recherche sur Google Maps."}
              </p>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium">
                ✅ Vos crédits ont été <strong>automatiquement remboursés</strong> sur votre solde. Aucun crédit n'a été débité.
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => router.push('/dashboard')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2" />
                  Relancer une recherche sur le tableau de bord
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 3. LISTE DES RÉSULTATS (SUCCEEDED) */}
      {search.statut === 'succeeded' && (
        <>
          {/* En-tête des résultats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white capitalize truncate">
                  {search.secteur} à {search.ville}
                </h1>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold text-xs">
                  {leads.length} leads qualifiés
                </Badge>
              </div>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Pays : <span className="text-white font-medium">{search.pays}</span> • Extraction terminée avec succès
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a href={`/api/searches/${search.id}/export`} download className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#E55B5B] hover:bg-[#d64a4a] text-white font-bold h-10 px-4 sm:px-5 rounded-xl shadow-lg shadow-[#E55B5B]/30 text-xs">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter en CSV
                </Button>
              </a>
            </div>
          </div>

          {/* Barre de filtres et recherche */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="relative w-full sm:w-80">
              <SearchIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Filtrer par nom ou adresse..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 bg-white text-slate-900 border-none rounded-xl h-10 shadow-sm text-xs sm:text-sm"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={`text-xs h-9 rounded-lg shrink-0 ${filterType === 'all' ? 'bg-[#E55B5B] text-white hover:bg-[#d64a4a]' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Tous ({leads.length})
              </Button>
              <Button
                variant={filterType === 'whatsapp' ? 'default' : 'outline'}
                onClick={() => setFilterType('whatsapp')}
                className={`text-xs h-9 rounded-lg shrink-0 ${filterType === 'whatsapp' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Avec WhatsApp ({whatsappLeadsCount})
              </Button>
              <Button
                variant={filterType === 'website' ? 'default' : 'outline'}
                onClick={() => setFilterType('website')}
                className={`text-xs h-9 rounded-lg shrink-0 ${filterType === 'website' ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Avec Site Web ({websiteLeadsCount})
              </Button>
              <Button
                variant={filterType === 'no-website' ? 'default' : 'outline'}
                onClick={() => setFilterType('no-website')}
                className={`text-xs h-9 rounded-lg shrink-0 ${filterType === 'no-website' ? 'bg-amber-600 text-white hover:bg-amber-700' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Sans Site Web ({noWebsiteLeadsCount})
              </Button>
            </div>
          </div>

          {/* Tableau moderne des leads */}
          <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-2xl overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-200">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 py-3.5 pl-4 sm:pl-6">Entreprise</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Contact & WhatsApp</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Note Google</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500">Web & Maps</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-slate-500 text-right pr-4 sm:pr-6">Prospection IA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-slate-400 text-xs sm:text-sm">
                        Aucun résultat ne correspond à votre filtre.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        {/* Entreprise */}
                        <TableCell className="pl-4 sm:pl-6 py-3.5">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{lead.nom}</p>
                          <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#E55B5B] shrink-0" />
                            <span className="truncate max-w-[180px] sm:max-w-xs">{lead.adresse || lead.categorie || 'Adresse non renseignée'}</span>
                          </p>
                        </TableCell>

                        {/* Téléphone / WhatsApp */}
                        <TableCell>
                          {lead.telephone_e164 || lead.telephone_brut ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] sm:text-xs font-mono font-medium text-slate-800">
                                {lead.telephone_e164 || lead.telephone_brut}
                              </span>
                              {lead.lien_whatsapp && (
                                <a
                                  href={lead.lien_whatsapp}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shrink-0"
                                  title="Ouvrir sur WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Non disponible</span>
                          )}
                        </TableCell>

                        {/* Note & Avis */}
                        <TableCell>
                          {lead.note ? (
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-amber-500 text-xs flex items-center">
                                <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400 mr-1" />
                                {lead.note}
                              </span>
                              <span className="text-[10px] text-slate-400">({lead.nb_avis || 0})</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </TableCell>

                        {/* Liens Web et Maps */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {lead.site_web ? (
                              <a
                                href={lead.site_web}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] text-cyan-700 hover:underline gap-1 bg-cyan-50 px-2 py-0.5 rounded-md"
                              >
                                <Globe className="w-3 h-3" />
                                <span>Site</span>
                              </a>
                            ) : null}

                            {lead.lien_google_maps && (
                              <a
                                href={lead.lien_google_maps}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-[11px] text-slate-600 hover:underline gap-1 bg-slate-100 px-2 py-0.5 rounded-md"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Maps</span>
                              </a>
                            )}
                          </div>
                        </TableCell>

                        {/* Prospection IA */}
                        <TableCell className="text-right pr-4 sm:pr-6">
                          <Button
                            size="sm"
                            onClick={() => handleOpenPitchModal(lead)}
                            className="bg-red-50 hover:bg-[#E55B5B] text-[#E55B5B] hover:text-white font-semibold text-[11px] sm:text-xs h-8 px-2.5 sm:px-3 rounded-lg border border-red-200 transition-all shadow-xs"
                          >
                            <Sparkles className="w-3.5 h-3.5 mr-1" />
                            Pitch IA
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}

      {/* 4. MODAL COPYWRITING & STUDIO VOCAL STYLE WAVE (Français & Wolof) */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <Card className="w-full max-w-xl bg-white text-slate-900 border-none shadow-2xl rounded-3xl overflow-hidden max-h-[92vh] flex flex-col">
            <CardHeader className="border-b border-slate-100 p-4 sm:p-6 pb-3 sm:pb-4 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-red-50 text-[#E55B5B]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-slate-900 truncate max-w-[260px] sm:max-w-md">
                      Pitch IA • {selectedLead.nom}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-slate-500">
                      Généré avec Gemini 3.5 Flash Lite
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Sélecteurs de langue et canal */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => {
                      setPitchLang('fr')
                      generatePitch(selectedLead, 'fr', pitchChannel)
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all text-xs ${pitchLang === 'fr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    🇫🇷 Français
                  </button>
                  <button
                    onClick={() => {
                      setPitchLang('wo')
                      generatePitch(selectedLead, 'wo', pitchChannel)
                    }}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg transition-all text-xs ${pitchLang === 'wo' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    🇸🇳 Wolof
                  </button>
                </div>

                <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                  <button
                    onClick={() => {
                      setPitchChannel('whatsapp')
                      generatePitch(selectedLead, pitchLang, 'whatsapp')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs shrink-0 ${pitchChannel === 'whatsapp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    WhatsApp Texte
                  </button>
                  <button
                    onClick={() => {
                      setPitchChannel('voice')
                      generatePitch(selectedLead, pitchLang, 'voice')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs shrink-0 flex items-center gap-1 ${pitchChannel === 'voice' ? 'bg-[#1DC4FF] text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                    Note Vocale
                  </button>
                  <button
                    onClick={() => {
                      setPitchChannel('email')
                      generatePitch(selectedLead, pitchLang, 'email')
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs shrink-0 ${pitchChannel === 'email' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Email
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6 pt-4 space-y-4 overflow-y-auto">
              {isGeneratingPitch ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 border-3 border-[#E55B5B] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-800">
                    {pitchLang === 'wo'
                      ? 'Gemini rédige votre script en Wolof sénégalais...'
                      : 'Gemini rédige votre script en Français...'}
                  </p>
                  <p className="text-xs text-slate-400">
                    {pitchChannel === 'voice'
                      ? 'Script parlé pour note vocale WhatsApp • Style Wave'
                      : pitchChannel === 'whatsapp'
                      ? 'Message d’accroche WhatsApp direct'
                      : 'Email de prospection complet'}
                  </p>
                </div>
              ) : generatedPitch ? (
                <div className="space-y-4">
                  {/* Mode Email Objet */}
                  {generatedPitch.objet && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                      <span className="font-bold text-slate-600 uppercase tracking-wider block text-[10px]">Objet du mail :</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{generatedPitch.objet}</p>
                    </div>
                  )}

                  {/* Mode Note Vocale : Téléprompteur interactif */}
                  {pitchChannel === 'voice' && (
                    <div className="p-4 bg-sky-50 border border-sky-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-sky-800">
                        <span className="flex items-center gap-1.5">
                          <Radio className="w-3.5 h-3.5 text-[#00B2FE] animate-pulse" />
                          Script Prompteur (à lire au micro)
                        </span>
                        <span className="font-mono text-[10px] bg-sky-200/60 text-sky-900 px-2 py-0.5 rounded-md">
                          ~ 20 à 30 sec
                        </span>
                      </div>
                      <div className="p-3 bg-white border border-sky-100 rounded-xl text-xs sm:text-sm text-slate-800 font-medium leading-relaxed shadow-xs">
                        « {generatedPitch.corps} »
                      </div>
                    </div>
                  )}

                  {/* Mode Texte normal WhatsApp / Email */}
                  {pitchChannel !== 'voice' && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
                      {generatedPitch.corps}
                    </div>
                  )}

                  {/* STUDIO D'ENREGISTREMENT VOCAL STYLE WAVE */}
                  {pitchChannel === 'voice' && (
                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      {/* État 1 : Non enregistré et non en cours */}
                      {!isRecording && !audioUrl && (
                        <div className="p-6 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col items-center text-center space-y-3">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <Volume2 className="w-4 h-4 text-[#00B2FE]" />
                            <span>Microphone prêt • Enregistrez votre message vocal</span>
                          </div>
                          <Button
                            onClick={startRecording}
                            className="bg-[#00B2FE] hover:bg-[#009adc] text-white font-extrabold h-12 px-8 rounded-full shadow-lg shadow-[#00B2FE]/30 flex items-center gap-2 hover:scale-105 transition-all text-sm"
                          >
                            <Mic className="w-5 h-5 animate-pulse" />
                            Enregistrer le vocal
                          </Button>
                          <p className="text-[11px] text-slate-400">
                            Comme sur Wave : vous pourrez l&apos;écouter et le supprimer avant de l&apos;envoyer.
                          </p>
                        </div>
                      )}

                      {/* État 2 : Enregistrement en direct avec onde animée */}
                      {isRecording && (
                        <div className="p-6 bg-red-50/70 border border-red-200 rounded-2xl flex flex-col items-center space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 rounded-full bg-red-600 animate-ping" />
                            <span className="font-mono text-2xl font-black text-red-600">
                              {formatSeconds(recordingTime)}
                            </span>
                            <span className="text-xs uppercase font-bold tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                              Enregistrement Wave...
                            </span>
                          </div>

                          {/* Ondes sonores animées */}
                          <div className="flex items-center gap-1.5 h-10 py-1">
                            <span className="w-1.5 h-6 bg-red-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-1.5 h-9 bg-red-600 rounded-full animate-bounce [animation-delay:-0.1s]" />
                            <span className="w-1.5 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:-0.4s]" />
                            <span className="w-1.5 h-8 bg-red-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                            <span className="w-1.5 h-5 bg-red-400 rounded-full animate-bounce [animation-delay:-0.35s]" />
                            <span className="w-1.5 h-7 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          </div>

                          <Button
                            onClick={stopRecording}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-11 px-7 rounded-full shadow-md flex items-center gap-2 text-xs"
                          >
                            <Square className="w-4 h-4 fill-white" />
                            Arrêter et vérifier le vocal
                          </Button>
                        </div>
                      )}

                      {/* État 3 : LECTEUR WAVE AVEC ÉCOUTE, SUPPRESSION ET ENVOI */}
                      {audioUrl && !isRecording && (
                        <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-[#0b1e16] text-white rounded-2xl space-y-4 shadow-xl border border-white/10">
                          {/* Audio tag caché contrôlé par notre interface Wave */}
                          <audio
                            ref={audioPlayerRef}
                            src={audioUrl}
                            onTimeUpdate={() => {
                              if (audioPlayerRef.current) {
                                setAudioCurrentTime(audioPlayerRef.current.currentTime)
                              }
                            }}
                            onLoadedMetadata={() => {
                              if (audioPlayerRef.current) {
                                setAudioDuration(audioPlayerRef.current.duration || recordingTime)
                              }
                            }}
                            onEnded={() => {
                              setIsPlayingAudio(false)
                              setAudioCurrentTime(0)
                            }}
                          />

                          {/* En-tête du lecteur Wave */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-[#1DC4FF] animate-pulse" />
                              <span className="text-xs font-bold text-[#1DC4FF]">
                                Note Vocale Prête
                              </span>
                            </div>

                            {/* BOUTON SUPPRIMER LE MESSAGE (comme demandé sur Wave) */}
                            <button
                              onClick={handleDeleteAudio}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all"
                              title="Supprimer ce message vocal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer</span>
                            </button>
                          </div>

                          {/* ONDE SONORE & CONTRÔLE PLAY/PAUSE STYLE WAVE */}
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                            {/* Bouton Play/Pause rond Wave */}
                            <button
                              onClick={togglePlayAudio}
                              className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#1DC4FF] hover:bg-[#00b2fe] text-slate-900 flex items-center justify-center shadow-lg transition-transform hover:scale-105 shrink-0"
                              title={isPlayingAudio ? 'Mettre en pause' : 'Écouter la note vocale'}
                            >
                              {isPlayingAudio ? (
                                <Pause className="w-5 h-5 fill-slate-900" />
                              ) : (
                                <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
                              )}
                            </button>

                            {/* Onde sonore interactive Waveform */}
                            <div className="flex-1 space-y-1.5 min-w-0">
                              <div className="flex items-center justify-between gap-1 h-8 cursor-pointer py-1" onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect()
                                const clickX = e.clientX - rect.left
                                const percent = Math.max(0, Math.min(1, clickX / rect.width))
                                seekAudio(percent)
                              }}>
                                {WAVE_BARS.map((heightPercent, index) => {
                                  const totalDur = audioDuration || recordingTime || 1
                                  const barPercent = index / WAVE_BARS.length
                                  const isPlayed = (audioCurrentTime / totalDur) >= barPercent

                                  return (
                                    <div
                                      key={index}
                                      style={{ height: `${heightPercent}%` }}
                                      className={`w-1 sm:w-1.5 rounded-full transition-colors duration-150 ${
                                        isPlayed
                                          ? 'bg-[#1DC4FF]'
                                          : 'bg-white/20 hover:bg-white/40'
                                      }`}
                                    />
                                  )
                                })}
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                                <span>{formatSeconds(audioCurrentTime)}</span>
                                <span>{formatSeconds(audioDuration || recordingTime)}</span>
                              </div>
                            </div>
                          </div>

                          {/* BOUTONS D'ACTION : TÉLÉCHARGER ET ENVOYER WHATSAPP */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <Button
                              onClick={downloadVoiceNote}
                              className="w-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold h-11 rounded-xl border border-white/15 transition-all"
                            >
                              <Download className="w-4 h-4 mr-2 text-[#1DC4FF]" />
                              Télécharger (.webm)
                            </Button>

                            {selectedLead.lien_whatsapp && (
                              <a
                                href={`${selectedLead.lien_whatsapp}?text=${encodeURIComponent(
                                  pitchLang === 'wo'
                                    ? `Salaam aleekum ${selectedLead.nom}, dama leen yónnee benn note vocale bu am solo ci seen liggéey fi ci WhatsApp.`
                                    : `Bonjour ${selectedLead.nom}, je vous ai transmis une courte note vocale ci-jointe concernant votre activité.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full"
                              >
                                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-11 rounded-xl shadow-md transition-all">
                                  <Send className="w-4 h-4 mr-2" />
                                  Envoyer WhatsApp
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions pour le mode Texte (WhatsApp / Email) */}
                  {pitchChannel !== 'voice' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCopyPitch}
                        className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold h-11 rounded-xl text-xs sm:text-sm"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2 text-emerald-400" />
                            Copié !
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Copier le texte
                          </>
                        )}
                      </Button>

                      {selectedLead.lien_whatsapp && pitchChannel === 'whatsapp' && (
                        <a
                          href={`${selectedLead.lien_whatsapp}?text=${encodeURIComponent(generatedPitch.corps)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md text-xs sm:text-sm">
                            <Send className="w-4 h-4 mr-2" />
                            Envoyer WhatsApp
                          </Button>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
