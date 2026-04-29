import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Shield, MapPin, Bed, Bath, Ruler, Calendar, TrendingUp, Droplet,
  AlertTriangle, Navigation, Check, ArrowRight, Camera, FileText, Phone
} from 'lucide-react';
import { getPropertyBySlug, properties } from '@/lib/mock/properties';
import { getDestinationById } from '@/lib/mock/destinations';
import { getAgentByName } from '@/lib/mock/agents';
import { PropertyCard } from '@/components/property-card';
import { InquiryForm } from '@/components/inquiry-form';
import { GalleryViewer } from '@/components/gallery-viewer';
import { MatterportTour } from '@/components/matterport-tour';
import {
  formatKobo, formatArea, propertyTypeLabels, titleStatusLabels
} from '@/lib/utils';

export function generateStaticParams() {
  return properties.map((p) => ({ slug: p.slug }));
}

export default function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = getPropertyBySlug(params.slug);
  if (!property) notFound();

  const destination = getDestinationById(property.destinationId);
  const agent = property.agentName ? getAgentByName(property.agentName) : null;
  const titleInfo = titleStatusLabels[property.titleStatus];

  const similar = properties
    .filter((p) => p.id !== property.id && p.destinationId === property.destinationId)
    .slice(0, 3);

  const riskColor = (score?: number) => {
    if (!score) return 'bg-ink/10';
    if (score < 25) return 'bg-success';
    if (score < 50) return 'bg-ochre';
    return 'bg-alert';
  };

  return (
    <>
      {/* ===== BREADCRUMB ===== */}
      <div className="container-x pt-6 pb-4">
        <div className="flex items-center gap-2 text-[12px] text-ink/60 font-mono uppercase tracking-wider">
          <Link href="/properties" className="hover:text-ink">Properties</Link>
          <span>/</span>
          <Link href={`/destinations/${destination?.slug}`} className="hover:text-ink">
            {destination?.name}
          </Link>
          <span>/</span>
          <span className="text-ink/80">{property.plotId}</span>
        </div>
      </div>

      {/* ===== GALLERY ===== */}
      <GalleryViewer images={property.images} title={property.title} />

      {/* ===== MAIN CONTENT ===== */}
      <div className="container-x py-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* ===== LEFT: Details ===== */}
          <div className="lg:col-span-2 space-y-10">
            {/* Title section */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="chip bg-ink/10 text-ink">
                  {propertyTypeLabels[property.type]}
                </span>
                {property.titleStatus === 'VERIFIED' && (
                  <span className="chip bg-success/15 text-success">
                    <Shield className="h-3 w-3" />
                    Title verified
                  </span>
                )}
                {property.featured && <span className="chip bg-laterite text-paper">Featured</span>}
              </div>

              <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.1] tracking-tightest mb-3 font-light">
                {property.title}
              </h1>

              <div className="flex items-center gap-1.5 text-ink/70 text-[14px] mb-6">
                <MapPin className="h-4 w-4" />
                <span>
                  {property.destinationName}, {property.state} State · Plot {property.plotId}
                </span>
              </div>

              {/* Quick specs */}
              <div className="flex flex-wrap gap-6 py-5 border-y border-ink/10">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <Bed className="h-4 w-4 text-ink/50" />
                    <div>
                      <div className="font-serif text-[18px] font-medium">{property.bedrooms}</div>
                      <div className="stat-label">Bedrooms</div>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="h-4 w-4 text-ink/50" />
                    <div>
                      <div className="font-serif text-[18px] font-medium">{property.bathrooms}</div>
                      <div className="stat-label">Bathrooms</div>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-ink/50" />
                  <div>
                    <div className="font-serif text-[18px] font-medium">{formatArea(property.areaSqm)}</div>
                    <div className="stat-label">Plot area</div>
                  </div>
                </div>
                {property.floorArea && (
                  <div className="flex items-center gap-2">
                    <Ruler className="h-4 w-4 text-ink/50" />
                    <div>
                      <div className="font-serif text-[18px] font-medium">{formatArea(property.floorArea)}</div>
                      <div className="stat-label">Built area</div>
                    </div>
                  </div>
                )}
                {property.yearBuilt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-ink/50" />
                    <div>
                      <div className="font-serif text-[18px] font-medium">{property.yearBuilt}</div>
                      <div className="stat-label">Year built</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            <section>
              <h2 className="eyebrow mb-3">§ About this property</h2>
              <p className="text-[16px] leading-relaxed text-ink/80">{property.description}</p>
            </section>

            {/* Amenities */}
            {property.amenities.length > 0 && (
              <section>
                <h2 className="eyebrow mb-4">§ Amenities & features</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity}
                      className="flex items-center gap-2 py-2 px-3 bg-paper-2 rounded-sm text-[13px]"
                    >
                      <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Title & verification */}
            <section>
              <h2 className="eyebrow mb-4">§ Title & verification</h2>
              <div className="bg-white border border-ink/10 rounded-lg p-6">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <div className="stat-label mb-1">Title status</div>
                    <div className={`font-medium text-[15px] flex items-center gap-2 ${titleInfo?.color}`}>
                      {property.titleStatus === 'VERIFIED' ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {titleInfo?.label}
                    </div>
                  </div>
                  <div>
                    <div className="stat-label mb-1">Title type</div>
                    <div className="font-medium text-[15px]">
                      {property.titleType ? property.titleType.replace(/_/g, ' ') : 'Not specified'}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-ink/10">
                  <div className="stat-label mb-3">Verification stack</div>
                  <div className="space-y-2">
                    {[
                      { label: 'State land registry search', done: true },
                      { label: 'Physical site visit & GPS verification', done: true },
                      { label: 'Community consultation on file', done: property.titleStatus === 'VERIFIED' },
                      { label: 'Satellite change detection active', done: true },
                      { label: 'Governor consent recorded', done: property.titleType === 'GOVERNOR_CONSENT' || property.titleType === 'CERTIFICATE_OF_OCCUPANCY' }
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 text-[13px]">
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${item.done ? 'bg-success' : 'bg-ink/15'}`}>
                          {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                        </div>
                        <span className={item.done ? 'text-ink' : 'text-ink/50'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/how-verification-works" className="inline-flex items-center gap-2 mt-5 text-[13px] text-laterite hover:underline">
                  How verification works
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </section>

            {/* Risk scores */}
            <section>
              <h2 className="eyebrow mb-4">§ Risk assessment</h2>
              <p className="text-[13px] text-ink/60 mb-4">
                We publish these scores openly because opaque risk is worse than visible risk. Lower is better.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { label: 'Flood risk', icon: Droplet, score: property.floodRiskScore, desc: '10-year model · NiMet + Sentinel-2' },
                  { label: 'Title dispute risk', icon: AlertTriangle, score: property.disputeRiskScore, desc: 'Based on community & registry history' }
                ].map((r) => (
                  <div key={r.label} className="bg-white border border-ink/10 rounded-lg p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <r.icon className="h-4 w-4 text-ink/50" />
                        <span className="text-[13px] font-medium">{r.label}</span>
                      </div>
                      <span className="font-serif text-[20px] font-medium">{r.score ?? '—'}</span>
                    </div>
                    <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full ${riskColor(r.score)} transition-all`}
                        style={{ width: `${r.score ?? 0}%` }}
                      />
                    </div>
                    <div className="stat-label">{r.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Location */}
            <section>
              <h2 className="eyebrow mb-4">§ Location</h2>
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden">
                <div className="aspect-[16/9] bg-ink-3 relative">
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${property.longitude - 0.02},${property.latitude - 0.015},${property.longitude + 0.02},${property.latitude + 0.015}&layer=mapnik&marker=${property.latitude},${property.longitude}`}
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-[11px] text-ink/60 mb-1">COORDINATES</div>
                    <div className="font-mono text-[13px]">
                      {property.latitude.toFixed(4)}°N, {property.longitude.toFixed(4)}°E
                    </div>
                  </div>
                  <Link href="/map" className="btn-secondary !py-2 !px-3 !text-[11px]">
                    <Navigation className="h-3.5 w-3.5" />
                    Open in 3D map
                  </Link>
                </div>
              </div>
            </section>

            {/* Virtual tour */}
            {property.virtualTourUrl && (
              <MatterportTour virtualTourUrl={property.virtualTourUrl} />
            )}
          </div>

          {/* ===== RIGHT: Sidebar ===== */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Price card */}
              <div className="bg-white border border-ink/10 rounded-lg p-6 shadow-card">
                <div className="stat-label mb-1">Asking price</div>
                <div className="font-serif text-[34px] font-medium tracking-tightest leading-none">
                  {formatKobo(property.priceKobo)}
                </div>
                <div className="text-[12px] text-ink/60 mt-1 font-mono">
                  {formatKobo(property.pricePerSqmKobo)} / m²
                </div>

                {property.yoy && (
                  <div className="mt-4 flex items-center gap-2 text-[13px] text-ocean">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">+{property.yoy}%</span>
                    <span className="text-ink/60">year-over-year</span>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-ink/10 space-y-3">
                  <button className="btn-primary w-full">
                    <Phone className="h-4 w-4" />
                    Request viewing
                  </button>
                  <button className="btn-secondary w-full">
                    <FileText className="h-4 w-4" />
                    Request documents
                  </button>
                </div>
              </div>

              {/* Agent card */}
              {agent && (
                <div className="bg-white border border-ink/10 rounded-lg p-5">
                  <div className="stat-label mb-3">Listed by</div>
                  <Link href={`/agents/${agent.slug}`} className="flex items-center gap-3 group">
                    <div className="h-12 w-12 rounded-full bg-ink-3 overflow-hidden flex-shrink-0 relative">
                      <Image src={agent.avatar} alt={agent.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[15px] group-hover:text-laterite transition-colors">
                        {agent.name}
                      </div>
                      <div className="text-[11px] text-ink/60 truncate">{agent.agencyName}</div>
                    </div>
                  </Link>
                  <div className="mt-4 pt-4 border-t border-ink/10 flex items-center justify-between text-[11px] text-ink/60">
                    <div>
                      <div className="font-mono font-medium text-ink">{agent.licenseNumber}</div>
                      <div className="mt-0.5">ESVARBON licensed</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-medium text-ink">★ {agent.rating}</div>
                      <div className="mt-0.5">{agent.reviewCount} reviews</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Inquiry form */}
              <InquiryForm propertyId={property.id} propertyTitle={property.title} />
            </div>
          </aside>
        </div>

        {/* ===== SIMILAR ===== */}
        {similar.length > 0 && (
          <section className="mt-24">
            <h2 className="eyebrow mb-4">§ More in {property.destinationName}</h2>
            <h3 className="font-serif text-[28px] md:text-[32px] leading-tight tracking-display font-light mb-8">
              Similar properties nearby
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similar.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
