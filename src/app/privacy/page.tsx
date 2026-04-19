import Link from 'next/link';
import { Info, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy · Coastal Corridor',
  description: 'How we collect, use, and protect your personal information'
};

const sections = [
  {
    id: 'summary',
    title: 'Summary in plain English',
    body: [
      'We collect the information you give us (account details, inquiries, KYC documents for transactions) and technical information about how you use the platform (pages viewed, device type).',
      'We use it to run the service, verify transactions, improve the platform, and contact you when necessary. We never sell your data to third parties.',
      'You have rights over your data including access, correction, and deletion. We honour these within 30 days.',
      'Full detail follows. If anything is unclear, email privacy@coastalcorridor.co.'
    ]
  },
  {
    id: 'who-we-are',
    title: '1. Who we are',
    body: [
      'Coastal Corridor Ltd (UK) and Coastal Corridor Nigeria Ltd are joint data controllers for platform data, depending on jurisdiction.',
      'Our Data Protection Officer can be reached at privacy@coastalcorridor.co.',
      'For Nigerian data subjects, we are registered with the Nigeria Data Protection Commission (NDPC). For UK/EU data subjects, we operate under the UK GDPR and EU GDPR as applicable.'
    ]
  },
  {
    id: 'what-we-collect',
    title: '2. What we collect',
    body: [
      'Account information: name, email, phone number, country of residence, preferred language, communication preferences.',
      'Identity verification (for transactions and fractional investments): government-issued ID, proof of address, proof of funds, source of wealth documentation.',
      'Transaction information: listings inquired about, viewing requests, offer history, completed transactions, payment references.',
      'Technical information: IP address, device type, browser, pages visited, time spent, referral source.',
      'Communications: messages sent through the platform, support tickets, survey responses.',
      'Inferred information: buyer persona, risk profile, likelihood to transact — derived from your activity to improve recommendations.'
    ]
  },
  {
    id: 'how-we-use',
    title: '3. How we use your information',
    body: [
      'To provide the platform: authenticate you, process transactions, verify titles and identities, deliver the services you request.',
      'To communicate with you: respond to inquiries, send transaction updates, provide account notifications, send marketing (only where you have consented).',
      'To improve the platform: analyse usage patterns, fix bugs, prioritise new features, conduct research on Nigerian real estate trends in aggregate.',
      'To comply with law: meet regulatory reporting requirements, respond to lawful requests from authorities, prevent fraud and money laundering.'
    ]
  },
  {
    id: 'legal-basis',
    title: '4. Legal basis for processing',
    body: [
      'Under UK/EU GDPR, we rely on: (a) contract performance — to provide services you request; (b) legal obligation — to meet regulatory requirements; (c) legitimate interests — to improve the platform and prevent fraud; (d) consent — for marketing communications.',
      'Under NDPR, we rely on the equivalent lawful bases including consent, contract, legal obligation, and legitimate interests.',
      'You can withdraw consent at any time without affecting the lawfulness of prior processing.'
    ]
  },
  {
    id: 'sharing',
    title: '5. Who we share your information with',
    body: [
      'Platform service providers: AWS (hosting), Stripe/Paystack/Flutterwave (payments), Postmark (email), Sentry (error tracking), Clerk (authentication). These providers process data on our instructions and under data processing agreements.',
      'Transaction counterparties: when you transact on the platform, your contact information and relevant identity verification flows to the other party, their agent, and the escrow bank.',
      'Regulatory authorities: where legally required — typically the NFIU, EFCC, SEC Nigeria, CBN, NDPC, HMRC, FCA, or law enforcement.',
      'Professional advisors: our lawyers, auditors, and insurers access data strictly on a need-to-know basis under confidentiality.',
      'We never sell your personal information to third parties for marketing purposes.'
    ]
  },
  {
    id: 'transfers',
    title: '6. International data transfers',
    body: [
      'Data may be transferred between our UK and Nigerian operations, and to service providers in the EU, US, and elsewhere.',
      'Transfers are protected by Standard Contractual Clauses, adequacy decisions where they exist, or equivalent safeguards.',
      'Sensitive Nigerian data (including KYC for Nigerian transactions) is stored on Nigerian or African-region infrastructure where technically feasible.'
    ]
  },
  {
    id: 'retention',
    title: '7. How long we keep your information',
    body: [
      'Account data: for as long as your account is active, plus 2 years after closure.',
      'Transaction records: 7 years from transaction completion (required by Nigerian and UK tax, AML, and real estate record-keeping laws).',
      'KYC documentation: 5 years from transaction or 5 years from last transaction, whichever is longer.',
      'Platform activity logs: 90 days, then aggregated and anonymised.',
      'Marketing preferences: until you unsubscribe, then retained as a suppression record.'
    ]
  },
  {
    id: 'your-rights',
    title: '8. Your rights',
    body: [
      'You have the right to: access the data we hold about you; request correction of inaccurate data; request deletion (subject to legal retention requirements); request data portability; object to processing based on legitimate interests; withdraw consent for consent-based processing.',
      'To exercise any of these rights, email privacy@coastalcorridor.co. We will respond within 30 days.',
      'If you are not satisfied with our response, you may complain to the UK Information Commissioner\'s Office (ICO) or the Nigeria Data Protection Commission (NDPC).'
    ]
  },
  {
    id: 'security',
    title: '9. Security',
    body: [
      'We protect data using industry-standard measures: TLS encryption in transit, AES-256 encryption at rest, access controls, regular security audits, penetration testing, staff training, and incident response procedures.',
      'Payment card data is never stored on our systems — it is handled by PCI-DSS compliant processors.',
      'KYC documents are stored in encrypted, access-logged secure storage with time-limited signed URLs.',
      'Despite our efforts, no system is perfectly secure. We will notify you promptly and the relevant regulators if a data breach affecting your information occurs.'
    ]
  },
  {
    id: 'children',
    title: '10. Children',
    body: [
      'The platform is not intended for anyone under 18. We do not knowingly collect data from minors. If you believe we have collected data from a minor, email privacy@coastalcorridor.co and we will delete it.'
    ]
  },
  {
    id: 'changes',
    title: '11. Changes to this policy',
    body: [
      'We may update this policy. Material changes will be notified by email and a prominent in-app notice at least 14 days before they take effect. The effective date is shown at the top of this page.'
    ]
  },
  {
    id: 'contact',
    title: '12. Contact us',
    body: [
      'Privacy questions: privacy@coastalcorridor.co',
      'Data subject requests: privacy@coastalcorridor.co (clearly marked "DSAR")',
      'Data Protection Officer: available at privacy@coastalcorridor.co',
      'Supervisory authorities: UK ICO (ico.org.uk) and Nigeria NDPC (ndpc.gov.ng)'
    ]
  }
];

