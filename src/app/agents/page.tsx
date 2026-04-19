import Image from 'next/image';
import Link from 'next/link';
import { Shield, Star, MapPin, Building2 } from 'lucide-react';
import { agents } from '@/lib/mock/agents';

export const metadata = {
  title: 'Verified Agents · Coastal Corridor',
  description: 'ESVARBON-licensed real estate agents serving the Lagos-Calabar corridor'
};

export default function AgentsPage() {
  return (
    <div className="container-x py-14">
      <div className="eyebrow mb-4">Licensed agents · ESVARBON verified</div>
      <h1 className="font-serif text-[44px] md:text-[60px] leading-[1.02] tracking-tightest font-light max-w-4xl mb-6">
        Every agent, license-verified.
        <span className="italic text-laterite"> Every listing, quality-checked.</span>
      </h1>
      <p className="text-[17px] text-ink/70 leading-relaxed max-w-2xl font-light mb-12">
        We only admit agents registered with the Estate Surveyors and Valuers Registration Board of Nigeria (ESVARBON). Each license is verified at source and renewed annually.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent) => (
          <Link
            key={agent.id}
            href={`/agents/${agent.slug}`}
            className="group block bg-white border border-ink/10 rounded-lg p-6 shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="relative h-16 w-16 rounded-full bg-ink-3 overflow-hidden flex-shrink-0">
                <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-[19px] font-medium tracking-display group-hover:text-laterite transition-colors">
                  {agent.name}
                </h3>
                <div className="flex items-center gap-1.5 text-[12px] text-ink/60 mt-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{agent.agencyName}</span>
                </div>
                {agent.licenseVerified && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-success">
                    <Shield className="h-3 w-3" />
                    ESVARBON verified
                  </div>
                )}
              </div>
            </div>

            <p className="text-[13px] text-ink/70 leading-relaxed line-clamp-2 mb-4">{agent.bio}</p>

            <div className="pt-4 border-t border-ink/10 grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-serif text-[17px] font-medium">
                  <Star className="inline h-3.5 w-3.5 text-ochre mb-0.5" /> {agent.rating}
                </div>
                <div className="stat-label">{agent.reviewCount} reviews</div>
              </div>
              <div>
                <div className="font-serif text-[17px] font-medium">{agent.listingCount}</div>
                <div className="stat-label">Listings</div>
              </div>
              <div>
                <div className="font-serif text-[17px] font-medium">{agent.yearsActive}y</div>
                <div className="stat-label">Experience</div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-1 flex-wrap">
              {agent.regionsCovered.map((r) => (
                <span key={r} className="chip bg-paper-2 text-ink/70">
                  <MapPin className="h-2.5 w-2.5" />
                  {r}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
