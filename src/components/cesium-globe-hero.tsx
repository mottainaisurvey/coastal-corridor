'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

/* -----------------------------------------------------------------------
   CesiumGlobeHero
   Ambient auto-animating Cesium scene for the homepage.
   - No UI chrome (toolbar, sidebar, panels)
   - Slow automated corridor flyover (Lagos → Calabar sweep)
   - All controls disabled (no user interaction)
   - Listing pins glow softly in the background
   - "EXPLORE THE CORRIDOR" button links to /map
   ----------------------------------------------------------------------- */

const CESIUM_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYTc2YzI5My01NGYwLTQ3OTMtYWY0ZC1lOGIyZGQ3ZDU5YjkiLCJpZCI6MzA5NTQ2LCJpYXQiOjE3NDYwNTk1NTd9.3vy7CCQM5wVGNiSP5oLfLLQNfLQT6vBEfCB7Yq6IQWU';

// Corridor waypoints for the ambient flyover (Lagos → Calabar)
const FLYOVER_WAYPOINTS = [
  { lon: 3.3792, lat: 6.4550, alt: 180000, heading: 80, pitch: -35 },
  { lon: 3.9500, lat: 6.4800, alt: 120000, heading: 90, pitch: -30 },
  { lon: 4.8500, lat: 6.3500, alt: 150000, heading: 85, pitch: -32 },
  { lon: 5.8000, lat: 6.2000, alt: 130000, heading: 88, pitch: -28 },
  { lon: 6.8000, lat: 5.9000, alt: 160000, heading: 82, pitch: -33 },
  { lon: 7.8000, lat: 5.5000, alt: 140000, heading: 86, pitch: -30 },
  { lon: 8.5000, lat: 4.9500, alt: 120000, heading: 90, pitch: -28 },
  { lon: 8.3200, lat: 4.9500, alt: 100000, heading: 95, pitch: -25 },
];

// Listing pins (same as /map page)
const LISTING_PINS = [
  { lon: 3.5600, lat: 6.4350, label: '₦185M', type: 'APT', color: '#E8845A' },
  { lon: 3.9500, lat: 6.4800, label: '₦24M', type: 'LAND', color: '#8BC34A' },
  { lon: 3.4200, lat: 6.4400, label: '₦620M', type: 'HOUSE', color: '#4DB3B3' },
  { lon: 5.1500, lat: 6.2000, label: '₦204M', type: 'HOSP', color: '#9C27B0' },
  { lon: 8.3200, lat: 4.9500, label: '₦48M', type: 'HOUSE', color: '#4DB3B3' },
  { lon: 7.0100, lat: 4.8100, label: '₦180M', type: 'HOUSE', color: '#4DB3B3' },
  { lon: 3.5500, lat: 6.4300, label: '₦420M', type: 'COM', color: '#2196F3' },
  { lon: 7.9200, lat: 5.0500, label: '₦65M', type: 'HOUSE', color: '#4DB3B3' },
  { lon: 8.2800, lat: 4.9600, label: '₦28M', type: 'APT', color: '#E8845A' },
  { lon: 7.9800, lat: 4.5200, label: '₦95M', type: 'LAND', color: '#8BC34A' },
  { lon: 5.7500, lat: 5.5200, label: '₦42M', type: 'LAND', color: '#8BC34A' },
  { lon: 6.3300, lat: 4.9200, label: '₦11.2M', type: 'LAND', color: '#8BC34A' },
];

