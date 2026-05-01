'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Home, TrendingUp, AlertCircle, CheckCircle, ShieldCheck, Shield } from 'lucide-react';

export default function AdminDashboard() {
  const { isLoaded, userId, sessionClaims } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Derive role from Clerk publicMetadata
  // Use sessionClaims (JWT, available immediately) with fallback to publicMetadata
  const role = ((sessionClaims?.publicMetadata as any)?.role as string) || (user?.publicMetadata?.role as string) || '';
  const isSuperAdmin = role === 'superadmin' || role === 'SUPERADMIN';
  const isAdmin = isSuperAdmin || role === 'admin' || role === 'ADMIN';
  // sessionClaims are available as soon as isLoaded=true (from JWT)
  const metadataLoaded = isLoaded;

  // Redirect unauthenticated users
  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace('/');
    }
  }, [isLoaded, userId, router]);

  // Redirect users without admin role once user data is loaded
  useEffect(() => {
    if (metadataLoaded && !isAdmin) {
      router.replace('/unauthorized?required=admin');
    }
  }, [metadataLoaded, isAdmin, router]);

  useEffect(() => {
    if (!userId || !isAdmin) return;

    const fetchAdminStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, [userId, isAdmin]);

  // Loading skeleton
  if (!isLoaded) {
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

  // Waiting for role check
  if (metadataLoaded && !isAdmin) {
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

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-24">
        <div className="max-w-6xl mx-auto">

          {/* Header row */}
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="eyebrow mb-4">Admin Console</div>
              <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-2 font-light">
                Platform Overview
              </h1>
              <p className="text-[18px] text-ink/75">Manage users, listings, and platform operations</p>
            </div>
            {/* Role badge + sign-out */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider ${
                isSuperAdmin
                  ? 'bg-laterite/10 text-laterite border border-laterite/20'
                  : 'bg-ocean/10 text-ocean border border-ocean/20'
              }`}>
                {isSuperAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                {isSuperAdmin ? 'Superadmin' : 'Admin'}
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
                    <div className="eyebrow mb-2">Total Users</div>
                    <div className="font-serif text-[32px] font-medium">{stats.totalUsers || 0}</div>
                  </div>
                  <Users className="h-8 w-8 text-ocean/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Active Listings</div>
                    <div className="font-serif text-[32px] font-medium">{stats.activeListings || 0}</div>
                  </div>
                  <Home className="h-8 w-8 text-laterite/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Pending Verification</div>
                    <div className="font-serif text-[32px] font-medium">{stats.pendingVerification || 0}</div>
                  </div>
                  <AlertCircle className="h-8 w-8 text-ochre/30" />
                </div>
              </div>

              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="eyebrow mb-2">Verified Agents</div>
                    <div className="font-serif text-[32px] font-medium">{stats.verifiedAgents || 0}</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-success/30" />
                </div>
              </div>
            </div>
          )}

          {/* Admin modules — available to both admin and superadmin */}
          <div className="mb-4">
            <div className="eyebrow mb-4 flex items-center gap-2">
              <Shield className="h-3 w-3" /> Admin Modules
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link href="/admin/users" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">User Management</h3>
                  <p className="text-ink/60 text-sm">View, manage, and verify user accounts</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link href="/admin/verification" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Verification Queue</h3>
                  <p className="text-ink/60 text-sm">Review and approve agent and property verifications</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link href="/admin/listings" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Listings Moderation</h3>
                  <p className="text-ink/60 text-sm">Review and moderate property listings</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link href="/admin/transactions" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Transactions</h3>
                  <p className="text-ink/60 text-sm">Monitor and reconcile financial transactions</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link href="/admin/disputes" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Disputes</h3>
                  <p className="text-ink/60 text-sm">Handle and resolve user disputes</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link href="/admin/analytics" className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Analytics</h3>
                  <p className="text-ink/60 text-sm">View platform metrics and performance data</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>
          </div>

          {/* Superadmin-only modules */}
          {isSuperAdmin && (
            <>
              <div className="mb-4">
                <div className="eyebrow mb-4 flex items-center gap-2 text-laterite">
                  <ShieldCheck className="h-3 w-3" /> Superadmin Modules
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/admin/roles" className="bg-white border border-laterite/20 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-[20px] font-light mb-2 text-laterite">Role Management</h3>
                      <p className="text-ink/60 text-sm">Assign and revoke admin, agent, and superadmin roles</p>
                    </div>
                    <div className="text-laterite/20 group-hover:text-laterite/40 transition-colors">→</div>
                  </div>
                </Link>

                <Link href="/admin/config" className="bg-white border border-laterite/20 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-[20px] font-light mb-2 text-laterite">Platform Config</h3>
                      <p className="text-ink/60 text-sm">Feature flags, payment settings, and system configuration</p>
                    </div>
                    <div className="text-laterite/20 group-hover:text-laterite/40 transition-colors">→</div>
                  </div>
                </Link>

                <Link href="/admin/audit" className="bg-white border border-laterite/20 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-[20px] font-light mb-2 text-laterite">Audit Log</h3>
                      <p className="text-ink/60 text-sm">Full system audit trail for all administrative actions</p>
                    </div>
                    <div className="text-laterite/20 group-hover:text-laterite/40 transition-colors">→</div>
                  </div>
                </Link>

                <Link href="/admin/integrations" className="bg-white border border-laterite/20 rounded-lg p-6 hover:shadow-card-hover transition-shadow group">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-serif text-[20px] font-light mb-2 text-laterite">Integrations</h3>
                      <p className="text-ink/60 text-sm">Manage Stripe, Postmark, KYC, and third-party integrations</p>
                    </div>
                    <div className="text-laterite/20 group-hover:text-laterite/40 transition-colors">→</div>
                  </div>
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
