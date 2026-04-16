# Firebase → Supabase migration plan (DuoDiary)

This repo currently uses Firebase Auth + Firestore in:

- `src/firebase.ts`
- `src/components/AuthProvider.tsx`
- `src/components/CoupleProvider.tsx`
- `src/components/DiaryFeed.tsx`
- `src/components/CalendarView.tsx`
- `src/components/CreateEntry.tsx`
- `src/components/Shop.tsx`
- `src/components/Profile.tsx`

Supabase data layer has been scaffolded in:

- `src/lib/supabaseClient.ts`
- `src/lib/data/*`
- SQL: `supabase/schema.sql`, `supabase/rls.sql`

## Phase 0: Stand up Supabase project

1. Create project.
2. Apply `supabase/schema.sql`.
3. Apply `supabase/rls.sql`.
4. Configure OAuth (Google) in Supabase Auth.
5. Add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## Phase 1: Auth (swap Firebase Auth → Supabase Auth)

Target files:
- `src/components/AuthProvider.tsx`

Steps:
- Replace Firebase `onAuthStateChanged` with `supabase.auth.onAuthStateChange`.
- Replace `login()` with `supabase.auth.signInWithOAuth({ provider: 'google' })`.
- Replace `logout()` with `supabase.auth.signOut()`.
- Ensure profile exists via `upsertMyProfile()` (from `src/lib/data/profiles.ts`).

Notes:
- This will also remove Firebase dependency from runtime path (optional: keep until Phase 4 cleanup).

## Phase 2: Couple membership (CoupleProvider)

Target files:
- `src/components/CoupleProvider.tsx`
- `src/components/ConnectPartner.tsx` (not reviewed yet but used when `!couple`)

Steps:
- Replace Firestore `couples/{id}` subscription with:
  - `getMyCouple()` (simple) and/or realtime subscription later.
- For connect-by-email:
  - implement Edge Function described in `docs/supabase/couple-connect-flow.md`
  - call it from `ConnectPartner` UI.

## Phase 3: Replace Firestore reads/writes per feature

### Diary feed + calendar
Target files:
- `src/components/DiaryFeed.tsx`
- `src/components/CalendarView.tsx`
- `src/components/Profile.tsx` (grid/mood stats uses diary list)
- `src/components/CreateEntry.tsx` (create)

Mapping:
- list: `listDiaryEntries()`, `listDiaryEntriesByDay()`
- create: `createDiaryEntry()`
- favorite: `toggleFavorite()`

### Shop (coupons)
Target file:
- `src/components/Shop.tsx`

Mapping:
- list: `listCoupons()`
- create: `createCoupon()`
- use: `scheduleUseCoupon()`
- refund: `refundCoupon()`

### Anniversaries + Love notes
Target file:
- `src/components/DiaryFeed.tsx`

Mapping:
- anniversaries: `listAnniversaries()`, `createAnniversary()`
- love notes: `listLoveNotes()`, `createLoveNote()`

## Phase 4: Remove Firebase

After all features are on Supabase:
- delete `src/firebase.ts` usage and Firebase deps
- remove Firestore rules files if not needed

## Optional: Realtime

Once CRUD works, add Supabase Realtime:
- subscribe to `diary_entries`, `coupons`, etc. filtered by `couple_id`
- keep RLS enabled; realtime will respect policies.

