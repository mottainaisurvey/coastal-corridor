import Link from 'next/link';
import { ArrowRight, Compass, Camera, Users } from 'lucide-react';
import { destinations } from '@/lib/mock/destinations';
import { DestinationCard } from '@/components/destination-card';

export const metadata = {
  title: 'Tourism · Coastal Corridor',
  description: 'Explore tourism destinations along the Lagos-Calabar Coastal Highway'
};

export default function TourismPage() {
  const tourismDestinations = destinations.filter((d) => d.type === 'TOURISM');

  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-x py-24 md:py-32">
          <div className="eyebrow-on-dark mb-6">Tourism · Coming Q3 2026</div>
          <h1 className="font-serif text-[48px] md:text-[72px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-8">
            The corridor isn&apos;t just for investors.
            <span className="italic text-ocean-2 block">It&apos;s for returnees.</span>
          </h1>
          <p className="text-[18px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl font-light mb-10">
            245km of Ibeno beach. The Obudu rainforest. The Calabar Carnival. Tinapa&apos;s marina. The Epe waterfront.
            We&apos;re building an operator marketplace that connects diaspora families, international travellers,
            and domestic tourists to the hosts, guides and experiences along the corridor.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/destinations" className="btn-primary">
              Browse destinations
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/for-operators" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              For operators & hosts
            </Link>
          </div>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: Compass,
              title: 'Curated experiences',
              desc: 'Hand-selected hosts and guides, vetted for quality and safety. No tourist traps, no hidden fees.'
            },
            {
              icon: Camera,
              title: 'VR previews',
              desc: 'Walk through hotels, tour routes and cultural sites in VR before you book. 360° capture across 41 sites.'
            },
            {
              icon: Users,
              title: 'Built for the diaspora',
              desc: 'Group booking for family reunions. Concierge for returnees. Flexible payment in GBP, USD, EUR or NGN.'
            }
          ].map((f, i) => (
            <div key={i} className="p-6 border border-ink/10 rounded-lg bg-white">
              <div className="h-11 w-11 rounded-full bg-ocean/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-ocean" />
              </div>
              <h3 className="font-serif text-[20px] font-medium tracking-display mb-2">{f.title}</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="eyebrow mb-3">§ Featured tourism destinations</div>
        <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-8">
          Four destinations, infinite itineraries
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tourismDestinations.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      </section>
    </>
  );
}
