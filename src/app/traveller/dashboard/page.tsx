'use client';
/**
 * /traveller/dashboard — CC-WAVE5-INVESTOR-TRAVELLER-01 (AC-2)
 *
 * v1 scope: profile summary + quick-access tiles + coming-soon section.
 * No sub-routes, no Traveller-specific data model (deferred to Wave 5+).
 * Sub-routes (My Bookings, My Trips, Saved Experiences) are listed as
 * coming-soon items; they will be activated when the Traveller-facing
 * booking surface design decisions are made.
 *
 * /stay route does not exist at v1 (AC-0d confirmed); the "Find a Stay"
 * tile falls back to /destinations per brief spec.
 *
 * Route protection: TRAVELLER (or ADMIN / SUPERADMIN) only.
 * Non-matching roles redirect to /unauthorized.
 */
import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, MapPin, Star, BookOpen, Heart, Settings, LogOut, Lock } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

export default function TravellerDashboardPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  // AC-2f: Route protection — TRAVELLER, ADMIN, SUPERADMIN only
  const isAuthorised =
    isLoaded &&
    hasAnyRole(sessionClaims?.publicMetadata as Record<string, unknown>, [
      'TRAVELLER',
      'traveller',
      'ADMIN',
      'admin',
      'SUPERADMIN',
      'superadmin',
    ]);

  useEffect(() => {
    if (isLoaded && !isAuthorised) {
      router.replace('/unauthorized');
    }
  }, [isLoaded, isAuthorised, router]);

  // Auth loading skeleton
  if (!isLoaded || !isAuthorised) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ocean/20" />
          <div className="h-4 w-32 rounded bg-paper/10" />
        </div>
      </div>
    );
  }

  // Derive display values from Clerk session
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || 'Traveller';
  const email = user?.primaryEmailAddress?.emailAddress || '';
  const kycStatus =
    (sessionClaims?.publicMetadata as Record<string, unknown>)?.kycStatus as string | undefined;
  const kycLabel =
    kycStatus === 'verified'
      ? 'Verified'
      : kycStatus === 'pending'
      ? 'Pending Review'
      : 'KYC Required';
  const kycColour =
    kycStatus === 'verified'
      ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
      : kycStatus === 'pending'
      ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
      : 'text-red-400 border-red-400/30 bg-red-400/10';

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col">
        <div className="p-6 border-b border-paper/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-ocean/10 border border-ocean/20 flex items-center justify-center">
              <Compass className="w-4 h-4 text-ocean-2" />
            </div>
            <div>
              <div className="font-serif text-[15px] font-light">Coastal Corridor</div>
              <div className="font-mono text-[9px] uppercase tracking-widest text-paper/40 mt-0.5">
                Traveller Portal
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { icon: Compass, label: 'Dashboard', href: '/traveller/dashboard', active: true },
            { icon: Star, label: 'Experiences', href: '/experiences' },
            { icon: MapPin, label: 'Destinations', href: '/destinations' },
            { icon: Settings, label: 'Settings', href: '/account' },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                active
                  ? 'bg-ocean/10 text-ocean-2 border border-ocean/20'
                  : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-paper/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-ocean/10 border border-ocean/20 flex items-center justify-center">
              <span className="text-ocean-2 text-[11px] font-mono">
                {user?.firstName?.[0] || 'T'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium truncate">{displayName}</div>
              <div className="text-[11px] text-paper/40 truncate">{email}</div>
            </div>
          </div>
          <button
            onClick={() => router.push('/sign-out')}
            className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-paper/40 hover:text-paper/70 transition-colors rounded-md hover:bg-paper/5"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <header className="border-b border-paper/10 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[22px] font-light">
              Welcome back, {user?.firstName || 'Traveller'}
            </h1>
            <p className="text-[13px] text-paper/50 mt-0.5">
              Discover experiences along the Lagos–Calabar Coastal Highway
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-ocean/30 bg-ocean/10 text-ocean-2">
              Traveller
            </span>
            <span
              className={`font-mono text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border ${kycColour}`}
            >
              {kycLabel}
            </span>
          </div>
        </header>

        <div className="px-8 py-8 space-y-10">
          {/* ── Profile summary ─────────────────────────────────────────── */}
          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-paper/40 mb-4">
              Profile
            </h2>
            <div className="bg-ink border border-paper/10 rounded-lg p-6 flex items-start gap-6">
              <div className="w-14 h-14 rounded-full bg-ocean/10 border border-ocean/20 flex items-center justify-center flex-shrink-0">
                <span className="text-ocean-2 text-[18px] font-mono">
                  {user?.firstName?.[0] || 'T'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[18px] font-serif font-light">{displayName}</div>
                <div className="text-[13px] text-paper/50 mt-1">{email}</div>
                <div className="flex items-center gap-2 mt-3">
                  <span className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border border-ocean/30 bg-ocean/10 text-ocean-2">
                    Traveller
                  </span>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border ${kycColour}`}
                  >
                    {kycLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick-access tiles (AC-2d) ───────────────────────────────── */}
          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-paper/40 mb-4">
              Quick Access
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Link
                href="/experiences"
                className="group bg-ink border border-paper/10 rounded-lg p-6 hover:border-ocean/30 hover:bg-ocean/5 transition-all"
              >
                <div className="w-10 h-10 rounded-md bg-ocean/10 border border-ocean/20 flex items-center justify-center mb-4 group-hover:bg-ocean/20 transition-colors">
                  <Star className="w-5 h-5 text-ocean-2" />
                </div>
                <div className="text-[15px] font-medium mb-1">Browse Experiences</div>
                <div className="text-[12px] text-paper/50">
                  Discover curated experiences along the corridor
                </div>
              </Link>

              {/* /stay does not exist at v1 — falls back to /destinations per AC-0d */}
              <Link
                href="/destinations"
                className="group bg-ink border border-paper/10 rounded-lg p-6 hover:border-ocean/30 hover:bg-ocean/5 transition-all"
              >
                <div className="w-10 h-10 rounded-md bg-ocean/10 border border-ocean/20 flex items-center justify-center mb-4 group-hover:bg-ocean/20 transition-colors">
                  <MapPin className="w-5 h-5 text-ocean-2" />
                </div>
                <div className="text-[15px] font-medium mb-1">Browse Destinations</div>
                <div className="text-[12px] text-paper/50">
                  Explore stays and accommodation options
                </div>
              </Link>

              <Link
                href="/destinations"
                className="group bg-ink border border-paper/10 rounded-lg p-6 hover:border-ocean/30 hover:bg-ocean/5 transition-all"
              >
                <div className="w-10 h-10 rounded-md bg-ocean/10 border border-ocean/20 flex items-center justify-center mb-4 group-hover:bg-ocean/20 transition-colors">
                  <Compass className="w-5 h-5 text-ocean-2" />
                </div>
                <div className="text-[15px] font-medium mb-1">Plan a Trip</div>
                <div className="text-[12px] text-paper/50">
                  Explore the 12 destinations along the corridor
                </div>
              </Link>
            </div>
          </section>

          {/* ── Coming soon (AC-2e) ──────────────────────────────────────── */}
          <section>
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-paper/40 mb-4">
              Coming Soon
            </h2>
            <div className="bg-ink border border-paper/10 rounded-lg divide-y divide-paper/5">
              {[
                {
                  icon: BookOpen,
                  label: 'My Bookings',
                  description: 'View active and past bookings across stays and experiences',
                },
                {
                  icon: Compass,
                  label: 'My Trips',
                  description: 'Itineraries and trip planning tools',
                },
                {
                  icon: Heart,
                  label: 'Saved Experiences',
                  description: 'Your wishlist of saved experiences and stays',
                },
              ].map(({ icon: Icon, label, description }) => (
                <div
                  key={label}
                  className="flex items-center gap-4 px-6 py-4 opacity-50"
                >
                  <div className="w-8 h-8 rounded-md bg-paper/5 border border-paper/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-paper/30" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-paper/60">{label}</div>
                    <div className="text-[11px] text-paper/30 mt-0.5">{description}</div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Lock className="w-3 h-3 text-paper/20" />
                    <span className="font-mono text-[9px] uppercase tracking-widest text-paper/30">
                      Coming soon
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
