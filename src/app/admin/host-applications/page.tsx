'use client';

/**
 * /admin/host-applications
 *
 * CC-C-08-D-2 — AC-4: Admin admit UI for host applications.
 *
 * Displays all OperatorApplication records where path = "host" or "both",
 * with status filter (ALL / PENDING / REVIEWING / ACCEPTED / DECLINED),
 * application detail cards, and admit/reject modals.
 *
 * Admit flow:
 *   1. Admin opens application card → clicks "Admit as Host"
 *   2. Modal shows applicant details + cohortMember toggle + adminNotes field
 *   3. On confirm → POST /api/admin/host-applications/[id]/approve
 *      → server issues Clerk invitation with publicMetadata { role: "HOST", applicationId }
 *      → server updates OperatorApplication.status = "ACCEPTED", stores clerkInviteId
 *   4. On reject → POST /api/admin/host-applications/[id]/reject
 *      → server updates OperatorApplication.status = "DECLINED"
 *
 * Authentication: Admin/Superadmin only (middleware enforces this)
 */

import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  Home,
  Users,
  AlertCircle,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

type AppStatus = 'PENDING' | 'REVIEWING' | 'ACCEPTED' | 'DECLINED';

interface HostApplication {
  id: string;
  path: string;
  fullName: string;
  businessName: string | null;
  email: string;
  phone: string;
  corridorLocation: string;
  countryOfResidence: string;
  propertyType: string | null;
  numberOfRooms: number | null;
  currentlyListedOn: string | null;
  aboutOperation: string;
  whyCoastalCorridor: string | null;
  additionalInfo: string | null;
  status: AppStatus;
  cohortMember: boolean;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  clerkInviteId: string | null;
  createdAt: string;
}

