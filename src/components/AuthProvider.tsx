import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { getMyProfile, upsertMyProfile } from '../lib/data/profiles';
import { UserProfile } from '../types';
import { toast } from 'sonner';
import { localizeErrorMessage, useI18n } from '../lib/i18n';

interface AuthContextType {
  user: { uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null;
  profile: UserProfile | null;
  loading: boolean;
  isSupabaseConfigured: boolean;
  showLogin: boolean;
  loginWithPassword: (username: string, password: string) => Promise<void>;
  demoLogin: (username: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const REQUEST_TIMEOUT_MS = 12000;
const DEFAULT_DEMO_USERNAME = 'duodiary';
const DEMO_HUSBAND_PHOTO_URL = '/avatars/husband.png';

async function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

const DEMO_ACCOUNTS: Record<string, { uid: string; displayName: string; photoURL: string; coupleId: string }> = {
  gunwoo1004: {
    uid: 'demo-user',
    displayName: '정건우',
    photoURL: DEMO_HUSBAND_PHOTO_URL,
    coupleId: 'demo-couple'
  },
  intan1717: {
    uid: 'partner-user',
    displayName: '정하은',
    photoURL: '/avatars/wife.png',
    coupleId: 'demo-couple'
  }
};

function buildDemoAuthState(username = DEFAULT_DEMO_USERNAME) {
  const normalizedUsername = (username ?? '').trim().toLowerCase() || DEFAULT_DEMO_USERNAME;
  const accountConfig = DEMO_ACCOUNTS[normalizedUsername];
  const email = `${normalizedUsername}@duodiary.local`;
  
  const mockUser = {
    uid: accountConfig?.uid || 'demo-user',
    displayName: accountConfig?.displayName || '정건우',
    email,
    photoURL: accountConfig?.photoURL || DEMO_HUSBAND_PHOTO_URL,
  };

  const mockProfile: UserProfile = {
    uid: mockUser.uid,
    displayName: mockUser.displayName,
    email: mockUser.email,
    photoURL: mockUser.photoURL,
    coupleId: accountConfig?.coupleId || 'demo-couple',
  };

  return { mockUser, mockProfile };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const [user, setUser] = useState<{ uid: string; displayName: string | null; email: string | null; photoURL: string | null } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  const isSupabaseConfigured = useMemo(() => {
    return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  }, []);

  const isInvalidJwtError = (err: unknown) =>
    String((err as any)?.message ?? err ?? '').toLowerCase().includes('invalid jwt');

  const clearAuthSession = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const applyDemoSession = (username?: string) => {
    const { mockUser, mockProfile } = buildDemoAuthState(username);
    setSession(null);
    setUser(mockUser);
    setProfile(mockProfile);
    setShowLogin(false);
  };

  const resetBrokenSession = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    } finally {
      if (isSupabaseConfigured) {
        clearAuthSession();
        setShowLogin(true);
      } else {
        applyDemoSession();
      }
    }
  };


  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Always fall back to the in-app demo so the main screens remain accessible.
      applyDemoSession();
      setLoading(false);
      return;
    }

    let mounted = true;

