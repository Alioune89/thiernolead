export interface AfricanCountry {
  name: string
  code: string
  capital: string
  cities: string[]
}

export const AFRICAN_COUNTRIES: AfricanCountry[] = [
  // Afrique de l'Ouest
  { name: 'Sénégal', code: 'SN', capital: 'Dakar', cities: ['Dakar', 'Thiès', 'Touba', 'Saint-Louis', 'Mbour', 'Ziguinchor', 'Kaolack'] },
  { name: 'Côte d\'Ivoire', code: 'CI', capital: 'Yamoussoukro', cities: ['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Korhogo', 'Daloa'] },
  { name: 'Mali', code: 'ML', capital: 'Bamako', cities: ['Bamako', 'Sikasso', 'Ségou', 'Mopti', 'Kayes'] },
  { name: 'Guinée', code: 'GN', capital: 'Conakry', cities: ['Conakry', 'Kankan', 'Nzérékoré', 'Kindia', 'Labé'] },
  { name: 'Burkina Faso', code: 'BF', capital: 'Ouagadougou', cities: ['Ouagadougou', 'Bobo-Dioulasso', 'Koudougou'] },
  { name: 'Bénin', code: 'BJ', capital: 'Porto-Novo', cities: ['Cotonou', 'Porto-Novo', 'Parakou', 'Abomey-Calavi'] },
  { name: 'Togo', code: 'TG', capital: 'Lomé', cities: ['Lomé', 'Sokodé', 'Kara', 'Kpalimé'] },
  { name: 'Niger', code: 'NE', capital: 'Niamey', cities: ['Niamey', 'Maradi', 'Zinder', 'Tahoua'] },
  { name: 'Mauritanie', code: 'MR', capital: 'Nouakchott', cities: ['Nouakchott', 'Nouadhibou', 'Kiffa'] },
  { name: 'Ghana', code: 'GH', capital: 'Accra', cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi'] },
  { name: 'Nigeria', code: 'NG', capital: 'Abuja', cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt'] },
  { name: 'Sierra Leone', code: 'SL', capital: 'Freetown', cities: ['Freetown', 'Bo', 'Kenema'] },
  { name: 'Libéria', code: 'LR', capital: 'Monrovia', cities: ['Monrovia', 'Gbarnga', 'Buchanan'] },
  { name: 'Gambie', code: 'GM', capital: 'Banjul', cities: ['Banjul', 'Serekunda', 'Brikama'] },
  { name: 'Guinée-Bissau', code: 'GW', capital: 'Bissau', cities: ['Bissau', 'Bafatá', 'Gabú'] },
  { name: 'Cap-Vert', code: 'CV', capital: 'Praia', cities: ['Praia', 'Mindelo', 'Espargos'] },

  // Afrique Centrale
  { name: 'Cameroun', code: 'CM', capital: 'Yaoundé', cities: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Maroua', 'Bamenda'] },
  { name: 'Gabon', code: 'GA', capital: 'Libreville', cities: ['Libreville', 'Port-Gentil', 'Franceville', 'Oyem'] },
  { name: 'Congo (Brazzaville)', code: 'CG', capital: 'Brazzaville', cities: ['Brazzaville', 'Pointe-Noire', 'Dolisie'] },
  { name: 'RD Congo (Kinshasa)', code: 'CD', capital: 'Kinshasa', cities: ['Kinshasa', 'Lubumbashi', 'Goma', 'Kisangani', 'Bukavu'] },
  { name: 'Tchad', code: 'TD', capital: 'N\'Djaména', cities: ['N\'Djaména', 'Moundou', 'Sarh', 'Abéché'] },
  { name: 'Centrafrique', code: 'CF', capital: 'Bangui', cities: ['Bangui', 'Bimbo', 'Berbérati'] },
  { name: 'Guinée Équatoriale', code: 'GQ', capital: 'Malabo', cities: ['Malabo', 'Bata'] },

  // Afrique du Nord
  { name: 'Maroc', code: 'MA', capital: 'Rabat', cities: ['Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Fès', 'Agadir'] },
  { name: 'Algérie', code: 'DZ', capital: 'Alger', cities: ['Alger', 'Oran', 'Constantine', 'Annaba', 'Sétif'] },
  { name: 'Tunisie', code: 'TN', capital: 'Tunis', cities: ['Tunis', 'Sfax', 'Sousse', 'Bizerte'] },
  { name: 'Égypte', code: 'EG', capital: 'Le Caire', cities: ['Le Caire', 'Alexandrie', 'Gizeh', 'Louxor'] },

  // Afrique de l'Est
  { name: 'Kenya', code: 'KE', capital: 'Nairobi', cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'] },
  { name: 'Rwanda', code: 'RW', capital: 'Kigali', cities: ['Kigali', 'Gisenyi', 'Butare'] },
  { name: 'Ouganda', code: 'UG', capital: 'Kampala', cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu'] },
  { name: 'Tanzanie', code: 'TZ', capital: 'Dodoma', cities: ['Dar es Salaam', 'Dodoma', 'Arusha', 'Mwanza', 'Zanzibar'] },
  { name: 'Éthiopie', code: 'ET', capital: 'Addis-Abeba', cities: ['Addis-Abeba', 'Dire Dawa', 'Hawassa'] },
  { name: 'Madagascar', code: 'MG', capital: 'Antananarivo', cities: ['Antananarivo', 'Toamasina', 'Antsirabe', 'Mahajanga'] },
  { name: 'Maurice', code: 'MU', capital: 'Port-Louis', cities: ['Port-Louis', 'Grand Baie', 'Beau Bassin'] },
  { name: 'Djibouti', code: 'DJ', capital: 'Djibouti', cities: ['Djibouti', 'Ali Sabieh', 'Dikhil'] },
  { name: 'Comores', code: 'KM', capital: 'Moroni', cities: ['Moroni', 'Mutsamudu', 'Fomboni'] },

  // Afrique Australe
  { name: 'Afrique du Sud', code: 'ZA', capital: 'Pretoria', cities: ['Johannesburg', 'Le Cap', 'Durban', 'Pretoria'] },
  { name: 'Angola', code: 'AO', capital: 'Luanda', cities: ['Luanda', 'Huambo', 'Lobito', 'Benguela'] },
  { name: 'Mozambique', code: 'MZ', capital: 'Maputo', cities: ['Maputo', 'Matola', 'Beira', 'Nampula'] },
  { name: 'Zambie', code: 'ZM', capital: 'Lusaka', cities: ['Lusaka', 'Kitwe', 'Ndola'] },
  { name: 'Zimbabwe', code: 'ZW', capital: 'Harare', cities: ['Harare', 'Bulawayo', 'Chitungwiza'] },
  { name: 'Namibie', code: 'NA', capital: 'Windhoek', cities: ['Windhoek', 'Walvis Bay', 'Swakopmund'] },
]

export function getCountryCodeForRegion(countryName: string): string {
  const found = AFRICAN_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase())
  return found ? found.code : 'SN'
}
