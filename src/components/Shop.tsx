import React, { useMemo, useState, useEffect } from 'react';
import { useCouple } from './CoupleProvider';
import { useAuth } from './AuthProvider';
import { Coupon } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Gift, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { createCoupon as createCouponRow, listCoupons, refundCoupon as refundCouponRow, scheduleUseCoupon } from '../lib/data/coupons';
import type { CouponRow } from '../lib/data/types';
import { localizeErrorMessage, useI18n } from '../lib/i18n';

export default function Shop() {
  const { couple, partner } = useCouple();
  const { user } = useAuth();
  const { t, dateLocale, language } = useI18n();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [useOpen, setUseOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [scheduledForInput, setScheduledForInput] = useState('');
  const isDemoMode = user?.uid === 'demo-user' || user?.uid === 'partner-user';
  const templates = useMemo(
    () => [
      { title: t('template.massage'), description: t('template.massageDesc') },
      { title: t('template.dishes'), description: t('template.dishesDesc') },
      { title: t('template.menu'), description: t('template.menuDesc') },
      { title: t('template.errand'), description: t('template.errandDesc') },
    ],
    [t]
  );

  useEffect(() => {
    if (!couple) return;

    if (isDemoMode && couple.id === 'demo-couple') {
      const mockCoupons: Coupon[] = [
        {
          id: 'c1',
          title: t('template.massage'),
          description: t('template.massageDesc'),
          status: 'available',
          senderUid: 'partner-user',
          receiverUid: 'demo-user',
          message: t('demo.couponMessage1'),
          createdAt: new Date().toISOString()
        },
        {
          id: 'c2',
          title: t('template.dishes'),
          description: t('template.dishesDesc'),
          status: 'used',
          senderUid: 'demo-user',
          receiverUid: 'partner-user',
          message: t('demo.couponMessage2'),
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
          usedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString()
        }
      ];
      setCoupons(mockCoupons);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const rows = await listCoupons(couple.id);
        if (cancelled) return;
        setCoupons(rows.map(mapRowToCoupon));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [couple, isDemoMode, t]);

  const openUseDialog = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    const defaultDt = new Date(Date.now() + 1000 * 60 * 30);
    // datetime-local expects "YYYY-MM-DDTHH:mm"
    const pad = (n: number) => String(n).padStart(2, '0');
    const v = `${defaultDt.getFullYear()}-${pad(defaultDt.getMonth() + 1)}-${pad(defaultDt.getDate())}T${pad(defaultDt.getHours())}:${pad(defaultDt.getMinutes())}`;
    setScheduledForInput(v);
    setUseOpen(true);
  };

  const markUsed = async (coupon: Coupon, scheduledForIso: string) => {
    if (!couple) return;
    if (!coupon?.id) return;
    try {
      if (isDemoMode && couple.id === 'demo-couple') {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id
              ? { ...c, status: 'used', scheduledFor: scheduledForIso, usedAt: new Date().toISOString() }
              : c
          )
        );
      } else {
        const updated = await scheduleUseCoupon({ id: coupon.id, scheduled_for: scheduledForIso });
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? mapRowToCoupon(updated) : c)));
      }
      toast.success(t('shop.usedSuccess'));
    } catch (error) {
      toast.error(t('shop.usedFailed'));
    }
  };

  const refundCoupon = async (coupon: Coupon) => {
    if (!couple) return;
    try {
      if (isDemoMode && couple.id === 'demo-couple') {
        setCoupons((prev) =>
          prev.map((c) =>
            c.id === coupon.id ? { ...c, status: 'available', scheduledFor: undefined, usedAt: undefined } : c
          )
        );
      } else {
        const updated = await refundCouponRow(coupon.id);
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? mapRowToCoupon(updated) : c)));
      }
      toast.success(t('shop.refunded'));
    } catch (error) {
      toast.error(t('shop.refundFailed'));
    }
  };

  const receivedCoupons = coupons.filter(c => c.receiverUid === user?.uid);
  const sentCoupons = coupons.filter(c => c.senderUid === user?.uid);

  const receivedAvailableCount = useMemo(
    () => receivedCoupons.filter((c) => c.status === 'available').length,
    [receivedCoupons]
  );
  const sentWaitingCount = useMemo(
    () => sentCoupons.filter((c) => c.status !== 'used').length,
    [sentCoupons]
  );

  const handleCouponCreated = (coupon: Coupon) => {
    setCoupons((prev) => [coupon, ...prev.filter((item) => item.id !== coupon.id)]);
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t('shop.title')}</h2>
          <p className="text-[11px] text-slate-500">{t('shop.subtitle')}</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} size="sm" className="bg-instagram-blue hover:bg-blue-600 h-8 text-xs font-bold">
          {t('shop.gift')}
        </Button>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mx-4 mt-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 h-auto">
          <TabsTrigger
            value="received"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600"
          >
            {t('shop.received')}
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
              {receivedAvailableCount}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="sent"
            className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-slate-900 text-slate-600"
          >
            {t('shop.sent')}
            <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
              {sentWaitingCount}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-3 px-4 pb-6 space-y-3">
          {receivedCoupons.length === 0 ? (
            <EmptyState message={t('shop.emptyReceived')} />
          ) : (
            receivedCoupons.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                isReceiver
                onUse={() => openUseDialog(coupon)}
                t={t}
                dateLocale={dateLocale}
                language={language}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-3 px-4 pb-6 space-y-3">
          {sentCoupons.length === 0 ? (
            <EmptyState message={t('shop.emptySent')} />
          ) : (
            sentCoupons.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                isReceiver={false}
                onRefund={coupon.status === 'used' ? () => refundCoupon(coupon) : undefined}
                t={t}
                dateLocale={dateLocale}
                language={language}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateCouponDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} onCreated={handleCouponCreated} />

      <Dialog open={useOpen} onOpenChange={setUseOpen}>
        <DialogContent className="sm:max-w-md rounded-t-3xl sm:rounded-3xl border-none p-0 overflow-hidden">
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="text-base font-extrabold text-slate-900">{t('shop.scheduleTitle')}</DialogTitle>
          </DialogHeader>
          <div className="p-4 space-y-4">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
              <div className="text-[12px] font-bold text-slate-900">{selectedCoupon?.title}</div>
              <div className="mt-0.5 text-[12px] text-slate-600 line-clamp-2">{selectedCoupon?.description}</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('common.dateTime')}</div>
              <Input
                type="datetime-local"
                value={scheduledForInput}
                onChange={(e) => setScheduledForInput(e.target.value)}
                className="rounded-2xl bg-white"
              />
              <div className="text-[11px] text-slate-500">
                {t('shop.scheduleHint')}
              </div>
            </div>
          </div>

          <div className="p-4 pt-0 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setUseOpen(false)}
              className="flex-1 rounded-full bg-slate-100 hover:bg-slate-200"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (!selectedCoupon) return;
                if (!scheduledForInput) {
                  toast.error(t('shop.selectDateTime'));
                  return;
                }
                const iso = new Date(scheduledForInput).toISOString();
                await markUsed(selectedCoupon, iso);
                setUseOpen(false);
              }}
              className="flex-1 rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              {t('shop.use')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CouponCard({
  coupon,
  onUse,
  onRefund,
  isReceiver,
  t,
  dateLocale,
  language,
}: {
  coupon: Coupon;
  onUse?: () => void | Promise<void>;
  onRefund?: () => void | Promise<void>;
  isReceiver: boolean;
  t: (key: string, vars?: Record<string, string | number | null | undefined>) => string;
  dateLocale: Locale;
  language: 'ko' | 'id';
  key?: React.Key;
}) {
  const isUsed = coupon.status === 'used';
  const scheduledLabel = coupon.scheduledFor
    ? format(parseISO(coupon.scheduledFor), language === 'id' ? 'd MMM (eee) HH:mm' : 'M/d(eee) a h:mm', { locale: dateLocale })
    : null;

  return (
    <Card className={`rounded-3xl border border-slate-100 shadow-sm overflow-hidden ${isUsed ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-4 items-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-50 to-emerald-50 flex items-center justify-center text-2xl border border-slate-100">
        🎟️
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-slate-900">{coupon.title}</span>
          {isUsed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold uppercase">
              {t('shop.used')}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 line-clamp-1">{coupon.description}</p>
        {coupon.message && (
          <p className="text-[10px] text-rose-400 italic mt-1">"{coupon.message}"</p>
        )}
        {scheduledLabel && (
          <div className="mt-2 text-[11px] font-semibold text-emerald-700">
            {t('shop.scheduleLabel')}: {scheduledLabel}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        {!isUsed && isReceiver && (
          <Button onClick={onUse} size="sm" className="rounded-full bg-instagram-blue hover:bg-blue-600 h-8 text-xs font-bold">
            {t('shop.useAction')}
          </Button>
        )}
        {!isUsed && !isReceiver && (
          <span className="text-[10px] text-rose-400 font-bold">{t('shop.waiting')}</span>
        )}
        {isUsed && !isReceiver && onRefund && (
          <Button
            onClick={onRefund}
            size="sm"
            variant="secondary"
            className="rounded-full h-8 text-xs font-bold bg-slate-100 hover:bg-slate-200"
          >
            {t('shop.refund')}
          </Button>
        )}
      </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-100">
      <Gift className="h-12 w-12 text-slate-100 mx-auto mb-4" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

function CreateCouponDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onCreated: (coupon: Coupon) => void,
}) {
  const { user } = useAuth();
  const { couple, partner } = useCouple();
  const { t } = useI18n();
  const templates = useMemo(
    () => [
      { title: t('template.massage'), description: t('template.massageDesc') },
      { title: t('template.dishes'), description: t('template.dishesDesc') },
      { title: t('template.menu'), description: t('template.menuDesc') },
      { title: t('template.errand'), description: t('template.errandDesc') },
    ],
    [t]
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const isDemoMode = user?.uid === 'demo-user' || user?.uid === 'partner-user';

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error(t('shop.titleRequired'));
      return;
    }
    if (!description.trim()) {
      toast.error(t('shop.descriptionRequired'));
      return;
    }
    if (!couple || !user) {
      toast.error(t('shop.authNotReady'));
      return;
    }
    if (!partner) {
      toast.error(t('shop.partnerMissing'));
      return;
    }

    setLoading(true);
    try {
      let createdCoupon: Coupon;
      if (!(isDemoMode && couple.id === 'demo-couple')) {
        const createdRow = await createCouponRow({
          couple_id: couple.id,
          title: title.trim(),
          description: description.trim(),
          message: message || null,
          sender_id: user.uid,
          receiver_id: partner.uid,
          status: 'available',
        });
        createdCoupon = mapRowToCoupon(createdRow);
      } else {
        createdCoupon = {
          id: `demo-coupon-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          status: 'available',
          senderUid: user.uid,
          receiverUid: partner.uid,
          message: message.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
      }
      onCreated(createdCoupon);
      toast.success(t('shop.giftSent'));
      setTitle('');
      setDescription('');
      setMessage('');
      onOpenChange(false);
    } catch (error) {
      toast.error(localizeErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (template: { title: string; description: string }) => {
    setTitle(template.title);
    setDescription(template.description);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-t-3xl sm:rounded-3xl border-none p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-slate-800 py-4">{t('shop.sendGift')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 px-4 pb-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('shop.template')}</label>
            <div className="grid grid-cols-2 gap-2">
              {templates.map(template => (
                <button
                  key={template.title}
                  onClick={() => applyTemplate(template)}
                  className="text-left p-2 rounded-lg border border-slate-100 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                >
                  <p className="text-xs font-bold text-slate-700">{template.title}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('shop.createGift')}</div>
            <Input 
              placeholder={t('shop.titlePlaceholder')} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="border-none bg-slate-50 focus-visible:ring-rose-400"
            />
            <Input 
              placeholder={t('shop.descriptionPlaceholder')} 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              className="border-none bg-slate-50 focus-visible:ring-rose-400"
            />
            <Textarea 
              placeholder={t('shop.messagePlaceholder')} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)}
              className="border-none bg-slate-50 focus-visible:ring-rose-400 min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 px-4 pb-4">
          <Button variant="secondary" onClick={() => onOpenChange(false)} className="flex-1 rounded-full bg-slate-100 hover:bg-slate-200">{t('common.cancel')}</Button>
          <Button 
            onClick={handleSend} 
            disabled={loading || !title} 
            className="flex-1 rounded-full bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100"
          >
            <Send className="h-4 w-4 mr-2" /> {loading ? t('shop.sending') : t('shop.gift')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function mapRowToCoupon(r: CouponRow): Coupon {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    status: r.status,
    senderUid: r.sender_id,
    receiverUid: r.receiver_id,
    message: r.message ?? undefined,
    createdAt: r.created_at,
    scheduledFor: r.scheduled_for ?? undefined,
    usedAt: r.used_at ?? undefined
  };
}
