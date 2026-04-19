'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';

export function GalleryViewer({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const next = () => setActive((i) => (i + 1) % images.length);
  const prev = () => setActive((i) => (i - 1 + images.length) % images.length);

  return (
    <>
      <div className="container-x">
        <div className="grid md:grid-cols-4 gap-2 md:h-[460px] h-[300px]">
          {/* Hero image */}
          <div
            className="md:col-span-3 relative rounded-lg overflow-hidden bg-ink-3 cursor-pointer group"
            onClick={() => setLightboxOpen(true)}
          >
            <Image
              src={images[active]}
              alt={title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 75vw"
              className="object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxOpen(true);
              }}
              className="absolute top-4 right-4 bg-ink/80 backdrop-blur text-paper p-2 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Expand gallery"
            >
              <Expand className="h-4 w-4" />
            </button>
            <div className="absolute bottom-4 left-4 font-mono text-[11px] text-paper bg-ink/80 backdrop-blur px-2 py-1 rounded-sm">
              {active + 1} / {images.length}
            </div>
          </div>

          {/* Thumbnails */}
          <div className="hidden md:grid grid-rows-3 gap-2">
            {images.slice(1, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i + 1)}
                className={`relative rounded-lg overflow-hidden bg-ink-3 transition-all ${
                  active === i + 1 ? 'ring-2 ring-laterite' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <Image
                  src={img}
                  alt={`${title} image ${i + 2}`}
                  fill
                  sizes="25vw"
                  className="object-cover"
                />
                {i === 2 && images.length > 4 && (
                  <div className="absolute inset-0 bg-ink/70 flex items-center justify-center text-paper">
                    <div className="text-center">
                      <div className="font-serif text-[18px] font-medium">+{images.length - 4}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider">More</div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] bg-ink/95 flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 text-paper hover:text-laterite transition-colors"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>

          <button
            onClick={prev}
            className="absolute left-6 text-paper hover:text-laterite transition-colors p-3 bg-ink/60 rounded-full"
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative max-w-6xl max-h-[85vh] w-full h-full">
            <Image
              src={images[active]}
              alt={title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={next}
            className="absolute right-6 text-paper hover:text-laterite transition-colors p-3 bg-ink/60 rounded-full"
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[12px] text-paper bg-ink/60 px-3 py-1.5 rounded-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
