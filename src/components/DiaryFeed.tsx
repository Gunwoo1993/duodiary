import React, { useEffect, useMemo, useState } from 'react';
import { useCouple } from './CoupleProvider';
import { useAuth } from './AuthProvider';
import { DiaryEntry } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Heart, MessageCircle, MoreHorizontal, Plus, Send, Sparkles } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import CreateEntry from './CreateEntry';
import { getDemoDiaryEntries } from '../mock/demoDiary';
import { listDiaryEntries, toggleFavorite as toggleFavoriteRow, deleteDiaryEntry } from '../lib/data/diary';
import { listAnniversaries, createAnniversary } from '../lib/data/anniversaries';
import { listLoveNotes, createLoveNote } from '../lib/data/loveNotes';
import type { AnniversaryRow, DiaryEntryRow, LoveNoteRow } from '../lib/data/types';
import { useI18n } from '../lib/i18n';

type AnniversaryItem = {
  id: string;
  title: string;
  date: string;
};

const DEMO_BABY = {
  name: '아기',
  photoURL: '/avatars/baby.png',
};

const DEFAULT_AVATAR_BY_LABEL: Record<string, string> = {
  나: '/avatars/husband.png',
  남편: '/avatars/husband.png',
  아내: '/avatars/wife.png',
  와이프: '/avatars/wife.png',
  남: '/avatars/husband.png',
  W: '/avatars/wife.png',
  아기: '/avatars/baby.png',
};

function getDefaultAvatar(label?: string | null) {
  if (!label) return '/avatars/baby.png';
  return DEFAULT_AVATAR_BY_LABEL[label] ?? '/avatars/baby.png';
}

function getRoleAvatar(role: 'husband' | 'wife' | 'baby') {
  if (role === 'husband') return '/avatars/husband.png';
  if (role === 'wife') return '/avatars/wife.png';
  return '/avatars/baby.png';
}

function getDisplayRole(displayName?: string | null, email?: string | null): 'husband' | 'wife' {
  const normalizedDisplayName = displayName?.toLowerCase() ?? '';
  const normalizedEmail = email?.toLowerCase() ?? '';

  if (
    normalizedEmail.startsWith('intan1717') ||
    normalizedDisplayName.includes('하은') ||
    normalizedDisplayName.includes('아내') ||
    normalizedDisplayName.includes('wife')
  ) {
    return 'wife';
  }

  return 'husband';
}

