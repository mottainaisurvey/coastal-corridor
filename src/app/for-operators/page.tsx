'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Path = 'host' | 'operator' | 'both' | null

interface FormData {
  path: Path
  fullName: string
  businessName: string
  email: string
  phone: string
  corridorLocation: string
  countryOfResidence: string
  propertyType: string
  numberOfRooms: string
  currentlyListedOn: string
  operationType: string
  yearsOperating: string
  annualCustomers: string
  aboutOperation: string
  whyCoastalCorridor: string
  additionalInfo: string
}

const INITIAL_FORM: FormData = {
  path: null,
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  corridorLocation: '',
  countryOfResidence: '',
  propertyType: '',
  numberOfRooms: '',
  currentlyListedOn: '',
  operationType: '',
  yearsOperating: '',
  annualCustomers: '',
  aboutOperation: '',
  whyCoastalCorridor: '',
  additionalInfo: '',
}

// Change 8: FAQ reduced from 7 to 5 — removed "What if I'm not selected?" and "What about cancellations?"
const FAQS = [
  {
    q: "What's the difference between a host and an operator?",
    a: "A host provides a place to stay — a beach house, a guesthouse, a boutique hotel, a serviced apartment, a resort. An operator provides something to do — tours, charters, food experiences, transport, events, wellness, or cultural workshops. Some businesses are both: a resort with activities, a guesthouse with guided tours. You can apply as either or both.",
  },
  {
    q: "Why does the platform launch in Q3 2026 rather than now?",
    a: "We are building the verification infrastructure, payment rails, and operator tooling before opening to guests. Launching with a curated, verified cohort means the first guests have a genuinely good experience — which is the only way to build a platform with lasting credibility on the corridor.",
  },
  {
    q: "Do I have to give exclusivity to Coastal Corridor?",
    a: "No. You can list on other platforms simultaneously. We do not require exclusivity. We do ask that your Coastal Corridor listing is accurate, current, and priced consistently with your other channels. Dual-listing is common among early-access cohort members.",
  },
  {
    q: "I'm diaspora-based — can I be a host?",
    a: "Yes. Many of our early-access applicants are diaspora Nigerians who own properties along the corridor but are based in the UK, US, Canada, or UAE. You can manage your listing and receive payouts in your local currency. We handle the on-the-ground operational layer.",
  },
  {
    q: "What about Carnival Calabar specifically?",
    a: "Carnival Calabar is one of the highest-demand events on the corridor — a full month of programming in December drawing international visitors. We build dedicated inventory surfacing, event-specific pricing tools, and targeted diaspora promotion around Carnival. Early-access cohort members in Cross River State receive priority placement during the Carnival window.",
  },
]

