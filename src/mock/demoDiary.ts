import type { DiaryEntry } from '../types';

function isoLocal(y: number, m: number, d: number, hh = 21, mm = 0) {
  // Month is 1-based to be human-friendly.
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

function byDateDesc(a: DiaryEntry, b: DiaryEntry) {
  return new Date(b.date).getTime() - new Date(a.date).getTime();
}

/**
 * Demo-only: realistic "love-bird" diary posts spread across the month.
 * Keep it deterministic so 캘린더 점/목록이 항상 재현 가능.
 */
export function getDemoDiaryEntries(): DiaryEntry[] {
  const year = 2026;
  const month = 4;

  const entries: DiaryEntry[] = [
    {
      id: 'demo-2026-04-14-2130',
      date: isoLocal(year, month, 14, 21, 30),
      content:
        '오늘 너랑 손잡고 산책했어. 봄바람이 불고, 네 미소가 환해서... 우리 참 잘 만나고 있구나 싶었어. 사랑해 💕',
      mood: '😍',
      tags: ['산책', '봄바람', '손잡기'],
      isFavorite: true,
      authorUid: 'demo-user',
      photoURLs: ['https://picsum.photos/seed/duo-walk/900/900'],
    },
    {
      id: 'demo-2026-04-14-0940',
      date: isoLocal(year, month, 14, 9, 40),
      content: '아침에 일어나서 네 커피 준비했어. "고마워"라고 웃는 네 모습에 하루가 시작되네. 널 사랑하는 게 제일 행복해 🥰',
      mood: '🥰',
      tags: ['아침', '커피', '고마워'],
      isFavorite: false,
      authorUid: 'partner-user',
    },
    {
      id: 'demo-2026-04-13-2320',
      date: isoLocal(year, month, 13, 23, 20),
      content:
        '하루 끝에 네 목소리 듣고 "수고했어"라고 하니까 마음이 따뜻해져. 네가 있어줘서 고마워. 사랑해 🌙',
      mood: '☺️',
      tags: ['수고했어', '전화', '따뜻'],
      isFavorite: true,
      authorUid: 'demo-user',
    },
    {
      id: 'demo-2026-04-12-1955',
      date: isoLocal(year, month, 12, 19, 55),
      content:
        '라면에 계란 하나 얹었을 뿐인데 "이게 진짜 행복이지"라고 해. 네가 웃는 게 내 세상의 전부야. 사랑해 😋',
      mood: '😋',
      tags: ['집밥', '라면', '소확행'],
      isFavorite: false,
      authorUid: 'partner-user',
      photoURLs: ['https://picsum.photos/seed/duo-ramen/900/900'],
    },
    {
      id: 'demo-2026-04-10-2040',
      date: isoLocal(year, month, 10, 20, 40),
      content:
        '카페에서 서로 사진 찍어줬어. 네 눈빛이 너무 예뻐서 심장이 멎을 뻔했어. 널 사랑하는 게 내 운명이야 📸',
      mood: '📸',
      tags: ['카페', '사진', '창가'],
      isFavorite: true,
      authorUid: 'demo-user',
      photoURLs: ['https://picsum.photos/seed/duo-cafe/900/900', 'https://picsum.photos/seed/duo-cafe2/900/900'],
    },
    {
      id: 'demo-2026-04-09-0010',
      date: isoLocal(year, month, 9, 0, 10),
      content:
        '잠들기 전에 "내일도 같이"라고 했어. 네가 내 곁에 있어줘서 매일이 축복이야. 사랑해 💫',
      mood: '🌙',
      tags: ['굿나잇', '약속', '내일도'],
      isFavorite: false,
      authorUid: 'partner-user',
    },
    {
      id: 'demo-2026-04-07-2145',
      date: isoLocal(year, month, 7, 21, 45),
      content:
        '퇴근길에 딸기 사갔더니 네가 춤추는 거 보고 사랑에 빠졌어. 네 웃음소리가 내 인생의 BGM이야 🍓',
      mood: '🍓',
      tags: ['퇴근길', '딸기', '웃음'],
      isFavorite: true,
      authorUid: 'demo-user',
      photoURLs: ['https://picsum.photos/seed/duo-strawberry/900/900'],
    },
    {
      id: 'demo-2026-04-05-1630',
      date: isoLocal(year, month, 5, 16, 30),
      content:
        '벚꽃길에서 네 손 잡고 걸었어. 꽃보다 네가 더 아름다워. 널 영원히 사랑할게 🌸',
      mood: '🌸',
      tags: ['벚꽃', '손잡기', '영원히'],
      isFavorite: false,
      authorUid: 'partner-user',
      photoURLs: [
        'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        'https://picsum.photos/seed/love-bloom/900/900',
      ],
    },
    {
      id: 'demo-2026-04-03-2210',
      date: isoLocal(year, month, 3, 22, 10),
      content:
        '오늘은 서로 바빴는데도 “밥 먹었어?” 한마디씩 챙겨줬다.\n사소한 배려가 계속 쌓이는 게 사랑인가봐.',
      mood: '💗',
      tags: ['배려', '밥먹었어', '사소함'],
      isFavorite: true,
      authorUid: 'demo-user',
    },
  ];

  return entries.slice().sort(byDateDesc);
}

