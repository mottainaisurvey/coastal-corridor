'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, UserCog, Lock, Search, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

const SUPERADMIN_ROLES = ['superadmin', 'SUPERADMIN'];

const ROLE_OPTIONS = ['BUYER', 'AGENT', 'DEVELOPER', 'ADMIN', 'VERIFIER', 'GOVERNMENT', 'TOUR_OPERATOR'];

const ROLE_COLOURS: Record<string, string> = {
  BUYER: 'bg-ocean/10 text-ocean border border-ocean/20',
  AGENT: 'bg-laterite/10 text-laterite border border-laterite/20',
  DEVELOPER: 'bg-ochre/10 text-ochre border border-ochre/20',
  ADMIN: 'bg-ink/10 text-ink border border-ink/20',
  VERIFIER: 'bg-ocean/10 text-ocean border border-ocean/20',
  GOVERNMENT: 'bg-sage/10 text-sage border border-sage/20',
  TOUR_OPERATOR: 'bg-ochre/10 text-ochre border border-ochre/20',
};

export default function AdminRolesPage() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [updating, setUpdating] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  // Use sessionClaims (JWT, available immediately) with fallback to publicMetadata
  const role = ((sessionClaims?.publicMetadata as any)?.role as string) || (user?.publicMetadata?.role as string) || '';
  const isSuperadmin = SUPERADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && userId && role && !isSuperadmin) router.replace('/unauthorized?required=superadmin');
  }, [metadataLoaded, isSuperadmin, router]);

  useEffect(() => {
    if (!userId || !isSuperadmin) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE), ...(search && { search }) });
        const res = await fetch(`/api/admin/users?${params}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchUsers();
  }, [userId, isSuperadmin, page, search]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        setSuccess(userId);
        setTimeout(() => setSuccess(null), 2000);
      }
    } catch (e) { console.error(e); }
    finally { setUpdating(null); }
  };

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (metadataLoaded && !isSuperadmin) {
  return (
    <div className="container-x py-24">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-ink/10 rounded w-24" />
        <div className="h-10 bg-ink/10 rounded w-1/3" />
        <div className="h-4 bg-ink/10 rounded w-1/2" />
        <div className="h-4 bg-ink/10 rounded w-2/3" />
      </div>
    </div>
  );
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Superadmin badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ochre/10 border border-ochre/20 rounded-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-ochre" />
            <span className="text-xs font-mono uppercase tracking-wider text-ochre">Superadmin Only</span>
          </div>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Role Management</h1>
            <p className="text-ink/60 text-[16px]">Assign and modify user roles across the platform. Only superadmins can perform these actions.</p>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 bg-laterite/5 border border-laterite/15 rounded-lg mb-8">
            <Lock className="h-5 w-5 text-laterite/60 shrink-0 mt-0.5" />
            <p className="text-sm text-ink/70">
              Role changes take effect immediately. Elevating a user to <strong>ADMIN</strong> grants access to the admin console.
              All role changes are recorded in the audit log.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
            <input type="text" placeholder="Search by email or name..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ochre/50 focus:ring-2 focus:ring-ochre/10" />
          </div>

          {/* Table */}
          <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
              <UserCog className="h-4 w-4 text-ink/30" />
              <span className="text-sm text-ink/60">{total} user{total !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-ink/40 text-sm">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-paper/50">
                      {['User', 'Current Role', 'Change Role', 'Joined'].map(h => (
                        <th key={h} className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {users.map((u: any) => (
                      <tr key={u.id} className="hover:bg-paper/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-ink">{u.profile?.firstName} {u.profile?.lastName}</div>
                          <div className="text-ink/50 text-xs">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${ROLE_COLOURS[u.role] || 'bg-ink/10 text-ink/50'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={e => handleRoleChange(u.id, e.target.value)}
                              disabled={updating === u.id}
                              className="px-2 py-1.5 bg-white border border-ink/15 rounded-sm text-xs focus:outline-none focus:border-ochre/50 disabled:opacity-50"
                            >
                              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                            {success === u.id && <CheckCircle className="h-4 w-4 text-sage" />}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-ink/50 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-between">
                <span className="text-xs text-ink/40">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
