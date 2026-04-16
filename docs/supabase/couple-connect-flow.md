# Couple connect flow (Supabase)

## Why this needs a server-side step

Connecting partners by **email** has two requirements that are a bad fit for a pure client + RLS approach:

- Avoid **email enumeration** (a client query like `select * from profiles where email = ...` leaks whether an email exists).
- Needs an **atomic transaction**:
  - create `couples` row
  - create 2 rows in `couple_members`
  - (optionally) ensure both users are not already in a couple

## Recommended approach (Edge Function)

Use an Edge Function with **service role** key to perform the operation.

### Endpoint

- `POST /functions/v1/connect-partner-by-email`

### Input

```json
{ "partnerEmail": "partner@example.com" }
```

### Steps (transaction)

1. Identify caller `callerId` from JWT.
2. Fetch `partnerId` by email (service role).
3. Validate:
   - `callerId != partnerId`
   - both users exist
   - neither user already has membership in any couple (or define your rule)
4. Create `couples` row.
5. Insert into `couple_members`:
   - `(coupleId, callerId)`
   - `(coupleId, partnerId)`
6. Return `{ coupleId }`.

## Alternative (invite code)

If you want **no email lookup**, use an invite code flow:

- user creates invite → function generates random code mapped to `coupleId`
- partner enters code → function validates and inserts membership

This is more private and scales better.

