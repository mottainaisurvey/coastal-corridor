'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle,
  MapPin,
  TrendingUp,
  Users,
  Shield,
  Star,
  BarChart3,
  Globe,
  Zap,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Globe,
    title: 'Diaspora Buyer Access',
    body: 'Connect directly with verified buyers in the UK, US, Canada, and across Europe actively seeking corridor properties.',
  },
  {
    icon: Shield,
    title: 'Verified Listing Infrastructure',
    body: 'Every plot you list is geo-tagged, title-checked, and displayed with verified documentation — buyers arrive pre-informed.',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    body: 'Track listing views, inquiry rates, and conversion funnels from your agent dashboard. Know exactly what is working.',
  },
  {
    icon: TrendingUp,
    title: 'Commission Transparency',
    body: 'Set your own rates. All commissions are disclosed upfront to buyers. No hidden fees, no surprises at close.',
  },
  {
    icon: Users,
    title: 'Developer Partnerships',
    body: 'Get matched with corridor developers looking for licensed agents to represent their projects at scale.',
  },
  {
    icon: Zap,
    title: 'Fast Onboarding',
    body: 'Upload your CAC registration, ESVARBON licence, and two references. Approval in 24–48 hours.',
  },
];

const STATS = [
  { value: '788 km', label: 'of verified coastline' },
  { value: '12', label: 'active destinations' },
  { value: '₦2.4B+', label: 'in listed inventory' },
  { value: '3,200+', label: 'registered buyers' },
];

