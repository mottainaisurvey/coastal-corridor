'use client';

import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function HostSignInPage() {
  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-ink text-paper flex-col relative overflow-hidden">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(45,160,100,0.3) 0%, transparent 55%), radial-gradient(circle at 85% 80%, rgba(45,125,125,0.2) 0%, transparent 55%)'
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
                <div className="font-mono text-[9px] uppercase tracking-micro text-paper/50 mt-0.5">Host Portal</div>
              </div>
            </Link>
            <Link href="/professional" className="flex items-center gap-1.5 text-paper/50 hover:text-paper/80 transition-colors text-[13px]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          </div>

          <div className="my-12">
            <div className="font-mono text-[11px] uppercase tracking-micro text-success mb-5">
              Host Portal
            </div>
            <h1 className="font-serif text-[40px] xl:text-[50px] font-light leading-[1.0] tracking-tightest mb-6">
              Welcome back to your host portal.
            </h1>
            <p className="text-[15px] text-paper/60 leading-relaxed max-w-md">
              Manage your listings, respond to guest inquiries, and track bookings from diaspora returnees and travellers along the Lagos–Calabar corridor.
            </p>
          </div>

          <div className="border-t border-paper/10 pt-6">
            <p className="text-[12px] text-paper/35">
              New host?{' '}
              <Link href="/host/sign-up" className="text-success hover:text-success/80 transition-colors">
                Apply for a host account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Clerk Sign-In ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-paper px-6 py-12">
        <div className="lg:hidden mb-8 text-center">
          <Link href="/professional" className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-[13px] mb-4 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            Professional categories
          </Link>
          <div className="font-serif text-[20px] font-light">Host Portal</div>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-micro bg-success/10 text-success border border-success/20 px-3 py-1.5 rounded-sm">
              <Home className="h-3 w-3" />
              Host Account
            </span>
          </div>

          <SignIn
            routing="path"
            path="/host/sign-in"
            signUpUrl="/host/sign-up"
            forceRedirectUrl="/host/dashboard"
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
                formFieldInput: 'border border-ink/20 rounded-sm bg-white focus:border-success focus:ring-2 focus:ring-success/15 text-[14px] text-ink',
                formButtonPrimary: 'bg-success hover:bg-success/80 text-paper font-sans text-[13px] uppercase tracking-[0.08em] rounded-sm',
                footerActionLink: 'text-success hover:text-success/80 font-sans text-[13px]',
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
            Sign in to buyer account?{' '}
            <Link href="/sign-in" className="text-laterite hover:text-laterite-2 transition-colors">
              Buyer sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
