import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';
import type { Destination } from '@/lib/mock/types';
import { destinationTypeLabels, destinationTypeColors, formatCorridorKm } from '@/lib/utils';

export function DestinationCard({
  destination,
  featured = false
}: {
  destination: Destination;
  featured?: boolean;
}) {
  const colors = destinationTypeColors[destination.type];

  return (
    <Link
      href={`/destinations/${destination.slug}`}
      className={`group relative block overflow-hidden rounded-lg bg-ink text-paper shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5 ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src={destination.heroImage}
          alt={destination.name}
          fill
          sizes={featured ? '100vw' : '(max-width: 768px) 100vw, 50vw'}
          className="object-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
      </div>

      {/* Top metadata */}
      <div className="relative z-10 flex items-start justify-between p-5">
        <div className="flex items-center gap-2">
          <span className={`chip ${colors.bg} ${colors.text}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
            {destinationTypeLabels[destination.type]}
          </span>
        </div>
        <div className="text-right font-mono text-[10px] uppercase tracking-[0.15em] text-paper/60">
          KM {formatCorridorKm(destination.corridorKm).replace(' km', '')}
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-5">
        <div className="flex items-center gap-1.5 text-paper/70 text-[11px] mb-2">
          <MapPin className="h-3 w-3" />
          <span className="font-mono uppercase tracking-[0.12em]">{destination.state} State</span>
        </div>
        <h3 className={`font-serif font-medium tracking-display leading-tight mb-2 ${featured ? 'text-[32px]' : 'text-[22px]'}`}>
          {destination.name}
        </h3>
        {featured && <p className="text-paper/70 text-[14px] leading-relaxed mb-4 max-w-xl">{destination.tagline}</p>}
        <div className="flex items-center gap-2 text-[12px] font-medium text-paper/90 group-hover:text-ocean-2 transition-colors">
          Explore destination
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
