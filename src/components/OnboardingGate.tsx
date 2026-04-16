import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { localizeErrorMessage, useI18n } from '../lib/i18n';

const AVAILABLE_USERNAMES = ['gunwoo1004', 'intan1717'] as const;

export default function OnboardingGate() {
  const { isSupabaseConfigured, loginWithPassword, demoLogin } = useAuth();
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizedUsername = username.trim().toLowerCase();
  const isKnownUser = AVAILABLE_USERNAMES.includes(normalizedUsername as typeof AVAILABLE_USERNAMES[number]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        await loginWithPassword(normalizedUsername, password);
      } else {
        demoLogin(normalizedUsername || 'gunwoo1004');
      }
      toast.success(t('auth.loginSuccess'));
    } catch (error: any) {
      toast.error(localizeErrorMessage(error, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-emerald-50 flex items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-3xl border-none shadow-2xl bg-white/85 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-4xl font-extrabold tracking-tight text-slate-900">💌 DuoDiary</div>
            <div className="mt-3 text-[13px] text-slate-600">Sign in</div>
          </div>

          <div className="mt-6 space-y-4">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Account ID"
              className="rounded-2xl h-11"
              autoCapitalize="none"
            />
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="rounded-2xl h-11"
            />
          </div>

          <div className="mt-6 grid gap-3">
            <Button
              className="w-full rounded-full bg-slate-900 hover:bg-slate-800"
              disabled={submitting || !normalizedUsername || !password || !isKnownUser}
              onClick={handleSubmit}
            >
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
