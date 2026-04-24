'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Home,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  BarChart2,
  UserCog,
  Settings,
  Activity,
  Plug,
  Shield,
  ChevronRight,
} from 'lucide-react';

const ADMIN_NAV = [
  {
    section: 'Admin',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/users', label: 'Users', icon: Users },
      { href: '/admin/listings', label: 'Listings', icon: Home },
      { href: '/admin/verification', label: 'Verification', icon: ShieldCheck },
      { href: '/admin/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
      { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'Superadmin',
    superadminOnly: true,
    items: [
      { href: '/admin/roles', label: 'Role Management', icon: UserCog },
      { href: '/admin/config', label: 'Platform Config', icon: Settings },
      { href: '/admin/audit', label: 'Audit Log', icon: Activity },
      { href: '/admin/integrations', label: 'Integrations', icon: Plug },
    ],
  },
];

function AdminSidebar() {
  const { user } = useUser();
  const pathname = usePathname();

  const role = (user?.publicMetadata?.role as string) || '';
  const isSuperAdmin = role === 'superadmin' || role === 'SUPERADMIN';

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-ink text-white flex flex-col z-50 border-r border-white/10">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <span className="font-serif text-[18px] font-light tracking-tight text-white">
            Coastal Corridor
          </span>
        </Link>
        <div className="mt-1 flex items-center gap-1.5">
          {isSuperAdmin ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-laterite">
              <ShieldCheck className="h-3 w-3" /> Superadmin
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-ocean">
              <Shield className="h-3 w-3" /> Admin
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {ADMIN_NAV.map((group) => {
          if (group.superadminOnly && !isSuperAdmin) return null;

          return (
            <div key={group.section}>
              <div className={`text-[10px] font-mono uppercase tracking-widest mb-2 px-2 ${
                group.superadminOnly ? 'text-laterite/70' : 'text-white/40'
              }`}>
                {group.section}
              </div>
              <ul className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] transition-colors ${
                          active
                            ? group.superadminOnly
                              ? 'bg-laterite/20 text-laterite'
                              : 'bg-ocean/20 text-ocean'
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
            </div>
          );
        })}
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Sign-in page gets no sidebar
  if (pathname?.startsWith('/admin/sign-in')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-paper">
      <AdminSidebar />
      {/* Main content offset by sidebar width */}
      <main className="flex-1 ml-[220px] min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
