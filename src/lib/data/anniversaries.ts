import type { AnniversaryRow } from './types';
import { invokeAuthedFunction } from './functions';

export async function listAnniversaries(coupleId: string) {
  const out = await invokeAuthedFunction<{ anniversaries?: AnniversaryRow[]; error?: string }>('list_anniversaries', {
    couple_id: coupleId,
  });
  if (!out?.anniversaries) throw new Error(out?.error || 'Failed to load anniversaries');
  return out.anniversaries;
}

export async function createAnniversary(input: Omit<AnniversaryRow, 'id' | 'created_at'>) {
  const out = await invokeAuthedFunction<{ anniversary?: AnniversaryRow; error?: string }>('create_anniversary', input);
  if (!out?.anniversary) throw new Error(out?.error || 'Failed to create anniversary');
  return out.anniversary;
}
