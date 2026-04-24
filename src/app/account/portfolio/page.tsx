'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Share {
  id: string;
  quantity: number;
  priceKobo: string;
  currency: string;
  reference: string;
  status: string;
  purchasedAt: string;
  maturesAt: string | null;
  scheme: {
    id: string;
    name: string;
    slug: string;
    projectedYield: number;
    threeYearAppreciation: number;
    pricePerShareKobo: string;
    sharesAvailable: number;
    sharesIssued: number;
    status: string;
    destination: { name: string; state: string; type: string };
  };
}

interface Summary {
  totalInvestedKobo: string;
  totalShares: number;
  activeSchemes: number;
}

function formatNaira(kobo: string | number) {
  const n = Number(kobo) / 100;
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n);
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRANSFERRED: 'bg-blue-100 text-blue-800',
  REDEEMED: 'bg-gray-100 text-gray-600',
};

export default function PortfolioPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/fractional/portfolio')
      .then(r => r.json())
      .then(data => {
        setShares(data.shares ?? []);
        setSummary(data.summary ?? null);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading portfolio…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Investment Portfolio</h1>
            <p className="text-gray-500 mt-1">Your fractional ownership positions across the Coastal Corridor</p>
          </div>
          <Link
            href="/fractional"
            className="bg-[#1a3c5e] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a5080] transition-colors"
          >
            Browse Schemes
          </Link>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Invested</p>
              <p className="text-2xl font-bold text-gray-900">{formatNaira(summary.totalInvestedKobo)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Shares</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalShares.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Active Schemes</p>
              <p className="text-2xl font-bold text-gray-900">{summary.activeSchemes}</p>
            </div>
          </div>
        )}

        {/* Holdings */}
        {shares.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No investments yet</h3>
            <p className="text-gray-500 mb-6">Browse available fractional schemes and start building your portfolio.</p>
            <Link
              href="/fractional"
              className="bg-[#1a3c5e] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#2a5080] transition-colors"
            >
              Explore Schemes
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {shares.map(share => (
              <div key={share.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{share.scheme.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[share.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {share.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">
                      {share.scheme.destination.name}, {share.scheme.destination.state} · {share.scheme.destination.type.replace('_', ' ')}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Shares Held</p>
                        <p className="font-semibold text-gray-900">{share.quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Price per Share</p>
                        <p className="font-semibold text-gray-900">{formatNaira(share.priceKobo)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Total Value</p>
                        <p className="font-semibold text-gray-900">{formatNaira(Number(share.priceKobo) * share.quantity)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Projected Yield</p>
                        <p className="font-semibold text-green-600">{share.scheme.projectedYield}% p.a.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span>Ref: {share.reference}</span>
                  <span>
                    Purchased {new Date(share.purchasedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {share.maturesAt && ` · Matures ${new Date(share.maturesAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/account" className="text-sm text-gray-500 hover:text-gray-700">← Back to Account</Link>
        </div>
      </div>
    </div>
  );
}
