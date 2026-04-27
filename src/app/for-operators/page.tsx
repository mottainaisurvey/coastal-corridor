import Link from 'next/link';
import {
  ArrowRight, Compass, BarChart3, Globe2, Check,
  Users, Wallet, Star, MapPin, Calendar, Shield
} from 'lucide-react';

export const metadata = {
  title: 'For Operators & Hosts · Coastal Corridor',
  description: 'List your tourism experiences, guesthouses, and guided tours on the Lagos-Calabar corridor marketplace. Connect with diaspora returnees and international travellers.'
};

export default function ForOperatorsPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 70% 40%, rgba(180,120,60,0.35) 0%, transparent 55%)'
          }} />
        </div>

        <div className="container-x relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6">For operators &amp; hosts</div>
            <h1 className="font-serif text-[42px] md:text-[68px] leading-[1.02] tracking-tightest mb-6 font-light">
              The corridor is 700km
              <span className="block italic text-ocean-2">of untapped tourism.</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl mb-10 font-light">
              245km of Ibeno beach. The Obudu rainforest. The Calabar Carnival. Tinapa&apos;s marina.
              The Epe waterfront. We&apos;re building the marketplace that connects your experiences
              to diaspora families, international travellers, and domestic tourists — all in one place.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/operator/sign-up" className="btn-primary">
                Register as operator
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/host/sign-up" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
                Register as host
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { v: '700km', l: 'Of coastline to explore' },
            { v: '9', l: 'States on the corridor' },
            { v: '42', l: 'Countries our buyers come from' },
            { v: 'Q3 2026', l: 'Tourism marketplace launch' }
          ].map((s, i) => (
            <div key={i} className="p-6 bg-paper-2 rounded-lg border border-ink/8">
              <div className="font-serif text-[34px] md:text-[40px] font-medium tracking-tightest text-ocean leading-none mb-2">
                {s.v}
              </div>
              <div className="text-[12px] text-ink/60">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="eyebrow mb-4">§ 01 · Why list with us</div>
            <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-6">
              Your guests are already
              <span className="italic text-laterite"> looking for you.</span>
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              Diaspora Nigerians returning home, international travellers exploring West Africa,
              and domestic tourists discovering their own coastline — they are all on our platform
              searching for verified, quality experiences along the corridor.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              We handle the discovery layer: verified listings, multi-currency payments in GBP, USD,
              EUR, or NGN, and a direct booking flow that removes the friction between your experience
              and your guest&apos;s wallet.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed">
              Whether you run a beachfront guesthouse in Ibeno, a boat tour on the Epe waterfront,
              or a cultural experience in Calabar — your listing belongs on the corridor marketplace.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Globe2,
                title: 'Diaspora reach',
                desc: 'Your listings are shown to verified diaspora buyers and returnees across the UK, US, Canada, and UAE — people actively planning trips home.'
              },
              {
                icon: Calendar,
                title: 'Direct booking',
                desc: 'Guests book and pay directly through the platform. No third-party booking agents, no commission stacking. You keep more of every booking.'
              },
              {
                icon: Shield,
                title: 'Verified listing badge',
                desc: 'Every operator on the platform is vetted and verified. Your listing carries the Coastal Corridor trust badge — the most credible signal in corridor tourism.'
              },
              {
                icon: BarChart3,
                title: 'Booking analytics',
                desc: 'See where your guests come from, which experiences convert, and how your pricing compares. Your operation gets smarter each season.'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white border border-ink/10 rounded-lg">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-ocean/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-ocean" />
                </div>
                <div>
                  <h3 className="font-serif text-[18px] font-medium tracking-display mb-1">{item.title}</h3>
                  <p className="text-[13px] text-ink/70 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ WHO IS THIS FOR ============ */}
      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · Who can list</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-10">
            Two categories. One marketplace.
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Operators */}
            <div className="p-8 bg-white border border-ink/10 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-laterite/10 flex items-center justify-center mb-5">
                <Compass className="h-5 w-5 text-laterite" />
              </div>
              <div className="font-mono text-[10px] text-laterite uppercase tracking-wider mb-2">Operator</div>
              <h3 className="font-serif text-[26px] font-medium tracking-display mb-3">Tourism &amp; Experience Operator</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed mb-6">
                Businesses offering guided experiences, tours, and tourism services along the corridor.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Guesthouses and boutique resorts',
                  'Boat and river tour operators',
                  'Cultural experience providers',
                  'Safari and wildlife guides',
                  'Festival and event operators',
                  'Eco-tourism and nature guides'
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink/80">
                    <Check className="h-3.5 w-3.5 text-laterite flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/operator/sign-up" className="btn-primary w-full">
                Register as operator
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Hosts */}
            <div className="p-8 bg-white border border-ink/10 rounded-lg">
              <div className="h-12 w-12 rounded-full bg-ocean/10 flex items-center justify-center mb-5">
                <MapPin className="h-5 w-5 text-ocean" />
              </div>
              <div className="font-mono text-[10px] text-ocean uppercase tracking-wider mb-2">Host</div>
              <h3 className="font-serif text-[26px] font-medium tracking-display mb-3">Accommodation &amp; Experience Host</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed mb-6">
                Individuals and small businesses hosting guests — from a spare room to a beachfront home.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  'Private homes and apartments',
                  'Beachfront cottages and cabins',
                  'Farmstays and rural retreats',
                  'Local food and cooking experiences',
                  'Community and cultural tours',
                  'Fishing and waterfront activities'
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink/80">
                    <Check className="h-3.5 w-3.5 text-ocean flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href="/host/sign-up" className="btn-secondary w-full">
                Register as host
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ DESTINATIONS ============ */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ 03 · Key destinations</div>
        <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-12 max-w-3xl">
          Where your guests are going.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: 'Ibeno Beach',
              state: 'Akwa Ibom · KM 640',
              desc: 'One of Africa\'s longest unbroken beaches. 45km of Atlantic coastline with no development — yet.',
              type: 'Beach & coastal'
            },
            {
              name: 'Obudu Mountain Resort',
              state: 'Cross River · KM 690',
              desc: 'Nigeria\'s premier highland retreat. Cable cars, waterfalls, and a climate unlike anywhere else on the corridor.',
              type: 'Mountain & nature'
            },
            {
              name: 'Calabar Carnival',
              state: 'Cross River · KM 700',
              desc: 'Africa\'s biggest street party. December. 3 million visitors. The anchor event of the corridor calendar.',
              type: 'Culture & events'
            },
            {
              name: 'Tinapa Marina',
              state: 'Cross River · KM 695',
              desc: 'Waterfront leisure complex with marina, film studios, and resort infrastructure. Underutilised and ready.',
              type: 'Marina & leisure'
            },
            {
              name: 'Epe Waterfront',
              state: 'Lagos · KM 58',
              desc: 'Lagos\'s quieter waterfront. Fishing communities, boat rides, and the start of the coastal corridor experience.',
              type: 'Waterfront & fishing'
            },
            {
              name: 'Ondo Coastal Belt',
              state: 'Ondo · KM 210',
              desc: '74km of pristine Atlantic coastline. Undiscovered, undeveloped, and the next frontier for eco-tourism.',
              type: 'Eco-tourism'
            }
          ].map((d, i) => (
            <div key={i} className="p-6 bg-paper-2 border border-ink/8 rounded-lg">
              <div className="font-mono text-[10px] text-ink/50 uppercase tracking-wider mb-3">{d.type}</div>
              <h3 className="font-serif text-[20px] font-medium tracking-display mb-1">{d.name}</h3>
              <div className="font-mono text-[10px] text-ocean uppercase tracking-wider mb-3">{d.state}</div>
              <p className="text-[13px] text-ink/70 leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="bg-ink text-paper py-20">
        <div className="container-x max-w-3xl">
          <div className="eyebrow-on-dark mb-4">§ 04 · Get early access</div>
          <h2 className="font-serif text-[36px] md:text-[48px] leading-tight tracking-tightest font-light mb-6">
            The marketplace launches Q3 2026.
            <span className="block italic text-ocean-2">Early listings get priority placement.</span>
          </h2>
          <p className="text-[16px] text-paper/70 leading-relaxed mb-10">
            Register your operator or host account now to secure your place in the first cohort.
            Early partners receive priority listing placement, a dedicated onboarding call, and
            reduced commission rates for the first 12 months.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/operator/sign-up" className="btn-primary">
              Register as operator
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/host/sign-up" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              Register as host
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
