import type { DiaryEntryRow } from './types';
import { invokeAuthedFunction } from './functions';

export async function listDiaryEntries(params: { coupleId: string; limit?: number }) {
  const out = await invokeAuthedFunction<{ entries?: DiaryEntryRow[]; error?: string }>('list_diary_entries', {
    couple_id: params.coupleId,
    limit: params.limit ?? 30,
  });
  if (!out?.entries) throw new Error(out?.error || 'Failed to load diary entries');
  return out.entries;
}

export async function listDiaryEntriesByDay(params: { coupleId: string; dayStartIso: string; dayEndIso: string }) {
  const out = await invokeAuthedFunction<{ entries?: DiaryEntryRow[]; error?: string }>('list_diary_entries', {
    couple_id: params.coupleId,
    day_start_iso: params.dayStartIso,
    day_end_iso: params.dayEndIso,
  });
  if (!out?.entries) throw new Error(out?.error || 'Failed to load diary entries');
  return out.entries;
}

export async function createDiaryEntry(input: Omit<DiaryEntryRow, 'id' | 'created_at'>) {
  const out = await invokeAuthedFunction<{ entry?: DiaryEntryRow; error?: string }>('create_diary_entry', input);
  if (!out?.entry) throw new Error(out?.error || 'Failed to create diary entry');
  return out.entry;
}

export async function toggleFavorite(entryId: string, isFavorite: boolean) {
  const out = await invokeAuthedFunction<{ ok?: boolean; error?: string }>('toggle_diary_favorite', {
    id: entryId,
    is_favorite: isFavorite,
  });
  if (!out?.ok) throw new Error(out?.error || 'Failed to update favorite');
}

export async function deleteDiaryEntry(entryId: string) {
  const out = await invokeAuthedFunction<{ ok?: boolean; error?: string }>('delete_diary_entry', { id: entryId });
  if (!out?.ok) throw new Error(out?.error || 'Failed to delete diary entry');
}
