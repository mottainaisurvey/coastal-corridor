'use client';

import { useAuth } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Eye, MessageSquare } from 'lucide-react';
import { formatKobo } from '@/lib/utils';

export default function AgentListings() {
  const { isLoaded, userId } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) {
      redirect('/');
    }
  }, [isLoaded, userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchListings = async () => {
      try {
        const res = await fetch(`/api/agent/listings?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setListings(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch listings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [userId]);

  if (!isLoaded) {
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
          <div className="flex items-start justify-between mb-12">
            <div>
              <div className="eyebrow mb-4">Agent Dashboard</div>
              <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-2 font-light">
                My Listings
              </h1>
              <p className="text-[18px] text-ink/75">Manage your active property listings</p>
            </div>
            <Link href="/agent/listings/new" className="btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Listing
            </Link>
          </div>

          {/* Listings Table */}
          {loading ? (
            <div className="bg-white border border-ink/10 rounded-lg p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-ink/10 rounded w-1/4 mx-auto"></div>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-white border border-ink/10 rounded-lg p-12 text-center">
              <h3 className="font-serif text-[24px] font-light mb-2">No listings yet</h3>
              <p className="text-ink/60 mb-6">Create your first listing to get started</p>
              <Link href="/agent/listings/new" className="btn-primary">
                Create Listing
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-ink/10 rounded-lg shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-paper border-b border-ink/10">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Property</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Price</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Views</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Inquiries</th>
                      <th className="px-6 py-4 text-left text-sm font-medium text-ink/60">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listings.map((listing) => (
                      <tr key={listing.id} className="border-b border-ink/10 hover:bg-paper/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-ink">{listing.property?.title}</div>
                            <div className="text-sm text-ink/60">{listing.property?.plot?.destination?.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-sm text-xs font-medium ${
                            listing.status === 'ACTIVE'
                              ? 'bg-success/15 text-success'
                              : 'bg-ochre/15 text-ochre'
                          }`}>
                            {listing.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-serif font-medium">{formatKobo(listing.askingPriceKobo)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-ink/60">
                            <Eye className="h-4 w-4" />
                            {listing.viewCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 text-ink/60">
                            <MessageSquare className="h-4 w-4" />
                            {listing.inquiryCount}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/agent/listings/${listing.id}/edit`}
                              className="p-2 hover:bg-ink/5 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4 text-ink/60" />
                            </Link>
                            <button
                              onClick={() => {
                                if (confirm('Delete this listing?')) {
                                  // Delete action
                                }
                              }}
                              className="p-2 hover:bg-alert/5 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-alert/60" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
