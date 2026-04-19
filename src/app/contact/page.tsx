import Link from 'next/link';
import { ArrowRight, Mail, Phone, MapPin, MessageSquare, Clock, Building } from 'lucide-react';

export const metadata = {
  title: 'Contact · Coastal Corridor',
  description: 'Get in touch with the Coastal Corridor team'
};

export default function ContactPage() {
  return (
    <>
      <section className="container-x py-16 md:py-20">
        <div className="eyebrow mb-4">Contact us</div>
        <h1 className="font-serif text-[44px] md:text-[60px] leading-[1.02] tracking-tightest font-light max-w-3xl mb-6">
          Different questions need
          <span className="italic text-laterite"> different people.</span>
        </h1>
        <p className="text-[17px] text-ink/70 leading-relaxed max-w-2xl font-light">
          Every message you send us gets to a real human within one business day. Route your enquiry to the right team
          using the options below to get the fastest, best answer.
        </p>
      </section>

      {/* ROUTING CARDS */}
      <section className="container-x pb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              category: 'Buyers & browsers',
              title: 'I want to buy a property',
              desc: 'Questions about listings, viewings, verification, or the purchase process.',
              email: 'hello@coastalcorridor.co',
              response: 'Within 4 business hours',
              cta: 'Email buyer support',
              color: 'laterite'
            },
            {
              category: 'Diaspora',
              title: 'I\'m abroad and need help',
              desc: 'Video site visits, concierge coordination, cross-border payments, or legal counsel introductions.',
              email: 'diaspora@coastalcorridor.co',
              response: 'Within 8 business hours',
              cta: 'Email diaspora desk',
              color: 'ocean'
            },
            {
              category: 'Agents & developers',
              title: 'I want to list with you',
              desc: 'ESVARBON-licensed agents applying to join, or developers seeking partnership.',
              email: 'partners@coastalcorridor.co',
              response: 'Within 2 business days',
              cta: 'Email partnerships',
              color: 'ochre'
            },
            {
              category: 'Investors',
              title: 'I want to invest in the company',
              desc: 'Fundraising round, follow-on opportunities, strategic capital, or data room access.',
              email: 'investors@coastalcorridor.co',
              response: 'Within 1 business day',
              cta: 'Email founder directly',
              color: 'laterite'
            },
            {
              category: 'Press',
              title: 'I\'m working on a story',
              desc: 'Media enquiries, interview requests, press kit access, or research collaboration.',
              email: 'press@coastalcorridor.co',
              response: 'Within 1 business day',
              cta: 'Email press team',
              color: 'ocean'
            },
            {
              category: 'Legal & compliance',
              title: 'I need to raise a formal matter',
              desc: 'Legal notices, compliance enquiries, data subject requests, or dispute resolution.',
              email: 'legal@coastalcorridor.co',
              response: 'Within 3 business days',
              cta: 'Email legal team',
              color: 'ink'
            }
          ].map((item, i) => (
            <div key={i} className="p-6 bg-white border border-ink/10 rounded-lg hover:shadow-card transition-all">
              <div className={`eyebrow mb-3 ${item.color === 'laterite' ? 'text-laterite' : item.color === 'ocean' ? 'text-ocean' : item.color === 'ochre' ? 'text-ochre' : 'text-ink'}`}>
                {item.category}
              </div>
              <h3 className="font-serif text-[22px] font-medium tracking-display leading-tight mb-3">
                {item.title}
              </h3>
              <p className="text-[13px] text-ink/70 leading-relaxed mb-5">{item.desc}</p>

              <div className="pt-5 border-t border-ink/10">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-ink/50 mb-3">
                  <Clock className="h-3 w-3" />
                  {item.response}
                </div>
                <a href={`mailto:${item.email}`} className="block font-mono text-[13px] text-ink mb-3 hover:text-laterite transition-colors truncate">
                  {item.email}
                </a>
                <a href={`mailto:${item.email}`} className="btn-secondary !py-2 !px-3 !text-[11px] w-full justify-center">
                  <Mail className="h-3 w-3" />
                  {item.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* GENERAL FORM */}
      <section className="bg-paper-2 py-20">
        <div className="container-x max-w-3xl">
          <div className="eyebrow mb-4">§ General enquiry form</div>
          <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-4">
            Not sure who to contact?
          </h2>
          <p className="text-[15px] text-ink/70 leading-relaxed mb-10">
            Fill the form below and we will route your message to the right team. You will hear from the relevant
            person within one business day.
          </p>

          <form className="grid md:grid-cols-2 gap-3">
            <input type="text" placeholder="Your name" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <input type="email" placeholder="Email address" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <input type="tel" placeholder="Phone (optional)" className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40" />
            <select className="bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40">
              <option>What is this about?</option>
              <option>I want to buy a property</option>
              <option>I am abroad and need help</option>
              <option>I want to list / partner</option>
              <option>I want to invest in the company</option>
              <option>I am a journalist</option>
              <option>Legal / compliance matter</option>
              <option>Something else</option>
            </select>
            <textarea rows={5} placeholder="Your message" className="md:col-span-2 bg-white border border-ink/15 rounded-sm px-4 py-3 text-[14px] outline-none focus:border-ink/40 resize-none" />
            <button type="button" className="btn-primary md:col-span-2 !py-3">
              Send message
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      {/* OFFICES */}
      <section className="container-x py-20">
        <div className="eyebrow mb-4">§ Offices</div>
        <h2 className="font-serif text-[32px] md:text-[40px] leading-tight tracking-display font-light mb-10">
          Where we work from
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 bg-white border border-ink/10 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-laterite" />
              <span className="eyebrow">Lagos — operating headquarters</span>
            </div>
            <h3 className="font-serif text-[24px] font-medium tracking-display mb-4">Coastal Corridor Nigeria</h3>
            <div className="space-y-3 text-[14px] text-ink/70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>
                  Victoria Island Business District<br />
                  Lagos, Nigeria
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>+234 xxx xxx xxxx</div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>Monday–Friday, 9am–6pm WAT</div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-white border border-ink/10 rounded-lg">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-ocean" />
              <span className="eyebrow">London — holding company & UK operations</span>
            </div>
            <h3 className="font-serif text-[24px] font-medium tracking-display mb-4">Coastal Corridor Ltd</h3>
            <div className="space-y-3 text-[14px] text-ink/70">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>
                  Central London<br />
                  United Kingdom
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>+44 xxx xxx xxxx</div>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-ink/40 flex-shrink-0 mt-0.5" />
                <div>Monday–Friday, 9am–6pm GMT/BST</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
