'use client';

import { useState } from 'react';
import { Check, Send, AlertCircle } from 'lucide-react';

interface InquiryFormProps {
  /** The listing ID to attach the inquiry to (preferred) */
  listingId?: string;
  /** Fallback: property ID — the API will resolve the active listing */
  propertyId?: string;
  propertyTitle: string;
}

export function InquiryForm({ listingId, propertyId, propertyTitle }: InquiryFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    message: `I'm interested in ${propertyTitle}. Please send me more information.`,
    preferredContactMethod: 'email' as 'email' | 'phone' | 'whatsapp',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        // Prefer explicit listingId; fall back to propertyId for legacy callers
        listingId: listingId || propertyId || '',
        buyerName: form.buyerName,
        buyerEmail: form.buyerEmail,
        buyerPhone: form.buyerPhone || '—',
        message: form.message,
        preferredContactMethod: form.preferredContactMethod,
      };

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Server error ${res.status}`);
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error('Inquiry submission failed:', err);
      setError(err?.message || 'Something went wrong. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-6 text-center">
        <div className="inline-flex h-12 w-12 rounded-full bg-success/20 items-center justify-center mb-3">
          <Check className="h-6 w-6 text-success" />
        </div>
        <h3 className="font-serif text-[18px] font-medium mb-2">Inquiry received</h3>
        <p className="text-[13px] text-ink/70">
          An agent will contact you within 24 hours. Check your inbox for a confirmation email.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-5">
      <h3 className="font-serif text-[18px] font-medium mb-1">Quick inquiry</h3>
      <p className="text-[12px] text-ink/60 mb-4">No obligation. Response within 24h.</p>

      {error && (
        <div className="flex items-start gap-2 bg-alert/10 border border-alert/20 rounded-sm px-3 py-2 mb-3">
          <AlertCircle className="h-4 w-4 text-alert flex-shrink-0 mt-0.5" />
          <p className="text-[12px] text-alert leading-snug">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          required
          placeholder="Your full name"
          value={form.buyerName}
          onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.buyerEmail}
          onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <input
          type="tel"
          placeholder="Phone number (optional)"
          value={form.buyerPhone}
          onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <textarea
          rows={4}
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40 resize-none"
        />

        <div>
          <div className="stat-label mb-2">Preferred contact</div>
          <div className="flex gap-2">
            {(['email', 'phone', 'whatsapp'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, preferredContactMethod: m })}
                className={`flex-1 px-2 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  form.preferredContactMethod === m
                    ? 'bg-ink text-paper'
                    : 'bg-paper border border-ink/15 text-ink/60 hover:text-ink'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? (
            'Sending…'
          ) : (
            <>
              <Send className="h-4 w-4" />
              Send inquiry
            </>
          )}
        </button>

        <p className="text-[10px] text-ink/50 text-center leading-relaxed">
          Protected by platform escrow · Your details never shared with third parties
        </p>
      </form>
    </div>
  );
}
