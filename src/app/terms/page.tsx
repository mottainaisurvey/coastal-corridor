import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service · Coastal Corridor',
  description: 'Terms governing your use of the Coastal Corridor platform'
};

const sections = [
  {
    id: 'agreement',
    title: '1. The agreement',
    body: [
      'These terms form a legal agreement between you and Coastal Corridor Ltd (UK company) and/or Coastal Corridor Nigeria Ltd (Nigerian company), collectively "Coastal Corridor", "we", "us", "our".',
      'By accessing or using the platform — our website, mobile apps, or any associated service — you agree to these terms. If you do not agree, do not use the platform.',
      'We may update these terms. Material changes will be notified at least 14 days before they take effect. Continued use after changes constitutes acceptance.'
    ]
  },
  {
    id: 'who-can-use',
    title: '2. Who can use the platform',
    body: [
      'You must be at least 18 years old to create an account. You must be legally capable of entering into binding contracts in your jurisdiction.',
      'Certain features — fractional ownership, institutional data access, transaction processing — require additional verification including KYC and, where applicable, accredited investor status.',
      'We may refuse or terminate accounts at our discretion, with reason provided where not legally prohibited.'
    ]
  },
  {
    id: 'platform-role',
    title: '3. Our role on the platform',
    body: [
      'Coastal Corridor is a technology platform connecting property buyers, sellers, agents, and developers. We are not a party to any real estate transaction between users.',
      'Where we provide verification services, we do so based on reasonable commercial effort. Verification is not a guarantee. Residual risks — future disputes, environmental change, regulatory action — remain with the buyer and seller.',
      'All property transactions are subject to independent professional advice, proper due diligence, and Nigerian real estate law. We strongly recommend you engage your own lawyer and surveyor.'
    ]
  },
  {
    id: 'listings',
    title: '4. Listings and agent conduct',
    body: [
      'Agents listing on the platform must hold current ESVARBON registration. Developers must be registered with the Corporate Affairs Commission (CAC).',
      'Agents and developers warrant that listings are accurate, that they have authority to list the property, and that they will complete disclosed transactions in good faith.',
      'We reserve the right to remove listings, suspend agents, or terminate developer relationships where conduct falls below platform standards.'
    ]
  },
  {
    id: 'acceptable-use',
    title: '5. Acceptable use',
    body: [
      'You agree not to: upload false or misleading information; impersonate another person; use the platform for money laundering, fraud, or any illegal purpose; scrape, reverse-engineer, or otherwise attempt to extract the platform\'s underlying data; harass other users; circumvent our verification or security measures.',
      'We log platform activity to detect abuse. Suspected abuse may result in account suspension and, where appropriate, referral to regulatory or law enforcement authorities.'
    ]
  },
  {
    id: 'transactions',
    title: '6. Transactions and escrow',
    body: [
      'Real property transactions conducted through the platform flow through licensed Nigerian escrow banks. We do not hold customer funds.',
      'We charge a platform fee on closed transactions as disclosed in the applicable listing or agent agreement. The fee structure is transparent and published on the For Developers and For Agents pages.',
      'Transactions are subject to the terms of the individual sale contract, Nigerian property law, and the escrow bank\'s terms. In case of dispute, the contractual terms govern.'
    ]
  },
  {
    id: 'fractional',
    title: '7. Fractional investment products',
    body: [
      'Fractional ownership opportunities are offered through licensed Nigerian SPVs under SEC Nigeria frameworks. Each opportunity has its own prospectus, subscription agreement, and shareholder rights.',
      'Investment in fractional products carries risk of loss. Projected yields are estimates based on comparable assets, not guarantees. Values can fall as well as rise.',
      'You must complete KYC, satisfy any accredited investor requirements, and read the full prospectus before investing.'
    ]
  },
  {
    id: 'ip',
    title: '8. Intellectual property',
    body: [
      'The platform, including its design, text, graphics, code, and organization of content, is owned by Coastal Corridor and protected by copyright, trademark, and other intellectual property laws.',
      'Property photography and descriptions provided by agents and developers remain their property but are licensed to us for display on the platform.',
      'You may not reproduce, distribute, or create derivative works from platform content without our written permission.'
    ]
  },
  {
    id: 'liability',
    title: '9. Limitation of liability',
    body: [
      'To the maximum extent permitted by law, Coastal Corridor is not liable for indirect, consequential, incidental, or punitive damages arising from platform use.',
      'Our total liability for any claim arising from your use of the platform is limited to the greater of (a) the fees paid by you to us in the 12 months preceding the claim, or (b) £500 / ₦500,000.',
      'Nothing in these terms excludes liability that cannot be excluded by law, including for fraud, gross negligence, or personal injury.'
    ]
  },
  {
    id: 'indemnity',
    title: '10. Indemnity',
    body: [
      'You agree to indemnify and hold harmless Coastal Corridor against claims, losses, or costs arising from your breach of these terms, your misuse of the platform, or your violation of any third-party rights.'
    ]
  },
  {
    id: 'termination',
    title: '11. Termination',
    body: [
      'You may close your account at any time through your account settings or by contacting us.',
      'We may suspend or terminate your account for material breach of these terms, prolonged inactivity, or where required by law.',
      'Sections addressing liability, intellectual property, and governing law survive termination.'
    ]
  },
  {
    id: 'law',
    title: '12. Governing law and jurisdiction',
    body: [
      'These terms are governed by the laws of England and Wales, except that: (a) Nigerian property transactions are governed by Nigerian law, (b) Nigerian regulatory matters are governed by the applicable Nigerian regulator\'s rules, and (c) fractional investment products are governed by SEC Nigeria frameworks.',
      'Disputes arising from these terms will be resolved in the courts of England and Wales, subject to the exceptions above.'
    ]
  },
  {
    id: 'contact',
    title: '13. Contact',
    body: [
      'For questions about these terms, contact legal@coastalcorridor.co.',
      'For formal legal notices, use the registered office addresses published on our Legal page.'
    ]
  }
];

export default function TermsPage() {
  return (
    <>
      <section className="container-x py-16">
        <div className="eyebrow mb-4">Terms of service</div>
        <h1 className="font-serif text-[44px] md:text-[56px] leading-[1.05] tracking-tightest font-light max-w-3xl mb-6">
          The agreement between us.
        </h1>
        <div className="flex flex-wrap gap-4 text-[12px] font-mono text-ink/60">
          <span>Effective 19 April 2026</span>
          <span>·</span>
          <span>Version 0.1</span>
          <span>·</span>
          <span>Plain English where possible</span>
        </div>
      </section>

      <section className="container-x pb-10">
        <div className="bg-ochre/10 border border-ochre/30 rounded-lg p-5 flex items-start gap-3 max-w-4xl">
          <Info className="h-5 w-5 text-ochre flex-shrink-0 mt-0.5" />
          <div className="text-[13px] text-ink/80 leading-relaxed">
            <span className="font-semibold">Read this.</span> These terms contain important information about your legal rights,
            including limitations on our liability and the way disputes are resolved. Take a few minutes to understand them.
            If anything is unclear, email <a href="mailto:legal@coastalcorridor.co" className="underline">legal@coastalcorridor.co</a>.
          </div>
        </div>
      </section>

      {/* TOC + CONTENT */}
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

      <section className="bg-ink text-paper py-12">
        <div className="container-x max-w-3xl text-center">
          <p className="text-[14px] text-paper/70 mb-4">
            By continuing to use Coastal Corridor, you agree to these terms.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/privacy" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              Privacy policy
            </Link>
            <Link href="/cookies" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              Cookie policy
            </Link>
            <Link href="/legal" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              All legal documents
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
