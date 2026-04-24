'use client';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Upload, Trash2, ExternalLink,
  AlertCircle, CheckCircle, Clock, FolderOpen
} from 'lucide-react';

type DocumentCategory = 'kyc' | 'title' | 'contracts' | 'other';

interface DocumentRecord {
  id: string;
  label: string;
  category: DocumentCategory;
  mimeType: string;
  sizeBytes: number;
  fileName: string;
  storagePath: string;
  signedUrl: string | null;
  uploadedAt: string;
}

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  kyc: 'Identity Documents',
  title: 'Title & Survey Documents',
  contracts: 'Contracts & Agreements',
  other: 'Other Documents',
};

const CATEGORY_DESCRIPTIONS: Record<DocumentCategory, string> = {
  kyc: 'NIN slip, passport bio-data page, driver\'s licence',
  title: 'Certificate of Occupancy, survey plan, deed of assignment',
  contracts: 'Sale agreement, offer letter, power of attorney',
  other: 'Any other supporting documents',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function DocumentsPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>('all');

  const [uploadForm, setUploadForm] = useState({
    category: 'other' as DocumentCategory,
    label: '',
  });

  useEffect(() => {
    if (isLoaded && !userId) router.replace('/');
  }, [isLoaded, userId, router]);

  useEffect(() => {
    if (!userId) return;
    fetch('/api/documents')
      .then(r => r.json())
      .then(data => setDocuments(data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploadForm.category);
    formData.append('label', uploadForm.label || file.name);

    try {
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Upload failed');
        return;
      }
      setUploadSuccess(true);
      // Refresh document list
      const refreshed = await fetch('/api/documents').then(r => r.json());
      setDocuments(refreshed.documents || []);
      // Reset form
      setUploadForm({ category: 'other', label: '' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch {
      setUploadError('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(doc: DocumentRecord) {
    if (!confirm(`Delete "${doc.label}"? This cannot be undone.`)) return;
    try {
      const res = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: doc.storagePath }),
      });
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
      }
    } catch {}
  }

  const filtered = activeCategory === 'all'
    ? documents
    : documents.filter(d => d.category === activeCategory);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-sand flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ocean border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="inline-flex items-center gap-2 text-ink/50 hover:text-ink text-sm mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Account
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-6 h-6 text-ocean" />
            <h1 className="text-2xl font-light text-ink">My Documents</h1>
          </div>
          <p className="text-ink/60 text-sm">
            Securely store and manage your property documents, identity documents, and contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-ink/10 p-6">
              <h2 className="text-base font-medium text-ink mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-ocean" /> Upload Document
              </h2>

              {uploadSuccess && (
                <div className="bg-sage/10 border border-sage/30 rounded-lg p-3 flex items-center gap-2 text-sm text-sage mb-4">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Document uploaded successfully
                </div>
              )}

              {uploadError && (
                <div className="bg-laterite/10 border border-laterite/30 rounded-lg p-3 flex items-center gap-2 text-sm text-laterite mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {uploadError}
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={e => setUploadForm(f => ({ ...f, category: e.target.value as DocumentCategory }))}
                    className="w-full px-3 py-2 border border-ink/20 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-ocean/30"
                  >
                    {(Object.keys(CATEGORY_LABELS) as DocumentCategory[]).map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                    ))}
                  </select>
                  <p className="text-xs text-ink/40 mt-1">{CATEGORY_DESCRIPTIONS[uploadForm.category]}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Label (optional)</label>
                  <input
                    type="text"
                    value={uploadForm.label}
                    onChange={e => setUploadForm(f => ({ ...f, label: e.target.value }))}
                    className="w-full px-3 py-2 border border-ink/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30"
                    placeholder="e.g. Certificate of Occupancy"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">File</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    required
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="w-full text-sm text-ink/60 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-ocean/10 file:text-ocean hover:file:bg-ocean/20 cursor-pointer"
                  />
                  <p className="text-xs text-ink/40 mt-1">PDF, JPEG, PNG, WEBP, DOC, DOCX — max 10 MB</p>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-ocean text-white py-2.5 rounded-lg text-sm font-medium hover:bg-ocean/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Document list */}
          <div className="lg:col-span-2">
            {/* Category filter tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {(['all', 'kyc', 'title', 'contracts', 'other'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeCategory === cat
                      ? 'bg-ocean text-white'
                      : 'bg-white border border-ink/10 text-ink/60 hover:text-ink'
                  }`}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                  {cat !== 'all' && (
                    <span className="ml-1 opacity-60">
                      ({documents.filter(d => d.category === cat).length})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-ink/10 p-12 text-center">
                <FolderOpen className="w-12 h-12 text-ink/20 mx-auto mb-3" />
                <p className="text-ink/60 text-sm">
                  {activeCategory === 'all'
                    ? 'No documents uploaded yet'
                    : `No ${CATEGORY_LABELS[activeCategory as DocumentCategory]} uploaded yet`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map(doc => (
                  <div key={doc.id} className="bg-white rounded-xl border border-ink/10 p-4 flex items-start gap-4">
                    <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-ocean" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{doc.label}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full">
                          {CATEGORY_LABELS[doc.category]}
                        </span>
                        <span className="text-xs text-ink/40">{formatBytes(doc.sizeBytes)}</span>
                        <span className="text-xs text-ink/40">{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {doc.signedUrl ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-ink/40 hover:text-ocean transition-colors rounded-lg hover:bg-ocean/10"
                          title="View document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="p-1.5 text-ink/20" title="Preview unavailable">
                          <Clock className="w-4 h-4" />
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-ink/40 hover:text-laterite transition-colors rounded-lg hover:bg-laterite/10"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
