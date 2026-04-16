import type { LoveNoteRow } from './types';
import { invokeAuthedFunction } from './functions';

export async function listLoveNotes(coupleId: string, limit = 30) {
  const out = await invokeAuthedFunction<{ love_notes?: LoveNoteRow[]; error?: string }>('list_love_notes', {
    couple_id: coupleId,
    limit,
  });
  if (!out?.love_notes) throw new Error(out?.error || 'Failed to load love notes');
  return out.love_notes;
}

export async function createLoveNote(input: Omit<LoveNoteRow, 'id' | 'created_at'>) {
  const out = await invokeAuthedFunction<{ love_note?: LoveNoteRow; error?: string }>('create_love_note', input);
  if (!out?.love_note) throw new Error(out?.error || 'Failed to create love note');
  return out.love_note;
}
