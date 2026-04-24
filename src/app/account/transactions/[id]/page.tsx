'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, CheckCircle2, Circle, Clock, AlertTriangle,
  XCircle, FileText, Banknote, Scale, Building2, ChevronRight
} from 'lucide-react';

interface Milestone {
  state: string;
  label: string;
  description: string;
  completedAt: string | null;
  isActive: boolean;
  isCompleted: boolean;
}

interface Transaction {
  id: string;
  reference: string;
  status: string;
  agreedPriceKobo: string;
  currency: string;
  escrowProvider: string | null;
  escrowReference: string | null;
  escrowFundedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  buyer: { email: string };
  listing: {
    property: { title: string; plotId: string; propertyType: string } | null;
    owner: { email: string } | null;
  } | null;
  payments: Array<{
    id: string;
    provider: string;
    amountKobo: string;
    currency: string;
    status: string;
    method: string | null;
    processedAt: string | null;
  }>;
}

interface AvailableTransition {
  to: string;
  label: string;
  description: string;
}

function formatKobo(kobo: string, currency: string) {
  const amount = parseInt(kobo) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency === 'NGN' ? 'NGN' : currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(d: string | null) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-slate-100 text-slate-700',
  ESCROW_FUNDED: 'bg-blue-100 text-blue-700',
  DOCUMENTS_REVIEW: 'bg-amber-100 text-amber-700',
  AWAITING_GOVT_CONSENT: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
  DISPUTED: 'bg-orange-100 text-orange-700',
};

const TRANSITION_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  ESCROW_FUNDED: 'bg-blue-600 hover:bg-blue-700 text-white',
  DOCUMENTS_REVIEW: 'bg-amber-600 hover:bg-amber-700 text-white',
  AWAITING_GOVT_CONSENT: 'bg-purple-600 hover:bg-purple-700 text-white',
  CANCELLED: 'bg-red-100 hover:bg-red-200 text-red-700 border border-red-300',
  DISPUTED: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-300',
};

