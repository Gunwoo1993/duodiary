## DuoDiary Supabase 연동 완성 v1

### 🎯 완성된 항목

#### ✅ Backend API Layer (`src/lib/data/`)
- `profiles.ts` - 프로필 조회/수정
- `couples.ts` - 커플 관리 + getPartnerProfile  
- `diary.ts` - 일기 CRUD  
- `anniversaries.ts` - 기념일 CRUD
- `coupons.ts` - 쿠폰 CRUD
- `loveNotes.ts` - 한마디 CRUD
- **`storage.ts`** 🆕 - 파일 업로드/삭제

#### ✅ Edge Functions
- `create_my_couple/` - Atomic couple + couple_members 생성
- `login_by_email/` - Magic link OTP 생성

#### ✅ Database
- `schema.sql` - 완벽한 테이블 구조 + 인덱싱
- `rls.sql` - 부부 격리 정책 (couple_members 기반)
- **`initial-setup.sql`** 🆕 - 데모 데이터 + Storage 정책

#### ✅ Frontend Components
- `CreateEntry.tsx` - **파일 업로드 통합** 🆕
- `CoupleProvider.tsx` - 타입 fix + listLoveNotes import 추가
- `DiaryFeed.tsx` - 타입 fix + 모든 import 완성
- `AuthProvider.tsx` - Demo 계정 매핑 완벽
- `OnboardingGate.tsx` - 계정 선택 UI

#### ✅ Type Definitions
- `types.ts` - Couple 인터페이스 정리 (users 필드 제거)
- `lib/data/types.ts` - Supabase row 타입 100% 정의

---

### 📋 Supabase 초기 설정 가이드

**상세 문서**: [`docs/SUPABASE_SETUP.md`](../docs/SUPABASE_SETUP.md)

#### Step 1: 데이터베이스 초기화 (3개 SQL 파일)

**1a. Schema 생성**
```bash
# Supabase 대시보드 > SQL Editor
# 파일: supabase/schema.sql 전체 복사 & 실행
```

**1b. RLS 정책 적용**
```bash
# 파일: supabase/rls.sql 전체 복사 & 실행
```

**1c. 데모 데이터 + Storage**
```bash
# 파일: supabase/initial-setup.sql 복사 & 실행
# WARNING: initial-setup.sql의 연결 정보 수정 필요 ↓
```

#### Step 2: 데모 사용자 생성

Supabase 대시보드 > Authentication > Users > **"Create new user"** 버튼

| 필드 | User 1 (남편) | User 2 (아내) |
|------|---|---|
| Email | `gunwoo1004@duodiary.local` | `intan1717@duodiary.local` |
| Password | `demo1234` | `demo1234` |
| Auto confirm | ✅ ON | ✅ ON |
| Email verified | ✅ ON | ✅ ON |

#### Step 3: 저장구간 설정 (2가지)

**3a. Storage 버킷 생성**
1. Supabase 대시보드 > Storage
2. "Create a new bucket"
3. Name: `diary_media`
4. Permissions: Public ✅
5. Create

**3b. RLS 정책 2개 추가**

Storage > diary_media > Policies > "New policy"

**Policy 1: INSERT (Upload)**
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

**Policy 2: SELECT (Read)**
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

#### Step 4: 환경 변수 확인

파일: `.env`

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_GOOGLE_AI_API_KEY=your_gemini_api_key (선택)
```

---

### 🧪 테스트 순서

#### Test 1: 로그인 테스트
```bash
npm run dev
# http://localhost:5173

# 화면:
# - Username: gunwoo1004
# - Password: demo1234
# → "로그인 성공" 메시지 확인
```

#### Test 2: 데이터 조회 테스트
```bash
# 로그인 후:
# 1. 화면 상단 "💕 X일째 함께하는 중" 표시 = Supabase 연동 성공 ✅
# 2. 기념일 섹션에 "결혼일", "와이프 생일", "하은이 탄생일" 표시
# 3. 일기 피드에 demo 데이터 표시 (또는 비어있음)
```

#### Test 3: 파일 업로드 테스트
```bash
# 1. "새 게시물" (+) 버튼 클릭
# 2. 문구 입력 + 사진/영상 선택
# 3. "공유" 버튼 클릭
# 4. 업로드 완료 토스트 메시지 확인 ✅
# 5. 새 게시물이 피드에 나타나는지 확인
```

#### Test 4: 계정 전환 테스트
```bash
# 방법 1: Profile 탭 좌측 > intan1717로 로그인
# 방법 2: 로그아웃 후 새로 gunwoo1004로 로그인

# 확인:
# - 프로필 사진 변경 ✅
# - 파트너 프로필이 상단에 표시 ✅
# - 같은 일기 피드 보임 ✅ (couple_id 기반)
```

#### Test 5: 한마디 기능 테스트
```bash
# 1. DiaryFeed에서 "💌 한마디" 섹션 펼치기
# 2. 감정 선택 + 텍스트 입력
# 3. "AI로 한마디 생성" 클릭
#    → Gemini API가 있으면 생성, 없으면 demo 텍스트
# 4. "보내기" 클릭 → love_notes 테이블에 저장
```

---

### 🔍 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| "사용할 수 없는 계정입니다" | 로그인 실패 | Supabase 계정이 생성되지 않음 → Step 2 다시 |
| 프로필 사진이 안 보임 | `photo_url` NULL | initial-setup.sql에서 프로필 생성 확인 |
| 파일 업로드 실패 | RLS 정책 오류 | Storage > Policies 재확인, 문법 체크 |
| "커플 정보를 불러오지 못했어요" | couple_members 없음 | initial-setup.sql 재실행 |
| Localhost에서 안 됨 | CORS 설정 | Supabase > Settings > API > CORS 확인 |

---

### 📦 현재 빌드 상태

```
✓ 3314 modules transformed
✓ dist/index.html 1.10 kB
✓ dist/assets/index-*.js 848.51 kB (gzip: 257.54 kB)
✓ Built in 4.32s
```

**No TypeScript errors** ✅

---

### 🚀 다음 단계 (심화 기능)

#### Tier 1: 필수 완성 (현재)
- [x] Supabase 초기 설정
- [x] 파일 업로드 구현
- [x] 모든 API type-safe
- [ ] End-to-end 테스트 완료

#### Tier 2: 파트너 연결 (권장)
- [ ] ConnectPartner 컴포넌트 구현
- [ ] connect_partner_by_email Edge Function 완성
- [ ] 이메일 초대 플로우

#### Tier 3: 고급 기능
- [ ] 사진 필터 (Instagram 스타일)
- [ ] 감정 통계 대시보드
- [ ] 1주년 기념 알림
- [ ] 오프라인 모드 (IndexedDB)
- [ ] PWA 설치 가능

---

### 📞 참고

- Supabase Docs: https://supabase.com/docs
- RLS 디버깅: Supabase > SQL Editor에서 `select * from couple_members` 직접 실행
- 저장소 브라우저: Supabase > Storage > diary_media에서 업로드된 파일 확인
- 프리뷰: `npm run preview` (프로덕션 빌드를 로컬 포트에서 시뮬레이션)
