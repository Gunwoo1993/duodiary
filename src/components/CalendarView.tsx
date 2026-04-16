import React, { useMemo, useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useCouple } from './CoupleProvider';
import { DiaryEntry } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Heart } from 'lucide-react';
import { getDemoDiaryEntries } from '../mock/demoDiary';
import { listDiaryEntries } from '../lib/data/diary';
import type { DiaryEntryRow } from '../lib/data/types';
import { useI18n } from '../lib/i18n';

export default function CalendarView() {
  const { couple } = useCouple();
  const { t, dateLocale, language } = useI18n();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<DiaryEntry[]>([]);

  useEffect(() => {
    if (!couple) return;

    if (couple.id === 'demo-couple') {
      setEntries(getDemoDiaryEntries());
      return;
    }

    let cancelled = false;
    const run = async () => {
      const rows = await listDiaryEntries({ coupleId: couple.id, limit: 300 });
      if (cancelled) return;
      const mapped = rows.map(mapRowToEntry);
      setEntries(mapped);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [couple]);

  useEffect(() => {
    if (date) {
      const filtered = entries
        .filter(entry => isSameDay(parseISO(entry.date), date))
        .slice()
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      setSelectedEntries(filtered);
    } else {
      setSelectedEntries([]);
    }
  }, [date, entries]);

  // Days with entries for highlighting
  const entryDays = useMemo(() => {
    const seen = new Set<string>();
    const days: Date[] = [];
    for (const e of entries) {
      const d = parseISO(e.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      days.push(d);
    }
    return days;
  }, [entries]);

  return (
    <div className="max-w-md mx-auto min-h-full bg-gradient-to-b from-rose-50/60 via-white to-white">
      <div className="px-4 pt-5 pb-3">
        <div className="mb-3 flex items-end justify-between">
            <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">{t('calendar.title')}</div>
            <div className="text-[12px] text-slate-600">
              {t('calendar.subtitle')}
            </div>
          </div>
          <div className="text-[12px] font-semibold text-rose-600">
            {t('common.countItems', { count: entries.length.toLocaleString() })}
          </div>
        </div>

        <Card className="rounded-3xl border border-slate-100/80 shadow-sm bg-white/80 backdrop-blur">
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={dateLocale}
              className="w-full flex justify-center"
              modifiers={{ hasEntry: entryDays }}
              modifiersStyles={{
                hasEntry: { fontWeight: 700 }
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pb-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[13px] font-bold text-slate-900">
            {date ? format(date, language === 'id' ? 'd MMMM yyyy' : 'yyyy년 M월 d일', { locale: dateLocale }) : t('calendar.selectDate')}
          </div>
          <div className="text-[12px] text-slate-500">
            {selectedEntries.length > 0 ? t('calendar.entries', { count: selectedEntries.length }) : t('calendar.none')}
          </div>
        </div>

        <Card className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-0">
            {selectedEntries.length > 0 ? (
              <ScrollArea className="max-h-[52vh]">
                <div className="divide-y divide-slate-100">
                  {selectedEntries.map(entry => (
                    <div key={entry.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-2xl leading-none">{entry.mood}</div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] leading-relaxed text-slate-900 whitespace-pre-wrap break-words">
                            {entry.content}
                          </div>
                          {entry.tags?.length ? (
                            <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                              {entry.tags.map(tag => (
                                <span key={tag} className="text-[11px] font-medium text-sky-600">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          ) : null}
                          <div className="mt-2 text-[11px] text-slate-400">
                            {format(parseISO(entry.date), language === 'id' ? 'HH:mm' : 'a h:mm', { locale: dateLocale })}
                          </div>
                        </div>
                        {entry.isFavorite ? (
                          <Heart className="h-4 w-4 text-rose-500 fill-rose-500 mt-1" />
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="py-16 text-center">
                <div className="text-sm font-semibold text-slate-700">{t('calendar.emptyTitle')}</div>
                <div className="mt-1 text-[12px] text-slate-500">
                  {t('calendar.emptySubtitle')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function mapRowToEntry(r: DiaryEntryRow): DiaryEntry {
  return {
    id: r.id,
    date: r.entry_at,
    content: r.content,
    photoURLs: r.photo_urls?.length ? r.photo_urls : undefined,
    mood: r.mood,
    tags: r.tags ?? [],
    isFavorite: r.is_favorite,
    authorUid: r.author_id,
  };
}
