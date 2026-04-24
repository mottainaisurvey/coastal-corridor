'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, MapPin, ArrowLeft, MessageSquare } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-ocean/10 text-ocean',
  CONTACTED: 'bg-ochre/10 text-ochre',
  VIEWING_SCHEDULED: 'bg-laterite/10 text-laterite',
  NEGOTIATING: 'bg-success/10 text-success',
  CONVERTED: 'bg-success/20 text-success',
  CLOSED_LOST: 'bg-ink/10 text-ink/50',
};

export default function BuyerInquiriesPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/buyer/inquiries')
      .then((r) => r.json())
      .then((d) => setInquiries(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-24">
        <div className="max-w-4xl mx-auto">

          <div className="mb-10">
            <Link href="/account" className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-6">
              <ArrowLeft className="h-4 w-4" /> Back to account
            </Link>
            <div className="eyebrow mb-3">Account</div>
            <h1 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light">
              My Inquiries
            </h1>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse">
                  <div className="h-5 bg-ink/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-ink/10 rounded w-2/3" />
                </div>
              ))}
            </div>
          )}

          {!loading && inquiries.length === 0 && (
            <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
              <MessageSquare className="h-10 w-10 text-ink/20 mx-auto mb-4" />
              <h3 className="font-serif text-[22px] font-light mb-2">No inquiries yet</h3>
              <p className="text-ink/50 mb-6 text-sm">Browse listings and submit an inquiry to get started.</p>
              <Link href="/properties" className="btn-primary">Browse properties</Link>
            </div>
          )}

          {!loading && inquiries.length > 0 && (
            <div className="space-y-4">
              {inquiries.map((inq: any) => {
                const property = inq.listing?.property;
                const destination = property?.plot?.destination;
                return (
                  <div key={inq.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="font-serif text-[18px] font-light mb-1">
                          {property?.title || 'Property Inquiry'}
                        </h3>
                        {destination && (
                          <div className="flex items-center gap-1 text-sm text-ink/50">
                            <MapPin className="h-3.5 w-3.5" /> {destination.name}, {destination.state}
                          </div>
                        )}
                      </div>
                      <span className={`flex-shrink-0 inline-block px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase ${STATUS_STYLES[inq.status] || 'bg-ink/10 text-ink/50'}`}>
                        {inq.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-sm text-ink/60 mb-4 line-clamp-2">{inq.message}</p>

                    <div className="flex items-center justify-between text-[12px] text-ink/40 pt-3 border-t border-ink/8">
                      <span>Submitted {new Date(inq.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {inq.listing && (
                        <Link href={`/properties/${inq.listing.id}`} className="text-ocean hover:text-ocean/80 transition-colors font-medium">
                          View listing →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
