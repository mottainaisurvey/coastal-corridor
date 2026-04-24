'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { destinations as mockDestinations } from '@/lib/mock/destinations';
import { properties as mockProperties } from '@/lib/mock/properties';
import { destinationTypeColors, destinationTypeLabels, formatKobo, formatArea } from '@/lib/utils';
import { ArrowRight, Layers, X } from 'lucide-react';

interface MapDestination {
  id: string;
  name: string;
  slug: string;
  state: string;
  type: string;
  corridorKm: number;
  latitude: number;
  longitude: number;
  description: string;
}

interface MapProperty {
  id: string;
  title: string;
  slug: string;
  plotId: string;
  priceKobo: number;
  areaSqm: number;
  latitude: number;
  longitude: number;
  heroImage: string;
}

export default function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const [selectedDest, setSelectedDest] = useState<MapDestination | null>(null);
  const [selectedProp, setSelectedProp] = useState<MapProperty | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [liveDestinations, setLiveDestinations] = useState<MapDestination[]>([]);
  const [liveProperties, setLiveProperties] = useState<MapProperty[]>([]);
  const [counts, setCounts] = useState({ destinations: 12, listings: mockProperties.length });

  // Load live data on mount
  useEffect(() => {
    fetch('/api/map')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.destinations?.length) {
          setLiveDestinations(data.destinations);
          setCounts({ destinations: data.destinations.length, listings: data.properties?.length ?? 0 });
        }
        if (data?.properties?.length) setLiveProperties(data.properties);
      })
      .catch(() => {/* use mock */});
  }, []);

  const destinations: MapDestination[] = liveDestinations.length > 0
    ? liveDestinations
    : mockDestinations.map(d => ({ id: d.id, name: d.name, slug: d.slug, state: d.state, type: d.type, corridorKm: d.corridorKm, latitude: d.latitude, longitude: d.longitude, description: d.description }));

  const properties: MapProperty[] = liveProperties.length > 0
    ? liveProperties
    : mockProperties.map(p => ({ id: p.id, title: p.title, slug: p.slug, plotId: p.plotId, priceKobo: p.priceKobo, areaSqm: p.areaSqm, latitude: p.latitude, longitude: p.longitude, heroImage: p.heroImage }));

  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return;
    if (destinations.length === 0) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const maplibregl = (await import('maplibre-gl')).default;

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          sources: {
            'carto-dark': {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
                'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
              ],
              tileSize: 256,
              attribution: '© OSM · © CARTO'
            }
          },
          layers: [
            { id: 'bg', type: 'background', paint: { 'background-color': '#0a0e12' } },
            { id: 'basemap', type: 'raster', source: 'carto-dark', paint: { 'raster-opacity': 0.85 } }
          ]
        } as unknown as import('maplibre-gl').StyleSpecification,
        center: [5.8, 5.8],
        zoom: 5.4,
        pitch: 40,
        bearing: -10
      });

      mapRef.current = map;

      map.on('load', () => {
        // Route line
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: destinations.map((d) => [d.longitude, d.latitude])
            }
          }
        });

        map.addLayer({
          id: 'route-glow',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#d4a24c', 'line-width': 10, 'line-opacity': 0.2, 'line-blur': 4 }
        });

        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#d4a24c', 'line-width': 2.5, 'line-opacity': 0.9, 'line-dasharray': [2, 1.5] }
        });

        // Destination markers
        destinations.forEach((d) => {
          const typeColor: Record<string, string> = {
            INFRASTRUCTURE: '#4db3b3',
            MIXED_USE: '#d4a24c',
            REAL_ESTATE: '#c96a3f',
            TOURISM: '#8aa876'
          };
          const color = typeColor[d.type] ?? '#d4a24c';

          const el = document.createElement('div');
          el.className = 'corridor-pin cursor-pointer';
          el.innerHTML = `
            <div class="flex flex-col items-center" style="transform: translate(-50%, -100%)">
              <div style="width: 14px; height: 14px; border-radius: 50%; background: ${color}; border: 2px solid #fff; box-shadow: 0 0 0 2px rgba(10,14,18,0.6);"></div>
              <div style="margin-top:3px; font-family: 'Inter Tight', sans-serif; font-size: 10px; font-weight:500; color: #fff; background: rgba(10,14,18,0.85); padding: 2px 6px; border-radius: 3px; white-space: nowrap;">${d.name}</div>
            </div>
          `;
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            setSelectedDest(d);
            setSelectedProp(null);
            map.flyTo({ center: [d.longitude, d.latitude], zoom: 11, pitch: 55, duration: 2000 });
          });

          new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat([d.longitude, d.latitude])
            .addTo(map);
        });

        // Property markers
        if (showProperties) {
          properties.forEach((p) => {
            const el = document.createElement('div');
            el.innerHTML = `<div style="width: 10px; height: 10px; border-radius: 50%; background: #e08660; border: 1.5px solid #fff; box-shadow: 0 0 0 1px rgba(10,14,18,0.8); cursor: pointer; transform: translate(-50%, -50%);"></div>`;
            el.addEventListener('click', (e) => {
              e.stopPropagation();
              setSelectedProp(p);
              setSelectedDest(null);
              map.flyTo({ center: [p.longitude, p.latitude], zoom: 14, duration: 1800 });
            });

            new maplibregl.Marker({ element: el, anchor: 'center' })
              .setLngLat([p.longitude, p.latitude])
              .addTo(map);
          });
        }
      });

      cleanup = () => {
        map.remove();
        mapRef.current = null;
      };
    })();

    return () => { cleanup?.(); };
  }, [destinations, properties, showProperties]);

  return (
    <div className="h-[calc(100vh-64px)] relative bg-ink">
      {/* MapLibre CSS */}
      <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.css" />

      <div ref={mapContainer} className="absolute inset-0" />

      {/* Header */}
      <div className="absolute top-4 left-4 z-10 bg-ink/90 backdrop-blur border border-paper/10 rounded-lg px-4 py-3 text-paper">
        <div className="eyebrow-on-dark mb-1">3D Corridor Map</div>
        <div className="font-serif text-[18px] font-medium tracking-display leading-tight">
          Lagos ⟶ Calabar
        </div>
        <div className="font-mono text-[10px] text-paper/50 mt-1">
          700.3 km · {counts.destinations} destinations · {counts.listings} listings
        </div>
      </div>

      {/* Layers */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLayersOpen(!layersOpen)}
          className="bg-ink/90 backdrop-blur border border-paper/10 rounded-lg px-4 py-2.5 text-paper text-[12px] font-medium flex items-center gap-2 hover:border-paper/30 transition-colors"
        >
          <Layers className="h-3.5 w-3.5" />
          Layers
        </button>
        {layersOpen && (
          <div className="mt-2 bg-ink/95 backdrop-blur border border-paper/10 rounded-lg p-4 text-paper min-w-[200px]">
            <div className="eyebrow-on-dark mb-3">Map layers</div>
            <label className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox" checked={showProperties} onChange={(e) => setShowProperties(e.target.checked)} className="accent-ocean" />
              <span className="text-[13px]">Property listings</span>
            </label>
            <label className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-ocean" />
              <span className="text-[13px]">Destinations</span>
            </label>
            <label className="flex items-center gap-2 py-1.5 cursor-pointer">
              <input type="checkbox" defaultChecked className="accent-ocean" />
              <span className="text-[13px]">Corridor route</span>
            </label>
          </div>
        )}
      </div>

      {/* Destination detail */}
      {selectedDest && (
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[380px] z-10 bg-ink/95 backdrop-blur border border-paper/10 rounded-lg p-5 text-paper">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className={`chip ${(destinationTypeColors as Record<string, { bg: string; text: string }>)[selectedDest.type]?.bg ?? 'bg-ochre/15'} ${(destinationTypeColors as Record<string, { bg: string; text: string }>)[selectedDest.type]?.text ?? 'text-ochre'}`}>
                {(destinationTypeLabels as Record<string, string>)[selectedDest.type] ?? selectedDest.type}
              </span>
            </div>
            <button onClick={() => setSelectedDest(null)} className="text-paper/60 hover:text-paper">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h3 className="font-serif text-[24px] font-medium tracking-display mt-2 mb-1">{selectedDest.name}</h3>
          <div className="eyebrow-on-dark mb-3">{selectedDest.state} · KM {selectedDest.corridorKm}</div>
          <p className="text-[13px] text-paper/70 leading-relaxed mb-4 line-clamp-3">{selectedDest.description}</p>
          <Link href={`/destinations/${selectedDest.slug}`} className="btn-primary w-full">
            Open destination
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {/* Property detail */}
      {selectedProp && (
        <div className="absolute bottom-6 left-6 right-6 md:right-auto md:w-[380px] z-10 bg-ink/95 backdrop-blur border border-paper/10 rounded-lg overflow-hidden text-paper">
          <div className="aspect-[16/10] bg-ink-3 relative">
            <img src={selectedProp.heroImage} alt={selectedProp.title} className="absolute inset-0 w-full h-full object-cover" />
            <button onClick={() => setSelectedProp(null)} className="absolute top-2 right-2 bg-ink/80 rounded-full p-1.5 text-paper">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-4">
            <div className="eyebrow-on-dark mb-1">Plot {selectedProp.plotId}</div>
            <h3 className="font-serif text-[18px] font-medium tracking-display leading-tight mb-2 line-clamp-2">
              {selectedProp.title}
            </h3>
            <div className="flex items-center justify-between mb-3">
              <div className="font-serif text-[20px] font-medium">{formatKobo(selectedProp.priceKobo)}</div>
              <div className="text-[11px] font-mono text-paper/60">{formatArea(selectedProp.areaSqm)}</div>
            </div>
            <Link href={`/properties/${selectedProp.slug}`} className="btn-primary w-full !py-2 !text-[11px]">
              View property
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
