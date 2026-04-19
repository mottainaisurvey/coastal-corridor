import Link from 'next/link';
import { Cookie, Shield } from 'lucide-react';

export const metadata = {
  title: 'Cookie Policy · Coastal Corridor',
  description: 'What cookies we use and how to control them'
};

const cookieTypes = [
  {
    category: 'Strictly necessary',
    purpose: 'Make the platform work',
    canDisable: false,
    examples: [
      { name: 'session_id', purpose: 'Keeps you signed in while you browse', duration: 'Session' },
      { name: '__Host-csrf', purpose: 'Protects forms from cross-site request forgery', duration: 'Session' },
      { name: 'cookie_consent', purpose: 'Remembers your cookie preferences', duration: '1 year' }
    ]
  },
  {
    category: 'Performance',
    purpose: 'Help us understand and improve the platform',
    canDisable: true,
    examples: [
      { name: '_cc_analytics', purpose: 'Anonymous page-view and interaction tracking (first-party)', duration: '90 days' },
      { name: 'session_replay', purpose: 'Debugging for error reports — IP and identifiers anonymised', duration: '30 days' }
    ]
  },
  {
    category: 'Functional',
    purpose: 'Remember your preferences',
    canDisable: true,
    examples: [
      { name: 'preferred_currency', purpose: 'Remembers whether you view prices in ₦, £, $ etc.', duration: '1 year' },
      { name: 'map_view_style', purpose: 'Remembers your preferred 3D map settings', duration: '1 year' },
      { name: 'recent_searches', purpose: 'Your recent search queries for quick access', duration: '30 days' }
    ]
  },
  {
    category: 'Marketing',
    purpose: 'Measure the effectiveness of our communications',
    canDisable: true,
    examples: [
      { name: '_utm_*', purpose: 'Tracks which marketing channel brought you to the platform', duration: '6 months' },
      { name: '_cc_attribution', purpose: 'Conversion tracking for diaspora community partnerships', duration: '90 days' }
    ]
  }
];

