import Link from 'next/link';
import { ArrowRight, Shield, Users, Map, Zap, Search, MapPin } from 'lucide-react';
import { destinations } from '@/lib/mock/destinations';
import { properties } from '@/lib/mock/properties';
import { PropertyCard } from '@/components/property-card';
import { DestinationCard } from '@/components/destination-card';
import { formatKobo } from '@/lib/utils';

const destinationTypeColors: Record<string, { bg: string; text: string }> = {
  'Infrastructure': { bg: 'bg-ocean/10', text: 'text-ocean' },
  'Real Estate': { bg: 'bg-laterite/10', text: 'text-laterite' },
  'Mixed Use': { bg: 'bg-ochre/10', text: 'text-ochre' },
  'Tourism': { bg: 'bg-sage/10', text: 'text-sage' },
};

const destinationTypeLabels: Record<string, string> = {
  'Infrastructure': 'Infrastructure',
  'Real Estate': 'Real Estate',
  'Mixed Use': 'Mixed Use',
  'Tourism': 'Tourism',
};

export default function HomePage() {
  const featuredProperties = properties.filter((p) => p.featured).slice(0, 3);
  const primaryDestinations = [destinations[1], destinations[2], destinations[4]]; // Lekki, Epe, Ondo
  const allDestinationsPreview = destinations.slice(0, 8);

  return (
    <>
      {/* ============= HERO ============= */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(77,179,179,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(201,106,63,0.25) 0%, transparent 50%)'
          }} />
        </div>

        <div className="container-x relative z-10 pt-20 pb-24 md:pt-32 md:pb-40">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6 flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              Live · 700.3 km of verified coastline · 12 destinations
            </div>

            <h1 className="font-serif text-[48px] md:text-[84px] leading-[0.95] tracking-tightest mb-8 font-light">
              The Lagos–Calabar Coastal Highway,
              <span className="block text-ocean-2 italic font-normal">rendered honestly.</span>
            </h1>

            <p className="text-[18px] md:text-[22px] text-paper/75 max-w-2xl leading-relaxed mb-12 font-light">
              Verified plots. Cleared titles. Mapped geography. Real agents. One platform connecting diaspora buyers, local developers, and the 700 kilometres of Nigeria&apos;s most ambitious infrastructure project.
            </p>

            {/* Search bar */}
            <div className="bg-paper rounded-lg p-2 flex flex-col sm:flex-row gap-2 shadow-panel max-w-3xl">
              <div className="flex-1 flex items-center gap-3 px-4 py-2">
                <Search className="h-4 w-4 text-ink/50 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search Lekki, Epe, plot IDs, developer names…"
                  className="w-full bg-transparent text-ink placeholder:text-ink/40 outline-none text-[15px]"
                  disabled
                />
              </div>
              <div className="hidden sm:block w-px bg-ink/10 my-2" />
              <div className="flex items-center gap-3 px-4 py-2">
                <MapPin className="h-4 w-4 text-ink/50 flex-shrink-0" />
                <select className="bg-transparent text-ink outline-none text-[14px] cursor-pointer">
                  <option>All 12 destinations</option>
                  {destinations.map((d) => (
                    <option key={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <Link href="/properties" className="btn-primary !rounded-md">
                Search
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Trust signals */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="font-serif text-[32px] font-medium tracking-display">8,790+</div>
                <div className="eyebrow-on-dark mt-1">Plots verified</div>
              </div>
              <div>
                <div className="font-serif text-[32px] font-medium tracking-display">62</div>
                <div className="eyebrow-on-dark mt-1">Licensed agents</div>
              </div>
              <div>
                <div className="font-serif text-[32px] font-medium tracking-display">₦2.4B</div>
                <div className="eyebrow-on-dark mt-1">In active listings</div>
              </div>
              <div>
                <div className="font-serif text-[32px] font-medium tracking-display">9</div>
                <div className="eyebrow-on-dark mt-1">States covered</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-paper to-transparent" />
      </section>

      {/* ============= VERIFICATION PROMISE ============= */}
      <section className="container-x py-24">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-start">
          <div>
            <div className="eyebrow mb-4">§ 01 · Why Coastal Corridor</div>
            <h2 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-6 font-light">
              Every listing, verified end-to-end.
              <span className="italic text-laterite"> Then shown honestly.</span>
            </h2>
            <p className="text-[17px] text-ink/70 leading-relaxed mb-10 font-light">
              Nigerian real estate has a trust problem. We solve it with a three-layer verification stack —
              title search, field visit, and continuous satellite monitoring — then we show you what we found, including the risks.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { icon: Shield, title: 'Title verified at source', desc: 'Every plot title is searched directly against the state land registry. Lagos LandWeb integration live; other states ongoing.' },
              { icon: Users, title: 'Physically visited', desc: 'Field officers visit every listing with GPS verification, community consultation notes, and time-stamped photography.' },
              { icon: Map, title: 'Continuously monitored', desc: 'Sentinel-2 satellite imagery runs change detection on every parcel — flagging encroachment, flooding, erosion, and new construction.' },
              { icon: Zap, title: 'Honestly rated', desc: 'We publish flood risk, dispute risk, and accessibility scores openly. No plot is sold as "perfect" unless it is.' }
            ].map((item, i) => (
              <div key={i} className="flex gap-5">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-ocean/10 flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-ocean" />
                </div>
                <div>
                  <h3 className="font-serif text-[19px] font-medium tracking-display mb-1.5">{item.title}</h3>
                  <p className="text-[14px] text-ink/60 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FEATURED PROPERTIES ============= */}
      <section className="bg-paper-2 py-24">
        <div className="container-x">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="eyebrow mb-3">§ 02 · Featured listings</div>
              <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light">
                Hand-selected. Fully verified.
              </h2>
            </div>
            <Link href="/properties" className="hidden md:flex items-center gap-2 text-sm font-medium text-ink hover:text-laterite transition-colors">
              View all 12 featured
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>

          <div className="mt-10 md:hidden text-center">
            <Link href="/properties" className="btn-secondary">
              View all properties
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============= THE CORRIDOR ============= */}
      <section className="container-x py-24">
        <div className="text-center mb-14 max-w-3xl mx-auto">
          <div className="eyebrow mb-4 justify-center">§ 03 · The corridor</div>
          <h2 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-6 font-light">
            Twelve destinations.
            <span className="block italic text-ocean">One spine.</span>
          </h2>
          <p className="text-[17px] text-ink/70 leading-relaxed font-light">
            The Lagos-Calabar Coastal Highway cuts across nine coastal states. Each destination on the corridor has distinct real estate economics, tourism potential, and investment dynamics. Explore them individually or as one continuous opportunity.
          </p>
        </div>

        {/* Featured destination */}
        <div className="mb-6">
          <DestinationCard destination={primaryDestinations[0]} featured />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <DestinationCard destination={primaryDestinations[1]} />
          <DestinationCard destination={primaryDestinations[2]} />
        </div>

        <div className="mt-10 text-center">
          <Link href="/destinations" className="btn-secondary">
            Explore all 12 destinations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ============= DIASPORA CTA ============= */}
      <section className="bg-ink text-paper py-24">
        <div className="container-x">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="eyebrow-on-dark mb-4">§ 04 · For the diaspora</div>
              <h2 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-6 font-light">
                Build at home,
                <span className="italic text-ocean-2 block">from anywhere.</span>
              </h2>
              <p className="text-[17px] text-paper/70 leading-relaxed mb-8 font-light">
                Diaspora buyers account for 68% of plot purchases in the Epe extension and 54% across the corridor. We&apos;re built around your workflow — virtual property tours in VR, video site visits on request, UK-resident legal counsel, and an escrow structure designed for cross-border payments in GBP, USD, EUR, or NGN.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link href="/diaspora" className="btn-primary">
                  Diaspora services
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/map" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
                  Open 3D map
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { v: '54%', l: 'Buyers from diaspora' },
                { v: '42', l: 'Countries served' },
                { v: '14 days', l: 'Avg. transaction close' },
                { v: '£/€/$/₦', l: 'Payment currencies' }
              ].map((s, i) => (
                <div key={i} className="p-6 border border-paper/10 rounded-lg">
                  <div className="font-serif text-[38px] font-medium tracking-display text-ocean-2">{s.v}</div>
                  <div className="eyebrow-on-dark mt-2">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============= CORRIDOR SPINE PREVIEW ============= */}
      <section className="container-x py-24">
        <div className="eyebrow mb-4">§ 05 · The corridor spine</div>
        <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-14 max-w-2xl">
          From Victoria Island to Calabar, in order.
        </h2>

        <div className="space-y-0 border-t border-ink/10">
          {destinations.map((d, i) => (
            <Link
              key={d.id}
              href={`/destinations/${d.slug}`}
              className="group flex items-center gap-6 py-5 border-b border-ink/10 hover:bg-ink/3 transition-colors -mx-5 px-5"
            >
              <div className="font-mono text-[11px] text-ink/40 w-8">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="w-16 font-mono text-[10px] text-ink/50 uppercase tracking-wider">
                KM {d.corridorKm}
              </div>
              <div className="flex-1">
                <div className="font-serif text-[20px] font-medium tracking-display leading-tight">
                  {d.name}
                </div>
                <div className="text-[13px] text-ink/60 mt-0.5">{d.tagline}</div>
              </div>
              <div className={`chip ${destinationTypeColors[d.type].bg} ${destinationTypeColors[d.type].text} hidden md:inline-flex`}>
                {destinationTypeLabels[d.type]}
              </div>
              <div className="text-[11px] font-mono text-ink/40 uppercase tracking-wider hidden md:block w-20 text-right">
                {d.state}
              </div>
              <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-ink group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