export default function PrivacyPage() {
  return (
    <>
      <section className="container-x py-16">
        <div className="eyebrow mb-4">Privacy policy</div>
        <h1 className="font-serif text-[44px] md:text-[56px] leading-[1.05] tracking-tightest font-light max-w-3xl mb-6">
          How we handle your information.
        </h1>
        <div className="flex flex-wrap gap-4 text-[12px] font-mono text-ink/60">
          <span>Effective 19 April 2026</span>
          <span>·</span>
          <span>Compliant with NDPR and UK GDPR</span>
        </div>
      </section>

      <section className="container-x pb-10">
        <div className="bg-ocean/10 border border-ocean/30 rounded-lg p-5 flex items-start gap-3 max-w-4xl">
          <Shield className="h-5 w-5 text-ocean flex-shrink-0 mt-0.5" />
          <div className="text-[13px] text-ink/80 leading-relaxed">
            <span className="font-semibold">Our commitment.</span> We never sell your data. We never share it beyond what is required to run the service.
            We hold it only as long as we must. You have full rights over it and we honour them within 30 days. We notify you promptly if anything goes wrong.
          </div>
        </div>
      </section>

      <section className="container-x pb-20">
        <div className="grid md:grid-cols-[260px_1fr] gap-12">
          <aside className="md:sticky md:top-24 md:self-start">
            <div className="eyebrow mb-4">Contents</div>
            <nav>
              <ol className="space-y-2 text-[13px]">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-ink/70 hover:text-ink transition-colors leading-snug">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <div className="max-w-3xl space-y-12">
            {sections.map((section) => (
              <article key={section.id} id={section.id}>
                <h2 className="font-serif text-[26px] md:text-[30px] font-medium tracking-display mb-4">
                  {section.title}
                </h2>
                <div className="space-y-4">
                  {section.body.map((para, i) => (
                    <p key={i} className="text-[15px] text-ink/80 leading-relaxed">{para}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
