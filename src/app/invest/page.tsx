import Link from 'next/link';
import { ArrowRight, TrendingUp, Shield, Globe, PieChart } from 'lucide-react';
import { properties } from '@/lib/mock/properties';
import { PropertyCard } from '@/components/property-card';

export const metadata = {
  title: 'Invest · Coastal Corridor',
  description: 'Corridor investment opportunities for diaspora buyers and institutional investors'
};

export default function InvestPage() {
  const topYoY = [...properties].sort((a, b) => (b.yoy || 0) - (a.yoy || 0)).slice(0, 3);

  return (
    <>
      <section className="container-x pt-14 pb-16">
        <div className="eyebrow mb-4">Invest · Corridor opportunities</div>
        <h1 className="font-serif text-[44px] md:text-[64px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-6">
          Infrastructure lifts land value.
          <span className="italic text-laterite block">Be early on 700km of it.</span>
        </h1>
        <p className="text-[18px] text-ink/70 leading-relaxed max-w-2xl font-light mb-10">
          The Lagos-Calabar Coastal Highway is the largest infrastructure project in Nigeria&apos;s history.
          Historic precedent — from the Lagos-Ibadan expressway to the Lekki-Epe extension —
          shows that corridor-adjacent land appreciates 250-400% in the 3-5 years around construction completion.
        </p>

        <div className="grid md:grid-cols-4 gap-4 mb-12">
          {[
            { v: '₦2.4B', l: 'Active listings value' },
            { v: '+22%', l: 'Avg corridor YoY' },
            { v: '68%', l: 'Diaspora buyers (Epe)' },
            { v: '14d', l: 'Avg transaction close' }
          ].map((s, i) => (
            <div key={i} className="p-6 border border-ink/10 rounded-lg bg-paper-2">
              <div className="font-serif text-[32px] font-medium tracking-tightest text-laterite">{s.v}</div>
              <div className="eyebrow mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="eyebrow mb-3">§ The thesis</div>
            <h2 className="font-serif text-[32px] md:text-[42px] leading-tight tracking-display font-light mb-6">
              Infrastructure adjacency is a repeatable playbook
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              The Lekki-Epe axis quadrupled in 2014-2019 as the first phase of the coastal road opened.
              Plots bought at ₦8,000/sqm in 2014 routinely cleared ₦180,000/sqm by 2022. Early entrants
              captured 18-22× returns; late entrants captured 3-5×.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              The pattern is not mysterious. Infrastructure delivery creates access, access creates demand,
              demand creates price discovery. We are mid-cycle on the Lagos-Calabar extension — ahead of
              mass awareness, behind the construction start. The window matters.
            </p>
            <Link href="/properties?sort=yoy" className="btn-primary mt-4">
              See highest-appreciating plots
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: TrendingUp,
                title: 'Segmented market data',
                desc: 'Price-per-sqm across 12 destinations, updated quarterly. Compare historical trajectories, forecast models, and absorption rates.'
              },
              {
                icon: Shield,
                title: 'Verified underwriting',
                desc: 'Every investment plot has been through our three-layer verification. Flood risk, dispute risk and title integrity scored openly.'
              },
              {
                icon: Globe,
                title: 'Diaspora-native rails',
                desc: 'Pay in GBP, USD, EUR or NGN through licensed FX partners. CBN-compliant Certificate of Capital Importation issued for every inbound transfer.'
              },
              {
                icon: PieChart,
                title: 'Fractional ownership',
                desc: '6 estates currently available for fractional entry from ₦2M. Quarterly distributions, secondary market matching, clean exit mechanics.'
              }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-5 border border-ink/10 rounded-lg bg-white">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-laterite/10 flex items-center justify-center">
                  <item.icon className="h-4 w-4 text-laterite" />
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

      <section className="container-x py-16">
        <div className="eyebrow mb-3">§ Highest-appreciating listings</div>
        <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-8">
          Where the YoY is strongest right now
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topYoY.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      <section className="bg-ink text-paper py-20">
        <div className="container-x text-center">
          <div className="eyebrow-on-dark mb-4 justify-center">For institutional investors</div>
          <h2 className="font-serif text-[32px] md:text-[44px] leading-tight tracking-display font-light mb-4 max-w-3xl mx-auto">
            Looking at allocation beyond single plots?
          </h2>
          <p className="text-[16px] text-paper/70 leading-relaxed max-w-2xl mx-auto mb-8">
            Coastal Corridor operates fund-style vehicles for institutional capital targeting corridor
            real estate, infrastructure adjacency, and hospitality development. Minimums from £500K.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="btn-primary">
              Request data room access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/about" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              About the team
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
