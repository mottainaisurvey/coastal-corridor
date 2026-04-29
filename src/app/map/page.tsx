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

      // ============ FILTER STATE ============
      let filterType = 'ALL';
      let filterState = 'ALL';
      let filterVerified = false;
      let filterFeatured = false;

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
          buildListingsSidebar();
          buildFilterBar();
          startClock();
          wireClickHandler();

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

      // ============ LISTING PINS (A1 + A2) ============
      function plotListings() {
        listingEntities.forEach(e => viewer.entities.remove(e));
        listingEntities = [];

        filteredListings.forEach(p => {
          const color = TYPE_COLORS[p.type] || '#d4a24c';
          const typeLabel = TYPE_LABELS[p.type] || p.type;

          // Main billboard pin
          const entity = viewer.entities.add({
            id: `listing-${p.id}`,
            position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat, 80),
            billboard: {
              image: createPinCanvas(color, typeLabel),
              width: 52,
              height: 52,
              verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              scaleByDistance: new Cesium.NearFarScalar(5000, 1.4, 1500000, 0.6)
            },
            label: {
              text: p.price,
              font: '600 11px "Inter Tight", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#0a0e12'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -58),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(10,14,18,0.88)'),
              backgroundPadding: new Cesium.Cartesian2(6, 3),
              // Zoom-dependent: only show price label when zoomed in
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 400000),
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

      // ============ DESTINATION AMBIENT MARKERS (A5) ============
      function plotDestinations() {
        DESTINATIONS.forEach(d => {
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
              // Only visible at high altitude (ambient context)
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
              // Only show destination labels at very high altitude
              distanceDisplayCondition: new Cesium.DistanceDisplayCondition(400000, Number.POSITIVE_INFINITY),
              scaleByDistance: new Cesium.NearFarScalar(400000, 0.8, 2000000, 0.4)
            },
            destData: d
          });
          destEntities.push(entity);
        });
      }

      function plotRoute() {
        const positions = DESTINATIONS.map(d => Cesium.Cartesian3.fromDegrees(d.lng, d.lat, 20));
        routeEntity = viewer.entities.add({
          polyline: {
            positions,
            width: 2.5,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              taperPower: 0.9,
              color: Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.7)
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
              // Destination tap: show context info, don't open full listing card
              showDestinationToast(picked.id.destData);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      // ============ LISTING CARD PANEL (A3 + A4 + A7) ============
      function openListingCard(p: any) {
        activeListingId = p.id;

        // Highlight active in sidebar
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
      }

      function closeListingCard() {
        const panel = document.getElementById('listingPanel');
        if (panel) panel.classList.remove('open');
        activeListingId = null;
        document.querySelectorAll('.listing-item').forEach(el => el.classList.remove('active'));
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

      // ============ SIDEBAR (listings list) ============
      function buildListingsSidebar() {
        const list = document.getElementById('listingsList');
        if (!list) return;
        list.innerHTML = filteredListings.map(p => {
          const typeColor = TYPE_COLORS[p.type] || '#d4a24c';
          return `
            <div class="listing-item" data-listing-id="${p.id}" onclick="sidebarClickListing('${p.id}')">
              <div class="li-img" style="background-image:url('${p.heroImage}')"></div>
              <div class="li-body">
                <div class="li-type" style="color:${typeColor}">${p.type.replace('_', ' ')}</div>
                <div class="li-title">${p.title}</div>
                <div class="li-loc">${p.destinationName}</div>
                <div class="li-price-row">
                  <span class="li-price">${p.price}</span>
                  ${p.yoy > 0 ? `<span class="li-yoy">+${p.yoy}%</span>` : ''}
                </div>
              </div>
            </div>
          `;
        }).join('');
        updateListingCount();
      }

      function sidebarClickListing(id: string) {
        const p = LISTINGS.find(x => x.id === id);
        if (!p) return;
        openListingCard(p);
        flyToListing(id, false);
      }

      function flyToListing(id: string, fromButton = true) {
        const p = LISTINGS.find(x => x.id === id);
        if (!p) return;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(p.lng, p.lat - 0.04, 6000),
          orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
          duration: fromButton ? 3.5 : 2.5
        });
      }

      // ============ FILTER BAR (A6) ============
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
        buildListingsSidebar();
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

      function updateListingCount() {
        const el = document.getElementById('listingCount');
        if (el) el.textContent = `${filteredListings.length} listing${filteredListings.length !== 1 ? 's' : ''} visible`;
      }

      // ============ FLYTHROUGH MODES (S1a, S1b, S1c) ============
      function cameraOverview() {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(5.8, 4.2, 1000000),
          orientation: { heading: Cesium.Math.toRadians(10), pitch: Cesium.Math.toRadians(-48), roll: 0 },
          duration: 3
        });
        closeListingCard();
      }

      // S1a: Express Fly — non-stop cinematic corridor flyover
      async function expressFly() {
        if (flyAnimating) { flyAnimating = false; return; }
        flyAnimating = true;
        closeListingCard();
        const btn = document.getElementById('flyBtn');
        if (btn) { btn.textContent = '⏹ STOP'; btn.classList.add('active'); }

        // Lift to high altitude and fly the corridor west→east
        await new Promise(resolve => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(3.2, 5.5, 900000),
            orientation: { heading: Cesium.Math.toRadians(85), pitch: Cesium.Math.toRadians(-32), roll: 0 },
            duration: 3,
            complete: resolve, cancel: resolve
          });
        });

        if (!flyAnimating) { resetFlyBtn(); return; }

        // Sweep east along the corridor
        await new Promise(resolve => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(8.5, 4.8, 700000),
            orientation: { heading: Cesium.Math.toRadians(95), pitch: Cesium.Math.toRadians(-28), roll: 0 },
            duration: 12,
            complete: resolve, cancel: resolve
          });
        });

        flyAnimating = false;
        resetFlyBtn();
        cameraOverview();
      }

      // S1b: Fly To — direct flight to any listing (also used from listing card button)
      // Already implemented above as flyToListing()

      // S1c: Journey Mode — pick departure + destination, fly coastal route
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

        // Find departure destination
        const fromDest = DESTINATIONS.find(d => d.id === fromId);
        const toListing = LISTINGS.find(p => p.id === toId);
        if (!fromDest || !toListing) return;

        // Find listings along the route between from and to
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

        // Start from departure destination
        await new Promise(resolve => {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(from.lng, from.lat - 0.06, 12000),
            orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-35), roll: 0 },
            duration: 2.5,
            complete: resolve, cancel: resolve
          });
        });

        // Pause at each waypoint listing along the route
        for (const p of waypoints) {
          if (!flyAnimating) break;
          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(p.lng, p.lat - 0.04, 8000),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
              duration: 3,
              complete: resolve, cancel: resolve
            });
          });
          if (!flyAnimating) break;
          openListingCard(p);
          await new Promise(r => setTimeout(r, 2500));
        }

        // Arrive at destination listing
        if (flyAnimating) {
          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(destination.lng, destination.lat - 0.04, 5000),
              orientation: { heading: Cesium.Math.toRadians(0), pitch: Cesium.Math.toRadians(-38), roll: 0 },
              duration: 3.5,
              complete: resolve, cancel: resolve
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

      // ============ VR MODE (S2b + S2c) ============
      async function toggleVR() {
        const btn = document.getElementById('vrBtn');
        if (vrMode) {
          // Exit VR: remove Google tiles, restore Bing imagery
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
          // Enter VR: load Google Photorealistic 3D Tiles
          try {
            if (btn) btn.classList.add('active');
            googleTileset = await Cesium.createGooglePhotorealistic3DTileset();
            viewer.scene.primitives.add(googleTileset);
            viewer.imageryLayers.removeAll();
            vrMode = true;
            if (btn) btn.textContent = '↩ EXIT VR';
            showToast('Google Photorealistic 3D Tiles active · Zoom in for ground-level view');
            // Drop camera to ground level at current listing or overview
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

      // ============ BUILDINGS (OSM + Labels) ============
      async function toggleBuildings() {
        const btn = document.getElementById('bldgBtn');
        if (buildingsTileset) {
          viewer.scene.primitives.remove(buildingsTileset);
          buildingsTileset = null;
          if (btn) btn.classList.remove('active');
          return;
        }
        try {
          if (btn) btn.classList.add('active');
          buildingsTileset = await Cesium.createOsmBuildingsAsync();
          // Style buildings with name labels visible on zoom
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
      (window as any).closeListingCard = closeListingCard;
      (window as any).flyToListing = flyToListing;
      (window as any).sidebarClickListing = sidebarClickListing;
      (window as any).expandMatterport = expandMatterport;
      (window as any).closeMatterport = closeMatterport;
      (window as any).setTypeFilter = setTypeFilter;
      (window as any).setStateFilter = setStateFilter;
      (window as any).setVerifiedFilter = setVerifiedFilter;
      (window as any).setFeaturedFilter = setFeaturedFilter;

      init();
    }

    return () => {
      const v = (window as any).__cesiumViewer;
      if (v) v.destroy();
    };
  }, []);

  // Build journey panel options
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
          background: linear-gradient(to bottom, transparent 40%, rgba(10,14,18,0.9) 100%);
        }
        .lp-yoy {
          position: absolute; top: 12px; right: 12px;
          background: var(--success); color: var(--ink); padding: 3px 8px;
          border-radius: 4px; font-size: 11px; font-weight: 700;
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

        /* ===== LEGEND ===== */
        .cc-legend {
          position: fixed; bottom: 80px; right: 20px; z-index: 15;
          background: rgba(10,14,18,0.88); border: 1px solid var(--line);
          border-radius: 8px; padding: 10px 14px;
          backdrop-filter: blur(10px);
        }
        .legend-title { font-size: 8px; letter-spacing: 0.14em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
        .legend-item { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
        .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .legend-label { font-size: 10px; color: var(--text-dim); }
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

      {/* Left sidebar — listings */}
      <div className="cc-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">§01 · Active Listings</div>
          <div className="sidebar-headline">Properties on the Corridor</div>
          <div className="sidebar-sub"><span id="listingCount">12 listings visible</span></div>
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

      {/* Bottom toolbar */}
      <div className="cc-toolbar">
        <button className="toolbar-btn" onClick={() => (window as any).cameraOverview?.()}>⊕ OVERVIEW</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" id="flyBtn" onClick={() => (window as any).expressFly?.()}>✈ FLY CORRIDOR</button>
        <button className="toolbar-btn" onClick={() => (window as any).openJourneyPlanner?.()}>🗺 PLAN JOURNEY</button>
        <div className="toolbar-sep" />
        <button className="toolbar-btn" id="layerBtn" onClick={() => (window as any).toggleLayersPanel?.()}>⊞ LAYERS</button>
        <button className="toolbar-btn" id="timeBtn" onClick={() => (window as any).cycleTime?.()}>☀ <span id="timeLabel">MIDDAY</span></button>
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
