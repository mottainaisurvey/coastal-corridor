import type { Agent, Developer } from './types';

export const agents: Agent[] = [
  {
    id: 'a-001',
    slug: 'chiamaka-okafor',
    name: 'Chiamaka Okafor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    agencyName: 'Lekki Coastal Realty',
    licenseNumber: 'ESV/2019/1847',
    licenseVerified: true,
    yearsActive: 11,
    regionsCovered: ['Lagos'],
    specialties: ['Luxury residential', 'Beachfront', 'Commercial'],
    rating: 4.9,
    reviewCount: 184,
    listingCount: 47,
    bio: 'Principal partner at Lekki Coastal Realty with over a decade of experience in Lagos beachfront and commercial real estate. Specialises in helping diaspora buyers navigate the Lagos State verification process.'
  },
  {
    id: 'a-002',
    slug: 'adewale-johnson',
    name: 'Adewale Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    agencyName: 'Coastal Corridor Advisors',
    licenseNumber: 'ESV/2021/2394',
    licenseVerified: true,
    yearsActive: 8,
    regionsCovered: ['Lagos', 'Ogun', 'Ondo'],
    specialties: ['Investment land', 'Emerging markets', 'Fractional ownership'],
    rating: 4.7,
    reviewCount: 92,
    listingCount: 31,
    bio: 'Early mover in the Epe and Ondo coastal markets. Advises investment syndicates and diaspora clients on speculative land assembly. Fluent in Yoruba and English.'
  },
  {
    id: 'a-003',
    slug: 'funmilayo-adebayo',
    name: 'Funmilayo Adebayo',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    agencyName: 'Heritage Properties Nigeria',
    licenseNumber: 'ESV/2012/0892',
    licenseVerified: true,
    yearsActive: 17,
    regionsCovered: ['Lagos'],
    specialties: ['Heritage properties', 'Ikoyi', 'Victoria Island'],
    rating: 4.95,
    reviewCount: 221,
    listingCount: 23,
    bio: 'Senior practitioner specialising in heritage and pre-1990s properties in Ikoyi and VI. Deep knowledge of Governor\'s Consent processes and older title types.'
  },
  {
    id: 'a-004',
    slug: 'olumide-odukoya',
    name: 'Olumide Odukoya',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    agencyName: 'Ondo Coast Ventures',
    licenseNumber: 'ESV/2022/2718',
    licenseVerified: true,
    yearsActive: 6,
    regionsCovered: ['Ondo', 'Ogun'],
    specialties: ['Hospitality', 'Resort development', 'Large parcels'],
    rating: 4.6,
    reviewCount: 38,
    listingCount: 12,
    bio: 'Pioneering agent in the Ondo coastal belt. Works closely with Ondo State investment promotion agency on hospitality site placement.'
  },
  {
    id: 'a-005',
    slug: 'eyo-okon',
    name: 'Eyo Okon',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    agencyName: 'Cross River Realty',
    licenseNumber: 'ESV/2017/1524',
    licenseVerified: true,
    yearsActive: 12,
    regionsCovered: ['Cross River', 'Akwa Ibom'],
    specialties: ['Cross-border', 'Tourism properties', 'Diaspora returnees'],
    rating: 4.85,
    reviewCount: 147,
    listingCount: 29,
    bio: 'Cross River native serving the diaspora Efik and Ibibio communities. Specialises in properties around Calabar, Tinapa, and the Obudu highlands. Active with the Cross River State Tourism Board.'
  },
  {
    id: 'a-006',
    slug: 'ibifiri-briggs',
    name: 'Ibifiri Briggs',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    agencyName: 'Garden City Properties',
    licenseNumber: 'ESV/2018/1691',
    licenseVerified: true,
    yearsActive: 10,
    regionsCovered: ['Rivers', 'Bayelsa'],
    specialties: ['Commercial', 'Oil & gas adjacency', 'Luxury residential'],
    rating: 4.75,
    reviewCount: 108,
    listingCount: 34,
    bio: 'Port Harcourt specialist with strong relationships across the Oil & Gas Free Zone and corporate housing market. Deep expertise in Rivers State land documentation.'
  }
];

export const developers: Developer[] = [
  {
    id: 'd-001',
    slug: 'pinnock-beach-estates',
    name: 'Pinnock Beach Estates',
    logo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&q=80',
    cacNumber: 'RC-874521',
    verified: true,
    yearFounded: 2011,
    projectCount: 14,
    description: 'Premium beachfront developer focused on the Lekki-Epe corridor. 14 completed projects, 2,400 units delivered.',
    activeProjects: 3,
    completedProjects: 11
  },
  {
    id: 'd-002',
    slug: 'obudu-highlands',
    name: 'Obudu Highlands Development',
    logo: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&q=80',
    cacNumber: 'RC-1248395',
    verified: true,
    yearFounded: 2018,
    projectCount: 4,
    description: 'Cross River focused developer. Specialises in hospitality and diaspora returnee residential projects.',
    activeProjects: 2,
    completedProjects: 2
  },
  {
    id: 'd-003',
    slug: 'corridor-capital',
    name: 'Corridor Capital Properties',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400&q=80',
    cacNumber: 'RC-2184729',
    verified: true,
    yearFounded: 2022,
    projectCount: 6,
    description: 'Multi-state developer with projects in Lagos, Ogun, and Akwa Ibom. Focus on mid-market diaspora-friendly pricing.',
    activeProjects: 5,
    completedProjects: 1
  }
];

export const getAgentBySlug = (slug: string) => agents.find((a) => a.slug === slug);
export const getAgentById = (id: string) => agents.find((a) => a.id === id);
export const getAgentByName = (name: string) => agents.find((a) => a.name === name);
export const getDeveloperBySlug = (slug: string) => developers.find((d) => d.slug === slug);
