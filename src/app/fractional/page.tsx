import Link from 'next/link';
import { ArrowRight, PieChart, TrendingUp, Shield, Users, Calendar, Check, AlertCircle } from 'lucide-react';
import { formatKobo } from '@/lib/utils';

export const metadata = {
  title: 'Fractional Ownership · Coastal Corridor',
  description: 'Own a fraction of corridor real estate from ₦2M — quarterly distributions, transparent exit mechanics'
};

// Sample fractional estates for demo
const fractionalEstates = [
  {
    id: 'epe-1',
    name: 'Epe Coastal Estate · Tranche B',
    destination: 'Epe Coastal Extension',
    totalValueKobo: 120000000000, // ₦1.2B
    sharesIssued: 600,
    sharesAvailable: 184,
    pricePerShareKobo: 200000000, // ₦2M
    projectedYield: 14.2,
    threeYearAppreciation: 68,
    lockup: '36 months',
    status: 'ACTIVE'
  },
  {
    id: 'ondo-resort',
    name: 'Ondo Beachfront Resort · Phase I',
    destination: 'Ondo Coastal Belt',
    totalValueKobo: 450000000000, // ₦4.5B
    sharesIssued: 900,
    sharesAvailable: 312,
    pricePerShareKobo: 500000000, // ₦5M
    projectedYield: 11.8,
    threeYearAppreciation: 94,
    lockup: '48 months',
    status: 'ACTIVE'
  },
  {
    id: 'lekki-mixed',
    name: 'Lekki Corridor Mixed-Use · Tower A',
    destination: 'Lekki Peninsula',
    totalValueKobo: 880000000000, // ₦8.8B
    sharesIssued: 1760,
    sharesAvailable: 44,
    pricePerShareKobo: 500000000,
    projectedYield: 9.6,
    threeYearAppreciation: 52,
    lockup: '60 months',
    status: 'NEARLY_FULL'
  },
  {
    id: 'tinapa',
    name: 'Tinapa Resort Residences · Block C',
    destination: 'Tinapa & Marina Resort',
    totalValueKobo: 240000000000,
    sharesIssued: 480,
    sharesAvailable: 480,
    pricePerShareKobo: 500000000,
    projectedYield: 13.4,
    threeYearAppreciation: 78,
    lockup: '36 months',
    status: 'OPENING'
  }
];

