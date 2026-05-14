'use client';

/**
 * /operator/settings — CC-C-09-C-2 AC-3
 *
 * Four-section settings page:
 *   1. Profile (display-only)
 *   2. Verification status (display-only)
 *   3. Payout preferences (editable: currency dropdown + Save)
 *   4. Cohort information (display-only)
 *
 * Write surface: payout currency only (PATCH /api/operator/settings).
 * Server-confirmed save pattern with green CheckCircle + 3-second fade.
 *
 * AC-7b note: User.preferredCurrency is a shared account-level field.
 * Changing it here also affects /host/settings for multi-role users.
 * This is intentional by design. Per-role currency separation is deferred.
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass, BarChart3, Star, Calendar, FileText, Settings, LogOut,
  RefreshCw, CheckCircle, ChevronDown, User, ShieldCheck, CreditCard, Users,
} from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ExperienceBreakdown {
  experienceId:      string;
  name:              string;
  location:          string;
  effectiveCurrency: string;
  status:            string;
}

interface SettingsData {
  profile: {
    name:        string | null;
    email:       string;
    phone:       string | null;
    memberSince: string;
  };
  verification: {
    kycStatus:         string | null;
    verificationLevel: string | null;
    documentsOnFile:   string[];
  };
  payout: {
    accountCurrency:         string;
    bankAccount:             null;
    perExperienceBreakdown:  ExperienceBreakdown[];
  };
  cohort: {
    membershipStatus:  string;
    commissionRate:    number | null;
    commissionRatePct: number | null;
    termRemaining:     string | null;
  };
}

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: SettingsData };

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ── Helpers ───────────────────────────────────────────────────────────────────

const KYC_BADGE: Record<string, string> = {
  VERIFIED:   'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  PENDING:    'text-amber-400 bg-amber-400/10 border-amber-400/20',
  REJECTED:   'text-laterite bg-laterite/10 border-laterite/20',
  NOT_STARTED: 'text-paper/40 bg-paper/5 border-paper/10',
};

const VERIFICATION_LABELS: Record<string, string> = {
  BASIC:    'Basic',
  STANDARD: 'Standard',
  ENHANCED: 'Enhanced',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function OperatorSidebar({ active, user }: { active: string; user: any }) {
  const navItems = [
    { icon: BarChart3, label: 'Dashboard',   href: '/operator/dashboard'   },
    { icon: Star,      label: 'Experiences', href: '/operator/experiences' },
    { icon: Calendar,  label: 'Bookings',    href: '/operator/bookings'    },
    { icon: FileText,  label: 'Revenue',     href: '/operator/revenue'     },
    { icon: Settings,  label: 'Settings',    href: '/operator/settings'    },
  ];
  return (
    <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col">
      <div className="p-6 border-b border-paper/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center">
            <Compass className="w-4 h-4 text-gold" />
          </div>
          <div>
            <div className="font-serif text-[15px] font-light">Coastal Corridor</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40 mt-0.5">Operator Portal</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link key={href} href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
              active === label ? 'bg-gold/10 text-gold border border-gold/20' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
            }`}
          >
            <Icon className="w-4 h-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-paper/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
            <span className="text-gold text-[11px] font-mono">{user?.firstName?.[0] || 'O'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user?.fullName || 'Operator'}</div>
            <div className="text-[11px] text-paper/40 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
        <Link href="/operator/sign-in" className="flex items-center gap-2 px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors">
          <LogOut className="w-3.5 h-3.5" />Sign out
        </Link>
      </div>
    </aside>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────

function SectionCard({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink border border-paper/10 rounded-lg overflow-hidden mb-6">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-paper/10 bg-paper/2">
        <Icon className="w-4 h-4 text-gold/60" />
        <h2 className="font-mono text-[11px] uppercase tracking-widest text-paper/60">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-paper/5 last:border-0">
      <span className="text-[12px] text-paper/40 shrink-0 w-40">{label}</span>
      <span className="text-[13px] text-paper/80 text-right">{value}</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function OperatorSettingsPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>({ status: 'loading' });
  const [localCurrency, setLocalCurrency] = useState<string>('NGN');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOperator = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, [
    'OPERATOR', 'operator', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin',
  ]);

  useEffect(() => {
    if (isLoaded && !isOperator) router.replace('/operator/sign-in');
  }, [isLoaded, isOperator, router]);

  const fetchSettings = () => {
    setPageState({ status: 'loading' });
    fetch('/api/operator/settings')
      .then(res => { if (!res.ok) throw new Error(`${res.status}`); return res.json(); })
      .then(data => {
        setPageState({ status: 'ok', data });
        setLocalCurrency(data.payout.accountCurrency ?? 'NGN');
      })
      .catch(err => {
        console.error('[operator/settings] fetch error:', err);
        setPageState({ status: 'error', message: 'Unable to load settings — please refresh.' });
      });
  };

  useEffect(() => {
    if (!isLoaded || !isOperator) return;
    fetchSettings();
  }, [isLoaded, isOperator]);

  const handleSave = async () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    setSaveError(null);
    try {
      const res = await fetch('/api/operator/settings', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ payoutCurrency: localCurrency }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? `${res.status}`);
      }
      const updated = await res.json();
      setPageState({ status: 'ok', data: updated });
      setSaveState('saved');
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 3000);
    } catch (err: any) {
      console.error('[operator/settings] save error:', err);
      setSaveError(err.message ?? 'Save failed — please try again.');
      setSaveState('error');
    }
  };

  if (!isLoaded || !isOperator) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gold/20" />
          <div className="h-4 w-32 rounded bg-paper/10" />
        </div>
      </div>
    );
  }

  const data = pageState.status === 'ok' ? pageState.data : null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <OperatorSidebar active="Settings" user={user} />

      <main className="flex-1 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Portal</div>
            <h1 className="font-serif text-3xl font-light">Settings</h1>
            <p className="text-paper/50 text-[14px] mt-1">Account configuration and preferences.</p>
          </div>

          {/* Error banner */}
          {pageState.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-laterite/10 border border-laterite/30 rounded-lg px-4 py-3 text-[13px] text-laterite">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{pageState.message}</span>
              <button onClick={fetchSettings} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {pageState.status === 'loading' && (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-ink border border-paper/10 rounded-lg p-5">
                  <div className="h-3 w-1/3 rounded bg-paper/10 mb-4" />
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-paper/5" />
                    <div className="h-3 w-3/4 rounded bg-paper/5" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sections */}
          {data && (
            <>
              {/* Section 1: Profile */}
              <SectionCard icon={User} title="Profile">
                <Row label="Name"        value={data.profile.name ?? <em className="text-paper/30">Not provided</em>} />
                <Row label="Email"       value={data.profile.email} />
                <Row label="Phone"       value={data.profile.phone ?? <em className="text-paper/30">Not provided</em>} />
                <Row label="Member since" value={formatDate(data.profile.memberSince)} />
              </SectionCard>

              {/* Section 2: Verification */}
              <SectionCard icon={ShieldCheck} title="Verification Status">
                <Row
                  label="KYC status"
                  value={
                    <span className={`text-[11px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${KYC_BADGE[data.verification.kycStatus ?? 'NOT_STARTED'] ?? KYC_BADGE['NOT_STARTED']}`}>
                      {data.verification.kycStatus ?? 'Not started'}
                    </span>
                  }
                />
                <Row
                  label="Verification level"
                  value={
                    data.verification.verificationLevel
                      ? VERIFICATION_LABELS[data.verification.verificationLevel] ?? data.verification.verificationLevel
                      : <em className="text-paper/30">Not verified</em>
                  }
                />
                <Row
                  label="Documents on file"
                  value={
                    data.verification.documentsOnFile.length > 0
                      ? data.verification.documentsOnFile.join(', ')
                      : <em className="text-paper/30">None on file</em>
                  }
                />
              </SectionCard>

              {/* Section 3: Payout preferences */}
              <SectionCard icon={CreditCard} title="Payout Preferences">
                {/* Editable: payout currency */}
                <div className="mb-4">
                  <label className="block text-[12px] text-paper/40 mb-1.5">Account payout currency</label>
                  <div className="relative inline-block">
                    <select
                      value={localCurrency}
                      onChange={e => { setLocalCurrency(e.target.value); setSaveState('idle'); }}
                      className="appearance-none bg-paper/5 border border-paper/20 rounded-md px-3 py-2 pr-8 text-[13px] text-paper focus:outline-none focus:border-gold/40 cursor-pointer"
                    >
                      <option value="NGN">NGN — Nigerian Naira</option>
                      <option value="USD">USD — US Dollar</option>
                      <option value="GBP">GBP — British Pound</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-paper/40 pointer-events-none" />
                  </div>
                </div>

                {/* Save button + confirmation */}
                <div className="flex items-center gap-3 mb-5">
                  <button
                    onClick={handleSave}
                    disabled={saveState === 'saving'}
                    className="px-4 py-2 bg-gold/10 border border-gold/30 rounded-md text-[13px] text-gold hover:bg-gold/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saveState === 'saving' ? 'Saving…' : 'Save changes'}
                  </button>
                  {saveState === 'saved' && (
                    <span className="flex items-center gap-1.5 text-[12px] text-emerald-400 transition-opacity">
                      <CheckCircle className="w-3.5 h-3.5" />Saved
                    </span>
                  )}
                  {saveState === 'error' && saveError && (
                    <span className="text-[12px] text-laterite">{saveError}</span>
                  )}
                </div>

                {/* Bank account (display-only) */}
                <Row
                  label="Bank account"
                  value={
                    <span className="text-[12px] text-paper/40">
                      Managed by the verification team —{' '}
                      <a href="mailto:verify@coastalcorridor.com" className="underline underline-offset-2 hover:text-paper/70">
                        contact us
                      </a>
                    </span>
                  }
                />

                {/* Per-experience breakdown table */}
                {data.payout.perExperienceBreakdown.length > 0 && (
                  <div className="mt-4">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">Per-experience breakdown</div>
                    <div className="border border-paper/10 rounded-md overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-paper/10 bg-paper/2">
                            <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper/30">Experience</th>
                            <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper/30">Location</th>
                            <th className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-paper/30">Currency</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-paper/5">
                          {data.payout.perExperienceBreakdown.map(exp => (
                            <tr key={exp.experienceId}>
                              <td className="px-3 py-2 text-paper/70 truncate max-w-[180px]">{exp.name}</td>
                              <td className="px-3 py-2 text-paper/40 truncate max-w-[160px]">{exp.location}</td>
                              <td className="px-3 py-2 text-paper/60 font-mono">{exp.effectiveCurrency}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-paper/30 mt-2 italic">
                      Per-experience payout currency overrides will be available in a future release.
                    </p>
                  </div>
                )}
              </SectionCard>

              {/* Section 4: Cohort information */}
              <SectionCard icon={Users} title="Cohort Information">
                <Row
                  label="Membership"
                  value={
                    <span className={`text-[11px] font-mono uppercase tracking-wide px-2 py-0.5 rounded border ${
                      data.cohort.membershipStatus === 'cohort'
                        ? 'text-gold bg-gold/10 border-gold/20'
                        : 'text-paper/40 bg-paper/5 border-paper/10'
                    }`}>
                      {data.cohort.membershipStatus === 'cohort' ? 'Cohort member' : 'Standard'}
                    </span>
                  }
                />
                <Row
                  label="Commission rate"
                  value={
                    data.cohort.commissionRatePct !== null
                      ? `${data.cohort.commissionRatePct}% (${data.cohort.membershipStatus === 'cohort' ? 'cohort rate' : 'standard rate'})`
                      : <em className="text-paper/30">Not set</em>
                  }
                />
                {data.cohort.membershipStatus === 'cohort' && (
                  <Row
                    label="Term remaining"
                    value={data.cohort.termRemaining ?? <em className="text-paper/30">No end date set</em>}
                  />
                )}
              </SectionCard>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
