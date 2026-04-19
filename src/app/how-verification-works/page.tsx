import Link from 'next/link';
import { ArrowRight, Search, MapPin, Satellite, Users, Shield, FileCheck } from 'lucide-react';

export const metadata = {
  title: 'How Verification Works · Coastal Corridor',
  description: 'Our three-layer verification stack for every property listed on the platform'
};

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Title search at source',
    desc: 'Every title is searched directly against the relevant state land registry. Lagos State LandWeb is live; Cross River, Akwa Ibom, and Rivers are in integration.',
    detail: 'We pull the actual registered title document — Certificate of Occupancy, Deed of Assignment, or Governor\'s Consent — and cross-reference the plot number, owner name, and issue date against state records.'
  },
  {
    icon: MapPin,
    number: '02',
    title: 'Physical site visit',
    desc: 'A licensed field officer visits every plot with RTK GPS, time-stamped photography, and structured documentation.',
    detail: 'They verify the plot is where the document says it is (not always true in older titles), check the perimeter matches the survey drawing, and photograph any existing structures, encroachments, or neighbouring activity.'
  },
  {
    icon: Users,
    number: '03',
    title: 'Community consultation',
    desc: 'For rural and urban-fringe plots, the field team consults with community representatives — the Omo Onile, family heads, or customary chiefs.',
    detail: 'This is the step most platforms skip and most disputes arise from. If the community doesn\'t recognise the title as clean, we surface that openly rather than pretending the registry paperwork is the only truth.'
  },
  {
    icon: Satellite,
    number: '04',
    title: 'Satellite change detection',
    desc: 'Sentinel-2 imagery is pulled for every plot and run through our change detection pipeline monthly.',
    detail: 'We flag new construction, coastal erosion, flooding events, and encroachment automatically. This continues after the plot is listed — so we catch issues that emerge post-verification.'
  },
  {
    icon: FileCheck,
    number: '05',
    title: 'Title status published',
    desc: 'Every plot gets a public title status — Verified, Pending, Disputed, or Rejected — along with honest risk scores.',
    detail: 'A plot rated "Pending" is listable but clearly marked. A plot with elevated flood risk shows that risk prominently on the listing page. We publish problems because hiding them is what breaks trust.'
  }
];

export default function VerificationPage() {
  return (
    <>
      <section className="bg-ink text-paper">
        <div className="container-x py-20 md:py-28">
          <div className="eyebrow-on-dark mb-6">§ How verification works</div>
          <h1 className="font-serif text-[44px] md:text-[68px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-8">
            Five layers of verification.
            <span className="italic text-ocean-2 block">All published openly.</span>
          </h1>
          <p className="text-[18px] text-paper/75 leading-relaxed max-w-2xl font-light">
            Nigerian real estate has a trust problem. We don&apos;t solve it with marketing copy.
            We solve it by doing the work most platforms skip — and showing our findings, including the bad ones.
          </p>
        </div>
      </section>

      <section className="container-x py-20">
        <div className="space-y-10 md:space-y-16">
          {steps.map((step, i) => (
            <div key={step.number} className="grid md:grid-cols-3 gap-8 pb-10 border-b border-ink/10 last:border-0">
              <div>
                <div className="font-mono text-[11px] text-ochre uppercase tracking-[0.2em] mb-2">
                  Step {step.number}
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-ocean/10 flex items-center justify-center flex-shrink-0">
                    <step.icon className="h-5 w-5 text-ocean" />
                  </div>
                  <h2 className="font-serif text-[24px] font-medium tracking-display leading-tight">
                    {step.title}
                  </h2>
                </div>
              </div>
              <div className="md:col-span-2">
                <p className="text-[16px] leading-relaxed text-ink/80 mb-4 font-light">{step.desc}</p>
                <p className="text-[14px] leading-relaxed text-ink/60">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-paper-2 py-16">
        <div className="container-x">
          <div className="max-w-3xl">
            <div className="eyebrow mb-4">§ Important: what verification is not</div>
            <h2 className="font-serif text-[28px] md:text-[36px] leading-tight tracking-display font-light mb-6">
              We cannot guarantee a plot is perfect. Nobody can.
            </h2>
            <p className="text-[15px] text-ink/70 leading-relaxed mb-4">
              What we can do is show you everything we found — the clean parts and the messy parts — so you can make an informed decision with your lawyer and your advisors.
            </p>
            <p className="text-[15px] text-ink/70 leading-relaxed">
              A plot rated &quot;Verified&quot; on our platform has passed five layers of checks. It is not a guarantee against future disputes, environmental changes, or regulatory shifts. But it is a material, auditable standard that no other Nigerian platform currently offers.
            </p>
          </div>
        </div>
      </section>

      <section className="container-x py-16">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="font-serif text-[32px] md:text-[38px] leading-tight tracking-display font-light mb-4">
            Ready to browse?
          </h2>
          <p className="text-[15px] text-ink/70 leading-relaxed mb-6">
            Every property in our marketplace has been through this process. See the findings for yourself.
          </p>
          <Link href="/properties" className="btn-primary">
            Browse verified properties
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
