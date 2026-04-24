'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, ArrowLeft, Trash2 } from 'lucide-react';

export default function SavedPropertiesPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/buyer/saved')
      .then((r) => r.json())
      .then((d) => setSaved(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRemove = async (savedPlotId: string) => {
    setRemoving(savedPlotId);
    try {
      await fetch(`/api/buyer/saved?id=${savedPlotId}`, { method: 'DELETE' });
      setSaved((prev) => prev.filter((s) => s.id !== savedPlotId));
    } catch (e) {
      console.error(e);
    } finally {
      setRemoving(null);
    }
  };

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
              Saved Properties
            </h1>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2,3].map((i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse">
                  <div className="h-5 bg-ink/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-ink/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && saved.length === 0 && (
            <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
              <Heart className="h-10 w-10 text-ink/20 mx-auto mb-4" />
              <h3 className="font-serif text-[22px] font-light mb-2">No saved properties</h3>
              <p className="text-ink/50 mb-6 text-sm">Browse listings and save the ones you are interested in.</p>
              <Link href="/properties" className="btn-primary">Browse properties</Link>
            </div>
          )}

          {!loading && saved.length > 0 && (
            <div className="space-y-4">
              {saved.map((item: any) => {
                const plot = item.plot;
                const listing = plot?.listings?.[0];
                const property = listing?.property;
                return (
                  <div key={item.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-serif text-[18px] font-light mb-1">
                        {property?.title || `Plot ${plot?.plotNumber}`}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-ink/50 mb-2">
                        {plot?.destination && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" /> {plot.destination.name}, {plot.destination.state}
                          </span>
                        )}
                        {plot?.sizeHectares && (
                          <span>{plot.sizeHectares} ha</span>
                        )}
                      </div>
                      {item.note && (
                        <p className="text-sm text-ink/60 italic">"{item.note}"</p>
                      )}
                      {listing && (
                        <div className="mt-3">
                          <span className="font-serif text-[18px] font-medium text-ocean">
                            ₦{listing.askingPriceKobo ? (Number(listing.askingPriceKobo) / 100).toLocaleString() : '—'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      {listing && (
                        <Link href={`/properties/${listing.id}`} className="btn-secondary !py-1.5 !px-3 text-sm">
                          View listing
                        </Link>
                      )}
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing === item.id}
                        className="flex items-center gap-1 text-sm text-laterite/70 hover:text-laterite transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {removing === item.id ? 'Removing…' : 'Remove'}
                      </button>
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
