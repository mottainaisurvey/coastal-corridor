'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Home,
  MessageSquare,
  User,
  ChevronRight,
  Star,
} from 'lucide-react';

const AGENT_NAV = [
  { href: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/agent/listings', label: 'My Listings', icon: Home },
  { href: '/agent/inquiries', label: 'Inquiries', icon: MessageSquare },
  { href: '/agent/profile', label: 'Profile', icon: User },
];

function AgentSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-ink text-white flex flex-col z-50 border-r border-white/10">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/agent/dashboard" className="flex items-center gap-2">
          <span className="font-serif text-[18px] font-light tracking-tight text-white">
            Coastal Corridor
          </span>
        </Link>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-laterite">
            <Star className="h-3 w-3" /> Agent Portal
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="text-[10px] font-mono uppercase tracking-widest mb-2 px-2 text-white/40">
          My Dashboard
        </div>
        <ul className="space-y-0.5">
          {AGENT_NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                    active
                      ? 'bg-laterite/20 text-laterite'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                  {active && <ChevronRight className="h-3 w-3 ml-auto opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Back to main site */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-white/10 flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] text-white/80 truncate">
            {user?.primaryEmailAddress?.emailAddress || ''}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Marketing landing page, sign-in, sign-up — no sidebar
  const noSidebarPaths = ['/agent', '/agent/sign-in', '/agent/sign-up'];
  if (noSidebarPaths.some((p) => pathname === p || pathname?.startsWith(p + '/'))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AgentSidebar />
      <main className="flex-1 ml-[220px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
