export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  coupleId?: string;
  partnerUid?: string;
  phoneId?: string;
  onboardingCompleted?: boolean;
}

export interface Couple {
  id: string;
  anniversaryDate?: string;
  stats?: {
    daysTogether: number;
    moodCounts: Record<string, number>;
    photoCount: number;
  };
}

export interface DiaryEntry {
  id: string;
  date: string;
  content: string;
  photoURLs?: string[];
  mood: string;
  tags: string[];
  isFavorite: boolean;
  authorUid: string;
  reactions?: Record<string, string[]>; // emoji -> list of UIDs
  comments?: Comment[];
}

export interface Comment {
  id: string;
  authorUid: string;
  content: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  title: string;
  description: string;
  status: 'available' | 'used';
  senderUid: string;
  receiverUid: string;
  message?: string;
  createdAt: string;
  /**
   * When receiver schedules/marks as used.
   * - scheduledFor: user-picked datetime for when they will "use" it
   * - usedAt: timestamp when they pressed "사용" in the app
   */
  scheduledFor?: string;
  usedAt?: string;
}

export type Mood = '😀' | '😐' | '😢' | '😡' | '😍' | '😴' | '🥳';
