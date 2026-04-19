import Link from 'next/link';
import {
  ArrowRight, Building2, BarChart3, Globe2, Sparkles, Check,
  Box, Users, Wallet, Layers
} from 'lucide-react';
import { developers } from '@/lib/mock/agents';

export const metadata = {
  title: 'For Developers · Coastal Corridor',
  description: 'Distribution and sales infrastructure for Nigerian real estate developers building along the Lagos-Calabar corridor'
};

export default function ForDevelopersPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(45,125,125,0.3) 0%, transparent 55%)'
          }} />
        </div>

        <div className="container-x relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6">For real estate developers</div>
            <h1 className="font-serif text-[42px] md:text-[68px] leading-[1.02] tracking-tightest mb-6 font-light">
              Your inventory deserves
              <span className="block italic text-ocean-2">the right buyers.</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl mb-10 font-light">
              You&apos;ve built the project. You&apos;ve priced it correctly. Now reach the 2.5 million diaspora Nigerians
              and the domestic high-net-worth network who actually buy — through one integrated platform that handles
              discovery, inquiry, verification, and transaction.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="#schedule" className="btn-primary">
                Schedule platform demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#pricing" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
                Pricing and terms
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ ECONOMIC CASE ============ */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          {[
            { v: '₦184B', l: 'Unit inventory on platform' },
            { v: '47', l: 'Developers partnered' },
            { v: '2.5M', l: 'Diaspora buyer reach' },
            { v: '72hrs', l: 'Avg unit showcase time' }
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
            <div className="eyebrow mb-4">§ 01 · The economic case</div>
            <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-6">
              Faster sales cycles.
              <span className="italic text-laterite"> Better-qualified buyers.</span>
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              Developers partnering with us close units an average of 38% faster than their direct sales
              channels. This is not marketing copy — it is because our platform pre-qualifies buyers before
              they reach you. Proof of funds, identity, realistic budget range, intended use.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              Our commission is 3-5% of transaction value depending on volume, substantially below the
              7-12% typical of traditional agent networks. You keep more. Your buyers pay less. Everyone
              moves faster.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed">
              Most importantly, we handle the friction layer: diaspora payment coordination, legal documentation,
              CCI processing, escrow orchestration. You stay focused on building.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Layers,
                title: 'Masterplan integration',
                desc: 'Upload your architect drawings and we render them as interactive 3D masterplans. Buyers walk the development before a brick is laid.'
              },
              {
                icon: BarChart3,
                title: 'Inventory analytics',
                desc: 'See which units attract the most interest, which price points convert, which buyer segments engage. Your pricing strategy gets smarter each quarter.'
              },
              {
                icon: Globe2,
                title: 'Diaspora distribution',
                desc: 'Your listings appear in the feeds of qualified UK, US, Canadian, and UAE buyers through our diaspora channels. No international marketing agency required.'
              },
              {
                icon: Wallet,
                title: 'Pre-sale collection',
                desc: 'Collect deposits on off-plan units through platform escrow. Funds release on construction milestones you define.'
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

      {/* ============ PARTNERS ============ */}
      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · Partnered developers</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-10">
            A short, serious partner list.
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {developers.map((dev) => (
              <div key={dev.id} className="p-6 bg-white border border-ink/10 rounded-lg">
                <div className="h-12 w-12 rounded-sm bg-ink-3 mb-4 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-paper" />
                </div>
                <h3 className="font-serif text-[20px] font-medium tracking-display mb-1">{dev.name}</h3>
                <div className="font-mono text-[10px] text-ink/50 uppercase tracking-wider mb-3">
                  Founded {dev.yearFounded} · CAC {dev.cacNumber}
                </div>
                <p className="text-[13px] text-ink/70 leading-relaxed mb-4">{dev.description}</p>
                <div className="flex gap-4 text-[11px] text-ink/60 pt-4 border-t border-ink/10">
                  <span>
                    <span className="font-serif text-[18px] text-ink font-medium">{dev.activeProjects}</span> active
                  </span>
                  <span>
                    <span className="font-serif text-[18px] text-ink font-medium">{dev.completedProjects}</span> completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section id="pricing" className="container-x py-20">
        <div className="eyebrow mb-4">§ 03 · Pricing and terms</div>
        <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-12 max-w-3xl">
          No listing fees. No retainers. We earn only when you close.
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              tier: 'Starter',
              projects: 'Up to 3 active projects',
              commission: '5%',
              highlight: false,
              features: [
                'Standard listing placement',
                'Agent network access',
                'Monthly performance report',
                'Email support'
              ]
            },
            {
              tier: 'Professional',
              projects: '4-10 active projects',
              commission: '4%',
              highlight: true,
              features: [
                'Priority listing placement',
                'Dedicated account manager',
                'Masterplan 3D integration',
                'Weekly performance reports',
                'Diaspora channel priority',
                'Pre-sale escrow workflow'
              ]
            },
            {
              tier: 'Enterprise',
              projects: '10+ active projects',
              commission: '3%',
              highlight: false,
              features: [
                'White-label listing pages',
                'Senior account manager',
                'Full API integration',
                'Custom analytics',
                'Government partnership support',
                'Institutional co-marketing'
              ]
            }
          ].map((p, i) => (
            <div
              key={i}
              className={`p-8 rounded-lg border-2 ${p.highlight ? 'border-laterite bg-white shadow-card-hover relative' : 'border-ink/10 bg-white'}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-8 bg-laterite text-paper px-3 py-1 rounded-sm font-mono text-[10px] uppercase tracking-wider">
                  Most common
                </div>
              )}
              <div className="eyebrow mb-2">{p.tier}</div>
              <div className="text-[12px] text-ink/60 mb-6">{p.projects}</div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-serif text-[54px] font-medium tracking-tightest leading-none">{p.commission}</span>
                  <span className="text-[14px] text-ink/60">commission</span>
                </div>
                <div className="text-[12px] text-ink/60 mt-2">on transaction value</div>
              </div>

              <ul className="space-y-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-ink/80">
                    <Check className="h-3.5 w-3.5 text-ocean flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="#schedule"
                className={p.highlight ? 'btn-primary w-full' : 'btn-secondary w-full'}
              >
                Request details
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ============ SCHEDULE ============ */}
      <section id="schedule" className="bg-ink text-paper py-20">
        <div className="container-x max-w-3xl">
          <div className="eyebrow-on-dark mb-4">§ 04 · Schedule a demo</div>
          <h2 className="font-serif text-[36px] md:text-[48px] leading-tight tracking-tightest font-light mb-6">
            Let us walk your team through it.
          </h2>
          <p className="text-[16px] text-paper/70 leading-relaxed mb-10">
            A one-hour call. Our head of developer partnerships walks through the platform with your sales team
            and addresses specific questions about your current inventory and workflow. No obligation.
          </p>

          <form className="grid md:grid-cols-2 gap-3">
            <input type="text" placeholder="Your name" className="bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40" />
            <input type="text" placeholder="Company name" className="bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40" />
            <input type="email" placeholder="Work email" className="bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40" />
            <input type="tel" placeholder="Phone" className="bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40" />
            <select className="md:col-span-2 bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper outline-none focus:border-paper/40">
              <option className="bg-ink">Active project count</option>
              <option className="bg-ink">1-3 projects</option>
              <option className="bg-ink">4-10 projects</option>
              <option className="bg-ink">10+ projects</option>
            </select>
            <textarea
              rows={3}
              placeholder="Where are your current developments?"
              className="md:col-span-2 bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40 resize-none"
            />
            <button type="button" className="btn-primary md:col-span-2 !py-3">
              Schedule demo
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
