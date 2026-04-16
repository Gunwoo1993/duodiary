import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { Couple, UserProfile } from '../types';
import { createMyCouple, getMyCouple, getPartnerProfile, updateAnniversaryDate } from '../lib/data/couples';
import { getProfileByEmail } from '../lib/data/profiles';

interface CoupleContextType {
  couple: Couple | null;
  partner: UserProfile | null;
  loading: boolean;
  connectPartner: (partnerEmail: string) => Promise<void>;
  updateAnniversary: (date: string) => Promise<void>;
  createCouple: (params?: { anniversaryDate?: string }) => Promise<void>;
}

const CoupleContext = createContext<CoupleContextType | undefined>(undefined);
const REQUEST_TIMEOUT_MS = 12000;
const DEMO_WIFE_PHOTO_URL = '/avatars/wife.png';
const DEMO_AVATAR_BY_EMAIL: Record<string, string> = {
  'gunwoo1004@duodiary.local': '/avatars/husband.png',
  'intan1717@duodiary.local': '/avatars/wife.png'
};
const FAMILY_COUPLE_FALLBACK = {
  id: 'aee6b841-1988-47f8-9a60-91c704319bf4',
  anniversaryDate: '2023-05-10',
};
const FAMILY_ACCOUNT_BY_EMAIL: Record<string, { uid: string; displayName: string; photoURL: string; counterpartEmail: string }> = {
  'gunwoo1004@duodiary.local': {
    uid: '3f061ed2-64ec-46cc-96a6-4942fe99da5d',
    displayName: '정건우',
    photoURL: '/avatars/husband.png',
    counterpartEmail: 'intan1717@duodiary.local',
  },
  'intan1717@duodiary.local': {
    uid: '234974c3-e371-4a91-9f6e-8854b03d32e2',
    displayName: '정하은',
    photoURL: '/avatars/wife.png',
    counterpartEmail: 'gunwoo1004@duodiary.local',
  },
};
const FAMILY_ACCOUNT_BY_UID: Record<string, { email: string; displayName: string; photoURL: string; counterpartEmail: string }> = {
  '3f061ed2-64ec-46cc-96a6-4942fe99da5d': {
    email: 'gunwoo1004@duodiary.local',
    displayName: '정건우',
    photoURL: '/avatars/husband.png',
    counterpartEmail: 'intan1717@duodiary.local',
  },
  '234974c3-e371-4a91-9f6e-8854b03d32e2': {
    email: 'intan1717@duodiary.local',
    displayName: '정하은',
    photoURL: '/avatars/wife.png',
    counterpartEmail: 'gunwoo1004@duodiary.local',
  },
};

function getFamilyAccountConfig(params: { email?: string | null; uid?: string | null }) {
  if (params.email && FAMILY_ACCOUNT_BY_EMAIL[params.email]) {
    const config = FAMILY_ACCOUNT_BY_EMAIL[params.email];
    return { email: params.email, ...config };
  }
  if (params.uid && FAMILY_ACCOUNT_BY_UID[params.uid]) {
    const config = FAMILY_ACCOUNT_BY_UID[params.uid];
    return { uid: params.uid, ...config };
  }
  return null;
}

function getPartnerPhotoUrl(email: string | null | undefined, existingPhoto: string | null | undefined) {
  if (existingPhoto) return existingPhoto;
  if (!email) return null;
  return DEMO_AVATAR_BY_EMAIL[email] ?? null;
}

function buildFamilyPartnerFallback(params: { email?: string | null; uid?: string | null }): UserProfile | null {
  const config = getFamilyAccountConfig(params);
  if (!config) return null;

  const counterpart = FAMILY_ACCOUNT_BY_EMAIL[config.counterpartEmail];
  if (!counterpart) return null;

  return {
    uid: counterpart.uid,
    displayName: counterpart.displayName,
    email: config.counterpartEmail,
    photoURL: counterpart.photoURL,
  };
}

function buildFamilyCoupleFallback(params: { email?: string | null; uid?: string | null }): Couple | null {
  if (!getFamilyAccountConfig(params)) return null;
  return {
    id: FAMILY_COUPLE_FALLBACK.id,
    anniversaryDate: FAMILY_COUPLE_FALLBACK.anniversaryDate,
  };
}

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

