'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function SignInPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-ink text-paper flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 25% 35%, rgba(45,125,125,0.3) 0%, transparent 55%), radial-gradient(circle at 75% 70%, rgba(201,106,63,0.2) 0%, transparent 55%)'
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(245,241,234,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,234,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px'
        }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          <Link href="/" className="flex items-center gap-3 mb-auto">
            <div className="w-8 h-8 rounded-sm bg-paper/10 border border-paper/20 flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div>
              <div className="font-serif text-[16px] font-light leading-none">Coastal Corridor</div>
              <div className="font-mono text-[9px] uppercase tracking-micro text-paper/50 mt-0.5">Lagos — Calabar</div>
            </div>
          </Link>

          <div className="my-auto">
            <div className="font-mono text-[11px] uppercase tracking-micro text-ocean-2 mb-5">
              Welcome back
            </div>
            <h1 className="font-serif text-[44px] xl:text-[56px] font-light leading-[1.0] tracking-tightest mb-6">
              Continue where you left off.
            </h1>
            <p className="text-[16px] text-paper/60 leading-relaxed max-w-sm">
              Your saved properties, agent conversations, and transaction history are waiting.
            </p>
          </div>

          <div className="border-t border-paper/10 pt-6">
            <div className="font-mono text-[10px] uppercase tracking-micro text-paper/40 mb-2">Platform Status</div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-[13px] text-paper/60">788 km · 12 destinations · All systems operational</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk Sign-In ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-ink flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div className="font-serif text-[18px] font-light">Coastal Corridor</div>
          </Link>
        </div>

        <div className="w-full max-w-md">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            forceRedirectUrl="/"
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
                formFieldSuccessText: 'text-success text-[12px]',
                formFieldErrorText: 'text-alert text-[12px]',
              },
              layout: {
                socialButtonsPlacement: 'top',
              },
            }}
          />
        </div>
      </div>

    </div>
  );
}
