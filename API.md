# Coastal Corridor Platform — API Documentation

## Base URL
```
https://api.coastalcorridor.ng
```

## Authentication
All protected endpoints require Clerk authentication. Include the Clerk session token in the `Authorization` header:
```
Authorization: Bearer <clerk-session-token>
```

## Endpoints

### Search
**GET** `/api/search`

Search across properties, destinations, and agents.

**Query Parameters:**
- `q` (required): Search query (min 2 characters)
- `type` (optional): Filter by type (`properties`, `destinations`, `agents`)
- `destination` (optional): Filter by destination slug
- `minPrice` (optional): Minimum price in kobo
- `maxPrice` (optional): Maximum price in kobo
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "data": {
    "properties": [...],
    "destinations": [...],
    "agents": [...]
  },
  "pagination": {
    "limit": 20,
    "offset": 0,
    "query": "lekki",
    "total": 45
  }
}
```

### Inquiries
**POST** `/api/inquiries`

Submit a property inquiry.

**Request Body:**
```json
{
  "listingId": "string",
  "plotId": "string (optional)",
  "userId": "string",
  "message": "string (min 10 chars)",
  "preferredContactMethod": "email|phone|whatsapp",
  "offeredPriceKobo": "string (optional)",
  "buyerName": "string",
  "buyerEmail": "string",
  "buyerPhone": "string"
}
```

**Response:**
```json
{
  "data": {
    "id": "string",
    "status": "NEW",
    "message": "Inquiry submitted successfully. Check your email for confirmation."
  }
}
```

**GET** `/api/inquiries`

Retrieve inquiries.

**Query Parameters:**
- `listingId` (optional): Filter by listing
- `userId` (optional): Filter by user
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### Transactions
**POST** `/api/transactions`

Initiate a property transaction with payment.

**Request Body:**
```json
{
  "listingId": "string",
  "buyerId": "string",
  "agreedPriceKobo": "string",
  "escrowProvider": "providus|sterling|access (optional)"
}
```

**Response:**
```json
{
  "data": {
    "transactionId": "string",
    "reference": "TXN-...",
    "clientSecret": "pi_...",
    "status": "INITIATED"
  }
}
```

**GET** `/api/transactions`

Retrieve transactions.

**Query Parameters:**
- `id` (optional): Get specific transaction
- `buyerId` (optional): Filter by buyer
- `status` (optional): Filter by status

### Agent Dashboard
**GET** `/api/agent/stats`

Get agent dashboard statistics.

**Query Parameters:**
- `userId` (required): Agent user ID

**Response:**
```json
{
  "data": {
    "activeListings": 12,
    "totalViews": 1250,
    "totalInquiries": 45,
    "newInquiries": 3,
    "conversionRate": 3.6
  }
}
```

**GET** `/api/agent/listings`

Get agent's listings.

**Query Parameters:**
- `userId` (required): Agent user ID
- `status` (optional): Filter by status
- `limit` (optional): Results per page (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**GET** `/api/agent/inquiries`

Get agent's inquiries.

**Query Parameters:**
- `userId` (required): Agent user ID
- `status` (optional): Filter by status
- `limit` (optional): Results per page (default: 20, max: 100)
- `offset` (optional): Pagination offset (default: 0)

### Admin Dashboard
**GET** `/api/admin/stats`

Get platform overview statistics. (Admin only)

**Response:**
```json
{
  "data": {
    "totalUsers": 1250,
    "agents": 45,
    "developers": 12,
    "buyers": 1193,
    "activeListings": 234,
    "pendingListings": 18,
    "soldListings": 56,
    "verifiedAgents": 40,
    "pendingAgentVerification": 5,
    "pendingVerification": 23,
    "totalTransactions": 89,
    "completedTransactions": 67,
    "failedTransactions": 3,
    "newInquiries": 12
  }
}
```

### KYC Verification
**POST** `/api/kyc/verify`

Initiate KYC verification.

**Request Body:**
```json
{
  "userId": "string",
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phoneNumber": "string",
  "idType": "NIN|BVN|PASSPORT|DRIVERS_LICENSE",
  "idNumber": "string",
  "dateOfBirth": "YYYY-MM-DD"
}
```

**Response:**
```json
{
  "data": {
    "verificationId": "KYC-...",
    "status": "PENDING",
    "message": "KYC verification initiated..."
  }
}
```

**GET** `/api/kyc/verify`

Check KYC verification status.

**Query Parameters:**
- `userId` (required): User ID

**Response:**
```json
{
  "data": {
    "userId": "string",
    "email": "string",
    "kycStatus": "NOT_STARTED|PENDING|APPROVED|REJECTED",
    "verified": false
  }
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": {
    "field": ["error description"]
  }
}
```

**Common Status Codes:**
- `200`: Success
- `201`: Created
- `400`: Bad request (validation error)
- `401`: Unauthorized (not authenticated)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

## Rate Limiting

API endpoints are rate-limited:
- **Search**: 100 requests per minute per IP
- **Inquiries**: 5 requests per hour per IP
- **Transactions**: 10 requests per hour per user
- **KYC**: 1 request per day per user

Rate limit info is included in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## Webhooks

### Stripe Webhooks
**Endpoint**: `POST /api/webhooks/stripe`

**Events:**
- `payment_intent.succeeded`: Payment confirmed
- `payment_intent.payment_failed`: Payment failed
- `charge.refunded`: Refund processed

### KYC Webhooks
**Endpoint**: `POST /api/webhooks/kyc`

**Events:**
- KYC verification completed (approved/rejected)

## Examples

### Search for properties in Lekki
```bash
curl -X GET "https://api.coastalcorridor.ng/api/search?q=lekki&type=properties&limit=10"
```

### Submit an inquiry
```bash
curl -X POST "https://api.coastalcorridor.ng/api/inquiries" \
  -H "Content-Type: application/json" \
  -d '{
    "listingId": "lst_123",
    "userId": "user_456",
    "message": "I am interested in this property",
    "buyerName": "John Doe",
    "buyerEmail": "john@example.com",
    "buyerPhone": "+2348012345678"
  }'
```

### Get agent stats
```bash
curl -X GET "https://api.coastalcorridor.ng/api/agent/stats?userId=agent_789" \
  -H "Authorization: Bearer <clerk-token>"
```

## Support
For API support, contact: api-support@coastalcorridor.ng

---

**API Version**: 1.0.0
**Last Updated**: April 2026
