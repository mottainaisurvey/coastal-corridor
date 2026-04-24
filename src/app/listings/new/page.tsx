'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface Destination {
  id: string;
  name: string;
  state: string;
}

const STEPS = [
  { id: 1, label: 'Property Details' },
  { id: 2, label: 'Pricing & Terms' },
  { id: 3, label: 'Description' },
  { id: 4, label: 'Review & Submit' },
];

const PROPERTY_TYPES = [
  { value: 'LAND_ONLY', label: 'Land Only' },
  { value: 'HOUSE', label: 'House' },
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'HOSPITALITY', label: 'Hospitality' },
];

const TITLE_STATUSES = [
  { value: 'C_OF_O', label: 'Certificate of Occupancy (C of O)' },
  { value: 'R_OF_O', label: 'Right of Occupancy (R of O)' },
  { value: 'DEED', label: 'Deed of Assignment' },
  { value: 'GAZETTE', label: 'Gazette' },
  { value: 'SURVEY', label: 'Survey Plan Only' },
  { value: 'PENDING', label: 'Title Pending' },
];

export default function NewListingPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    // Step 1 — Property Details
    propertyType: '',
    destinationId: '',
    plotNumber: '',
    sizeHectares: '',
    titleStatus: '',
    bedrooms: '',
    bathrooms: '',
    floorArea: '',
    // Step 2 — Pricing
    askingPriceNgn: '',
    negotiable: false,
    currency: 'NGN',
    // Step 3 — Description
    title: '',
    description: '',
    amenities: '',
    // Agent assignment
    agentEmail: '',
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
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/listings/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyType: form.propertyType,
          destinationId: form.destinationId,
          plotNumber: form.plotNumber,
          sizeHectares: parseFloat(form.sizeHectares),
          titleStatus: form.titleStatus,
          bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
          bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
          floorArea: form.floorArea ? parseFloat(form.floorArea) : null,
          askingPriceKobo: Math.round(parseFloat(form.askingPriceNgn) * 100),
          negotiable: form.negotiable,
          currency: form.currency,
          title: form.title,
          description: form.description,
          amenities: form.amenities ? form.amenities.split(',').map((a) => a.trim()).filter(Boolean) : [],
          agentEmail: form.agentEmail || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit listing');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-paper min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <CheckCircle className="h-14 w-14 text-success mx-auto mb-5" />
          <h2 className="font-serif text-[32px] font-light mb-3">Listing submitted</h2>
          <p className="text-ink/60 mb-6">
            Your listing has been submitted as a draft. Our team will review it within 48 hours and activate it on the platform.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/account" className="btn-secondary">Back to account</Link>
            <Link href="/properties" className="btn-primary">Browse properties</Link>
          </div>
        </div>
      </div>
    );
  }

  const canProceed = () => {
    if (step === 1) return form.propertyType && form.destinationId && form.plotNumber && form.sizeHectares && form.titleStatus;
    if (step === 2) return form.askingPriceNgn && parseFloat(form.askingPriceNgn) > 0;
    if (step === 3) return form.title && form.description;
    return true;
  };

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <Link href="/account" className="flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-6">
              <ChevronLeft className="h-4 w-4" /> Back to account
            </Link>
            <div className="eyebrow mb-3">List a Property</div>
            <h1 className="font-serif text-[36px] leading-[1.05] tracking-tightest font-light">
              Submit a Listing
            </h1>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-10">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-medium transition-colors ${
                  step === s.id
                    ? 'bg-ocean text-white'
                    : step > s.id
                    ? 'bg-success text-white'
                    : 'bg-ink/10 text-ink/40'
                }`}>
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-[12px] hidden sm:block ${step === s.id ? 'text-ink font-medium' : 'text-ink/40'}`}>
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-ink/20 mx-1" />}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-3 bg-laterite/10 border border-laterite/20 rounded-lg px-4 py-3 mb-6 text-sm text-laterite">
              <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Step 1 — Property Details */}
          {step === 1 && (
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[20px] font-light border-b border-ink/8 pb-3">Property Details</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Property Type *</label>
                <select name="propertyType" value={form.propertyType} onChange={handleChange} required
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper">
                  <option value="">Select type…</option>
                  {PROPERTY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Corridor Destination *</label>
                <select name="destinationId" value={form.destinationId} onChange={handleChange} required
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper">
                  <option value="">Select destination…</option>
                  {destinations.map((d) => <option key={d.id} value={d.id}>{d.name}, {d.state}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Plot Number *</label>
                  <input name="plotNumber" value={form.plotNumber} onChange={handleChange} required
                    placeholder="e.g. PLT-001-A"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Size (hectares) *</label>
                  <input type="number" name="sizeHectares" value={form.sizeHectares} onChange={handleChange} required
                    min="0.01" step="0.01" placeholder="e.g. 0.5"
                    className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Title Status *</label>
                <select name="titleStatus" value={form.titleStatus} onChange={handleChange} required
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper">
                  <option value="">Select title status…</option>
                  {TITLE_STATUSES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {form.propertyType !== 'LAND_ONLY' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Bedrooms</label>
                    <input type="number" name="bedrooms" value={form.bedrooms} onChange={handleChange} min="0" placeholder="e.g. 3"
                      className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Bathrooms</label>
                    <input type="number" name="bathrooms" value={form.bathrooms} onChange={handleChange} min="0" placeholder="e.g. 2"
                      className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Floor Area (sqm)</label>
                    <input type="number" name="floorArea" value={form.floorArea} onChange={handleChange} min="0" step="0.1" placeholder="e.g. 180"
                      className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Pricing */}
          {step === 2 && (
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[20px] font-light border-b border-ink/8 pb-3">Pricing & Terms</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Asking Price (₦) *</label>
                <input type="number" name="askingPriceNgn" value={form.askingPriceNgn} onChange={handleChange} required
                  min="0" step="1" placeholder="e.g. 45000000"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                <p className="text-[11px] text-ink/40 mt-1">Enter in Naira (not kobo)</p>
                {form.askingPriceNgn && (
                  <p className="text-[12px] text-ocean mt-1 font-medium">
                    = ₦{parseFloat(form.askingPriceNgn).toLocaleString()}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Currency</label>
                <select name="currency" value={form.currency} onChange={handleChange}
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper">
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" name="negotiable" id="negotiable" checked={form.negotiable}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-ink/30 text-ocean focus:ring-ocean" />
                <label htmlFor="negotiable" className="text-[14px] text-ink/70 cursor-pointer">
                  Price is negotiable
                </label>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Assign to Agent (optional)</label>
                <input name="agentEmail" value={form.agentEmail} onChange={handleChange}
                  type="email" placeholder="agent@example.com"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
                <p className="text-[11px] text-ink/40 mt-1">Leave blank if you are the listing agent</p>
              </div>
            </div>
          )}

          {/* Step 3 — Description */}
          {step === 3 && (
            <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card space-y-5">
              <h2 className="font-serif text-[20px] font-light border-b border-ink/8 pb-3">Description</h2>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Listing Title *</label>
                <input name="title" value={form.title} onChange={handleChange} required
                  placeholder="e.g. 3-Bedroom Duplex with Ocean Views, Lekki"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Full Description *</label>
                <textarea name="description" value={form.description} onChange={handleChange} required rows={6}
                  placeholder="Describe the property in detail — location, features, access, nearby infrastructure, investment potential…"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper resize-none" />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink/60 uppercase tracking-wider mb-1.5">Amenities / Features</label>
                <input name="amenities" value={form.amenities} onChange={handleChange}
                  placeholder="Borehole, Generator, Fence, Gate House (comma-separated)"
                  className="w-full border border-ink/20 rounded-md px-3 py-2.5 text-[14px] focus:outline-none focus:border-ocean bg-paper" />
              </div>
            </div>
          )}

          {/* Step 4 — Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <h2 className="font-serif text-[20px] font-light border-b border-ink/8 pb-3 mb-4">Review Your Listing</h2>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Title</dt>
                    <dd className="font-medium text-right max-w-xs">{form.title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Type</dt>
                    <dd>{PROPERTY_TYPES.find((t) => t.value === form.propertyType)?.label}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Destination</dt>
                    <dd>{destinations.find((d) => d.id === form.destinationId)?.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Plot Number</dt>
                    <dd>{form.plotNumber}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Size</dt>
                    <dd>{form.sizeHectares} ha</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Title Status</dt>
                    <dd>{TITLE_STATUSES.find((t) => t.value === form.titleStatus)?.label}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Asking Price</dt>
                    <dd className="font-serif font-medium text-ocean">
                      {form.currency} {parseFloat(form.askingPriceNgn).toLocaleString()}
                      {form.negotiable && ' (negotiable)'}
                    </dd>
                  </div>
                  {form.agentEmail && (
                    <div className="flex justify-between">
                      <dt className="text-ink/50">Agent</dt>
                      <dd>{form.agentEmail}</dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-ocean/5 border border-ocean/20 rounded-lg px-5 py-4 text-sm text-ink/70">
                Your listing will be submitted as a <strong>draft</strong>. Our team will review it within 48 hours and activate it on the platform. You will receive an email confirmation.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 1 ? (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting…' : 'Submit Listing'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
