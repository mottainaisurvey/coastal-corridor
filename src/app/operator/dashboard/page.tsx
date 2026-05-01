'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Compass, BarChart3, MapPin, Users, FileText, Settings, LogOut } from 'lucide-react';

export default function OperatorDashboardPage() {
  const { isLoaded, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const role = (sessionClaims?.publicMetadata as any)?.role as string | undefined;
  const isOperator = isLoaded && (role === 'operator' || role === 'admin' || role === 'superadmin');

  useEffect(() => {
    if (isLoaded && !isOperator) {
      router.replace('/operator/sign-in');
    }
  }, [isLoaded, isOperator, router]);

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

  return (
    <div className="min-h-screen bg-[#0f1117] text-paper flex">
      {/* Sidebar */}
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
          {[
            { icon: BarChart3, label: 'Dashboard', href: '/operator/dashboard', active: true },
            { icon: MapPin, label: 'Destinations', href: '/operator/destinations' },
            { icon: Users, label: 'Agents', href: '/operator/agents' },
            { icon: FileText, label: 'Reports', href: '/operator/reports' },
            { icon: Settings, label: 'Settings', href: '/operator/settings' },
          ].map(({ icon: Icon, label, href, active }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                active ? 'bg-gold/10 text-gold border border-gold/20' : 'text-paper/60 hover:text-paper hover:bg-paper/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
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
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Dashboard</div>
            <h1 className="font-serif text-3xl font-light">Welcome back, {user?.firstName || 'Operator'}</h1>
            <p className="text-paper/50 text-[14px] mt-1">Manage corridor operations and agent performance.</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Active Agents', value: '62', change: '+4 this month' },
              { label: 'Active Listings', value: '12', change: 'Across 9 states' },
              { label: 'Destinations', value: '12', change: '700.3 km corridor' },
              { label: 'Verified Plots', value: '8,790+', change: 'Title-checked' },
            ].map(({ label, value, change }) => (
              <div key={label} className="bg-ink border border-paper/10 rounded-lg p-5">
                <div className="text-[11px] font-mono uppercase tracking-widest text-paper/40 mb-2">{label}</div>
                <div className="text-2xl font-serif font-light text-paper">{value}</div>
                <div className="text-[11px] text-paper/40 mt-1">{change}</div>
              </div>
            ))}
          </div>

          {/* Coming soon notice */}
          <div className="bg-ink border border-gold/20 rounded-lg p-8 text-center">
            <Compass className="w-10 h-10 text-gold/40 mx-auto mb-4" />
            <div className="font-mono text-[11px] uppercase tracking-widest text-gold mb-2">Operator Tools</div>
            <h2 className="font-serif text-xl font-light mb-2">Full operator dashboard coming soon</h2>
            <p className="text-paper/40 text-[13px] max-w-md mx-auto">
              Destination management, agent oversight, listing verification workflows, and corridor analytics are being built out.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