const TESTIMONIALS = [
  {
    quote: 'Within three weeks of listing on Coastal Corridor, I closed two diaspora buyers on Epe plots. The verification system means they come ready to transact.',
    name: 'Funmi Adeyemi',
    title: 'Licensed Agent, Lagos',
    initials: 'FA',
  },
  {
    quote: 'The analytics dashboard alone is worth it. I can see exactly which listings are getting diaspora traffic and adjust my pricing accordingly.',
    name: 'Chukwuemeka Obi',
    title: 'Senior Agent, Abuja',
    initials: 'CO',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Apply & Verify', body: 'Submit your licence and CAC documents. Our team verifies credentials within 48 hours.' },
  { step: '02', title: 'List Your Properties', body: 'Upload plots with geo-coordinates, title documents, and pricing. We handle the display.' },
  { step: '03', title: 'Receive Qualified Inquiries', body: 'Buyers who contact you have already reviewed your verified documentation.' },
  { step: '04', title: 'Close & Earn', body: 'Manage transactions through the platform with full audit trails and commission tracking.' },
];

export default function AgentLandingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/agent/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="bg-paper text-ink min-h-screen">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-ink/8">
        <div className="container-x flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-sm bg-ink flex items-center justify-center">
              <span className="text-paper font-serif text-[11px] font-light">CC</span>
            </div>
            <div>
              <div className="font-serif text-[15px] font-light leading-none">Coastal Corridor</div>
              <div className="eyebrow text-[9px] mt-0.5">For Agents</div>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="btn-secondary !py-2 !px-4 !text-[12px]">
              Sign In
            </Link>
            <Link href="/agent/sign-up" className="btn-primary !py-2 !px-4 !text-[12px]">
              Join as Agent
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-ink text-paper pt-32 pb-24 md:pt-44 md:pb-36">
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: 'radial-gradient(circle at 15% 40%, rgba(45,125,125,0.4) 0%, transparent 55%), radial-gradient(circle at 85% 60%, rgba(201,106,63,0.3) 0%, transparent 55%)'
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(245,241,234,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,234,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="container-x relative z-10">
          <div className="max-w-3xl">
            <div className="eyebrow-on-dark mb-6 flex items-center gap-3">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              Agent Programme · Lagos–Calabar Corridor
            </div>
            <h1 className="font-serif text-[44px] md:text-[76px] leading-[0.95] tracking-tightest mb-8 font-light">
              Sell verified coastal
              <span className="block text-ocean-2 italic font-normal">real estate,</span>
              <span className="block">to the world.</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-paper/75 max-w-2xl leading-relaxed mb-10 font-light">
              Join Nigeria&apos;s most rigorous property platform. List verified plots along the 788 km Lagos–Calabar corridor and connect with diaspora buyers, institutional investors, and local developers — all through one trusted marketplace.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/agent/sign-up" className="btn-primary !py-3.5 !px-8 !text-[14px]">
                Apply to Join
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#how-it-works" className="btn-secondary !py-3.5 !px-8 !text-[14px] !border-paper/30 !text-paper hover:!bg-paper/10 hover:!border-paper/60">
                See How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-ink/95 text-paper border-t border-paper/10">
        <div className="container-x py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-paper/10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center md:px-8">
                <div className="font-serif text-[32px] md:text-[40px] font-light text-ocean-2 leading-none mb-1">{s.value}</div>
                <div className="eyebrow-on-dark">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFITS ── */}
      <section className="py-24 md:py-32">
        <div className="container-x">
          <div className="max-w-2xl mb-16">
            <div className="eyebrow mb-4">Why Agents Choose Coastal Corridor</div>
            <h2 className="font-serif text-[36px] md:text-[52px] font-light leading-tight tracking-display">
              The infrastructure serious agents have been waiting for.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-paper-2 rounded-lg p-7 border border-ink/6 hover:border-ink/15 transition-colors">
                <div className="w-10 h-10 rounded-sm bg-ocean/10 flex items-center justify-center mb-5">
                  <b.icon className="h-5 w-5 text-ocean" />
                </div>
                <h3 className="font-serif text-[20px] font-light mb-3">{b.title}</h3>
                <p className="text-[14px] text-ink/65 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 md:py-32 bg-ink text-paper">
        <div className="container-x">
          <div className="max-w-2xl mb-16">
            <div className="eyebrow-on-dark mb-4">Process</div>
            <h2 className="font-serif text-[36px] md:text-[52px] font-light leading-tight tracking-display">
              From application to first close in four steps.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-paper/10 -translate-x-4" />
                )}
                <div className="font-mono text-[11px] uppercase tracking-micro text-ocean-2 mb-4">{step.step}</div>
                <h3 className="font-serif text-[22px] font-light mb-3">{step.title}</h3>
                <p className="text-[14px] text-paper/65 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 md:py-32">
        <div className="container-x">
          <div className="eyebrow mb-12 text-center">Agent Voices</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-paper-2 rounded-lg p-8 border border-ink/8">
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-ochre text-ochre" />
                  ))}
                </div>
                <p className="text-[15px] text-ink/80 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-ocean/20 flex items-center justify-center">
                    <span className="font-mono text-[11px] text-ocean font-medium">{t.initials}</span>
                  </div>
                  <div>
                    <div className="font-sans text-[14px] font-medium">{t.name}</div>
                    <div className="eyebrow text-[10px]">{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── REQUIREMENTS ── */}
      <section className="py-20 bg-paper-2 border-y border-ink/8">
        <div className="container-x">
          <div className="max-w-3xl mx-auto text-center">
            <div className="eyebrow mb-4">Requirements</div>
            <h2 className="font-serif text-[32px] md:text-[44px] font-light mb-10 tracking-display">
              What you need to apply
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left max-w-xl mx-auto">
              {[
                'Valid ESVARBON licence (or state equivalent)',
                'CAC business registration (optional but preferred)',
                'Two professional references',
                'Government-issued ID for KYC verification',
                'Active listings or portfolio evidence',
                'Nigerian bank account for commission payouts',
              ].map((req) => (
                <div key={req} className="flex items-start gap-3">
                  <CheckCircle className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-[14px] text-ink/75">{req}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 md:py-32 bg-ink text-paper">
        <div className="container-x text-center">
          <div className="eyebrow-on-dark mb-6">Ready to Start?</div>
          <h2 className="font-serif text-[40px] md:text-[64px] font-light leading-tight tracking-tightest mb-8 max-w-3xl mx-auto">
            Join the agents building the corridor&apos;s most trusted marketplace.
          </h2>
          <p className="text-[16px] text-paper/65 mb-10 max-w-xl mx-auto">
            Applications are reviewed within 48 hours. Approved agents receive immediate access to the listing dashboard and buyer network.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/agent/sign-up" className="btn-primary !py-4 !px-10 !text-[14px]">
              Apply Now — It&apos;s Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="mailto:agents@coastalcorridor.africa" className="btn-secondary !py-4 !px-10 !text-[14px] !border-paper/30 !text-paper hover:!bg-paper/10 hover:!border-paper/60">
              Contact Agent Relations
            </Link>
          </div>
          <p className="text-[12px] text-paper/40 mt-6">No subscription fees. Commission-based only.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink border-t border-paper/10 py-8">
        <div className="container-x flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="eyebrow-on-dark">© 2026 Coastal Corridor · Lagos–Calabar</div>
          <div className="flex gap-6">
            <Link href="/" className="eyebrow-on-dark hover:text-paper/80 transition-colors">Main Platform</Link>
            <Link href="/sign-in" className="eyebrow-on-dark hover:text-paper/80 transition-colors">Sign In</Link>
            <Link href="mailto:agents@coastalcorridor.africa" className="eyebrow-on-dark hover:text-paper/80 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
