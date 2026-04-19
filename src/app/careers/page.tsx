import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Users, Heart, Target, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Careers · Coastal Corridor',
  description: 'Join a team building the trust layer for Nigerian real estate'
};

const openRoles = [
  {
    title: 'Chief Technology Officer',
    team: 'Leadership',
    location: 'London / Lagos · hybrid',
    type: 'Full-time · Co-founder track',
    priority: 'priority',
    excerpt: 'Own the full technical architecture — GIS, 3D, marketplace, mobile. Previous geospatial or mapping product experience essential. This is a co-founder-level role for the right person.'
  },
  {
    title: 'Senior GIS Engineer',
    team: 'Engineering',
    location: 'Lagos',
    type: 'Full-time',
    priority: 'priority',
    excerpt: 'ArcGIS Pro, Parcel Fabric, custom spatial analysis services. You will own the geospatial backbone that makes the entire platform possible. Esri experience non-negotiable.'
  },
  {
    title: 'Head of Real Estate Operations',
    team: 'Real Estate',
    location: 'Lagos',
    type: 'Full-time',
    priority: 'priority',
    excerpt: 'ESVARBON-registered practitioner with deep Nigerian real estate transaction experience. Own verification quality, agent relationships, and transactional compliance.'
  },
  {
    title: 'Field Verification Officer',
    team: 'Real Estate',
    location: 'Multiple · Lagos, Calabar, Port Harcourt',
    type: 'Full-time · ×3 positions',
    excerpt: 'Physically visit every plot. Document conditions with GPS and photography. Conduct community consultations. This is the work that makes our promise credible.'
  },
  {
    title: 'Senior Full-Stack Engineer',
    team: 'Engineering',
    location: 'Remote · UK or Nigerian hours',
    type: 'Full-time',
    excerpt: 'Next.js, TypeScript, PostgreSQL. Build the marketplace, agent dashboard, and admin console. Strong opinions on API design and test coverage.'
  },
  {
    title: 'Head of Commercial',
    team: 'Go-to-market',
    location: 'Lagos / London',
    type: 'Full-time',
    excerpt: 'Drive developer partnerships, state government contracts, and institutional relationships. Deep Nigerian commercial network required.'
  },
  {
    title: 'Product Designer',
    team: 'Design',
    location: 'Remote · UK, EU, or Nigeria',
    type: 'Full-time',
    excerpt: 'Own the full product design language. You will work with the founder to evolve the visual system already in place. Portfolio of shipped consumer or prop-tech products required.'
  },
  {
    title: 'Ground Operations Lead (Lagos)',
    team: 'Operations',
    location: 'Lagos',
    type: 'Full-time',
    excerpt: 'The linchpin of Nigerian execution. Drone team coordination, partner meetings, local hiring, office. We cannot overstate how important this role is.'
  }
];

