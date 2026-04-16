import React, { useEffect, useState } from 'react';
import { Dialog as ShadcnDialog, DialogContent as ShadcnDialogContent, DialogHeader as ShadcnDialogHeader, DialogTitle as ShadcnDialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Smile, ImageIcon, X, Hash } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from './AuthProvider';
import { useCouple } from './CoupleProvider';
import { DiaryEntry, Mood } from '../types';
import { toast } from 'sonner';
import { createDiaryEntry } from '../lib/data/diary';
import { uploadDiaryMediaBatch } from '../lib/data/storage';
import { localizeErrorMessage, useI18n } from '../lib/i18n';

const MOODS: Mood[] = ['😀', '😐', '😢', '😡', '😍', '😴', '🥳'];

export default function CreateEntry({
  open,
  onOpenChange,
  onEntryCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEntryCreated?: (entry: DiaryEntry) => void;
}) {
  const { user } = useAuth();
  const { couple } = useCouple();
  const { t } = useI18n();
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('😀');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!content.trim() || !couple || !user) return;

    setLoading(true);
    try {
      let photoUrls: string[] = [];

      if (couple.id === 'demo-couple') {
        // Mock success for demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        toast.success(t('create.savedDemo'));
      } else {
        // Upload files to Storage if any
        if (photoFiles.length > 0) {
          toast.loading(t('create.uploading'));
          try {
            photoUrls = await uploadDiaryMediaBatch(couple.id, photoFiles);
          } catch (uploadErr: any) {
            toast.dismiss();
            toast.error(localizeErrorMessage(uploadErr, t));
            setLoading(false);
            return;
          }
          toast.dismiss();
        }

        // Create diary entry with photo URLs
        const row = await createDiaryEntry({
          couple_id: couple.id,
          author_id: user.uid,
          content: content.trim(),
          mood,
          tags,
          is_favorite: false,
          photo_urls: photoUrls,
          entry_at: new Date().toISOString(),
        });

        const newEntry: DiaryEntry = {
          id: row.id,
          date: row.entry_at,
          content: row.content,
          photoURLs: row.photo_urls?.length ? row.photo_urls : undefined,
          mood: row.mood,
          tags: row.tags ?? [],
          isFavorite: row.is_favorite,
          authorUid: row.author_id,
        };

        onEntryCreated?.(newEntry);
        toast.success(t('create.saved'));
      }
      
      if (couple.id === 'demo-couple') {
        const demoEntry: DiaryEntry = {
          id: `demo-${Date.now()}`,
          date: new Date().toISOString(),
          content: content.trim(),
          photoURLs: photoUrls.length ? photoUrls : undefined,
          mood,
          tags,
          isFavorite: false,
          authorUid: user.uid,
        };
        onEntryCreated?.(demoEntry);
      }

      setContent('');
      setMood('😀');
      setTags([]);
      setPhotoFiles([]);
      setPhotoPreviews([]);
      onOpenChange(false);
    } catch (error) {
      toast.error(t('create.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const urls = photoFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, [photoFiles]);

  return (
    <ShadcnDialog open={open} onOpenChange={onOpenChange}>
      <ShadcnDialogContent className="sm:max-w-md rounded-t-3xl sm:rounded-3xl border-none p-0 overflow-hidden">
        <ShadcnDialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="text-slate-400 h-8 px-2">{t('common.cancel')}</Button>
          <ShadcnDialogTitle className="text-base font-bold">{t('create.title')}</ShadcnDialogTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSubmit} 
            disabled={loading || !content.trim()}
            className="text-instagram-blue font-bold h-8 px-2"
          >
            {loading ? t('create.sharing') : t('create.share')}
          </Button>
        </ShadcnDialogHeader>
        
        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.photoURL || ''} />
              <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <Textarea
              placeholder={t('create.contentPlaceholder')}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 border-none focus-visible:ring-0 text-sm resize-none min-h-[120px] p-0"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">{t('create.mood')}</span>
              <div className="flex gap-2">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMood(m)}
                    className={`text-2xl transition-transform ${mood === m ? 'scale-125 drop-shadow-md' : 'grayscale opacity-30'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 cursor-pointer">
                <div className="flex items-center gap-2">
                  <ImageIcon className="text-slate-400 h-5 w-5" />
                  <span>{photoFiles.length ? t('create.selectedFiles', { count: photoFiles.length }) : t('create.selectMedia')}</span>
                </div>
                <span className="text-xs text-slate-500">{t('create.pick')}</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => setPhotoFiles(Array.from(e.target.files || []))}
                />
              </label>

              {photoPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviews.map((src, idx) => (
                    <div key={idx} className="relative flex h-20 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                      {photoFiles[idx]?.type.startsWith('video/') ? (
                        <video src={src} className="h-full w-full object-contain" muted />
                      ) : (
                        <img src={src} alt={`preview ${idx + 1}`} className="h-full w-full object-contain" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="text-xs text-instagram-blue font-medium flex items-center gap-1">
                      #{tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg">
                  <Hash className="text-slate-400 h-5 w-5" />
                  <Input
                    placeholder={t('create.tagPlaceholder')}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="border-none bg-transparent h-7 focus-visible:ring-0 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ShadcnDialogContent>
    </ShadcnDialog>
  );
}
