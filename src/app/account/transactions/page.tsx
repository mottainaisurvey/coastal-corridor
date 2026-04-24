'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, MapPin, ArrowLeft } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  INITIATED: 'bg-ocean/10 text-ocean',
  ESCROW_FUNDED: 'bg-ochre/10 text-ochre',
  DOCUMENTS_REVIEW: 'bg-laterite/10 text-laterite',
  AWAITING_GOVT_CONSENT: 'bg-ochre/10 text-ochre',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-ink/10 text-ink/50',
  DISPUTED: 'bg-laterite/10 text-laterite',
};

export default function BuyerTransactionsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/buyer/transactions')
      .then((r) => r.json())
      .then((d) => setTransactions(d.data || []))
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
              Transactions
            </h1>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1,2].map((i) => (
                <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse">
                  <div className="h-5 bg-ink/10 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-ink/10 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!loading && transactions.length === 0 && (
            <div className="text-center py-20 border border-dashed border-ink/20 rounded-lg">
              <CreditCard className="h-10 w-10 text-ink/20 mx-auto mb-4" />
              <h3 className="font-serif text-[22px] font-light mb-2">No transactions yet</h3>
              <p className="text-ink/50 text-sm">Completed property transactions will appear here.</p>
            </div>
          )}

          {!loading && transactions.length > 0 && (
            <div className="space-y-4">
              {transactions.map((txn: any) => {
                const property = txn.listing?.property;
                const destination = property?.plot?.destination;
                return (
                  <div key={txn.id} className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="text-[11px] font-mono text-ink/40 mb-1">Ref: {txn.reference}</div>
                        <h3 className="font-serif text-[18px] font-light mb-1">
                          {property?.title || 'Property Transaction'}
                        </h3>
                        {destination && (
                          <div className="flex items-center gap-1 text-sm text-ink/50">
                            <MapPin className="h-3.5 w-3.5" /> {destination.name}, {destination.state}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className={`inline-block px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase mb-2 ${STATUS_STYLES[txn.status] || 'bg-ink/10 text-ink/50'}`}>
                          {txn.status?.replace('_', ' ')}
                        </span>
                        <div className="font-serif text-[20px] font-medium text-ocean">
                          ₦{txn.agreedPriceKobo ? (Number(txn.agreedPriceKobo) / 100).toLocaleString() : '—'}
                        </div>
                      </div>
                    </div>

                    {txn.escrowProvider && (
                      <div className="text-sm text-ink/50 mb-3">
                        Escrow: <span className="text-ink/70">{txn.escrowProvider}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[12px] text-ink/40 pt-3 border-t border-ink/8">
                      <span>Started {new Date(txn.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      {txn.completedAt && (
                        <span className="text-success">Completed {new Date(txn.completedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