export default function CareersPage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-ink text-paper">
        <div className="container-x py-20 md:py-28">
          <div className="max-w-4xl">
            <div className="eyebrow-on-dark mb-6">Careers</div>
            <h1 className="font-serif text-[44px] md:text-[68px] leading-[1.02] tracking-tightest mb-6 font-light">
              Come build the trust layer
              <span className="italic text-ochre block">your parents needed.</span>
            </h1>
            <p className="text-[17px] md:text-[20px] text-paper/75 leading-relaxed max-w-2xl font-light">
              Every generation of Nigerians abroad has watched family lose money on properties at home.
              We are ending that. If you want to spend the next five years doing work that matters
              to millions of people, this is where to do it.
            </p>
          </div>
        </div>
      </section>

      {/* WHY HERE */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ 01 · Why work here</div>
        <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light mb-12 max-w-3xl">
          Six reasons that matter more than perks.
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Target, title: 'A specific, meaningful problem', desc: 'You are not adding features to a generic SaaS. You are solving one of the most persistent trust failures in one of the fastest-growing economies in the world.' },
            { icon: Users, title: 'Small team, real ownership', desc: 'Everyone here meaningfully shapes the product and company. No layers of management between you and decisions that matter.' },
            { icon: MapPin, title: 'Real cross-border operation', desc: 'UK holding company, Nigerian operating company. Work gets done in both. Most roles involve travel between them.' },
            { icon: Heart, title: 'People who take pride in quality', desc: 'We do not ship half-finished work. We do not cut ethical corners. We do not rush into transactions before the insurance and legal work is done.' },
            { icon: BookOpen, title: 'Genuine learning curve', desc: 'Real estate, GIS, cross-border finance, diaspora culture, construction infrastructure — you will learn more about how the world actually works in two years here than in five years at a typical tech company.' },
            { icon: Target, title: 'Competitive comp, honest equity', desc: 'We pay market or slightly above in both UK and Nigerian bands. We offer equity with four-year vesting and one-year cliffs. We explain the cap table. We write your offer in language you can read.' }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-paper-2 border border-ink/8 rounded-lg">
              <div className="h-11 w-11 rounded-full bg-ocean/10 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-ocean" />
              </div>
              <h3 className="font-serif text-[20px] font-medium tracking-display mb-2">{item.title}</h3>
              <p className="text-[14px] text-ink/70 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* OPEN ROLES */}
      <section className="bg-paper-2 py-20">
        <div className="container-x">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="eyebrow mb-4">§ 02 · Open roles</div>
              <h2 className="font-serif text-[36px] md:text-[44px] leading-tight tracking-display font-light">
                {openRoles.length} positions currently open
              </h2>
            </div>
            <div className="hidden md:block text-[12px] font-mono text-ink/60">
              Updated {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </div>
          </div>

          <div className="space-y-3">
            {openRoles.map((role, i) => (
              <Link
                key={i}
                href={`/careers/${role.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="group block p-6 bg-white border border-ink/10 rounded-lg hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
              >
                <div className="grid md:grid-cols-[1.5fr_1fr_auto] gap-6 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="chip bg-ink/5 text-ink/70">{role.team}</span>
                      {role.priority === 'priority' && (
                        <span className="chip bg-laterite/15 text-laterite-2">Priority hire</span>
                      )}
                    </div>
                    <h3 className="font-serif text-[22px] font-medium tracking-display mb-2 group-hover:text-laterite transition-colors">
                      {role.title}
                    </h3>
                    <p className="text-[14px] text-ink/65 leading-relaxed">{role.excerpt}</p>
                  </div>
                  <div className="space-y-1.5 text-[12px] text-ink/60">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {role.location}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {role.type}
                    </div>
                  </div>
                  <div className="self-center">
                    <ArrowRight className="h-5 w-5 text-ink/30 group-hover:text-ink group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW WE HIRE */}
      <section className="container-x py-20">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <div className="eyebrow mb-4">§ 03 · How we hire</div>
            <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-6">
              Four conversations. No tricks.
            </h2>
            <p className="text-[15px] text-ink/70 leading-relaxed mb-5">
              We do not believe in whiteboard torture sessions, take-home assignments that take a week,
              or panel interviews designed to intimidate. Our process is built around four focused conversations
              that help both sides make an honest decision.
            </p>
            <p className="text-[15px] text-ink/70 leading-relaxed">
              Total time commitment from application to offer is typically three to four weeks. We commit
              to giving every applicant a clear yes or no, never ghost, and give reasons for declines when
              asked.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { n: '01', title: 'Screening call (30 min)', desc: 'Your recruiter walks you through the role, the team, and the company context. You ask whatever you need to ask.' },
              { n: '02', title: 'Hiring manager (60 min)', desc: 'Deep-dive on the role, your experience, and the specific skills the role requires.' },
              { n: '03', title: 'Craft interview (90 min)', desc: 'Paid, structured exercise focused on the actual work. Shared artefact or portfolio review, depending on discipline.' },
              { n: '04', title: 'Founder conversation (45 min)', desc: 'Less technical, more about alignment. We talk about why you want this specific role and we are honest about the trade-offs of joining early.' }
            ].map((step) => (
              <div key={step.n} className="flex gap-5 p-5 bg-white border border-ink/10 rounded-lg">
                <div className="font-serif text-[32px] font-light tracking-tightest text-laterite leading-none flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-serif text-[18px] font-medium tracking-display mb-1">{step.title}</h3>
                  <p className="text-[13px] text-ink/70 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* NOT RIGHT NOW */}
      <section className="bg-ink text-paper py-20">
        <div className="container-x max-w-3xl">
          <div className="eyebrow-on-dark mb-4">§ 04 · Don&apos;t see your role?</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-tightest font-light mb-6">
            We keep talent notes.
          </h2>
          <p className="text-[15px] text-paper/70 leading-relaxed mb-8">
            If you are exceptional at what you do and there is no current role matching your skills, send us your work anyway.
            We maintain a genuine talent pipeline and come back to people when the right opening emerges.
          </p>
          <Link href="mailto:careers@coastalcorridor.co" className="btn-primary">
            Send us your work
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
