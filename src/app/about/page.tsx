import Link from 'next/link';
import { ArrowRight, MapPin, Building2, Flag } from 'lucide-react';

export const metadata = {
  title: 'About · Coastal Corridor',
  description: 'Building the trust layer for Nigerian real estate — who we are and why we are doing this'
};

export default function AboutPage() {
  return (
    <>
      {/* HERO */}
      <section className="container-x py-20 md:py-24">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">About Coastal Corridor</div>
          <h1 className="font-serif text-[44px] md:text-[68px] leading-[1.02] tracking-tightest font-light mb-6">
            We are building the trust layer
            <span className="italic text-laterite"> Nigerian real estate has never had.</span>
          </h1>
          <p className="text-[18px] md:text-[20px] text-ink/70 leading-relaxed font-light">
            Nigeria will build its largest-ever infrastructure project along 700 kilometres of coastline.
            The generational wealth it creates will accrue disproportionately to whoever solves the trust gap
            between that opportunity and the capital waiting to fund it. That&apos;s us. That&apos;s what we are for.
          </p>
        </div>
      </section>

      {/* MISSION */}
      <section className="bg-ink text-paper py-20">
        <div className="container-x">
          <div className="grid md:grid-cols-[300px_1fr] gap-10">
            <div className="eyebrow-on-dark">§ 01 · Our mission</div>
            <div>
              <p className="font-serif text-[28px] md:text-[36px] leading-[1.15] tracking-tightest font-light mb-6">
                To bring Nigerian real estate into the light —
                <span className="italic text-ocean-2"> verified, priced honestly, and accessible to every Nigerian who wants a piece of home,</span>
                wherever in the world they currently live.
              </p>
              <p className="text-[16px] text-paper/70 leading-relaxed">
                The infrastructure is being built. The capital exists. The diaspora wants to come home, even if only partially.
                The missing piece has always been a platform that deserves the trust of people who have been burned before.
                We are building that platform, and nothing else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* VALUES */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ 02 · Our values</div>
        <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-12 max-w-3xl">
          Five commitments that explain every decision we make.
        </h2>

        <div className="space-y-10">
          {[
            {
              n: '01',
              title: 'Honesty over optimism',
              desc: 'We publish flood risk, dispute risk, and title status openly. A plot with problems is listed with its problems visible. We lose short-term transactions this way. We gain something harder to build — trust that compounds.'
            },
            {
              n: '02',
              title: 'Substance over surface',
              desc: 'We verify at the registry, not just in the marketing copy. We visit every plot. We consult the community. Our moat is not our technology; it is the work we do behind it.'
            },
            {
              n: '03',
              title: 'Diaspora as first-class users',
              desc: 'Most Nigerian platforms treat the diaspora as an afterthought. We built ours around the diaspora first and the domestic market second. Every feature is tested against whether a buyer in London can use it without support.'
            },
            {
              n: '04',
              title: 'Long-term alignment',
              desc: 'Our agents keep 85% of commission. Our developers pay 3-5%, not 10%. Our fractional products cap performance fees at 15% above hurdle. We design our economics for the platform to outlast any individual deal.'
            },
            {
              n: '05',
              title: 'Boring infrastructure',
              desc: 'The exciting parts are the easy parts to get wrong. We prioritise the unglamorous work — proper escrow, real legal review, compliance infrastructure, security hardening — over the shiny surfaces that win demos but lose trust.'
            }
          ].map((v) => (
            <div key={v.n} className="grid md:grid-cols-[120px_1fr] gap-8 pb-10 border-b border-ink/10 last:border-0">
              <div className="font-serif text-[54px] md:text-[68px] font-light tracking-tightest text-laterite leading-none">
                {v.n}
              </div>
              <div>
                <h3 className="font-serif text-[26px] md:text-[30px] font-medium tracking-display mb-4">{v.title}</h3>
                <p className="text-[16px] text-ink/75 leading-relaxed max-w-2xl">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* STRUCTURE */}
      <section className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="eyebrow mb-4">§ 03 · Structure</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-10 max-w-3xl">
            How we are organised.
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-8 bg-white border border-ink/10 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Building2 className="h-5 w-5 text-ocean" />
                <span className="font-mono text-[10px] text-ink/60 uppercase tracking-wider">Holding company</span>
              </div>
              <h3 className="font-serif text-[22px] font-medium tracking-display mb-3">Coastal Corridor Ltd (UK)</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed mb-4">
                Our UK holding company houses intellectual property, international contracts, and capital markets
                relationships. Provides SEIS/EIS-eligible investment structure for UK backers and clean exit path.
              </p>
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Jurisdiction</dt>
                  <dd>England & Wales</dd>
                </div>
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Registered office</dt>
                  <dd>London</dd>
                </div>
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Structure</dt>
                  <dd>Private limited by shares</dd>
                </div>
              </dl>
            </div>

            <div className="p-8 bg-white border border-ink/10 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <Flag className="h-5 w-5 text-laterite" />
                <span className="font-mono text-[10px] text-ink/60 uppercase tracking-wider">Operating company</span>
              </div>
              <h3 className="font-serif text-[22px] font-medium tracking-display mb-3">Coastal Corridor Nigeria Ltd</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed mb-4">
                Our Nigerian operating company handles on-the-ground activity — field verification, state
                government partnerships, regulated real estate operations, and naira-denominated transactions.
              </p>
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Jurisdiction</dt>
                  <dd>Federal Republic of Nigeria</dd>
                </div>
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Head office</dt>
                  <dd>Lagos</dd>
                </div>
                <div className="flex justify-between border-t border-ink/8 pt-2">
                  <dt className="text-ink/60">Regulated by</dt>
                  <dd>CAC · SEC Nigeria · CBN</dd>
                </div>
              </dl>
            </div>
          </div>

          <p className="mt-8 text-[13px] text-ink/60 max-w-3xl">
            This dual-entity architecture is the standard used by Paystack, Flutterwave, Andela, and most Africa-focused
            venture-scale companies. It combines UK capital markets efficiency with Nigerian operational authenticity.
          </p>
        </div>
      </section>

      {/* THE FOUNDERS NOTE */}
      <section className="container-x py-20">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">§ 04 · A note from the founder</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-10">
            Why this, why now, why us.
          </h2>

          <div className="space-y-6 text-[16px] text-ink/80 leading-relaxed">
            <p>
              I have watched too many conversations between diaspora Nigerians about real estate end the same way.
              Someone brings up a plot they saw advertised. Someone else says their cousin lost money on that exact
              estate five years ago. Everyone nods. The conversation moves on. Nothing gets built.
            </p>
            <p>
              Meanwhile a government is spending trillions of naira on a highway that will reshape the Nigerian
              coast. Pension funds are noticing. Foreign DFIs are positioning. The Nigerian diaspora — which sent
              home twenty billion dollars last year — is still largely on the sidelines because we have lived the
              trust failure firsthand and we are not willing to live it again.
            </p>
            <p>
              Coastal Corridor is my attempt to close that specific gap. Not by inventing some AI magic.
              Not by wrapping the same platform in better marketing. By doing the work that makes trust earnable.
              Verifying titles at source. Walking plots physically. Respecting the community systems that exist.
              Publishing risk openly. Providing genuine support to people transacting from 4,000 miles away.
            </p>
            <p>
              The timing will never be better. The infrastructure is mid-cycle. The technology finally lets us do
              this at scale. The diaspora capital base is at a historic peak. Whoever builds the trust layer now
              captures a generational position. I intend for that to be us.
            </p>
            <p className="font-serif italic text-[18px] pt-4 border-t border-ink/10">
              — Adey,
              <span className="text-ink/60 not-italic font-sans text-[14px]"> Founder</span>
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink text-paper py-16">
        <div className="container-x">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/careers" className="group p-8 border border-paper/10 rounded-lg hover:bg-paper/5 transition-colors">
              <h3 className="font-serif text-[22px] font-medium tracking-display mb-2">Join the team</h3>
              <p className="text-[13px] text-paper/60 mb-4">Hiring across engineering, real estate ops, and go-to-market.</p>
              <div className="flex items-center gap-2 text-[12px] text-ocean-2 group-hover:gap-3 transition-all">
                Open roles <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
            <Link href="/press" className="group p-8 border border-paper/10 rounded-lg hover:bg-paper/5 transition-colors">
              <h3 className="font-serif text-[22px] font-medium tracking-display mb-2">Press & media</h3>
              <p className="text-[13px] text-paper/60 mb-4">Media kit, founder bio, and press enquiries.</p>
              <div className="flex items-center gap-2 text-[12px] text-ocean-2 group-hover:gap-3 transition-all">
                Press room <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
            <Link href="/contact" className="group p-8 border border-paper/10 rounded-lg hover:bg-paper/5 transition-colors">
              <h3 className="font-serif text-[22px] font-medium tracking-display mb-2">Contact us</h3>
              <p className="text-[13px] text-paper/60 mb-4">For partnerships, investment, or just a conversation.</p>
              <div className="flex items-center gap-2 text-[12px] text-ocean-2 group-hover:gap-3 transition-all">
                Get in touch <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
