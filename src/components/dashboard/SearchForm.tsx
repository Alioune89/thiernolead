'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AFRICAN_COUNTRIES } from '@/lib/africa'
import { createSearch } from '@/actions/searches'
import Link from 'next/link'
import { Search, Loader2, Sparkles, MapPin, Zap, AlertTriangle, ArrowRight, Coins } from 'lucide-react'

const SUGGESTIONS = ['Dentiste', 'Pharmacie', 'Restaurant', 'Clinique', 'Boulangerie', 'Hôtel', 'Immobilier', 'École']

const VOLUME_OPTIONS = [
  { value: '10', leads: '10 leads', credits: '10 crédits' },
  { value: '20', leads: '20 leads', credits: '20 crédits' },
  { value: '50', leads: '50 leads', credits: '50 crédits', popular: true },
  { value: '100', leads: '100 leads', credits: '100 crédits' },
  { value: '200', leads: '200 leads', credits: '200 crédits' },
]

export function SearchForm({ userCredits = 0 }: { userCredits?: number }) {
  const [selectedCountryName, setSelectedCountryName] = useState('Sénégal')
  const [secteur, setSecteur] = useState('')
  const [selectedCity, setSelectedCity] = useState('Dakar')
  const [customCity, setCustomCity] = useState('')
  const [isCustomCity, setIsCustomCity] = useState(false)
  const [maxResults, setMaxResults] = useState('20')
  const [isPending, startTransition] = useTransition()

  const currentCountry = AFRICAN_COUNTRIES.find((c) => c.name === selectedCountryName) || AFRICAN_COUNTRIES[0]

  const handleCountryChange = (countryName: string | null) => {
    if (!countryName) return
    setSelectedCountryName(countryName)
    const country = AFRICAN_COUNTRIES.find((c) => c.name === countryName)
    if (country) {
      setSelectedCity(country.cities[0] || country.capital)
      setIsCustomCity(false)
      setCustomCity('')
    }
  }

  const handleCityChange = (cityValue: string | null) => {
    if (!cityValue) return
    if (cityValue === '__custom__') {
      setIsCustomCity(true)
      setSelectedCity('')
    } else {
      setIsCustomCity(false)
      setSelectedCity(cityValue)
    }
  }

  const handleSubmit = (formData: FormData) => {
    const finalCity = isCustomCity ? customCity.trim() : selectedCity
    formData.set('ville', finalCity)
    formData.set('pays', selectedCountryName)
    formData.set('secteur', secteur)
    formData.set('max_results', maxResults)

    startTransition(async () => {
      await createSearch(formData)
    })
  }

  return (
    <Card className="bg-white text-slate-900 border-none shadow-2xl rounded-3xl overflow-hidden">
      <CardHeader className="p-6 pb-4 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#f05a5a] flex items-center justify-center">
              <Zap className="w-4 h-4 fill-[#f05a5a]" />
            </div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">
              Nouvelle Recherche
            </CardTitle>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
            Google Maps Direct
          </span>
        </div>
        <CardDescription className="text-slate-500 text-xs mt-1">
          Scrapez des commerces et professionnels ciblés avec téléphones et WhatsApp vérifiés.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-5 space-y-4">
        <form action={handleSubmit} className="space-y-4">
          {/* Secteur d'activité */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="secteur" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Secteur d'activité
              </Label>
              <span className="text-[11px] text-slate-400 font-normal">Ex: Dentiste, Pharmacie</span>
            </div>
            <Input
              id="secteur"
              name="secteur"
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              placeholder="ex: Dentiste, Pharmacie, Restaurant..."
              required
              className="bg-white text-slate-900 border-slate-200 focus-visible:ring-[#f05a5a] focus-visible:border-[#f05a5a] h-11 rounded-xl shadow-xs text-sm font-medium"
            />
            {/* Suggestions rapides */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setSecteur(sug)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    secteur.toLowerCase() === sug.toLowerCase()
                      ? 'bg-[#f05a5a] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Pays */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="pays" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Marché / Pays
              </Label>
              <span className="text-[11px] text-[#f05a5a] font-semibold">54 pays d'Afrique</span>
            </div>
            <Select value={selectedCountryName} onValueChange={handleCountryChange}>
              <SelectTrigger className="bg-white text-slate-900 border-slate-200 focus:ring-[#f05a5a] h-11 rounded-xl text-sm font-semibold shadow-xs">
                <SelectValue placeholder="Sélectionnez un pays" />
              </SelectTrigger>
              <SelectContent className="max-h-64 bg-white text-slate-900 rounded-xl shadow-2xl border-slate-200">
                {AFRICAN_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.name} className="cursor-pointer hover:bg-slate-100 font-medium py-2">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ville / Capitale */}
          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="ville" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#f05a5a]" />
                Ville / Capitale
              </Label>
              <span className="text-[11px] text-slate-500 font-medium">
                Capitale : <strong className="text-slate-800">{currentCountry.capital}</strong>
              </span>
            </div>

            {!isCustomCity ? (
              <Select value={selectedCity} onValueChange={handleCityChange}>
                <SelectTrigger className="bg-white text-slate-900 border-slate-200 focus:ring-[#f05a5a] h-11 rounded-xl text-sm font-semibold shadow-xs">
                  <SelectValue placeholder="Sélectionnez une ville" />
                </SelectTrigger>
                <SelectContent className="max-h-60 bg-white text-slate-900 rounded-xl shadow-2xl border-slate-200">
                  {currentCountry.cities.map((city) => (
                    <SelectItem key={city} value={city} className="cursor-pointer hover:bg-slate-100 py-2">
                      {city} {city === currentCountry.capital && <span className="text-xs text-slate-400 ml-1.5 font-normal">(Capitale)</span>}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__" className="cursor-pointer text-[#f05a5a] font-bold hover:bg-red-50 py-2">
                    ✍️ Autre ville personnalisée...
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="space-y-1">
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    placeholder={`Ville personnalisée en ${selectedCountryName}`}
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    required
                    className="bg-white text-slate-900 border-slate-200 focus-visible:ring-[#f05a5a] h-11 rounded-xl text-sm font-semibold shadow-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCustomCity(false)
                      setSelectedCity(currentCountry.cities[0] || currentCountry.capital)
                    }}
                    className="shrink-0 text-xs px-3 h-11 rounded-xl border-slate-200 hover:bg-slate-100 font-semibold"
                  >
                    Liste
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Volume de leads */}
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <Label htmlFor="max_results" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Volume de leads
              </Label>
              <span className="text-[11px] text-slate-400 font-medium">1 crédit par lead</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-0.5">
              {VOLUME_OPTIONS.map((opt) => {
                const isSelected = maxResults === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMaxResults(opt.value)}
                    className={`relative flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/80 border-[#f05a5a] text-[#f05a5a] shadow-xs ring-2 ring-[#f05a5a]/20 font-bold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    {opt.popular && (
                      <span className="absolute -top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-[#f05a5a] text-white px-1.5 py-0.2 rounded-full shadow-xs">
                        Populaire
                      </span>
                    )}
                    <span className="text-xs sm:text-sm font-extrabold">{opt.leads}</span>
                    <span className={`text-[10px] sm:text-[11px] mt-0.5 ${isSelected ? 'text-[#f05a5a] font-semibold' : 'text-slate-400'}`}>
                      {opt.credits}
                    </span>
                  </button>
                )
              })}
            </div>
            <input type="hidden" name="max_results" value={maxResults} />
          </div>

          {/* Alerte Solde de Crédits */}
          {userCredits < parseInt(maxResults, 10) && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start sm:items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Solde insuffisant : vous avez <strong>{userCredits} crédit{userCredits > 1 ? 's' : ''}</strong> sur <strong>{maxResults}</strong> requis.
                </span>
              </div>
              <Link
                href="/billing"
                className="inline-flex items-center gap-1 font-bold text-[#f05a5a] hover:underline shrink-0 text-xs"
              >
                Recharger mes crédits
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Bouton de soumission */}
          {userCredits < parseInt(maxResults, 10) ? (
            <Link href="/billing" className="w-full">
              <Button
                type="button"
                className="w-full bg-[#f05a5a] hover:bg-[#d64a4a] text-white font-extrabold h-12 rounded-xl button-glow transition-all mt-1 text-sm"
              >
                <Coins className="w-4 h-4 mr-2" />
                Recharger mes crédits pour lancer la recherche
              </Button>
            </Link>
          ) : (
            <Button
              type="submit"
              disabled={isPending || !secteur || (!selectedCity && !customCity)}
              className="w-full bg-[#f05a5a] hover:bg-[#d64a4a] text-white font-extrabold h-12 rounded-xl button-glow transition-all mt-1 text-sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Initialisation de l'extraction...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Lancer la recherche
                </>
              )}
            </Button>
          )}

          <p className="text-[11px] text-center text-slate-400">
            Dédoublonnage automatique & déduction au résultat effectif.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
