/**
 * Document Storage — Supabase Storage
 *
 * Handles secure upload, signed URL generation, and deletion of documents.
 * All documents are stored in the 'documents' bucket in Supabase Storage.
 *
 * Bucket structure:
 *   documents/
 *     {userId}/
 *       kyc/          — identity documents (NIN, passport scans)
 *       title/        — title deeds, survey plans
 *       contracts/    — sale agreements, offer letters
 *       other/        — miscellaneous supporting documents
 *
 * SECURITY:
 * - Bucket is private (no public access)
 * - All access via signed URLs (1-hour expiry)
 * - Upload requires authenticated user context
 * - Service role key required for admin access
 */

import { StorageClient } from '@supabase/storage-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

const BUCKET = 'documents';
const SIGNED_URL_EXPIRY = 3600; // 1 hour

function getStorageClient(useServiceKey = false): StorageClient | null {
  if (!SUPABASE_URL) return null;
  const key = useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY;
  if (!key) return null;
  return new StorageClient(`${SUPABASE_URL}/storage/v1`, {
    apikey: key,
    Authorization: `Bearer ${key}`,
  });
}

export type DocumentCategory = 'kyc' | 'title' | 'contracts' | 'other';

export interface UploadResult {
  path: string;
  fullPath: string;
  publicUrl?: string;
}

/**
 * Upload a document to Supabase Storage.
 * Returns the storage path for saving to the database.
 */
export async function uploadDocument(
  userId: string,
  category: DocumentCategory,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string
): Promise<UploadResult> {
  const storage = getStorageClient(true);
  if (!storage) {
    throw new Error('Storage not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const path = `${userId}/${category}/${timestamp}_${sanitizedName}`;

  const { data, error } = await storage
    .from(BUCKET)
    .upload(path, fileBuffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return {
    path: data.path,
    fullPath: data.fullPath,
  };
}

/**
 * Generate a signed URL for a document (1-hour expiry).
 */
export async function getSignedUrl(path: string): Promise<string> {
  const storage = getStorageClient(true);
  if (!storage) throw new Error('Storage not configured');

  const { data, error } = await storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRY);

  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Delete a document from storage.
 */
export async function deleteDocument(path: string): Promise<void> {
  const storage = getStorageClient(true);
  if (!storage) throw new Error('Storage not configured');

  const { error } = await storage.from(BUCKET).remove([path]);
  if (error) throw new Error(`Delete failed: ${error.message}`);
}

/**
 * Check if storage is configured.
 */
export function isStorageConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
}
