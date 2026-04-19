'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Home, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

export default function AdminDashboard() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) {
      redirect('/');
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchAdminStats = async () => {
      try {
        const res = await fetch(`/api/admin/stats`);
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
  }, [userId]);

  if (!isLoaded || !user) {
    return (
      <div className="container-x py-24">
        <div className="animate-pulse">
          <div className="h-8 bg-ink/10 rounded w-1/3 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-24">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="eyebrow mb-4">Admin Console</div>
            <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-2 font-light">
              Platform Overview
            </h1>
            <p className="text-[18px] text-ink/75">Manage users, listings, and platform operations</p>
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

          {/* Management Sections */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Link
              href="/admin/users"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">User Management</h3>
                  <p className="text-ink/60 text-sm">View, manage, and verify user accounts</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/admin/verification"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Verification Queue</h3>
                  <p className="text-ink/60 text-sm">Review and approve agent and property verifications</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/admin/listings"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Listings Moderation</h3>
                  <p className="text-ink/60 text-sm">Review and moderate property listings</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/admin/transactions"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Transactions</h3>
                  <p className="text-ink/60 text-sm">Monitor and reconcile financial transactions</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/admin/disputes"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Disputes</h3>
                  <p className="text-ink/60 text-sm">Handle and resolve user disputes</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2">Analytics</h3>
                  <p className="text-ink/60 text-sm">View platform metrics and performance data</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
