/**
 * Legacy Owambe Webhook Endpoint — Phase A
 *
 * This path (/api/webhooks/owambe) is maintained for backward compatibility
 * during the transition period. The canonical path per the OpenAPI contract is:
 *   POST /api/v1/channel/webhooks/inbound
 *
 * This file re-exports the handler from the canonical location so both paths
 * are served by the same implementation.
 *
 * Once Owambe has updated their webhook configuration to the canonical path,
 * this file can be removed.
 *
 * Spec reference: Implementation Brief §10, API Narrative §7, Section 15 amendment note
 */
export { POST } from '@/app/api/v1/channel/webhooks/inbound/route';
