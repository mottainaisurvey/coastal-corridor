import Link from 'next/link';
import { ArrowLeft, ArrowRight, UserCheck, Building2, Compass, Home } from 'lucide-react';

export const metadata = {
  title: 'Professional Sign-Up · Coastal Corridor',
  description: 'Join Coastal Corridor as a professional — agent, developer, operator or host.'
};

const PROFESSIONAL_CATEGORIES = [
  {
    icon: UserCheck,
    label: 'Agent',
    subtitle: 'Real Estate Agent or Broker',
    description:
      'Licensed agents and brokers who list, market, and transact residential and commercial properties along the Lagos–Calabar corridor.',
    href: '/agent/sign-up',
    accent: 'text-laterite',
    border: 'hover:border-laterite/40',
    bg: 'hover:bg-laterite/4',
    iconBg: 'bg-laterite/10 border-laterite/20',
    iconColor: 'text-laterite',
  },
  {
    icon: Building2,
    label: 'Developer',
    subtitle: 'Property Development Company',
    description:
      'CAC-registered developers building residential, commercial, or mixed-use projects along the corridor. Showcase inventory to 3,200+ verified diaspora and domestic buyers.',
    href: '/developer/sign-up',
    accent: 'text-ocean',
    border: 'hover:border-ocean/40',
    bg: 'hover:bg-ocean/4',
    iconBg: 'bg-ocean/10 border-ocean/20',
    iconColor: 'text-ocean',
  },
  {
    icon: Compass,
    label: 'Operator',
    subtitle: 'Tourism & Experience Operator',
    description:
      'Guesthouses, boat tour companies, resort operators, cultural experience providers, and guide services. List your offerings on the corridor tourism marketplace.',
    href: '/operator/sign-up',
    accent: 'text-gold',
    border: 'hover:border-gold/40',
    bg: 'hover:bg-gold/4',
    iconBg: 'bg-gold/10 border-gold/20',
    iconColor: 'text-gold',
  },
  {
    icon: Home,
    label: 'Host',
    subtitle: 'Accommodation & Experience Host',
    description:
      'Individuals and small businesses hosting guests along the corridor — from Epe waterfront to Ibeno beach to Calabar. Offer rooms, homes, or local experiences to diaspora returnees and travellers.',
    href: '/host/sign-up',
    accent: 'text-success',
    border: 'hover:border-success/40',
    bg: 'hover:bg-success/4',
    iconBg: 'bg-success/10 border-success/20',
    iconColor: 'text-success',
  },
];

export default function ProfessionalPage() {
  return (
    <div className="min-h-screen bg-paper">

      {/* ── HEADER ── */}
      <div className="border-b border-ink/8 bg-white">
        <div className="container-x py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-ink flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div>
              <div className="font-serif text-[15px] font-light leading-none">Coastal Corridor</div>
              <div className="font-mono text-[9px] uppercase tracking-micro text-ink/40 mt-0.5">Lagos — Calabar</div>
            </div>
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-1.5 text-ink/50 hover:text-ink text-[13px] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign up
          </Link>
        </div>
      </div>

      {/* ── HERO ── */}
      <div className="container-x pt-16 pb-10 max-w-3xl">
        <div className="font-mono text-[11px] uppercase tracking-micro text-ocean mb-4">
          Professional registration
        </div>
        <h1 className="font-serif text-[38px] md:text-[52px] font-light leading-[1.02] tracking-tightest mb-5">
          What best describes
          <span className="italic text-laterite block">your role?</span>
        </h1>
        <p className="text-[16px] text-ink/60 leading-relaxed max-w-xl">
          Select your professional category below. Each portal is tailored to your workflow — with the right tools, dashboards, and verification process for your business.
        </p>
      </div>

      {/* ── CATEGORY CARDS ── */}
      <div className="container-x pb-20 max-w-3xl">
        <div className="grid md:grid-cols-2 gap-4">
          {PROFESSIONAL_CATEGORIES.map(({ icon: Icon, label, subtitle, description, href, border, bg, iconBg, iconColor }) => (
            <Link
              key={label}
              href={href}
              className={`group flex flex-col p-6 bg-white border-2 border-ink/10 rounded-lg transition-all duration-200 ${border} ${bg}`}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-11 h-11 rounded-sm border flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div>
                  <div className="font-serif text-[20px] font-medium tracking-display leading-none mb-1">
                    {label}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-micro text-ink/45">
                    {subtitle}
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-ink/65 leading-relaxed flex-1 mb-5">
                {description}
              </p>

              <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink/50 group-hover:text-ink transition-colors">
                Register as {label}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* ── BUYER ESCAPE LINK ── */}
        <div className="mt-10 pt-8 border-t border-ink/8 text-center">
          <p className="text-[13px] text-ink/50">
            Not a professional?{' '}
            <Link href="/sign-up" className="text-laterite hover:text-laterite-2 transition-colors">
              Create a buyer account instead
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
