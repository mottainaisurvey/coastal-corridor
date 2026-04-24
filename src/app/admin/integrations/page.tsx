'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Plug, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';

const SUPERADMIN_ROLES = ['superadmin', 'SUPERADMIN'];

const INTEGRATIONS = [
  {
    category: 'Authentication',
    items: [
      { id: 'clerk', name: 'Clerk', description: 'User authentication, sessions, and role management', status: 'active', docs: 'https://clerk.com/docs', env: 'CLERK_SECRET_KEY' },
    ],
  },
  {
    category: 'Database',
    items: [
      { id: 'supabase', name: 'Supabase (PostgreSQL)', description: 'Primary database via Prisma ORM with connection pooler', status: 'active', docs: 'https://supabase.com/docs', env: 'DATABASE_URL' },
    ],
  },
  {
    category: 'Payments',
    items: [
      { id: 'stripe', name: 'Stripe', description: 'Card payments, escrow, and transaction management', status: 'pending', docs: 'https://stripe.com/docs', env: 'STRIPE_SECRET_KEY' },
      { id: 'paystack', name: 'Paystack', description: 'Nigerian card and bank transfer payments', status: 'pending', docs: 'https://paystack.com/docs', env: 'PAYSTACK_SECRET_KEY' },
    ],
  },
  {
    category: 'Identity Verification',
    items: [
      { id: 'smile', name: 'Smile Identity', description: 'KYC verification for Nigerian and diaspora users', status: 'pending', docs: 'https://usesmileid.com/docs', env: 'SMILE_IDENTITY_API_KEY' },
    ],
  },
  {
    category: 'Email',
    items: [
      { id: 'postmark', name: 'Postmark', description: 'Transactional email delivery from mail.coastalcorridor.africa', status: 'pending', docs: 'https://postmarkapp.com/developer', env: 'POSTMARK_API_TOKEN' },
    ],
  },
  {
    category: 'Storage & Media',
    items: [
      { id: 'supabase-storage', name: 'Supabase Storage', description: 'Private document bucket for KYC files, title documents, and contracts', status: 'active', docs: 'https://supabase.com/docs/guides/storage', env: 'SUPABASE_SERVICE_ROLE_KEY' },
    ],
  },
  {
    category: 'State Registries',
    items: [
      { id: 'lasrera', name: 'LASRERA', description: 'Lagos State Real Estate Regulatory Authority — agent licence and transaction verification', status: 'pending', docs: 'https://lasrera.lagosstate.gov.ng', env: 'LASRERA_API_KEY' },
      { id: 'ogunirs', name: 'OGUNIRS', description: 'Ogun State Internal Revenue Service — land use charge and title registry', status: 'pending', docs: 'https://ogunirs.gov.ng', env: 'OGUNIRS_API_KEY' },
      { id: 'nis', name: 'NIS (National Identity)', description: 'National Identity Management Commission — NIN cross-check for KYC', status: 'pending', docs: 'https://nimc.gov.ng', env: 'NIS_API_KEY' },
      { id: 'cac', name: 'CAC', description: 'Corporate Affairs Commission — developer company registration verification', status: 'pending', docs: 'https://cac.gov.ng', env: 'CAC_API_KEY' },
    ],
  },
  {
    category: 'Mapping',
    items: [
      { id: 'mapbox', name: 'Mapbox', description: '2D/3D interactive corridor map viewer', status: 'active', docs: 'https://docs.mapbox.com', env: 'NEXT_PUBLIC_MAPBOX_TOKEN' },
    ],
  },
  {
    category: 'Deployment',
    items: [
      { id: 'vercel', name: 'Vercel', description: 'Hosting, edge functions, and auto-deploy from GitHub', status: 'active', docs: 'https://vercel.com/docs', env: 'VERCEL_TOKEN' },
      { id: 'github', name: 'GitHub', description: 'Source control — mottainaisurvey/coastal-corridor', status: 'active', docs: 'https://github.com/mottainaisurvey/coastal-corridor', env: 'GH_TOKEN' },
    ],
  },
];

