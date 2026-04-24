'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  state: string;
}

export default function NewProjectPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    destinationId: '',
    totalUnits: '',
    availableUnits: '',
    priceFromKobo: '',
    priceToKobo: '',
    status: 'planning',
    amenities: '',
    completionDate: '',
  });

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    fetch('/api/destinations')
      .then((r) => r.json())
      .then((d) => setDestinations(d.data || []))
      .catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/developer/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          totalUnits: parseInt(form.totalUnits),
          availableUnits: parseInt(form.availableUnits),
          priceFromKobo: Math.round(parseFloat(form.priceFromKobo) * 100),
          priceToKobo: Math.round(parseFloat(form.priceToKobo) * 100),
          amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [],
          completionDate: form.completionDate ? new Date(form.completionDate).toISOString() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create project');
      }

      setSuccess(true);
      setTimeout(() => router.push('/developer/projects'), 2000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-paper min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
          <h2 className="font-serif text-[28px] font-light mb-2">Project created</h2>
          <p className="text-ink/60">Redirecting to your projects…</p>
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
              New Project
            </h1>
            <p className="text-ink/60 text-[15px]">
              Add a development project to the Coastal Corridor platform. Our team will review and activate it within 48 hours.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-laterite/10 border border-laterite/20 rounded-lg px-4 py-3 mb-6 text-sm text-laterite">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[18px] font-light border-b border-ink/8 pb-3">Project Details</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Project Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Lekki Gardens Phase 3"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describe the project, its unique selling points, and target buyers…"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper resize-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Corridor Destination *</label>
                <select
                  name="destinationId"
                  value={form.destinationId}
                  onChange={handleChange}
                  required
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                >
                  <option value="">Select a destination…</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}, {d.state}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Development Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active / Under Construction</option>
                  <option value="complete">Completed</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Expected Completion Date</label>
                <input
                  type="date"
                  name="completionDate"
                  value={form.completionDate}
                  onChange={handleChange}
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                />
              </div>
            </div>

            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[18px] font-light border-b border-ink/8 pb-3">Units & Pricing</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Total Units *</label>
                  <input
                    type="number"
                    name="totalUnits"
                    value={form.totalUnits}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g. 120"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Available Units *</label>
                  <input
                    type="number"
                    name="availableUnits"
                    value={form.availableUnits}
                    onChange={handleChange}
                    required
                    min="0"
                    placeholder="e.g. 85"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Price From (₦) *</label>
                  <input
                    type="number"
                    name="priceFromKobo"
                    value={form.priceFromKobo}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 45000000"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                  />
                  <p className="text-[11px] text-ink/40 mt-1">Enter in Naira (not kobo)</p>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Price To (₦) *</label>
                  <input
                    type="number"
                    name="priceToKobo"
                    value={form.priceToKobo}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 120000000"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Amenities</label>
                <input
                  name="amenities"
                  value={form.amenities}
                  onChange={handleChange}
                  placeholder="Pool, Gym, 24hr Security, Backup Power (comma-separated)"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean transition-colors bg-paper"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="text-sm text-ink/50 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Project'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
