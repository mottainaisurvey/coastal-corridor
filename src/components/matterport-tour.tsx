'use client';

import { useState } from 'react';
import { Camera, ArrowRight, X, Maximize2 } from 'lucide-react';

interface MatterportTourProps {
  virtualTourUrl: string;
}

function extractSpaceId(url: string): string | null {
  // Handle full Matterport URLs: https://my.matterport.com/show/?m=SPACEID
  const showMatch = url.match(/[?&]m=([a-zA-Z0-9_-]+)/);
  if (showMatch) return showMatch[1];

  // Handle discover URLs: https://matterport.com/discover/space/SPACEID
  const discoverMatch = url.match(/\/space\/([a-zA-Z0-9_-]+)/);
  if (discoverMatch) return discoverMatch[1];

  // Handle direct space IDs (alphanumeric, 11+ chars)
  const directMatch = url.match(/^([a-zA-Z0-9_-]{8,})$/);
  if (directMatch) return directMatch[1];

  return null;
}

export function MatterportTour({ virtualTourUrl }: MatterportTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const spaceId = extractSpaceId(virtualTourUrl);

  // Build the embed URL — use the space ID if extractable, otherwise fall back to the original URL
  const embedUrl = spaceId
    ? `https://my.matterport.com/show/?m=${spaceId}&play=1&qs=1&applicationKey=uc2wmpu1yurgst5thmkrgue2a`
    : `${virtualTourUrl}${virtualTourUrl.includes('?') ? '&' : '?'}play=1`;

  return (
    <section>
      <h2 className="eyebrow mb-4">§ Virtual tour</h2>

      {!isOpen ? (
        /* Collapsed state — teaser card */
        <div className="bg-ink text-paper border border-ink rounded-lg p-8 flex items-center justify-between gap-6">
          <div>
            <Camera className="h-6 w-6 mb-3 text-ocean-2" />
            <h3 className="font-serif text-[22px] font-medium mb-2">Walk the property in 3D</h3>
            <p className="text-[14px] text-paper/70 max-w-md">
              Matterport scan captured on-site. Available for VR headsets (Meta Quest, Vision Pro) or desktop browser.
            </p>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="btn-primary shrink-0"
            aria-label="Launch Matterport 3D virtual tour"
          >
            LAUNCH TOUR
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        /* Expanded state — inline iframe embed */
        <div className="rounded-lg overflow-hidden border border-ink/20">
          {/* Toolbar */}
          <div className="bg-ink text-paper flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2 text-[13px] font-mono tracking-wide">
              <Camera className="h-4 w-4 text-ocean-2" />
              <span>3D VIRTUAL TOUR</span>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={virtualTourUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[12px] text-paper/60 hover:text-paper transition-colors"
                aria-label="Open tour in full screen"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">FULL SCREEN</span>
              </a>
              <button
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-1.5 text-[12px] text-paper/60 hover:text-paper transition-colors"
                aria-label="Close virtual tour"
              >
                <X className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">CLOSE</span>
              </button>
            </div>
          </div>

          {/* Matterport iframe */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 */ }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; web-share; xr-spatial-tracking"
              allowFullScreen
              title="Matterport 3D Virtual Tour"
              loading="lazy"
              style={{ border: 'none' }}
            />
          </div>

          {/* Footer note */}
          <div className="bg-ink/5 border-t border-ink/10 px-4 py-2.5 text-[12px] text-ink/50 font-mono">
            POWERED BY MATTERPORT · SCAN CAPTURED ON-SITE · AVAILABLE FOR VR HEADSETS
          </div>
        </div>
      )}
    </section>
  );
}
