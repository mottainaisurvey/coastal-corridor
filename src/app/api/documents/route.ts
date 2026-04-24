export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { uploadDocument, getSignedUrl, deleteDocument, isStorageConfigured, type DocumentCategory } from '@/lib/storage';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * POST /api/documents
 * Upload a document. Accepts multipart/form-data.
 * Fields: file (File), category ('kyc'|'title'|'contracts'|'other'), label (string)
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: 'Document storage is not yet configured. Please contact support.' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as DocumentCategory) || 'other';
    const label = (formData.get('label') as string) || file?.name || 'Document';
    const relatedEntityType = formData.get('entityType') as string | null;
    const relatedEntityId = formData.get('entityId') as string | null;

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Accepted: PDF, JPEG, PNG, WEBP, DOC, DOCX' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadDocument(user.id, category, file.name, buffer, file.type);

    // Persist document record to AuditEntry (no Document model yet — use metadata)
    await prisma.auditEntry.create({
      data: {
        userId: user.id,
        entityType: relatedEntityType || 'Document',
        entityId: relatedEntityId || user.id,
        action: 'create',
        metadata: JSON.stringify({
          event: 'document_uploaded',
          storagePath: result.path,
          label,
          category,
          mimeType: file.type,
          sizeBytes: file.size,
          fileName: file.name,
        }),
      },
    });

    return NextResponse.json({
      path: result.path,
      label,
      category,
      mimeType: file.type,
      sizeBytes: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error('[Documents upload]', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

/**
 * GET /api/documents
 * List documents for the authenticated user (from audit log).
 * Query: ?category=kyc|title|contracts|other
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');

    // Retrieve document upload events from audit log
    const entries = await prisma.auditEntry.findMany({
      where: {
        userId: user.id,
        action: 'create',
        metadata: { contains: 'document_uploaded' },
        ...(category ? { metadata: { contains: `"category":"${category}"` } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const documents = await Promise.all(
      entries.map(async (entry: { id: string; metadata: string | null; createdAt: Date }) => {
        let meta: Record<string, unknown> = {};
        try { meta = JSON.parse(entry.metadata || '{}'); } catch {}
        if (meta.event !== 'document_uploaded') return null;

        let signedUrl: string | null = null;
        if (isStorageConfigured() && meta.storagePath) {
          try {
            signedUrl = await getSignedUrl(meta.storagePath as string);
          } catch {}
        }

        return {
          id: entry.id,
          label: meta.label,
          category: meta.category,
          mimeType: meta.mimeType,
          sizeBytes: meta.sizeBytes,
          fileName: meta.fileName,
          storagePath: meta.storagePath,
          signedUrl,
          uploadedAt: entry.createdAt,
        };
      })
    );

    return NextResponse.json({ documents: documents.filter(Boolean) });
  } catch (error) {
    console.error('[Documents list]', error);
    return NextResponse.json({ error: 'Failed to retrieve documents' }, { status: 500 });
  }
}

/**
 * DELETE /api/documents
 * Delete a document by storage path.
 * Body: { path: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

    const user = await prisma.user.findFirst({ where: { clerkId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { path } = await req.json();
    if (!path) return NextResponse.json({ error: 'path is required' }, { status: 400 });

    // Verify the path belongs to this user
    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isStorageConfigured()) {
      await deleteDocument(path);
    }

    // Log deletion
    await prisma.auditEntry.create({
      data: {
        userId: user.id,
        entityType: 'Document',
        entityId: user.id,
        action: 'delete',
        metadata: JSON.stringify({ event: 'document_deleted', storagePath: path }),
      },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error('[Documents delete]', error);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