export default function DiaryFeed() {
  const { couple, partner } = useCouple();
  const { user, profile } = useAuth();
  const { t, dateLocale, language } = useI18n();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const isCurrentUserWife = getDisplayRole(profile?.displayName, profile?.email) === 'wife';
  const currentUserRoleLabel = isCurrentUserWife ? t('role.wife') : t('role.husband');
  const partnerRoleLabel = isCurrentUserWife ? t('role.husband') : t('role.wifeCasual');
  const currentUserAvatar = getRoleAvatar(isCurrentUserWife ? 'wife' : 'husband');
  const partnerAvatar = getRoleAvatar(isCurrentUserWife ? 'husband' : 'wife');
  const familyLabels = [currentUserRoleLabel, partnerRoleLabel, t('role.baby')];
  const [anniversaries, setAnniversaries] = useState<AnniversaryItem[]>([]);
  const [oneLinerDraft, setOneLinerDraft] = useState('');
  const [myLatestOneLiner, setMyLatestOneLiner] = useState('');
  const [partnerLatestOneLiner, setPartnerLatestOneLiner] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAnniversaries, setShowAnniversaries] = useState(false);
  const [newAnniversaryTitle, setNewAnniversaryTitle] = useState('');
  const [newAnniversaryDate, setNewAnniversaryDate] = useState('');
  const [showStoryMessage, setShowStoryMessage] = useState(false);
  const [storyDialogTitle, setStoryDialogTitle] = useState('');
  const [storyDialogMessage, setStoryDialogMessage] = useState('');
  const [expandedOneLiner, setExpandedOneLiner] = useState(false);

  useEffect(() => {
    if (!couple) return;
    const demoAnniversaries: AnniversaryItem[] = [
      { id: 'ann-1', title: t('demo.anniversary.marriage'), date: '2023-05-10' },
      { id: 'ann-2', title: t('demo.anniversary.wifeBirthday'), date: '1999-04-17' },
      { id: 'ann-3', title: t('demo.anniversary.babyBirthday'), date: '2025-10-02' },
    ];
    const demoOneLiners = [
      t('demo.oneLiner1'),
      t('demo.oneLiner2'),
      t('demo.oneLiner3'),
      t('demo.oneLiner4'),
    ];

    if (couple.id === 'demo-couple') {
      setEntries(getDemoDiaryEntries());
      setAnniversaries(demoAnniversaries);
      setMyLatestOneLiner(isCurrentUserWife ? demoOneLiners[1] : demoOneLiners[0]);
      setPartnerLatestOneLiner(isCurrentUserWife ? demoOneLiners[0] : demoOneLiners[1]);
      setOneLinerDraft('');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const [entryRows, anniversaryRows, loveNoteRows] = await Promise.all([
          listDiaryEntries({ coupleId: couple.id, limit: 100 }),
          listAnniversaries(couple.id),
          listLoveNotes(couple.id, 10),
        ]);
        if (cancelled) return;
        setEntries(entryRows.map(mapRowToEntry));
        setAnniversaries(anniversaryRows.map(mapRowToAnniversary));
        setMyLatestOneLiner(
          getLatestLoveNoteText(loveNoteRows, (row) => row.from_id === user?.uid) ?? ''
        );
        setPartnerLatestOneLiner(
          getLatestLoveNoteText(
            loveNoteRows,
            (row) => row.from_id === partner?.uid && (row.to_id === user?.uid || !row.to_id)
          ) ?? ''
        );
      } catch (error) {
        toast.error(t('home.loadFailed'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [couple, isCurrentUserWife, partner?.uid, t, user?.uid]);

  const daysTogether = couple?.anniversaryDate
    ? differenceInDays(new Date(), parseISO(couple.anniversaryDate)) + 1
    : 0;

  const nextAnniversary = useMemo(() => {
    const today = new Date();
    const candidates = anniversaries
      .map((item) => {
        const base = parseISO(item.date);
        let next = new Date(today.getFullYear(), base.getMonth(), base.getDate());
        if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
          next = new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
        }
        return { ...item, nextDate: next };
      })
      .sort((a, b) => a.nextDate.getTime() - b.nextDate.getTime());

    if (candidates.length === 0) return null;
    const item = candidates[0];
    return {
      title: item.title,
      dday: differenceInDays(item.nextDate, new Date()),
    };
  }, [anniversaries]);

  const toggleFavorite = async (entry: DiaryEntry) => {
    if (!couple) return;
    try {
      if (couple.id === 'demo-couple') {
        setEntries((prev) =>
          prev.map((item) =>
            item.id === entry.id ? { ...item, isFavorite: !item.isFavorite } : item
          )
        );
        return;
      }
      await toggleFavoriteRow(entry.id, !entry.isFavorite);
      setEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, isFavorite: !item.isFavorite } : item
        )
      );
    } catch (error) {
      toast.error(t('home.post.favoriteFailed'));
    }
  };

  const deleteEntry = async (entryId: string) => {
    if (!couple) return;
    if (!confirm(t('home.post.deleteConfirm'))) return;
    try {
      if (couple.id === 'demo-couple') {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      } else {
        await deleteDiaryEntry(entryId);
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      }
      toast.success(t('home.post.deleted'));
    } catch (error) {
      toast.error(t('home.post.deleteFailed'));
    }
  };

  const sendOneLiner = async () => {
    if (!couple || !user) return;
    if (!oneLinerDraft.trim()) {
      toast.error(t('home.oneLiner.empty'));
      return;
    }
    try {
      const text = oneLinerDraft.trim();
      if (couple.id !== 'demo-couple') {
        await createLoveNote({
          couple_id: couple.id,
          from_id: user.uid,
          to_id: partner?.uid ?? null,
          emotion: 'love',
          topic: '오늘의 한마디',
          text,
        });
      }
      setMyLatestOneLiner(text);
      setOneLinerDraft('');
      toast.success(t('home.oneLiner.sent'));
    } catch (error) {
      toast.error(t('home.oneLiner.sendFailed'));
    }
  };

  const openStoryMessage = (target: 'me' | 'partner' | 'baby') => {
    if (target === 'baby') {
      setStoryDialogTitle(t('home.story.babyTitle'));
      setStoryDialogMessage(t('home.story.babyMessage'));
      setShowStoryMessage(true);
      return;
    }

    if (target === 'me') {
      setStoryDialogTitle(t('home.story.mineTitle', { name: currentUserRoleLabel }));
      setStoryDialogMessage(myLatestOneLiner || t('home.oneLiner.noneMine'));
      setShowStoryMessage(true);
      return;
    }

    setStoryDialogTitle(t('home.story.partnerTitle', { name: partnerRoleLabel }));
    setStoryDialogMessage(partnerLatestOneLiner || t('home.oneLiner.nonePartner'));
    setShowStoryMessage(true);
  };

  const addAnniversary = async () => {
    if (!couple || !newAnniversaryTitle.trim() || !newAnniversaryDate) return;
    try {
      if (couple.id === 'demo-couple') {
        setAnniversaries((prev) => [
          ...prev,
          {
            id: `demo-ann-${Date.now()}`,
            title: newAnniversaryTitle.trim(),
            date: newAnniversaryDate,
          },
        ]);
      } else {
        const row = await createAnniversary({
          couple_id: couple.id,
          title: newAnniversaryTitle.trim(),
          date: newAnniversaryDate,
        });
        setAnniversaries((prev) => [...prev, mapRowToAnniversary(row)]);
      }
      setNewAnniversaryTitle('');
      setNewAnniversaryDate('');
      toast.success(t('home.anniversaries.added'));
    } catch (error) {
      toast.error(t('home.anniversaries.addFailed'));
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-full bg-gradient-to-b from-rose-50/70 via-white to-white">
      <div className="px-4 pt-5">
        <Card className="overflow-hidden rounded-[28px] border border-rose-100/70 bg-white/90 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 ring-2 ring-rose-100">
                <AvatarImage src={currentUserAvatar} />
                <AvatarFallback>{profile?.displayName?.[0] ?? profile?.email?.[0] ?? '?'}</AvatarFallback>
              </Avatar>
              <Avatar className="h-12 w-12 ring-2 ring-rose-100">
                <AvatarImage src={partnerAvatar} />
                <AvatarFallback>{partner?.displayName?.[0] ?? partner?.email?.[0] ?? 'W'}</AvatarFallback>
              </Avatar>
              <Avatar className="h-12 w-12 ring-2 ring-rose-100">
                <AvatarImage src={DEMO_BABY.photoURL} />
                <AvatarFallback>{DEMO_BABY.name[0]}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-400">{t('home.familyLabel')}</div>
                <div className="truncate text-sm font-extrabold text-slate-900">
                  {familyLabels.join(' · ')}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {t('home.familySubtitle')}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm transition hover:bg-rose-600"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="px-4 pt-4">
        <button type="button" onClick={() => setShowAnniversaries(true)} className="w-full text-left">
          <Card className="rounded-[28px] border border-rose-100/70 bg-gradient-to-r from-rose-100 via-pink-50 to-amber-50 shadow-sm transition hover:shadow-md">
            <CardContent className="p-3">
              <div className="text-base font-extrabold text-rose-700">{t('home.daysTogether', { days: daysTogether })}</div>
              <div className="mt-1 text-xs font-medium text-slate-600">
                {nextAnniversary ? t('home.nextAnniversary', { days: nextAnniversary.dday, title: nextAnniversary.title }) : t('home.noAnniversary')}
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto px-4 py-4 no-scrollbar">
        <StoryBubble label={currentUserRoleLabel} imageUrl={currentUserAvatar} onClick={() => openStoryMessage('me')} />
        <StoryBubble label={partnerRoleLabel} imageUrl={partnerAvatar} onClick={() => openStoryMessage('partner')} />
        <StoryBubble label={t('role.baby')} imageUrl={DEMO_BABY.photoURL} onClick={() => openStoryMessage('baby')} />
        <button type="button" onClick={() => setExpandedOneLiner((prev) => !prev)} className="min-w-[74px] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="mt-2 text-[11px] font-medium text-slate-600">{t('home.oneLiner.button')}</div>
        </button>
      </div>

      <div className="px-4 pb-4">
        <Card className="rounded-[28px] border border-rose-100/70 bg-white shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-extrabold text-slate-900">{t('home.oneLiner.title')}</div>
                <div className="mt-1 text-[12px] text-slate-500">{t('home.oneLiner.subtitle')}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedOneLiner(!expandedOneLiner)}
                className="text-rose-400 hover:text-rose-600"
              >
                {expandedOneLiner ? t('common.collapse') : t('common.expand')}
              </Button>
            </div>
            {expandedOneLiner && (
              <>
                <div className="mt-3 rounded-3xl bg-rose-50 px-4 py-3 text-[14px] font-semibold leading-relaxed text-slate-800">
                  "{myLatestOneLiner || t('home.oneLiner.noneMine')}"
                </div>
                <div className="mt-3 space-y-3">
                  <Input
                    value={oneLinerDraft}
                    onChange={(e) => setOneLinerDraft(e.target.value)}
                    placeholder={t('home.oneLiner.placeholder')}
                    className="rounded-full"
                  />
                </div>
                <div className="mt-3">
                  <Button onClick={sendOneLiner} className="w-full rounded-full bg-rose-500 hover:bg-rose-600">
                    <Send className="mr-2 h-4 w-4" />
                    {t('home.oneLiner.send')}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="divide-y divide-slate-100/80 rounded-t-[28px] bg-white">
        {loading ? (
          <div className="text-center py-20">
             <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="mx-auto mb-4 w-12 h-12"
            >
              <svg viewBox="0 0 24 24" className="w-full h-full text-pink-400">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeDashoffset="31.4">
                  <animate attributeName="stroke-dashoffset" values="31.4;0" dur="1s" repeatCount="indefinite" />
                </circle>
              </svg>
            </motion.div>
            <p className="text-pink-500 font-medium">{t('home.loadingEntries')}</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 px-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mb-6"
            >
              <svg width="120" height="120" viewBox="0 0 100 100" className="mx-auto">
                <circle cx="35" cy="35" r="12" fill="#FF69B4" />
                <circle cx="65" cy="35" r="12" fill="#FF1493" />
                <path d="M25 55 Q35 45 45 55 Q55 65 65 55 Q75 45 85 55" stroke="#FF69B4" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="30" cy="30" r="2" fill="#FFF" />
                <circle cx="40" cy="30" r="2" fill="#FFF" />
                <circle cx="60" cy="30" r="2" fill="#FFF" />
                <circle cx="70" cy="30" r="2" fill="#FFF" />
                <text x="50" y="85" textAnchor="middle" fontSize="14" fill="#FF69B4" fontWeight="bold">💕</text>
              </svg>
            </motion.div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">{t('home.emptyTitle')}</h3>
            <p className="text-slate-500 mb-6">{t('home.emptySubtitle')}</p>
            <Button 
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 rounded-full px-6 py-2"
            >
              {t('home.firstEntry')}
            </Button>
          </div>
        ) : (
          entries.map((entry) => (
            <DiaryCard 
              key={entry.id} 
              entry={entry} 
              isAuthor={entry.authorUid === user?.uid}
              onFavorite={() => toggleFavorite(entry)}
              onDelete={() => deleteEntry(entry.id)}
            />
          ))
        )}
      </div>

      <CreateEntry
        open={showCreate}
        onOpenChange={setShowCreate}
        onEntryCreated={(entry) => setEntries((prev) => [entry, ...prev])}
      />

      <Dialog open={showAnniversaries} onOpenChange={setShowAnniversaries}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base font-extrabold text-slate-900">{t('home.anniversaries.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-2">
              {anniversaries.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  {t('home.anniversaries.empty')}
                </div>
              ) : (
                anniversaries
                  .slice()
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((item) => (
                    <div key={item.id} className="rounded-3xl border border-slate-100 px-4 py-3">
                      <div className="text-sm font-bold text-slate-900">{item.title}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {format(parseISO(item.date), language === 'id' ? 'd MMMM yyyy' : 'yyyy년 M월 d일', { locale: dateLocale })}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <div className="rounded-3xl bg-rose-50 p-4">
              <div className="text-sm font-extrabold text-slate-900">{t('home.anniversaries.addTitle')}</div>
              <div className="mt-3 space-y-2">
                <Input
                  value={newAnniversaryTitle}
                  onChange={(e) => setNewAnniversaryTitle(e.target.value)}
                  placeholder={t('home.anniversaries.addPlaceholder')}
                  className="rounded-2xl bg-white"
                />
                <Input
                  type="date"
                  value={newAnniversaryDate}
                  onChange={(e) => setNewAnniversaryDate(e.target.value)}
                  className="rounded-2xl bg-white"
                />
                <Button onClick={addAnniversary} className="w-full rounded-full bg-slate-900 hover:bg-slate-800">
                  {t('home.anniversaries.add')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showStoryMessage} onOpenChange={setShowStoryMessage}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none p-0 overflow-hidden">
          <DialogHeader className="border-b px-5 py-4">
            <DialogTitle className="text-base font-extrabold text-slate-900">{storyDialogTitle}</DialogTitle>
          </DialogHeader>
          <div className="p-5">
            <div className="rounded-3xl bg-rose-50 px-4 py-4 text-[15px] font-semibold leading-relaxed text-slate-800">
              "{storyDialogMessage}"
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DiaryCard({ entry, isAuthor, onFavorite, onDelete }: { entry: DiaryEntry, isAuthor: boolean, onFavorite: () => void | Promise<void>, onDelete: () => void | Promise<void>, key?: React.Key }) {
  const { profile } = useAuth();
  const { partner } = useCouple();
  const { t, dateLocale, language } = useI18n();
  const isCurrentUserWife = getDisplayRole(profile?.displayName, profile?.email) === 'wife';
  const authorDisplayName = isAuthor ? t('common.me') : isCurrentUserWife ? t('role.husband') : t('role.wifeCasual');
  const authorAvatar = isAuthor
    ? getRoleAvatar(isCurrentUserWife ? 'wife' : 'husband')
    : getRoleAvatar(isCurrentUserWife ? 'husband' : 'wife');
  const authorFallback = isAuthor
    ? (profile?.displayName?.[0] || t('common.me')[0])
    : (partner?.displayName?.[0] || authorDisplayName[0]);

  return (
    <div className="bg-white px-4 py-4">
      <div className="rounded-[28px] border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>{authorFallback}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-semibold text-slate-900">{authorDisplayName}</span>
        </div>
        <button onClick={onDelete} className="text-slate-400 hover:text-slate-600">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {entry.photoURLs && entry.photoURLs.length > 0 ? (
        <div className="relative overflow-hidden">
          <div
            className="flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory no-scrollbar"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          >
            {entry.photoURLs.map((url, index) => (
              <div key={index} className="flex h-[420px] w-full flex-shrink-0 items-center justify-center bg-slate-50 snap-center">
                {url.includes('.mp4') || url.includes('.webm') ? (
                  <video
                    src={url}
                    controls
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <img
                    src={url}
                    alt={`Diary entry ${index + 1}`}
                    className="h-full w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            ))}
          </div>
          {entry.photoURLs.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {entry.photoURLs.map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-white/50"></div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-slate-50 flex items-center justify-center text-5xl">
          {entry.mood}
        </div>
      )}

      <div className="px-4 pb-4 pt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <motion.button 
              onClick={onFavorite} 
              whileTap={{ scale: 1.2 }}
              className="transition-colors"
            >
              <Heart className={`h-6 w-6 ${entry.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600 hover:text-rose-400'}`} />
            </motion.button>
            <MessageCircle className="h-6 w-6 text-slate-600" />
            <Send className="h-5 w-5 text-slate-600" />
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {format(parseISO(entry.date), language === 'id' ? 'd MMM HH:mm' : 'M월 d일 a h:mm', { locale: dateLocale })}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-sm leading-tight">
            <span className="font-semibold mr-2">{authorDisplayName}</span>
            {entry.content}
          </p>
          
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map(tag => (
                <span key={tag} className="text-sm text-sky-600">#{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

function StoryBubble({ label, imageUrl, onClick }: { label: string; imageUrl?: string | null; onClick?: () => void }) {
  const avatarSrc = imageUrl || getDefaultAvatar(label);

  return (
    <button type="button" onClick={onClick} className="min-w-[74px] text-center">
      <div className="mx-auto rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-fuchsia-500 p-[2px]">
        <div className="rounded-full bg-white p-[2px]">
          <Avatar className="h-16 w-16">
            <AvatarImage src={avatarSrc} />
            <AvatarFallback>{label[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>
      <div className="mt-2 text-[11px] font-medium text-slate-600">{label}</div>
    </button>
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

function mapRowToAnniversary(r: AnniversaryRow): AnniversaryItem {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
  };
}

function getLatestLoveNoteText(
  rows: LoveNoteRow[],
  predicate: (row: LoveNoteRow) => boolean
) {
  return rows
    .filter(predicate)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.text;
}
