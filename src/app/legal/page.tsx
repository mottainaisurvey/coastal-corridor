import Link from 'next/link';
import { ArrowRight, FileText, Shield, Cookie, Scale, Info } from 'lucide-react';

export const metadata = {
  title: 'Legal · Coastal Corridor',
  description: 'Legal information, entity disclosures, and governing documents'
};

export default function LegalPage() {
  return (
    <>
      <section className="container-x py-16 md:py-20">
        <div className="eyebrow mb-4">Legal</div>
        <h1 className="font-serif text-[44px] md:text-[60px] leading-[1.02] tracking-tightest font-light max-w-3xl mb-6">
          All legal information
          <span className="italic text-laterite"> in one place.</span>
        </h1>
        <p className="text-[17px] text-ink/70 leading-relaxed max-w-2xl font-light">
          Transparency about who we are, what we do, and the frameworks we operate under matters.
          Everything is here and kept current. If something is missing, write to us and we will put it right.
        </p>
      </section>

      {/* ENTITY INFORMATION */}
      <section className="container-x pb-16">
        <div className="eyebrow mb-4">§ 01 · Entity information</div>
        <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-8">
          Who you are contracting with
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-6 bg-white border border-ink/10 rounded-lg">
            <div className="eyebrow mb-3 text-laterite">Holding company</div>
            <h3 className="font-serif text-[20px] font-medium tracking-display mb-4">Coastal Corridor Ltd</h3>
            <dl className="space-y-2 text-[13px]">
              {[
                ['Type', 'Private limited company'],
                ['Incorporated in', 'England & Wales'],
                ['Company number', 'To be assigned on formal incorporation'],
                ['Registered office', 'London, United Kingdom'],
                ['Primary purpose', 'IP holding, intl. contracting, capital markets'],
                ['VAT status', 'Not yet VAT-registered (pre-revenue threshold)']
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="p-6 bg-white border border-ink/10 rounded-lg">
            <div className="eyebrow mb-3 text-ocean">Operating company</div>
            <h3 className="font-serif text-[20px] font-medium tracking-display mb-4">Coastal Corridor Nigeria Ltd</h3>
            <dl className="space-y-2 text-[13px]">
              {[
                ['Type', 'Private limited company'],
                ['Incorporated in', 'Federal Republic of Nigeria'],
                ['RC number', 'To be assigned on formal incorporation'],
                ['Registered office', 'Lagos, Nigeria'],
                ['Primary purpose', 'Nigerian operations, transactions, compliance'],
                ['Regulated by', 'CAC · SEC Nigeria · CBN']
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* DOCUMENTS */}
      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · Governing documents</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-8">
            Read, download, archive
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: FileText,
                title: 'Terms of service',
                desc: 'The agreement between you and us when you use the platform.',
                href: '/terms',
                updated: 'April 2026'
              },
              {
                icon: Shield,
                title: 'Privacy policy',
                desc: 'How we collect, use, and protect your personal information.',
                href: '/privacy',
                updated: 'April 2026'
              },
              {
                icon: Cookie,
                title: 'Cookie policy',
                desc: 'What cookies we use, what they do, and how to control them.',
                href: '/cookies',
                updated: 'April 2026'
              },
              {
                icon: Scale,
                title: 'Acceptable use policy',
                desc: 'What you may and may not do on the platform.',
                href: '/terms#acceptable-use',
                updated: 'April 2026'
              }
            ].map((doc, i) => (
              <Link
                key={i}
                href={doc.href}
                className="group flex items-start gap-4 p-6 bg-white border border-ink/10 rounded-lg hover:shadow-card hover:-translate-y-0.5 transition-all"
              >
                <div className="h-10 w-10 rounded-sm bg-ink flex items-center justify-center flex-shrink-0">
                  <doc.icon className="h-4 w-4 text-paper" />
                </div>
                <div className="flex-1">
                  <h3 className="font-serif text-[18px] font-medium tracking-display mb-1 group-hover:text-laterite transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-[13px] text-ink/70 leading-relaxed mb-2">{doc.desc}</p>
                  <div className="font-mono text-[10px] text-ink/50 uppercase tracking-wider">
                    Updated {doc.updated}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-ink/30 group-hover:text-ink group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LICENSES & REGULATORY */}
      <section className="container-x py-16">
        <div className="eyebrow mb-4">§ 03 · Licenses and regulatory frameworks</div>
        <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-8">
          Who regulates what we do
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              title: 'Real estate agency',
              regulator: 'ESVARBON',
              desc: 'All real estate agents on our platform must hold current ESVARBON registration. We do not advertise properties with unregistered agents.'
            },
            {
              title: 'Payments processing',
              regulator: 'CBN · FCA',
              desc: 'We do not directly process payments. All transactions flow through licensed partners: Paystack, Flutterwave, and Stripe. FX flows route through CBN-licensed providers with proper CCI documentation.'
            },
            {
              title: 'Data protection',
              regulator: 'NDPR · UK GDPR',
              desc: 'We operate under the Nigerian Data Protection Regulation (NDPR) for Nigerian user data and the UK General Data Protection Regulation for UK users. Data subject requests are honoured within 30 days.'
            },
            {
              title: 'Fractional investment products',
              regulator: 'SEC Nigeria',
              desc: 'All fractional ownership products are structured through SEC-registered SPVs with independent trustees. Full prospectus and audited accounts available to registered investors.'
            },
            {
              title: 'Escrow arrangements',
              regulator: 'CBN-licensed escrow banks',
              desc: 'Transaction escrow is held by licensed Nigerian banks under CBN supervision. Coastal Corridor has no custodial interest in held funds.'
            },
            {
              title: 'Anti-money laundering',
              regulator: 'EFCC · NFIU · FCA',
              desc: 'Full KYC and AML compliance under both Nigerian and UK frameworks. Transactions above thresholds reported to the NFIU. Suspicious activity monitoring in place.'
            }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg">
              <div className="flex items-start justify-between mb-3 gap-3">
                <h3 className="font-serif text-[18px] font-medium tracking-display">{item.title}</h3>
                <span className="chip bg-ink/5 text-ink/70 whitespace-nowrap">{item.regulator}</span>
              </div>
              <p className="text-[13px] text-ink/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DISCLAIMERS */}
      <section className="bg-ink text-paper py-16">
        <div className="container-x">
          <div className="eyebrow-on-dark mb-4">§ 04 · Important disclaimers</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-8">
            What we are not
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl">
            {[
              {
                title: 'We are not a bank',
                desc: 'We do not hold customer deposits. All transactional funds are held by licensed escrow banks.'
              },
              {
                title: 'We are not a law firm',
                desc: 'We coordinate legal work through licensed counsel but we do not provide legal advice. Consult your own lawyer for decisions.'
              },
              {
                title: 'We are not a valuation firm',
                desc: 'Prices shown are seller asking prices. Professional valuations should be commissioned separately by buyers.'
              },
              {
                title: 'We are not financial advisors',
                desc: 'Information about market trends and forecast appreciation is informational. It is not investment advice and should not be relied on as such.'
              }
            ].map((item, i) => (
              <div key={i} className="p-5 border border-paper/15 rounded-lg">
                <h3 className="font-serif text-[18px] font-medium tracking-display mb-2 text-ocean-2">{item.title}</h3>
                <p className="text-[13px] text-paper/70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REPORTING */}
      <section className="container-x py-16">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">§ 05 · Reporting concerns</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-6">
            If something is wrong, tell us.
          </h2>
          <p className="text-[15px] text-ink/70 leading-relaxed mb-4">
            If you believe a listing is fraudulent, an agent is unlicensed, a transaction has been mishandled,
            or any aspect of the platform is being used improperly, we want to hear from you immediately.
          </p>
          <div className="flex flex-wrap gap-3 mb-4">
            <a href="mailto:legal@coastalcorridor.co" className="btn-primary">
              Report a concern
              <ArrowRight className="h-4 w-4" />
            </a>
            <a href="mailto:security@coastalcorridor.co" className="btn-secondary">
              Report a security issue
            </a>
          </div>
          <p className="text-[12px] text-ink/60">
            We investigate every report. We protect reporter anonymity where requested. Responsible disclosure
            of security issues is rewarded through our bug bounty programme.
          </p>
        </div>
      </section>
    </>
  );
}
