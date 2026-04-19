import Link from 'next/link';
import {
  ArrowRight, Globe2, Heart, Plane, Phone, Shield, Video,
  Building, Check, Users
} from 'lucide-react';

export const metadata = {
  title: 'Diaspora Services · Coastal Corridor',
  description: 'Built for Nigerians abroad — verified properties, virtual tours, UK-resident legal counsel, multi-currency escrow'
};

export default function DiasporaPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(77,179,179,0.3) 0%, transparent 55%), radial-gradient(circle at 75% 50%, rgba(201,106,63,0.2) 0%, transparent 55%)'
          }} />
        </div>

        <div className="container-x relative z-10 py-20 md:py-32">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6 flex items-center gap-3">
              <Globe2 className="h-3.5 w-3.5" />
              For Nigerians abroad
            </div>
            <h1 className="font-serif text-[44px] md:text-[76px] leading-[0.98] tracking-tightest mb-6 font-light">
              Build at home
              <span className="block italic text-ocean-2">from anywhere in the world.</span>
            </h1>
            <p className="text-[17px] md:text-[22px] text-paper/75 leading-relaxed max-w-2xl mb-10 font-light">
              You left to build a life. You didn&apos;t stop being Nigerian. We built this platform for the 20 million of us
              abroad who want to own a piece of home — and have always had one good reason not to.
              We built the reason to start.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/properties" className="btn-primary">
                Browse verified properties
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#concierge" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
                Diaspora concierge
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* COUNTRIES SERVED STRIP */}
      <section className="bg-ink-3 text-paper border-t border-paper/10">
        <div className="container-x py-8">
          <div className="flex items-center gap-6 flex-wrap justify-center text-[13px] text-paper/60">
            <span className="eyebrow-on-dark">Serving diaspora in</span>
            {['United Kingdom', 'United States', 'Canada', 'UAE', 'Germany', 'Ireland', 'Australia', 'Netherlands', 'South Africa', 'Italy'].map((c) => (
              <span key={c} className="font-mono text-[11px] uppercase tracking-wider">{c}</span>
            ))}
          </div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="container-x py-20">
        <div className="max-w-3xl">
          <div className="eyebrow mb-4">§ 01 · Why most diaspora Nigerians haven&apos;t bought</div>
          <h2 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light mb-8">
            You&apos;ve heard the stories.
            <span className="italic text-laterite block">Maybe one of them is yours.</span>
          </h2>
          <p className="text-[17px] text-ink/75 leading-relaxed mb-5">
            An uncle who sent millions to build a compound and found goats grazing on an empty plot a decade later.
            A sister who bought land in Ajah twice — first from the family who didn&apos;t own it, then from the ones who
            did, because the omo onile wouldn&apos;t let anyone start building otherwise.
          </p>
          <p className="text-[17px] text-ink/75 leading-relaxed mb-5">
            A friend whose certificate of occupancy turned out to belong to someone else entirely. A cousin who
            paid for a house that got demolished by the state six months later because it was built on government land.
          </p>
          <p className="text-[17px] text-ink/75 leading-relaxed">
            These stories are not exceptions. They are the default. And they are the reason most diaspora Nigerians
            send money home for school fees, weddings, and medical bills — but never commit the larger capital for
            the house, the plot, the legacy we all said we&apos;d build.
          </p>
        </div>
      </section>

      {/* THE ANSWER */}
      <section className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="max-w-3xl mb-14">
            <div className="eyebrow mb-4">§ 02 · What we built instead</div>
            <h2 className="font-serif text-[36px] md:text-[48px] leading-[1.05] tracking-tightest font-light mb-6">
              Six things every diaspora buyer
              <span className="italic text-ocean"> has always needed.</span>
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed">
              We didn&apos;t design this for domestic buyers and then add a currency converter. We designed it from
              the beginning around what you actually need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            {[
              {
                icon: Shield,
                title: 'Title verified at the registry',
                desc: 'Every listing passes through five verification layers including direct state land registry search. We find the problems before you send money.'
              },
              {
                icon: Video,
                title: 'Walk properties in VR before you visit',
                desc: 'Matterport 3D scans let you walk the full interior from London or Toronto. VR headset optional. Browser walks work too.'
              },
              {
                icon: Plane,
                title: 'On-demand video site visits',
                desc: 'Our field officer can be at any property within 48 hours for a live video walkthrough. You direct the camera. You ask the questions.'
              },
              {
                icon: Building,
                title: 'UK-resident legal counsel',
                desc: 'Our legal panel includes Nigerian lawyers licensed in the UK. Contract review, translation of legal language, and representation at closing — without you flying.'
              },
              {
                icon: Globe2,
                title: 'Multi-currency payment',
                desc: 'Pay in GBP, USD, EUR, CAD, or NGN through licensed FX partners. CCI issued automatically for CBN compliance and eventual repatriation.'
              },
              {
                icon: Heart,
                title: 'Community support circles',
                desc: 'Connect with diaspora buyers from your state, city, or alma mater who have already transacted. Because asking an uncle is cultural. We respect that.'
              }
            ].map((item, i) => (
              <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg hover:border-ink/20 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 h-11 w-11 rounded-full bg-ocean/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-ocean" />
                  </div>
                  <div>
                    <h3 className="font-serif text-[20px] font-medium tracking-display mb-2">{item.title}</h3>
                    <p className="text-[14px] text-ink/70 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONCIERGE */}
      <section id="concierge" className="container-x py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="eyebrow mb-4">§ 03 · Diaspora concierge</div>
            <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-6">
              One phone number.
              <span className="italic text-laterite"> One case owner. </span>
              From first question to keys in hand.
            </h2>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-5">
              Every diaspora purchase through our platform is assigned a dedicated concierge — a single named person
              who coordinates the field officer, the lawyer, the escrow bank, the state registry, and you.
            </p>
            <p className="text-[16px] text-ink/70 leading-relaxed mb-8">
              You don&apos;t chase five WhatsApp chats. You call one number. They answer. They know your file. If you
              haven&apos;t heard from them in 48 hours, it&apos;s because they&apos;re actively moving your transaction forward.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn-primary">
                Request concierge call
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="bg-ink text-paper rounded-lg p-8 md:p-10">
            <div className="eyebrow-on-dark mb-6">Concierge services include</div>
            <ul className="space-y-4">
              {[
                'Property shortlisting based on your brief and budget',
                'On-demand video site visits coordinated in 48 hours',
                'Document translation and review by UK-resident counsel',
                'CCI processing and multi-currency payment coordination',
                'Governor&apos;s Consent processing where applicable',
                'Post-transaction handover including utilities setup',
                'Quarterly check-ins on your property while abroad',
                'Family visit coordination including security briefing'
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[14px] text-paper/85 leading-relaxed">
                  <Check className="h-4 w-4 text-ocean-2 flex-shrink-0 mt-0.5" />
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-8 border-t border-paper/10 text-[12px] text-paper/50">
              Concierge included in all transactions above ₦40M. Available as standalone service for ₦150,000/month.
            </div>
          </div>
        </div>
      </section>

      {/* BY THE NUMBERS */}
      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="eyebrow mb-4 text-center">§ 04 · Diaspora, by the numbers</div>
          <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light text-center mb-12 max-w-3xl mx-auto">
            Our diaspora story in six facts.
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { v: '68%', l: 'of Epe plot sales are to diaspora buyers' },
              { v: '54%', l: 'of all corridor inquiries originate abroad' },
              { v: '42', l: 'countries with active platform users' },
              { v: '14 days', l: 'average transaction close time for diaspora buyers' },
              { v: '£/$/€/₦', l: 'currencies accepted at no FX markup' },
              { v: '0', l: 'disputed transactions since platform launch' }
            ].map((s, i) => (
              <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg">
                <div className="font-serif text-[42px] md:text-[48px] font-medium tracking-tightest text-ocean leading-none mb-2">
                  {s.v}
                </div>
                <div className="text-[13px] text-ink/70 leading-relaxed">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING */}
      <section className="bg-ink text-paper py-20">
        <div className="container-x text-center max-w-3xl">
          <h2 className="font-serif text-[36px] md:text-[48px] leading-tight tracking-tightest font-light mb-6">
            Come home,
            <span className="italic text-ocean-2"> even before you come home.</span>
          </h2>
          <p className="text-[16px] text-paper/75 leading-relaxed mb-8">
            Start with one verified listing. Walk it in VR. Ask every question you need to ask. When you&apos;re ready,
            we handle the rest. When you&apos;re not, we&apos;re still here.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/properties" className="btn-primary">
              Start browsing
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/map" className="btn-secondary !text-paper !border-paper/30 hover:!bg-paper/10">
              Open the 3D map
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
