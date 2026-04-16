# Supabase 설정 가이드 (DuoDiary)

## Step 1: 데이터베이스 초기화

### 1.1 Schema 생성
Supabase 대시보드 > SQL Editor에서 [`supabase/schema.sql`](../schema.sql) 실행

### 1.2 RLS 정책 적용
SQL Editor에서 [`supabase/rls.sql`](../rls.sql) 실행

### 1.3 데모 데이터 + 저장소 설정
SQL Editor에서 [`supabase/initial-setup.sql`](../initial-setup.sql) 실행

---

## Step 2: 데모 사용자 생성

Supabase 대시보드 > Authentication > Users > "Create new user"

**User 1: 남편 (gunwoo1004)**
- Email: `gunwoo1004@duodiary.local`
- Password: `demo1234` (또는 원하는 비밀번호)
- Auto confirm: ✅ ON

**User 2: 아내 (intan1717)**
- Email: `intan1717@duodiary.local`
- Password: `demo1234` (또는 원하는 비밀번호)
- Auto confirm: ✅ ON

---

## Step 3: Storage 버킷 설정

### 3.1 Bucket 생성
1. Supabase 대시보드 > Storage > "Create a new bucket"
2. 이름: `diary_media`
3. Public: ✅ ON (다른 설정은 기본값)

### 3.2 RLS 정책 추가
Storage > diary_media > Policies > Create policy

**Policy: Users can upload to their couple's media**
```sql
CREATE POLICY "Users can upload to their couple's media"
ON storage.objects FOR INSERT
WITH CHECK (
  (storage.foldername(name))[1] = (
    select cm.couple_id::text
    from public.couple_members cm
    where cm.user_id = auth.uid()
    limit 1
  )
);
```

**Policy: Users can view their couple's media (read)**
```sql
CREATE POLICY "Users can view their couple's media"
ON storage.objects FOR SELECT
USING (
  (storage.foldername(name))[1] = (
    select cm.couple_id::text
    from public.couple_members cm
    where cm.user_id = auth.uid()
    limit 1
  )
);
```

---

## Step 4: 환경 변수 확인

`.env` 파일에 다음이 있는지 확인:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## Step 5: 테스트

### 5.1 로컬 실행
```bash
npm run dev
```

### 5.2 로그인 테스트
1. 화면에서 `gunwoo1004` 입력 → 로그인
2. 하단의 "Shop" 탭 좌측에서 `intan1717` 전환 → 로그인
3. 대신 Email 로그인으로 새로 시작하려면: 로그인 화면에서 이메일/비밀번호 입력

### 5.3 계정 연결 테스트
1. gunwoo1004로 로그인 상태
2. ConnectPartner에서 `intan1717@duodiary.local` 초대 (아직 구현 필요)
3. intan1717 수락

### 5.4 일기 작성 테스트
1. 새 게시물 > 사진 추가 > 업로드 확인 ✅

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| User 생성 시 "Invalid email" | `.local` 도메인은 테스트용이므로 Supabase 설정에서 허용 필요 |
| Storage 업로드 실패 | RLS 정책 확인, `couple_members` 테이블 데이터 확인 |
| 데이터 조회 안됨 | RLS 정책이 too restrictive할 수 있음, `debug: true` 로그 확인 |
| CORS 에러 | Supabase 대시보드 > Settings > API에서 CORS URL 확인 |

---

## 참고: 프로덕션 배포 시

- `.local` 도메인 대신 실제 이메일 사용
- Email verification 활성화
- RLS 정책 재검토 (더 엄격하게)
- Storage bucket을 private으로 변경
- 적절한 password hashing/salting 적용 (Supabase가 기본 처리)
