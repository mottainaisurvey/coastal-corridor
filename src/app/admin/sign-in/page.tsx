'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';

export default function AdminSignInPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[44%] bg-ink-2 text-paper flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 20% 40%, rgba(10,14,18,0.8) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(45,125,125,0.15) 0%, transparent 55%)'
        }} />
        {/* Fine grid */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(245,241,234,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,241,234,0.8) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 flex flex-col h-full px-12 py-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-auto">
            <div className="w-8 h-8 rounded-sm bg-paper/8 border border-paper/15 flex items-center justify-center">
              <span className="text-paper font-serif text-[12px] font-light">CC</span>
            </div>
            <div>
              <div className="font-serif text-[16px] font-light leading-none">Coastal Corridor</div>
              <div className="font-mono text-[9px] uppercase tracking-micro text-paper/40 mt-0.5">Platform Administration</div>
            </div>
          </Link>

          {/* Icon + copy */}
          <div className="my-auto">
            <div className="w-14 h-14 rounded-sm bg-paper/5 border border-paper/10 flex items-center justify-center mb-8">
              <ShieldCheck className="h-7 w-7 text-ocean-2" />
            </div>
            <div className="font-mono text-[11px] uppercase tracking-micro text-ocean-2 mb-5">
              Restricted Access
            </div>
            <h1 className="font-serif text-[38px] xl:text-[48px] font-light leading-[1.05] tracking-tightest mb-6">
              Admin &amp; Superadmin Portal
            </h1>
            <p className="text-[15px] text-paper/55 leading-relaxed max-w-sm">
              This area is restricted to authorised platform administrators. Sign in with your assigned credentials to access the management dashboard.
            </p>
          </div>

          {/* Security notice */}
          <div className="border-t border-paper/10 pt-6">
            <div className="flex items-start gap-3">
              <Lock className="h-4 w-4 text-paper/30 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-paper/35 leading-relaxed">
                All admin sessions are logged and audited. Unauthorised access attempts are reported to the platform security team. If you are not an authorised administrator, please{' '}
                <Link href="/" className="text-paper/50 underline hover:text-paper/70 transition-colors">
                  return to the main platform
                </Link>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk Sign-In ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-paper px-6 py-12">
        {/* Mobile header */}
        <div className="lg:hidden mb-8 text-center">
          <div className="w-12 h-12 rounded-sm bg-ink flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6 text-paper" />
          </div>
          <div className="font-serif text-[20px] font-light">Platform Administration</div>
          <p className="text-[13px] text-ink/50 mt-2">Restricted to authorised administrators only.</p>
        </div>

        <div className="w-full max-w-[400px]">
          {/* Role badges */}
          <div className="flex gap-2 mb-6 justify-center lg:justify-start">
            <span className="font-mono text-[10px] uppercase tracking-micro bg-ochre/15 text-ochre border border-ochre/20 px-3 py-1.5 rounded-sm">
              Superadmin
            </span>
            <span className="font-mono text-[10px] uppercase tracking-micro bg-ocean/10 text-ocean border border-ocean/20 px-3 py-1.5 rounded-sm">
              Admin
            </span>
          </div>

          <SignIn
            routing="path"
            path="/admin/sign-in"
            afterSignInUrl="/admin/dashboard"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent p-0 w-full',
                headerTitle: 'font-serif text-[24px] font-light text-ink tracking-display',
                headerSubtitle: 'text-[13px] text-ink/55',
                socialButtonsBlockButton: 'border border-ink/20 bg-white hover:bg-ink/4 text-ink font-sans text-[13px] rounded-sm',
                dividerLine: 'bg-ink/10',
                dividerText: 'font-mono text-[10px] uppercase tracking-micro text-ink/40',
                formFieldLabel: 'font-mono text-[10px] uppercase tracking-micro text-ink/60',
                formFieldInput: 'border border-ink/20 rounded-sm bg-white focus:border-ink focus:ring-2 focus:ring-ink/8 text-[14px] text-ink',
                formButtonPrimary: 'bg-ink hover:bg-ink-2 text-paper font-sans text-[13px] uppercase tracking-[0.08em] rounded-sm',
                footerActionLink: 'text-ocean hover:text-ocean-2 font-sans text-[13px]',
                formFieldSuccessText: 'text-success text-[12px]',
                formFieldErrorText: 'text-alert text-[12px]',
                footer: 'hidden',
              },
              layout: {
                socialButtonsPlacement: 'top',
              },
            }}
          />

          <div className="mt-8 pt-6 border-t border-ink/8 text-center">
            <p className="text-[12px] text-ink/40 font-mono uppercase tracking-micro">
              Not an administrator?{' '}
              <Link href="/" className="text-ink/60 hover:text-ink transition-colors">
                Return to main platform
              </Link>
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
