import Link from 'next/link';
import { ArrowRight, Download, Mail, FileText, Image as ImageIcon, Video } from 'lucide-react';

export const metadata = {
  title: 'Press · Coastal Corridor',
  description: 'Press releases, media kit, and founder biography'
};

const pressReleases = [
  {
    date: '2026-04-15',
    type: 'Product',
    title: 'Coastal Corridor launches verified real estate marketplace for 700km Lagos-Calabar highway',
    excerpt: 'Platform opens to diaspora buyers with five-layer title verification, VR property tours, and multi-currency escrow across 12 corridor destinations.'
  },
  {
    date: '2026-03-22',
    type: 'Partnership',
    title: 'Coastal Corridor signs MoU with Lagos State Land Bureau for LandWeb integration',
    excerpt: 'Partnership enables real-time title verification against the state cadastral registry for every Lagos-based property listing on the platform.'
  },
  {
    date: '2026-02-08',
    type: 'Funding',
    title: 'Coastal Corridor closes £500k pre-seed round led by diaspora angels',
    excerpt: 'Funds will accelerate GIS infrastructure build, expand verification operations, and onboard first cohort of licensed real estate agents.'
  },
  {
    date: '2026-01-12',
    type: 'Research',
    title: 'New report: Nigerian diaspora would invest £2.3 billion in property annually if trust barriers were solved',
    excerpt: 'Coastal Corridor commissioned survey of 3,200 diaspora Nigerians reveals overwhelming demand gated almost entirely by verification concerns.'
  }
];