// ─────────────────────────────────────────────
// Quiet inline CTA component (Change 4)
// ─────────────────────────────────────────────
function ReadyToApply({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-end pt-10 pb-2">
      <button
        onClick={onClick}
        className="font-mono text-[11px] tracking-[0.18em] text-[#c96a3f] uppercase hover:underline underline-offset-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-offset-2"
        aria-label="Scroll to application form"
      >
        Ready to apply? →
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────
export default function ForOperatorsPage() {
  const [activePath, setActivePath] = useState<Path>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Section refs for IntersectionObserver
  const heroRef = useRef<HTMLElement>(null)
  const whyUsRef = useRef<HTMLElement>(null)
  const pricingRef = useRef<HTMLElement>(null)
  const verificationRef = useRef<HTMLElement>(null)
  const applyRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

  // Sticky nav active section state
  const [activeSection, setActiveSection] = useState<string>('why-us')

  // Floating CTA visibility state
  const [showFloating, setShowFloating] = useState(false)

  // Change 1 & 3: IntersectionObserver for sticky nav active state + floating CTA
  useEffect(() => {
    const sectionMap: { ref: React.RefObject<HTMLElement | null>; id: string }[] = [
      { ref: whyUsRef, id: 'why-us' },
      { ref: pricingRef, id: 'pricing' },
      { ref: verificationRef, id: 'verification' },
      { ref: applyRef, id: 'apply' },
    ]

    // Active section observer (rootMargin: top 40% of viewport)
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matched = sectionMap.find(s => s.ref.current === entry.target)
            if (matched) setActiveSection(matched.id)
          }
        })
      },
      { rootMargin: '-10% 0px -60% 0px', threshold: 0 }
    )

    sectionMap.forEach(({ ref }) => {
      if (ref.current) navObserver.observe(ref.current)
    })

    // Floating CTA: show when hero leaves view, hide when apply section is in upper third
    const heroObserver = new IntersectionObserver(
      ([entry]) => { setShowFloating(!entry.isIntersecting) },
      { threshold: 0.1 }
    )

    // Floating CTA: hide when apply section is meaningfully in view (upper third of viewport)
    const applyObserver = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowFloating(false) },
      { rootMargin: '-33% 0px -66% 0px', threshold: 0 }
    )

    if (heroRef.current) heroObserver.observe(heroRef.current)
    if (applyRef.current) applyObserver.observe(applyRef.current)

    return () => {
      navObserver.disconnect()
      heroObserver.disconnect()
      applyObserver.disconnect()
    }
  }, [])

  const handlePathSelect = (path: Path) => {
    setActivePath(path)
    setForm(prev => ({ ...prev, path }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.path) {
      setSubmitError('Please select whether you are applying as a host, operator, or both.')
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/operators/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const scrollToForm = () => {
    applyRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Smooth scroll to section by id
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0e12] flex items-center justify-center px-6">
        <div className="max-w-xl text-center">
          <p className="font-mono text-xs tracking-[0.18em] text-[#d4a24c] uppercase mb-8">Application received</p>
          <h1 className="font-serif text-5xl font-light text-[#faf8f3] leading-tight mb-6">
            We&apos;ll be in touch within<br /><em className="italic text-[#4a9595] font-normal">ten business days.</em>
          </h1>
          <p className="text-[#faf8f3]/70 text-lg leading-relaxed mb-10">
            A confirmation has been sent to <strong className="text-[#faf8f3]">{form.email}</strong>. We respond to every application — including the ones we cannot progress.
          </p>
          <Link href="/" className="inline-block bg-[#c96a3f] text-[#faf8f3] px-8 py-4 font-mono text-xs tracking-[0.2em] uppercase hover:bg-[#a85530] transition-colors">
            Back to Coastal Corridor →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#faf8f3] text-[#0a0e12]">

      {/* ── HERO ── */}
      <section ref={heroRef} id="hero" className="bg-[#0a0e12] text-[#faf8f3] px-6 md:px-12 pt-28 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'linear-gradient(90deg, #c96a3f 0%, #c96a3f 33%, #d4a24c 33%, #d4a24c 66%, #2d7d7d 66%, #2d7d7d 100%)' }} />
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-[1.4fr_1fr] gap-16 md:gap-20 items-end">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-px bg-[#d4a24c]" />
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">Tourism · Operators &amp; Hosts · Early Access</span>
            </div>
            <h1 className="font-serif font-light text-[clamp(52px,7vw,88px)] leading-[0.98] tracking-[-0.025em] mb-6">
              We&apos;re building the<br />guest list. <em className="italic text-[#4a9595] font-normal">Are you<br />on it?</em>
            </h1>
            <p className="font-serif font-light text-xl text-[#faf8f3]/75 leading-relaxed max-w-[480px] mt-8 mb-10">
              Coastal Corridor&apos;s tourism marketplace launches Q3 2026. Before then, we&apos;re admitting a curated cohort of hosts and operators who will define what corridor tourism looks like at launch. Limited places. Application required.
            </p>
            {/* Change 2: Primary hero CTA */}
            <button
              onClick={scrollToForm}
              className="inline-block bg-[#c96a3f] text-[#faf8f3] px-10 py-4 font-mono text-xs tracking-[0.2em] uppercase hover:bg-[#a85530] transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e12]"
              aria-label="Apply for the early-access cohort"
            >
              Apply for the cohort →
            </button>
          </div>
          <div className="flex flex-col gap-7 pb-2">
            {[
              { label: 'Launch', value: 'Q3 2026' },
              { label: 'Early-access cohort', value: '~80 hosts · ~40 operators' },
              { label: 'Application window', value: 'Open now · Rolling decisions' },
            ].map(item => (
              <div key={item.label} className="border-l-2 border-[#c96a3f] pl-5">
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#6b7079] uppercase mb-2">{item.label}</p>
                <p className="font-serif text-xl text-[#faf8f3] leading-snug">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Change 1: Sticky in-page section navigation */}
      <nav
        className="sticky top-[64px] z-40 bg-[#f5f1ea] border-b border-[#d4d4d0] px-6 md:px-12 overflow-x-auto"
        aria-label="Page sections"
      >
        <div className="max-w-[1280px] mx-auto flex items-center gap-0 min-w-max md:min-w-0">
          {[
            { id: 'why-us', label: 'Why us' },
            { id: 'pricing', label: 'Pricing' },
            { id: 'verification', label: 'Verification' },
            { id: 'apply', label: 'Apply' },
          ].map(link => (
            <button
              key={link.id}
              onClick={() => scrollToSection(link.id)}
              className={`font-mono text-[11px] tracking-[0.18em] uppercase px-5 py-4 border-b-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-inset ${
                activeSection === link.id
                  ? 'border-[#c96a3f] text-[#c96a3f]'
                  : 'border-transparent text-[#0a0e12] hover:text-[#c96a3f]'
              }`}
              aria-current={activeSection === link.id ? 'true' : undefined}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── PATH SELECTOR ── */}
      <section className="bg-[#f5f1ea] px-6 md:px-12 py-20 border-b border-[#d4d4d0]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-[#c96a3f] text-base">§</span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">Two paths · choose yours</span>
          </div>
          <h2 className="font-serif font-light text-[clamp(32px,4.5vw,52px)] leading-tight tracking-[-0.02em] mb-12 max-w-2xl">
            We work with two kinds of supplier on the corridor — <em className="italic text-[#c96a3f] font-normal">and we work with them differently.</em>
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                id: 'host' as Path,
                num: 'Path 01 · For property owners',
                title: 'Hosts',
                desc: 'You own a place where travellers can stay. A beach house, a guesthouse, a boutique hotel, a serviced apartment, a resort. We list it, we send you guests, we handle the trust layer.',
                examples: 'Diaspora-owned beach houses · Boutique guesthouses · Independent hotels\nServiced apartments · Resort operators · Heritage properties',
              },
              {
                id: 'operator' as Path,
                num: 'Path 02 · For experience providers',
                title: 'Operators',
                desc: 'You deliver something travellers can do. Tours, charters, food experiences, transport, events, wellness, cultural workshops. We list your inventory, we send you bookings, we handle the trust layer.',
                examples: 'Tour guides · Boat & fishing charters · Cultural workshops · Food experiences\nTransport operators · Event specialists · Wellness providers',
              },
            ].map(card => {
              const isActive = activePath === card.id
              return (
                <button
                  key={card.id}
                  onClick={() => handlePathSelect(card.id)}
                  className={`text-left p-12 border transition-all duration-300 relative overflow-hidden group ${
                    isActive
                      ? 'bg-[#0a0e12] text-[#faf8f3] border-[#0a0e12]'
                      : 'bg-[#faf8f3] text-[#0a0e12] border-[#d4d4d0] hover:border-[#c96a3f]'
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-[3px] bg-[#c96a3f] transition-transform duration-500 origin-left ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`} />
                  <p className="font-mono text-[11px] tracking-[0.15em] text-[#d4a24c] uppercase mb-6">{card.num}</p>
                  <h3 className="font-serif font-normal text-[36px] leading-tight tracking-[-0.02em] mb-4">{card.title}</h3>
                  <p className={`text-base leading-relaxed mb-6 ${isActive ? 'text-[#faf8f3]/70' : 'text-[#6b7079]'}`}>{card.desc}</p>
                  <div className={`font-mono text-[11px] tracking-[0.05em] uppercase leading-[1.8] pt-6 border-t ${isActive ? 'text-[#d4a24c] border-[#2a2f36]' : 'text-[#6b7079] border-[#d4d4d0]'}`}>
                    {card.examples.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                  </div>
                </button>
              )
            })}
          </div>
          {activePath && (
            <div className="mt-8 text-center">
              <button onClick={scrollToForm} className="bg-[#c96a3f] text-[#faf8f3] px-10 py-4 font-mono text-xs tracking-[0.2em] uppercase hover:bg-[#a85530] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-offset-2">
                Apply as {activePath === 'host' ? 'a Host' : activePath === 'operator' ? 'an Operator' : 'Operator & Host'} →
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── DETAIL: HOSTS ── (Change 5: reduced from 5 to 3 items) */}
      <section ref={whyUsRef} id="why-us" className="px-6 md:px-12 py-24 border-b border-[#d4d4d0]">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-[1fr_1.6fr] gap-20 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-[#c96a3f] text-base">§</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">For hosts</span>
            </div>
            <h2 className="font-serif font-light text-[48px] leading-none tracking-[-0.02em] mb-4">
              Why list <em className="italic text-[#c96a3f] font-normal">with us.</em>
            </h2>
            <p className="font-serif italic text-lg text-[#6b7079] leading-relaxed">Three things current platforms cannot give you, that we will.</p>
          </div>
          <div className="flex flex-col gap-8">
            {[
              { num: '01', title: 'Diaspora demand at scale.', body: 'The Nigerian diaspora travels home in volume — Christmas, weddings, summer holidays, family events. They book early, stay long, and rent for extended families. We acquire them through channels that Booking.com and Hotels.ng cannot match: diaspora newsletters, LinkedIn, family networks, the corridor brand.' },
              { num: '02', title: 'Verified guests, payment cleared.', body: 'Every booking is paid in advance through verified payment rails. No-shows, deposit disputes, and identity uncertainty are operational problems we solve before guests reach you. You receive confirmed, paid bookings with full guest information.' },
              { num: '03', title: 'Multi-currency payouts.', body: 'Receive payouts in Naira to Nigerian accounts, USD to international accounts, or GBP to UK accounts — your choice, set per property. Diaspora-paying guests pay in their currency; we settle yours.' },
            ].map(item => (
              <div key={item.num} className="grid grid-cols-[60px_1fr] gap-6 pb-8 border-b border-[#d4d4d0] last:border-0">
                <p className="font-mono text-[13px] tracking-[0.1em] text-[#c96a3f] pt-1">{item.num}</p>
                <div>
                  <h4 className="font-serif font-normal text-[22px] leading-snug mb-2">{item.title}</h4>
                  <p className="text-[15px] leading-[1.65] text-[#6b7079]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Change 4a: Section-end CTA after host detail */}
        <div className="max-w-[1280px] mx-auto">
          <ReadyToApply onClick={scrollToForm} />
        </div>
      </section>

      {/* ── DETAIL: OPERATORS ── (Change 6: reduced from 5 to 3 items) */}
      <section className="bg-[#f5f1ea] px-6 md:px-12 py-24 border-b border-[#d4d4d0]">
        <div className="max-w-[1280px] mx-auto grid md:grid-cols-[1fr_1.6fr] gap-20 items-start">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-[#c96a3f] text-base">§</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">For operators</span>
            </div>
            <h2 className="font-serif font-light text-[48px] leading-none tracking-[-0.02em] mb-4">
              Why list <em className="italic text-[#c96a3f] font-normal">your inventory.</em>
            </h2>
            <p className="font-serif italic text-lg text-[#6b7079] leading-relaxed">Three things experience providers along the corridor have asked for.</p>
          </div>
          <div className="flex flex-col gap-8">
            {[
              { num: '01', title: 'Pre-trip inventory access.', body: 'Diaspora travellers plan trips three to six months out. Domestic travellers book closer in. Both want to lock experiences before they arrive. List your inventory once, set seasonal pricing, and let our pre-trip funnel fill your calendar before guests land.' },
              { num: '02', title: 'Event-anchored demand.', body: 'Carnival Calabar happens once a year. The Lagos season runs December through January. Eyo Festival, the Argungu Fishing Festival, weddings season — corridor demand is event-driven. We surface your inventory against the events that drive bookings, with promotion that competitors cannot match.' },
              { num: '03', title: 'Verified, insured, accountable.', body: "Operator verification (CAC registration, relevant licences, insurance) raises the bar for the whole category. Guests choose corridor operators because the alternative — an unverified WhatsApp contact — is the operational reality they're trying to avoid." },
            ].map(item => (
              <div key={item.num} className="grid grid-cols-[60px_1fr] gap-6 pb-8 border-b border-[#d4d4d0] last:border-0">
                <p className="font-mono text-[13px] tracking-[0.1em] text-[#c96a3f] pt-1">{item.num}</p>
                <div>
                  <h4 className="font-serif font-normal text-[22px] leading-snug mb-2">{item.title}</h4>
                  <p className="text-[15px] leading-[1.65] text-[#6b7079]">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Change 4b: Section-end CTA after operator detail */}
        <div className="max-w-[1280px] mx-auto">
          <ReadyToApply onClick={scrollToForm} />
        </div>
      </section>

      {/* ── ECONOMICS ── */}
      <section ref={pricingRef} id="pricing" className="bg-[#0a0e12] text-[#faf8f3] px-6 md:px-12 py-24 relative">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #c96a3f 0%, #c96a3f 33%, #d4a24c 33%, #d4a24c 66%, #2d7d7d 66%, #2d7d7d 100%)' }} />
        <div className="max-w-[1280px] mx-auto">
          <div className="grid md:grid-cols-2 gap-20 mb-16 items-end">
            <h2 className="font-serif font-light text-[clamp(36px,5vw,60px)] leading-none tracking-[-0.02em]">
              Commission that <em className="italic text-[#4a9595] font-normal">rewards early commitment.</em>
            </h2>
            <p className="font-serif font-light text-[19px] leading-relaxed text-[#faf8f3]/70">
              Early-access partners lock their rate for twelve months. After that, the standard rate applies. Either way, you keep more per booking than any comparable platform in this market.
            </p>
          </div>
          <div className="grid md:grid-cols-2 border border-[#2a2f36]">
            {[
              { label: 'Early-access rate', num: '8', strike: '12', detail: 'Locked for the first 12 months from launch. Available to cohort members only.' },
              { label: 'Standard rate', num: '12', strike: null, detail: 'Applied after the early-access period. Still below Booking.com (15%), Airbnb (14–16%), and GetYourGuide (20–30%).' },
            ].map((item, i) => (
              <div key={i} className={`p-12 ${i === 0 ? 'border-b md:border-b-0 md:border-r border-[#2a2f36]' : ''}`}>
                <p className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase mb-6">{item.label}</p>
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-serif font-light text-[88px] leading-[0.9] tracking-[-0.04em]">{item.num}%</span>
                  {item.strike && (
                    <span className="font-serif text-[36px] text-[#6b7079] line-through decoration-[#c96a3f] decoration-2">{item.strike}%</span>
                  )}
                </div>
                <p className="font-serif italic text-[16px] text-[#faf8f3]/60 leading-relaxed mt-4">{item.detail}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-3 border-t border-[#2a2f36]">
            {[
              { label: 'Payout schedule', value: 'Weekly', detail: "Every Monday for the prior week's completed bookings" },
              { label: 'Minimum booking value', value: 'None', detail: 'List at any price point. No floor, no ceiling.' },
              { label: 'Accepted currencies', value: 'NGN · USD · GBP · EUR', detail: 'Guest pays in their currency. You receive in yours.' },
            ].map((item, i) => (
              <div key={i} className={`p-8 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-[#2a2f36]' : ''}`}>
                <p className="font-mono text-[10px] tracking-[0.15em] text-[#d4a24c] uppercase mb-3">{item.label}</p>
                <p className="font-serif font-normal text-[22px] leading-snug mb-2">{item.value}</p>
                <p className="text-[14px] text-[#faf8f3]/60 leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
          {/* Change 4c: Section-end CTA after economics — light text on dark bg */}
          <div className="flex justify-end pt-10 pb-2">
            <button
              onClick={scrollToForm}
              className="font-mono text-[11px] tracking-[0.18em] text-[#c96a3f] uppercase hover:underline underline-offset-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e12]"
              aria-label="Scroll to application form"
            >
              Ready to apply? →
            </button>
          </div>
        </div>
      </section>

      {/* ── VERIFICATION ── (Change 7: reduced from 5 to 4 items per column) */}
      <section ref={verificationRef} id="verification" className="px-6 md:px-12 py-24 border-b border-[#d4d4d0]">
        <div className="max-w-[1280px] mx-auto">
          <div className="mb-16 max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-[#c96a3f] text-base">§</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">What verification involves</span>
            </div>
            <h2 className="font-serif font-light text-[clamp(32px,4.5vw,52px)] leading-tight tracking-[-0.02em]">
              The bar is <em className="italic text-[#c96a3f] font-normal">deliberately high.</em>
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            {[
              {
                title: 'Host verification',
                // Removed: "Bank account verification" (Property safety per brief)
                items: [
                  { strong: 'Ownership or management rights.', detail: 'Title deed, C of O, deed of assignment, or a management agreement with the property owner.' },
                  { strong: 'Identity verification.', detail: "Government ID for the host principal. NIN, international passport, or driver's licence." },
                  { strong: 'Photography and listing standard.', detail: 'Professional photography to corridor standard. Provided free of charge for early-access cohort members.' },
                  { strong: 'Guest hosting capacity.', detail: 'Verified Nigerian or international bank account for payout settlement. Confirmation of operational readiness for guest arrivals.' },
                ],
              },
              {
                title: 'Operator verification',
                // Removed: "Operator identity" per brief
                items: [
                  { strong: 'Business registration.', detail: 'CAC registration for Nigerian-registered businesses. Equivalent for international operators.' },
                  { strong: 'Operating licences.', detail: 'Activity-specific licences where applicable — transport licences for charter vehicles, NTDC registration for tour operators, food handler permits for catering.' },
                  { strong: 'Insurance.', detail: 'Public liability insurance appropriate to the activity. Higher cover for higher-risk activities (water sports, mountain experiences, transport).' },
                  { strong: 'Track record.', detail: 'Evidence of prior operating activity — references, prior bookings, online presence, partner verification. New operators are admitted with reduced inventory limits during a probation period.' },
                ],
              },
            ].map(col => (
              <div key={col.title}>
                <h3 className="font-serif font-normal text-[28px] leading-snug mb-8 pb-4 border-b-2 border-[#c96a3f] inline-block">{col.title}</h3>
                <ul className="flex flex-col gap-5">
                  {col.items.map((item, i) => (
                    <li key={i} className="grid grid-cols-[28px_1fr] gap-4 text-[15px] leading-relaxed">
                      <span className="text-[#2d7d7d] font-serif text-lg font-medium" aria-hidden="true">✓</span>
                      <span>
                        <strong className="font-medium block mb-0.5">{item.strong}</strong>
                        <span className="text-[#6b7079] text-[14px]">{item.detail}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {/* Change 4d: Section-end CTA after verification */}
          <ReadyToApply onClick={scrollToForm} />
        </div>
      </section>

      {/* ── TIMELINE ── */}
      <section className="bg-[#f5f1ea] px-6 md:px-12 py-24 border-b border-[#d4d4d0]">
        <div className="max-w-[1280px] mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="font-serif text-[#c96a3f] text-base">§</span>
            <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">From application to first guest</span>
          </div>
          <h2 className="font-serif font-light text-[clamp(32px,4.5vw,52px)] leading-tight tracking-[-0.02em] mb-16 max-w-xl">
            The path is <em className="italic text-[#c96a3f] font-normal">four steps</em>, plainly mapped.
          </h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-[11px] left-0 right-0 h-px bg-[#d4d4d0]" />
            {[
              { dot: 'bg-[#c96a3f]', num: 'Step 01 · Today', title: 'Apply.', detail: 'Complete the application below. Tell us about you, your property or operation, and your prior experience. Takes about 10 minutes.' },
              { dot: 'bg-[#d4a24c]', num: 'Step 02 · 2–3 weeks', title: 'Conversation.', detail: 'If your application matches the early-access criteria, we schedule a 30-minute call. Mutual fit assessment, not interrogation. Bring questions.' },
              { dot: 'bg-[#2d7d7d]', num: 'Step 03 · 4–6 weeks', title: 'Verification.', detail: 'Document review, site inspection where applicable, listing creation, photography. We do most of the work. You provide the access and accuracy checks.' },
              { dot: 'bg-[#0a0e12]', num: 'Step 04 · Q3 2026', title: 'Launch with us.', detail: 'Your listing goes live with the platform launch. Marketing begins. First bookings arrive. Cohort rates locked for twelve months.' },
            ].map((step, i) => (
              <div key={i} className="pr-4 relative">
                <div className={`w-3 h-3 rounded-full ${step.dot} mb-6 relative z-10`} />
                <p className="font-mono text-[11px] tracking-[0.15em] text-[#6b7079] uppercase mb-2">{step.num}</p>
                <p className="font-serif font-normal text-[22px] leading-snug mb-2">{step.title}</p>
                <p className="text-[14px] leading-relaxed text-[#6b7079]">{step.detail}</p>
              </div>
            ))}
          </div>
          {/* Change 4e: Section-end CTA after timeline */}
          <ReadyToApply onClick={scrollToForm} />
        </div>
      </section>

      {/* ── APPLICATION FORM ── */}
      <section ref={applyRef} id="apply" className="bg-[#0a0e12] text-[#faf8f3] px-6 md:px-12 py-24 relative">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, #c96a3f 0%, #c96a3f 33%, #d4a24c 33%, #d4a24c 66%, #2d7d7d 66%, #2d7d7d 100%)' }} />
        <div ref={formRef} className="max-w-[920px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif font-light text-[clamp(36px,5vw,60px)] leading-none tracking-[-0.02em] mb-6">
              Apply for the <em className="italic text-[#4a9595] font-normal">early-access cohort.</em>
            </h2>
            <p className="font-serif font-light text-[19px] leading-relaxed text-[#faf8f3]/70 max-w-xl mx-auto">
              Rolling decisions. We respond to every application within ten business days, including the ones we cannot progress. Your time matters; we will not waste it.
            </p>
          </div>

          {submitError && (
            <div className="bg-[#c96a3f]/20 border border-[#c96a3f] text-[#faf8f3] px-6 py-4 mb-8 text-sm" role="alert">
              {submitError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Path selection */}
            <div className="mb-8">
              <p className="font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-4">I&apos;m applying as</p>
              <div className="flex flex-col gap-3" role="radiogroup" aria-label="Application type">
                {[
                  { value: 'host', label: "A host — I have a property to list", detail: 'Beach house, guesthouse, boutique hotel, serviced apartment, resort, heritage property' },
                  { value: 'operator', label: "An operator — I deliver experiences or services", detail: 'Tours, charters, food experiences, transport, events, wellness, cultural workshops' },
                  { value: 'both', label: "Both — I run accommodation and experiences", detail: 'Resort with activities, guesthouse with tours, hotel with restaurant and excursions' },
                ].map(opt => (
                  <label key={opt.value}
                    className={`flex items-start gap-3 px-4 py-3 border cursor-pointer transition-all ${form.path === opt.value ? 'border-[#d4a24c]' : 'border-[#faf8f3]/15 hover:border-[#faf8f3]/35'}`}>
                    <input type="radio" name="path" value={opt.value}
                      checked={form.path === opt.value}
                      onChange={() => handlePathSelect(opt.value as Path)}
                      className="mt-1 accent-[#d4a24c]" required />
                    <span>
                      <span className="block text-[15px] leading-snug">{opt.label}</span>
                      <span className="block text-[13px] text-[#faf8f3]/55 mt-0.5 leading-snug">{opt.detail}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Personal details */}
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'fullName', label: 'Full name', type: 'text', placeholder: 'Your legal name', required: true },
                { name: 'businessName', label: 'Business name', type: 'text', placeholder: 'If different from your name', required: false },
              ].map(field => (
                <div key={field.name} className="mb-8">
                  <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">{field.label}</label>
                  <input type={field.type} name={field.name} placeholder={field.placeholder}
                    value={(form as any)[field.name]} onChange={handleChange} required={field.required}
                    className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors" />
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'email', label: 'Email', type: 'email', placeholder: 'The address you check', required: true },
                { name: 'phone', label: 'Phone (with country code)', type: 'tel', placeholder: '+234 / +44 / +1', required: true },
              ].map(field => (
                <div key={field.name} className="mb-8">
                  <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">{field.label}</label>
                  <input type={field.type} name={field.name} placeholder={field.placeholder}
                    value={(form as any)[field.name]} onChange={handleChange} required={field.required}
                    className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors" />
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="mb-8">
                <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Where on the corridor?</label>
                <select name="corridorLocation" value={form.corridorLocation} onChange={handleChange} required
                  className="w-full bg-[#0a0e12] border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] transition-colors appearance-none cursor-pointer">
                  <option value="">Select primary location</option>
                  {['Lagos — Lagos Island, Lekki, Epe', 'Lagos — Mainland, Ikeja, Ikoyi', 'Lagos — Coastal (Eleko, Lekki Free Zone, Lakowe)', 'Ogun State', 'Ondo State', 'Edo State', 'Delta State', 'Bayelsa State', 'Rivers State (Port Harcourt, Bonny)', 'Akwa Ibom (Uyo, Ibeno, Eket)', 'Cross River (Calabar, Tinapa, Obudu, Ikom)', 'Multiple corridor locations'].map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
              <div className="mb-8">
                <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Country of residence</label>
                <input type="text" name="countryOfResidence" placeholder="Nigeria, UK, US, etc."
                  value={form.countryOfResidence} onChange={handleChange} required
                  className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors" />
              </div>
            </div>

            {/* Host-specific fields */}
            {(form.path === 'host' || form.path === 'both') && (
              <>
                <div className="mb-8">
                  <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Property type</label>
                  <select name="propertyType" value={form.propertyType} onChange={handleChange}
                    className="w-full bg-[#0a0e12] border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] transition-colors appearance-none cursor-pointer">
                    <option value="">Select property type</option>
                    {['Private home / villa / beach house', 'Boutique guesthouse (4–12 rooms)', 'Independent hotel (12–50 rooms)', 'Resort or hotel (50+ rooms)', 'Serviced apartments', 'Heritage property / unique stay', 'Multiple properties'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="mb-8">
                    <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Number of rooms / units</label>
                    <input type="number" name="numberOfRooms" placeholder="e.g., 8" min="1"
                      value={form.numberOfRooms} onChange={handleChange}
                      className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors" />
                  </div>
                  <div className="mb-8">
                    <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Currently listed elsewhere?</label>
                    <select name="currentlyListedOn" value={form.currentlyListedOn} onChange={handleChange}
                      className="w-full bg-[#0a0e12] border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] transition-colors appearance-none cursor-pointer">
                      <option value="">Select</option>
                      {['Booking.com', 'Airbnb', 'Hotels.ng', 'Multiple platforms', 'Direct bookings only', 'Not yet operating'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Operator-specific fields */}
            {(form.path === 'operator' || form.path === 'both') && (
              <>
                <div className="mb-8">
                  <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Type of operation</label>
                  <select name="operationType" value={form.operationType} onChange={handleChange}
                    className="w-full bg-[#0a0e12] border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] transition-colors appearance-none cursor-pointer">
                    <option value="">Select operation type</option>
                    {['Tour operator (guided experiences)', 'Activity provider (charters, sports, workshops)', 'Transport operator', 'Food and beverage', 'Event specialist', 'Wellness and lifestyle', 'Cultural / heritage operator', 'Multiple categories'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="mb-8">
                    <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Years operating</label>
                    <input type="number" name="yearsOperating" placeholder="e.g., 3" min="0"
                      value={form.yearsOperating} onChange={handleChange}
                      className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors" />
                  </div>
                  <div className="mb-8">
                    <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">Approximate annual customers</label>
                    <select name="annualCustomers" value={form.annualCustomers} onChange={handleChange}
                      className="w-full bg-[#0a0e12] border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] transition-colors appearance-none cursor-pointer">
                      <option value="">Select range</option>
                      {['Under 100', '100 — 500', '500 — 2,000', '2,000 — 10,000', '10,000+', 'Not yet operating'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Open text */}
            {[
              { name: 'aboutOperation', label: 'Tell us about your property or operation', placeholder: 'What you do, where, what makes it distinctive. Three to five sentences is enough.', required: true },
              { name: 'whyCoastalCorridor', label: 'Why Coastal Corridor specifically?', placeholder: 'Optional but useful. What about the platform fits your operation?', required: false },
              { name: 'additionalInfo', label: 'Anything else we should know?', placeholder: 'Optional. Awards, partnerships, certifications, prior platform experience, references, anything that adds to the picture.', required: false },
            ].map(field => (
              <div key={field.name} className="mb-8">
                <label className="block font-mono text-[10px] tracking-[0.18em] text-[#d4a24c] uppercase mb-3">{field.label}</label>
                <textarea name={field.name} placeholder={field.placeholder}
                  value={(form as any)[field.name]} onChange={handleChange} required={field.required}
                  rows={3}
                  className="w-full bg-transparent border-b border-[#faf8f3]/25 text-[#faf8f3] text-base py-3 outline-none focus:border-[#d4a24c] placeholder:text-[#faf8f3]/35 transition-colors resize-y font-sans" />
              </div>
            ))}

            <button type="submit" disabled={submitting}
              className="bg-[#c96a3f] text-[#faf8f3] px-12 py-5 font-mono text-xs tracking-[0.2em] uppercase mt-6 hover:bg-[#a85530] transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0e12]">
              {submitting ? 'Submitting…' : 'Submit application →'}
            </button>
            <p className="font-mono text-[11px] tracking-[0.1em] text-[#faf8f3]/50 uppercase mt-6">
              Rolling decisions · Response within 10 business days · Application does not constitute commitment from either side
            </p>
          </form>
        </div>
      </section>

      {/* ── FAQ ── (Change 8: reduced from 7 to 5 questions) */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-[920px] mx-auto">
          <div className="mb-14 max-w-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-serif text-[#c96a3f] text-base">§</span>
              <span className="font-mono text-[11px] tracking-[0.18em] text-[#d4a24c] uppercase">Common questions</span>
            </div>
            <h2 className="font-serif font-light text-[clamp(32px,4.5vw,52px)] leading-tight tracking-[-0.02em]">
              The things <em className="italic text-[#c96a3f] font-normal">everyone asks first.</em>
            </h2>
          </div>
          <div className="border-t border-[#d4d4d0]">
            {FAQS.map((faq, i) => (
              <div key={i} className="border-b border-[#d4d4d0]">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  aria-expanded={openFaq === i}
                  aria-controls={`faq-answer-${i}`}
                  className="w-full flex justify-between items-center py-7 text-left font-serif font-normal text-[22px] leading-snug hover:text-[#c96a3f] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c96a3f] focus-visible:ring-inset">
                  {faq.q}
                  <span className={`font-mono text-[24px] text-[#c96a3f] font-light ml-8 flex-shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
                </button>
                <div
                  id={`faq-answer-${i}`}
                  role="region"
                  className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="pb-8 text-[16px] leading-[1.7] text-[#6b7079] max-w-2xl">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Change 3: Floating sticky "Apply" button */}
      <div
        className={`fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 transition-all duration-300 ${
          showFloating ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        aria-hidden={!showFloating}
      >
        <button
          onClick={scrollToForm}
          tabIndex={showFloating ? 0 : -1}
          aria-label="Apply for the early-access cohort"
          className="bg-[#c96a3f] text-[#faf8f3] px-6 py-3 md:px-8 md:py-4 font-mono text-[11px] md:text-xs tracking-[0.2em] uppercase shadow-lg hover:bg-[#a85530] transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#faf8f3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#c96a3f] min-h-[48px] min-w-[48px]"
        >
          Apply →
        </button>
      </div>

    </div>
  )
}