export function CesiumGlobeHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cesiumRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);
  const waypointRef = useRef(0);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    // Inject Cesium CSS if not already present
    if (!document.getElementById('cesium-css-hero')) {
      const link = document.createElement('link');
      link.id = 'cesium-css-hero';
      link.rel = 'stylesheet';
      link.href = 'https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }

    // Load Cesium JS if not already loaded
    const loadCesium = () => {
      return new Promise<void>((resolve) => {
        if ((window as any).Cesium) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://cesium.com/downloads/cesiumjs/releases/1.114/Build/Cesium/Cesium.js';
        script.onload = () => resolve();
        document.head.appendChild(script);
      });
    };

    loadCesium().then(() => {
      const Cesium = (window as any).Cesium;
      if (!containerRef.current) return;

      Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

      const viewer = new Cesium.Viewer(containerRef.current, {
        terrainProvider: Cesium.createWorldTerrain({ requestWaterMask: false }),
        imageryProvider: new Cesium.IonImageryProvider({ assetId: 2 }),
        animation: false,
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
        navigationHelpButton: false,
        navigationInstructionsInitiallyVisible: false,
        creditContainer: document.createElement('div'), // hide credits
      });

      cesiumRef.current = viewer;

      // Disable all user interaction
      viewer.scene.screenSpaceCameraController.enableRotate = false;
      viewer.scene.screenSpaceCameraController.enableTranslate = false;
      viewer.scene.screenSpaceCameraController.enableZoom = false;
      viewer.scene.screenSpaceCameraController.enableTilt = false;
      viewer.scene.screenSpaceCameraController.enableLook = false;

      // Enable 3D terrain
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.depthTestAgainstTerrain = true;

      // Set midday sun
      viewer.scene.light = new Cesium.DirectionalLight({
        direction: Cesium.Cartesian3.fromDegrees(6.0, 30.0, 1000000),
        intensity: 2.0,
      });

      // Add listing pins as glowing billboards
      LISTING_PINS.forEach((pin) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 80;
        const ctx = canvas.getContext('2d')!;

        // Glow
        const grd = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
        grd.addColorStop(0, pin.color + 'CC');
        grd.addColorStop(1, pin.color + '00');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();

        // Pin circle
        ctx.beginPath();
        ctx.arc(32, 32, 14, 0, Math.PI * 2);
        ctx.fillStyle = pin.color;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Pin stem
        ctx.beginPath();
        ctx.moveTo(32, 46);
        ctx.lineTo(32, 68);
        ctx.strokeStyle = pin.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Type label
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pin.type, 32, 32);

        viewer.entities.add({
          position: Cesium.Cartesian3.fromDegrees(pin.lon, pin.lat, 50),
          billboard: {
            image: canvas.toDataURL(),
            width: 48,
            height: 60,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: pin.label,
            font: '11px monospace',
            fillColor: Cesium.Color.WHITE,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -68),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            backgroundColor: new Cesium.Color(0, 0, 0, 0.6),
            backgroundPadding: new Cesium.Cartesian2(6, 3),
            showBackground: true,
          },
        });
      });

      // Draw corridor route line
      const routePositions = FLYOVER_WAYPOINTS.map((w) =>
        Cesium.Cartesian3.fromDegrees(w.lon, w.lat, 500)
      );
      viewer.entities.add({
        polyline: {
          positions: routePositions,
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: Cesium.Color.fromCssColorString('#4DB3B3').withAlpha(0.7),
          }),
          clampToGround: false,
        },
      });

      // Start ambient flyover
      const wp = FLYOVER_WAYPOINTS[0];
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(wp.lon, wp.lat, wp.alt),
        orientation: {
          heading: Cesium.Math.toRadians(wp.heading),
          pitch: Cesium.Math.toRadians(wp.pitch),
          roll: 0,
        },
      });

      const flyToNextWaypoint = () => {
        waypointRef.current = (waypointRef.current + 1) % FLYOVER_WAYPOINTS.length;
        const next = FLYOVER_WAYPOINTS[waypointRef.current];
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(next.lon, next.lat, next.alt),
          orientation: {
            heading: Cesium.Math.toRadians(next.heading),
            pitch: Cesium.Math.toRadians(next.pitch),
            roll: 0,
          },
          duration: 8,
          complete: () => {
            setTimeout(flyToNextWaypoint, 2000);
          },
        });
      };

      setTimeout(flyToNextWaypoint, 3000);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (cesiumRef.current && !cesiumRef.current.isDestroyed()) {
        cesiumRef.current.destroy();
      }
    };
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ height: '70vh', minHeight: '480px', maxHeight: '720px' }}>
      {/* Cesium container */}
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />

      {/* Top fade from hero section */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, #0d1117, transparent)' }}
      />

      {/* Bottom fade into next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #f5f0e8, transparent)' }}
      />

      {/* Overlay label */}
      <div className="absolute top-6 left-8 pointer-events-none">
        <div className="text-[10px] font-mono tracking-widest text-white/60 uppercase">
          § Live · Discovery Globe
        </div>
        <div className="text-[13px] font-mono text-white/40 mt-0.5">
          700.3 km · 12 destinations · 12 active listings
        </div>
      </div>

      {/* EXPLORE button */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
        <Link
          href="/map"
          className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full text-white text-[13px] font-mono tracking-widest uppercase transition-all hover:scale-105"
          style={{
            background: 'rgba(77, 179, 179, 0.15)',
            border: '1px solid rgba(77, 179, 179, 0.5)',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 0 30px rgba(77, 179, 179, 0.2)',
          }}
        >
          <span style={{ fontSize: '16px' }}>⊕</span>
          Explore the Corridor
          <span style={{ fontSize: '14px' }}>→</span>
        </Link>
      </div>

      {/* Live pin count badge */}
      <div
        className="absolute top-6 right-8 pointer-events-none"
        style={{
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(77,179,179,0.3)',
          borderRadius: '6px',
          padding: '6px 12px',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#4DB3B3' }}
          />
          <span className="text-[11px] font-mono text-white/70 tracking-wider">12 LISTINGS LIVE</span>
        </div>
      </div>
    </section>
  );
}
