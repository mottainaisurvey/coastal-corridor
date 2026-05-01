'use client';

import { useEffect } from 'react';

// All 12 active properties from the platform inventory
const LISTINGS = [
  {
    id: 'p-001', slug: 'ocean-pearl-lekki-2br', type: 'APARTMENT',
    title: 'Ocean Pearl · 2-Bedroom at Pinnock Beach',
    destinationId: 'lekki', destinationName: 'Lekki Peninsula', state: 'Lagos',
    lat: 6.4389, lng: 3.5812,
    price: '₦185M', pricePerSqm: '₦1.3M/sqm', bedrooms: 2, bathrooms: 3, areaSqm: 450,
    yoy: 18, floodRisk: 22, disputeRisk: 8, titleStatus: 'VERIFIED',
    agentName: 'Chiamaka Okafor', agentVerified: true, featured: true,
    heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80',
    virtualTourUrl: 'https://my.matterport.com/show/?m=qX8svFDZvSy',
    amenities: ['Gym', 'Pool', 'Beach access', 'Concierge', '24/7 power']
  },
  {
    id: 'p-002', slug: 'coastal-vista-epe-plot', type: 'LAND_ONLY',
    title: 'Coastal Vista · 600sqm Beachfront Plot',
    destinationId: 'epe', destinationName: 'Epe Coastal Extension', state: 'Lagos',
    lat: 6.5872, lng: 3.984,
    price: '₦24M', pricePerSqm: '₦40K/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 600,
    yoy: 34, floodRisk: 28, disputeRisk: 12, titleStatus: 'VERIFIED',
    agentName: 'Adewale Johnson', agentVerified: true, featured: true,
    heroImage: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Beach frontage', 'Perimeter wall', 'Interlocked roads']
  },
  {
    id: 'p-003', slug: 'ikoyi-heritage-townhouse', type: 'HOUSE',
    title: 'Ikoyi Heritage · 4BR Colonial Townhouse',
    destinationId: 'vi', destinationName: 'Victoria Island Terminus', state: 'Lagos',
    lat: 6.4502, lng: 3.4356,
    price: '₦620M', pricePerSqm: '₦696K/sqm', bedrooms: 4, bathrooms: 4, areaSqm: 890,
    yoy: 11, floodRisk: 18, disputeRisk: 5, titleStatus: 'VERIFIED',
    agentName: 'Funmilayo Adebayo', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    virtualTourUrl: 'https://my.matterport.com/show/?m=UHjb4BshXd1',
    amenities: ['Garden', 'Servants quarters', 'Carport (4)', 'Generator']
  },
  {
    id: 'p-004', slug: 'ondo-beach-resort-site', type: 'HOSPITALITY',
    title: 'Ondo Beach · 2.4-Hectare Resort Development Site',
    destinationId: 'ondo', destinationName: 'Ondo Coastal Belt', state: 'Ondo',
    lat: 6.2489, lng: 4.8124,
    price: '₦204M', pricePerSqm: '₦8.5K/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 24000,
    yoy: 28, floodRisk: 35, disputeRisk: 15, titleStatus: 'VERIFIED',
    agentName: 'Olumide Odukoya', agentVerified: true, featured: true,
    heroImage: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Private beach', 'Road access', 'Grid electricity at boundary']
  },
  {
    id: 'p-005', slug: 'calabar-heritage-villa', type: 'HOUSE',
    title: 'Calabar Heritage · 5BR Hillside Villa',
    destinationId: 'calabar', destinationName: 'Calabar Terminus', state: 'Cross River',
    lat: 4.9601, lng: 8.3201,
    price: '₦48M', pricePerSqm: '₦40K/sqm', bedrooms: 5, bathrooms: 6, areaSqm: 1200,
    yoy: 14, floodRisk: 15, disputeRisk: 7, titleStatus: 'VERIFIED',
    agentName: 'Eyo Okon', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Swimming pool', 'River view', 'Outdoor kitchen', 'Solar power']
  },
  {
    id: 'p-006', slug: 'ph-waterfront-duplex', type: 'HOUSE',
    title: 'Amadi Flats · 4BR Waterfront Duplex',
    destinationId: 'ph', destinationName: 'Port Harcourt Bypass', state: 'Rivers',
    lat: 4.8189, lng: 7.0534,
    price: '₦180M', pricePerSqm: '₦250K/sqm', bedrooms: 4, bathrooms: 5, areaSqm: 720,
    yoy: 9, floodRisk: 42, disputeRisk: 10, titleStatus: 'VERIFIED',
    agentName: 'Ibifiri Briggs', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Estate security', 'Central sewage', 'Fibre internet', 'Pool']
  },
  {
    id: 'p-007', slug: 'lekki-commercial-plaza', type: 'COMMERCIAL',
    title: 'Admiralty Way · Commercial Plaza Unit',
    destinationId: 'lekki', destinationName: 'Lekki Peninsula', state: 'Lagos',
    lat: 6.4412, lng: 3.4756,
    price: '₦420M', pricePerSqm: '₦1.5M/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 280,
    yoy: 16, floodRisk: 30, disputeRisk: 6, titleStatus: 'VERIFIED',
    agentName: 'Chiamaka Okafor', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Parking (12 bays)', 'Generator', 'Loading bay', 'Shop front']
  },
  {
    id: 'p-008', slug: 'uyo-new-estate-terrace', type: 'HOUSE',
    title: 'Shelter Afrique Estate · 3BR Terrace',
    destinationId: 'uyo', destinationName: 'Uyo Corridor Spur', state: 'Akwa Ibom',
    lat: 5.041, lng: 7.918,
    price: '₦65M', pricePerSqm: '₦186K/sqm', bedrooms: 3, bathrooms: 4, areaSqm: 350,
    yoy: 12, floodRisk: 20, disputeRisk: 8, titleStatus: 'VERIFIED',
    agentName: 'Enobong Essien', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1570213489059-0aac6626d401?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Estate security', 'Street lights', 'Tarred roads']
  },
  {
    id: 'p-009', slug: 'tinapa-resort-apartments', type: 'APARTMENT',
    title: 'Tinapa Residences · 1BR Service Apartment',
    destinationId: 'tinapa', destinationName: 'Tinapa & Marina Resort', state: 'Cross River',
    lat: 5.002, lng: 8.293,
    price: '₦28M', pricePerSqm: '₦233K/sqm', bedrooms: 1, bathrooms: 1, areaSqm: 120,
    yoy: 8, floodRisk: 25, disputeRisk: 10, titleStatus: 'VERIFIED',
    agentName: 'Eyo Okon', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Pool', 'Restaurant', 'Housekeeping', 'Resort access']
  },
  {
    id: 'p-010', slug: 'ibeno-beachfront-acres', type: 'LAND_ONLY',
    title: 'Ibeno Beach · 5 Acres Oceanfront',
    destinationId: 'ibeno', destinationName: 'Ibeno Beach Zone', state: 'Akwa Ibom',
    lat: 4.561, lng: 7.991,
    price: '₦95M', pricePerSqm: '₦4.7K/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 20234,
    yoy: 38, floodRisk: 45, disputeRisk: 18, titleStatus: 'VERIFIED',
    agentName: 'Enobong Essien', agentVerified: true, featured: true,
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Private ocean frontage', 'Road access (2km from highway)']
  },
  {
    id: 'p-011', slug: 'warri-waterfront-plot', type: 'LAND_ONLY',
    title: 'Warri Waterfront · 1,000sqm Creek-Adjacent',
    destinationId: 'warri', destinationName: 'Warri Delta Hub', state: 'Delta',
    lat: 5.519, lng: 5.752,
    price: '₦42M', pricePerSqm: '₦42K/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 1000,
    yoy: 15, floodRisk: 48, disputeRisk: 22, titleStatus: 'VERIFIED',
    agentName: 'Oghenekaro Tsekpo', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['Creek frontage', 'Road access', 'Community consent documented']
  },
  {
    id: 'p-012', slug: 'yenagoa-riverside-plot', type: 'LAND_ONLY',
    title: 'Yenagoa Riverside · 800sqm Plot',
    destinationId: 'yenagoa', destinationName: 'Yenagoa Waterfront', state: 'Bayelsa',
    lat: 4.928, lng: 6.269,
    price: '₦11.2M', pricePerSqm: '₦14K/sqm', bedrooms: 0, bathrooms: 0, areaSqm: 800,
    yoy: 22, floodRisk: 55, disputeRisk: 18, titleStatus: 'PENDING',
    agentName: 'Tari Perewarai', agentVerified: true, featured: false,
    heroImage: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800&q=80',
    virtualTourUrl: null,
    amenities: ['River adjacency', 'Master plan zone']
  }
];

