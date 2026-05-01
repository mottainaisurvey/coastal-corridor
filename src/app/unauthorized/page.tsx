'use client';
import { Suspense } from 'react';

import { useSearchParams } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldOff } from 'lucide-react';

function UnauthorizedContent() {
  const params = useSearchParams();
  const required = params.get('required');
  const { user } = useUser();
  const { signOut } = useClerk();

  const roleLabel = required === 'admin' ? 'Administrator' : required === 'agent' ? 'Agent' : 'the required';

  return (
    <div className="bg-paper min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6 py-24">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-alert/10 mb-8">
          <ShieldOff className="h-8 w-8 text-alert" />
        </div>

        <div className="eyebrow mb-4 text-alert">Access Denied</div>
        <h1 className="font-serif text-[36px] font-light leading-tight mb-4">
          {roleLabel} access required
        </h1>
        <p className="text-ink/60 text-[16px] mb-8">
          {user ? (
            <>
              You are signed in as <strong>{user.primaryEmailAddress?.emailAddress}</strong>, but your
              account does not have {roleLabel.toLowerCase()} privileges. Please contact the platform
              administrator to request access.
            </>
          ) : (
            'You must be signed in with an authorised account to access this area.'
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-secondary">
            Return to Homepage
          </Link>
          {user && (
            <button
              className="btn-primary"
              onClick={() => signOut(() => { window.location.href = '/'; })}
            >
              Sign Out &amp; Switch Account
            </button>
          )}
        </div>

        {/* Role badge */}
        {user && (
          <div className="mt-10 pt-8 border-t border-ink/10">
            <div className="eyebrow mb-2">Your current role</div>
            <div className="inline-block px-3 py-1 bg-ink/5 rounded-sm font-mono text-[12px] text-ink/60">
              {(user.publicMetadata?.role as string) || 'BUYER (default)'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={
      <div className="bg-paper min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-6 py-24">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-alert/10 mb-8">
            <ShieldOff className="h-8 w-8 text-alert" />
          </div>
          <div className="eyebrow mb-4 text-alert">Access Denied</div>
        </div>
      </div>
    }>
      <UnauthorizedContent />
    </Suspense>
  );
}
