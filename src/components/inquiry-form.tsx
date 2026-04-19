'use client';

import { useState } from 'react';
import { Check, Send } from 'lucide-react';

export function InquiryForm({ propertyId, propertyTitle }: { propertyId: string; propertyTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: `I'm interested in ${propertyTitle}. Please send me more information.`,
    preferredContact: 'email' as 'email' | 'phone' | 'whatsapp'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, ...form })
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      alert('Sorry, something went wrong. Please try again or call us directly.');
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
          An agent will contact you within 24 hours. Check your inbox for a confirmation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-ink/10 rounded-lg p-5">
      <h3 className="font-serif text-[18px] font-medium mb-1">Quick inquiry</h3>
      <p className="text-[12px] text-ink/60 mb-4">No obligation. Response within 24h.</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          required
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <input
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full bg-paper border border-ink/15 rounded-sm px-3 py-2 text-[13px] outline-none focus:border-ink/40"
        />
        <textarea
          rows={4}
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
                onClick={() => setForm({ ...form, preferredContact: m })}
                className={`flex-1 px-2 py-1.5 rounded-sm text-[11px] font-mono uppercase tracking-wider transition-colors ${
                  form.preferredContact === m
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
