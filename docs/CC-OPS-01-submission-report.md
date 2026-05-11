# CC-OPS-01 Submission Report

## 1. Delivery ID
CC-OPS-01 — Subdomain TLS Provisioning: `host.coastalcorridor.africa` and `operator.coastalcorridor.africa`

---

## 2. Status
**CLOSED — All acceptance criteria met.**

---

## 3. Acceptance Criteria Results

### AC-1 — Correct Vercel project identified: PASS

The two subdomains belong on the **`coastal-corridor` production project** (Vercel team: `owambe`), not on `coastal-corridor-staging`. Basis: the production project already serves `coastalcorridor.africa` and 13 other `*.coastalcorridor.africa` subdomains, all showing "Valid Configuration". The DNS A records for `host.coastalcorridor.africa` and `operator.coastalcorridor.africa` point to Vercel edge IPs (confirmed in CC-WAVE3-PREP), which are the same IPs serving the production project.

### AC-2 — Both subdomains added to the Vercel project: PASS

Both domains were added via the Vercel dashboard Domains settings page (`coastal-corridor` → Settings → Domains → Add Existing), with environment set to **Production** and no redirect:

| Domain | Added at (UTC) | Initial status |
|---|---|---|
| `host.coastalcorridor.africa` | 2026-05-11 ~18:53 | Generating SSL Certificate |
| `operator.coastalcorridor.africa` | 2026-05-11 ~18:54 | Generating SSL Certificate |

By the time `operator` was added, `host` had already transitioned to **Valid Configuration**, confirming rapid certificate issuance from Let's Encrypt via Vercel's automated provisioning.

### AC-3 — HTTPS probe verification: PASS

Both subdomains respond to HTTPS with valid TLS certificates. Probe results:

| Domain | HTTP status | TLS handshake | Certificate SAN | Certificate expiry |
|---|---|---|---|---|
| `host.coastalcorridor.africa` | 200 OK | OK | `host.coastalcorridor.africa` | 2026-08-09 21:54:47 UTC |
| `operator.coastalcorridor.africa` | 200 OK | OK | `operator.coastalcorridor.africa` | 2026-08-09 21:55:43 UTC |

Both certificates are domain-specific (single-SAN), issued by Let's Encrypt via Vercel's automated provisioning, valid for 90 days from issuance. No SSL errors, no certificate warnings, no redirect loops. Both resolve to the production `coastal-corridor` deployment.

---

## 4. Deviations from Brief
None. The brief specified adding both subdomains to the correct Vercel project and verifying TLS. Both steps completed as specified.

One observation worth recording: the Vercel dashboard listed `host.coastalcorridor.africa` as "Valid Configuration" before `operator.coastalcorridor.africa` was even submitted — the certificate was issued in under 60 seconds. This is consistent with the DNS A records already being in place (CC-WAVE3-PREP confirmed the DNS was pre-provisioned), which allows Vercel's ACME challenge to complete immediately.

---

## 5. Verification Artefacts

**Vercel dashboard state (post-provisioning):**
- `operator.coastalcorridor.africa` — Generating SSL Certificate → Valid Configuration (Production)
- `host.coastalcorridor.africa` — Valid Configuration (Production)

**HTTPS probe output (2026-05-11 ~18:55 UTC):**
```
[host.coastalcorridor.africa]     HTTP 200 — TLS OK — final URL: https://host.coastalcorridor.africa/
  TLS cert SANs: ['host.coastalcorridor.africa']
  TLS cert expires: Aug  9 21:54:47 2026 GMT

[operator.coastalcorridor.africa] HTTP 200 — TLS OK — final URL: https://operator.coastalcorridor.africa/
  TLS cert SANs: ['operator.coastalcorridor.africa']
  TLS cert expires: Aug  9 21:55:43 2026 GMT
```

---

## 6. Next Blocked Item
CC-WAVE3-PREP pre-condition 1 (subdomain TLS provisioning) is now resolved. The remaining pre-condition before Wave 4 briefs can be issued is:

- **Pre-condition 2:** Prisma migration for `ReservationStatus` and `ExperienceBookingStatus` `REFUNDED` values (Owambe-side coordination — CC-REM-03 DRIFT-01 and DRIFT-02).

Wave 4 briefs for `CC-C-08` (host portal) and `CC-C-09` (operator portal) can now be scoped against the provisioned subdomains.

---

## 7. Time / Effort Summary
**Elapsed:** ~10 minutes. **Scope:** Vercel dashboard domain addition (2 domains), HTTPS probe verification (2 domains). No code changes. No deployment required — the existing production deployment is automatically aliased to newly added domains.
