'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Home, MessageSquare, TrendingUp, PlusCircle, ArrowRight } from 'lucide-react';

interface DevStats {
  totalProjects: number;
  totalListings: number;
  totalInquiries: number;
  totalViews: number;
  recentInquiries: any[];
  recentProjects: any[];
}

export default function DeveloperDashboard() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<DevStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/developer/stats')
      .then((r) => r.json())
      .then((d) => setStats(d.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  if (!isLoaded || !user) {
    return (
      <div className="container-x py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-ink/10 rounded w-24" />
          <div className="h-10 bg-ink/10 rounded w-1/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <div className="eyebrow mb-3">Developer Portal</div>
            <h1 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light mb-2">
              Welcome back{user.firstName ? `, ${user.firstName}` : ''}
            </h1>
            <p className="text-[16px] text-ink/60">
              Manage your projects, listings, and buyer inquiries.
            </p>
          </div>

          {/* Stats */}
          {!loading && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { label: 'Projects', value: stats.totalProjects, icon: Building2, color: 'text-ocean' },
                { label: 'Active Listings', value: stats.totalListings, icon: Home, color: 'text-laterite' },
                { label: 'Inquiries', value: stats.totalInquiries, icon: MessageSquare, color: 'text-ochre' },
                { label: 'Total Views', value: stats.totalViews, icon: TrendingUp, color: 'text-success' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white border border-ink/10 rounded-lg p-5 shadow-card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="eyebrow text-[10px]">{label}</div>
                    <Icon className={`h-5 w-5 ${color} opacity-40`} />
                  </div>
                  <div className="font-serif text-[28px] font-medium">{value ?? 0}</div>
                </div>
              ))}
            </div>
          )}

          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[1,2,3,4].map((i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-5 animate-pulse">
                  <div className="h-3 bg-ink/10 rounded w-16 mb-3" />
                  <div className="h-8 bg-ink/10 rounded w-12" />
                </div>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <Link href="/developer/projects/new" className="bg-ocean text-white rounded-lg p-6 hover:bg-ocean/90 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-1">Add New Project</h3>
                  <p className="text-white/70 text-sm">List a new development project on the platform</p>
                </div>
                <PlusCircle className="h-6 w-6 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium">
                Get started <ArrowRight className="h-4 w-4" />
              </div>
            </Link>

            <Link href="/developer/projects" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-1">View All Projects</h3>
                  <p className="text-ink/60 text-sm">Manage listings, pricing, and availability</p>
                </div>
                <Building2 className="h-6 w-6 text-ink/20 group-hover:text-ink/40 transition-colors" />
              </div>
              <div className="flex items-center gap-1 text-sm text-ocean font-medium">
                Open projects <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </div>

          {/* Recent inquiries */}
          {stats && stats.recentInquiries && stats.recentInquiries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="eyebrow">Recent Inquiries</div>
              </div>
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/8">
                      <th className="text-left px-5 py-3 text-ink/50 font-normal text-[11px] uppercase tracking-wider">Buyer</th>
                      <th className="text-left px-5 py-3 text-ink/50 font-normal text-[11px] uppercase tracking-wider">Property</th>
                      <th className="text-left px-5 py-3 text-ink/50 font-normal text-[11px] uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3 text-ink/50 font-normal text-[11px] uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentInquiries.map((inq: any) => (
                      <tr key={inq.id} className="border-b border-ink/5 last:border-0 hover:bg-paper transition-colors">
                        <td className="px-5 py-3 font-medium">{inq.buyerName || inq.user?.email || '—'}</td>
                        <td className="px-5 py-3 text-ink/60">{inq.listing?.property?.title || '—'}</td>
                        <td className="px-5 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase bg-ocean/10 text-ocean">
                            {inq.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-ink/50">
                          {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && stats && stats.totalProjects === 0 && (
            <div className="text-center py-16 border border-dashed border-ink/20 rounded-lg">
              <Building2 className="h-10 w-10 text-ink/20 mx-auto mb-4" />
              <h3 className="font-serif text-[22px] font-light mb-2">No projects yet</h3>
              <p className="text-ink/50 mb-6 text-sm">Add your first development project to start receiving inquiries.</p>
              <Link href="/developer/projects/new" className="btn-primary">
                Add your first project
              </Link>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
