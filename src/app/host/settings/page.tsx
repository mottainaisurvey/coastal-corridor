'use client';
/**
 * /host/settings — CC-C-08-C-2 AC-3/5/6
 *
 * Renders the authenticated host's settings across four sections:
 *   1. Profile (display-only)
 *   2. Verification status (display-only)
 *   3. Payout preferences (payoutCurrency editable; bank account display-only)
 *   4. Cohort information (display-only)
 *
 * Data fetched from GET /api/host/settings.
 * Write action: PATCH /api/host/settings with { payoutCurrency }.
 *
 * AC-5c save pattern: explicit save button (server-confirmed, not optimistic).
 * The dropdown reflects the saved state on load; user changes are held locally
 * until "Save changes" is clicked. This matches the existing form handling style
 * in the host portal (no optimistic updates elsewhere) and avoids spurious PATCH
 * calls on every keystroke.
 *
 * AC-0 gap notes surfaced in the UI:
 *   - KYC status: User.kycStatus (String?), null → "Not started"
 *   - Bank account: no model — "Managed by verification team" message
 *   - Cohort term: User.cohortEndDate, null → "Term end date not set"
 *   - Phone: User.phone, null → "Not provided"
 */
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home, BarChart3, MapPin, Calendar, FileText, Settings,
  LogOut, RefreshCw, CheckCircle, AlertCircle, ChevronDown,
  User, Shield, Banknote, Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type PayoutCurrency = 'NGN' | 'USD' | 'GBP';

interface SettingsData {
  profile: {
    name: string | null;
    email: string;
    phone: string | null;
    memberSince: string;
  };
  verification: {
    kycStatus: string | null;
    verificationLevel: string | null;
    documentsOnFile: string[];
  };
  payout: {
    accountCurrency: PayoutCurrency;
    bankAccount: null;
    perPropertyBreakdown: {
      propertyId: string;
      name: string;
      location: string;
      effectiveCurrency: PayoutCurrency;
    }[];
  };
  cohort: {
    membershipStatus: 'COHORT' | 'STANDARD';
    commissionRate: number;
    commissionRatePct: string;
    termRemaining: string | null;
  };
}

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: T };

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved' }
  | { status: 'error'; message: string };

// ─── HostSidebar ──────────────────────────────────────────────────────────────

