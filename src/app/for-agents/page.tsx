import Link from 'next/link';
import {
  ArrowRight, Shield, TrendingUp, Users, Zap, Check, Smartphone,
  FileText, MessageSquare, DollarSign, Star
} from 'lucide-react';

export const metadata = {
  title: 'For Agents · Coastal Corridor',
  description: 'Join the Coastal Corridor platform — for ESVARBON-licensed real estate agents serving the Lagos-Calabar corridor'
};

export default function ForAgentsPage() {
  return (
    <>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(201,106,63,0.25) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(45,125,125,0.2) 0%, transparent 50%)'
          }} />
        </div>

        <div className="container-x relative z-10 py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6">For ESVARBON-licensed agents</div>
            <h1 className="font-serif text-[42px] md:text-[68px] leading-[1.02] tracking-tightest mb-6 font-light">
              Your licence works harder
              <span className="block italic text-laterite-2">on a verified platform.</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl mb-10 font-light">
              Diaspora buyers do not trust random WhatsApp agents. They trust verified platforms with licensed professionals.
              That&apos;s who we are. That&apos;s who you are. Let&apos;s introduce you to the buyers who want to transact properly.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="#apply" className="btn-primary">
                Apply to join
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#how" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
                See how it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============ WHY JOIN ============ */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            { stat: '62%', label: 'of leads come from diaspora buyers' },
            { stat: '₦18M', label: 'average commission per closed transaction' },
            { stat: '14 days', label: 'average time from inquiry to viewing' }
          ].map((s, i) => (
            <div key={i} className="p-8 bg-paper-2 rounded-lg border border-ink/8">
              <div className="font-serif text-[44px] md:text-[52px] font-medium tracking-tightest text-laterite leading-none mb-3">
                {s.stat}
              </div>
              <div className="text-[14px] text-ink/70 leading-relaxed">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="eyebrow mb-4">§ 01 · Why agents join</div>
        <h2 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light mb-10 max-w-3xl">
          The platform treats you like the professional you already are.
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              icon: TrendingUp,
              title: 'Leads that actually convert',
              desc: 'Every buyer on our platform has been pre-qualified — proof of funds, identity verification, realistic budget range. No time-wasters. No tyre-kickers.'
            },
            {
              icon: Shield,
              title: 'Listings that don\'t get disputed',
              desc: 'We verify titles, boundaries, and community consent before a listing goes live. The transactions that follow don\'t blow up.'
            },
            {
              icon: Users,
              title: 'Diaspora market access',
              desc: 'We have built routes to buyers in the UK, US, Canada, and UAE. You get access to this market directly — no international marketing budget required.'
            },
            {
              icon: DollarSign,
              title: 'Commission structure that works',
              desc: 'Platform fee is 15% of your commission — substantially below comparable international platforms. You keep 85% of what you earn.'
            },
            {
              icon: Smartphone,
              title: 'Tools built for Nigerian reality',
              desc: 'Mobile-first agent dashboard. Works on 3G. Document upload from phone. WhatsApp lead capture. Everything designed for how you actually work.'
            },
            {
              icon: Zap,
              title: 'Fast payouts',
              desc: 'Commission settlement within 72 hours of confirmed transaction close. Direct bank transfer or USDC if you prefer stable-currency settlement.'
            }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg hover:border-ink/20 transition-colors">
              <div className="h-11 w-11 rounded-full bg-laterite/10 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-laterite" />
              </div>
              <h3 className="font-serif text-[20px] font-medium tracking-display mb-2">{item.title}</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how" className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · How it works</div>
          <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-14 max-w-3xl">
            Four steps from application to your first verified listing.
          </h2>

          <div className="space-y-10">
            {[
              {
                n: '01',
                title: 'Apply in 10 minutes',
                desc: 'Submit your ESVARBON number, recent transactions, and regions covered. We verify your licence against the ESVARBON register within 24 hours.'
              },
              {
                n: '02',
                title: 'Verification call',
                desc: 'A 30-minute video call with our head of real estate. We cover platform expectations, our verification standards, and your focus areas. This is also where you ask questions.'
              },
              {
                n: '03',
                title: 'Onboarding and first listings',
                desc: 'We help you import your current inventory, verify the three most promising plots, and launch your agent profile. Typical onboarding takes 5-10 business days.'
              },
              {
                n: '04',
                title: 'Lead flow begins',
                desc: 'Qualified buyer inquiries arrive in your dashboard within the first week. You respond, schedule viewings, and transact through the platform escrow.'
              }
            ].map((step) => (
              <div key={step.n} className="grid md:grid-cols-[120px_1fr] gap-6 pb-8 border-b border-ink/10 last:border-0">
                <div className="font-serif text-[52px] md:text-[64px] font-light tracking-tightest text-laterite leading-none">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-serif text-[24px] font-medium tracking-display mb-3">{step.title}</h3>
                  <p className="text-[16px] text-ink/70 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ REQUIREMENTS ============ */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="eyebrow mb-4">§ 03 · What we require</div>
            <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-6">
              Professional standards, enforced.
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-6">
              We are not a listings aggregator. We are a verified professional marketplace.
              The quality of our agent network is the platform&apos;s most important asset.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed">
              If you meet these standards, we want to hear from you. If you don&apos;t yet, we can point you to the path.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { title: 'Active ESVARBON registration', desc: 'Current year registration, in good standing' },
              { title: 'Minimum 3 years active practice', desc: 'Or senior-supervised trainee under a registered firm' },
              { title: 'Track record of at least 10 closed transactions', desc: 'References may be requested' },
              { title: 'Professional indemnity insurance', desc: 'Minimum ₦25M cover; we can introduce brokers if needed' },
              { title: 'Working smartphone and laptop', desc: 'For the agent app and dashboard' },
              { title: 'Commitment to platform verification standards', desc: 'No listing goes live without full verification' }
            ].map((req, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-ink/10 rounded-sm">
                <div className="h-5 w-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-success" />
                </div>
                <div>
                  <div className="text-[14px] font-medium mb-0.5">{req.title}</div>
                  <div className="text-[12px] text-ink/60">{req.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ APPLY ============ */}
      <section id="apply" className="bg-ink text-paper py-20">
        <div className="container-x">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <div className="eyebrow-on-dark mb-4">§ 04 · Ready?</div>
              <h2 className="font-serif text-[36px] md:text-[48px] leading-tight tracking-tightest font-light mb-6">
                Apply to join
                <span className="italic text-laterite-2 block">the corridor network.</span>
              </h2>
              <p className="text-[16px] text-paper/70 leading-relaxed">
                We onboard cohorts of 10-15 agents per quarter to maintain quality. Current cohort closes at month-end.
              </p>
            </div>

            <form className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                className="w-full bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40"
              />
              <input
                type="email"
                placeholder="Email address"
                className="w-full bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40"
              />
              <input
                type="text"
                placeholder="ESVARBON registration number"
                className="w-full bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40"
              />
              <input
                type="tel"
                placeholder="Phone / WhatsApp"
                className="w-full bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40"
              />
              <textarea
                rows={3}
                placeholder="Regions you cover and a sentence about your practice"
                className="w-full bg-paper/5 border border-paper/15 rounded-sm px-4 py-3 text-paper placeholder:text-paper/40 outline-none focus:border-paper/40 resize-none"
              />
              <button type="button" className="btn-primary w-full !py-3">
                Submit application
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-[11px] text-paper/50 text-center">
                We respond to every application within 2 business days.
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
