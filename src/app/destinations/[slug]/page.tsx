import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, MapPin, Check } from 'lucide-react';
import { destinations, getDestinationBySlug } from '@/lib/mock/destinations';
import { getPropertiesByDestination } from '@/lib/mock/properties';
import { PropertyCard } from '@/components/property-card';
import { destinationTypeColors, destinationTypeLabels, formatCorridorKm } from '@/lib/utils';

export function generateStaticParams() {
  return destinations.map((d) => ({ slug: d.slug }));
}

export default function DestinationDetailPage({ params }: { params: { slug: string } }) {
  const destination = getDestinationBySlug(params.slug);
  if (!destination) notFound();

  const destProperties = getPropertiesByDestination(destination.id);
  const colors = destinationTypeColors[destination.type];
  const currentIdx = destinations.findIndex((d) => d.id === destination.id);
  const prevDest = currentIdx > 0 ? destinations[currentIdx - 1] : null;
  const nextDest = currentIdx < destinations.length - 1 ? destinations[currentIdx + 1] : null;

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative h-[60vh] min-h-[500px] overflow-hidden bg-ink">
        <Image
          src={destination.heroImage}
          alt={destination.name}
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />

        <div className="container-x relative z-10 h-full flex flex-col justify-end pb-14 text-paper">
          <div className="flex items-center gap-3 mb-4">
            <span className={`chip ${colors.bg} ${colors.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              {destinationTypeLabels[destination.type]}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-paper/70">
              {destination.state} State · KM {formatCorridorKm(destination.corridorKm).replace(' km', '')}
            </span>
          </div>
          <h1 className="font-serif text-[48px] md:text-[80px] leading-[0.98] tracking-tightest font-light mb-4 max-w-5xl">
            {destination.name}
          </h1>
          <p className="text-[18px] md:text-[22px] text-paper/80 max-w-3xl leading-relaxed font-light">
            {destination.tagline}
          </p>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="bg-ink-3 text-paper border-b border-paper/10">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 divide-x divide-paper/10">
          {destination.stats.map((s, i) => (
            <div key={i} className="py-7 px-5 text-center md:text-left first:pl-0">
              <div className="font-serif text-[28px] md:text-[34px] font-medium tracking-display">
                {s.value}
                {s.unit && <span className="font-mono text-[13px] text-paper/50 ml-1">{s.unit}</span>}
              </div>
              <div className="eyebrow-on-dark mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="container-x py-14">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* LEFT: Description + features */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="eyebrow mb-3">§ About</div>
              <p className="text-[17px] leading-relaxed text-ink/80">{destination.description}</p>
            </section>

            <section>
              <div className="eyebrow mb-4">§ Platform features active here</div>
              <div className="grid gap-3">
                {destination.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-white border border-ink/10 rounded-sm">
                    <div className="h-5 w-5 rounded-full bg-ocean/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-ocean" />
                    </div>
                    <span className="text-[14px] text-ink/80 leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Map section */}
            <section>
              <div className="eyebrow mb-4">§ Location</div>
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
                <div className="aspect-[16/9] bg-ink-3 relative">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${destination.longitude - 0.08},${destination.latitude - 0.06},${destination.longitude + 0.08},${destination.latitude + 0.06}&layer=mapnik&marker=${destination.latitude},${destination.longitude}`}
                    loading="lazy"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] text-ink/70">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono">
                      {destination.latitude.toFixed(4)}°N, {destination.longitude.toFixed(4)}°E
                    </span>
                  </div>
                  <Link href="/map" className="btn-secondary !py-2 !px-3 !text-[11px]">
                    Open 3D map
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT: Sidebar */}
          <aside>
            <div className="sticky top-24 space-y-4">
              <div className="bg-white border border-ink/10 rounded-lg p-6">
                <div className="stat-label mb-1">Active listings</div>
                <div className="font-serif text-[44px] font-medium tracking-tightest leading-none">
                  {destProperties.length}
                </div>
                <div className="text-[12px] text-ink/60 mt-2">verified properties in {destination.name}</div>

                <div className="mt-6 pt-6 border-t border-ink/10 space-y-3">
                  <Link href={`/properties?destination=${destination.id}`} className="btn-primary w-full">
                    Browse all listings
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/map" className="btn-secondary w-full">
                    Open in 3D map
                  </Link>
                </div>
              </div>

              <div className="bg-paper-2 border border-ink/10 rounded-lg p-5">
                <div className="stat-label mb-3">Key facts</div>
                <dl className="space-y-3 text-[13px]">
                  <div className="flex justify-between">
                    <dt className="text-ink/60">State</dt>
                    <dd className="font-medium">{destination.state}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/60">Distance from VI</dt>
                    <dd className="font-medium font-mono">{formatCorridorKm(destination.corridorKm)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/60">Type</dt>
                    <dd className="font-medium">{destinationTypeLabels[destination.type]}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/60">Coordinates</dt>
                    <dd className="font-medium font-mono text-[11px]">
                      {destination.latitude.toFixed(3)}, {destination.longitude.toFixed(3)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </div>

        {/* ===== PROPERTIES ===== */}
        {destProperties.length > 0 && (
          <section className="mt-20">
            <div className="eyebrow mb-3">§ Listings</div>
            <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-8">
              Available in {destination.name}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destProperties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}

        {/* ===== PREV / NEXT ===== */}
        <section className="mt-20 pt-10 border-t border-ink/10 grid md:grid-cols-2 gap-6">
          {prevDest ? (
            <Link href={`/destinations/${prevDest.slug}`} className="group flex items-start gap-4 p-5 rounded-lg hover:bg-ink/5 transition-colors">
              <ArrowLeft className="h-5 w-5 mt-1 text-ink/50 group-hover:text-ink group-hover:-translate-x-1 transition-all" />
              <div>
                <div className="eyebrow mb-1">Previous · KM {formatCorridorKm(prevDest.corridorKm).replace(' km', '')}</div>
                <div className="font-serif text-[22px] font-medium tracking-display group-hover:text-laterite transition-colors">
                  {prevDest.name}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {nextDest ? (
            <Link href={`/destinations/${nextDest.slug}`} className="group flex items-start gap-4 p-5 rounded-lg hover:bg-ink/5 transition-colors md:flex-row-reverse md:text-right">
              <ArrowRight className="h-5 w-5 mt-1 text-ink/50 group-hover:text-ink group-hover:translate-x-1 transition-all" />
              <div>
                <div className="eyebrow mb-1">Next · KM {formatCorridorKm(nextDest.corridorKm).replace(' km', '')}</div>
                <div className="font-serif text-[22px] font-medium tracking-display group-hover:text-laterite transition-colors">
                  {nextDest.name}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </section>
      </div>
    </>
  );
}