export default function CookiesPage() {
  return (
    <>
      <section className="container-x py-16">
        <div className="eyebrow mb-4">Cookie policy</div>
        <h1 className="font-serif text-[44px] md:text-[56px] leading-[1.05] tracking-tightest font-light max-w-3xl mb-6">
          What we store on your device.
          <span className="italic text-laterite"> And what you can do about it.</span>
        </h1>
        <div className="flex flex-wrap gap-4 text-[12px] font-mono text-ink/60">
          <span>Effective 19 April 2026</span>
          <span>·</span>
          <span>Control available in-app</span>
        </div>
      </section>

      <section className="container-x pb-10">
        <div className="bg-ocean/10 border border-ocean/30 rounded-lg p-5 flex items-start gap-3 max-w-4xl">
          <Cookie className="h-5 w-5 text-ocean flex-shrink-0 mt-0.5" />
          <div className="text-[13px] text-ink/80 leading-relaxed">
            <span className="font-semibold">Short version.</span> We use a small number of first-party cookies to make the platform work, remember
            your preferences, and understand how to improve it. We do not allow third-party advertising cookies.
            You can change your preferences at any time in Settings.
          </div>
        </div>
      </section>

      {/* WHAT ARE COOKIES */}
      <section className="container-x pb-16">
        <div className="max-w-3xl">
          <h2 className="font-serif text-[28px] md:text-[34px] leading-tight tracking-display font-light mb-6">
            1. What cookies are
          </h2>
          <p className="text-[15px] text-ink/80 leading-relaxed mb-4">
            Cookies are small text files stored on your device by websites you visit. They allow the site
            to remember your actions and preferences so you don&apos;t have to re-enter them each time you visit.
          </p>
          <p className="text-[15px] text-ink/80 leading-relaxed mb-4">
            We also use similar technologies — local storage, session storage, and pixel tags —
            that serve comparable purposes. Throughout this policy, &quot;cookies&quot; means all of these.
          </p>
          <p className="text-[15px] text-ink/80 leading-relaxed">
            We distinguish between <strong>first-party cookies</strong> (set by coastalcorridor.co) and
            <strong> third-party cookies</strong> (set by other domains). We use very few third-party
            cookies and none for advertising purposes.
          </p>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 2. Categories of cookies we use</div>
          <h2 className="font-serif text-[28px] md:text-[34px] leading-tight tracking-display font-light mb-8">
            Four categories. Full transparency.
          </h2>

          <div className="space-y-5">
            {cookieTypes.map((ct, i) => (
              <div key={i} className="bg-white border border-ink/10 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-ink/10">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="eyebrow mb-2">{ct.category}</div>
                      <h3 className="font-serif text-[22px] font-medium tracking-display">{ct.purpose}</h3>
                    </div>
                    <span className={`chip ${ct.canDisable ? 'bg-ocean/15 text-ocean' : 'bg-ink/10 text-ink'}`}>
                      {ct.canDisable ? 'Optional · You can disable' : 'Required · Cannot be disabled'}
                    </span>
                  </div>
                </div>

                <div className="p-6">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-ink/50 font-mono text-[10px] uppercase tracking-wider">
                        <th className="text-left pb-3 font-medium">Name</th>
                        <th className="text-left pb-3 font-medium">Purpose</th>
                        <th className="text-left pb-3 font-medium">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ct.examples.map((ex, j) => (
                        <tr key={j} className="border-t border-ink/8">
                          <td className="py-3 pr-4 font-mono text-[12px]">{ex.name}</td>
                          <td className="py-3 pr-4 text-ink/75">{ex.purpose}</td>
                          <td className="py-3 text-ink/60 font-mono text-[11px]">{ex.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTROL */}
      <section className="container-x py-16">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">§ 3. How to control cookies</div>
          <h2 className="font-serif text-[28px] md:text-[34px] leading-tight tracking-display font-light mb-6">
            You decide what runs.
          </h2>

          <div className="space-y-5 text-[15px] text-ink/80 leading-relaxed">
            <p>
              <strong>On this platform.</strong> Open Settings and select Cookie preferences. You can toggle
              each category independently. Strictly necessary cookies cannot be disabled because the platform
              cannot function without them.
            </p>
            <p>
              <strong>In your browser.</strong> All major browsers allow you to block or delete cookies.
              See: <a className="underline" href="https://support.google.com/chrome/answer/95647">Chrome</a>,
              {' '}<a className="underline" href="https://support.mozilla.org/kb/clear-cookies-and-site-data-firefox">Firefox</a>,
              {' '}<a className="underline" href="https://support.apple.com/guide/safari/manage-cookies-sfri11471">Safari</a>,
              {' '}<a className="underline" href="https://support.microsoft.com/help/4027947">Edge</a>.
              Note that blocking strictly necessary cookies may prevent parts of the platform from working.
            </p>
            <p>
              <strong>Do Not Track signals.</strong> We respect the Global Privacy Control (GPC) signal.
              If your browser sends GPC, we treat it as a request to disable non-essential cookies.
            </p>
          </div>
        </div>
      </section>

      {/* THIRD PARTIES */}
      <section className="bg-paper-2 py-16">
        <div className="container-x max-w-3xl">
          <div className="eyebrow mb-4">§ 4. Third-party cookies</div>
          <h2 className="font-serif text-[28px] md:text-[34px] leading-tight tracking-display font-light mb-6">
            The short list.
          </h2>
          <p className="text-[15px] text-ink/80 leading-relaxed mb-6">
            The following third-party services set cookies on pages that use them. Each has its own privacy policy,
            which we encourage you to read.
          </p>

          <div className="space-y-3">
            {[
              { name: 'Stripe', purpose: 'Payment processing for international card transactions', policy: 'https://stripe.com/privacy' },
              { name: 'Paystack', purpose: 'Payment processing for Nigerian naira transactions', policy: 'https://paystack.com/privacy' },
              { name: 'Clerk', purpose: 'Authentication and account management', policy: 'https://clerk.com/legal/privacy' },
              { name: 'Cloudflare', purpose: 'Security and content delivery (on specific domains)', policy: 'https://www.cloudflare.com/privacypolicy' }
            ].map((t, i) => (
              <div key={i} className="p-4 bg-white border border-ink/10 rounded-lg flex flex-wrap justify-between items-center gap-3">
                <div>
                  <div className="font-medium text-[14px]">{t.name}</div>
                  <div className="text-[12px] text-ink/60">{t.purpose}</div>
                </div>
                <a href={t.policy} className="text-[12px] font-mono text-laterite hover:underline">
                  Privacy policy →
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHANGES */}
      <section className="container-x py-16 max-w-3xl">
        <div className="eyebrow mb-4">§ 5. Changes to this policy</div>
        <p className="text-[15px] text-ink/80 leading-relaxed">
          We may update this cookie policy as we add or remove services. Material changes will be communicated
          at least 14 days before they take effect, through a platform notice.
        </p>
        <p className="mt-4 text-[15px] text-ink/80 leading-relaxed">
          Questions? <a href="mailto:privacy@coastalcorridor.co" className="underline">privacy@coastalcorridor.co</a>
        </p>
      </section>
    </>
  );
}
