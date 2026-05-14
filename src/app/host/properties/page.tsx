'use client';

/**
 * /host/properties — CC-C-08-C-1 AC-1b/c/d
 *
 * Renders the authenticated host's property list as cards.
 * Data fetched from GET /api/host/properties.
 * Read-only view — no edit/write actions (scope discipline note).
 */

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MapPin, Calendar, FileText, Settings, LogOut, RefreshCw, Building2 } from 'lucide-react';
import { hasAnyRole } from '@/lib/user-roles';

interface Property {
  id: string;
  name: string;
  status: 'ACTIVE' | 'UNDER_REVIEW' | 'INACTIVE';
  propertyType: string;
  city: string;
  state: string;
  roomCount: number;
  primaryPhotoUrl: string | null;
  createdAt: string;
}

type FetchState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: T };

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' },
  UNDER_REVIEW: { label: 'Under Review', className: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  INACTIVE: { label: 'Inactive', className: 'bg-paper/5 text-paper/40 border border-paper/10' },
};

function formatPropertyType(type: string): string {
  return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

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
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </Link>
      </div>
    </aside>
  );
}

export default function HostPropertiesPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [state, setState] = useState<FetchState<Property[]>>({ status: 'loading' });

  // CC-C-09-A-0.1: array-aware role check
  const isHost = isLoaded && hasAnyRole(sessionClaims?.publicMetadata as any, ['HOST', 'host', 'ADMIN', 'admin', 'SUPERADMIN', 'superadmin']);

  useEffect(() => {
    if (isLoaded && !isHost) router.replace('/host/sign-in');
  }, [isLoaded, isHost, router]);

  const fetchData = () => {
    setState({ status: 'loading' });
    fetch('/api/host/properties')
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((d) => setState({ status: 'ok', data: d.properties }))
      .catch((e) => setState({ status: 'error', message: 'Unable to load properties — please retry.' }));
  };

  useEffect(() => {
    if (isLoaded && isHost) fetchData();
  }, [isLoaded, isHost]);

  if (!isLoaded || !isHost) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-ocean/20" />
          <div className="h-4 w-32 rounded bg-paper/10" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      <HostSidebar activePath="/host/properties" user={user} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Properties</div>
            <h1 className="font-serif text-3xl font-light">Your Properties</h1>
            <p className="text-paper/50 text-[14px] mt-1">Properties syndicated through Coastal Corridor.</p>
          </div>

          {/* Error banner */}
          {state.status === 'error' && (
            <div className="mb-6 flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-[13px] text-red-400">
              <RefreshCw className="w-4 h-4 shrink-0" />
              <span>{state.message}</span>
              <button onClick={fetchData} className="ml-auto text-[12px] underline underline-offset-2 hover:no-underline">Retry</button>
            </div>
          )}

          {/* Loading skeleton */}
          {state.status === 'loading' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-ink border border-paper/10 rounded-lg p-5 animate-pulse">
                  <div className="h-4 w-3/4 bg-paper/10 rounded mb-3" />
                  <div className="h-3 w-1/2 bg-paper/10 rounded mb-2" />
                  <div className="h-3 w-1/3 bg-paper/10 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state (AC-1c) */}
          {state.status === 'ok' && state.data.length === 0 && (
            <div className="bg-ink border border-paper/10 rounded-lg p-10 text-center">
              <Building2 className="w-10 h-10 text-ocean-2/30 mx-auto mb-4" />
              <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">No Properties</div>
              <p className="text-paper/40 text-[13px] max-w-sm mx-auto">
                No properties listed yet — properties you list on Owambe Stays will appear here when syndicated through CC.
              </p>
            </div>
          )}

          {/* Property cards (AC-1b) */}
          {state.status === 'ok' && state.data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {state.data.map((prop) => {
                const badge = STATUS_BADGE[prop.status] ?? STATUS_BADGE.INACTIVE;
                return (
                  <div key={prop.id} className="bg-ink border border-paper/10 rounded-lg overflow-hidden">
                    {/* Photo placeholder or image */}
                    <div className="h-32 bg-paper/5 flex items-center justify-center border-b border-paper/10">
                      {prop.primaryPhotoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={prop.primaryPhotoUrl} alt={prop.name} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-8 h-8 text-paper/20" />
                      )}
                    </div>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-serif text-[15px] font-light leading-snug">{prop.name}</h3>
                        <span className={`shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-full ${badge.className}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[12px] text-paper/50 mb-3">
                        {prop.city}, {prop.state}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-paper/40">
                        <span>{prop.roomCount} {prop.roomCount === 1 ? 'room' : 'rooms'} · {formatPropertyType(prop.propertyType)}</span>
                        <span>Listed {formatDate(prop.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
