import React, { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useCouple } from './CoupleProvider';
import { Button } from '@/components/ui/button';
import { differenceInDays, parseISO } from 'date-fns';
import DiaryFeed from './DiaryFeed';
import CalendarView from './CalendarView';
import Shop from './Shop';
import Profile from './Profile';
import CreateEntry from './CreateEntry';
import OnboardingGate from './OnboardingGate';
import { motion, AnimatePresence } from 'motion/react';
import { useI18n } from '../lib/i18n';

function HomeIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 28 L32 12 L54 28 V52 H38 V38 H26 V52 H10 Z" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 52 V36 H42 V52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 30 C30 28 28 26 28 24 C28 20 32 18 32 18 C32 18 36 20 36 24 C36 26 34 28 32 30 Z" fill="currentColor" />
    </svg>
  );
}

function ScheduleIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="14" width="44" height="36" rx="8" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M18 22 H46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 30 H38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 38 H34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M44 18 L50 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="44" cy="42" r="6" fill="currentColor" />
      <path d="M44 39 L44 45 M41 42 L47 42" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IceCreamIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M24 24 C24 18 28 14 32 14 C36 14 40 18 40 24 C44 24 46 28 46 32 C46 38 42 42 36 42 H28 C22 42 18 38 18 32 C18 28 20 24 24 24 Z" fill="currentColor" />
      <path d="M31 42 L25 56 C25 58 27 60 29 60 H35 C37 60 39 58 39 56 L33 42" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 24 C24 18 28 14 32 14 C36 14 40 18 40 24" stroke="#fff" strokeWidth="2" />
      <circle cx="28" cy="27" r="3" fill="#fff" />
      <circle cx="36" cy="26" r="2" fill="#fff" />
    </svg>
  );
}

function BallerinaIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="14" r="6" fill="currentColor" />
      <path d="M32 20 C30 24 26 28 22 34 L24 38 C30 36 34 34 36 34 C38 34 42 36 48 38 L50 34 C46 28 42 24 40 20" fill="currentColor" />
      <path d="M24 38 L18 50 C18 52 20 54 22 54 H28 L32 44 L36 54 H42 C44 54 46 52 46 50 L40 38" fill="currentColor" />
      <path d="M24 40 C28 38 36 38 40 40" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ArcherDivider() {
  return (
    <div className="relative w-full h-12 overflow-hidden bg-slate-50">
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {/* Husband Profile */}
        <img
          src="/avatars/husband.png"
          alt="Husband"
          className="w-10 h-10 rounded-full object-cover"
        />

        {/* Baby Profile */}
        <img
          src="/avatars/baby.png"
          alt="Baby"
          className="w-10 h-10 rounded-full object-cover"
        />

        {/* Wife Profile */}
        <img
          src="/avatars/wife.png"
          alt="Wife"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      {/* Flying Heart - From Left */}
      <motion.div
        className="absolute left-8 top-1/2 -translate-y-1/2 text-lg"
        animate={{
          x: [0, 80],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          repeatDelay: 0.2
        }}
      >
        💙
      </motion.div>

      {/* Flying Heart - From Right */}
      <motion.div
        className="absolute right-8 top-1/2 -translate-y-1/2 text-lg"
        animate={{
          x: [0, -80],
          opacity: [1, 1, 0]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          repeatDelay: 0.7
        }}
      >
        💕
      </motion.div>

      {/* Heart Collision Sparkles at Center */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0]
        }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 2.4
        }}
      >
        ✨
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0],
          x: [-35, -35, -35]
        }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 2.4
        }}
      >
        💫
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0],
          x: [35, 35, 35]
        }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 2.4
        }}
      >
        💫
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0],
          y: [-35, -35, -35]
        }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 2.4
        }}
      >
        ✨
      </motion.div>

      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl"
        animate={{
          scale: [0, 1.3, 0],
          opacity: [0, 1, 0],
          y: [35, 35, 35]
        }}
        transition={{
          duration: 0.7,
          repeat: Infinity,
          repeatDelay: 2.4
        }}
      >
        ✨
      </motion.div>
    </div>
  );
}

function AddBubbleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="currentColor" opacity="0.12" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M32 24 V40 M24 32 H40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function HeartStickerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="18" fill="currentColor" opacity="0.12" />
      <path d="M32 41 C27 38 24 34 24 30 C24 26 27 23 32 23 C37 23 40 26 40 30 C40 34 37 38 32 41 Z" fill="currentColor" />
      <path d="M34 28 C34 26.3 33 24 32 24 C31 24 30 26.3 30 28" stroke="#fff" strokeWidth="2" fill="none" />
    </svg>
  );
}

function SearchSparkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="12" fill="none" stroke="currentColor" strokeWidth="3" />
      <path d="M36 36 L46 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M45 18 L49 24 M49 18 L45 24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}


export default function Layout() {
  const { user, loading: authLoading, showLogin } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const { language, setLanguage, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'shop' | 'profile'>('home');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  if (showLogin) {
    return <OnboardingGate />;
  }

  if (authLoading || coupleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-center"
        >
          <div className="mb-4">
            <svg width="80" height="80" viewBox="0 0 100 100" className="mx-auto">
              <circle cx="35" cy="35" r="12" fill="#FF69B4" />
              <circle cx="65" cy="35" r="12" fill="#FF1493" />
              <path d="M25 55 Q35 45 45 55 Q55 65 65 55 Q75 45 85 55" stroke="#FF69B4" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="30" cy="30" r="2" fill="#FFF" />
              <circle cx="40" cy="30" r="2" fill="#FFF" />
              <circle cx="60" cy="30" r="2" fill="#FFF" />
              <circle cx="70" cy="30" r="2" fill="#FFF" />
            </svg>
          </div>
          <p className="text-rose-600 font-medium">{t('app.loading')}</p>
        </motion.div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home': return <DiaryFeed />;
      case 'calendar': return <CalendarView />;
      case 'shop': return <Shop />;
      case 'profile': return <Profile />;
      default: return <DiaryFeed />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between border-b bg-white/95 backdrop-blur-sm px-4 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">DuoDiary</h1>
        <div className="flex items-center justify-end">
          <label className="flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-semibold text-rose-600 shadow-sm">
            <span className="hidden sm:inline">{t('language.label')}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ko' | 'id')}
              className="w-auto bg-transparent pr-1 text-right outline-none"
              aria-label={t('language.label')}
            >
              <option value="ko">{t('language.ko')}</option>
              <option value="id">{t('language.id')}</option>
            </select>
          </label>
        </div>
      </header>

      {/* Anniversary Slim Bar with Archer */}
      {couple?.anniversaryDate && (
        <div className="relative bg-gradient-to-r from-pink-50 to-rose-50 px-4 py-2 flex items-center justify-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <HeartStickerIcon className="h-5 w-5 text-pink-500" />
          </motion.div>
          <span className="text-sm font-bold text-pink-700 bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
            {t('app.daysTogether', { days: differenceInDays(new Date(), parseISO(couple.anniversaryDate)) + 1 })}
          </span>
        </div>
      )}
      {couple?.anniversaryDate && <ArcherDivider />}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-[80px] items-center justify-around border-t bg-white/95 backdrop-blur-sm px-3 shadow-xl rounded-t-3xl">
        <NavButton active={activeTab === 'home'} onClick={() => setActiveTab('home')} emoji="🏠" label={t('nav.home')} />
        <NavButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} emoji="📅" label={t('nav.calendar')} />
        <NavButton active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} emoji="🛍️" label={t('nav.shop')} />
        <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} emoji="👤" label={t('nav.profile')} />
      </nav>

      <CreateEntry open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function NavButton({ active, onClick, emoji, label }: { active: boolean, onClick: () => void, emoji: string, label: string }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      className={`flex flex-col items-center justify-center gap-1 px-2 py-1 rounded-2xl transition-all duration-200 ${
        active ? 'bg-pink-100 scale-110' : 'hover:bg-slate-100'
      }`}
    >
      <span className="text-3xl" style={{ filter: active ? 'brightness(1.2)' : 'brightness(0.9)' }}>
        {emoji}
      </span>
      <span className={`text-[10px] font-semibold ${
        active ? 'text-pink-700' : 'text-slate-500'
      }`}>
        {label}
      </span>
    </motion.button>
  );
}