function HostSidebar({ activePath, user }: { activePath: string; user: any }) {
  const navItems = [
    { icon: BarChart3, label: 'Dashboard', href: '/host/dashboard' },
    { icon: MapPin, label: 'Properties', href: '/host/properties' },
    { icon: Calendar, label: 'Bookings', href: '/host/bookings' },
    { icon: FileText, label: 'Revenue', href: '/host/revenue' },
    { icon: Settings, label: 'Settings', href: '/host/settings' },
  ];
  return (
    <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col shrink-0">
      <div className="p-6 border-b border-paper/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-sm bg-ocean/10 border border-ocean/20 flex items-center justify-center">
            <Home className="w-4 h-4 text-ocean-2" />
          </div>
          <div>
            <div className="font-serif text-[15px] font-light">Coastal Corridor</div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40 mt-0.5">Host Portal</div>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ icon: Icon, label, href }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
              activePath === href
                ? 'bg-ocean/10 text-ocean-2 border border-ocean/20'
                : 'text-paper/60 hover:text-paper hover:bg-paper/5'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-paper/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-ocean/10 border border-ocean/20 flex items-center justify-center">
            <span className="text-ocean-2 text-[11px] font-mono">{user?.firstName?.[0] || 'H'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate">{user?.fullName || 'Host'}</div>
            <div className="text-[11px] text-paper/40 truncate">{user?.primaryEmailAddress?.emailAddress}</div>
          </div>
        </div>
        <Link href="/host/sign-in" className="flex items-center gap-2 px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors">
          <LogOut className="w-3 h-3" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function formatCohortTerm(iso: string | null): string {
  if (!iso) return 'Term end date not set';
  const d = new Date(iso);
  const now = new Date();
  if (d <= now) return 'Term expired';
  const months = Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const formatted = d.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' });
  return `Locked through ${formatted} (~${months} months remaining)`;
}

function kycLabel(status: string | null): string {
  if (!status) return 'Not started';
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace(/_/g, ' ');
}

function verificationLevelLabel(level: string | null): string {
  if (!level) return 'Not started';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

// ─── Section components ───────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-ocean-2" />
      <h2 className="font-serif text-[15px] font-light">{title}</h2>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-paper/5 last:border-0">
      <span className="text-[12px] text-paper/50 font-mono uppercase tracking-wide">{label}</span>
      <span className="text-[13px] text-paper/80 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HostSettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [fetchState, setFetchState] = useState<FetchState<SettingsData>>({ status: 'loading' });
  const [selectedCurrency, setSelectedCurrency] = useState<PayoutCurrency>('NGN');
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });
  const savedCurrencyRef = useRef<PayoutCurrency>('NGN');

  // Auth redirect
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/host/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch settings
  const fetchSettings = async () => {
    setFetchState({ status: 'loading' });
    try {
      const res = await fetch('/api/host/settings');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setFetchState({ status: 'error', message: body?.error || `HTTP ${res.status}` });
        return;
      }
      const data: SettingsData = await res.json();
      setFetchState({ status: 'ok', data });
      setSelectedCurrency(data.payout.accountCurrency);
      savedCurrencyRef.current = data.payout.accountCurrency;
    } catch (err) {
      setFetchState({ status: 'error', message: 'Failed to load settings. Please retry.' });
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchSettings();
    }
  }, [isLoaded, isSignedIn]);

  // Save payout currency
  const handleSave = async () => {
    if (selectedCurrency === savedCurrencyRef.current) {
      setSaveState({ status: 'saved' });
      setTimeout(() => setSaveState({ status: 'idle' }), 2000);
      return;
    }
    setSaveState({ status: 'saving' });
    try {
      const res = await fetch('/api/host/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutCurrency: selectedCurrency }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveState({ status: 'error', message: body?.message || body?.error || `HTTP ${res.status}` });
        return;
      }
      const updated: SettingsData = await res.json();
      setFetchState({ status: 'ok', data: updated });
      savedCurrencyRef.current = updated.payout.accountCurrency;
      setSelectedCurrency(updated.payout.accountCurrency);
      setSaveState({ status: 'saved' });
      setTimeout(() => setSaveState({ status: 'idle' }), 3000);
    } catch {
      setSaveState({ status: 'error', message: 'Save failed. Please retry.' });
    }
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="font-mono text-[12px] text-paper/30 uppercase tracking-widest animate-pulse">
          Authenticating…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink text-paper flex">
      <HostSidebar activePath="/host/settings" user={user} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-paper/10 px-8 py-6">
          <h1 className="font-serif text-[22px] font-light">Settings</h1>
          <p className="text-[13px] text-paper/40 mt-1">
            Account preferences and verification status.
          </p>
        </div>

        {/* Loading state */}
        {fetchState.status === 'loading' && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3 text-paper/30">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="font-mono text-[12px] uppercase tracking-widest">Loading settings…</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {fetchState.status === 'error' && (
          <div className="px-8 py-8">
            <div className="border border-red-500/20 bg-red-500/5 rounded-md p-5 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-[14px] font-medium text-red-300">Failed to load settings</div>
                <div className="text-[12px] text-red-400/70 mt-1">{fetchState.message}</div>
                <button
                  onClick={fetchSettings}
                  className="mt-3 flex items-center gap-2 text-[12px] text-ocean-2 hover:text-ocean transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings content */}
        {fetchState.status === 'ok' && (() => {
          const { profile, verification, payout, cohort } = fetchState.data;
          const isDirty = selectedCurrency !== savedCurrencyRef.current;

          return (
            <div className="px-8 py-8 space-y-8 max-w-3xl">

              {/* ── Section 1: Profile ─────────────────────────────────────── */}
              <section className="bg-ink-2 border border-paper/10 rounded-md p-6">
                <SectionHeader icon={User} title="Profile" />
                <Field label="Name" value={profile.name || <span className="text-paper/30 italic">Not set</span>} />
                <Field label="Email" value={profile.email} />
                <Field label="Phone" value={profile.phone || <span className="text-paper/30 italic">Not provided</span>} />
                <Field label="Member since" value={formatDate(profile.memberSince)} />
              </section>

              {/* ── Section 2: Verification ────────────────────────────────── */}
              <section className="bg-ink-2 border border-paper/10 rounded-md p-6">
                <SectionHeader icon={Shield} title="Verification status" />
                <Field
                  label="KYC status"
                  value={
                    <span className={`font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded ${
                      verification.kycStatus
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-paper/5 text-paper/30 border border-paper/10'
                    }`}>
                      {kycLabel(verification.kycStatus)}
                    </span>
                  }
                />
                <Field
                  label="Verification level"
                  value={
                    <span className={`font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded ${
                      verification.verificationLevel
                        ? 'bg-ocean/10 text-ocean-2 border border-ocean/20'
                        : 'bg-paper/5 text-paper/30 border border-paper/10'
                    }`}>
                      {verificationLevelLabel(verification.verificationLevel)}
                    </span>
                  }
                />
                <Field
                  label="Documents on file"
                  value={
                    verification.documentsOnFile.length > 0
                      ? <span className="text-emerald-400">{verification.documentsOnFile.join(', ')}</span>
                      : <span className="text-paper/30 italic">No documents on file</span>
                  }
                />
              </section>

              {/* ── Section 3: Payout preferences ─────────────────────────── */}
              <section className="bg-ink-2 border border-paper/10 rounded-md p-6">
                <SectionHeader icon={Banknote} title="Payout preferences" />

                {/* Editable: payout currency */}
                <div className="flex justify-between items-center py-2.5 border-b border-paper/5">
                  <span className="text-[12px] text-paper/50 font-mono uppercase tracking-wide">
                    Account payout currency
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select
                        value={selectedCurrency}
                        onChange={(e) => {
                          setSelectedCurrency(e.target.value as PayoutCurrency);
                          setSaveState({ status: 'idle' });
                        }}
                        className="appearance-none bg-ink border border-paper/20 rounded px-3 py-1.5 pr-8 text-[13px] text-paper focus:outline-none focus:border-ocean/50 cursor-pointer"
                      >
                        <option value="NGN">NGN — Nigerian Naira</option>
                        <option value="USD">USD — US Dollar</option>
                        <option value="GBP">GBP — British Pound</option>
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-paper/40 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Bank account — display-only, KYC-managed */}
                <div className="py-2.5 border-b border-paper/5">
                  <div className="flex justify-between items-start">
                    <span className="text-[12px] text-paper/50 font-mono uppercase tracking-wide">Bank account</span>
                    <span className="text-[12px] text-paper/30 italic text-right max-w-[60%]">
                      Managed by the verification team
                    </span>
                  </div>
                  <p className="text-[11px] text-paper/25 mt-1.5">
                    To update your bank account details, contact{' '}
                    <a href="mailto:host@coastalcorridor.africa" className="text-ocean-2 hover:underline">
                      host@coastalcorridor.africa
                    </a>
                    .
                  </p>
                </div>

                {/* Save button + confirmation */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-[12px]">
                    {saveState.status === 'saved' && (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                    {saveState.status === 'error' && (
                      <span className="flex items-center gap-1.5 text-red-400">
                        <AlertCircle className="w-3.5 h-3.5" /> {saveState.message}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saveState.status === 'saving'}
                    className={`px-4 py-2 rounded text-[13px] font-medium transition-colors ${
                      saveState.status === 'saving'
                        ? 'bg-ocean/30 text-ocean-2/50 cursor-not-allowed'
                        : isDirty
                        ? 'bg-ocean text-ink hover:bg-ocean-2'
                        : 'bg-paper/5 text-paper/40 border border-paper/10 hover:bg-paper/10 hover:text-paper/60'
                    }`}
                  >
                    {saveState.status === 'saving' ? 'Saving…' : 'Save changes'}
                  </button>
                </div>

                {/* Per-property breakdown */}
                {payout.perPropertyBreakdown.length > 0 && (
                  <div className="mt-6">
                    <div className="text-[11px] font-mono uppercase tracking-widest text-paper/30 mb-3">
                      Per-property breakdown
                    </div>
                    <div className="border border-paper/10 rounded overflow-hidden">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-paper/10 bg-paper/3">
                            <th className="text-left px-4 py-2.5 text-paper/40 font-normal">Property</th>
                            <th className="text-left px-4 py-2.5 text-paper/40 font-normal">Location</th>
                            <th className="text-right px-4 py-2.5 text-paper/40 font-normal">Currency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payout.perPropertyBreakdown.map((p) => (
                            <tr key={p.propertyId} className="border-b border-paper/5 last:border-0">
                              <td className="px-4 py-2.5 text-paper/80">{p.name}</td>
                              <td className="px-4 py-2.5 text-paper/50">{p.location}</td>
                              <td className="px-4 py-2.5 text-right">
                                <span className="font-mono text-[11px] bg-paper/5 border border-paper/10 px-2 py-0.5 rounded">
                                  {p.effectiveCurrency}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[11px] text-paper/25 mt-2">
                      Per-property currency overrides will be available in a future release.
                    </p>
                  </div>
                )}
              </section>

              {/* ── Section 4: Cohort information ──────────────────────────── */}
              <section className="bg-ink-2 border border-paper/10 rounded-md p-6">
                <SectionHeader icon={Star} title="Cohort information" />
                <Field
                  label="Membership status"
                  value={
                    <span className={`font-mono text-[11px] uppercase tracking-wide px-2 py-0.5 rounded ${
                      cohort.membershipStatus === 'COHORT'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-paper/5 text-paper/40 border border-paper/10'
                    }`}>
                      {cohort.membershipStatus === 'COHORT' ? 'Cohort member' : 'Standard'}
                    </span>
                  }
                />
                <Field
                  label="Commission rate"
                  value={
                    <span className="font-mono text-[13px]">
                      {cohort.commissionRatePct}
                      <span className="text-paper/30 text-[11px] ml-1">
                        ({cohort.membershipStatus === 'COHORT' ? 'cohort rate' : 'standard rate'})
                      </span>
                    </span>
                  }
                />
                <Field
                  label="Cohort term"
                  value={
                    cohort.membershipStatus === 'COHORT'
                      ? <span className={cohort.termRemaining ? 'text-paper/80' : 'text-paper/30 italic'}>
                          {formatCohortTerm(cohort.termRemaining)}
                        </span>
                      : <span className="text-paper/30 italic">N/A — standard membership</span>
                  }
                />
              </section>

            </div>
          );
        })()}
      </main>
    </div>
  );
}
