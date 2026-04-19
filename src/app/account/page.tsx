'use client';

import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import { LogOut, Settings, Heart, FileText, Home } from 'lucide-react';

export default function AccountPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const [savedCount, setSavedCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);

  useEffect(() => {
    if (isLoaded && !userId) {
      redirect('/');
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !user) {
    return (
      <div className="container-x py-24">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-ink/10 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-ink/10 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

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
                <h2 className="font-serif text-[28px] font-light mb-2">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-ink/60">{user.primaryEmailAddress?.emailAddress}</p>
                {user.phoneNumbers && user.phoneNumbers.length > 0 && (
                  <p className="text-ink/60">{user.phoneNumbers[0].phoneNumber}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Link
                  href="/account/settings"
                  className="btn-secondary !py-2 !px-4 flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-ink/10">
              <div>
                <div className="font-serif text-[24px] font-medium">{savedCount}</div>
                <div className="eyebrow mt-1">Saved Properties</div>
              </div>
              <div>
                <div className="font-serif text-[24px] font-medium">{inquiryCount}</div>
                <div className="eyebrow mt-1">Active Inquiries</div>
              </div>
              <div>
                <div className="font-serif text-[24px] font-medium">Member</div>
                <div className="eyebrow mt-1">Account Status</div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Link
              href="/properties"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2 flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Browse Properties
                  </h3>
                  <p className="text-ink/60 text-sm">Explore verified listings across the corridor</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/account/saved"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2 flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Saved Properties
                  </h3>
                  <p className="text-ink/60 text-sm">View your saved listings and notes</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/account/inquiries"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    My Inquiries
                  </h3>
                  <p className="text-ink/60 text-sm">Track your property inquiries and messages</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>

            <Link
              href="/account/settings"
              className="bg-white border border-ink/10 rounded-lg p-6 hover:shadow-card-hover transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-serif text-[20px] font-light mb-2 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Account Settings
                  </h3>
                  <p className="text-ink/60 text-sm">Update profile, email, and preferences</p>
                </div>
                <div className="text-ink/20 group-hover:text-ink/40 transition-colors">→</div>
              </div>
            </Link>
          </div>

          {/* Clerk User Button */}
          <div className="flex justify-end">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </div>
  );
}