export function CoupleProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const familyEmail = profile?.email ?? user?.email ?? null;
  const familyIdentity = { email: familyEmail, uid: profile?.uid ?? user?.uid ?? null };

  useEffect(() => {
    if (!user) {
      setCouple(null);
      setPartner(null);
      setLoading(false);
      return;
    }

    const familyFallbackCouple = buildFamilyCoupleFallback(familyIdentity);
    const familyFallbackPartner = buildFamilyPartnerFallback(familyIdentity);
    if (familyFallbackCouple && familyFallbackPartner) {
      setCouple(familyFallbackCouple);
      setPartner(familyFallbackPartner);
      setLoading(false);
      return;
    }

    if (profile?.coupleId === 'demo-couple') {
      setCouple({
        id: 'demo-couple',
        anniversaryDate: '2023-05-10',
      });
      const partnerUid = user.uid === 'demo-user' ? 'partner-user' : 'demo-user';
      setPartner({
        uid: partnerUid,
        displayName: partnerUid === 'partner-user' ? '정하은' : '정건우',
        email: partnerUid === 'partner-user' ? 'intan1717@duodiary.local' : 'gunwoo1004@duodiary.local',
        photoURL: getPartnerPhotoUrl(
          partnerUid === 'partner-user' ? 'intan1717@duodiary.local' : 'gunwoo1004@duodiary.local',
          partnerUid === 'partner-user' ? DEMO_WIFE_PHOTO_URL : '/avatars/husband.png'
        ),
      });
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      let resolvedCouple: Awaited<ReturnType<typeof getMyCouple>> | null = null;
      try {
        resolvedCouple = await withTimeout(
          getMyCouple(),
          REQUEST_TIMEOUT_MS,
          '커플 정보를 불러오는데 시간이 오래 걸리고 있어요.'
        );
        if (cancelled) return;
        if (!resolvedCouple) {
          setCouple(buildFamilyCoupleFallback(familyIdentity) ?? { id: 'demo-couple', anniversaryDate: '2023-05-10' });
          setPartner(buildFamilyPartnerFallback(familyIdentity) ?? null);
          return;
        }

        setCouple({
          id: resolvedCouple.id,
          anniversaryDate: resolvedCouple.anniversary_date ?? undefined,
        });

        try {
          const p = await withTimeout(
            getPartnerProfile(resolvedCouple.id),
            REQUEST_TIMEOUT_MS,
            '파트너 정보를 불러오는데 시간이 오래 걸리고 있어요.'
          );
          if (cancelled) return;
          if (p) {
            setPartner({
              uid: p.id,
              displayName: p.display_name,
              email: p.email,
              photoURL: getPartnerPhotoUrl(p.email, p.photo_url)
            });
            return;
          }

          const familyConfig = getFamilyAccountConfig(familyIdentity);
          if (familyConfig?.counterpartEmail) {
            try {
              const familyPartner = await withTimeout(
                getProfileByEmail(familyConfig.counterpartEmail),
                REQUEST_TIMEOUT_MS,
                '가족 계정 정보를 불러오는데 시간이 오래 걸리고 있어요.'
              );
              if (cancelled) return;
              if (familyPartner) {
                setPartner({
                  uid: familyPartner.id,
                  displayName: familyPartner.display_name,
                  email: familyPartner.email,
                  photoURL: getPartnerPhotoUrl(familyPartner.email, familyPartner.photo_url)
                });
                return;
              }
            } catch {
              // fall through to static family fallback
            }
          }

          setPartner(buildFamilyPartnerFallback(familyIdentity) ?? null);
        } catch {
          if (cancelled) return;
          setPartner(buildFamilyPartnerFallback(familyIdentity) ?? null);
        }
      } catch (e: any) {
        const msg = String(e?.message ?? e ?? '');
        if (resolvedCouple) {
          setCouple({
            id: resolvedCouple.id,
            anniversaryDate: resolvedCouple.anniversary_date ?? undefined,
          });
          setPartner(buildFamilyPartnerFallback(familyIdentity) ?? null);
        } else {
          setCouple(buildFamilyCoupleFallback(familyIdentity) ?? { id: 'demo-couple', anniversaryDate: '2023-05-10' });
          setPartner(buildFamilyPartnerFallback(familyIdentity) ?? null);
        }
        if (msg) {
          console.error('[CoupleProvider] load failed:', msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [user, profile?.coupleId, familyEmail, profile?.uid]);

  const connectPartner = async (partnerEmail: string) => {
    // Recommended: call Edge Function (service role) to avoid email enumeration + handle transaction.
    // Not implemented in-app yet.
    throw new Error('파트너 이메일 연결은 Edge Function 연동 후 지원됩니다.');
  };

  const updateAnniversary = async (date: string) => {
    if (!couple) return;
    await updateAnniversaryDate(couple.id, date || null);
  };

  const createCouple = async (params?: { anniversaryDate?: string }) => {
    const c = await createMyCouple({ anniversary_date: params?.anniversaryDate ?? null });
    setCouple({
      id: c.id,
      anniversaryDate: c.anniversary_date ?? undefined,
    });
    const p = await getPartnerProfile(c.id);
    setPartner(
      p
        ? { uid: p.id, displayName: p.display_name, email: p.email, photoURL: getPartnerPhotoUrl(p.email, p.photo_url) }
        : null
    );
  };

  return (
    <CoupleContext.Provider value={{ couple, partner, loading, connectPartner, updateAnniversary, createCouple }}>
      {children}
    </CoupleContext.Provider>
  );
}

export function useCouple() {
  const context = useContext(CoupleContext);
  if (context === undefined) {
    throw new Error('useCouple must be used within a CoupleProvider');
  }
  return context;
}