export default function FractionalPage() {
  return (
    <>
      {/* HERO */}
      <section className="bg-ink text-paper">
        <div className="container-x py-20 md:py-28">
          <div className="eyebrow-on-dark mb-6">Fractional ownership</div>
          <h1 className="font-serif text-[44px] md:text-[72px] leading-[1.02] tracking-tightest max-w-4xl mb-6 font-light">
            Corridor ownership,
            <span className="italic text-ochre block">from ₦2 million.</span>
          </h1>
          <p className="text-[17px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl mb-10 font-light">
            Most diaspora buyers cannot write a ₦200M cheque for a whole plot. Fewer want to. Fractional ownership
            lets you own a real, legally-structured share of a verified corridor estate — with quarterly distributions,
            transparent exit terms, and the same verification rigour as any full-plot purchase.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#estates" className="btn-primary">
              Browse open estates
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#how" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              How it works
            </Link>
          </div>
        </div>
      </section>

      {/* IMPORTANT DISCLOSURE — do not remove */}
      <section className="bg-ochre/10 border-b border-ochre/30">
        <div className="container-x py-5">
          <div className="flex items-start gap-3 max-w-5xl">
            <AlertCircle className="h-5 w-5 text-ochre flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-ink/80 leading-relaxed">
              <span className="font-semibold">Important.</span> Fractional real estate ownership is an investment. Values can fall as well as rise.
              Projected yields are estimates based on comparable assets, not guarantees. Before investing, read the full estate
              prospectus and consider taking independent financial advice.
              All Coastal Corridor fractional products are offered through our licensed Nigerian OpCo under SEC Nigeria and CBN frameworks.
            </p>
          </div>
        </div>
      </section>

      {/* THE THESIS */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="eyebrow mb-4">§ 01 · The idea</div>
            <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-6">
              Shared ownership of the most important Nigerian land of our generation.
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              The corridor produces an unusual investment profile: institutional-grade appreciation dynamics on
              assets that are still individually small enough to fractionalise cleanly. A ₦1.2B beachfront estate
              becomes 600 shares of ₦2M each. You own a real percentage of a real thing.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              Every fractional estate is a properly incorporated SPV under Nigerian law. Your share is a
              security interest in that SPV, with your name on the shareholders register. This is not a DAO
              token or a synthetic exposure — it is direct, legally-enforceable co-ownership.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed">
              Distributions flow quarterly from rental income where applicable. Appreciation realises on exit —
              either when the SPV sells the underlying asset, or when you sell your shares on the platform&apos;s
              secondary market after the lockup period.
            </p>
          </div>

          <div className="bg-paper-2 rounded-lg p-8 border border-ink/10">
            <div className="eyebrow mb-4">Quick snapshot</div>
            <dl className="space-y-4 text-[15px]">
              {[
                ['Minimum investment', '₦2,000,000'],
                ['Currency accepted', '₦, £, $, €, AED'],
                ['Distribution frequency', 'Quarterly'],
                ['Typical lockup', '36-60 months'],
                ['Management fee', '1.75% annually'],
                ['Performance carry', '15% above 8% hurdle'],
                ['Exit via', 'Asset sale or secondary market'],
                ['Minimum holdings per investor', 'No maximum'],
                ['Regulated under', 'SEC Nigeria · CBN FX'],
                ['Custody structure', 'Licensed Nigerian SPV per estate']
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-ink/8 pb-3">
                  <dt className="text-ink/60">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · How it works</div>
          <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-14 max-w-3xl">
            Five steps from investment to exit.
          </h2>

          <div className="grid md:grid-cols-5 gap-6">
            {[
              { n: '01', title: 'Browse', desc: 'Review open estates with full prospectus, asset photography, and verification documentation.' },
              { n: '02', title: 'Commit', desc: 'Choose your share allocation. Complete KYC. Sign the SPV subscription agreement digitally.' },
              { n: '03', title: 'Fund', desc: 'Transfer via your preferred currency. CCI issued for all inbound foreign currency.' },
              { n: '04', title: 'Receive', desc: 'Your SPV shares are issued and registered. Quarterly distributions begin in the following cycle.' },
              { n: '05', title: 'Exit', desc: 'After lockup, sell on the secondary market or wait for the SPV to exit the underlying asset.' }
            ].map((step) => (
              <div key={step.n} className="p-6 bg-white rounded-lg border border-ink/10">
                <div className="font-mono text-[10px] text-ochre uppercase tracking-wider mb-2">Step {step.n}</div>
                <h3 className="font-serif text-[22px] font-medium tracking-display mb-2">{step.title}</h3>
                <p className="text-[13px] text-ink/70 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OPEN ESTATES */}
      <section id="estates" className="container-x py-20">
        <div className="eyebrow mb-4">§ 03 · Open estates</div>
        <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-10">
          Four estates open now.
        </h2>

        <div className="space-y-5">
          {fractionalEstates.map((e) => {
            const soldPct = ((e.sharesIssued - e.sharesAvailable) / e.sharesIssued) * 100;
            return (
              <div key={e.id} className="bg-white border border-ink/10 rounded-lg overflow-hidden hover:shadow-card-hover transition-all">
                <div className="grid md:grid-cols-[1.2fr_1fr_auto] gap-6 p-6 items-center">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {e.status === 'ACTIVE' && <span className="chip bg-success/15 text-success">Open</span>}
                      {e.status === 'NEARLY_FULL' && <span className="chip bg-ochre/15 text-ochre">Nearly full</span>}
                      {e.status === 'OPENING' && <span className="chip bg-ocean/15 text-ocean-2">Opening soon</span>}
                      <span className="font-mono text-[10px] text-ink/50 uppercase tracking-wider">
                        {e.destination}
                      </span>
                    </div>
                    <h3 className="font-serif text-[22px] md:text-[26px] font-medium tracking-display leading-tight mb-3">
                      {e.name}
                    </h3>
                    <div className="text-[12px] text-ink/60 mb-3">
                      Total estate value: <span className="font-medium text-ink">{formatKobo(e.totalValueKobo)}</span>
                      {' · '}
                      {e.sharesIssued.toLocaleString()} shares issued
                    </div>
                    <div className="h-1.5 bg-ink/8 rounded-full overflow-hidden">
                      <div className="h-full bg-laterite" style={{ width: `${soldPct}%` }} />
                    </div>
                    <div className="text-[11px] text-ink/60 mt-2 font-mono">
                      {soldPct.toFixed(0)}% allocated · {e.sharesAvailable} shares remaining
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="stat-label mb-1">Per share</div>
                      <div className="font-serif text-[18px] font-medium">{formatKobo(e.pricePerShareKobo)}</div>
                    </div>
                    <div>
                      <div className="stat-label mb-1">Proj. yield</div>
                      <div className="font-serif text-[18px] font-medium text-ocean">{e.projectedYield}%</div>
                    </div>
                    <div>
                      <div className="stat-label mb-1">Lockup</div>
                      <div className="font-serif text-[18px] font-medium">{e.lockup}</div>
                    </div>
                  </div>

                  <button className="btn-primary whitespace-nowrap">
                    View prospectus
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* PROTECTIONS */}
      <section className="bg-ink text-paper py-20">
        <div className="container-x">
          <div className="eyebrow-on-dark mb-4">§ 04 · How we protect you</div>
          <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-tightest font-light mb-14 max-w-3xl">
            Fractional ownership fails when governance fails.
            <span className="italic text-ocean-2 block">Here&apos;s how ours doesn&apos;t.</span>
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: Shield,
                title: 'Independent SPV per estate',
                desc: 'Each estate sits in its own licensed Nigerian SPV. Bankruptcy of one estate cannot cascade into another. Platform insolvency cannot touch your share.'
              },
              {
                icon: Users,
                title: 'Independent trustee',
                desc: 'Every SPV has a qualified Nigerian trustee (law firm or licensed trust company) separate from the platform, protecting investor interests against platform conflict.'
              },
              {
                icon: PieChart,
                title: 'Transparent governance',
                desc: 'Quarterly reporting, annual audited financials, shareholder voting on material decisions. You own a share; you vote like a shareholder.'
              },
              {
                icon: Calendar,
                title: 'Defined exit mechanics',
                desc: 'Every estate has a documented exit strategy — target disposal window, valuation methodology, secondary market rules. No ambiguity at exit.'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 border border-paper/10 rounded-lg">
                <item.icon className="h-6 w-6 text-ocean-2 mb-4" />
                <h3 className="font-serif text-[20px] font-medium tracking-display mb-2">{item.title}</h3>
                <p className="text-[13px] text-paper/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-x py-20 text-center">
        <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-4 max-w-2xl mx-auto">
          Ready to review an estate prospectus?
        </h2>
        <p className="text-[15px] text-ink/70 max-w-xl mx-auto mb-8">
          Complete KYC to unlock full prospectus documents. KYC takes about 15 minutes and is a one-time
          process across all current and future estates.
        </p>
        <Link href="/account" className="btn-primary">
          Begin KYC
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
