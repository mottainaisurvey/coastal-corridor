'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Activity, Search, ChevronLeft, ChevronRight, Eye, Edit, Trash2, Plus } from 'lucide-react';

const SUPERADMIN_ROLES = ['superadmin', 'SUPERADMIN'];

const ACTION_COLOURS: Record<string, string> = {
  create: 'bg-sage/10 text-sage border border-sage/20',
  update: 'bg-ocean/10 text-ocean border border-ocean/20',
  delete: 'bg-laterite/10 text-laterite border border-laterite/20',
  view: 'bg-ink/10 text-ink/50 border border-ink/20',
};

const ACTION_ICONS: Record<string, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  view: Eye,
};

export default function AdminAuditPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 30;

  const role = (user?.publicMetadata?.role as string) || '';
  const isSuperadmin = SUPERADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isSuperadmin) router.replace('/unauthorized?required=superadmin');
  }, [isLoaded, user, isSuperadmin, router]);

  useEffect(() => {
    if (!userId || !isSuperadmin) return;
    const fetchAudit = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(page), limit: String(PAGE_SIZE),
          ...(search && { search }),
          ...(actionFilter !== 'ALL' && { action: actionFilter }),
          ...(entityFilter !== 'ALL' && { entityType: entityFilter }),
        });
        const res = await fetch(`/api/admin/audit?${params}`);
        if (res.ok) {
          const data = await res.json();
          setEntries(data.data || []);
          setTotal(data.total || 0);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAudit();
  }, [userId, isSuperadmin, page, search, actionFilter, entityFilter]);

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isSuperadmin) return null;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-6xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ochre/10 border border-ochre/20 rounded-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-ochre" />
            <span className="text-xs font-mono uppercase tracking-wider text-ochre">Superadmin Only</span>
          </div>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Audit Log</h1>
            <p className="text-ink/60 text-[16px]">Complete immutable record of all platform actions, role changes, and data modifications</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink/30" />
              <input type="text" placeholder="Search by entity ID or user..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ochre/50" />
            </div>
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ochre/50">
              <option value="ALL">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="view">View</option>
            </select>
            <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 bg-white border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ochre/50">
              <option value="ALL">All Entities</option>
              <option value="User">User</option>
              <option value="Listing">Listing</option>
              <option value="Transaction">Transaction</option>
              <option value="Plot">Plot</option>
              <option value="AgentProfile">Agent Profile</option>
              <option value="Config">Config</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
              <Activity className="h-4 w-4 text-ink/30" />
              <span className="text-sm text-ink/60">{total} audit entr{total !== 1 ? 'ies' : 'y'}</span>
            </div>

            {loading ? (
              <div className="p-8 text-center text-ink/40 text-sm">Loading audit log...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-ink/40 text-sm">No audit entries match your filters.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/10 bg-paper/50">
                      {['Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP'].map(h => (
                        <th key={h} className="text-left px-5 py-3 font-mono text-[11px] uppercase tracking-wider text-ink/40">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/5">
                    {entries.map((e: any) => {
                      const ActionIcon = ACTION_ICONS[e.action] || Activity;
                      return (
                        <tr key={e.id} className="hover:bg-paper/40 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-ink/50 whitespace-nowrap">
                            {new Date(e.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3">
                            <div className="text-ink/70 text-xs">{e.user?.email || 'System'}</div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[11px] font-mono uppercase ${ACTION_COLOURS[e.action] || 'bg-ink/10 text-ink/50'}`}>
                              <ActionIcon className="h-3 w-3" />
                              {e.action}
                            </span>
                          </td>
                          <td className="px-5 py-3 font-mono text-xs text-ink/60">{e.entityType}</td>
                          <td className="px-5 py-3 font-mono text-xs text-ink/40">{e.entityId?.slice(0, 12)}...</td>
                          <td className="px-5 py-3 font-mono text-xs text-ink/30">{e.ipAddress || '—'}</td>
                        </tr>
                      );
                    })}
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
