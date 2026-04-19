import type { Destination } from './types';

export const destinations: Destination[] = [
  {
    id: 'vi',
    slug: 'victoria-island',
    name: 'Victoria Island Terminus',
    state: 'Lagos',
    type: 'INFRASTRUCTURE',
    latitude: 6.4281,
    longitude: 3.4216,
    corridorKm: 0,
    heroImage: 'https://images.unsplash.com/photo-1580746738099-7b0b3a58b9ca?w=1600&q=80',
    tagline: 'Western origin of the corridor',
    description:
      'Victoria Island is the dense commercial district and gateway to Lagos metropolis. Ferry terminals, business infrastructure, and the primary urban real estate market in West Africa converge here, making it the natural terminus for the corridor.',
    stats: [
      { label: 'Plot Availability', value: '~140', unit: 'listed' },
      { label: 'Avg Land Value', value: '₦580M', unit: '/ plot' },
      { label: 'Tourism POIs', value: '38', unit: 'sites' },
      { label: 'Corridor KM', value: '0.0', unit: 'km' }
    ],
    features: [
      '3D building context from OSM + drone capture',
      'Live marine traffic overlay (MarineTraffic API)',
      'Real-time hotel availability for VI & Ikoyi',
      'Enterprise GIS partner office integration'
    ]
  },
  {
    id: 'lekki',
    slug: 'lekki',
    name: 'Lekki Peninsula',
    state: 'Lagos',
    type: 'MIXED_USE',
    latitude: 6.4474,
    longitude: 3.557,
    corridorKm: 24,
    heroImage: 'https://images.unsplash.com/photo-1572205796404-8a4a46c29ee3?w=1600&q=80',
    tagline: 'Flagship urban expansion zone',
    description:
      'Lekki combines high-value coastal residential estates, Lekki Free Zone, Dangote Refinery, and the Deep Sea Port into the densest cluster of verified plots on the platform. The anchor segment for the entire corridor thesis.',
    stats: [
      { label: 'Plots Verified', value: '2,340', unit: 'titles' },
      { label: 'Avg Price/sqm', value: '₦185K', unit: '' },
      { label: 'Active Developers', value: '47', unit: 'partners' },
      { label: 'YoY Appreciation', value: '+22%', unit: '' }
    ],
    features: [
      'Parcel Fabric with Lagos State LandWeb sync',
      'CityEngine masterplan visualisation for 9 estates',
      'Flood risk overlay (NiMet + Sentinel-2)',
      'Escrow-by-default on transactions'
    ]
  },
  {
    id: 'epe',
    slug: 'epe',
    name: 'Epe Coastal Extension',
    state: 'Lagos',
    type: 'REAL_ESTATE',
    latitude: 6.585,
    longitude: 3.982,
    corridorKm: 58,
    heroImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=80',
    tagline: 'The next investment frontier',
    description:
      'An emerging investment zone just ahead of Epe proper. Speculative land play with corridor adjacency — positioned as the next Lekki for investors who missed the earlier wave. Strong diaspora interest.',
    stats: [
      { label: 'Plots Verified', value: '890', unit: 'titles' },
      { label: 'Avg Price/sqm', value: '₦32K', unit: '' },
      { label: '3Y Growth Forecast', value: '+280%', unit: '' },
      { label: 'Diaspora Buyers', value: '68%', unit: 'share' }
    ],
    features: [
      'Fractional ownership enabled (6 estates live)',
      'AR companion for on-plot verification',
      'Automatic boundary-dispute flagging',
      'Mangrove adjacency & climate risk score'
    ]
  },
  {
    id: 'ijebu',
    slug: 'ijebu-ode',
    name: 'Ijebu-Ode Junction',
    state: 'Ogun',
    type: 'MIXED_USE',
    latitude: 6.8206,
    longitude: 3.9176,
    corridorKm: 112,
    heroImage: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=1600&q=80',
    tagline: 'Strategic freight interchange',
    description:
      'Major interchange where the corridor crosses the Lagos-Ibadan axis. Logistics-heavy zone with growing warehouse development, freight park potential, and the Olumo Rock tourism offshoot.',
    stats: [
      { label: 'Warehouse Zones', value: '14', unit: 'parks' },
      { label: 'Freight Corridor', value: 'Class A', unit: '' },
      { label: 'Plot Inventory', value: '620', unit: 'listed' },
      { label: 'Tourism Score', value: '7.2', unit: '/10' }
    ],
    features: [
      'Fleet and logistics layer (truck parks, weighbridges)',
      'Olumo Rock cultural VR experience',
      'Live truck-park availability for Kobo360 / GIG',
      'Industrial zoning compliance checker'
    ]
  },
  {
    id: 'ondo',
    slug: 'ondo-coastal',
    name: 'Ondo Coastal Belt',
    state: 'Ondo',
    type: 'TOURISM',
    latitude: 6.25,
    longitude: 4.8,
    corridorKm: 210,
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80',
    tagline: '74km of pristine Atlantic coastline',
    description:
      'An undeveloped stretch of Atlantic coastline running east of Ondo town. Raw beachfront in near-pristine condition. Critical window for early land assembly before price discovery begins in earnest.',
    stats: [
      { label: 'Coastline', value: '74', unit: 'km' },
      { label: 'Developed', value: '<3%', unit: '' },
      { label: 'Avg Price/sqm', value: '₦8.5K', unit: '' },
      { label: 'Resort Potential', value: 'Tier-1', unit: '' }
    ],
    features: [
      'Sentinel-2 change detection (coastal erosion monitoring)',
      'Drone photogrammetry captured Q1 2026',
      'Film location scout catalogue (Nollywood)',
      'Carbon credit MRV potential score'
    ]
  },
  {
    id: 'warri',
    slug: 'warri',
    name: 'Warri Delta Hub',
    state: 'Delta',
    type: 'INFRASTRUCTURE',
    latitude: 5.516,
    longitude: 5.75,
    corridorKm: 340,
    heroImage: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=1600&q=80',
    tagline: 'Bridging the Western Delta',
    description:
      'Strategic midpoint where the corridor bridges the Western Delta. Oil and gas infrastructure, dense creek systems, and significant diaspora investor interest from Itsekiri, Urhobo and Isoko communities abroad.',
    stats: [
      { label: 'Diaspora Interest', value: 'High', unit: '' },
      { label: 'Plot Inventory', value: '412', unit: 'listed' },
      { label: 'Creek Access', value: '23', unit: 'waterways' },
      { label: 'Industrial Adjacency', value: 'Yes', unit: '' }
    ],
    features: [
      'Bathymetry overlay for creek-front properties',
      'Itsekiri / Urhobo diaspora community portal',
      'O&G industrial adjacency risk scoring',
      'Waterway navigation VR module'
    ]
  },
  {
    id: 'yenagoa',
    slug: 'yenagoa',
    name: 'Yenagoa Waterfront',
    state: 'Bayelsa',
    type: 'MIXED_USE',
    latitude: 4.9267,
    longitude: 6.2676,
    corridorKm: 420,
    heroImage: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=1600&q=80',
    tagline: 'Capital on the water',
    description:
      'Bayelsa capital with significant riverfront and government-led redevelopment. Early-stage platform coverage — 180 plots live, growing rapidly as the corridor construction reaches this segment.',
    stats: [
      { label: 'Plot Inventory', value: '180', unit: 'listed' },
      { label: 'Waterfront km', value: '12.4', unit: 'km' },
      { label: 'Gov. Master Plan', value: 'Active', unit: '' },
      { label: 'Avg Price/sqm', value: '₦14K', unit: '' }
    ],
    features: [
      'Government master plan overlay (state partnership)',
      'Flood modelling (annual, seasonal, 100yr)',
      'Riverfront development zoning',
      'Community land-use consultation tracker'
    ]
  },
  {
    id: 'ph',
    slug: 'port-harcourt',
    name: 'Port Harcourt Bypass',
    state: 'Rivers',
    type: 'INFRASTRUCTURE',
    latitude: 4.8156,
    longitude: 7.0498,
    corridorKm: 500,
    heroImage: 'https://images.unsplash.com/photo-1523528283115-9bf9b1699245?w=1600&q=80',
    tagline: 'Eastern Delta economic engine',
    description:
      'The corridor bypasses PH proper but connects to the Eastern Niger Delta economic engine. Strategic interchange for freight, diaspora real estate, and the eastern tourism belt running into Akwa Ibom.',
    stats: [
      { label: 'Interchange Class', value: 'A+', unit: '' },
      { label: 'Plot Inventory', value: '1,120', unit: 'listed' },
      { label: 'Avg Price/sqm', value: '₦48K', unit: '' },
      { label: 'Tourism Transit', value: 'High', unit: '' }
    ],
    features: [
      'Oil & Gas Free Zone adjacency analysis',
      'Refined multi-family housing masterplans',
      'Diaspora fractional investment pool',
      'Corporate campus site selection tool'
    ]
  },
  {
    id: 'uyo',
    slug: 'uyo',
    name: 'Uyo Corridor Spur',
    state: 'Akwa Ibom',
    type: 'MIXED_USE',
    latitude: 5.0378,
    longitude: 7.9128,
    corridorKm: 600,
    heroImage: 'https://images.unsplash.com/photo-1570213489059-0aac6626d401?w=1600&q=80',
    tagline: 'Rising capital, rising capital flows',
    description:
      'State capital with rapid infrastructure investment, new airport, and strong diaspora remittance flows. Ibom Deep Sea Port in planning stages — a secondary investment thesis on this segment.',
    stats: [
      { label: 'Plot Inventory', value: '760', unit: 'listed' },
      { label: 'Airport Grade', value: 'Intl.', unit: '' },
      { label: 'Avg Price/sqm', value: '₦22K', unit: '' },
      { label: 'Remittance Rank', value: 'Top-5', unit: '' }
    ],
    features: [
      'Ibom Deep Sea Port impact modelling',
      'Akwa Ibom diaspora investment community',
      'Airport proximity zone analysis',
      'State Land Bureau API integration'
    ]
  },
  {
    id: 'ibeno',
    slug: 'ibeno',
    name: 'Ibeno Beach Zone',
    state: 'Akwa Ibom',
    type: 'TOURISM',
    latitude: 4.56,
    longitude: 7.99,
    corridorKm: 640,
    heroImage: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80',
    tagline: "One of Africa's longest unbroken beaches",
    description:
      "One of Africa's longest unbroken beaches — 245km of Atlantic coastline. Massive underdeveloped tourism potential with operator marketplace for guesthouses, boat tours and upcoming resort developments.",
    stats: [
      { label: 'Beach Length', value: '245', unit: 'km' },
      { label: 'Operators Listed', value: '28', unit: '' },
      { label: 'Resort Pipeline', value: '6', unit: 'projects' },
      { label: 'VR Captures', value: '41', unit: 'sites' }
    ],
    features: [
      '360° immersive beach sessions (Insta360 Pro 2)',
      'Local operator commission marketplace',
      'Carbon credit mangrove MRV pilot zone',
      'Multiplayer VR tour sessions for diaspora families'
    ]
  },
  {
    id: 'tinapa',
    slug: 'tinapa',
    name: 'Tinapa & Marina Resort',
    state: 'Cross River',
    type: 'TOURISM',
    latitude: 5.0,
    longitude: 8.29,
    corridorKm: 680,
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=80',
    tagline: 'Flagship tourism complex',
    description:
      "Cross River's flagship tourism complex. Eastern gateway of the corridor with shopping, resort, marina and adjacency to the Calabar Carnival. Strong state government partnership opportunity.",
    stats: [
      { label: 'Visitor Capacity', value: '12K', unit: '/day' },
      { label: 'Hotel Inventory', value: '2,400', unit: 'keys' },
      { label: 'Marina Berths', value: '86', unit: 'slots' },
      { label: 'Annual Carnival', value: 'Dec', unit: 'peak' }
    ],
    features: [
      'Calabar Carnival VR ticketing platform',
      'State tourism board partnership dashboard',
      'Marina slot booking integration',
      'Cross-border shopping logistics tracker'
    ]
  },
  {
    id: 'calabar',
    slug: 'calabar',
    name: 'Calabar Terminus',
    state: 'Cross River',
    type: 'INFRASTRUCTURE',
    latitude: 4.9589,
    longitude: 8.3269,
    corridorKm: 700.3,
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=80',
    tagline: 'Eastern origin, historic gateway',
    description:
      'Eastern origin of the corridor. Historic port city and gateway to Obudu Mountain Resort, rainforest assets, and the Cross River tourism belt. Primary diaspora destination for Efik, Ibibio, and Cross River communities.',
    stats: [
      { label: 'Historic District', value: '412', unit: 'acres' },
      { label: 'Tourism POIs', value: '62', unit: 'sites' },
      { label: 'Plot Inventory', value: '540', unit: 'listed' },
      { label: 'Corridor KM', value: '700.3', unit: 'km' }
    ],
    features: [
      'Obudu Mountain Resort VR side-quest module',
      'Historic district heritage preservation layer',
      'Cross-border tourism (Cameroon) routing',
      'Efik / Ibibio diaspora investment community'
    ]
  }
];

export const getDestinationBySlug = (slug: string) => destinations.find((d) => d.slug === slug);
export const getDestinationById = (id: string) => destinations.find((d) => d.id === id);
