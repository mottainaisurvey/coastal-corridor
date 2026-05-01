'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, MessageSquare, Home, TrendingUp, Calendar, BadgeCheck } from 'lucide-react';

const AGENT_ROLES = ['agent', 'AGENT', 'admin', 'superadmin', 'ADMIN'];

export default function AgentDashboard() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentInquiries, setRecentInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use sessionClaims first (available immediately from JWT), fall back to user.publicMetadata
  const role = ((sessionClaims?.publicMetadata as any)?.role as string) || (user?.publicMetadata?.role as string) || '';
  const isAgent = AGENT_ROLES.includes(role);

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace('/');
    }
  }, [isLoaded, userId, router]);

  // Redirect users without agent role — only redirect when role is confirmed loaded
  useEffect(() => {
    if (isLoaded && userId && role && !isAgent) {
      router.replace('/unauthorized?required=agent');
    }
  }, [isLoaded, userId, role, isAgent, router]);

  useEffect(() => {
    if (!userId || !isAgent) return;

    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch(`/api/agent/stats?userId=${userId}`);
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        const inquiriesRes = await fetch(`/api/agent/inquiries?userId=${userId}&limit=10`);
        if (inquiriesRes.ok) {
          const inquiriesData = await inquiriesRes.json();
          setRecentInquiries(inquiriesData.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId, isAgent]);

  if (!isLoaded || !user) {
    return (
      <div className="container-x py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-ink/10 rounded w-24" />
          <div className="h-10 bg-ink/10 rounded w-1/3" />
          <div className="h-4 bg-ink/10 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!isAgent) return null;

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-24">
        <div className="max-w-6xl mx-auto">

          {/* Header row */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="eyebrow mb-4">Agent Dashboard</div>
              <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-2 font-light">
                Welcome, {user.firstName || 'Agent'}
              </h1>
              <p className="text-[18px] text-ink/75">Manage your listings, inquiries, and performance</p>
            </div>
            {/* Role badge + sign-out */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider bg-ocean/10 text-ocean border border-ocean/20">
                <BadgeCheck className="h-3.5 w-3.5" />
                Agent
              </div>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>

          {/* Stats Grid */}
          {stats && (
            <div className="grid md:grid-cols-4 gap-6 mb-12">
              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Active Listings</div>
                    <div className="font-serif text-[32px] font-medium">{stats.activeListings || 0}</div>
                  </div>
                  <Home className="h-8 w-8 text-ocean/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Total Views</div>
                    <div className="font-serif text-[32px] font-medium">{stats.totalViews || 0}</div>
                  </div>
                  <Eye className="h-8 w-8 text-ocean/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">New Inquiries</div>
                    <div className="font-serif text-[32px] font-medium">{stats.newInquiries || 0}</div>
                  </div>
                  <MessageSquare className="h-8 w-8 text-laterite/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Conversion Rate</div>
                    <div className="font-serif text-[32px] font-medium">{stats.conversionRate || '0'}%</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-sage/30" />
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Link href="/agent/listings" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <h3 className="font-serif text-[20px] font-light mb-2">Manage Listings</h3>
              <p className="text-ink/60 text-sm mb-4">Create, edit, and manage your property listings</p>
              <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
            </Link>

            <Link href="/agent/inquiries" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <h3 className="font-serif text-[20px] font-light mb-2">Inquiries</h3>
              <p className="text-ink/60 text-sm mb-4">Respond to buyer inquiries and schedule viewings</p>
              <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
            </Link>

            <Link href="/agent/profile" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <h3 className="font-serif text-[20px] font-light mb-2">Profile Settings</h3>
              <p className="text-ink/60 text-sm mb-4">Update your agent profile and credentials</p>
              <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
            </Link>
          </div>

          {/* Recent Inquiries */}
          {recentInquiries.length > 0 && (
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
              <h2 className="font-serif text-[24px] font-light mb-6">Recent Inquiries</h2>
              <div className="space-y-4">
                {recentInquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    className="flex items-start justify-between pb-4 border-b border-ink/10 last:border-b-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-ink mb-1">{inquiry.listing?.property?.title}</h3>
                      <p className="text-sm text-ink/60 mb-2">{inquiry.message}</p>
                      <div className="flex items-center gap-4 text-xs text-ink/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(inquiry.createdAt).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-ochre/10 text-ochre rounded-sm">{inquiry.status}</span>
                      </div>
                    </div>
                    <Link
                      href={`/agent/inquiries/${inquiry.id}`}
                      className="text-ocean hover:text-ocean-2 transition-colors text-sm font-medium"
                    >
                      View
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