interface AppsResponse {
  applications: HostApplication[];
  total: number;
  counts: Record<AppStatus | 'ALL', number>;
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppStatus }) {
  const map: Record<AppStatus, { label: string; className: string }> = {
    PENDING:   { label: 'Pending',   className: 'bg-amber-100 text-amber-800' },
    REVIEWING: { label: 'Reviewing', className: 'bg-blue-100 text-blue-800' },
    ACCEPTED:  { label: 'Accepted',  className: 'bg-green-100 text-green-800' },
    DECLINED:  { label: 'Declined',  className: 'bg-red-100 text-red-800' },
  };
  const { label, className } = map[status] ?? { label: status, className: 'bg-gray-100 text-gray-800' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium ${className}`}>
      {label}
    </span>
  );
}

// ── Admit modal ────────────────────────────────────────────────────────────

function AdmitModal({
  app,
  onClose,
  onSuccess,
}: {
  app: HostApplication;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [cohortMember, setCohortMember] = useState(app.cohortMember);
  const [adminNotes, setAdminNotes] = useState(app.adminNotes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/host-applications/${app.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cohortMember, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Approval failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Admit as Host</h2>
          <p className="text-sm text-gray-500 mt-0.5">{app.fullName} · {app.email}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Cohort toggle */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cohortMember}
                onChange={(e) => setCohortMember(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#c96a3f] focus:ring-[#c96a3f]"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">Cohort member (12% commission rate)</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cohort hosts receive a 12% commission rate. Standard hosts receive 15%.
                  This sets <code className="bg-gray-100 px-1 rounded">HostProfile.commissionRate</code> at provisioning time.
                </p>
              </div>
            </label>
          </div>

          {/* Admin notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Admin notes <span className="text-gray-400 font-normal">(internal, not shown to applicant)</span>
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Onboarding notes, call summary, special terms…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#c96a3f] focus:border-transparent resize-none"
            />
          </div>

          {/* Summary */}
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">What happens on approval:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>A Clerk invitation email is sent to <strong>{app.email}</strong> with role <code>HOST</code></li>
              <li>Application status is set to <strong>ACCEPTED</strong></li>
              <li>On sign-up, the D-1 webhook provisions a CC User + HostProfile with {cohortMember ? '12%' : '15%'} commission rate</li>
            </ol>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-[#c96a3f] rounded-md hover:bg-[#a85530] disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Admitting…</>
            ) : (
              <><CheckCircle className="h-3.5 w-3.5" /> Admit as Host</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Reject modal ───────────────────────────────────────────────────────────

function RejectModal({
  app,
  onClose,
  onSuccess,
}: {
  app: HostApplication;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(app.adminNotes ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/host-applications/${app.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Rejection failed');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Decline Application</h2>
          <p className="text-sm text-gray-500 mt-0.5">{app.fullName} · {app.email}</p>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Admin notes <span className="text-gray-400 font-normal">(internal)</span>
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Reason for declining…"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Declining…</>
            ) : (
              <><XCircle className="h-3.5 w-3.5" /> Decline Application</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Application card ───────────────────────────────────────────────────────

function ApplicationCard({
  app,
  onAdmit,
  onReject,
}: {
  app: HostApplication;
  onAdmit: (app: HostApplication) => void;
  onReject: (app: HostApplication) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isPending = app.status === 'PENDING' || app.status === 'REVIEWING';

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Card header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 text-sm">{app.fullName}</span>
            {app.businessName && (
              <span className="text-gray-500 text-sm">— {app.businessName}</span>
            )}
            <StatusBadge status={app.status} />
            {app.cohortMember && app.status === 'ACCEPTED' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider font-medium bg-purple-100 text-purple-800">
                Cohort
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</span>
            <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{app.corridorLocation}</span>
            {app.propertyType && (
              <span className="flex items-center gap-1"><Home className="h-3 w-3" />{app.propertyType}</span>
            )}
            {app.numberOfRooms && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{app.numberOfRooms} rooms</span>
            )}
          </div>
          <div className="mt-1 text-xs text-gray-400 font-mono">
            Applied {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            {app.reviewedAt && ` · Reviewed ${new Date(app.reviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isPending && (
            <>
              <button
                onClick={() => onAdmit(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#c96a3f] rounded hover:bg-[#a85530] transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Admit
              </button>
              <button
                onClick={() => onReject(app)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" /> Decline
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-3 text-sm">
          {app.aboutOperation && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">About operation</div>
              <p className="text-gray-700 leading-relaxed">{app.aboutOperation}</p>
            </div>
          )}
          {app.whyCoastalCorridor && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Why Coastal Corridor</div>
              <p className="text-gray-700 leading-relaxed">{app.whyCoastalCorridor}</p>
            </div>
          )}
          {app.currentlyListedOn && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Currently listed on</div>
              <p className="text-gray-700">{app.currentlyListedOn}</p>
            </div>
          )}
          {app.additionalInfo && (
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-gray-400 mb-1">Additional info</div>
              <p className="text-gray-700 leading-relaxed">{app.additionalInfo}</p>
            </div>
          )}
          {app.adminNotes && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <div className="text-xs font-mono uppercase tracking-wider text-amber-600 mb-1">Admin notes</div>
              <p className="text-amber-900 text-xs leading-relaxed">{app.adminNotes}</p>
            </div>
          )}
          {app.clerkInviteId && (
            <div className="text-xs text-gray-400 font-mono">
              Clerk invite ID: {app.clerkInviteId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

type FilterStatus = 'ALL' | AppStatus;

export default function HostApplicationsPage() {
  const [filter, setFilter] = useState<FilterStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<AppsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [admitTarget, setAdmitTarget] = useState<HostApplication | null>(null);
  const [rejectTarget, setRejectTarget] = useState<HostApplication | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/host-applications?${params}`);
      if (!res.ok) throw new Error('Failed to load applications');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const STATUS_FILTERS: { value: FilterStatus; label: string }[] = [
    { value: 'ALL',      label: 'All' },
    { value: 'PENDING',  label: 'Pending' },
    { value: 'REVIEWING',label: 'Reviewing' },
    { value: 'ACCEPTED', label: 'Accepted' },
    { value: 'DECLINED', label: 'Declined' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Host Applications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Applications from the <code>/for-operators</code> page where path = "host" or "both".
          Admit to issue a Clerk invitation with role HOST.
        </p>
      </div>

      {/* Filters + search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 flex-wrap">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {data?.counts[value] !== undefined && (
                <span className="ml-1.5 text-gray-400">
                  {data.counts[value]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#c96a3f] focus:border-transparent"
          />
        </div>

        {/* Refresh */}
        <button
          onClick={fetchApps}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {error ? (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : !data || data.applications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No applications found</p>
          {filter !== 'ALL' && (
            <button
              onClick={() => setFilter('ALL')}
              className="mt-2 text-xs text-[#c96a3f] hover:underline"
            >
              Show all applications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {data.applications.map((app) => (
            <ApplicationCard
              key={app.id}
              app={app}
              onAdmit={setAdmitTarget}
              onReject={setRejectTarget}
            />
          ))}
          <p className="text-xs text-gray-400 text-right pt-1">
            Showing {data.applications.length} of {data.total} applications
          </p>
        </div>
      )}

      {/* Modals */}
      {admitTarget && (
        <AdmitModal
          app={admitTarget}
          onClose={() => setAdmitTarget(null)}
          onSuccess={fetchApps}
        />
      )}
      {rejectTarget && (
        <RejectModal
          app={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onSuccess={fetchApps}
        />
      )}
    </div>
  );
}
