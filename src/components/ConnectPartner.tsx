import React, { useState } from 'react';
import { useCouple } from './CoupleProvider';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, UserPlus, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { localizeErrorMessage, useI18n } from '../lib/i18n';

export default function ConnectPartner() {
  const { connectPartner, createCouple } = useCouple();
  const { logout, profile } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      await connectPartner(email);
      toast.success(t('connect.connected'));
    } catch (error: any) {
      toast.error(localizeErrorMessage(error, t));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      await createCouple();
      toast.success(t('connect.created'));
    } catch (error: any) {
      toast.error(localizeErrorMessage(error, t));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-pink-50 p-6">
      <Card className="w-full max-w-md border-none shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <Heart className="h-8 w-8 text-pink-500 fill-pink-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">{t('connect.title')}</CardTitle>
          <CardDescription>
            {t('connect.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-5 rounded-2xl border border-slate-100 bg-white px-4 py-3">
            <div className="text-sm font-bold text-slate-900">{t('connect.soloTitle')}</div>
            <div className="mt-1 text-[12px] text-slate-600">
              {t('connect.soloSubtitle')}
            </div>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="mt-3 w-full rounded-full bg-emerald-600 hover:bg-emerald-700"
            >
              {creating ? t('connect.creatingSpace') : t('connect.createSpace')}
            </Button>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">{t('connect.partnerEmail')}</label>
              <Input
                type="email"
                placeholder="partner@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-pink-200 focus-visible:ring-pink-500"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-pink-500 hover:bg-pink-600">
              {loading ? t('connect.connecting') : t('connect.request')}
            </Button>
          </form>

          <div className="mt-8 border-t pt-6 text-center">
            <p className="mb-4 text-sm text-slate-500">{t('connect.myEmail')}: {profile?.email}</p>
            <Button variant="ghost" onClick={logout} className="text-slate-400 hover:text-rose-500">
              <LogOut className="mr-2 h-4 w-4" /> {t('connect.logout')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 flex flex-col items-center gap-4 text-center text-slate-400">
        <UserPlus className="h-12 w-12 opacity-20" />
        <p className="text-sm">{t('connect.requiresSignup')}</p>
      </div>
    </div>
  );
}
