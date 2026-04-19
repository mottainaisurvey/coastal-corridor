import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Shield, Bed, Bath, Ruler, TrendingUp } from 'lucide-react';
import type { Property } from '@/lib/mock/types';
import { formatKobo, formatArea, propertyTypeLabels, titleStatusLabels } from '@/lib/utils';

export function PropertyCard({ property }: { property: Property }) {
  const titleInfo = titleStatusLabels[property.titleStatus];

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group block overflow-hidden rounded-lg bg-white shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5"
    >
      {/* Hero image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-ink-3">
        <Image
          src={property.heroImage}
          alt={property.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Top-left chips */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="chip bg-paper/95 text-ink">
            {propertyTypeLabels[property.type]}
          </span>
          {property.featured && (
            <span className="chip bg-laterite text-paper">Featured</span>
          )}
        </div>

        {/* Top-right verification */}
        {property.titleStatus === 'VERIFIED' && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-sm bg-ink/80 backdrop-blur px-2 py-1">
            <Shield className="h-3 w-3 text-success" />
            <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-paper">Verified</span>
          </div>
        )}

        {/* YoY ribbon */}
        {property.yoy && property.yoy > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-sm bg-ocean/90 backdrop-blur px-2 py-1">
            <TrendingUp className="h-3 w-3 text-paper" />
            <span className="font-mono text-[10px] font-semibold text-paper">+{property.yoy}% YoY</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-ink/60 text-[11px] mb-2">
          <MapPin className="h-3 w-3" />
          <span className="font-mono uppercase tracking-[0.1em]">
            {property.destinationName} · {property.state}
          </span>
        </div>

        <h3 className="font-serif text-[17px] font-medium leading-snug tracking-display mb-1 line-clamp-2">
          {property.title}
        </h3>

        <div className="font-mono text-[10px] text-ink/50 uppercase tracking-[0.12em] mb-3">
          Plot {property.plotId}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-[12px] text-ink/70 mb-4">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <Bed className="h-3.5 w-3.5" />
              {property.bedrooms}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="h-3.5 w-3.5" />
              {property.bathrooms}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" />
            {formatArea(property.areaSqm)}
          </span>
        </div>

        {/* Price & title status */}
        <div className="flex items-end justify-between pt-3 border-t border-ink/8">
          <div>
            <div className="font-serif text-[20px] font-semibold tracking-display leading-none">
              {formatKobo(property.priceKobo)}
            </div>
            <div className="font-mono text-[10px] text-ink/50 mt-1">
              {formatKobo(property.pricePerSqmKobo)}/m²
            </div>
          </div>
          <div className={`text-[10px] font-mono uppercase tracking-[0.08em] ${titleInfo?.color || 'text-ink/60'}`}>
            {titleInfo?.label}
          </div>
        </div>
      </div>
    </Link>
  );
}