    const boot = async () => {
      try {
        const { data, error } = await withTimeout(
          supabase.auth.getSession(),
          REQUEST_TIMEOUT_MS,
          t('error.sessionFetchTimeout')
        );
        if (error) throw error;
        if (!mounted) return;
        setSession(data.session ?? null);

        if (!data.session?.user) {
          clearAuthSession();
          setShowLogin(true);
          setLoading(false);
          return;
        }

        const u = data.session.user;
        setUser({
          uid: u.id,
          displayName: (u.user_metadata?.full_name as string | undefined) ?? null,
          email: u.email ?? null,
          photoURL: (u.user_metadata?.avatar_url as string | undefined) ?? null
        });

        // Ensure profile exists, then read it.
        await withTimeout(
          upsertMyProfile({}),
          REQUEST_TIMEOUT_MS,
          t('error.profileSyncTimeout')
        );
        const p = await withTimeout(
          getMyProfile(),
          REQUEST_TIMEOUT_MS,
          t('error.profileFetchTimeout')
        );
        setProfile(
          p
            ? {
                uid: p.id,
                displayName: p.display_name,
                email: p.email,
                photoURL: p.photo_url ?? null,
                phoneId: (p as any).phone_id ?? null,
                onboardingCompleted: Boolean((p as any).onboarding_completed)
              }
            : null
        );
      } catch (e: any) {
        if (isInvalidJwtError(e)) {
          await resetBrokenSession();
          toast.error(t('error.sessionExpired'));
          return;
        }
        const msg = String(e?.message ?? e ?? '');
        toast.error(msg ? `${t('error.sessionLoadFailed')}: ${localizeErrorMessage(msg, t)}` : t('error.sessionLoadFailed'));
        if (isSupabaseConfigured) {
          clearAuthSession();
          setShowLogin(true);
        } else {
          applyDemoSession();
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void boot();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setLoading(true);
      try {
        if (!newSession?.user) {
          clearAuthSession();
          setShowLogin(true);
          return;
        }

        const u = newSession.user;
        setUser({
          uid: u.id,
          displayName: (u.user_metadata?.full_name as string | undefined) ?? null,
          email: u.email ?? null,
          photoURL: (u.user_metadata?.avatar_url as string | undefined) ?? null
        });

        await withTimeout(
          upsertMyProfile({}),
          REQUEST_TIMEOUT_MS,
          t('error.profileSyncTimeout')
        );
        const p = await withTimeout(
          getMyProfile(),
          REQUEST_TIMEOUT_MS,
          t('error.profileFetchTimeout')
        );
        setProfile(
          p
            ? {
                uid: p.id,
                displayName: p.display_name,
                email: p.email,
                photoURL: p.photo_url ?? null,
                phoneId: (p as any).phone_id ?? null,
                onboardingCompleted: Boolean((p as any).onboarding_completed)
              }
            : null
        );
      } catch (e: any) {
        if (isInvalidJwtError(e)) {
          await resetBrokenSession();
          toast.error(t('error.sessionExpired'));
          return;
        }
        const msg = String(e?.message ?? e ?? '');
        toast.error(msg ? `${t('error.authFailed')}: ${localizeErrorMessage(msg, t)}` : t('error.authFailed'));
        clearAuthSession();
        setShowLogin(true);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [isSupabaseConfigured, t]);

  const DEMO_USER_EMAILS: Record<string, string> = {
    gunwoo1004: 'gunwoo1004@duodiary.local',
    intan1717: 'intan1717@duodiary.local'
  };

  const validateDemoAccount = (normalizedUsername: string): boolean => {
    return Object.keys(DEMO_ACCOUNTS).includes(normalizedUsername);
  };

  const loginWithPassword = async (username: string, password: string) => {
    setShowLogin(false);
    const normalizedUsername = (username ?? '').trim().toLowerCase();
    if (!normalizedUsername) throw new Error(t('error.usernameRequired'));
    if (!password) throw new Error(t('error.passwordRequired'));

    if (!validateDemoAccount(normalizedUsername)) {
      throw new Error(t('error.invalidDemoAccount'));
    }

    const email = DEMO_USER_EMAILS[normalizedUsername];

    if (!isSupabaseConfigured) {
      demoLogin(normalizedUsername);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data?.session) throw new Error(t('error.loginFailed'));
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? '');
      if (msg.includes('Invalid login credentials')) {
        throw new Error(t('error.invalidCredentials'));
      }
      throw e;
    }
  };

  const demoLogin = (username: string) => {
    applyDemoSession(username);
    setShowLogin(false);
  };

  const logout = async () => {
    if (!isSupabaseConfigured) {
      clearAuthSession();
      setShowLogin(true);
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    clearAuthSession();
    setShowLogin(true);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isSupabaseConfigured, showLogin, loginWithPassword, demoLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
