/**
 * Sketch for an Edge Function (Deno) that connects a partner by email.
 * This is intentionally not wired into the app yet.
 *
 * Why Edge Function?
 * - email lookup is sensitive (avoid client-side email enumeration)
 * - needs a transaction: create couple + insert 2 memberships atomically
 * - needs service role key (bypasses RLS for controlled operations)
 *
 * Expected input:
 *   { partnerEmail: string }
 *
 * Expected output:
 *   { coupleId: string }
 */

// Pseudocode only. Implement in Supabase Functions runtime.
export {};