export default function PressPage() {
  return (
    <>
      {/* HERO */}
      <section className="container-x py-16 md:py-20">
        <div className="eyebrow mb-4">Press & media</div>
        <h1 className="font-serif text-[44px] md:text-[60px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-6">
          For journalists, analysts,
          <span className="italic text-laterite"> and researchers.</span>
        </h1>
        <p className="text-[17px] text-ink/70 leading-relaxed max-w-2xl font-light">
          Covering Nigerian real estate, diaspora investment, African infrastructure, or proptech more broadly?
          Everything you need is here. Where it isn&apos;t, our media team responds within one business day.
        </p>
      </section>

      {/* CONTACT BAR */}
      <section className="bg-ink text-paper">
        <div className="container-x py-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="eyebrow-on-dark mb-1">Media enquiries</div>
              <div className="flex items-center gap-2 font-mono text-[15px]">
                <Mail className="h-4 w-4 text-ocean-2" />
                <a href="mailto:press@coastalcorridor.co" className="hover:text-ocean-2 transition-colors">
                  press@coastalcorridor.co
                </a>
              </div>
            </div>
            <div>
              <div className="eyebrow-on-dark mb-1">Response time</div>
              <div className="font-mono text-[14px] text-paper/70">1 business day · typically faster</div>
            </div>
            <div>
              <div className="eyebrow-on-dark mb-1">Founder availability</div>
              <div className="font-mono text-[14px] text-paper/70">Interviews by appointment</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRESS RELEASES */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ 01 · Press releases</div>
        <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-10">
          Recent announcements
        </h2>

        <div className="space-y-4">
          {pressReleases.map((pr, i) => (
            <article key={i} className="grid md:grid-cols-[180px_1fr_auto] gap-6 p-6 bg-white border border-ink/10 rounded-lg hover:shadow-card transition-all">
              <div>
                <div className="font-mono text-[10px] text-ink/50 uppercase tracking-wider mb-1">
                  {new Date(pr.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
                <span className="chip bg-laterite/15 text-laterite-2">{pr.type}</span>
              </div>
              <div>
                <h3 className="font-serif text-[20px] font-medium tracking-display leading-snug mb-2">{pr.title}</h3>
                <p className="text-[13px] text-ink/65 leading-relaxed">{pr.excerpt}</p>
              </div>
              <div className="flex items-start">
                <button className="btn-secondary !py-2 !px-3 !text-[11px] whitespace-nowrap">
                  <Download className="h-3 w-3" />
                  Full release
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* MEDIA KIT */}
      <section className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 02 · Media kit</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-10 max-w-3xl">
            Brand assets and usage guidance
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ImageIcon,
                title: 'Logos and wordmarks',
                format: 'PNG, SVG, EPS',
                size: '42 MB',
                desc: 'Primary logo, wordmark, monogram. Light and dark variants. Clear space guidelines included.'
              },
              {
                icon: FileText,
                title: 'Founder biography',
                format: 'PDF, DOCX',
                size: '1.2 MB',
                desc: 'Long and short-form founder bios, approved headshots, and background on the company thesis.'
              },
              {
                icon: Video,
                title: 'Product footage',
                format: 'MP4, MOV',
                size: '380 MB',
                desc: 'B-roll of platform, 3D corridor map demo, field verification team. Broadcast-quality with music stems.'
              },
              {
                icon: ImageIcon,
                title: 'Corridor photography',
                format: 'JPG, TIFF',
                size: '1.8 GB',
                desc: 'High-resolution drone and ground photography of 12 corridor destinations. Full commercial use rights.'
              },
              {
                icon: FileText,
                title: 'Fact sheet and stats',
                format: 'PDF',
                size: '840 KB',
                desc: 'Key company facts, up-to-date platform statistics, market context, and talking points.'
              },
              {
                icon: FileText,
                title: 'Diaspora market research',
                format: 'PDF',
                size: '6.4 MB',
                desc: '2026 survey of 3,200 diaspora Nigerians on property investment intent, barriers, and preferences.'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg hover:border-ink/20 transition-colors">
                <item.icon className="h-5 w-5 text-ocean mb-4" />
                <h3 className="font-serif text-[18px] font-medium tracking-display mb-2">{item.title}</h3>
                <div className="flex gap-3 text-[10px] font-mono text-ink/50 uppercase tracking-wider mb-3">
                  <span>{item.format}</span>
                  <span>·</span>
                  <span>{item.size}</span>
                </div>
                <p className="text-[13px] text-ink/70 leading-relaxed mb-5">{item.desc}</p>
                <button className="flex items-center gap-2 text-[12px] font-medium text-laterite hover:text-laterite-2 transition-colors">
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BOILERPLATE */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ 03 · About Coastal Corridor (boilerplate)</div>
        <h2 className="font-serif text-[28px] md:text-[32px] leading-tight tracking-display font-light mb-8">
          Use this in articles
        </h2>

        <div className="bg-ink text-paper p-8 md:p-10 rounded-lg border border-ink-3 max-w-4xl">
          <div className="eyebrow-on-dark mb-4">Approved boilerplate · 70 words</div>
          <p className="text-[16px] leading-relaxed text-paper/90 font-light">
            Coastal Corridor is the verified real estate and tourism platform for the Lagos-Calabar Coastal Highway —
            a 700-kilometre infrastructure corridor reshaping the Nigerian coast. The company verifies every listing
            through a five-layer stack including state registry search, field visit, and continuous satellite monitoring,
            with a particular focus on serving diaspora Nigerian buyers in the UK, US, Canada, and UAE. Coastal Corridor
            is incorporated in the United Kingdom with a wholly-owned Nigerian operating company.
          </p>

          <div className="mt-6 pt-6 border-t border-paper/10">
            <button className="btn-primary !py-2 !px-4 !text-[11px]">
              Copy boilerplate
            </button>
          </div>
        </div>
      </section>

      {/* PRESS CONTACT */}
      <section className="bg-paper-2 py-20">
        <div className="container-x max-w-3xl">
          <div className="eyebrow mb-4">§ 04 · Press contact</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-6">
            Speak to us directly.
          </h2>
          <p className="text-[15px] text-ink/70 leading-relaxed mb-8">
            We respond to every press enquiry within one business day. For urgent requests or broadcast interviews,
            flag the deadline in the subject line.
          </p>

          <form className="grid md:grid-cols-2 gap-3">
            <input type="text" placeholder="Your name" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <input type="text" placeholder="Publication" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <input type="email" placeholder="Work email" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <input type="text" placeholder="Deadline (if any)" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <textarea rows={4} placeholder="Your enquiry" className="md:col-span-2 bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40 resize-none" />
            <button type="button" className="btn-primary md:col-span-2 !py-3">
              Submit press enquiry
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
