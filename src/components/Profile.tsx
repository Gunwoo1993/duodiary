import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useCouple } from './CoupleProvider';
import { DiaryEntry } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format, parseISO, differenceInDays } from 'date-fns';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { listDiaryEntries } from '../lib/data/diary';
import type { DiaryEntryRow } from '../lib/data/types';
import { useI18n } from '../lib/i18n';

export default function Profile() {
  const { profile, logout } = useAuth();
  const { couple, partner, updateAnniversary } = useCouple();
  const { t } = useI18n();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [anniversaryInput, setAnniversaryInput] = useState(couple?.anniversaryDate || '');
  const [isEditingAnniversary, setIsEditingAnniversary] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  useEffect(() => {
    if (!couple) return;
    if (couple.id === 'demo-couple') return;

    let cancelled = false;
    const run = async () => {
      const rows = await listDiaryEntries({ coupleId: couple.id, limit: 400 });
      if (cancelled) return;
      setEntries(rows.map(mapRowToEntry));
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [couple]);

  const handleUpdateAnniversary = async () => {
    try {
      await updateAnniversary(anniversaryInput);
      setIsEditingAnniversary(false);
      toast.success(t('profile.anniversaryUpdated'));
    } catch (error) {
      toast.error(t('profile.anniversaryUpdateFailed'));
    }
  };

  const daysTogether = couple?.anniversaryDate 
    ? differenceInDays(new Date(), parseISO(couple.anniversaryDate)) + 1
    : 0;

  return (
    <div className="max-w-md mx-auto bg-white min-h-full">
      {/* Profile Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-8 mb-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={profile?.photoURL || ''} />
            <AvatarFallback>{profile?.displayName?.[0] ?? profile?.email?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-1 justify-around text-center">
            <div>
              <p className="font-bold text-lg">{entries.length}</p>
              <p className="text-[11px] text-slate-500">{t('profile.posts')}</p>
            </div>
            <div>
              <p className="font-bold text-lg">{daysTogether}</p>
              <p className="text-[11px] text-slate-500">{t('profile.days')}</p>
            </div>
            <div>
              <p className="font-bold text-lg">1</p>
              <p className="text-[11px] text-slate-500">{t('profile.partner')}</p>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-0.5 mb-4">
          <p className="font-bold text-sm">{profile?.displayName}</p>
          <p className="text-sm text-slate-700">{t('profile.bio', { name: partner?.displayName ?? t('profile.partner') })}</p>
          {couple?.anniversaryDate && (
            <p className="text-sm text-instagram-blue">D+{daysTogether} ({format(parseISO(couple.anniversaryDate), 'yyyy.MM.dd')})</p>
          )}
        </div>

        {/* Actions */}
        <div className="mb-6 space-y-2">
          <Button variant="secondary" className="w-full h-8 text-xs font-semibold bg-slate-100 hover:bg-slate-200" onClick={() => setIsEditingAnniversary(!isEditingAnniversary)}>
            {t('profile.editAnniversary')}
          </Button>
          <Button
            variant="secondary"
            className="w-full h-8 text-xs font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200"
            onClick={async () => {
              try {
                await logout();
                toast.success(t('profile.loggedOut'));
              } catch (error) {
                toast.error(t('profile.logoutFailed'));
              }
            }}
          >
            {t('profile.logout')}
          </Button>
        </div>

        {isEditingAnniversary && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-slate-50 rounded-lg border">
            <p className="text-xs font-bold mb-2">{t('profile.setAnniversary')}</p>
            <div className="flex gap-2">
              <Input type="date" value={anniversaryInput} onChange={(e) => setAnniversaryInput(e.target.value)} className="h-9 text-sm" />
              <Button size="sm" onClick={handleUpdateAnniversary}>{t('common.save')}</Button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Post Grid */}
      <div className="grid grid-cols-3 gap-[1px] bg-slate-100">
        {entries.map((entry, i) => (
          <div key={i} className="aspect-square bg-white overflow-hidden relative group">
            {entry.photoURLs?.[0] ? (
              (() => {
                const mediaUrl = entry.photoURLs[0];
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm');
                return (
              <button
                type="button"
                onClick={() =>
                  setSelectedMedia({
                    url: mediaUrl,
                    type: isVideo ? 'video' : 'image',
                  })
                }
                className="flex h-full w-full items-center justify-center bg-slate-50"
              >
                {isVideo ? (
                  <video src={mediaUrl} className="h-full w-full object-contain" muted />
                ) : (
                  <img src={mediaUrl} className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                )}
              </button>
                );
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl bg-slate-50">
                {entry.mood}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={Boolean(selectedMedia)} onOpenChange={(open) => !open && setSelectedMedia(null)}>
        <DialogContent className="max-w-3xl border-none bg-black/95 p-0 text-white overflow-hidden">
          <DialogHeader className="px-4 py-3">
            <DialogTitle className="text-sm font-semibold text-white">{profile?.displayName ?? 'Preview'}</DialogTitle>
          </DialogHeader>
          <div className="flex max-h-[80vh] min-h-[320px] items-center justify-center bg-black px-4 pb-4">
            {selectedMedia?.type === 'video' ? (
              <video
                src={selectedMedia.url}
                controls
                className="max-h-[72vh] w-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : selectedMedia?.url ? (
              <img
                src={selectedMedia.url}
                alt="Profile preview"
                className="max-h-[72vh] w-full object-contain"
                referrerPolicy="no-referrer"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
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
