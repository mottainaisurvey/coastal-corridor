'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, MapPin, Phone, Globe, FileText, Save, CheckCircle, Upload, Shield } from 'lucide-react';

const AGENT_ROLES = ['agent', 'admin', 'superadmin', 'AGENT', 'ADMIN', 'SUPERADMIN'];

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

export default function AgentProfilePage() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', bio: '',
    agencyName: '', licenceNumber: '', yearsExperience: '',
    operatingStates: [] as string[], website: '', instagram: '', twitter: '',
  });

  const role = (user?.publicMetadata?.role as string) || '';
  const isAgent = AGENT_ROLES.includes(role);

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (isLoaded && user && !isAgent) router.replace('/unauthorized?required=agent');
  }, [isLoaded, user, isAgent, router]);

  useEffect(() => {
    if (!userId || !isAgent) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/agent/profile');
        if (res.ok) {
          const data = await res.json();
          const p = data.data;
          setProfile(p);
          if (p) {
            setForm({
              firstName: p.profile?.firstName || '',
              lastName: p.profile?.lastName || '',
              phone: p.profile?.phone || '',
              bio: p.agentProfile?.bio || '',
              agencyName: p.agentProfile?.agencyName || '',
              licenceNumber: p.agentProfile?.licenceNumber || '',
              yearsExperience: p.agentProfile?.yearsExperience || '',
              operatingStates: p.agentProfile?.operatingStates || [],
              website: p.agentProfile?.website || '',
              instagram: p.agentProfile?.instagram || '',
              twitter: p.agentProfile?.twitter || '',
            });
          }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchProfile();
  }, [userId, isAgent]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/agent/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const toggleState = (state: string) => {
    setForm(prev => ({
      ...prev,
      operatingStates: prev.operatingStates.includes(state)
        ? prev.operatingStates.filter(s => s !== state)
        : [...prev.operatingStates, state],
    }));
  };

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  if (!isLoaded || !user) return <div className="container-x py-24"><div className="animate-pulse h-10 bg-ink/10 rounded w-1/3" /></div>;
  if (!isAgent) return null;

  return (
    <div className="bg-paper min-h-screen">
      <div className="container-x py-16">
        <div className="max-w-3xl mx-auto">

          <Link href="/agent/dashboard" className="inline-flex items-center gap-2 text-sm text-ink/50 hover:text-ink transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>

          <div className="mb-10">
            <div className="eyebrow mb-3">Agent Portal</div>
            <h1 className="font-serif text-[36px] md:text-[44px] leading-[1.05] tracking-tightest font-light mb-2">Profile Settings</h1>
            <p className="text-ink/60 text-[16px]">Your public agent profile visible to buyers and platform administrators</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-white border border-ink/10 rounded-lg p-6 animate-pulse h-32" />)}
            </div>
          ) : (
            <div className="space-y-6">

              {/* Personal Information */}
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
                  <User className="h-4 w-4 text-ink/30" />
                  <span className="font-medium text-ink text-sm">Personal Information</span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { key: 'firstName', label: 'First Name', col: 1 },
                    { key: 'lastName', label: 'Last Name', col: 1 },
                    { key: 'phone', label: 'Phone Number', col: 2 },
                  ].map(({ key, label, col }) => (
                    <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                      <label className="eyebrow mb-1.5 block">{label}</label>
                      <input type="text" value={(form as any)[key]}
                        onChange={e => updateField(key, e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="eyebrow mb-1.5 block">Bio</label>
                    <textarea value={form.bio} onChange={e => updateField('bio', e.target.value)} rows={4}
                      placeholder="Tell buyers about your experience and specialisation..."
                      className="w-full px-3 py-2.5 bg-paper border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 resize-none" />
                  </div>
                </div>
              </div>

              {/* Agency & Licence */}
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-ink/30" />
                  <span className="font-medium text-ink text-sm">Agency & Licence</span>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { key: 'agencyName', label: 'Agency Name', col: 2 },
                    { key: 'licenceNumber', label: 'ESVARBON Licence No.', col: 1 },
                    { key: 'yearsExperience', label: 'Years of Experience', col: 1 },
                  ].map(({ key, label, col }) => (
                    <div key={key} className={col === 2 ? 'col-span-2' : ''}>
                      <label className="eyebrow mb-1.5 block">{label}</label>
                      <input type="text" value={(form as any)[key]}
                        onChange={e => updateField(key, e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Operating States */}
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ink/30" />
                  <span className="font-medium text-ink text-sm">Operating States</span>
                  <span className="text-xs text-ink/40 ml-auto">{form.operatingStates.length} selected</span>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2">
                    {NIGERIAN_STATES.map(state => (
                      <button key={state} onClick={() => toggleState(state)}
                        className={`px-3 py-1.5 rounded-sm border text-xs font-mono transition-colors ${form.operatingStates.includes(state) ? 'bg-ocean text-paper border-ocean' : 'bg-paper border-ink/15 text-ink/60 hover:border-ocean/40'}`}>
                        {state}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Online Presence */}
              <div className="bg-white border border-ink/10 rounded-lg overflow-hidden shadow-card">
                <div className="px-6 py-4 border-b border-ink/10 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-ink/30" />
                  <span className="font-medium text-ink text-sm">Online Presence</span>
                </div>
                <div className="p-6 space-y-4">
                  {[
                    { key: 'website', label: 'Website', placeholder: 'https://youragency.com' },
                    { key: 'instagram', label: 'Instagram', placeholder: '@youragency' },
                    { key: 'twitter', label: 'Twitter / X', placeholder: '@youragency' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="eyebrow mb-1.5 block">{label}</label>
                      <input type="text" value={(form as any)[key]} placeholder={placeholder}
                        onChange={e => updateField(key, e.target.value)}
                        className="w-full px-3 py-2.5 bg-paper border border-ink/15 rounded-sm text-sm focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Verification status */}
              {profile?.agentProfile && (
                <div className={`p-4 rounded-lg border flex items-center gap-3 ${profile.agentProfile.verified ? 'bg-sage/5 border-sage/20' : 'bg-ochre/5 border-ochre/20'}`}>
                  {profile.agentProfile.verified
                    ? <CheckCircle className="h-5 w-5 text-sage shrink-0" />
                    : <Shield className="h-5 w-5 text-ochre shrink-0" />
                  }
                  <div>
                    <div className="text-sm font-medium text-ink">
                      {profile.agentProfile.verified ? 'Verified Agent' : 'Verification Pending'}
                    </div>
                    <div className="text-xs text-ink/50">
                      {profile.agentProfile.verified
                        ? 'Your ESVARBON licence has been verified. Your listings display a verified badge.'
                        : 'Submit your ESVARBON licence number above. Verification takes 1–3 business days.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Save */}
              <div className="flex items-center justify-between pt-2">
                {saved && (
                  <span className="text-sm text-sage flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Profile saved successfully
                  </span>
                )}
                <div className="ml-auto">
                  <button onClick={handleSave} disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-ocean text-paper font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ocean/90 transition-colors disabled:opacity-50">
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Profile'}
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
