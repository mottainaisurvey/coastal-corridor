'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Building2 } from 'lucide-react';

export default function DeveloperProfilePage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    cacNumber: '',
    tin: '',
    yearFounded: '',
    description: '',
    website: '',
  });

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/developer/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          const { profile, devProfile } = d.data;
          setForm({
            firstName: profile?.firstName || '',
            lastName: profile?.lastName || '',
            companyName: devProfile?.companyName || '',
            cacNumber: devProfile?.cacNumber || '',
            tin: devProfile?.tin || '',
            yearFounded: devProfile?.yearFounded?.toString() || '',
            description: devProfile?.description || '',
            website: devProfile?.website || '',
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch('/api/developer/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          yearFounded: form.yearFounded ? parseInt(form.yearFounded) : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save profile');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container-x py-24">
        <div className="animate-pulse space-y-4 max-w-2xl mx-auto">
          <div className="h-4 bg-ink/10 rounded w-24" />
          <div className="h-10 bg-ink/10 rounded w-1/3" />
          <div className="h-40 bg-ink/10 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-2xl mx-auto">

          <div className="mb-10">
            <div className="eyebrow mb-3">Developer Portal</div>
            <h1 className="font-serif text-[36px] leading-[1.05] tracking-tightest font-light mb-2">
              Company Profile
            </h1>
            <p className="text-ink/60 text-[15px]">
              Your company details are displayed on all project listings and verified by our team.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-laterite/10 border border-laterite/20 rounded-lg px-4 py-3 mb-6 text-sm text-laterite">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-lg px-4 py-3 mb-6 text-sm text-success">
              <CheckCircle className="h-4 w-4 flex-shrink-0" /> Profile saved successfully.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[18px] font-light border-b border-ink/8 pb-3">Contact Person</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">First Name</label>
                  <input name="firstName" value={form.firstName} onChange={handleChange}
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input name="lastName" value={form.lastName} onChange={handleChange}
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
              </div>
            </div>

            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[18px] font-light border-b border-ink/8 pb-3">Company Details</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Company Name *</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} required
                  placeholder="e.g. Greenfield Developments Ltd"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">CAC Number *</label>
                  <input name="cacNumber" value={form.cacNumber} onChange={handleChange} required
                    placeholder="RC123456"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">TIN (optional)</label>
                  <input name="tin" value={form.tin} onChange={handleChange}
                    placeholder="Tax Identification Number"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Year Founded</label>
                  <input type="number" name="yearFounded" value={form.yearFounded} onChange={handleChange}
                    min="1900" max={new Date().getFullYear()} placeholder="e.g. 2010"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Website</label>
                  <input name="website" value={form.website} onChange={handleChange}
                    placeholder="https://yourcompany.com"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Company Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4}
                  placeholder="Brief overview of your company, track record, and focus areas…"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper resize-none" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
