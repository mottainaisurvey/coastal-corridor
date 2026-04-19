# Coastal Corridor Platform — Deployment Guide

## Status
**Build Complete** — Production-ready MVP ready for deployment to Vercel.

## Pre-Deployment Checklist

### 1. External Services Setup

#### Clerk Authentication
1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Copy API keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `CLERK_WEBHOOK_SECRET` (for user sync webhooks)

#### Stripe Payments
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys:
   - `STRIPE_SECRET_KEY` (from Dashboard > API Keys)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` (from Webhooks section)
3. Configure webhook endpoint: `https://your-domain.com/api/webhooks/stripe`

#### Postmark Email
1. Create account at [postmarkapp.com](https://postmarkapp.com)
2. Get API token:
   - `POSTMARK_API_TOKEN`
3. Verify sender email domain

#### Supabase Database
1. Create project at [supabase.com](https://supabase.com)
2. Get connection string:
   - `DATABASE_URL` (PostgreSQL connection string)
3. Enable PostGIS extension (optional, for advanced geospatial queries)

#### Smile Identity (KYC)
1. Create account at [smileidentity.com](https://smileidentity.com)
2. Get credentials:
   - `SMILE_IDENTITY_API_KEY`
   - `SMILE_IDENTITY_PARTNER_ID`
3. Configure webhook: `https://your-domain.com/api/webhooks/kyc`

### 2. Environment Variables

Create `.env.production` with all required variables:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Postmark
POSTMARK_API_TOKEN=...

# Supabase
DATABASE_URL=postgresql://...

# Smile Identity
SMILE_IDENTITY_API_KEY=...
SMILE_IDENTITY_PARTNER_ID=...

# App URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Database Setup

```bash
# Push schema to production database
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

### 4. Vercel Deployment

#### Option A: Via Vercel CLI
```bash
npm install -g vercel
vercel login
vercel
```

#### Option B: Via GitHub
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### 5. Post-Deployment

1. **Verify Webhooks**
   - Test Clerk webhooks in Clerk dashboard
   - Test Stripe webhooks in Stripe dashboard
   - Test KYC webhooks in Smile Identity dashboard

2. **Test Critical Flows**
   - User signup/signin (Clerk)
   - Search functionality
   - Inquiry submission and email notification
   - Payment flow (use Stripe test mode)
   - KYC verification initiation

3. **Monitor Logs**
   - Check Vercel logs for errors
   - Monitor Postmark email delivery
   - Check Stripe webhook logs
   - Monitor database query performance

4. **Security Checklist**
   - ✅ All API keys in environment variables (never in code)
   - ✅ HTTPS enabled on all endpoints
   - ✅ CORS properly configured
   - ✅ Rate limiting enabled (implement with Upstash Redis)
   - ✅ Database backups configured
   - ✅ Audit logging enabled

## Scaling Considerations

### Database
- Monitor query performance with Supabase analytics
- Add indexes for frequently queried fields
- Consider read replicas for high-traffic scenarios
- Implement connection pooling with PgBouncer

### Caching
- Add Redis caching for search results (Upstash)
- Cache destination and agent data
- Implement cache invalidation strategy

### CDN
- Use Vercel's built-in CDN for static assets
- Configure image optimization with Next.js Image component
- Consider Cloudflare for additional DDoS protection

### Rate Limiting
- Implement rate limiting on API endpoints (Upstash Redis)
- Limit inquiry submissions per IP
- Limit search requests per user

## Monitoring & Observability

### Logging
- Use Vercel's built-in logging
- Consider Sentry for error tracking
- Log all critical operations (transactions, KYC, payments)

### Metrics
- Monitor API response times
- Track conversion funnel (search → inquiry → transaction)
- Monitor payment success rates
- Track KYC verification completion rates

### Alerts
- Set up alerts for failed payments
- Alert on high error rates
- Alert on database connection issues
- Alert on webhook failures

## Rollback Plan

If issues occur post-deployment:

1. **Immediate Rollback**
   ```bash
   vercel rollback
   ```

2. **Database Rollback**
   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

3. **Communication**
   - Notify users of any service disruptions
   - Post status updates on status page
   - Provide ETA for resolution

## Support & Maintenance

### Regular Tasks
- Monitor logs daily
- Review error rates weekly
- Analyze performance metrics weekly
- Update dependencies monthly
- Security audit quarterly

### Incident Response
- Have on-call rotation for critical issues
- Document all incidents
- Post-mortem analysis for major outages
- Implement preventive measures

## Next Phase: Beta Testing

Once deployed:
1. Invite closed beta users
2. Collect feedback on UX/performance
3. Monitor for bugs and edge cases
4. Prepare for public launch

---

**Deployment Status**: Ready for production
**Last Updated**: April 2026
**Maintained By**: Coastal Corridor Team
