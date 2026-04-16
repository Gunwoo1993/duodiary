export type Id = string;

export type Profile = {
  id: Id;
  display_name: string | null;
  photo_url: string | null;
  email: string | null;
  phone_id?: string | null;
  onboarding_completed?: boolean;
  created_at: string;
};

export type Couple = {
  id: Id;
  anniversary_date: string | null;
  created_at: string;
};

export type CoupleMember = {
  couple_id: Id;
  user_id: Id;
  role: string | null;
  created_at: string;
};

export type DiaryEntryRow = {
  id: Id;
  couple_id: Id;
  author_id: Id;
  content: string;
  mood: string;
  tags: string[];
  is_favorite: boolean;
  photo_urls: string[];
  entry_at: string;
  created_at: string;
};

export type CouponRow = {
  id: Id;
  couple_id: Id;
  title: string;
  description: string;
  message: string | null;
  sender_id: Id;
  receiver_id: Id;
  status: 'available' | 'used';
  scheduled_for: string | null;
  used_at: string | null;
  created_at: string;
};

export type AnniversaryRow = {
  id: Id;
  couple_id: Id;
  title: string;
  date: string;
  created_at: string;
};

export type LoveNoteRow = {
  id: Id;
  couple_id: Id;
  from_id: Id;
  to_id: Id | null;
  emotion: string | null;
  topic: string | null;
  text: string;
  created_at: string;
};