const STATUS_CONFIG: Record<string, { label: string; icon: any; colour: string }> = {
  active: { label: 'Active', icon: CheckCircle, colour: 'text-sage' },
  pending: { label: 'Pending Setup', icon: Clock, colour: 'text-ochre' },
  error: { label: 'Error', icon: XCircle, colour: 'text-laterite' },
};

export default function AdminIntegrationsPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const role = (user?.publicMetadata?.role as string) || '';
  const isSuperadmin = SUPERADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isSuperadmin) router.replace('/unauthorized?required=superadmin');
  }, [isLoaded, user, isSuperadmin, router]);

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isSuperadmin) return null;

  const allItems = INTEGRATIONS.flatMap(g => g.items);
  const activeCount = allItems.filter(i => i.status === 'active').length;
  const pendingCount = allItems.filter(i => i.status === 'pending').length;

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-4xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ochre/10 border border-ochre/20 rounded-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-ochre" />
            <span className="text-xs font-mono uppercase tracking-wider text-ochre">Superadmin Only</span>
          </div>

          <div className="mb-8">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Integrations</h1>
            <p className="text-ink/60 text-[16px]">Status and configuration of all third-party services connected to the platform</p>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white border border-ink/10 rounded-lg p-5 text-center shadow-card">
              <div className="font-serif text-[28px] font-medium text-sage">{activeCount}</div>
              <div className="text-xs text-ink/40 mt-1">Active</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 text-center shadow-card">
              <div className="font-serif text-[28px] font-medium text-ochre">{pendingCount}</div>
              <div className="text-xs text-ink/40 mt-1">Pending Setup</div>
            </div>
            <div className="bg-white border border-ink/10 rounded-lg p-5 text-center shadow-card">
              <div className="font-serif text-[28px] font-medium text-ink">{allItems.length}</div>
              <div className="text-xs text-ink/40 mt-1">Total</div>
            </div>
          </div>

          {/* Integration groups */}
          <div className="space-y-6">
            {INTEGRATIONS.map(({ category, items }) => (
              <div key={category} className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-ink/10">
                  <div className="eyebrow">{category}</div>
                </div>
                <div className="divide-y divide-ink/5">
                  {items.map(item => {
                    const sc = STATUS_CONFIG[item.status];
                    const StatusIcon = sc.icon;
                    return (
                      <div key={item.id} className="px-6 py-5 flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-paper border border-ink/10 flex items-center justify-center shrink-0">
                            <Plug className="h-5 w-5 text-ink/30" />
                          </div>
                          <div>
                            <div className="font-medium text-ink text-sm">{item.name}</div>
                            <div className="text-xs text-ink/50 mt-0.5">{item.description}</div>
                            <div className="font-mono text-[11px] text-ink/30 mt-1">{item.env}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`flex items-center gap-1.5 text-xs font-mono uppercase ${sc.colour}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {sc.label}
                          </div>
                          <a href={item.docs} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-sm border border-ink/15 hover:bg-paper transition-colors">
                            <ExternalLink className="h-3.5 w-3.5 text-ink/40" />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pending setup instructions */}
          <div className="mt-8 p-6 bg-ochre/5 border border-ochre/15 rounded-lg">
            <div className="eyebrow text-ochre mb-3">Pending Setup Actions</div>
            <div className="space-y-2 text-sm text-ink/70">
              <div>1. <strong>Stripe / Paystack</strong> — Add <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">STRIPE_SECRET_KEY</code> and <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">PAYSTACK_SECRET_KEY</code> to Vercel environment variables</div>
              <div>2. <strong>Smile Identity</strong> — Sign up at usesmileid.com, add <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">SMILE_IDENTITY_API_KEY</code> to Vercel</div>
              <div>3. <strong>Postmark</strong> — Verify <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">mail.coastalcorridor.africa</code> sender domain, add <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">POSTMARK_API_TOKEN</code></div>
              <div>4. <strong>AWS S3 / R2</strong> — Create bucket, add <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">AWS_S3_BUCKET</code>, <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">AWS_ACCESS_KEY_ID</code>, <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded">AWS_SECRET_ACCESS_KEY</code></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
