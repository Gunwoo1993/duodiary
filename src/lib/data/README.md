# Data layer (Supabase)

This folder defines thin, testable wrappers around `supabase-js` calls.

## Conventions

- **RLS-first**: client calls are allowed only when Row Level Security permits it.
- **No UI imports**: keep these modules framework-agnostic.
- **Table naming**: matches SQL tables in `supabase/schema.sql`.

## Modules

- `profiles.ts`: upsert/get current profile
- `couples.ts`: get my couple, update anniversary date
- `diary.ts`: list/create/update diary entries
- `coupons.ts`: list/create/use/refund coupons
- `anniversaries.ts`: list/create anniversaries
- `loveNotes.ts`: list/create love notes

