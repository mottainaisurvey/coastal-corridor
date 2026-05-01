'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Filter, UserCheck, UserX, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';

const ADMIN_ROLES = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'];

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: 'bg-sage/10 text-sage border border-sage/20',
  PENDING_VERIFICATION: 'bg-ochre/10 text-ochre border border-ochre/20',
  SUSPENDED: 'bg-laterite/10 text-laterite border border-laterite/20',
  CLOSED: 'bg-ink/10 text-ink/50 border border-ink/20',
};

const ROLE_COLOURS: Record<string, string> = {
  BUYER: 'bg-ocean/10 text-ocean border border-ocean/20',
  AGENT: 'bg-laterite/10 text-laterite border border-laterite/20',
  DEVELOPER: 'bg-ochre/10 text-ochre border border-ochre/20',
  ADMIN: 'bg-ink/10 text-ink border border-ink/20',
  GOVERNMENT: 'bg-sage/10 text-sage border border-sage/20',
  VERIFIER: 'bg-ocean/10 text-ocean border border-ocean/20',
  TOUR_OPERATOR: 'bg-ochre/10 text-ochre border border-ochre/20',
};

export default function AdminUsersPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const role = (user?.publicMetadata?.role as string) || '';
  const isAdmin = ADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isAdmin) router.replace('/unauthorized?required=admin');
  }, [isLoaded, user, isAdmin, router]);

  useEffect(() => {
    if (!userId || !isAdmin) return;
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(search && { search }),
          ...(roleFilter !== 'ALL' && { role: roleFilter }),
          ...(statusFilter !== 'ALL' && { status: statusFilter }),
        });
        const res = await fetch(`/api/admin/users?${params}`);
        if (res.ok) {
          const data = await res.json();
          setUsers(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [userId, isAdmin, page, search, roleFilter, statusFilter]);

  if (!isLoaded || !user) return (
    <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>
  );
  if (!isAdmin) {
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
        <div className="max-w-6xl mx-auto">

          {/* Back nav */}
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">
              User Management
            </h1>
            <p className="text-ink/60 text-[16px]">View, search, and manage all platform users</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50"
            >
              <option value="ALL">All Roles</option>
              <option value="BUYER">Buyer</option>
              <option value="AGENT">Agent</option>
              <option value="DEVELOPER">Developer</option>
              <option value="ADMIN">Admin</option>
              <option value="VERIFIER">Verifier</option>
              <option value="GOVERNMENT">Government</option>
            </select>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_VERIFICATION">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-ink/10 flex items-center justify-between">
              <span className="text-sm text-ink/60">{total} user{total !== 1 ? 's' : ''} found</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-ink/40 text-sm">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">No users match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-paper/50">
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">User</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Role</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Status</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">Joined</th>
                      <th className="text-left px-6 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">KYC</th>
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
                          <span className={`px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${STATUS_COLOURS[u.status] || 'bg-ink/10 text-ink/50'}`}>
                            {u.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-ink/50 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          {u.kycStatus === 'VERIFIED' ? (
                            <UserCheck className="h-4 w-4 text-sage" />
                          ) : (
                            <UserX className="h-4 w-4 text-ink/20" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-ink/10 flex items-center justify-between">
                <span className="text-xs text-ink/40">Page {page} of {totalPages}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-sm border border-ink/15 disabled:opacity-30 hover:bg-paper transition-colors"
                  >
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