const DESTINATIONS = [
  { id: 'vi', name: 'Victoria Island Terminus', state: 'Lagos', lat: 6.4281, lng: 3.4216, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3', corridorKm: 0 },
  { id: 'lekki', name: 'Lekki Peninsula', state: 'Lagos', lat: 6.4698, lng: 3.5852, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c', corridorKm: 42.1 },
  { id: 'epe', name: 'Epe Coastal Extension', state: 'Lagos', lat: 6.5833, lng: 3.9833, type: 'realestate', tag: 'REAL ESTATE', color: '#c96a3f', corridorKm: 98.4 },
  { id: 'ijebu', name: 'Ijebu-Ode Junction', state: 'Ogun', lat: 6.8167, lng: 3.9333, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c', corridorKm: 142 },
  { id: 'ondo', name: 'Ondo Coastal Belt', state: 'Ondo', lat: 6.25, lng: 4.8, type: 'tourism', tag: 'TOURISM', color: '#8aa876', corridorKm: 220 },
  { id: 'warri', name: 'Warri Delta Hub', state: 'Delta', lat: 5.5167, lng: 5.75, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3', corridorKm: 312.5 },
  { id: 'yenagoa', name: 'Yenagoa Waterfront', state: 'Bayelsa', lat: 4.9247, lng: 6.2642, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c', corridorKm: 380 },
  { id: 'ph', name: 'Port Harcourt Bypass', state: 'Rivers', lat: 4.8156, lng: 7.0498, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3', corridorKm: 440 },
  { id: 'uyo', name: 'Uyo Corridor Spur', state: 'Akwa Ibom', lat: 5.0378, lng: 7.9128, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c', corridorKm: 520 },
  { id: 'ibeno', name: 'Ibeno Beach Zone', state: 'Akwa Ibom', lat: 4.56, lng: 7.99, type: 'tourism', tag: 'TOURISM', color: '#8aa876', corridorKm: 560 },
  { id: 'tinapa', name: 'Tinapa & Marina Resort', state: 'Cross River', lat: 5.0, lng: 8.29, type: 'tourism', tag: 'TOURISM', color: '#8aa876', corridorKm: 640 },
  { id: 'calabar', name: 'Calabar Terminus', state: 'Cross River', lat: 4.9589, lng: 8.3269, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3', corridorKm: 700.3 }
];

// Tier 1: Destination hero images (curated Unsplash aerial/coastal photography per destination)
const DEST_HEROES: Record<string, string> = {
  vi:      'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?w=800&q=80', // Lagos skyline / VI
  lekki:   'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&q=80', // Lekki coastline
  epe:     'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80', // Coastal lagoon
  ijebu:   'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800&q=80', // Tropical road
  ondo:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // Ondo beach coast
  warri:   'https://images.unsplash.com/photo-1605980776566-0486c3ac7617?w=800&q=80', // Delta waterway
  yenagoa: 'https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?w=800&q=80', // River / waterfront
  ph:      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Port / waterfront
  uyo:     'https://images.unsplash.com/photo-1570213489059-0aac6626d401?w=800&q=80', // Estate road
  ibeno:   'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80', // Ibeno beach
  tinapa:  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80', // Resort / marina
  calabar: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80', // Calabar hillside
};

const TYPE_COLORS: Record<string, string> = {
  APARTMENT: '#c96a3f',
  HOUSE: '#d4a24c',
  LAND_ONLY: '#8aa876',
  COMMERCIAL: '#4db3b3',
  HOSPITALITY: '#9b7fd4'
};

const TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'APT',
  HOUSE: 'HOUSE',
  LAND_ONLY: 'LAND',
  COMMERCIAL: 'COMM',
  HOSPITALITY: 'HOSP'
};

export default function MapPage() {
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/cesium@1.118/Build/Cesium/Widgets/widgets.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/cesium@1.118/Build/Cesium/Cesium.js';
    script.async = true;
    script.onload = () => initCesium();
    document.head.appendChild(script);

    function initCesium() {
      const Cesium = (window as any).Cesium;
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMWNhMWYyNi03YWJhLTRlZWEtYmEwNi0wMzFlZTFkNGEwYTMiLCJpZCI6NDIwMTg2LCJpYXQiOjE3NzY1ODU5OTl9.tm3bsS6OtVhDC9G96B6B-5mXkuZnnnUA1ATWavPZTr0';

      let viewer: any;
      let listingEntities: any[] = [];
      let destEntities: any[] = [];
      let routeEntity: any;
      let buildingsTileset: any = null;
      let googleTileset: any = null;
      let vrMode = false;
      let flyAnimating = false;
      let journeyMode = false;
      let activeListingId: string | null = null;
      let labelsVisible = true;
      let filteredListings = [...LISTINGS];
      const times = ['Dawn', 'Midday', 'Dusk', 'Night'];
      let timeIdx = 1;
      // Tier 2: satellite/street toggle state
      let satelliteMode = true; // true = Bing aerial (default), false = OSM street

      // ============ FILTER STATE ============
      let filterType = 'ALL';
      let filterState = 'ALL';
      let filterVerified = false;
      let filterFeatured = false;
      // Tier 2: destination search filter
      let filterDestSearch = '';

      // ============ ACTIVE DESTINATION ============
      let activeDestId: string | null = null;

      async function init() {
        try {
          viewer = new Cesium.Viewer('cesium', {
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            sceneModePicker: false,
            navigationHelpButton: false,
            animation: false,
            timeline: false,
            fullscreenButton: false,
            selectionIndicator: false,
            infoBox: false,
            terrain: Cesium.Terrain.fromWorldTerrain({ requestVertexNormals: true, requestWaterMask: true }),
            skyBox: false,
            skyAtmosphere: new Cesium.SkyAtmosphere()
          });

          try {
            const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(imageryProvider);
          } catch (e: any) {
            console.warn('Bing imagery unavailable:', e.message);
          }

          viewer.scene.globe.enableLighting = false;
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.00012;
          viewer.scene.skyAtmosphere.hueShift = -0.05;
          viewer.scene.skyAtmosphere.saturationShift = -0.15;
          viewer.scene.skyAtmosphere.brightnessShift = -0.1;
          viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e12');

          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(5.8, 4.2, 1100000),
            orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-55), roll: 0 }
          });

          plotListings();
          plotDestinations();
          plotRoute();
          buildDestinationsSidebar();
          buildFilterBar();
          startClock();
          wireClickHandler();
          // Tier 3: KM progress bar
          buildKmProgressBar();
          // Tier 2: deep-link URL handling
          handleDeepLink();

          setTimeout(() => {
            const loading = document.getElementById('cesium-loading');
            if (loading) loading.classList.add('hide');
            setTimeout(() => cameraOverview(), 400);
          }, 2200);

        } catch (err) {
          console.error('Cesium init failed:', err);
          const loading = document.getElementById('cesium-loading');
          if (loading) loading.innerHTML = '<div class="loading-text">Unable to load terrain</div><div class="loading-sub">Check network · Verify token</div>';
        }
      }

      // ============ PLOT LISTINGS ============
      function plotListings() {
        listingEntities.forEach(e => viewer.entities.remove(e));
        listingEntities = [];

        filteredListings.forEach(p => {
          const color = TYPE_COLORS[p.type] || '#d4a24c';
          const typeLabel = TYPE_LABELS[p.type] || p.type;

          const entity = viewer.entities.add({
            id: `listing-${p.id}`,
            position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat, 200),
            billboard: {
              image: createPinCanvas(color, typeLabel),
              width: 52,
              height: 52,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(5000, 1.4, 1500000, 0.6)
            },
            label: {
              text: p.title.split('·')[0].trim() + '\n' + p.price,
              font: '600 11px "Inter Tight", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#0a0e12'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -64),
              heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(10,14,18,0.88)'),
              backgroundPadding: new Cesium.Cartesian2(6, 3),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 600000),
              show: labelsVisible
            },
            listingData: p
          });
          listingEntities.push(entity);
        });

        updateListingCount();
      }

      function createPinCanvas(color: string, label: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 52;
        canvas.height = 52;
        const ctx = canvas.getContext('2d')!;

        // Outer glow ring
        ctx.beginPath();
        ctx.arc(26, 26, 24, 0, Math.PI * 2);
        ctx.fillStyle = color + '33';
        ctx.fill();

        // Main circle
        ctx.beginPath();
        ctx.arc(26, 26, 18, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // White border
        ctx.beginPath();
        ctx.arc(26, 26, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Type label text
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${label.length > 4 ? '7' : '8'}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 26, 26);

        return canvas;
      }

      // Tier 1: Active destination globe highlight — pulsing canvas for active dest marker
      function createActiveDestCanvas(color: string): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 36;
        canvas.height = 36;
        const ctx = canvas.getContext('2d')!;
        // Outer pulse ring
        ctx.beginPath();
        ctx.arc(18, 18, 16, 0, Math.PI * 2);
        ctx.fillStyle = color + '44';
        ctx.fill();
        // Inner filled circle
        ctx.beginPath();
        ctx.arc(18, 18, 10, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // White border
        ctx.beginPath();
        ctx.arc(18, 18, 10, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        return canvas;
      }

      // Tier 2: Globe listing count badge canvas for destination markers
      function createDestCountCanvas(color: string, count: number): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = 28;
        canvas.height = 28;
        const ctx = canvas.getContext('2d')!;
        // Background circle
        ctx.beginPath();
        ctx.arc(14, 14, 13, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Count text
        ctx.fillStyle = '#0a0e12';
        ctx.font = `bold ${count > 9 ? '8' : '9'}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(count), 14, 14);
        return canvas;
      }

      // ============ DESTINATION AMBIENT MARKERS ============
      function plotDestinations() {
        DESTINATIONS.forEach(d => {
          const listingCount = LISTINGS.filter(p => p.destinationId === d.id).length;
          const entity = viewer.entities.add({
            id: `dest-${d.id}`,
            position: Cesium.Cartesian3.fromDegrees(d.lng, d.lat, 30),
            point: {
              pixelSize: 8,
              color: Cesium.Color.fromCssColorString(d.color).withAlpha(0.5),
              outlineColor: Cesium.Color.WHITE.withAlpha(0.3),
              outlineWidth: 1,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(200000, Number.POSITIVE_INFINITY)
            },
            label: {
              text: d.name,
              font: '10px "Inter Tight", sans-serif',
              fillColor: Cesium.Color.WHITE.withAlpha(0.6),
              outlineColor: Cesium.Color.fromCssColorString('#0a0e12'),
              outlineWidth: 2,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -18),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(400000, Number.POSITIVE_INFINITY),
              scaleByDistance: new Cesium.NearFarScalar(400000, 0.8, 2000000, 0.4)
            },
            // Tier 2: listing count badge billboard (visible at mid-altitude)
            billboard: listingCount > 0 ? {
              image: createDestCountCanvas(d.color, listingCount),
              width: 28,
              height: 28,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              pixelOffset: new Cesium.Cartesian2(18, 0),
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(50000, 500000),
              scaleByDistance: new Cesium.NearFarScalar(50000, 1.2, 500000, 0.7)
            } : undefined,
            destData: d
          });
          destEntities.push(entity);
        });
      }

      // Tier 1: Update active destination globe highlight
      function updateActiveDestMarker(destId: string | null) {
        destEntities.forEach(e => {
          const d = e.destData;
          if (!d) return;
          if (d.id === destId) {
            // Active: replace point with pulsing billboard
            e.point.pixelSize = 0;
            e.point.color = Cesium.Color.TRANSPARENT;
            if (!e._activeBillboard) {
              e._activeBillboard = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(d.lng, d.lat, 300),
                billboard: {
                  image: createActiveDestCanvas(d.color),
                  width: 36,
                  height: 36,
                  verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                  heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND,
                  disableDepthTestDistance: Number.POSITIVE_INFINITY,
                  scaleByDistance: new Cesium.NearFarScalar(5000, 1.6, 800000, 0.8)
                }
              });
            }
          } else {
            // Inactive: restore point, remove active billboard
            e.point.pixelSize = 8;
            e.point.color = Cesium.Color.fromCssColorString(d.color).withAlpha(0.5);
            if (e._activeBillboard) {
              viewer.entities.remove(e._activeBillboard);
              e._activeBillboard = null;
            }
          }
        });
      }

      function plotRoute() {
        const ROAD_COORDS: [number, number][] = [
          [3.4216, 6.4281],[3.4400, 6.4320],[3.4600, 6.4350],
          [3.4800, 6.4370],[3.5000, 6.4380],[3.5200, 6.4390],[3.5500, 6.4389],[3.5812, 6.4389],
          [3.6100, 6.4420],[3.6500, 6.4500],[3.6900, 6.4600],[3.7200, 6.4700],[3.7600, 6.4820],
          [3.8000, 6.5000],[3.8400, 6.5200],[3.8700, 6.5400],
          [3.8900, 6.5550],[3.9100, 6.5650],
          [3.9500, 6.5800],[3.9833, 6.5833],[4.0100, 6.5900],
          [4.0500, 6.6100],[4.0800, 6.6400],[4.1000, 6.6700],[4.0900, 6.7000],[4.0600, 6.7300],
          [4.0200, 6.7700],[3.9800, 6.8000],[3.9500, 6.8100],[3.9333, 6.8167],
          [3.9600, 6.7800],[4.0000, 6.7400],[4.0500, 6.7000],[4.1000, 6.6800],[4.1500, 6.6600],
          [4.2000, 6.6300],[4.2500, 6.5900],[4.3000, 6.5500],[4.3500, 6.5000],[4.4000, 6.4500],
          [4.4500, 6.4000],
          [4.8000, 6.2500],[4.8124, 6.2489],
          [4.8500, 6.2200],[4.9000, 6.1800],[4.9500, 6.1400],[5.0000, 6.0900],[5.0500, 6.0400],
          [5.1000, 5.9800],[5.1500, 5.9200],[5.2000, 5.8600],
          [5.2500, 5.8000],[5.3000, 5.7500],[5.3500, 5.7100],[5.4000, 5.6800],[5.4500, 6.5600],
          [5.5000, 5.6400],[5.5500, 5.6200],[5.6000, 5.5900],[5.6500, 5.5700],[5.7000, 5.5500],
          [5.7500, 5.5200],[5.8000, 5.5000],[5.8500, 5.4800],[5.9000, 5.4500],[5.9500, 5.4200],
          [6.0000, 5.4000],
          [5.7500, 5.5167],[5.7520, 5.5167],
          [5.8000, 5.4500],[5.9000, 5.3500],[6.0000, 5.2500],[6.1000, 5.1500],[6.1500, 5.0800],
          [6.2000, 5.0200],[6.2500, 4.9800],[6.2642, 4.9247],
          [6.2700, 4.9200],
          [6.3500, 4.9000],[6.4500, 4.8800],[6.5500, 4.8600],[6.6500, 4.8400],[6.7500, 4.8300],
          [6.8500, 4.8200],[6.9500, 4.8200],[7.0000, 4.8156],[7.0498, 4.8156],
          [7.1000, 4.8200],
          [7.2000, 4.8400],[7.3000, 4.8600],[7.4000, 4.8900],[7.5000, 4.9200],[7.6000, 4.9600],
          [7.7000, 5.0000],[7.8000, 5.0300],[7.9000, 5.0400],[7.9128, 5.0378],
          [7.9500, 5.0200],
          [8.0000, 4.9500],[8.0500, 4.8500],[7.9900, 4.7000],[7.9900, 4.5800],[7.9900, 4.5600],
          [7.9900, 4.5200],
          [8.0000, 4.5000],
          [8.0500, 4.6000],[8.1000, 4.7000],[8.1500, 4.7800],[8.2000, 4.8500],[8.2500, 4.9000],
          [8.2900, 4.9300],
          [8.2900, 5.0000],
          [8.3100, 4.9700],[8.3200, 4.9600],[8.3269, 4.9589]
        ];

        const positions = ROAD_COORDS.map(([lng, lat]) =>
          Cesium.Cartesian3.fromDegrees(lng, lat, 0)
        );

        viewer.entities.add({
          polyline: {
            positions, width: 6,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString('#1a1a1a').withAlpha(0.9),
              gapColor: Cesium.Color.TRANSPARENT, dashLength: 999999
            }),
            clampToGround: true, classificationType: Cesium.ClassificationType.TERRAIN
          }
        });

        viewer.entities.add({
          polyline: {
            positions, width: 4,
            material: Cesium.Color.fromCssColorString('#3d3d3d').withAlpha(0.95),
            clampToGround: true, classificationType: Cesium.ClassificationType.TERRAIN
          }
        });

        viewer.entities.add({
          polyline: {
            positions, width: 1.2,
            material: new Cesium.PolylineDashMaterialProperty({
              color: Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.85),
              gapColor: Cesium.Color.TRANSPARENT, dashLength: 24, dashPattern: 0xFF00
            }),
            clampToGround: true, classificationType: Cesium.ClassificationType.TERRAIN
          }
        });

        routeEntity = viewer.entities.add({
          polyline: {
            positions, width: 10,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.08, taperPower: 1.0,
              color: Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.25)
            }),
            clampToGround: true
          }
        });
      }

      // ============ CLICK HANDLER ============
      function wireClickHandler() {
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: any) => {
          const picked = viewer.scene.pick(movement.position);
          if (Cesium.defined(picked) && picked.id) {
            if (picked.id.listingData) {
              openListingCard(picked.id.listingData);
            } else if (picked.id.destData) {
              openDestinationPanel(picked.id.destData);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ============ LISTING CARD PANEL ============
      function openListingCard(p: any) {
        activeListingId = p.id;

        document.querySelectorAll('.listing-item').forEach(el => el.classList.remove('active'));
        const activeEl = document.querySelector(`[data-listing-id="${p.id}"]`);
        if (activeEl) activeEl.classList.add('active');

        const panel = document.getElementById('listingPanel');
        if (!panel) return;

        const typeColor = TYPE_COLORS[p.type] || '#d4a24c';
        const hasVirtualTour = !!p.virtualTourUrl;
        const bedroomsBath = p.bedrooms > 0
          ? `<span class="spec-item">🛏 ${p.bedrooms} bed</span><span class="spec-item">🚿 ${p.bathrooms} bath</span>`
          : '';
        const areaSpec = `<span class="spec-item">📐 ${p.areaSqm.toLocaleString()} sqm</span>`;
        const riskColor = (score: number) => score < 25 ? '#6fae7a' : score < 45 ? '#d4a24c' : '#e85a4f';

        const matterportPreview = hasVirtualTour ? `
          <div class="matterport-preview" id="mpPreview-${p.id}">
            <div class="mp-thumb" onclick="expandMatterport('${p.virtualTourUrl}', '${p.id}')">
              <iframe
                src="${p.virtualTourUrl}&play=1&autoplay=1&mute=1"
                allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
                style="width:100%;height:100%;border:0;pointer-events:none;"
                loading="lazy"
              ></iframe>
              <div class="mp-overlay">
                <div class="mp-play-btn">▶ LAUNCH 3D TOUR</div>
              </div>
            </div>
          </div>
        ` : '';

        panel.innerHTML = `
          <div class="lp-header" style="border-left: 3px solid ${typeColor}">
            <div class="lp-close" onclick="closeListingCard()">×</div>
            <div class="lp-type-chip" style="background:${typeColor}22;color:${typeColor}">${p.type.replace('_', ' ')}</div>
            ${p.titleStatus === 'VERIFIED' ? '<div class="lp-verified">✓ VERIFIED TITLE</div>' : '<div class="lp-pending">⏳ TITLE PENDING</div>'}
            ${p.featured ? '<div class="lp-featured">★ FEATURED</div>' : ''}
          </div>
          <div class="lp-hero" style="background-image:url('${p.heroImage}')">
            <div class="lp-hero-overlay"></div>
            <div class="lp-yoy">+${p.yoy}% YoY</div>
          </div>
          <div class="lp-body">
            <div class="lp-location">${p.destinationName} · ${p.state} State</div>
            <div class="lp-title">${p.title}</div>
            <div class="lp-specs">${bedroomsBath}${areaSpec}</div>
            <div class="lp-price-row">
              <div class="lp-price">${p.price}</div>
              <div class="lp-price-sqm">${p.pricePerSqm}</div>
            </div>
            <div class="lp-risk-row">
              <div class="risk-item">
                <div class="risk-label">Flood Risk</div>
                <div class="risk-bar"><div class="risk-fill" style="width:${p.floodRisk}%;background:${riskColor(p.floodRisk)}"></div></div>
                <div class="risk-score" style="color:${riskColor(p.floodRisk)}">${p.floodRisk}/100</div>
              </div>
              <div class="risk-item">
                <div class="risk-label">Dispute Risk</div>
                <div class="risk-bar"><div class="risk-fill" style="width:${p.disputeRisk}%;background:${riskColor(p.disputeRisk)}"></div></div>
                <div class="risk-score" style="color:${riskColor(p.disputeRisk)}">${p.disputeRisk}/100</div>
              </div>
            </div>
            <div class="lp-agent">
              <div class="agent-avatar">${p.agentName.split(' ').map((n: string) => n[0]).join('')}</div>
              <div class="agent-info">
                <div class="agent-name">${p.agentName}</div>
                <div class="agent-badge">${p.agentVerified ? '✓ Verified Agent' : 'Agent'}</div>
              </div>
            </div>
            ${matterportPreview}
            <div class="lp-actions">
              <button class="lp-btn-primary" onclick="flyToListing('${p.id}')">✈ FLY TO THIS LISTING</button>
              <a href="/properties/${p.slug}" class="lp-btn-secondary" target="_blank">VIEW FULL LISTING →</a>
            </div>
          </div>
        `;
        panel.classList.add('open');
        // Tier 2: update deep-link URL
        updateDeepLinkUrl(null, p.id);
      }

      // ============ DESTINATION DETAIL PANEL ============
      function closeListingCard() {
        const panel = document.getElementById('listingPanel');
        if (panel) panel.classList.remove('open');
        activeListingId = null;
        activeDestId = null;
        document.querySelectorAll('.dest-item').forEach(el => el.classList.remove('active'));
        showAllListings();
        // Tier 1: clear active globe highlight
        updateActiveDestMarker(null);
        // Tier 3: reset KM progress bar
        updateKmProgressBar(null);
        // Tier 2: clear deep-link URL
        updateDeepLinkUrl(null, null);
      }

      function openDestinationPanel(d: any) {
        activeDestId = d.id;

        document.querySelectorAll('.dest-item').forEach(el => el.classList.remove('active'));
        const activeEl = document.querySelector(`[data-dest-id="${d.id}"]`);
        if (activeEl) activeEl.classList.add('active');

        showListingsForDestination(d.id);
        // Tier 1: update active globe highlight
        updateActiveDestMarker(d.id);
        // Tier 3: update KM progress bar
        updateKmProgressBar(d.corridorKm);
        // Tier 2: update deep-link URL
        updateDeepLinkUrl(d.id, null);

        const rightPanelOffset = 0.045;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(d.lng - 0.08, d.lat - rightPanelOffset, 18000),
          orientation: { heading: Cesium.Math.toRadians(destHeadingsMap[d.id] ?? 90), pitch: Cesium.Math.toRadians(-32), roll: 0 },
          duration: 3
        });

        const listings = LISTINGS.filter(p => p.destinationId === d.id);
        const tagColor: Record<string, string> = {
          'INFRASTRUCTURE': '#4db3b3', 'MIXED USE': '#d4a24c',
          'REAL ESTATE': '#c96a3f', 'TOURISM': '#8aa876'
        };
        const tc = tagColor[d.tag] || '#d4a24c';
        // Tier 1: use real hero image for destination
        const heroImg = DEST_HEROES[d.id] || '';

        const listingRows = listings.length > 0
          ? listings.map(p => {
              const typeColor = TYPE_COLORS[p.type] || '#d4a24c';
              return `
                <div class="dest-listing-row" onclick="openListingFromDest('${p.id}')">
                  <div class="dlr-img" style="background-image:url('${p.heroImage}')"></div>
                  <div class="dlr-body">
                    <div class="dlr-type" style="color:${typeColor}">${p.type.replace('_', ' ')}</div>
                    <div class="dlr-title">${p.title}</div>
                    <div class="dlr-price">${p.price} <span class="dlr-yoy">+${p.yoy}%</span></div>
                  </div>
                  <div class="dlr-arrow">›</div>
                </div>
              `;
            }).join('')
          : '<div style="padding:12px 0;font-size:11px;color:var(--text-muted)">No active listings at this destination yet.</div>';

        const panel = document.getElementById('listingPanel');
        if (!panel) return;

        panel.innerHTML = `
          <div class="lp-header" style="border-left: 3px solid ${tc}">
            <div class="lp-close" onclick="closeListingCard()">×</div>
            <div class="lp-type-chip" style="background:${tc}22;color:${tc}">${d.tag}</div>
            <div class="lp-verified" style="color:var(--text-muted)">KM ${d.corridorKm}</div>
          </div>
          <div class="lp-hero" style="background-image:url('${heroImg}');background-size:cover;background-position:center;">
            <div class="lp-hero-overlay"></div>
            <div class="dest-hero-label">
              <div class="dest-hero-state">${d.state} State</div>
              <div class="dest-hero-name">${d.name}</div>
              <div class="dest-hero-tag" style="background:${tc}33;color:${tc}">${d.tag}</div>
            </div>
          </div>
          <div class="lp-body">
            <div class="lp-location">Lagos–Calabar Coastal Corridor · KM ${d.corridorKm}</div>
            <div class="lp-stats-grid">
              <div class="lp-stat"><div class="lp-stat-val">${listings.length}</div><div class="lp-stat-label">Active Listings</div></div>
              <div class="lp-stat"><div class="lp-stat-val">${d.corridorKm} km</div><div class="lp-stat-label">From Lagos</div></div>
              <div class="lp-stat"><div class="lp-stat-val">${(700.3 - d.corridorKm).toFixed(1)} km</div><div class="lp-stat-label">To Calabar</div></div>
              <div class="lp-stat"><div class="lp-stat-val">${d.state}</div><div class="lp-stat-label">State</div></div>
            </div>
            <div style="font-size:10px;letter-spacing:0.1em;color:var(--text-muted);text-transform:uppercase;margin:14px 0 8px">Listings at this destination</div>
            <div class="dest-listings-list">${listingRows}</div>
            <div class="lp-actions" style="margin-top:16px">
              <button class="lp-btn-primary" onclick="flyToDestination('${d.id}')">✈ FLY TO DESTINATION</button>
              <button class="lp-btn-secondary" onclick="closeListingCard()">← BACK TO CORRIDOR</button>
            </div>
          </div>
        `;
        panel.classList.add('open');
      }

      const destHeadingsMap: Record<string, number> = {
        vi: 75, lekki: 88, epe: 60, ijebu: 135, ondo: 110,
        warri: 95, yenagoa: 90, ph: 85, uyo: 120, ibeno: 55,
        tinapa: 80, calabar: 90
      };

      function flyToDestination(id: string) {
        const d = DESTINATIONS.find(x => x.id === id);
        if (!d) return;
        const rightPanelOffset = 0.045;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(d.lng - 0.08, d.lat - rightPanelOffset, 14000),
          orientation: { heading: Cesium.Math.toRadians(destHeadingsMap[d.id] ?? 90), pitch: Cesium.Math.toRadians(-30), roll: 0 },
          duration: 3.5
        });
      }

      function openListingFromDest(id: string) {
        const p = LISTINGS.find(x => x.id === id);
        if (!p) return;
        openListingCard(p);
        const rightPanelDegOffset = 0.04;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(p.lng - 0.06, p.lat - rightPanelDegOffset, 6000),
          orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
          duration: 2.5
        });
      }

      function showListingsForDestination(destId: string) {
        listingEntities.forEach(e => {
          const p = e.listingData;
          e.show = !p || p.destinationId === destId;
        });
      }

      function showAllListings() {
        listingEntities.forEach(e => { e.show = true; });
      }

      function expandMatterport(url: string, id: string) {
        const overlay = document.getElementById('matterportOverlay');
        const iframe = document.getElementById('matterportIframe') as HTMLIFrameElement;
        if (overlay && iframe) {
          iframe.src = `${url}&play=1`;
          overlay.classList.add('open');
        }
      }

      function closeMatterport() {
        const overlay = document.getElementById('matterportOverlay');
        const iframe = document.getElementById('matterportIframe') as HTMLIFrameElement;
        if (overlay) overlay.classList.remove('open');
        if (iframe) iframe.src = '';
      }

      function showDestinationToast(d: any) {
        const toast = document.getElementById('destToast');
        const toastText = document.getElementById('destToastText');
        if (toast && toastText) {
          const count = LISTINGS.filter(p => p.destinationId === d.id).length;
          toastText.textContent = `${d.name} · ${d.state} · ${count} listing${count !== 1 ? 's' : ''} · ${d.corridorKm}km along corridor`;
          toast.classList.add('show');
          clearTimeout((window as any)._destTimer);
          (window as any)._destTimer = setTimeout(() => toast.classList.remove('show'), 4000);
        }
      }

      // ============ SIDEBAR (12 destinations) ============
      function buildDestinationsSidebar() {
        const list = document.getElementById('listingsList');
        if (!list) return;
        // Tier 2: filter by search term
        const searchTerm = filterDestSearch.toLowerCase();
        const filtered = DESTINATIONS.filter(d =>
          !searchTerm ||
          d.name.toLowerCase().includes(searchTerm) ||
          d.state.toLowerCase().includes(searchTerm) ||
          d.tag.toLowerCase().includes(searchTerm)
        );
        list.innerHTML = filtered.map((d, i) => {
          const tagColor: Record<string, string> = {
            'INFRASTRUCTURE': '#4db3b3', 'MIXED USE': '#d4a24c',
            'REAL ESTATE': '#c96a3f', 'TOURISM': '#8aa876'
          };
          const tc = tagColor[d.tag] || '#d4a24c';
          const listingCount = LISTINGS.filter(p => p.destinationId === d.id).length;
          const globalIdx = DESTINATIONS.findIndex(x => x.id === d.id);
          return `
            <div class="dest-item${activeDestId === d.id ? ' active' : ''}" data-dest-id="${d.id}" onclick="sidebarClickDest('${d.id}')">
              <div class="dest-num">${String(globalIdx + 1).padStart(2, '0')}</div>
              <div class="dest-body">
                <div class="dest-name">${d.name}</div>
                <div class="dest-meta">${d.state} · KM ${d.corridorKm}</div>
              </div>
              <div class="dest-tag" style="background:${tc}22;color:${tc}">${d.tag}</div>
              ${listingCount > 0 ? `<div class="dest-badge">${listingCount}</div>` : ''}
            </div>
          `;
        }).join('');
      }

      function sidebarClickDest(id: string) {
        const d = DESTINATIONS.find(x => x.id === id);
        if (!d) return;
        openDestinationPanel(d);
      }

      function flyToListing(id: string, fromButton = true) {
        const p = LISTINGS.find(x => x.id === id);
        if (!p) return;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(p.lng - 0.06, p.lat - 0.04, 6000),
          orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
          duration: fromButton ? 3.5 : 2.5
        });
      }

      // ============ FILTER BAR ============
      function buildFilterBar() {
        const bar = document.getElementById('filterBar');
        if (!bar) return;

        const states = ['ALL', ...Array.from(new Set(LISTINGS.map(p => p.state))).sort()];
        const types = ['ALL', 'APARTMENT', 'HOUSE', 'LAND_ONLY', 'COMMERCIAL', 'HOSPITALITY'];

        bar.innerHTML = `
          <div class="filter-group">
            <label class="filter-label">TYPE</label>
            <div class="filter-pills" id="typePills">
              ${types.map(t => `<button class="filter-pill ${t === 'ALL' ? 'active' : ''}" onclick="setTypeFilter('${t}')">${t === 'ALL' ? 'All' : t.replace('_', ' ')}</button>`).join('')}
            </div>
          </div>
          <div class="filter-group">
            <label class="filter-label">STATE</label>
            <select class="filter-select" onchange="setStateFilter(this.value)">
              ${states.map(s => `<option value="${s}">${s === 'ALL' ? 'All States' : s}</option>`).join('')}
            </select>
          </div>
          <div class="filter-group filter-toggles">
            <label class="filter-toggle-item">
              <input type="checkbox" id="verifiedFilter" onchange="setVerifiedFilter(this.checked)">
              <span>Verified Title Only</span>
            </label>
            <label class="filter-toggle-item">
              <input type="checkbox" id="featuredFilter" onchange="setFeaturedFilter(this.checked)">
              <span>Featured Only</span>
            </label>
          </div>
        `;
      }

      function applyFilters() {
        filteredListings = LISTINGS.filter(p => {
          if (filterType !== 'ALL' && p.type !== filterType) return false;
          if (filterState !== 'ALL' && p.state !== filterState) return false;
          if (filterVerified && p.titleStatus !== 'VERIFIED') return false;
          if (filterFeatured && !p.featured) return false;
          return true;
        });
        plotListings();
        buildDestinationsSidebar();
      }

      function setTypeFilter(type: string) {
        filterType = type;
        document.querySelectorAll('#typePills .filter-pill').forEach(el => {
          el.classList.toggle('active', (el as HTMLElement).textContent?.replace(' ', '_').toUpperCase() === type || (type === 'ALL' && (el as HTMLElement).textContent === 'All'));
        });
        applyFilters();
      }

      function setStateFilter(state: string) { filterState = state; applyFilters(); }
      function setVerifiedFilter(val: boolean) { filterVerified = val; applyFilters(); }
      function setFeaturedFilter(val: boolean) { filterFeatured = val; applyFilters(); }

      // Tier 2: destination search filter
      function setDestSearch(val: string) {
        filterDestSearch = val;
        buildDestinationsSidebar();
      }

      function updateListingCount() {
        const el = document.getElementById('listingCount');
        if (el) el.textContent = `${filteredListings.length} listing${filteredListings.length !== 1 ? 's' : ''} visible`;
      }

      // ============ FLYTHROUGH MODES ============
      function cameraOverview() {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(5.8, 4.2, 1000000),
          orientation: { heading: Cesium.Math.toRadians(10), pitch: Cesium.Math.toRadians(-48), roll: 0 },
          duration: 3
        });
        closeListingCard();
      }

      function showDestOverlay(dest: any) {
        let overlay = document.getElementById('destOverlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.id = 'destOverlay';
          overlay.style.cssText = `
            position:fixed; bottom:90px; left:50%; transform:translateX(-50%);
            background:rgba(10,14,18,0.88); border:1px solid rgba(212,162,76,0.5);
            border-radius:8px; padding:14px 28px; text-align:center;
            font-family:'Inter Tight',sans-serif; color:#f5f0e8;
            pointer-events:none; z-index:9999;
            transition:opacity 0.4s ease;
          `;
          document.body.appendChild(overlay);
        }
        overlay.innerHTML = `
          <div style="font-size:10px;letter-spacing:0.15em;color:#d4a24c;margin-bottom:4px">
            ${dest.corridorKm === 0 ? 'CORRIDOR START' : `KM ${dest.corridorKm}`} · ${dest.state.toUpperCase()}
          </div>
          <div style="font-size:20px;font-weight:700;letter-spacing:0.04em">${dest.name}</div>
          <div style="font-size:11px;color:#8a9ba8;margin-top:4px;letter-spacing:0.1em">${dest.tag}</div>
        `;
        overlay.style.opacity = '1';
      }

      function hideDestOverlay() {
        const overlay = document.getElementById('destOverlay');
        if (overlay) overlay.style.opacity = '0';
      }

      // S1a: Express Fly — cinematic corridor flyover
      async function expressFly() {
        if (flyAnimating) {
          flyAnimating = false;
          resetFlyBtn();
          hideDestOverlay();
          stopFlightHud();
          return;
        }
        flyAnimating = true;
        closeListingCard();
        const btn = document.getElementById('flyBtn');
        if (btn) { btn.textContent = '⏹ STOP'; btn.classList.add('active'); }

        const destHeadings: Record<string, number> = {
          vi: 85, lekki: 88, epe: 60, ijebu: 135, ondo: 110,
          warri: 95, yenagoa: 90, ph: 85, uyo: 120, ibeno: 55,
          tinapa: 80, calabar: 90
        };

        // Start HUD
        startFlightHud();

        await new Promise(resolve => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(3.4216, 6.4281, 120000),
            orientation: { heading: Cesium.Math.toRadians(75), pitch: Cesium.Math.toRadians(-40), roll: 0 },
            duration: 3, complete: resolve, cancel: resolve
          });
        });

        for (const dest of DESTINATIONS) {
          if (!flyAnimating) break;

          const heading = Cesium.Math.toRadians(destHeadings[dest.id] ?? 90);
          const pitch = Cesium.Math.toRadians(-30);
          const alt = (dest.corridorKm === 0 || dest.corridorKm >= 700) ? 22000 : 16000;

          // Update HUD destination label
          updateHudDest(dest.name, dest.corridorKm);

          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(dest.lng, dest.lat + 0.06, alt),
              orientation: { heading, pitch, roll: 0 },
              duration: 7, complete: resolve, cancel: resolve
            });
          });

          if (!flyAnimating) break;

          showDestOverlay(dest);
          // Tier 2: FLY CORRIDOR stop sync — highlight destination in sidebar and update KM bar
          document.querySelectorAll('.dest-item').forEach(el => el.classList.remove('active'));
          const activeEl = document.querySelector(`[data-dest-id="${dest.id}"]`);
          if (activeEl) {
            activeEl.classList.add('active');
            activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          updateKmProgressBar(dest.corridorKm);

          await new Promise(r => setTimeout(r, 4000));
          hideDestOverlay();
          await new Promise(r => setTimeout(r, 500));
        }

        flyAnimating = false;
        resetFlyBtn();
        hideDestOverlay();
        stopFlightHud();
        // Tier 2: FLY CORRIDOR stop sync — clear sidebar highlight and KM bar on completion
        document.querySelectorAll('.dest-item').forEach(el => el.classList.remove('active'));
        updateKmProgressBar(null);
        cameraOverview();
      }

      // ============ FLIGHT HUD (speed/altitude/km/time) ============
      let hudInterval: ReturnType<typeof setInterval> | null = null;
      let hudStartTime = 0;
      let hudPrevPos: Cesium.Cartesian3 | null = null;
      let hudPrevTime = 0;

      function startFlightHud() {
        const hud = document.getElementById('flightHud');
        if (hud) hud.classList.add('active');
        hudStartTime = Date.now();
        hudPrevPos = null;
        hudPrevTime = 0;
        if (hudInterval) clearInterval(hudInterval);
        hudInterval = setInterval(() => {
          if (!viewer) return;
          try {
            const cam = viewer.camera;
            const pos = cam.position;
            const cartographic = Cesium.Cartographic.fromCartesian(pos);
            const altM = Math.max(0, cartographic.height);

            // Speed: distance between frames / time delta
            const now = Date.now();
            let speedKmh = 0;
            if (hudPrevPos && hudPrevTime) {
              const dist = Cesium.Cartesian3.distance(pos, hudPrevPos); // metres
              const dt = (now - hudPrevTime) / 1000; // seconds
              speedKmh = dt > 0 ? (dist / dt) * 3.6 : 0;
            }
            hudPrevPos = pos.clone();
            hudPrevTime = now;

            // Corridor KM: interpolate from longitude (3.4° Lagos → 8.33° Calabar)
            const lng = Cesium.Math.toDegrees(cartographic.longitude);
            const corridorKm = Math.max(0, Math.min(700.3, ((lng - 3.4) / (8.33 - 3.4)) * 700.3));

            // Elapsed time
            const elapsed = Math.floor((now - hudStartTime) / 1000);
            const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
            const ss = String(elapsed % 60).padStart(2, '0');

            const elSpeed = document.getElementById('hudSpeed');
            const elAlt = document.getElementById('hudAlt');
            const elKm = document.getElementById('hudKm');
            const elTime = document.getElementById('hudTime');
            if (elSpeed) elSpeed.textContent = speedKmh > 9999 ? '---' : Math.round(speedKmh).toLocaleString();
            if (elAlt) elAlt.textContent = Math.round(altM).toLocaleString();
            if (elKm) elKm.textContent = corridorKm.toFixed(1);
            if (elTime) elTime.textContent = `${mm}:${ss}`;
          } catch (e) { /* ignore */ }
        }, 250);
      }

      function stopFlightHud() {
        if (hudInterval) { clearInterval(hudInterval); hudInterval = null; }
        const hud = document.getElementById('flightHud');
        if (hud) hud.classList.remove('active');
      }

      function updateHudDest(name: string, km: number) {
        const el = document.getElementById('hudDest');
        if (el) el.textContent = `▶ ${name.toUpperCase()} · KM ${km}`;
      }

      function openJourneyPlanner() {
        const panel = document.getElementById('journeyPanel');
        if (panel) panel.classList.toggle('open');
      }

      function startJourney() {
        const fromEl = document.getElementById('journeyFrom') as HTMLSelectElement;
        const toEl = document.getElementById('journeyTo') as HTMLSelectElement;
        if (!fromEl || !toEl) return;

        const fromId = fromEl.value;
        const toId = toEl.value;
        if (!fromId || !toId || fromId === toId) return;

        const panel = document.getElementById('journeyPanel');
        if (panel) panel.classList.remove('open');

        const fromDest = DESTINATIONS.find(d => d.id === fromId);
        const toListing = LISTINGS.find(p => p.id === toId);
        if (!fromDest || !toListing) return;

        const fromKm = fromDest.corridorKm;
        const toDest = DESTINATIONS.find(d => d.id === toListing.destinationId);
        const toKm = toDest?.corridorKm ?? 700;
        const minKm = Math.min(fromKm, toKm);
        const maxKm = Math.max(fromKm, toKm);

        const waypoints = LISTINGS.filter(p => {
          const destKm = DESTINATIONS.find(d => d.id === p.destinationId)?.corridorKm ?? 0;
          return destKm >= minKm && destKm <= maxKm && p.id !== toListing.id;
        });

        runJourneyFlight(fromDest, waypoints, toListing);
      }

      async function runJourneyFlight(from: any, waypoints: any[], destination: any) {
        if (flyAnimating) return;
        flyAnimating = true;
        journeyMode = true;
        closeListingCard();

        await new Promise(resolve => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(from.lng, from.lat - 0.06, 12000),
            orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
            duration: 2.5, complete: resolve, cancel: resolve
          });
        });

        for (const p of waypoints) {
          if (!flyAnimating) break;
          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(p.lng, p.lat - 0.04, 8000),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
              duration: 3, complete: resolve, cancel: resolve
            });
          });
          if (!flyAnimating) break;
          openListingCard(p);
          await new Promise(r => setTimeout(r, 2500));
        }

        if (flyAnimating) {
          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(destination.lng, destination.lat - 0.04, 5000),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
              duration: 3.5, complete: resolve, cancel: resolve
            });
          });
          openListingCard(destination);
        }

        flyAnimating = false;
        journeyMode = false;
      }

      function resetFlyBtn() {
        const btn = document.getElementById('flyBtn');
        if (btn) { btn.textContent = '✈ FLY CORRIDOR'; btn.classList.remove('active'); }
      }

      // ============ LAYERS ============
      function toggleLayersPanel() {
        const p = document.getElementById('layersPanel');
        const b = document.getElementById('layerBtn');
        if (p) p.classList.toggle('open');
        if (b) b.classList.toggle('active');
      }

      function toggleListingPins(isOn: boolean) {
        listingEntities.forEach(e => { e.show = isOn; });
      }

      function toggleRoute(isOn: boolean) {
        if (routeEntity) routeEntity.show = isOn;
      }

      function toggleDestMarkers(isOn: boolean) {
        destEntities.forEach(e => { e.show = isOn; });
      }

      function toggleLabels(isOn: boolean) {
        labelsVisible = isOn;
        listingEntities.forEach(e => { if (e.label) e.label.show = isOn; });
        destEntities.forEach(e => { if (e.label) e.label.show = isOn; });
      }

      // Tier 3: Satellite/Street toggle
      async function toggleSatellite() {
        const btn = document.getElementById('satBtn');
        satelliteMode = !satelliteMode;
        if (satelliteMode) {
          // Switch to Bing aerial
          try {
            const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(imageryProvider);
          } catch (e) {
            // fallback to default
          }
          if (btn) { btn.textContent = '🛰 SATELLITE'; btn.classList.add('active'); }
          showToast('Satellite imagery active');
        } else {
          // Switch to OpenStreetMap
          try {
            const osmProvider = new Cesium.OpenStreetMapImageryProvider({
              url: 'https://tile.openstreetmap.org/'
            });
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(osmProvider);
          } catch (e) {
            console.warn('OSM imagery failed:', e);
          }
          if (btn) { btn.textContent = '🗺 STREET MAP'; btn.classList.remove('active'); }
          showToast('Street map active · Road network visible');
        }
      }

      // ============ VR MODE ============
      async function toggleVR() {
        const btn = document.getElementById('vrBtn');
        if (vrMode) {
          if (googleTileset) {
            viewer.scene.primitives.remove(googleTileset);
            googleTileset = null;
          }
          try {
            const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(imageryProvider);
          } catch (e) { /* fallback */ }
          vrMode = false;
          if (btn) { btn.textContent = 'VR'; btn.classList.remove('active'); }
          showToast('Aerial view restored');
        } else {
          try {
            if (btn) btn.classList.add('active');
            googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
            viewer.scene.primitives.add(googleTileset);
            viewer.imageryLayers.removeAll();
            vrMode = true;
            if (btn) btn.textContent = '↩ EXIT VR';
            showToast('Google Photorealistic 3D Tiles active · Zoom in for ground-level view');
            if (activeListingId) {
              const p = LISTINGS.find(x => x.id === activeListingId);
              if (p) {
                viewer.camera.flyTo({
                  destination: Cesium.Cartesian3.fromDegrees(p.lng, p.lat - 0.001, 120),
                  orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-15), roll: 0 },
                  duration: 3
                });
              }
            }
          } catch (e: any) {
            console.error('Google 3D Tiles failed:', e);
            vrMode = false;
            if (btn) btn.classList.remove('active');
            showToast('VR mode unavailable · Google 3D Tiles API key required');
          }
        }
      }

      // Tier 3: Scoped 3D buildings — only load for key urban destinations
      const URBAN_DEST_IDS = ['vi', 'lekki', 'ph', 'calabar', 'warri', 'uyo'];
      async function toggleBuildings() {
        const btn = document.getElementById('bldgBtn');
        if (buildingsTileset) {
          viewer.scene.primitives.remove(buildingsTileset);
          buildingsTileset = null;
          if (btn) btn.classList.remove('active');
          showToast('3D Buildings hidden');
          return;
        }
        try {
          if (btn) btn.classList.add('active');
          buildingsTileset = await Cesium.createOsmBuildingsAsync();
          buildingsTileset.style = new Cesium.Cesium3DTileStyle({
            labelText: "${feature['name']}",
            labelFont: '"10px Inter Tight, sans-serif"',
            labelColor: 'color("white", 0.85)',
            labelOutlineColor: 'color("black", 0.9)',
            labelOutlineWidth: 2,
            labelStyle: Cesium.LabelStyle ? '2' : '2',
            labelPixelOffset: 'vec2(0, -20)',
            labelBackgroundColor: 'color("#0a0e12", 0.8)',
            labelBackgroundPadding: 'vec2(5, 3)',
            show: true,
            color: 'color("#1a2029", 0.85)'
          });
          viewer.scene.primitives.add(buildingsTileset);
          // Tier 3: Fly to active destination or first urban dest for context
          const targetId = activeDestId && URBAN_DEST_IDS.includes(activeDestId) ? activeDestId : 'vi';
          const targetDest = DESTINATIONS.find(d => d.id === targetId);
          if (targetDest) {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(targetDest.lng, targetDest.lat - 0.005, 1800),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
              duration: 3
            });
          }
          showToast('3D Buildings active · Business & estate labels visible when zoomed in');
        } catch (e) {
          console.error('OSM Buildings failed:', e);
          if (btn) btn.classList.remove('active');
        }
      }

      // ============ TIME OF DAY ============
      function cycleTime() {
        timeIdx = (timeIdx + 1) % times.length;
        const timeLabel = document.getElementById('timeLabel');
        if (timeLabel) timeLabel.textContent = times[timeIdx];
        const scene = viewer.scene;
        const skyAt = scene.skyAtmosphere;
        if (times[timeIdx] === 'Dawn') {
          skyAt.hueShift = 0.1; skyAt.saturationShift = 0.15; skyAt.brightnessShift = -0.3;
          scene.globe.baseColor = Cesium.Color.fromCssColorString('#2a1810');
        } else if (times[timeIdx] === 'Midday') {
          skyAt.hueShift = -0.05; skyAt.saturationShift = -0.15; skyAt.brightnessShift = -0.1;
          scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e12');
        } else if (times[timeIdx] === 'Dusk') {
          skyAt.hueShift = 0.3; skyAt.saturationShift = 0.25; skyAt.brightnessShift = -0.25;
          scene.globe.baseColor = Cesium.Color.fromCssColorString('#1a0a10');
        } else {
          skyAt.hueShift = -0.2; skyAt.saturationShift = -0.5; skyAt.brightnessShift = -0.6;
          scene.globe.baseColor = Cesium.Color.fromCssColorString('#050810');
        }
      }

      // ============ CLOCK ============
      function startClock() {
        const clock = document.getElementById('cesium-clock');
        setInterval(() => {
          const now = new Date();
          const hh = String(now.getHours()).padStart(2, '0');
          const mm = String(now.getMinutes()).padStart(2, '0');
          const ss = String(now.getSeconds()).padStart(2, '0');
          if (clock) clock.textContent = `${hh}:${mm}:${ss} WAT`;
        }, 1000);
      }

      // ============ TOAST ============
      function showToast(msg: string) {
        const toast = document.getElementById('destToast');
        const toastText = document.getElementById('destToastText');
        if (toast && toastText) {
          toastText.textContent = msg;
          toast.classList.add('show');
          clearTimeout((window as any)._toastTimer);
          (window as any)._toastTimer = setTimeout(() => toast.classList.remove('show'), 4500);
        }
      }

      // ============ TIER 3: KM PROGRESS BAR ============
      function buildKmProgressBar() {
        const bar = document.getElementById('kmProgressBar');
        if (!bar) return;
        // Build destination tick marks
        bar.innerHTML = `
          <div class="km-bar-track">
            <div class="km-bar-fill" id="kmBarFill" style="width:0%"></div>
            ${DESTINATIONS.map(d => {
              const pct = (d.corridorKm / 700.3) * 100;
              return `<div class="km-bar-tick" data-km="${d.corridorKm}" style="left:${pct}%" title="${d.name} · KM ${d.corridorKm}" onclick="sidebarClickDest('${d.id}')"></div>`;
            }).join('')}
          </div>
          <div class="km-bar-labels">
            <span class="km-bar-label-start">Lagos · KM 0</span>
            <span class="km-bar-label-active" id="kmBarLabel"></span>
            <span class="km-bar-label-end">Calabar · KM 700.3</span>
          </div>
        `;
      }

      function updateKmProgressBar(km: number | null) {
        const fill = document.getElementById('kmBarFill');
        const label = document.getElementById('kmBarLabel');
        if (!fill || !label) return;
        // Clear all active ticks
        document.querySelectorAll('.km-bar-tick').forEach(t => t.classList.remove('active-tick'));
        if (km === null) {
          fill.style.width = '0%';
          label.textContent = '';
        } else {
          const pct = Math.min(100, (km / 700.3) * 100);
          fill.style.width = `${pct}%`;
          const dest = DESTINATIONS.find(d => d.corridorKm === km);
          label.textContent = dest ? `${dest.name} · KM ${km}` : `KM ${km}`;
          // Highlight the matching tick
          const activeTick = document.querySelector(`.km-bar-tick[data-km="${km}"]`);
          if (activeTick) activeTick.classList.add('active-tick');
        }
      }

      // ============ TIER 2: DEEP-LINK URL SUPPORT ============
      function updateDeepLinkUrl(destId: string | null, listingId: string | null) {
        try {
          const url = new URL(window.location.href);
          if (destId) { url.searchParams.set('dest', destId); url.searchParams.delete('listing'); }
          else if (listingId) { url.searchParams.set('listing', listingId); url.searchParams.delete('dest'); }
          else { url.searchParams.delete('dest'); url.searchParams.delete('listing'); }
          window.history.replaceState({}, '', url.toString());
        } catch (e) { /* ignore */ }
      }

      function handleDeepLink() {
        try {
          const url = new URL(window.location.href);
          const destId = url.searchParams.get('dest');
          const listingId = url.searchParams.get('listing');
          if (destId) {
            const d = DESTINATIONS.find(x => x.id === destId);
            if (d) setTimeout(() => openDestinationPanel(d), 2800);
          } else if (listingId) {
            const p = LISTINGS.find(x => x.id === listingId);
            if (p) setTimeout(() => { openListingCard(p); flyToListing(p.id, false); }, 2800);
          }
        } catch (e) { /* ignore */ }
      }

      // ============ EXPOSE TO WINDOW ============
      (window as any).cameraOverview = cameraOverview;
      (window as any).expressFly = expressFly;
      (window as any).openJourneyPlanner = openJourneyPlanner;
      (window as any).startJourney = startJourney;
      (window as any).toggleLayersPanel = toggleLayersPanel;
      (window as any).toggleListingPins = toggleListingPins;
      (window as any).toggleRoute = toggleRoute;
      (window as any).toggleDestMarkers = toggleDestMarkers;
      (window as any).toggleLabels = toggleLabels;
      (window as any).cycleTime = cycleTime;
      (window as any).toggleBuildings = toggleBuildings;
      (window as any).toggleVR = toggleVR;
      (window as any).toggleSatellite = toggleSatellite;
      (window as any).closeListingCard = closeListingCard;
      (window as any).flyToListing = flyToListing;
      (window as any).sidebarClickDest = sidebarClickDest;
      (window as any).openDestinationPanel = openDestinationPanel;
      (window as any).flyToDestination = flyToDestination;
      (window as any).openListingFromDest = openListingFromDest;
      (window as any).showAllListings = showAllListings;
      (window as any).expandMatterport = expandMatterport;
      (window as any).closeMatterport = closeMatterport;
      (window as any).setTypeFilter = setTypeFilter;
      (window as any).setStateFilter = setStateFilter;
      (window as any).setVerifiedFilter = setVerifiedFilter;
      (window as any).setFeaturedFilter = setFeaturedFilter;
      (window as any).setDestSearch = setDestSearch;

      init();
    }

    return () => {
      const v = (window as any).__cesiumViewer;
      if (v) v.destroy();
    };
  }, []);

  const destOptions = DESTINATIONS.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
  const listingOptions = LISTINGS.map(p => `<option value="${p.id}">${p.title}</option>`).join('');

  return (
    <>
      <style>{`
        body { overflow: hidden !important; }
        main { overflow: hidden !important; }
        footer { display: none !important; }
        nav { display: none !important; }

        :root {
          --ink: #0a0e12;
          --ink-2: #11161c;
          --ink-3: #1a2029;
          --ink-4: #252c36;
          --line: rgba(255,255,255,0.08);
          --line-2: rgba(255,255,255,0.14);
          --text: #e8eaed;
          --text-dim: #9aa0a6;
          --text-muted: #6b7079;
          --ocean: #2d7d7d;
          --ocean-2: #4db3b3;
          --laterite: #c96a3f;
          --laterite-2: #e08660;
          --ochre: #d4a24c;
          --sage: #8aa876;
          --alert: #e85a4f;
          --success: #6fae7a;
        }

        #cesium { position: fixed; inset: 0; z-index: 1; }

        .cesium-viewer-bottom, .cesium-viewer-toolbar, .cesium-viewer-animationContainer,
        .cesium-viewer-timelineContainer, .cesium-viewer-fullscreenContainer,
        .cesium-viewer-geocoderContainer, .cesium-viewer-vrContainer, .cesium-widget-credits,
        .cesium-viewer-selectionIndicatorContainer, .cesium-viewer-infoBoxContainer { display: none !important; }
        .cesium-widget canvas { outline: none; }

        .vignette {
          position: fixed; inset: 0; pointer-events: none; z-index: 2;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(10,14,18,0.35) 100%);
        }

        /* ===== TOPBAR ===== */
        .cc-topbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 20;
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 24px;
          background: linear-gradient(180deg, rgba(10,14,18,0.96) 0%, rgba(10,14,18,0.6) 80%, transparent 100%);
          pointer-events: none;
        }
        .cc-brand { display: flex; flex-direction: column; }
        .cc-brand-name { font-size: 15px; font-weight: 700; letter-spacing: 0.04em; color: var(--text); }
        .cc-brand-sub { font-size: 10px; letter-spacing: 0.12em; color: var(--text-muted); text-transform: uppercase; }
        .cc-meta { display: flex; gap: 28px; align-items: center; }
        .cc-meta-item { text-align: right; }
        .cc-meta-value { font-size: 13px; font-weight: 600; color: var(--text); letter-spacing: 0.03em; }
        .cc-meta-label { font-size: 9px; letter-spacing: 0.1em; color: var(--text-muted); text-transform: uppercase; }
        #cesium-clock { font-size: 13px; font-weight: 600; color: var(--ochre); font-variant-numeric: tabular-nums; }

        /* ===== LEFT SIDEBAR ===== */
        .cc-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0; z-index: 15;
          width: 280px;
          background: linear-gradient(180deg, rgba(10,14,18,0.97) 0%, rgba(10,14,18,0.93) 100%);
          border-right: 1px solid var(--line);
          display: flex; flex-direction: column;
          padding-top: 70px;
          backdrop-filter: blur(12px);
        }
        .sidebar-header { padding: 16px 20px 10px; border-bottom: 1px solid var(--line); }
        .sidebar-title { font-size: 9px; letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
        .sidebar-headline { font-size: 16px; font-weight: 700; color: var(--text); }
        .sidebar-sub { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
        #listingCount { color: var(--ochre); font-weight: 600; }

        /* Tier 2: Destination search input */
        .dest-search-wrap {
          padding: 8px 16px; border-bottom: 1px solid var(--line);
        }
        .dest-search-input {
          width: 100%; padding: 6px 10px; border-radius: 6px;
          background: var(--ink-3); border: 1px solid var(--line-2);
          color: var(--text); font-size: 11px; outline: none;
          box-sizing: border-box;
        }
        .dest-search-input::placeholder { color: var(--text-muted); }

        .listings-list { flex: 1; overflow-y: auto; padding: 8px 0; }
        .listings-list::-webkit-scrollbar { width: 3px; }
        .listings-list::-webkit-scrollbar-track { background: transparent; }
        .listings-list::-webkit-scrollbar-thumb { background: var(--ink-4); border-radius: 2px; }

        .listing-item {
          display: flex; gap: 10px; padding: 10px 16px; cursor: pointer;
          border-bottom: 1px solid var(--line); transition: background 0.15s;
        }
        .listing-item:hover { background: rgba(255,255,255,0.04); }
        .listing-item.active { background: rgba(212,162,76,0.1); border-left: 2px solid var(--ochre); }
        .li-img {
          width: 52px; height: 52px; border-radius: 6px; flex-shrink: 0;
          background-size: cover; background-position: center;
          border: 1px solid var(--line-2);
        }
        .li-body { flex: 1; min-width: 0; }
        .li-type { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .li-title { font-size: 11px; font-weight: 600; color: var(--text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .li-loc { font-size: 10px; color: var(--text-muted); margin-top: 1px; }
        .li-price-row { display: flex; align-items: center; gap: 6px; margin-top: 3px; }
        .li-price { font-size: 11px; font-weight: 700; color: var(--text); }
        .li-yoy { font-size: 9px; color: var(--success); font-weight: 600; }

        /* ===== FILTER BAR ===== */
        .cc-filter-bar {
          position: fixed; top: 70px; left: 280px; right: 0; z-index: 15;
          padding: 10px 20px;
          background: linear-gradient(180deg, rgba(10,14,18,0.9) 0%, rgba(10,14,18,0.0) 100%);
          display: flex; gap: 20px; align-items: center; flex-wrap: wrap;
          pointer-events: all;
        }
        .filter-group { display: flex; align-items: center; gap: 8px; }
        .filter-label { font-size: 9px; letter-spacing: 0.12em; color: var(--text-muted); text-transform: uppercase; white-space: nowrap; }
        .filter-pills { display: flex; gap: 4px; flex-wrap: wrap; }
        .filter-pill {
          padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 600;
          border: 1px solid var(--line-2); background: rgba(255,255,255,0.04);
          color: var(--text-dim); cursor: pointer; transition: all 0.15s; white-space: nowrap;
        }
        .filter-pill:hover { background: rgba(255,255,255,0.08); color: var(--text); }
        .filter-pill.active { background: var(--ochre); color: var(--ink); border-color: var(--ochre); }
        .filter-select {
          padding: 3px 8px; border-radius: 6px; font-size: 10px;
          background: rgba(255,255,255,0.06); border: 1px solid var(--line-2);
          color: var(--text); cursor: pointer;
        }
        .filter-toggles { display: flex; gap: 12px; }
        .filter-toggle-item { display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 10px; color: var(--text-dim); white-space: nowrap; }
        .filter-toggle-item input { accent-color: var(--ochre); }

        /* ===== LISTING CARD PANEL ===== */
        .listing-panel {
          position: fixed; top: 0; right: -380px; bottom: 0; z-index: 25;
          width: 360px;
          background: rgba(10,14,18,0.97);
          border-left: 1px solid var(--line-2);
          backdrop-filter: blur(16px);
          overflow-y: auto;
          transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .listing-panel.open { right: 0; }
        .listing-panel::-webkit-scrollbar { width: 3px; }
        .listing-panel::-webkit-scrollbar-thumb { background: var(--ink-4); }

        .lp-header {
          display: flex; align-items: center; gap: 8px; padding: 14px 16px;
          border-bottom: 1px solid var(--line); flex-wrap: wrap;
        }
        .lp-close {
          margin-left: auto; width: 28px; height: 28px; border-radius: 50%;
          background: rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 16px; color: var(--text-dim); transition: background 0.15s;
        }
        .lp-close:hover { background: rgba(255,255,255,0.14); }
        .lp-type-chip { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; }
        .lp-verified { font-size: 9px; color: var(--success); font-weight: 700; letter-spacing: 0.08em; }
        .lp-pending { font-size: 9px; color: var(--ochre); font-weight: 700; letter-spacing: 0.08em; }
        .lp-featured { font-size: 9px; color: var(--ochre); font-weight: 700; }

        .lp-hero {
          height: 180px; background-size: cover; background-position: center; position: relative;
        }
        .lp-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 30%, rgba(10,14,18,0.85) 100%);
        }
        .lp-yoy {
          position: absolute; top: 12px; right: 12px;
          background: var(--success); color: var(--ink); padding: 3px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 700;
        }

        /* Tier 1: Destination hero label overlay */
        .dest-hero-label {
          position: absolute; bottom: 16px; left: 16px; right: 16px;
        }
        .dest-hero-state {
          font-size: 10px; letter-spacing: 0.14em; color: rgba(255,255,255,0.7);
          text-transform: uppercase; margin-bottom: 4px;
        }
        .dest-hero-name {
          font-size: 20px; font-weight: 800; color: #fff; line-height: 1.2; margin-bottom: 8px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        }
        .dest-hero-tag {
          display: inline-block; padding: 3px 10px; border-radius: 20px;
          font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
        }

        .lp-body { padding: 16px; }
        .lp-location { font-size: 10px; letter-spacing: 0.1em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px; }
        .lp-title { font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; margin-bottom: 8px; }
        .lp-specs { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .spec-item { font-size: 11px; color: var(--text-dim); }
        .lp-price-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 14px; }
        .lp-price { font-size: 22px; font-weight: 800; color: var(--text); }
        .lp-price-sqm { font-size: 11px; color: var(--text-muted); }

        .lp-risk-row { display: flex; gap: 12px; margin-bottom: 14px; }
        .risk-item { flex: 1; }
        .risk-label { font-size: 9px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 4px; }
        .risk-bar { height: 4px; background: var(--ink-4); border-radius: 2px; overflow: hidden; margin-bottom: 2px; }
        .risk-fill { height: 100%; border-radius: 2px; transition: width 0.4s; }
        .risk-score { font-size: 10px; font-weight: 700; }

        .lp-agent { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); margin-bottom: 14px; }
        .agent-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: var(--ink-3); display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: var(--ochre); border: 1px solid var(--line-2);
        }
        .agent-name { font-size: 12px; font-weight: 600; color: var(--text); }
        .agent-badge { font-size: 10px; color: var(--success); }

        /* Matterport preview */
        .matterport-preview { margin-bottom: 14px; border-radius: 8px; overflow: hidden; border: 1px solid var(--line-2); }
        .mp-thumb { position: relative; height: 130px; cursor: pointer; }
        .mp-thumb iframe { pointer-events: none; }
        .mp-overlay {
          position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
          background: rgba(10,14,18,0.4); transition: background 0.2s;
        }
        .mp-thumb:hover .mp-overlay { background: rgba(10,14,18,0.2); }
        .mp-play-btn {
          padding: 8px 16px; background: var(--ochre); color: var(--ink);
          border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em;
        }

        .lp-actions { display: flex; flex-direction: column; gap: 8px; }
        .lp-btn-primary {
          width: 100%; padding: 12px; border-radius: 8px;
          background: var(--ochre); color: var(--ink);
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          border: none; cursor: pointer; transition: opacity 0.15s;
        }
        .lp-btn-primary:hover { opacity: 0.88; }
        .lp-btn-secondary {
          width: 100%; padding: 11px; border-radius: 8px;
          background: transparent; color: var(--text);
          font-size: 12px; font-weight: 600; letter-spacing: 0.08em;
          border: 1px solid var(--line-2); cursor: pointer; text-align: center;
          text-decoration: none; display: block; transition: background 0.15s;
        }
        .lp-btn-secondary:hover { background: rgba(255,255,255,0.06); }

        /* ===== MATTERPORT FULL OVERLAY ===== */
        .matterport-overlay {
          position: fixed; inset: 0; z-index: 100;
          background: rgba(10,14,18,0.96);
          display: none; flex-direction: column;
        }
        .matterport-overlay.open { display: flex; }
        .mp-overlay-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 24px; border-bottom: 1px solid var(--line);
        }
        .mp-overlay-title { font-size: 14px; font-weight: 700; color: var(--text); }
        .mp-overlay-close {
          padding: 8px 16px; background: rgba(255,255,255,0.08);
          border: 1px solid var(--line-2); border-radius: 6px;
          color: var(--text); font-size: 12px; cursor: pointer;
        }
        .mp-overlay-iframe { flex: 1; border: none; }

        /* ===== BOTTOM TOOLBAR ===== */
        .cc-toolbar {
          position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
          z-index: 20; display: flex; gap: 6px; align-items: center;
          background: rgba(10,14,18,0.92); border: 1px solid var(--line-2);
          border-radius: 40px; padding: 8px 16px;
          backdrop-filter: blur(16px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .toolbar-btn {
          padding: 8px 14px; border-radius: 24px; font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; border: none; cursor: pointer;
          background: transparent; color: var(--text-dim);
          transition: all 0.15s; white-space: nowrap;
        }
        .toolbar-btn:hover { background: rgba(255,255,255,0.08); color: var(--text); }
        .toolbar-btn.active { background: var(--ochre); color: var(--ink); }
        .toolbar-sep { width: 1px; height: 20px; background: var(--line-2); }

        /* ===== LAYERS PANEL ===== */
        .layers-panel {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          z-index: 20; min-width: 260px;
          background: rgba(10,14,18,0.96); border: 1px solid var(--line-2);
          border-radius: 12px; padding: 16px;
          backdrop-filter: blur(16px);
          display: none;
        }
        .layers-panel.open { display: block; }
        .layers-title { font-size: 9px; letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; }
        .layer-toggle {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 0; border-bottom: 1px solid var(--line); cursor: pointer;
        }
        .layer-toggle:last-child { border-bottom: none; }
        .layer-name { font-size: 12px; color: var(--text); }
        .toggle {
          width: 36px; height: 20px; border-radius: 10px; background: var(--ink-4);
          position: relative; transition: background 0.2s;
        }
        .toggle::after {
          content: ''; position: absolute; top: 3px; left: 3px;
          width: 14px; height: 14px; border-radius: 50%; background: var(--text-muted);
          transition: all 0.2s;
        }
        .toggle.on { background: var(--ochre); }
        .toggle.on::after { left: 19px; background: var(--ink); }

        /* ===== JOURNEY PANEL ===== */
        .journey-panel {
          position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
          z-index: 21; min-width: 320px;
          background: rgba(10,14,18,0.97); border: 1px solid var(--line-2);
          border-radius: 12px; padding: 20px;
          backdrop-filter: blur(16px);
          display: none;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .journey-panel.open { display: block; }
        .journey-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
        .journey-sub { font-size: 11px; color: var(--text-muted); margin-bottom: 16px; }
        .journey-row { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
        .journey-label { font-size: 9px; letter-spacing: 0.12em; color: var(--text-muted); text-transform: uppercase; }
        .journey-select {
          width: 100%; padding: 8px 10px; border-radius: 8px;
          background: var(--ink-3); border: 1px solid var(--line-2);
          color: var(--text); font-size: 12px; cursor: pointer;
        }
        .journey-btn {
          width: 100%; padding: 12px; border-radius: 8px;
          background: var(--ochre); color: var(--ink);
          font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
          border: none; cursor: pointer; margin-top: 4px;
        }

        /* ===== TOAST ===== */
        .dest-toast {
          position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%) translateY(20px);
          z-index: 30; background: rgba(10,14,18,0.95); border: 1px solid var(--line-2);
          border-radius: 8px; padding: 10px 18px;
          opacity: 0; transition: all 0.3s; pointer-events: none;
          backdrop-filter: blur(12px); white-space: nowrap;
        }
        .dest-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .dest-toast-text { font-size: 12px; color: var(--text); }

        /* ===== LOADING SCREEN ===== */
        .cesium-loading {
          position: fixed; inset: 0; z-index: 50;
          background: var(--ink); display: flex; flex-direction: column;
          align-items: center; justify-content: center; gap: 16px;
          transition: opacity 0.6s;
        }
        .cesium-loading.hide { opacity: 0; pointer-events: none; }
        .loading-logo { font-size: 22px; font-weight: 800; color: var(--text); letter-spacing: 0.04em; }
        .loading-sub-brand { font-size: 10px; letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; margin-top: -10px; }
        .loading-spinner {
          width: 36px; height: 36px; border: 2px solid var(--ink-4);
          border-top-color: var(--ochre); border-radius: 50%;
          animation: spin 0.9s linear infinite; margin: 8px 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { font-size: 12px; color: var(--text-dim); letter-spacing: 0.08em; }
        .loading-steps { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
        .loading-step { font-size: 10px; color: var(--text-muted); letter-spacing: 0.06em; }
        .loading-step::before { content: '· '; color: var(--ochre); }

        /* ===== DESTINATION SIDEBAR ITEMS ===== */
        .dest-item {
          display: flex; align-items: center; gap: 10px; padding: 10px 14px 10px 16px;
          cursor: pointer; border-bottom: 1px solid var(--line); transition: background 0.15s;
        }
        .dest-item:hover { background: rgba(255,255,255,0.04); }
        .dest-item.active { background: rgba(212,162,76,0.1); border-left: 2px solid var(--ochre); }
        .dest-num {
          font-size: 10px; font-weight: 800; color: var(--text-muted); font-variant-numeric: tabular-nums;
          min-width: 22px; flex-shrink: 0;
        }
        .dest-body { flex: 1; min-width: 0; }
        .dest-name { font-size: 12px; font-weight: 700; color: var(--text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dest-meta { font-size: 10px; color: var(--text-muted); margin-top: 1px; }
        .dest-tag {
          padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 700;
          letter-spacing: 0.08em; white-space: nowrap; flex-shrink: 0;
        }
        .dest-badge {
          min-width: 18px; height: 18px; border-radius: 9px;
          background: var(--ochre); color: var(--ink);
          font-size: 9px; font-weight: 800; display: flex; align-items: center; justify-content: center;
          padding: 0 4px; flex-shrink: 0;
        }

        /* ===== DESTINATION DETAIL PANEL ===== */
        .lp-stats-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 14px 0;
        }
        .lp-stat {
          background: var(--ink-3); border-radius: 8px; padding: 10px 12px;
          border: 1px solid var(--line);
        }
        .lp-stat-val { font-size: 15px; font-weight: 800; color: var(--text); line-height: 1.2; }
        .lp-stat-label { font-size: 9px; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

        /* Listing rows inside destination detail panel */
        .dest-listings-list { display: flex; flex-direction: column; gap: 0; }
        .dest-listing-row {
          display: flex; align-items: center; gap: 10px; padding: 10px 0;
          border-bottom: 1px solid var(--line); cursor: pointer; transition: background 0.15s;
        }
        .dest-listing-row:hover { background: rgba(255,255,255,0.04); margin: 0 -16px; padding: 10px 16px; }
        .dest-listing-row:last-child { border-bottom: none; }
        .dlr-img {
          width: 46px; height: 46px; border-radius: 6px; flex-shrink: 0;
          background-size: cover; background-position: center;
          border: 1px solid var(--line-2);
        }
        .dlr-body { flex: 1; min-width: 0; }
        .dlr-type { font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .dlr-title { font-size: 11px; font-weight: 600; color: var(--text); line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dlr-price { font-size: 11px; font-weight: 700; color: var(--text); margin-top: 2px; }
        .dlr-yoy { font-size: 9px; color: var(--success); font-weight: 600; }
        .dlr-arrow { font-size: 18px; color: var(--text-muted); flex-shrink: 0; }

        /* ===== TIER 3: KM PROGRESS BAR ===== */
        .km-progress-bar {
          position: fixed; bottom: 72px; left: 280px; right: 0; z-index: 18;
          padding: 0 24px 0 20px;
          pointer-events: all;
        }
        .km-bar-track {
          position: relative; height: 6px;
          background: rgba(255,255,255,0.08); border-radius: 3px;
          overflow: visible;
        }
        .km-bar-fill {
          height: 100%; background: linear-gradient(90deg, var(--ochre), #f0c060); border-radius: 3px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative; z-index: 1;
        }
        .km-bar-tick {
          position: absolute; top: 50%; transform: translate(-50%, -50%);
          width: 2px; height: 10px;
          background: rgba(255,255,255,0.3); border-radius: 1px;
          cursor: pointer; transition: background 0.15s, height 0.15s;
          z-index: 2;
        }
        .km-bar-tick:hover { background: var(--ochre); height: 14px; }
        .km-bar-tick.active-tick { background: var(--ochre); height: 14px; }
        .km-bar-labels {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 6px;
        }
        .km-bar-label-start, .km-bar-label-end {
          font-size: 9px; color: var(--text-muted); letter-spacing: 0.08em;
        }
        .km-bar-label-active {
          font-size: 9px; color: var(--ochre); font-weight: 700; letter-spacing: 0.08em;
          text-align: center; flex: 1; padding: 0 8px;
        }

        /* ===== FLIGHT HUD ===== */
        .flight-hud {
          position: fixed; bottom: 108px; right: 24px; z-index: 20;
          display: none; flex-direction: column; gap: 2px;
          background: rgba(10,10,10,0.82); border: 1px solid rgba(212,162,76,0.35);
          border-radius: 8px; padding: 10px 14px; min-width: 180px;
          backdrop-filter: blur(8px);
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }
        .flight-hud.active { display: flex; }
        .hud-row {
          display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
        }
        .hud-label {
          font-size: 8px; color: var(--text-muted); letter-spacing: 0.12em; text-transform: uppercase;
        }
        .hud-value {
          font-size: 14px; color: var(--ochre); font-weight: 700; letter-spacing: 0.04em;
          font-variant-numeric: tabular-nums;
        }
        .hud-unit {
          font-size: 8px; color: var(--text-muted); margin-left: 2px;
        }
        .hud-divider {
          height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0;
        }
        .hud-dest {
          font-size: 9px; color: rgba(255,255,255,0.6); letter-spacing: 0.06em;
          text-align: right; margin-top: 2px;
        }

        /* ===== LEGEND ===== */
        .cc-legend {
          position: fixed; bottom: 100px; right: 20px; z-index: 15;
          background: rgba(10,14,18,0.88); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 14px;
          backdrop-filter: blur(10px);
        }
        .legend-title { font-size: 8px; letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
        .legend-item { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { font-size: 10px; color: var(--text-dim); }

        /* ===== TIER 1: MOBILE RESPONSIVE ===== */
        @media (max-width: 768px) {
          .cc-sidebar {
            width: 100%; bottom: auto; top: 0; height: 48px; padding-top: 0;
            flex-direction: row; align-items: center; overflow: hidden;
            border-right: none; border-bottom: 1px solid var(--line);
            z-index: 22;
          }
          .cc-sidebar.mobile-open {
            height: 60vh; flex-direction: column; align-items: stretch; overflow-y: auto;
          }
          .sidebar-header {
            display: flex; align-items: center; padding: 0 16px;
            min-height: 48px; border-bottom: none; cursor: pointer;
            flex-shrink: 0;
          }
          .cc-sidebar.mobile-open .sidebar-header { border-bottom: 1px solid var(--line); }
          .sidebar-headline { font-size: 13px; }
          .sidebar-sub { display: none; }
          .sidebar-title { display: none; }
          .listings-list { display: none; }
          .cc-sidebar.mobile-open .listings-list { display: block; flex: 1; }
          .dest-search-wrap { display: none; }
          .cc-sidebar.mobile-open .dest-search-wrap { display: block; }
          .sidebar-toggle-icon {
            margin-left: auto; font-size: 18px; color: var(--text-muted);
          }

          .cc-filter-bar {
            left: 0; top: 48px; padding: 8px 12px; gap: 8px;
          }
          .filter-label { display: none; }

          .listing-panel {
            width: 100%; right: -100%; top: auto; bottom: 0;
            height: 70vh; border-left: none; border-top: 1px solid var(--line-2);
            border-radius: 16px 16px 0 0;
            transition: bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1);
            right: 0; bottom: -100vh;
          }
          .listing-panel.open { bottom: 0; right: 0; }

          .cc-toolbar {
            bottom: 16px; padding: 6px 10px; gap: 2px;
          }
          .toolbar-btn { padding: 6px 8px; font-size: 10px; letter-spacing: 0.04em; }

          .km-progress-bar { left: 0; bottom: 64px; padding: 0 12px; }

          .cc-legend { display: none; }

          .cc-topbar { padding: 10px 16px; }
          .cc-meta { gap: 12px
; }
          .cc-meta-value { font-size: 11px; }
          .cc-meta-label { font-size: 8px; }
        }
      `}</style>

      {/* Cesium globe */}
      <div id="cesium" />
      <div className="vignette" />

      {/* Loading screen */}
      <div className="cesium-loading" id="cesium-loading">
        <div className="loading-logo">Coastal Corridor</div>
        <div className="loading-sub-brand">Lagos → Calabar · Discovery Globe</div>
        <div className="loading-spinner" />
        <div className="loading-text">Initialising 3D terrain</div>
        <div className="loading-steps">
          <div className="loading-step">Loading Cesium World Terrain</div>
          <div className="loading-step">Streaming satellite imagery</div>
          <div className="loading-step">Placing 12 active listings</div>
          <div className="loading-step">Rendering corridor route</div>
        </div>
      </div>

      {/* Top bar */}
      <div className="cc-topbar">
        <div className="cc-brand">
          <div className="cc-brand-name">Coastal Corridor</div>
          <div className="cc-brand-sub">Lagos → Calabar · Discovery Globe</div>
        </div>
        <div className="cc-meta">
          <div className="cc-meta-item">
            <div className="cc-meta-value" id="cesium-clock">--:--:-- WAT</div>
          </div>
          <div className="cc-meta-item">
            <div className="cc-meta-value">700.3 km</div>
            <div className="cc-meta-label">Corridor Length</div>
          </div>
          <div className="cc-meta-item">
            <div className="cc-meta-value" id="destCount">12</div>
            <div className="cc-meta-label">Destinations</div>
          </div>
        </div>
      </div>

      {/* Left sidebar — destinations */}
      <div className="cc-sidebar" id="ccSidebar">
        <div
          className="sidebar-header"
          onClick={() => {
            const sb = document.getElementById('ccSidebar');
            if (sb) sb.classList.toggle('mobile-open');
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="sidebar-title">§01 · Corridor Destinations</div>
            <div className="sidebar-headline">12 Stops · Lagos to Calabar</div>
            <div className="sidebar-sub">Click a destination to explore</div>
          </div>
          <div className="sidebar-toggle-icon">☰</div>
        </div>
        {/* Tier 2: destination search */}
        <div className="dest-search-wrap">
          <input
            className="dest-search-input"
            type="text"
            placeholder="Search destinations..."
            onInput={(e) => (window as any).setDestSearch?.((e.target as HTMLInputElement).value)}
          />
        </div>
        <div className="listings-list" id="listingsList" />
      </div>

      {/* Filter bar */}
      <div className="cc-filter-bar" id="filterBar" />

      {/* Listing card panel */}
      <div className="listing-panel" id="listingPanel" />

      {/* Matterport full-screen overlay */}
      <div className="matterport-overlay" id="matterportOverlay">
        <div className="mp-overlay-header">
          <div className="mp-overlay-title">3D Virtual Tour</div>
          <button className="mp-overlay-close" onClick={() => (window as any).closeMatterport?.()}>✕ CLOSE TOUR</button>
        </div>
        <iframe
          id="matterportIframe"
          className="mp-overlay-iframe"
          allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
          src=""
        />
      </div>

      {/* Tier 3: KM Progress Bar */}
      <div className="km-progress-bar" id="kmProgressBar" />

      {/* Flight HUD — speed / time / KM counter */}
      <div className="flight-hud" id="flightHud">
        <div className="hud-row">
          <span className="hud-label">Speed</span>
          <span><span className="hud-value" id="hudSpeed">0</span><span className="hud-unit">km/h</span></span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Altitude</span>
          <span><span className="hud-value" id="hudAlt">0</span><span className="hud-unit">m</span></span>
        </div>
        <div className="hud-divider" />
        <div className="hud-row">
          <span className="hud-label">Corridor KM</span>
          <span><span className="hud-value" id="hudKm">0.0</span><span className="hud-unit">km</span></span>
        </div>
        <div className="hud-row">
          <span className="hud-label">Elapsed</span>
          <span><span className="hud-value" id="hudTime">00:00</span></span>
        </div>
        <div className="hud-divider" />
        <div className="hud-dest" id="hudDest">— CORRIDOR START —</div>
      </div>

      {/* Bottom toolbar */}
      <div className="cc-toolbar">
        <button className="toolbar-btn" onClick={() => (window as any).cameraOverview?.()}>⊕ OVERVIEW</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" id="flyBtn" onClick={() => (window as any).expressFly?.()}>✈ FLY CORRIDOR</button>
        <button className="toolbar-btn" onClick={() => (window as any).openJourneyPlanner?.()}>🗺 PLAN JOURNEY</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" id="layerBtn" onClick={() => (window as any).toggleLayersPanel?.()}>⊞ LAYERS</button>
        <button className="toolbar-btn" id="timeBtn" onClick={() => (window as any).cycleTime?.()}>☀ <span id="timeLabel">MIDDAY</span></button>
        <button className="toolbar-btn active" id="satBtn" onClick={() => (window as any).toggleSatellite?.()}>🛰 SATELLITE</button>
        <button className="toolbar-btn" id="bldgBtn" onClick={() => (window as any).toggleBuildings?.()}>🏢 BUILDINGS</button>
        <button className="toolbar-btn" id="vrBtn" onClick={() => (window as any).toggleVR?.()}>VR</button>
      </div>

      {/* Layers panel */}
      <div className="layers-panel" id="layersPanel">
        <div className="layers-title">Layer Control</div>
        <div className="layer-toggle" onClick={(e) => { const t = (e.currentTarget as HTMLElement).querySelector('.toggle'); t?.classList.toggle('on'); (window as any).toggleListingPins?.(t?.classList.contains('on') ?? true); }}>
          <span className="layer-name">Listing Pins</span>
          <div className="toggle on" />
        </div>
        <div className="layer-toggle" onClick={(e) => { const t = (e.currentTarget as HTMLElement).querySelector('.toggle'); t?.classList.toggle('on'); (window as any).toggleRoute?.(t?.classList.contains('on') ?? true); }}>
          <span className="layer-name">Highway Route</span>
          <div className="toggle on" />
        </div>
        <div className="layer-toggle" onClick={(e) => { const t = (e.currentTarget as HTMLElement).querySelector('.toggle'); t?.classList.toggle('on'); (window as any).toggleDestMarkers?.(t?.classList.contains('on') ?? true); }}>
          <span className="layer-name">Destination Markers</span>
          <div className="toggle on" />
        </div>
        <div className="layer-toggle" onClick={(e) => { const t = (e.currentTarget as HTMLElement).querySelector('.toggle'); t?.classList.toggle('on'); (window as any).toggleLabels?.(t?.classList.contains('on') ?? true); }}>
          <span className="layer-name">Price Labels</span>
          <div className="toggle on" />
        </div>
      </div>

      {/* Journey planner panel */}
      <div className="journey-panel" id="journeyPanel">
        <div className="journey-title">Plan Your Journey</div>
        <div className="journey-sub">Choose a departure point and a destination listing. The camera will fly the coastal route, pausing at listings along the way.</div>
        <div className="journey-row">
          <div className="journey-label">Depart from</div>
          <select className="journey-select" id="journeyFrom" dangerouslySetInnerHTML={{ __html: destOptions }} />
        </div>
        <div className="journey-row">
          <div className="journey-label">Fly to listing</div>
          <select className="journey-select" id="journeyTo" dangerouslySetInnerHTML={{ __html: listingOptions }} />
        </div>
        <button className="journey-btn" onClick={() => (window as any).startJourney?.()}>✈ BEGIN JOURNEY</button>
      </div>

      {/* Destination context toast */}
      <div className="dest-toast" id="destToast">
        <div className="dest-toast-text" id="destToastText" />
      </div>

      {/* Legend */}
      <div className="cc-legend">
        <div className="legend-title">Listing Type</div>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="legend-item">
            <div className="legend-dot" style={{ background: color }} />
            <div className="legend-label">{type.replace('_', ' ')}</div>
          </div>
        ))}
      </div>
    </>
  );
}
