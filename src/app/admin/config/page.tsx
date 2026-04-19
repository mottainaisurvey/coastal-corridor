'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Settings, Save, RefreshCw, AlertTriangle } from 'lucide-react';

const SUPERADMIN_ROLES = ['superadmin', 'SUPERADMIN'];

const CONFIG_GROUPS = [
  {
    group: 'Platform Fees',
    key: 'fees',
    fields: [
      { key: 'listing_fee_pct', label: 'Listing Fee (%)', type: 'number', description: 'Percentage charged to agents per listing' },
      { key: 'transaction_fee_pct', label: 'Transaction Fee (%)', type: 'number', description: 'Platform fee on completed transactions' },
      { key: 'fractional_mgmt_fee_pct', label: 'Fractional Management Fee (%)', type: 'number', description: 'Annual management fee for fractional ownership SPVs' },
    ],
  },
  {
    group: 'Verification Settings',
    key: 'verification',
    fields: [
      { key: 'kyc_required', label: 'KYC Required for Transactions', type: 'boolean', description: 'Require KYC verification before any purchase' },
      { key: 'agent_license_required', label: 'Agent Licence Required', type: 'boolean', description: 'Require ESVARBON licence for agent listings' },
      { key: 'plot_verification_required', label: 'Plot Verification Required', type: 'boolean', description: 'Require field verification before listing plots' },
    ],
  },
  {
    group: 'Notifications',
    key: 'notifications',
    fields: [
      { key: 'admin_email', label: 'Admin Notification Email', type: 'text', description: 'Email for platform alerts and notifications' },
      { key: 'new_inquiry_notify', label: 'Notify on New Inquiry', type: 'boolean', description: 'Send email when new inquiry is submitted' },
      { key: 'new_transaction_notify', label: 'Notify on New Transaction', type: 'boolean', description: 'Send email when transaction is initiated' },
    ],
  },
  {
    group: 'Feature Flags',
    key: 'features',
    fields: [
      { key: 'fractional_enabled', label: 'Fractional Ownership', type: 'boolean', description: 'Enable fractional ownership listings' },
      { key: 'diaspora_enabled', label: 'Diaspora Services', type: 'boolean', description: 'Enable diaspora-specific features and pricing' },
      { key: 'tourism_enabled', label: 'Tourism Vertical', type: 'boolean', description: 'Enable tourism listings and destination pages' },
      { key: 'map_3d_enabled', label: '3D Map Viewer', type: 'boolean', description: 'Enable the 3D corridor map viewer' },
    ],
  },
];

export default function AdminConfigPage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const role = (user?.publicMetadata?.role as string) || '';
  const isSuperadmin = SUPERADMIN_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isSuperadmin) router.replace('/unauthorized?required=superadmin');
  }, [isLoaded, user, isSuperadmin, router]);

  useEffect(() => {
    if (!userId || !isSuperadmin) return;
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          setConfig(data.data || {});
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchConfig();
  }, [userId, isSuperadmin]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const updateField = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isSuperadmin) return null;

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-3xl mx-auto">

          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-ochre/10 border border-ochre/20 rounded-sm mb-6">
            <ShieldCheck className="h-4 w-4 text-ochre" />
            <span className="text-xs font-mono uppercase tracking-wider text-ochre">Superadmin Only</span>
          </div>

          <div className="mb-10">
            <div className="eyebrow mb-3">Admin Console</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Platform Config</h1>
            <p className="text-ink/60 text-[16px]">Manage platform-wide settings, feature flags, and fee structures</p>
          </div>

          <div className="flex items-start gap-3 p-4 bg-laterite/5 border border-laterite/15 rounded-lg mb-8">
            <AlertTriangle className="h-5 w-5 text-laterite/60 shrink-0 mt-0.5" />
            <p className="text-sm text-ink/70">
              Changes to fee structures take effect on new transactions immediately. Disabling features will hide them from all users.
              All configuration changes are recorded in the audit log.
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse h-32" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {CONFIG_GROUPS.map(({ group, key, fields }) => (
                <div key={key} className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                  <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-ink/30" />
                    <span className="font-medium text-ink text-sm">{group}</span>
                  </div>
                  <div className="p-6 space-y-5">
                    {fields.map(field => (
                      <div key={field.key} className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-ink text-sm">{field.label}</div>
                          <div className="text-xs text-ink/50 mt-0.5">{field.description}</div>
                        </div>
                        <div className="shrink-0">
                          {field.type === 'boolean' ? (
                            <button
                              onClick={() => updateField(field.key, !config[field.key])}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config[field.key] ? 'bg-ocean' : 'bg-ink/20'}`}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config[field.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          ) : field.type === 'number' ? (
                            <input
                              type="number"
                              value={config[field.key] ?? ''}
                              onChange={e => updateField(field.key, parseFloat(e.target.value))}
                              className="w-24 px-3 py-1.5 bg-paper border border-ink/15 rounded-sm text-sm text-right focus:outline-none focus:border-ochre/50"
                            />
                          ) : (
                            <input
                              type="text"
                              value={config[field.key] ?? ''}
                              onChange={e => updateField(field.key, e.target.value)}
                              className="w-56 px-3 py-1.5 bg-paper border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ochre/50"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Save button */}
              <div className="flex items-center justify-between pt-2">
                {saved && (
                  <span className="text-sm text-sage flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4" /> Configuration saved successfully
                  </span>
                )}
                <div className="ml-auto">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ochre text-paper font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ochre/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
