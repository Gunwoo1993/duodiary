import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

const ACCOUNTS = [
  {
    username: 'gunwoo1004',
    email: 'gunwoo1004@duodiary.local',
    password: '1234',
    displayName: '남편'
  },
  {
    username: 'intan1717',
    email: 'intan1717@duodiary.local',
    password: '1234',
    displayName: '아내'
  }
];

const COUPLE_ANNIVERSARY = '2023-05-10';

async function findUserByEmail(email: string) {
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  const users = (data as any)?.users as Array<any> | undefined;
  return users?.find((user) => user.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

async function createOrGetUser(account: typeof ACCOUNTS[number]) {
  const { email, password, displayName } = account;
  let userId: string | null = null;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: displayName }
  });

  if (error) {
    const message = String(error.message ?? error).toLowerCase();
    if (!message.includes('already registered') && !message.includes('duplicate')) {
      throw error;
    }

    const existing = await findUserByEmail(email);
    if (!existing) {
      throw new Error(`Could not retrieve existing user for ${email} after duplicate error.`);
    }
    userId = existing.id;
  } else {
    userId = data.user.id;
  }

  if (!userId) {
    throw new Error(`Failed to resolve user id for ${email}`);
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      display_name: displayName,
      email,
      photo_url: null
    },
    { returning: 'minimal' }
  );
  if (profileError) throw profileError;

  return userId;
}

async function ensureCouple(userIds: string[]) {
  const { data: memberships, error: membershipError } = await admin
    .from('couple_members')
    .select('couple_id, user_id')
    .in('user_id', userIds);
  if (membershipError) throw membershipError;

  const existingCoupleId = (memberships as any[] | null)?.[0]?.couple_id ?? null;
  if (existingCoupleId) {
    return existingCoupleId as string;
  }

  const { data: coupleData, error: coupleError } = await admin
    .from('couples')
    .insert({ anniversary_date: COUPLE_ANNIVERSARY })
    .select('id')
    .single();
  if (coupleError) throw coupleError;
  return (coupleData as any).id as string;
}

async function attachMembers(coupleId: string, userIds: string[]) {
  const { data: existing, error: existingError } = await admin
    .from('couple_members')
    .select('couple_id, user_id')
    .eq('couple_id', coupleId);
  if (existingError) throw existingError;

  const existingUserIds = new Set((existing as any[] | null)?.map((row) => row.user_id));
  const missing = userIds.filter((id) => !existingUserIds.has(id));

  if (missing.length === 0) return;

  const inserts = missing.map((userId) => ({ couple_id: coupleId, user_id: userId, role: 'partner' }));
  const { error } = await admin.from('couple_members').insert(inserts);
  if (error) throw error;
}

async function main() {
  console.log('Seeding demo accounts...');
  const ids = await Promise.all(ACCOUNTS.map(createOrGetUser));
  const coupleId = await ensureCouple(ids);
  await attachMembers(coupleId, ids);
  console.log('Demo accounts ready.');
  console.log('  계정: gunwoo1004 / intan1717');
  console.log('  비밀번호: 1234');
  console.log(`  결혼기념일: ${COUPLE_ANNIVERSARY}`);
  console.log('이제 앱에서 username과 password로 로그인하면 실제 DB에 연결됩니다.');
}

main().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