export default function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<{
    transaction: Transaction;
    milestones: Milestone[];
    availableTransitions: AvailableTransition[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/escrow/${id}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { router.replace('/account/transactions'); });
  }, [id, router]);

  async function handleTransition(toState: string) {
    setTransitioning(toState);
    try {
      const res = await fetch(`/api/escrow/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toState, note: note || undefined }),
      });
      if (res.ok) {
        const updated = await fetch(`/api/escrow/${id}`).then(r => r.json());
        setData(updated);
        setNote('');
        setShowNoteFor(null);
      }
    } finally {
      setTransitioning(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#8B4513] border-t-transparent" />
      </div>
    );
  }

  if (!data) return null;

  const { transaction: txn, milestones, availableTransitions } = data;
  const isTerminal = ['COMPLETED', 'CANCELLED', 'DISPUTED'].includes(txn.status);

  return (
    <div className="min-h-screen bg-[#f7f5f0]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/account/transactions" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Transactions
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Transaction Detail</h1>
              <p className="text-slate-500 font-mono text-sm mt-1">{txn.reference}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[txn.status] ?? 'bg-slate-100 text-slate-700'}`}>
              {txn.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* Escrow Timeline */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-6">Escrow Timeline</h2>
              <div className="space-y-0">
                {milestones.map((m, i) => (
                  <div key={m.state} className="flex gap-4">
                    {/* Icon column */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        m.isCompleted ? 'bg-emerald-100' :
                        m.isActive ? 'bg-[#8B4513]/10 border-2 border-[#8B4513]' :
                        'bg-slate-100'
                      }`}>
                        {m.isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : m.isActive ? (
                          <Clock className="w-4 h-4 text-[#8B4513]" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      {i < milestones.length - 1 && (
                        <div className={`w-0.5 h-12 mt-1 ${m.isCompleted ? 'bg-emerald-200' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-8 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className={`font-medium text-sm ${m.isActive ? 'text-[#8B4513]' : m.isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                          {m.label}
                        </p>
                        {m.completedAt && (
                          <span className="text-xs text-slate-400">{formatDate(m.completedAt)}</span>
                        )}
                      </div>
                      <p className={`text-xs mt-0.5 ${m.isActive || m.isCompleted ? 'text-slate-500' : 'text-slate-300'}`}>
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Disputed / Cancelled state */}
                {txn.status === 'DISPUTED' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-orange-100">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-orange-700">Dispute Raised</p>
                      <p className="text-xs text-slate-500 mt-0.5">Transaction paused. Admin review in progress.</p>
                    </div>
                  </div>
                )}
                {txn.status === 'CANCELLED' && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100">
                        <XCircle className="w-4 h-4 text-red-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-red-700">Cancelled</p>
                      {txn.cancelReason && (
                        <p className="text-xs text-slate-500 mt-0.5">{txn.cancelReason}</p>
                      )}
                      {txn.cancelledAt && (
                        <p className="text-xs text-slate-400 mt-0.5">{formatDate(txn.cancelledAt)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            {!isTerminal && availableTransitions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Available Actions</h2>
                <div className="space-y-3">
                  {availableTransitions.map(t => (
                    <div key={t.to}>
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{t.label}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                        </div>
                        <button
                          onClick={() => setShowNoteFor(showNoteFor === t.to ? null : t.to)}
                          disabled={!!transitioning}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${TRANSITION_COLORS[t.to] ?? 'bg-slate-100 text-slate-700'}`}
                        >
                          {t.label}
                        </button>
                      </div>
                      {showNoteFor === t.to && (
                        <div className="mt-3 space-y-2">
                          <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Add a note (optional)..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleTransition(t.to)}
                              disabled={!!transitioning}
                              className="px-4 py-2 bg-[#8B4513] text-white text-sm rounded-lg hover:bg-[#7a3b10] disabled:opacity-50"
                            >
                              {transitioning === t.to ? 'Processing...' : 'Confirm'}
                            </button>
                            <button
                              onClick={() => { setShowNoteFor(null); setNote(''); }}
                              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payments */}
            {txn.payments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900 mb-4">Payment History</h2>
                <div className="space-y-3">
                  {txn.payments.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800 capitalize">{p.provider}</p>
                        <p className="text-xs text-slate-400">{p.method ?? 'N/A'} · {formatDate(p.processedAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatKobo(p.amountKobo, p.currency)}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          p.status === 'successful' ? 'bg-emerald-100 text-emerald-700' :
                          p.status === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            {/* Property */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Property</h3>
              </div>
              <p className="font-medium text-slate-900 text-sm">{txn.listing?.property?.title ?? 'N/A'}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">{txn.listing?.property?.plotId}</p>
              <p className="text-xs text-slate-400 mt-1 capitalize">{txn.listing?.property?.propertyType?.replace(/_/g, ' ').toLowerCase()}</p>
            </div>

            {/* Financials */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Banknote className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Financials</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Agreed Price</span>
                  <span className="font-semibold text-slate-900">{formatKobo(txn.agreedPriceKobo, txn.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Currency</span>
                  <span className="text-slate-700">{txn.currency}</span>
                </div>
                {txn.escrowProvider && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Escrow Provider</span>
                    <span className="text-slate-700 capitalize">{txn.escrowProvider}</span>
                  </div>
                )}
                {txn.escrowReference && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Escrow Ref</span>
                    <span className="text-slate-700 font-mono text-xs">{txn.escrowReference}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Parties */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Scale className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Parties</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Buyer</p>
                  <p className="text-slate-700 truncate">{txn.buyer?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Agent / Seller</p>
                  <p className="text-slate-700 truncate">{txn.listing?.owner?.email ?? 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <Link href="/account/documents" className="flex items-center justify-between bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#8B4513]/30 transition-colors group">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">Transaction Documents</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#8B4513]" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
