'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { Shield, MapPin, Users, TrendingUp } from 'lucide-react';

const VALUE_PROPS = [
  {
    icon: Shield,
    title: 'Verified Titles Only',
    body: 'Every plot on the platform has been title-checked and geo-verified. No guesswork.',
  },
  {
    icon: MapPin,
    title: '788 km of Coastline',
    body: 'Browse verified properties across 12 destinations from Lagos to Calabar.',
  },
  {
    icon: Users,
    title: 'Direct Agent Access',
    body: 'Connect with licensed, KYC-verified agents who know the corridor intimately.',
  },
  {
    icon: TrendingUp,
    title: 'Transparent Pricing',
    body: 'All prices, fees, and commissions disclosed upfront. No surprises at close.',
  },
];

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — Marketing ── */}
      <div className="hidden lg:flex lg:w-[52%] bg-ink text-paper flex-col relative overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(45,125,125,0.35) 0%, transparent 55%), radial-gradient(circle at 80% 75%, rgba(201,106,63,0.25) 0%, transparent 55%)'
        }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(245,241,234,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,234,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-auto">
            <div className="w-8 h-8 rounded-sm bg-paper/10 border border-paper/20 flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div>
              <div className="font-serif text-[16px] font-light leading-none">Coastal Corridor</div>
              <div className="font-mono text-[9px] uppercase tracking-micro text-paper/50 mt-0.5">Lagos — Calabar</div>
            </div>
          </Link>

          {/* Main copy */}
          <div className="my-12">
            <div className="font-mono text-[11px] uppercase tracking-micro text-ocean-2 mb-5">
              Join 3,200+ registered buyers
            </div>
            <h1 className="font-serif text-[42px] xl:text-[52px] font-light leading-[1.0] tracking-tightest mb-6">
              Nigeria&apos;s most verified coastal property marketplace.
            </h1>
            <p className="text-[16px] text-paper/65 leading-relaxed max-w-md">
              Create your free account to browse verified plots, save searches, contact agents directly, and track the Lagos–Calabar corridor&apos;s fastest-growing real estate market.
            </p>
          </div>

          {/* Value props */}
          <div className="grid grid-cols-1 gap-5 mb-12">
            {VALUE_PROPS.map((vp) => (
              <div key={vp.title} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-sm bg-paper/8 border border-paper/12 flex items-center justify-center flex-shrink-0">
                  <vp.icon className="h-4 w-4 text-ocean-2" />
                </div>
                <div>
                  <div className="font-sans text-[14px] font-medium text-paper mb-0.5">{vp.title}</div>
                  <div className="text-[13px] text-paper/55 leading-relaxed">{vp.body}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Corridor map hint */}
          <div className="border-t border-paper/10 pt-6">
            <div className="font-mono text-[10px] uppercase tracking-micro text-paper/40 mb-3">Active Destinations</div>
            <div className="flex flex-wrap gap-2">
              {['Lagos', 'Lekki', 'Epe', 'Ibeju-Lekki', 'Badagry', 'Ondo Coast', 'Edo', 'Delta', 'Bayelsa', 'Rivers', 'Akwa Ibom', 'Calabar'].map((d) => (
                <span key={d} className="font-mono text-[10px] uppercase tracking-micro text-paper/50 bg-paper/5 border border-paper/10 px-2 py-1 rounded-sm">
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk Sign-Up ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-paper px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-ink flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div className="font-serif text-[18px] font-light">Coastal Corridor</div>
          </Link>
          <p className="text-[13px] text-ink/55 mt-3 max-w-xs">
            Nigeria&apos;s verified coastal property marketplace — Lagos to Calabar.
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6 lg:hidden">
            <div className="font-mono text-[10px] uppercase tracking-micro text-ink/50 mb-3">What you get</div>
            <div className="grid grid-cols-2 gap-3">
              {VALUE_PROPS.map((vp) => (
                <div key={vp.title} className="flex items-center gap-2">
                  <vp.icon className="h-3.5 w-3.5 text-ocean flex-shrink-0" />
                  <span className="text-[12px] text-ink/70">{vp.title}</span>
                </div>
              ))}
            </div>
          </div>

          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent p-0 w-full',
                headerTitle: 'font-serif text-[26px] font-light text-ink tracking-display',
                headerSubtitle: 'text-[13px] text-ink/55',
                socialButtonsBlockButton: 'border border-ink/20 bg-white hover:bg-ink/4 text-ink font-sans text-[13px] rounded-sm',
                dividerLine: 'bg-ink/10',
                dividerText: 'font-mono text-[10px] uppercase tracking-micro text-ink/40',
                formFieldLabel: 'font-mono text-[10px] uppercase tracking-micro text-ink/60',
                formFieldInput: 'border border-ink/20 rounded-sm bg-white focus:border-laterite focus:ring-2 focus:ring-laterite/15 text-[14px] text-ink',
                formButtonPrimary: 'bg-laterite hover:bg-laterite-2 text-paper font-sans text-[13px] uppercase tracking-[0.08em] rounded-sm',
                footerActionLink: 'text-laterite hover:text-laterite-2 font-sans text-[13px]',
                identityPreviewText: 'text-[13px] text-ink/70',
                identityPreviewEditButton: 'text-laterite',
                formFieldSuccessText: 'text-success text-[12px]',
                formFieldErrorText: 'text-alert text-[12px]',
                alertText: 'text-[13px]',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              },
            }}
          />

          <p className="text-center text-[11px] text-ink/40 mt-6 font-mono uppercase tracking-micro">
            Are you an agent?{' '}
            <Link href="/agent/sign-up" className="text-ocean hover:text-ocean-2 transition-colors">
              Apply for agent access
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
