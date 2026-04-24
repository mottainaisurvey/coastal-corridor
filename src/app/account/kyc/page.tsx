'use client';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

type KycStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REVIEW' | 'REJECTED';
type IdType = 'NIN' | 'BVN' | 'PASSPORT' | 'DRIVERS_LICENSE' | 'VOTER_ID';

const ID_TYPE_LABELS: Record<IdType, string> = {
  NIN: 'National Identification Number (NIN)',
  BVN: 'Bank Verification Number (BVN)',
  PASSPORT: 'International Passport',
  DRIVERS_LICENSE: "Driver's Licence",
  VOTER_ID: "Voter's Card",
};

const ID_TYPE_HINTS: Record<IdType, string> = {
  NIN: '11-digit number on your NIN slip or NIMC card',
  BVN: '11-digit number — dial *565*0# on any Nigerian network to retrieve it',
  PASSPORT: 'Passport number as printed on the bio-data page',
  DRIVERS_LICENSE: 'Licence number as printed on the front of your licence',
  VOTER_ID: 'Voter Identification Number (VIN) from your PVC',
};

export default function KYCPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();

  const [kycStatus, setKycStatus] = useState<KycStatus>('NOT_STARTED');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    idType: 'NIN' as IdType,
    idNumber: '',
    country: 'NG',
  });

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/kyc/verify')
      .then(r => r.json())
      .then(data => {
        setKycStatus((data.kycStatus as KycStatus) || 'NOT_STARTED');
        setVerificationId(data.verificationId || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.');
        return;
      }
      setKycStatus(data.status as KycStatus);
      setVerificationId(data.verificationId);
      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-light text-ink">Identity Verification</h1>
          </div>
          <p className="text-ink/60 text-sm">
            Verify your identity to unlock property inquiries, offers, and transactions on Coastal Corridor.
          </p>
        </div>

        {/* Status Banner */}
        {kycStatus === 'APPROVED' && (
          <div className="bg-sage/10 border border-sage/30 rounded-xl p-5 flex items-start gap-3 mb-8">
            <CheckCircle className="w-5 h-5 text-sage mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink">Identity Verified</p>
              <p className="text-sm text-ink/60 mt-0.5">Your identity has been successfully verified. You have full access to all platform features.</p>
              {verificationId && <p className="text-xs text-ink/40 mt-1">Reference: {verificationId}</p>}
            </div>
          </div>
        )}

        {kycStatus === 'PENDING' && (
          <div className="bg-ochre/10 border border-ochre/30 rounded-xl p-5 flex items-start gap-3 mb-8">
            <Clock className="w-5 h-5 text-ochre mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink">Verification In Progress</p>
              <p className="text-sm text-ink/60 mt-0.5">Your verification has been submitted and is being processed. You will receive an email notification within 24 hours.</p>
              {verificationId && <p className="text-xs text-ink/40 mt-1">Reference: {verificationId}</p>}
            </div>
          </div>
        )}

        {kycStatus === 'REVIEW' && (
          <div className="bg-ocean/10 border border-ocean/30 rounded-xl p-5 flex items-start gap-3 mb-8">
            <AlertCircle className="w-5 h-5 text-ocean mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink">Manual Review Required</p>
              <p className="text-sm text-ink/60 mt-0.5">Your verification requires a manual review by our compliance team. This typically takes 1–2 business days.</p>
            </div>
          </div>
        )}

        {kycStatus === 'REJECTED' && (
          <div className="bg-laterite/10 border border-laterite/30 rounded-xl p-5 flex items-start gap-3 mb-8">
            <XCircle className="w-5 h-5 text-laterite mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-ink">Verification Unsuccessful</p>
              <p className="text-sm text-ink/60 mt-0.5">We could not verify your identity with the information provided. Please try again with a different ID type or contact support.</p>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="bg-white rounded-2xl border border-ink/10 p-8 text-center">
            <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-sage" />
            </div>
            <h2 className="text-xl font-light text-ink mb-2">Verification Submitted</h2>
            <p className="text-ink/60 text-sm mb-6">
              Your identity verification has been submitted. You will receive an email notification at the address on your account within 24 hours.
            </p>
            {verificationId && (
              <p className="text-xs text-ink/40 mb-6">Reference: {verificationId}</p>
            )}
            <Link href="/account" className="inline-flex items-center gap-2 bg-ocean text-white px-6 py-2.5 rounded-lg text-sm hover:bg-ocean/90 transition-colors">
              Return to Account
            </Link>
          </div>
        )}

        {/* Form — only show if not approved, not pending, and not just submitted */}
        {!success && kycStatus !== 'APPROVED' && kycStatus !== 'PENDING' && kycStatus !== 'REVIEW' && (
          <div className="bg-white rounded-2xl border border-ink/10 p-8">
            <h2 className="text-lg font-medium text-ink mb-6">Submit Your Identity</h2>

            {error && (
              <div className="bg-laterite/10 border border-laterite/30 rounded-lg p-4 text-sm text-laterite mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                    placeholder="As on your ID"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                    placeholder="As on your ID"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                    placeholder="+234 or 0XXXXXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">ID Type</label>
                <select
                  value={form.idType}
                  onChange={e => setForm(f => ({ ...f, idType: e.target.value as IdType }))}
                  className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white"
                >
                  {(Object.keys(ID_TYPE_LABELS) as IdType[]).map(t => (
                    <option key={t} value={t}>{ID_TYPE_LABELS[t]}</option>
                  ))}
                </select>
                <p className="text-xs text-ink/50 mt-1.5">{ID_TYPE_HINTS[form.idType]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">ID Number</label>
                <input
                  type="text"
                  required
                  value={form.idNumber}
                  onChange={e => setForm(f => ({ ...f, idNumber: e.target.value.trim() }))}
                  className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean font-mono tracking-wider"
                  placeholder={form.idType === 'NIN' || form.idType === 'BVN' ? '00000000000' : 'Enter ID number'}
                />
              </div>

              {/* Diaspora — country selector */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Country of Residence</label>
                <select
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white"
                >
                  <option value="NG">Nigeria</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="ZA">South Africa</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                </select>
              </div>

              {/* Privacy notice */}
              <div className="bg-sand rounded-lg p-4 text-xs text-ink/50 leading-relaxed">
                Your identity information is transmitted securely to Smile Identity for verification. It is not stored on Coastal Corridor servers and is handled in compliance with the Nigerian Data Protection Regulation (NDPR). By submitting, you consent to this processing.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-ocean text-white py-3 rounded-lg text-sm font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting…
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Submit for Verification
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
