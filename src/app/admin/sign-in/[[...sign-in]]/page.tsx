'use client';

import { SignIn } from '@clerk/nextjs';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, Lock, ChevronRight } from 'lucide-react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

type Role = 'superadmin' | 'admin';

const ROLE_EMAILS: Record<Role, string> = {
  superadmin: 'superadmin@coastalcorridor.africa',
  admin: 'admin@coastalcorridor.africa',
};

function AdminSignInContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, userId, sessionClaims } = useAuth();

  // If already authenticated as admin/superadmin, redirect to dashboard
  useEffect(() => {
    if (!isLoaded || !userId) return;
    const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
    if (role && ['admin', 'superadmin', 'ADMIN'].includes(role)) {
      router.replace('/admin/dashboard');
    }
  }, [isLoaded, userId, sessionClaims, router]);

  // Read role from URL param first, then fall back to sessionStorage
  // This handles the case where Clerk navigates to /factor-one and drops query params
  const roleParam = searchParams.get('role') as Role | null;
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    if (roleParam === 'superadmin' || roleParam === 'admin') {
      // URL has role — save to sessionStorage and use it
      sessionStorage.setItem('adminSignInRole', roleParam);
      setSelectedRole(roleParam);
    } else {
      // URL has no role — check sessionStorage (Clerk sub-route navigation)
      const stored = sessionStorage.getItem('adminSignInRole') as Role | null;
      if (stored === 'superadmin' || stored === 'admin') {
        setSelectedRole(stored);
      } else {
        setSelectedRole(null);
      }
    }
  }, [roleParam, pathname]);

  const selectRole = (role: Role) => {
    sessionStorage.setItem('adminSignInRole', role);
    // Use window.location.assign instead of router.push to avoid Next.js
    // subdomain rewrite context resolving the path to the wrong domain
    if (typeof window !== 'undefined') {
      window.location.assign(`https://admin.coastalcorridor.africa/admin/sign-in?role=${role}`);
    }
  };

  const clearRole = () => {
    sessionStorage.removeItem('adminSignInRole');
    setSelectedRole(null);
  };

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
              This area is restricted to authorised platform administrators. Select your role below, then sign in with your assigned credentials.
            </p>

            {/* Role descriptions */}
            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-sm bg-paper/4 border border-paper/8">
                <div className="w-2 h-2 rounded-full bg-ochre mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-micro text-ochre mb-0.5">Superadmin</div>
                  <div className="text-[12px] text-paper/45 leading-relaxed">Full platform access — user management, financials, system configuration, all data.</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-sm bg-paper/4 border border-paper/8">
                <div className="w-2 h-2 rounded-full bg-ocean mt-1.5 flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-micro text-ocean mb-0.5">Admin</div>
                  <div className="text-[12px] text-paper/45 leading-relaxed">Operational access — listings, agents, inquiries, reports. No system configuration.</div>
                </div>
              </div>
            </div>
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

      {/* ── RIGHT PANEL ── */}
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

          {!selectedRole ? (
            /* ── ROLE SELECTION ── */
            <div>
              <div className="mb-8">
                <div className="font-mono text-[11px] uppercase tracking-micro text-ink/40 mb-2">Step 1 of 2</div>
                <h2 className="font-serif text-[28px] font-light text-ink leading-tight">Select your role</h2>
                <p className="text-[14px] text-ink/55 mt-2">Choose the access level that matches your assigned credentials.</p>
              </div>

              <div className="space-y-3">
                {/* Superadmin button */}
                <button
                  onClick={() => selectRole('superadmin')}
                  className="w-full group flex items-center justify-between p-5 rounded-sm border-2 border-ochre/30 bg-ochre/5 hover:bg-ochre/10 hover:border-ochre/60 transition-all duration-150 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-ochre/15 border border-ochre/25 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="h-5 w-5 text-ochre" />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-micro text-ochre font-medium">Superadmin</div>
                      <div className="text-[13px] text-ink/60 mt-0.5">Full platform access</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ochre/60 group-hover:text-ochre group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* Admin button */}
                <button
                  onClick={() => selectRole('admin')}
                  className="w-full group flex items-center justify-between p-5 rounded-sm border-2 border-ocean/30 bg-ocean/5 hover:bg-ocean/10 hover:border-ocean/60 transition-all duration-150 cursor-pointer text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-sm bg-ocean/15 border border-ocean/25 flex items-center justify-center flex-shrink-0">
                      <Lock className="h-5 w-5 text-ocean" />
                    </div>
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-micro text-ocean font-medium">Admin</div>
                      <div className="text-[13px] text-ink/60 mt-0.5">Operational access</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-ocean/60 group-hover:text-ocean group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-ink/8 text-center">
                <p className="text-[12px] text-ink/40 font-mono uppercase tracking-micro">
                  Not an administrator?{' '}
                  <Link href="/" className="text-ink/60 hover:text-ink transition-colors">
                    Return to main platform
                  </Link>
                </p>
              </div>
            </div>

          ) : (
            /* ── SIGN-IN FORM ── */
            <div>
              {/* Back + role indicator */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={clearRole}
                  className="flex items-center gap-1.5 text-[12px] font-mono uppercase tracking-micro text-ink/40 hover:text-ink/70 transition-colors"
                >
                  <ChevronRight className="h-3 w-3 rotate-180" />
                  Back
                </button>
                <div className="h-3 w-px bg-ink/15" />
                <span className={`font-mono text-[10px] uppercase tracking-micro px-2.5 py-1 rounded-sm border ${
                  selectedRole === 'superadmin'
                    ? 'bg-ochre/15 text-ochre border-ochre/25'
                    : 'bg-ocean/10 text-ocean border-ocean/20'
                }`}>
                  {selectedRole === 'superadmin' ? 'Superadmin' : 'Admin'}
                </span>
              </div>

              <SignIn
                routing="path"
                path="/admin/sign-in"
                afterSignInUrl="https://admin.coastalcorridor.africa/admin/dashboard"
                initialValues={{
                  emailAddress: ROLE_EMAILS[selectedRole],
                }}
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
                    formFieldInput: `border rounded-sm bg-white text-[14px] text-ink ${
                      selectedRole === 'superadmin'
                        ? 'border-ochre/30 focus:border-ochre focus:ring-2 focus:ring-ochre/10'
                        : 'border-ocean/30 focus:border-ocean focus:ring-2 focus:ring-ocean/10'
                    }`,
                    formButtonPrimary: `text-paper font-sans text-[13px] uppercase tracking-[0.08em] rounded-sm ${
                      selectedRole === 'superadmin'
                        ? 'bg-ochre hover:bg-ochre/90'
                        : 'bg-ocean hover:bg-ocean-2'
                    }`,
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
          )}
        </div>
      </div>

    </div>
  );
}

export default function AdminSignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="animate-pulse h-10 w-40 bg-ink/10 rounded" />
      </div>
    }>
      <AdminSignInContent />
    </Suspense>
  );
}
