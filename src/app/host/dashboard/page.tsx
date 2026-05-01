'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, BarChart3, MapPin, Calendar, FileText, Settings, LogOut } from 'lucide-react';

export default function HostDashboardPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
  const isHost = isLoaded && (role === 'host' || role === 'admin' || role === 'superadmin');

  useEffect(() => {
    if (isLoaded && !isHost) {
      router.replace('/host/sign-in');
    }
  }, [isLoaded, isHost, router]);

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
      {/* Sidebar */}
      <aside className="w-64 bg-ink border-r border-paper/10 flex flex-col">
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
          {[
            { icon: BarChart3, label: 'Dashboard', href: '/host/dashboard', active: true },
            { icon: MapPin, label: 'Properties', href: '/host/properties' },
            { icon: Calendar, label: 'Bookings', href: '/host/bookings' },
            { icon: FileText, label: 'Revenue', href: '/host/revenue' },
            { icon: Settings, label: 'Settings', href: '/host/settings' },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                active ? 'bg-ocean/10 text-ocean-2 border border-ocean/20' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
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

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Host Dashboard</div>
            <h1 className="font-serif text-3xl font-light">Welcome back, {user?.firstName || 'Host'}</h1>
            <p className="text-paper/50 text-[14px] mt-1">Manage your coastal properties and bookings.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Properties', value: '0', change: 'Add your first' },
              { label: 'Active Bookings', value: '0', change: 'No bookings yet' },
              { label: 'Revenue (NGN)', value: '₦0', change: 'This month' },
              { label: 'Occupancy Rate', value: '0%', change: '30-day average' },
            ].map(({ label, value, change }) => (
              <div key={label} className="bg-ink border border-paper/10 rounded-lg p-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">{label}</div>
                <div className="text-2xl font-serif font-light text-paper">{value}</div>
                <div className="text-[11px] text-paper/40 mt-1">{change}</div>
              </div>
            ))}
          </div>

          {/* Coming soon notice */}
          <div className="bg-ink border border-ocean/20 rounded-lg p-8 text-center">
            <Home className="w-10 h-10 text-ocean-2/40 mx-auto mb-4" />
            <div className="font-mono text-[11px] uppercase tracking-widest text-ocean-2 mb-2">Host Tools</div>
            <h2 className="font-serif text-xl font-light mb-2">Full host dashboard coming soon</h2>
            <p className="text-paper/40 text-[13px] max-w-md mx-auto">
              Property management, booking calendar, revenue tracking, and guest communication tools are being built out.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
