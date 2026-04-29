'use client';

import { useEffect } from 'react';

export default function MapPage() {
  useEffect(() => {
    // Dynamically inject Cesium CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/cesium@1.118/Build/Cesium/Widgets/widgets.css';
    document.head.appendChild(link);

    // Dynamically inject Cesium JS
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/cesium@1.118/Build/Cesium/Cesium.js';
    script.async = true;
    script.onload = () => initCesium();
    document.head.appendChild(script);

    function initCesium() {
      const Cesium = (window as any).Cesium;

      // ============ DESTINATIONS DATA ============
      const destinations = [
        {
          id: 'vi', name: 'Victoria Island Terminus', state: 'Lagos',
          lat: 6.4281, lng: 3.4216, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3',
          desc: 'Western origin of the corridor. Dense commercial district and gateway to Lagos metropolis, with ferry terminals, business infrastructure and the primary urban real estate market in West Africa.',
          stats: [
            { label: 'Plot Availability', value: '~140', unit: 'listed' },
            { label: 'Avg Land Value', value: '₦580M', unit: '/ plot' },
            { label: 'Tourism POIs', value: '38', unit: 'sites' },
            { label: 'Corridor KM', value: '0.0', unit: 'km' }
          ],
          features: ['3D building context from OSM + drone capture', 'Live marine traffic overlay (MarineTraffic API)', 'Real-time hotel availability for VI & Ikoyi', 'Enterprise GIS partner office integration']
        },
        {
          id: 'lekki', name: 'Lekki Peninsula', state: 'Lagos',
          lat: 6.4698, lng: 3.5852, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c',
          desc: 'Fastest-growing real estate market on the corridor. Free Trade Zone, Deep Sea Port, and Dangote Refinery adjacency make this the primary investment thesis for the Lagos segment.',
          stats: [
            { label: 'Plot Inventory', value: '1,240', unit: 'listed' },
            { label: 'Avg Price/sqm', value: '₦185K', unit: '' },
            { label: 'YoY Growth', value: '+18%', unit: '' },
            { label: 'Corridor KM', value: '42.1', unit: 'km' }
          ],
          features: ['Lekki FTZ proximity score per plot', 'Deep Sea Port impact radius overlay', 'Dangote Refinery workforce housing demand model', 'Diaspora fractional ownership pool (live)']
        },
        {
          id: 'epe', name: 'Epe Coastal Extension', state: 'Lagos',
          lat: 6.5833, lng: 3.9833, type: 'realestate', tag: 'REAL ESTATE', color: '#c96a3f',
          desc: 'Emerging satellite town with significant undeveloped coastal land. Early land assembly opportunity before corridor construction reaches this segment — platform hosts 340 verified plots.',
          stats: [
            { label: 'Plot Inventory', value: '340', unit: 'listed' },
            { label: 'Avg Price/sqm', value: '₦22K', unit: '' },
            { label: 'Coastline', value: '28', unit: 'km' },
            { label: 'Corridor KM', value: '98.4', unit: 'km' }
          ],
          features: ['Mangrove conservation zone boundary overlay', 'Aquaculture & fishing community impact model', 'Epe Resort Zone master plan integration', 'Title verification via Lagos Land Bureau API']
        },
        {
          id: 'ijebu', name: 'Ijebu-Ode Junction', state: 'Ogun',
          lat: 6.8167, lng: 3.9333, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c',
          desc: 'Strategic inland junction where the coastal highway meets the Lagos-Ibadan expressway. Logistics hub with growing industrial and residential demand from Ogun State\'s manufacturing belt.',
          stats: [
            { label: 'Plot Inventory', value: '620', unit: 'listed' },
            { label: 'Industrial Zone', value: 'Active', unit: '' },
            { label: 'Avg Price/sqm', value: '₦12K', unit: '' },
            { label: 'Corridor KM', value: '142.0', unit: 'km' }
          ],
          features: ['Logistics hub layer (truck parks, weighbridges)', 'Olumo Rock cultural VR experience', 'Live truck-park availability for Kobo360 / GIG', 'Industrial zoning compliance checker']
        },
        {
          id: 'ondo', name: 'Ondo Coastal Belt', state: 'Ondo',
          lat: 6.2500, lng: 4.8000, type: 'tourism', tag: 'TOURISM', color: '#8aa876',
          desc: 'Undeveloped stretch of Atlantic coastline running east of Ondo town. Raw beachfront in pristine condition — critical window for early land assembly before price discovery begins.',
          stats: [
            { label: 'Coastline', value: '74', unit: 'km' },
            { label: 'Developed', value: '<3%', unit: '' },
            { label: 'Avg Price/sqm', value: '₦8.5K', unit: '' },
            { label: 'Resort Potential', value: 'Tier-1', unit: '' }
          ],
          features: ['Sentinel-2 change detection (coastal erosion monitoring)', 'Drone photogrammetry captured Q1 2026', 'Film location scout catalogue (Nollywood)', 'Carbon credit MRV potential score']
        },
        {
          id: 'warri', name: 'Warri Delta Hub', state: 'Delta',
          lat: 5.5167, lng: 5.7500, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3',
          desc: 'Oil & gas capital of the Niger Delta. Significant industrial and residential real estate demand, with major refinery rehabilitation driving workforce housing requirements.',
          stats: [
            { label: 'Plot Inventory', value: '890', unit: 'listed' },
            { label: 'Avg Price/sqm', value: '₦38K', unit: '' },
            { label: 'Refinery Status', value: 'Active', unit: '' },
            { label: 'Corridor KM', value: '312.5', unit: 'km' }
          ],
          features: ['Refinery workforce housing demand model', 'Delta State flood risk mapping (annual/100yr)', 'Oil spill remediation zone exclusion layer', 'Marine logistics & barge terminal overlay']
        },
        {
          id: 'yenagoa', name: 'Yenagoa Waterfront', state: 'Bayelsa',
          lat: 4.9247, lng: 6.2642, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c',
          desc: 'Bayelsa capital with significant riverfront and government-led redevelopment. Early-stage platform coverage — 180 plots live, growing rapidly as the corridor construction reaches this segment.',
          stats: [
            { label: 'Plot Inventory', value: '180', unit: 'listed' },
            { label: 'Waterfront km', value: '12.4', unit: 'km' },
            { label: 'Gov. Master Plan', value: 'Active', unit: '' },
            { label: 'Avg Price/sqm', value: '₦14K', unit: '' }
          ],
          features: ['Government master plan overlay (state partnership)', 'Flood modelling (annual, seasonal, 100yr)', 'Riverfront development zoning', 'Community land-use consultation tracker']
        },
        {
          id: 'ph', name: 'Port Harcourt Bypass', state: 'Rivers',
          lat: 4.8156, lng: 7.0498, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3',
          desc: 'Corridor bypasses PH proper but connects to the Eastern Niger Delta economic engine. Strategic interchange for freight, diaspora real estate, and the eastern tourism belt running into Akwa Ibom.',
          stats: [
            { label: 'Interchange Class', value: 'A+', unit: '' },
            { label: 'Plot Inventory', value: '1,120', unit: 'listed' },
            { label: 'Avg Price/sqm', value: '₦48K', unit: '' },
            { label: 'Tourism Transit', value: 'High', unit: '' }
          ],
          features: ['Oil & Gas Free Zone adjacency analysis', 'Refined multi-family housing masterplans', 'Diaspora fractional investment pool', 'Corporate campus site selection tool']
        },
        {
          id: 'uyo', name: 'Uyo Corridor Spur', state: 'Akwa Ibom',
          lat: 5.0378, lng: 7.9128, type: 'mixed', tag: 'MIXED USE', color: '#d4a24c',
          desc: 'State capital with rapid infrastructure investment, new airport, and strong diaspora remittance flows. Ibom Deep Sea Port in planning stages — a secondary investment thesis on this segment.',
          stats: [
            { label: 'Plot Inventory', value: '760', unit: 'listed' },
            { label: 'Airport Grade', value: 'Intl.', unit: '' },
            { label: 'Avg Price/sqm', value: '₦22K', unit: '' },
            { label: 'Remittance Rank', value: 'Top-5', unit: '' }
          ],
          features: ['Ibom Deep Sea Port impact modelling', 'Akwa Ibom diaspora investment community', 'Airport proximity zone analysis', 'State Land Bureau API integration']
        },
        {
          id: 'ibeno', name: 'Ibeno Beach Zone', state: 'Akwa Ibom',
          lat: 4.5600, lng: 7.9900, type: 'tourism', tag: 'TOURISM', color: '#8aa876',
          desc: 'One of Africa\'s longest unbroken beaches. Massive underdeveloped tourism potential — platform hosts operator marketplace for guesthouses, boat tours and upcoming resort developments.',
          stats: [
            { label: 'Beach Length', value: '245', unit: 'km' },
            { label: 'Operators Listed', value: '28', unit: '' },
            { label: 'Resort Pipeline', value: '6', unit: 'projects' },
            { label: 'VR Captures', value: '41', unit: 'sites' }
          ],
          features: ['360° immersive beach sessions (Insta360 Pro 2)', 'Local operator commission marketplace', 'Carbon credit mangrove MRV pilot zone', 'Multiplayer VR tour sessions for diaspora families']
        },
        {
          id: 'tinapa', name: 'Tinapa & Marina Resort', state: 'Cross River',
          lat: 5.0000, lng: 8.2900, type: 'tourism', tag: 'TOURISM', color: '#8aa876',
          desc: 'Cross River\'s flagship tourism complex. Eastern gateway of the corridor with shopping, resort, marina and adjacency to the Calabar Carnival. Strong state government partnership opportunity.',
          stats: [
            { label: 'Visitor Capacity', value: '12K', unit: '/day' },
            { label: 'Hotel Inventory', value: '2,400', unit: 'keys' },
            { label: 'Marina Berths', value: '86', unit: 'slots' },
            { label: 'Annual Carnival', value: 'Dec', unit: 'peak' }
          ],
          features: ['Calabar Carnival VR ticketing platform', 'State tourism board partnership dashboard', 'Marina slot booking integration', 'Cross-border shopping logistics tracker']
        },
        {
          id: 'calabar', name: 'Calabar Terminus', state: 'Cross River',
          lat: 4.9589, lng: 8.3269, type: 'infra', tag: 'INFRASTRUCTURE', color: '#4db3b3',
          desc: 'Eastern origin of the corridor. Historic port city and gateway to Obudu Mountain Resort, rainforest assets, and the Cross River tourism belt. Primary diaspora destination for Efik, Ibibio, and Cross River communities.',
          stats: [
            { label: 'Historic District', value: '412', unit: 'acres' },
            { label: 'Tourism POIs', value: '62', unit: 'sites' },
            { label: 'Plot Inventory', value: '540', unit: 'listed' },
            { label: 'Corridor KM', value: '700.3', unit: 'km' }
          ],
          features: ['Obudu Mountain Resort VR side-quest module', 'Historic district heritage preservation layer', 'Cross-border tourism (Cameroon) routing', 'Efik / Ibibio diaspora investment community']
        }
      ];

      // ============ CESIUM INIT ============
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwMWNhMWYyNi03YWJhLTRlZWEtYmEwNi0wMzFlZTFkNGEwYTMiLCJpZCI6NDIwMTg2LCJpYXQiOjE3NzY1ODU5OTl9.tm3bsS6OtVhDC9G96B6B-5mXkuZnnnUA1ATWavPZTr0';

      let viewer: any, destEntities: any[] = [], routeEntity: any, plotEntities: any[] = [];
      let activeDestId: string | null = null, flyAnimating = false;
      let buildingsTileset: any = null;
      const times = ['Dawn', 'Midday', 'Dusk', 'Night'];
      let timeIdx = 1;

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
            terrain: Cesium.Terrain.fromWorldTerrain({
              requestVertexNormals: true,
              requestWaterMask: true
            }),
            skyBox: false,
            skyAtmosphere: new Cesium.SkyAtmosphere()
          });

          // Load Bing aerial imagery
          try {
            const imageryProvider = await Cesium.IonImageryProvider.fromAssetId(2);
            viewer.imageryLayers.removeAll();
            viewer.imageryLayers.addImageryProvider(imageryProvider);
          } catch (e: any) {
            console.warn('Bing imagery unavailable, falling back:', e.message);
          }

          // Atmosphere tuning
          viewer.scene.globe.enableLighting = false;
          viewer.scene.fog.enabled = true;
          viewer.scene.fog.density = 0.00012;
          viewer.scene.skyAtmosphere.hueShift = -0.05;
          viewer.scene.skyAtmosphere.saturationShift = -0.15;
          viewer.scene.skyAtmosphere.brightnessShift = -0.1;
          viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e12');

          // Initial camera
          viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(5.8, 4.2, 1100000),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-55),
              roll: 0
            }
          });

          plotDestinations();
          plotRoute();
          buildDestList();
          startClock();

          setTimeout(() => {
            const loading = document.getElementById('cesium-loading');
            if (loading) loading.classList.add('hide');
            setTimeout(() => cameraOverview(), 400);
          }, 2000);

        } catch (err) {
          console.error('Cesium init failed:', err);
          const loading = document.getElementById('cesium-loading');
          if (loading) loading.innerHTML = '<div class="loading-text">Unable to load terrain</div><div class="loading-sub">Check network · Verify token at cesium.com</div>';
        }
      }

      function plotDestinations() {
        destinations.forEach(d => {
          const entity = viewer.entities.add({
            id: `dest-${d.id}`,
            position: Cesium.Cartesian3.fromDegrees(d.lng, d.lat, 50),
            point: {
              pixelSize: 14,
              color: Cesium.Color.fromCssColorString(d.color),
              outlineColor: Cesium.Color.WHITE,
              outlineWidth: 2,
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            },
            label: {
              text: d.name,
              font: '12px "Inter Tight", sans-serif',
              fillColor: Cesium.Color.WHITE,
              outlineColor: Cesium.Color.fromCssColorString('#0a0e12'),
              outlineWidth: 3,
              style: Cesium.LabelStyle.FILL_AND_OUTLINE,
              pixelOffset: new Cesium.Cartesian2(0, -26),
              heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
              disableDepthTestDistance: Number.POSITIVE_INFINITY,
              showBackground: true,
              backgroundColor: Cesium.Color.fromCssColorString('rgba(10,14,18,0.85)'),
              backgroundPadding: new Cesium.Cartesian2(7, 4),
              scaleByDistance: new Cesium.NearFarScalar(100000, 1.0, 3000000, 0.5)
            },
            destData: d
          });
          destEntities.push(entity);
        });

        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction((movement: any) => {
          const picked = viewer.scene.pick(movement.position);
          if (Cesium.defined(picked) && picked.id) {
            if (picked.id.destData) {
              focusDestination(picked.id.destData);
            } else if (picked.id.plotData) {
              showPlotInfo(picked.id.plotData);
            }
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
      }

      function plotRoute() {
        const positions = destinations.map(d => Cesium.Cartesian3.fromDegrees(d.lng, d.lat, 20));
        routeEntity = viewer.entities.add({
          polyline: {
            positions,
            width: 3,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.3,
              taperPower: 0.9,
              color: Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.9)
            }),
            clampToGround: true
          }
        });
      }

      function loadPlotLayer(dest: any) {
        clearPlotLayer();
        const cols = 6, rows = 4;
        const spacing = 0.004;
        const startLng = dest.lng - (cols * spacing) / 2;
        const startLat = dest.lat - (rows * spacing) / 2;
        let plotNum = 1;
        for (let i = 0; i < rows; i++) {
          for (let j = 0; j < cols; j++) {
            const lng = startLng + j * spacing;
            const lat = startLat + i * spacing;
            const w = spacing * 0.82;
            const isVerified = Math.random() > 0.22;
            const priceBase = parseInt((dest.stats[1]?.value || '50').replace(/[^0-9]/g, '')) || 50;
            const price = (priceBase * (0.8 + Math.random() * 0.4)).toFixed(0);
            const plotData = {
              num: plotNum++,
              dest: dest.name,
              lat: lat + w / 2,
              lng: lng + w / 2,
              size: `${(450 + Math.floor(Math.random() * 550))} sqm`,
              price: `₦${price}K/sqm`,
              verified: isVerified,
              status: isVerified ? 'Verified · Available' : 'Pending verification'
            };
            const color = isVerified
              ? Cesium.Color.fromCssColorString('#c96a3f').withAlpha(0.55)
              : Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.35);
            const entity = viewer.entities.add({
              polygon: {
                hierarchy: Cesium.Cartesian3.fromDegreesArray([
                  lng, lat, lng + w, lat, lng + w, lat + w, lng, lat + w
                ]),
                material: color,
                outline: true,
                outlineColor: isVerified
                  ? Cesium.Color.fromCssColorString('#e08660').withAlpha(0.9)
                  : Cesium.Color.fromCssColorString('#d4a24c').withAlpha(0.6),
                outlineWidth: 1,
                height: 0,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
              },
              plotData
            });
            plotEntities.push(entity);
          }
        }
      }

      function clearPlotLayer() {
        plotEntities.forEach(e => viewer.entities.remove(e));
        plotEntities = [];
      }

      function showPlotInfo(plot: any) {
        const toast = document.getElementById('plotToast');
        const toastLabel = document.getElementById('toastLabel');
        const toastTitle = document.getElementById('toastTitle');
        if (toast && toastLabel && toastTitle) {
          toastLabel.textContent = `Plot #${plot.num} · ${plot.size} · ${plot.price} · ${plot.status}`;
          toastTitle.textContent = `${plot.dest} · ${plot.lat.toFixed(4)}°N, ${plot.lng.toFixed(4)}°E`;
          toast.classList.add('show');
          clearTimeout((window as any)._plotTimer);
          (window as any)._plotTimer = setTimeout(() => toast.classList.remove('show'), 4500);
        }
      }

      function focusDestination(d: any) {
        activeDestId = d.id;
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(d.lng, d.lat - 0.05, 8000),
          orientation: {
            heading: Cesium.Math.toRadians(0),
            pitch: Cesium.Math.toRadians(-42),
            roll: 0
          },
          duration: 2.5
        });
        openDetail(d);
        document.querySelectorAll('.dest-item').forEach(el => el.classList.remove('active'));
        const activeEl = document.querySelector(`[data-id="${d.id}"]`);
        if (activeEl) activeEl.classList.add('active');
        const plotsToggle = document.querySelectorAll('.layer-toggle')[2]?.querySelector('.toggle');
        if (plotsToggle?.classList.contains('on')) loadPlotLayer(d);
      }

      function openDetail(d: any) {
        const panel = document.getElementById('detailPanel');
        const detailState = document.getElementById('detailState');
        const detailName = document.getElementById('detailName');
        const detailDesc = document.getElementById('detailDesc');
        const detailStats = document.getElementById('detailStats');
        const detailFeatures = document.getElementById('detailFeatures');
        const detailCoords = document.getElementById('detailCoords');
        const detailHero = document.getElementById('detailHero');
        if (!panel) return;
        if (detailState) detailState.textContent = `${d.state} State · ${d.tag}`;
        if (detailName) detailName.textContent = d.name;
        if (detailDesc) detailDesc.textContent = d.desc;
        if (detailCoords) detailCoords.textContent = `${d.lat.toFixed(4)}°N, ${d.lng.toFixed(4)}°E`;
        if (detailHero) detailHero.style.background = `linear-gradient(135deg, ${d.color}22 0%, #11161c 100%)`;
        if (detailStats) {
          detailStats.innerHTML = d.stats.map((s: any) => `
            <div class="stat-cell">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value">${s.value}<span class="unit">${s.unit}</span></div>
            </div>
          `).join('');
        }
        if (detailFeatures) {
          detailFeatures.innerHTML = d.features.map((f: string) => `<li>${f}</li>`).join('');
        }
        panel.classList.add('open');
      }

      function buildDestList() {
        const list = document.getElementById('destList');
        if (!list) return;
        list.innerHTML = destinations.map((d, i) => `
          <div class="dest-item" data-id="${d.id}" data-index="${i}">
            <div class="dest-num">${String(i + 1).padStart(2, '0')}</div>
            <div class="dest-info">
              <div class="dest-name">${d.name}</div>
              <div class="dest-state">${d.state}</div>
            </div>
            <div class="dest-tag tag-${d.type}">${d.tag}</div>
          </div>
        `).join('');
        list.querySelectorAll('.dest-item').forEach(el => {
          el.addEventListener('click', () => {
            const idx = parseInt((el as HTMLElement).dataset.index || '0');
            focusDestination(destinations[idx]);
          });
        });
        const destCount = document.getElementById('destCount');
        if (destCount) destCount.textContent = String(destinations.length);
      }

      function cameraOverview() {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(5.8, 4.2, 1000000),
          orientation: {
            heading: Cesium.Math.toRadians(10),
            pitch: Cesium.Math.toRadians(-48),
            roll: 0
          },
          duration: 3
        });
        closeDetail();
      }

      async function flyCorridor() {
        if (flyAnimating) {
          flyAnimating = false;
          return;
        }
        flyAnimating = true;
        const btn = document.getElementById('flyBtn');
        if (btn) btn.classList.add('active');
        for (let i = 0; i < destinations.length; i++) {
          if (!flyAnimating) break;
          const d = destinations[i];
          await new Promise(resolve => {
            viewer.camera.flyTo({
              destination: Cesium.Cartesian3.fromDegrees(d.lng, d.lat - 0.08, 14000),
              orientation: {
                heading: Cesium.Math.toRadians(75),
                pitch: Cesium.Math.toRadians(-28),
                roll: 0
              },
              duration: 3.2,
              complete: resolve,
              cancel: resolve
            });
          });
          if (!flyAnimating) break;
          await new Promise(r => setTimeout(r, 700));
        }
        flyAnimating = false;
        if (btn) btn.classList.remove('active');
        cameraOverview();
      }

      function toggleLayersPanel() {
        const p = document.getElementById('layersPanel');
        const b = document.getElementById('layerBtn');
        if (p) p.classList.toggle('open');
        if (b) b.classList.toggle('active');
      }

      function toggleLayer(el: HTMLElement, layer: string) {
        const toggle = el.querySelector('.toggle');
        if (!toggle) return;
        toggle.classList.toggle('on');
        const isOn = toggle.classList.contains('on');
        if (layer === 'destinations') {
          destEntities.forEach(e => { e.show = isOn; });
        } else if (layer === 'route') {
          if (routeEntity) routeEntity.show = isOn;
        } else if (layer === 'labels') {
          destEntities.forEach(e => { if (e.label) e.label.show = isOn; });
        } else if (layer === 'plots') {
          if (isOn) {
            const d = activeDestId ? destinations.find(x => x.id === activeDestId) : destinations[1];
            if (d) { loadPlotLayer(d); if (!activeDestId) focusDestination(d); }
          } else {
            clearPlotLayer();
          }
        }
      }

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
          viewer.scene.primitives.add(buildingsTileset);
        } catch (e) {
          console.error('OSM Buildings load failed:', e);
          if (btn) btn.classList.remove('active');
        }
      }

      function showPlotsHere() {
        const plotsToggle = document.querySelectorAll('.layer-toggle')[2]?.querySelector('.toggle');
        if (plotsToggle) plotsToggle.classList.add('on');
        const d = activeDestId ? destinations.find(x => x.id === activeDestId) : destinations[1];
        if (d) loadPlotLayer(d);
        const toast = document.getElementById('plotToast');
        const toastLabel = document.getElementById('toastLabel');
        const toastTitle = document.getElementById('toastTitle');
        if (toast && toastLabel && toastTitle && d) {
          toastLabel.textContent = `Cadastral layer · 24 plots loaded · ${d.name}`;
          toastTitle.textContent = 'Click any plot footprint on the globe';
          toast.classList.add('show');
          clearTimeout((window as any)._plotTimer);
          (window as any)._plotTimer = setTimeout(() => toast.classList.remove('show'), 4500);
        }
      }

      function closeDetail() {
        const panel = document.getElementById('detailPanel');
        if (panel) panel.classList.remove('open');
      }

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

      // Expose functions to window for inline onclick handlers
      (window as any).cameraOverview = cameraOverview;
      (window as any).flyCorridor = flyCorridor;
      (window as any).toggleLayersPanel = toggleLayersPanel;
      (window as any).toggleLayer = toggleLayer;
      (window as any).cycleTime = cycleTime;
      (window as any).toggleBuildings = toggleBuildings;
      (window as any).showPlotsHere = showPlotsHere;
      (window as any).closeDetail = closeDetail;

      init();
    }

    return () => {
      // Cleanup on unmount
      const cesiumViewer = (window as any).__cesiumViewer;
      if (cesiumViewer) cesiumViewer.destroy();
    };
  }, []);

  return (
    <>
      <style>{`
        /* ============ RESET FOR MAP PAGE ============ */
        body { overflow: hidden !important; }
        main { overflow: hidden !important; }
        footer { display: none !important; }

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

        #cesium {
          position: fixed;
          inset: 0;
          z-index: 1;
        }

        .cesium-viewer-bottom, .cesium-viewer-toolbar, .cesium-viewer-animationContainer,
        .cesium-viewer-timelineContainer, .cesium-viewer-fullscreenContainer,
        .cesium-viewer-geocoderContainer, .cesium-viewer-vrContainer, .cesium-widget-credits,
        .cesium-viewer-selectionIndicatorContainer, .cesium-viewer-infoBoxContainer {
          display: none !important;
        }
        .cesium-widget canvas { outline: none; }

        .vignette {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 2;
          background: radial-gradient(ellipse at center, transparent 40%, rgba(10,14,18,0.4) 100%);
        }

        /* ============ TOP BAR ============ */
        .cc-topbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 10;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 28px;
          background: linear-gradient(180deg, rgba(10,14,18,0.95) 0%, rgba(10,14,18,0.7) 70%, rgba(10,14,18,0) 100%);
          pointer-events: none;
        }
        .cc-brand {
          display: flex;
          align-items: center;
          gap: 14px;
          pointer-events: auto;
        }
        .cc-brand-mark { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; }
        .cc-brand-mark svg { width: 100%; height: 100%; }
        .cc-brand-text { display: flex; flex-direction: column; line-height: 1; }
        .cc-brand-text .cc-title { font-family: 'Fraunces', serif; font-weight: 500; font-size: 20px; letter-spacing: -0.01em; color: #e8eaed; }
        .cc-brand-text .cc-subtitle { font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted); margin-top: 4px; }
        .cc-top-meta { display: flex; align-items: center; gap: 24px; pointer-events: auto; }
        .cc-meta-item { display: flex; flex-direction: column; align-items: flex-end; line-height: 1.1; }
        .cc-meta-item .cc-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.16em; color: var(--text-muted); margin-bottom: 3px; }
        .cc-meta-item .cc-value { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: var(--text); font-weight: 500; }
        .cc-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); display: inline-block; margin-right: 6px; box-shadow: 0 0 8px var(--success); animation: cc-pulse 2s infinite; }
        @keyframes cc-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

        /* ============ LEFT PANEL ============ */
        .cc-left-panel {
          position: fixed;
          top: 96px; left: 24px;
          width: 320px;
          max-height: calc(100vh - 180px);
          background: rgba(17, 22, 28, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--line);
          border-radius: 6px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .cc-panel-header { padding: 18px 20px 14px; border-bottom: 1px solid var(--line); }
        .cc-panel-eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--ochre); margin-bottom: 6px; }
        .cc-panel-title { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 400; letter-spacing: -0.01em; line-height: 1.1; color: var(--text); }
        .cc-panel-subtitle { font-size: 12px; color: var(--text-dim); margin-top: 8px; line-height: 1.5; }
        .cc-dest-list { overflow-y: auto; padding: 8px 0; flex: 1; min-height: 0; }
        .cc-dest-list::-webkit-scrollbar { width: 4px; }
        .cc-dest-list::-webkit-scrollbar-track { background: transparent; }
        .cc-dest-list::-webkit-scrollbar-thumb { background: var(--ink-4); border-radius: 2px; }
        .dest-item { display: flex; align-items: center; gap: 14px; padding: 12px 20px; cursor: pointer; border-left: 2px solid transparent; transition: all 0.2s ease; }
        .dest-item:hover { background: rgba(255,255,255,0.03); border-left-color: var(--ocean); }
        .dest-item.active { background: rgba(45,125,125,0.12); border-left-color: var(--ocean-2); }
        .dest-num { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-muted); min-width: 28px; letter-spacing: 0.05em; }
        .dest-info { flex: 1; min-width: 0; }
        .dest-name { font-size: 13px; font-weight: 500; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text); }
        .dest-state { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
        .dest-tag { font-family: 'JetBrains Mono', monospace; font-size: 8px; text-transform: uppercase; letter-spacing: 0.12em; padding: 3px 6px; border-radius: 2px; white-space: nowrap; }
        .tag-infra { background: rgba(77,179,179,0.15); color: #4db3b3; }
        .tag-mixed { background: rgba(212,162,76,0.15); color: #d4a24c; }
        .tag-tourism { background: rgba(138,168,118,0.15); color: #8aa876; }
        .tag-realestate { background: rgba(201,106,63,0.15); color: #c96a3f; }

        /* ============ DETAIL PANEL ============ */
        .cc-detail-panel {
          position: fixed;
          top: 96px; right: 24px;
          width: 340px;
          max-height: calc(100vh - 180px);
          background: rgba(17, 22, 28, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--line);
          border-radius: 6px;
          z-index: 5;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          transform: translateX(380px);
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .cc-detail-panel.open { transform: translateX(0); }
        .detail-hero { height: 80px; position: relative; border-radius: 6px 6px 0 0; overflow: hidden; flex-shrink: 0; background: linear-gradient(135deg, rgba(45,125,125,0.2) 0%, #11161c 100%); }
        .detail-hero-pattern { position: absolute; inset: 0; opacity: 0.15; background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 8px); }
        .detail-close { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: rgba(0,0,0,0.4); border: 1px solid var(--line-2); color: var(--text); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.2s; }
        .detail-close:hover { background: rgba(0,0,0,0.7); border-color: var(--text); }
        .detail-coords { position: absolute; bottom: 14px; left: 18px; font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.7); letter-spacing: 0.08em; }
        .detail-body { padding: 20px; overflow-y: auto; flex: 1; }
        .detail-body::-webkit-scrollbar { width: 4px; }
        .detail-body::-webkit-scrollbar-track { background: transparent; }
        .detail-body::-webkit-scrollbar-thumb { background: var(--ink-4); border-radius: 2px; }
        .detail-state { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--ochre); text-transform: uppercase; letter-spacing: 0.18em; margin-bottom: 6px; }
        .detail-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 400; line-height: 1.15; letter-spacing: -0.015em; margin-bottom: 14px; color: var(--text); }
        .detail-desc { font-size: 13px; line-height: 1.6; color: var(--text-dim); margin-bottom: 20px; }
        .detail-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
        .stat-cell { background: var(--ink-2); padding: 12px 14px; }
        .stat-label { font-family: 'JetBrains Mono', monospace; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-muted); margin-bottom: 4px; }
        .stat-value { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 500; color: var(--text); }
        .stat-value .unit { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 400; color: var(--text-muted); margin-left: 3px; }
        .detail-section { margin-bottom: 18px; }
        .section-head { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted); margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--line); }
        .feature-list { list-style: none; }
        .feature-list li { font-size: 12.5px; padding: 5px 0; color: var(--text-dim); display: flex; align-items: flex-start; gap: 8px; }
        .feature-list li::before { content: ''; width: 4px; height: 4px; background: var(--ocean-2); border-radius: 50%; margin-top: 7px; flex-shrink: 0; }
        .action-row { display: flex; gap: 8px; margin-top: 20px; }
        .btn { flex: 1; padding: 10px 14px; border-radius: 3px; font-family: 'Inter Tight', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s; border: 1px solid transparent; text-transform: uppercase; letter-spacing: 0.08em; }
        .btn-primary { background: var(--laterite); color: var(--text); }
        .btn-primary:hover { background: var(--laterite-2); }
        .btn-secondary { background: transparent; border-color: var(--line-2); color: var(--text); }
        .btn-secondary:hover { background: var(--ink-3); border-color: var(--text); }

        /* ============ CONTROL BAR ============ */
        .cc-control-bar {
          position: fixed;
          bottom: 24px; left: 50%;
          transform: translateX(-50%);
          z-index: 5;
          background: rgba(17, 22, 28, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--line);
          border-radius: 50px;
          padding: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .ctrl-btn { background: transparent; border: none; color: var(--text-dim); padding: 10px 18px; font-family: 'Inter Tight', sans-serif; font-size: 12px; font-weight: 500; cursor: pointer; border-radius: 40px; display: flex; align-items: center; gap: 8px; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.06em; }
        .ctrl-btn:hover { color: var(--text); background: rgba(255,255,255,0.05); }
        .ctrl-btn.active { color: var(--text); background: var(--ocean); }
        .ctrl-divider { width: 1px; height: 20px; background: var(--line); margin: 0 4px; }
        .ctrl-btn svg { width: 14px; height: 14px; }

        /* ============ LAYERS PANEL ============ */
        .cc-layers-panel {
          position: fixed;
          bottom: 96px; left: 50%;
          transform: translateX(-50%);
          width: 240px;
          background: rgba(17, 22, 28, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--line);
          border-radius: 6px;
          z-index: 5;
          padding: 14px 16px;
          display: none;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .cc-layers-panel.open { display: block; }
        .layers-head { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted); margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--line); }
        .layer-toggle { display: flex; align-items: center; justify-content: space-between; padding: 6px 0; cursor: pointer; font-size: 12.5px; color: var(--text-dim); }
        .layer-toggle:hover { color: var(--text); }
        .toggle { width: 30px; height: 16px; border-radius: 10px; background: var(--ink-4); position: relative; transition: all 0.2s; }
        .toggle::after { content: ''; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; background: var(--text-dim); border-radius: 50%; transition: all 0.2s; }
        .toggle.on { background: var(--ocean); }
        .toggle.on::after { left: 16px; background: var(--text); }

        /* ============ LEGEND ============ */
        .cc-legend {
          position: fixed;
          bottom: 96px; right: 24px;
          background: rgba(17, 22, 28, 0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--line);
          border-radius: 6px;
          z-index: 5;
          padding: 12px 14px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .legend-title { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; color: var(--text-muted); margin-bottom: 8px; }
        .legend-row { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 11px; color: var(--text-dim); }
        .legend-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* ============ LOADING ============ */
        .cc-loading {
          position: fixed;
          inset: 0;
          background: var(--ink);
          z-index: 100;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          transition: opacity 0.6s ease;
        }
        .cc-loading.hide { opacity: 0; pointer-events: none; }
        .loading-mark { width: 60px; height: 60px; animation: cc-spin 2s linear infinite; }
        @keyframes cc-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .loading-text { font-family: 'Fraunces', serif; font-size: 18px; color: var(--text); letter-spacing: -0.01em; }
        .loading-sub { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.2em; }

        /* ============ PLOT TOAST ============ */
        .cc-plot-toast {
          position: fixed;
          top: 96px; left: 50%;
          transform: translateX(-50%) translateY(-30px);
          background: rgba(17, 22, 28, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--laterite);
          border-radius: 4px;
          padding: 14px 20px;
          z-index: 8;
          display: flex;
          align-items: center;
          gap: 20px;
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .cc-plot-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
        .plot-toast-icon { width: 32px; height: 32px; background: var(--laterite); border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .plot-toast-content { display: flex; flex-direction: column; }
        .plot-toast-label { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: var(--laterite-2); text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 3px; }
        .plot-toast-title { font-family: 'Fraunces', serif; font-size: 15px; color: var(--text); }

        /* ============ RESPONSIVE ============ */
        @media (max-width: 900px) {
          .cc-left-panel { width: 260px; top: 88px; left: 12px; max-height: 40vh; }
          .cc-detail-panel { width: calc(100vw - 24px); right: 12px; top: auto; bottom: 90px; max-height: 45vh; }
          .cc-legend { display: none; }
          .cc-layers-panel { left: 12px; bottom: 86px; transform: none; }
          .cc-topbar { padding: 14px 18px; }
          .cc-brand-text .cc-title { font-size: 16px; }
          .cc-top-meta { gap: 14px; }
        }
      `}</style>

      {/* Loading screen */}
      <div className="cc-loading" id="cesium-loading">
        <svg className="loading-mark" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="26" stroke="#2d7d7d" strokeWidth="1" opacity="0.3" />
          <circle cx="30" cy="30" r="26" stroke="#4db3b3" strokeWidth="2" strokeDasharray="40 163" strokeLinecap="round" />
          <circle cx="30" cy="8" r="3" fill="#d4a24c" />
          <circle cx="52" cy="30" r="3" fill="#c96a3f" />
        </svg>
        <div className="loading-text">Loading corridor geometry</div>
        <div className="loading-sub">Streaming satellite imagery · Nigeria</div>
      </div>

      {/* Cesium viewer container */}
      <div id="cesium" />
      <div className="vignette" />

      {/* Top bar */}
      <div className="cc-topbar">
        <div className="cc-brand">
          <div className="cc-brand-mark">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="M4 28 Q 10 22, 16 26 T 28 24 T 36 20" stroke="#4db3b3" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M4 32 Q 12 28, 20 30 T 36 26" stroke="#c96a3f" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
              <circle cx="6" cy="28" r="2.5" fill="#d4a24c" />
              <circle cx="36" cy="20" r="2.5" fill="#d4a24c" />
              <circle cx="20" cy="27" r="1.8" fill="#e8eaed" />
            </svg>
          </div>
          <div className="cc-brand-text">
            <div className="cc-title">Coastal Corridor</div>
            <div className="cc-subtitle">Lagos ⟶ Calabar · 3D Terrain v0.3</div>
          </div>
        </div>
        <div className="cc-top-meta">
          <div className="cc-meta-item">
            <div className="cc-label"><span className="cc-live-dot" />Session</div>
            <div className="cc-value" id="cesium-clock">—</div>
          </div>
          <div className="cc-meta-item">
            <div className="cc-label">Corridor Length</div>
            <div className="cc-value">700.3 km</div>
          </div>
          <div className="cc-meta-item">
            <div className="cc-label">Destinations</div>
            <div className="cc-value" id="destCount">12</div>
          </div>
        </div>
      </div>

      {/* Left panel */}
      <div className="cc-left-panel">
        <div className="cc-panel-header">
          <div className="cc-panel-eyebrow">§01 · Navigation</div>
          <div className="cc-panel-title">Destinations along corridor</div>
          <div className="cc-panel-subtitle">Click a destination to focus the camera, inspect the site, and preview the real estate overlay on real satellite terrain.</div>
        </div>
        <div className="cc-dest-list" id="destList" />
      </div>

      {/* Detail panel */}
      <div className="cc-detail-panel" id="detailPanel">
        <div className="detail-hero" id="detailHero">
          <div className="detail-hero-pattern" />
          <button className="detail-close" onClick={() => (window as any).closeDetail()}>×</button>
          <div className="detail-coords" id="detailCoords">—</div>
        </div>
        <div className="detail-body">
          <div className="detail-state" id="detailState">—</div>
          <div className="detail-name" id="detailName">—</div>
          <div className="detail-desc" id="detailDesc">—</div>
          <div className="detail-stats" id="detailStats" />
          <div className="detail-section">
            <div className="section-head">Platform Features Active</div>
            <ul className="feature-list" id="detailFeatures" />
          </div>
          <div className="action-row">
            <button className="btn btn-primary" onClick={() => (window as any).showPlotsHere()}>Inspect Plots</button>
            <button className="btn btn-secondary" onClick={() => (window as any).closeDetail()}>Close</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="cc-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-row"><div className="legend-dot" style={{ background: '#8aa876' }} />Tourism Asset</div>
        <div className="legend-row"><div className="legend-dot" style={{ background: '#c96a3f' }} />Real Estate Zone</div>
        <div className="legend-row"><div className="legend-dot" style={{ background: '#d4a24c' }} />Mixed Use</div>
        <div className="legend-row"><div className="legend-dot" style={{ background: '#4db3b3' }} />Infrastructure</div>
      </div>

      {/* Layers panel */}
      <div className="cc-layers-panel" id="layersPanel">
        <div className="layers-head">Layer Control</div>
        <div className="layer-toggle" onClick={(e) => (window as any).toggleLayer(e.currentTarget, 'destinations')}>
          <span>Destinations</span>
          <div className="toggle on" />
        </div>
        <div className="layer-toggle" onClick={(e) => (window as any).toggleLayer(e.currentTarget, 'route')}>
          <span>Highway Route</span>
          <div className="toggle on" />
        </div>
        <div className="layer-toggle" onClick={(e) => (window as any).toggleLayer(e.currentTarget, 'plots')}>
          <span>Real Estate Plots</span>
          <div className="toggle" />
        </div>
        <div className="layer-toggle" onClick={(e) => (window as any).toggleLayer(e.currentTarget, 'labels')}>
          <span>Place Labels</span>
          <div className="toggle on" />
        </div>
      </div>

      {/* Control bar */}
      <div className="cc-control-bar">
        <button className="ctrl-btn" onClick={() => (window as any).cameraOverview()}>
          <svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" /><path d="M1 7 L13 7 M7 1 L7 13" stroke="currentColor" strokeWidth="1" /></svg>
          Overview
        </button>
        <button className="ctrl-btn" id="flyBtn" onClick={() => (window as any).flyCorridor()}>
          <svg viewBox="0 0 14 14" fill="none"><path d="M2 7 L12 2 L10 7 L12 12 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" /></svg>
          Fly Corridor
        </button>
        <div className="ctrl-divider" />
        <button className="ctrl-btn" id="layerBtn" onClick={() => (window as any).toggleLayersPanel()}>
          <svg viewBox="0 0 14 14" fill="none"><path d="M7 1 L13 4 L7 7 L1 4 Z M1 7 L7 10 L13 7 M1 10 L7 13 L13 10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinejoin="round" /></svg>
          Layers
        </button>
        <button className="ctrl-btn" id="timeBtn" onClick={() => (window as any).cycleTime()}>
          <svg viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" /><path d="M7 3.5 L7 7 L9.5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          <span id="timeLabel">Midday</span>
        </button>
        <button className="ctrl-btn" id="bldgBtn" onClick={() => (window as any).toggleBuildings()}>
          <svg viewBox="0 0 14 14" fill="none"><rect x="2" y="6" width="3" height="7" stroke="currentColor" strokeWidth="1.3" fill="none" /><rect x="6" y="3" width="3" height="10" stroke="currentColor" strokeWidth="1.3" fill="none" /><rect x="10" y="8" width="3" height="5" stroke="currentColor" strokeWidth="1.3" fill="none" /></svg>
          Buildings
        </button>
      </div>

      {/* Plot toast */}
      <div className="cc-plot-toast" id="plotToast">
        <div className="plot-toast-icon">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="12" height="12" stroke="white" strokeWidth="1.5" fill="none" />
            <line x1="2" y1="8" x2="14" y2="8" stroke="white" strokeWidth="1" />
            <line x1="8" y1="2" x2="8" y2="14" stroke="white" strokeWidth="1" />
          </svg>
        </div>
        <div className="plot-toast-content">
          <div className="plot-toast-label" id="toastLabel">Cadastral layer · 24 plots loaded</div>
          <div className="plot-toast-title" id="toastTitle">Click any plot footprint on the globe</div>
        </div>
      </div>
    </>
  );
}
