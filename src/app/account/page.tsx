'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Settings, Heart, FileText, Home, CreditCard, ArrowRight } from 'lucide-react';

interface BuyerSummary {
  savedCount: number;
  inquiryCount: number;
  transactionCount: number;
  kycStatus: string | null;
}

export default function AccountPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [summary, setSummary] = useState<BuyerSummary | null>(null);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/buyer/summary')
      .then((r) => r.json())
      .then((d) => setSummary(d.data))
      .catch(console.error);
  }, [userId]);

  if (!isLoaded || !user) {
    return (
      <div className="container-x py-24">
        <div className="max-w-2xl mx-auto animate-pulse space-y-4">
          <div className="h-4 bg-ink/10 rounded w-24" />
          <div className="h-10 bg-ink/10 rounded w-1/3" />
          <div className="h-40 bg-ink/10 rounded" />
        </div>
      </div>
    );
  }

  const kycBadge = summary?.kycStatus === 'VERIFIED'
    ? { label: 'KYC Verified', cls: 'bg-success/10 text-success border-success/20' }
    : summary?.kycStatus === 'PENDING'
    ? { label: 'KYC Pending', cls: 'bg-ochre/10 text-ochre border-ochre/20' }
    : { label: 'KYC Required', cls: 'bg-laterite/10 text-laterite border-laterite/20' };

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-24">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-12">
            <div className="eyebrow mb-4">Account</div>
            <h1 className="font-serif text-[40px] md:text-[52px] leading-[1.05] tracking-tightest mb-6 font-light">
              Your Profile
            </h1>
            <p className="text-[18px] text-ink/75 max-w-2xl">
              Manage your account, saved properties, and inquiries.
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-ink/10 rounded-lg p-8 mb-8 shadow-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-serif text-[28px] font-light mb-1">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-ink/60 text-[15px]">{user.primaryEmailAddress?.emailAddress}</p>
                {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                  <p className="text-ink/60 text-[15px]">{user.phoneNumbers[0].phoneNumber}</p>
                )}
                <div className="mt-3">
                  <span className={`inline-block px-2.5 py-1 rounded-sm text-[10px] font-mono uppercase tracking-wider border ${kycBadge.cls}`}>
                    {kycBadge.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserButton afterSignOutUrl="/" />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-ink/10">
              <div>
                <div className="font-serif text-[28px] font-medium">{summary?.savedCount ?? '—'}</div>
                <div className="eyebrow mt-1">Saved Properties</div>
              </div>
              <div>
                <div className="font-serif text-[28px] font-medium">{summary?.inquiryCount ?? '—'}</div>
                <div className="eyebrow mt-1">Inquiries</div>
              </div>
              <div>
                <div className="font-serif text-[28px] font-medium">{summary?.transactionCount ?? '—'}</div>
                <div className="eyebrow mt-1">Transactions</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                href: '/properties',
                icon: Home,
                title: 'Browse Properties',
                desc: 'Explore verified listings across the corridor',
              },
              {
                href: '/account/saved',
                icon: Heart,
                title: 'Saved Properties',
                desc: `${summary?.savedCount ?? 0} saved listings`,
              },
              {
                href: '/account/inquiries',
                icon: FileText,
                title: 'My Inquiries',
                desc: `${summary?.inquiryCount ?? 0} active inquiries`,
              },
              {
                href: '/account/transactions',
                icon: CreditCard,
                title: 'Transactions',
                desc: `${summary?.transactionCount ?? 0} transactions`,
              },
              {
                href: '/account/settings',
                icon: Settings,
                title: 'Account Settings',
                desc: 'Update profile, email, and preferences',
              },
            ].map(({ href, icon: Icon, title, desc }) => (
              <Link
                key={href}
                href={href}
                className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-[20px] font-light mb-1.5 flex items-center gap-2">
                      <Icon className="h-5 w-5 text-ink/40" />
                      {title}
                    </h3>
                    <p className="text-ink/60 text-sm">{desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-ink/20 group-hover:text-ink/50 transition-colors mt-1" />
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
