import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { destinations } from '@/lib/mock/destinations';
import { DestinationCard } from '@/components/destination-card';
import { destinationTypeColors, destinationTypeLabels, formatCorridorKm } from '@/lib/utils';

export const metadata = {
  title: 'Destinations · Coastal Corridor',
  description: 'All 12 destinations along the Lagos-Calabar Coastal Highway'
};

export default function DestinationsPage() {
  const byType = {
    INFRASTRUCTURE: destinations.filter((d) => d.type === 'INFRASTRUCTURE'),
    REAL_ESTATE: destinations.filter((d) => d.type === 'REAL_ESTATE'),
    MIXED_USE: destinations.filter((d) => d.type === 'MIXED_USE'),
    TOURISM: destinations.filter((d) => d.type === 'TOURISM')
  };

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="container-x pt-14 pb-14">
        <div className="eyebrow mb-4">Destinations · 700.3 km · 9 states</div>
        <h1 className="font-serif text-[44px] md:text-[72px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-6">
          Twelve destinations along one corridor —
          <span className="italic text-ocean"> each with its own story.</span>
        </h1>
        <p className="text-[17px] md:text-[19px] text-ink/70 leading-relaxed max-w-2xl font-light">
          The Lagos-Calabar Coastal Highway crosses nine states and touches seventy-four distinct communities. We&apos;ve curated twelve primary destinations — the interchanges, coastal zones, and terminus cities where the platform&apos;s real estate and tourism activity concentrates.
        </p>
      </section>

      {/* ===== FEATURED: LEKKI ===== */}
      <section className="container-x pb-10">
        <DestinationCard destination={destinations[1]} featured />
      </section>

      {/* ===== BY TYPE ===== */}
      {Object.entries(byType).map(([type, dests]) => {
        if (dests.length === 0) return null;
        const colors = destinationTypeColors[type];
        return (
          <section key={type} className="container-x py-10">
            <div className="flex items-center gap-3 mb-6">
              <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
              <span className={`chip ${colors.bg} ${colors.text}`}>{destinationTypeLabels[type]}</span>
              <div className="flex-1 h-px bg-ink/10" />
              <span className="font-mono text-[11px] text-ink/50 uppercase tracking-wider">
                {dests.length} destinations
              </span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dests.map((d) => (
                <DestinationCard key={d.id} destination={d} />
              ))}
            </div>
          </section>
        );
      })}

      {/* ===== SPINE TABLE ===== */}
      <section className="container-x py-16">
        <div className="eyebrow mb-4">§ Full corridor spine</div>
        <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-10">
          All destinations, in geographic order
        </h2>

        <div className="border-t border-ink/10">
          {destinations.map((d, i) => {
            const colors = destinationTypeColors[d.type];
            return (
              <Link
                key={d.id}
                href={`/destinations/${d.slug}`}
                className="group flex items-center gap-6 py-5 border-b border-ink/10 hover:bg-ink/3 transition-colors -mx-5 px-5 sm:-mx-8 sm:px-8"
              >
                <div className="font-mono text-[11px] text-ink/40 w-8">{String(i + 1).padStart(2, '0')}</div>
                <div className="w-20 font-mono text-[10px] text-ink/50 uppercase tracking-wider">
                  KM {formatCorridorKm(d.corridorKm).replace(' km', '')}
                </div>
                <div className="flex-1">
                  <div className="font-serif text-[20px] font-medium tracking-display leading-tight">{d.name}</div>
                  <div className="text-[13px] text-ink/60 mt-0.5">{d.tagline}</div>
                </div>
                <div className={`chip ${colors.bg} ${colors.text} hidden md:inline-flex`}>
                  {destinationTypeLabels[d.type]}
                </div>
                <div className="text-[11px] font-mono text-ink/40 uppercase tracking-wider hidden md:block w-24 text-right">
                  {d.state}
                </div>
                <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-ink group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
