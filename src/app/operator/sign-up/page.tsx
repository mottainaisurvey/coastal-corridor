'use client';

import { SignUp } from '@clerk/nextjs';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, Compass } from 'lucide-react';

const OPERATOR_PERKS = [
  'List your tours, guesthouses, and experiences to diaspora travellers',
  'Reach international visitors planning corridor trips from the UK, US, and UAE',
  'Verified operator badge — builds trust with first-time visitors',
  'Booking and inquiry management dashboard',
  'Commission-based model — no upfront listing fees',
  'State tourism board partnership and co-marketing opportunities',
];

export default function OperatorSignUpPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-ink text-paper flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(212,162,76,0.35) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(45,125,125,0.2) 0%, transparent 55%)'
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(245,241,234,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,234,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          <div className="flex items-center justify-between mb-auto">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-sm bg-paper/10 border border-paper/20 flex items-center justify-center">
                <span className="text-paper font-serif text-[12px] font-light">CC</span>
              </div>
              <div>
                <div className="font-serif text-[16px] font-light leading-none">Coastal Corridor</div>
                <div className="font-mono text-[9px] uppercase tracking-micro text-paper/50 mt-0.5">Operator Marketplace</div>
              </div>
            </Link>
            <Link href="/professional" className="flex items-center gap-1.5 text-paper/50 hover:text-paper/80 transition-colors text-[13px]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>

          <div className="my-12">
            <div className="font-mono text-[11px] uppercase tracking-micro text-gold mb-5">
              Operator Application
            </div>
            <h1 className="font-serif text-[40px] xl:text-[50px] font-light leading-[1.0] tracking-tightest mb-6">
              Connect your experiences to the corridor&apos;s travellers.
            </h1>
            <p className="text-[15px] text-paper/60 leading-relaxed max-w-md mb-8">
              Register as an operator on the Coastal Corridor tourism marketplace. Our team will verify your business credentials within 48 hours and activate your listing portal.
            </p>

            <div className="space-y-3">
              {OPERATOR_PERKS.map((perk) => (
                <div key={perk} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-gold flex-shrink-0" />
                  <span className="text-[14px] text-paper/70">{perk}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-paper/10 pt-6">
            <p className="text-[12px] text-paper/35">
              Already registered?{' '}
              <Link href="/operator/sign-in" className="text-gold hover:text-gold/80 transition-colors">
                Sign in to your operator portal
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk Sign-Up ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/professional" className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-[13px] mb-4 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Professional categories
          </Link>
          <div className="font-serif text-[20px] font-light">Operator Application</div>
          <p className="text-[13px] text-ink/50 mt-2">Verified within 48 hours.</p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-micro bg-gold/10 text-gold border border-gold/20 px-3 py-1.5 rounded-sm">
              <Compass className="h-3 w-3" />
              Operator Account
            </span>
          </div>

          <SignUp
            routing="path"
            path="/operator/sign-up"
            signInUrl="/operator/sign-in"
            afterSignUpUrl="/operator/dashboard"
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
                formFieldInput: 'border border-ink/20 rounded-sm bg-white focus:border-gold focus:ring-2 focus:ring-gold/15 text-[14px] text-ink',
                formButtonPrimary: 'bg-gold hover:bg-gold/80 text-paper font-sans text-[13px] uppercase tracking-[0.08em] rounded-sm',
                footerActionLink: 'text-gold hover:text-gold/80 font-sans text-[13px]',
                formFieldSuccessText: 'text-success text-[12px]',
                formFieldErrorText: 'text-alert text-[12px]',
              },
              layout: {
                socialButtonsPlacement: 'top',
                showOptionalFields: false,
              },
            }}
          />

          <p className="text-center text-[11px] text-ink/40 mt-6 font-mono uppercase tracking-micro">
            Regular user?{' '}
            <Link href="/sign-up" className="text-laterite hover:text-laterite-2 transition-colors">
              Create a buyer account instead
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
