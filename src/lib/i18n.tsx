import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { id as idLocale, ko as koLocale } from 'date-fns/locale';
import type { Locale } from 'date-fns';

export type Language = 'ko' | 'id';

type TranslationMap = Record<string, string>;

const translations: Record<Language, TranslationMap> = {
  ko: {
    'language.label': '언어',
    'language.ko': '한국어',
    'language.id': 'Bahasa Indonesia',
    'app.loading': '로딩 중...',
    'app.daysTogether': '우리가 함께한 지 {days}일째 💕',
    'nav.home': '홈',
    'nav.calendar': '캘린더',
    'nav.shop': '상점',
    'nav.profile': '프로필',
    'role.husband': '남편',
    'role.wife': '아내',
    'role.wifeCasual': '와이프',
    'role.baby': '아기',
    'common.cancel': '취소',
    'common.save': '저장',
    'common.close': '닫기',
    'common.expand': '펼치기',
    'common.collapse': '접기',
    'common.me': '나',
    'common.none': '없음',
    'common.countItems': '{count}개',
    'common.dateTime': '날짜 · 시간',
    'home.familyLabel': '우리 가족',
    'home.familyTitle': '{me} · {partner} · {baby}',
    'home.familySubtitle': '오늘도 함께 기록하는 우리 세 가족의 홈',
    'home.daysTogether': '💕 {days}일째 함께하는 중',
    'home.nextAnniversary': '🎉 다음 기념일까지 D-{days} · {title}',
    'home.noAnniversary': '둘만의 기념일을 채워봐요',
    'home.oneLiner.button': '💌 한마디',
    'home.oneLiner.title': '💌 오늘의 한마디',
    'home.oneLiner.subtitle': '오늘도 앱을 열게 만드는 우리만의 문장',
    'home.oneLiner.noneMine': '아직 보낸 한마디가 없어요.',
    'home.oneLiner.nonePartner': '아직 받은 한마디가 없어요.',
    'home.oneLiner.placeholder': '직접 한마디를 적어보세요',
    'home.oneLiner.send': '보내기',
    'home.oneLiner.empty': '한마디를 입력해 주세요.',
    'home.oneLiner.sent': '한마디를 보냈어요.',
    'home.oneLiner.sendFailed': '한마디 전송에 실패했어요.',
    'home.story.mineTitle': '💌 {name}의 한마디',
    'home.story.partnerTitle': '💌 {name}의 한마디',
    'home.story.babyTitle': '💌 아기의 한마디',
    'home.story.babyMessage': '아기는 아직 한마디를 남길 수 없어요.',
    'home.loadingEntries': '기록을 불러오는 중...',
    'home.loadFailed': '홈 데이터를 불러오지 못했어요.',
    'home.emptyTitle': '첫 기록을 남겨보세요!',
    'home.emptySubtitle': '소중한 순간들을 함께 기록하며 추억을 쌓아가요',
    'home.firstEntry': '첫 기록 쓰기 ✨',
    'home.anniversaries.title': '우리의 기념일',
    'home.anniversaries.empty': '아직 등록된 기념일이 없어요.',
    'home.anniversaries.addTitle': '새 기념일 추가',
    'home.anniversaries.addPlaceholder': '여행, 첫 만남, 프로포즈',
    'home.anniversaries.add': '추가하기',
    'home.anniversaries.added': '기념일이 추가됐어요.',
    'home.anniversaries.addFailed': '기념일 추가에 실패했어요.',
    'home.post.deleteConfirm': '이 기록을 삭제하시겠습니까?',
    'home.post.deleted': '기록이 삭제되었습니다.',
    'home.post.deleteFailed': '기록 삭제에 실패했습니다.',
    'home.post.favoriteFailed': '좋아요 상태를 바꾸지 못했어요.',
    'calendar.title': '캘린더',
    'calendar.subtitle': '빨간 점은 기록이 있는 날이에요',
    'calendar.selectDate': '날짜를 선택하세요',
    'calendar.entries': '{count}개 기록',
    'calendar.none': '기록 없음',
    'calendar.emptyTitle': '이 날의 기록이 없어요',
    'calendar.emptySubtitle': '홈에서 기록을 남기면 캘린더에 점으로 표시돼요',
    'connect.title': '파트너 연결하기',
    'connect.subtitle': '상대방의 이메일을 입력하여 우리만의 공간을 만들어보세요.',
    'connect.soloTitle': '혼자 먼저 시작하기',
    'connect.soloSubtitle': '파트너 연결 전에도 기록/캘린더/상점을 미리 써볼 수 있어요.',
    'connect.createSpace': '우리 공간 만들기',
    'connect.creatingSpace': '만드는 중...',
    'connect.partnerEmail': '파트너 이메일',
    'connect.myEmail': '내 이메일',
    'connect.request': '연결 요청하기',
    'connect.connecting': '연결 중...',
    'connect.connected': '파트너와 연결되었습니다!',
    'connect.created': '우리 공간이 만들어졌어요!',
    'connect.logout': '로그아웃',
    'connect.requiresSignup': '상대방도 DuoDiary에 가입되어 있어야 합니다.',
    'auth.loginSuccess': '로그인 성공했습니다.',
    'auth.loginTitle': '회원가입 없이 아래 데모 계정으로 로그인하세요.',
    'auth.usernamePlaceholder': '계정 아이디 (gunwoo1004 / intan1717)',
    'auth.passwordPlaceholder': '비밀번호',
    'auth.accounts': '사용할 계정',
    'auth.password': '비밀번호',
    'auth.supabaseHint': '실제 Supabase 연동 환경에서는 위 계정과 비밀번호로 로그인하세요. Supabase 환경변수가 없으면 로컬 데모 모드로 동작합니다.',
    'auth.loggingIn': '로그인 중…',
    'auth.login': '로그인',
    'auth.demoLogin': 'Supabase 없이 데모 로그인',
    'auth.quickStart1': '회원가입 없이 바로 사용할 수 있습니다.',
    'auth.quickStart2': '사용 가능한 계정은 gunwoo1004와 intan1717 뿐입니다.',
    'create.title': '새 게시물',
    'create.share': '공유',
    'create.sharing': '공유 중...',
    'create.contentPlaceholder': '문구 입력...',
    'create.mood': '오늘의 기분',
    'create.selectMedia': '앨범에서 사진/영상 선택',
    'create.selectedFiles': '{count}개 선택됨',
    'create.pick': '선택',
    'create.tagPlaceholder': '태그 입력 후 Enter',
    'create.uploading': '사진/영상 업로드 중...',
    'create.savedDemo': '기록이 저장되었습니다! (데모 모드)',
    'create.saved': '기록이 저장되었습니다!',
    'create.saveFailed': '저장에 실패했습니다.',
    'profile.posts': '게시물',
    'profile.days': '우리날',
    'profile.partner': '파트너',
    'profile.bio': '❤️ {name}와(과) 함께하는 소중한 공간',
    'profile.editAnniversary': '기념일 수정',
    'profile.logout': '로그아웃',
    'profile.setAnniversary': '연애 시작일 설정',
    'profile.anniversaryUpdated': '기념일이 업데이트되었습니다!',
    'profile.anniversaryUpdateFailed': '업데이트에 실패했습니다.',
    'profile.loggedOut': '로그아웃되었습니다.',
    'profile.logoutFailed': '로그아웃에 실패했습니다.',
    'shop.title': '쿠폰 상점',
    'shop.subtitle': '서로에게 선물할 수 있는 특별한 쿠폰들',
    'shop.gift': '선물하기',
    'shop.received': '받은 선물',
    'shop.sent': '보낸 선물',
    'shop.emptyReceived': '아직 받은 선물이 없어요.',
    'shop.emptySent': '아직 보낸 선물이 없어요.',
    'shop.scheduleTitle': '사용 예약',
    'shop.scheduleHint': '예약 시간을 지정하고 “사용”을 누르면 상대의 보낸 선물에서도 비활성 처리돼요.',
    'shop.use': '사용',
    'shop.useAction': '사용하기',
    'shop.used': '사용됨',
    'shop.waiting': '사용 대기 중',
    'shop.refund': '환불',
    'shop.refunded': '환불 완료! 쿠폰이 다시 활성화됐어요.',
    'shop.refundFailed': '환불에 실패했습니다.',
    'shop.usedSuccess': '이용권을 사용했습니다!',
    'shop.usedFailed': '사용 처리에 실패했습니다.',
    'shop.selectDateTime': '날짜와 시간을 선택해줘.',
    'shop.scheduleLabel': '예약',
    'shop.sendGift': '선물 보내기',
    'shop.template': '템플릿 선택',
    'shop.createGift': '선물 생성하기',
    'shop.titlePlaceholder': '이용권 이름 (ex. 마사지 30분)',
    'shop.descriptionPlaceholder': '설명 (ex. 지친 파트너를 위해...)',
    'shop.messagePlaceholder': '메시지 남기기 (선택)',
    'shop.sending': '보내는 중...',
    'shop.giftSent': '선물을 보냈습니다!',
    'shop.titleRequired': '이용권 이름을 입력해줘.',
    'shop.descriptionRequired': '선물 설명을 입력해줘.',
    'shop.authNotReady': '로그인 정보가 아직 준비되지 않았어요.',
    'shop.partnerMissing': '상대방 연결이 아직 없어서 선물을 보낼 수 없어요.',
    'error.unknown': '알 수 없는 오류가 발생했습니다.',
    'error.sessionFetchTimeout': '인증 세션 조회가 지연되고 있어요. 네트워크를 확인해 주세요.',
    'error.profileSyncTimeout': '프로필 동기화가 지연되고 있어요.',
    'error.profileFetchTimeout': '프로필 조회가 지연되고 있어요.',
    'error.sessionExpired': '세션이 만료되었어요. 이메일로 다시 로그인해 주세요.',
    'error.sessionLoadFailed': '세션 로딩에 실패했어요.',
    'error.authFailed': '인증 처리에 실패했어요.',
    'error.usernameRequired': '계정 아이디를 입력해 주세요.',
    'error.passwordRequired': '비밀번호를 입력해 주세요.',
    'error.invalidDemoAccount': '사용 가능한 데모 계정은 gunwoo1004, intan1717 입니다.',
    'error.loginFailed': '로그인에 실패했어요.',
    'error.invalidCredentials': '아이디 또는 비밀번호가 올바르지 않습니다.',
    'error.partnerConnectUnavailable': '파트너 이메일 연결은 Edge Function 연동 후 지원됩니다.',
    'error.coupleInfoTimeout': '커플 정보를 불러오는데 시간이 오래 걸리고 있어요.',
    'error.partnerInfoTimeout': '파트너 정보를 불러오는데 시간이 오래 걸리고 있어요.',
    'error.familyInfoTimeout': '가족 계정 정보를 불러오는데 시간이 오래 걸리고 있어요.',
    'error.coupleIdRequired': '커플 ID가 필요해요.',
    'error.fileRequired': '파일이 필요해요.',
    'error.unsupportedFileType': '지원하지 않는 파일 형식이에요: {type}',
    'error.fileTooLarge': '파일 용량이 너무 커요. 최대 50MB까지 가능해요.',
    'error.uploadFailed': '업로드에 실패했어요: {reason}',
    'error.batchUploadFailed': '여러 파일 업로드에 실패했어요: {reason}',
    'error.deleteFailed': '삭제에 실패했어요: {reason}',
    'error.bucketNotFound': '업로드 버킷을 찾을 수 없어요.',
    'error.database54001': '데이터베이스 제한으로 업로드가 실패했어요.',
    'template.massage': '마사지 30분',
    'template.massageDesc': '지친 파트너를 위한 시원한 마사지 이용권',
    'template.dishes': '오늘 설거지 대신하기',
    'template.dishesDesc': '귀찮은 설거지, 오늘은 내가 할게!',
    'template.menu': '외식 메뉴 결정권',
    'template.menuDesc': '오늘 먹고 싶은 건 네가 다 정해!',
    'template.errand': '심부름 1회권',
    'template.errandDesc': '뭐든 시켜만 줘, 내가 다녀올게!',
    'demo.anniversary.marriage': '결혼일',
    'demo.anniversary.wifeBirthday': '와이프 생일',
    'demo.anniversary.babyBirthday': '하은이 탄생일',
    'demo.oneLiner1': '오늘도 네 생각하면서 웃었어 :)',
    'demo.oneLiner2': '하루 끝에 제일 먼저 떠오르는 사람은 늘 너야.',
    'demo.oneLiner3': '사소한 하루도 너랑 있으면 기념일 같아.',
    'demo.oneLiner4': '오늘도 네 편이 되어주고 싶었어.',
    'demo.couponMessage1': '오늘 고생 많았어!',
    'demo.couponMessage2': '어제 너무 피곤해 보여서 ㅎㅎ',
  },
  id: {
    'language.label': 'Bahasa',
    'language.ko': 'Korea',
    'language.id': 'Bahasa Indonesia',
    'app.loading': 'Memuat...',
    'app.daysTogether': 'Kita sudah bersama {days} hari 💕',
    'nav.home': 'Beranda',
    'nav.calendar': 'Kalender',
    'nav.shop': 'Hadiah',
    'nav.profile': 'Profil',
    'role.husband': 'Suami',
    'role.wife': 'Istri',
    'role.wifeCasual': 'Istri',
    'role.baby': 'Bayi',
    'common.cancel': 'Batal',
    'common.save': 'Simpan',
    'common.close': 'Tutup',
    'common.expand': 'Buka',
    'common.collapse': 'Tutup',
    'common.me': 'Aku',
    'common.none': 'Tidak ada',
    'common.countItems': '{count}',
    'common.dateTime': 'Tanggal · Waktu',
    'home.familyLabel': 'Keluarga Kami',
    'home.familyTitle': '{me} · {partner} · {baby}',
    'home.familySubtitle': 'Rumah kecil keluarga kami yang selalu mencatat hari bersama',
    'home.daysTogether': '💕 Sudah bersama {days} hari',
    'home.nextAnniversary': '🎉 {days} hari lagi · {title}',
    'home.noAnniversary': 'Isi momen spesial kalian berdua',
    'home.oneLiner.button': '💌 Pesan',
    'home.oneLiner.title': '💌 Pesan Hari Ini',
    'home.oneLiner.subtitle': 'Kalimat kecil yang bikin kita buka aplikasi ini lagi',
    'home.oneLiner.noneMine': 'Belum ada pesan yang kamu kirim.',
    'home.oneLiner.nonePartner': 'Belum ada pesan yang kamu terima.',
    'home.oneLiner.placeholder': 'Tulis pesanmu sendiri',
    'home.oneLiner.send': 'Kirim',
    'home.oneLiner.empty': 'Masukkan pesan dulu ya.',
    'home.oneLiner.sent': 'Pesan berhasil dikirim.',
    'home.oneLiner.sendFailed': 'Gagal mengirim pesan.',
    'home.story.mineTitle': '💌 Pesan dari {name}',
    'home.story.partnerTitle': '💌 Pesan dari {name}',
    'home.story.babyTitle': '💌 Pesan Bayi',
    'home.story.babyMessage': 'Bayi belum bisa mengirim pesan.',
    'home.loadingEntries': 'Sedang memuat catatan...',
    'home.loadFailed': 'Gagal memuat data beranda.',
    'home.emptyTitle': 'Buat catatan pertama kalian!',
    'home.emptySubtitle': 'Simpan momen berharga dan bangun kenangan bersama',
    'home.firstEntry': 'Tulis catatan pertama ✨',
    'home.anniversaries.title': 'Hari spesial kita',
    'home.anniversaries.empty': 'Belum ada hari spesial yang terdaftar.',
    'home.anniversaries.addTitle': 'Tambah hari spesial',
    'home.anniversaries.addPlaceholder': 'Perjalanan, pertama ketemu, lamaran',
    'home.anniversaries.add': 'Tambahkan',
    'home.anniversaries.added': 'Hari spesial berhasil ditambahkan.',
    'home.anniversaries.addFailed': 'Gagal menambahkan hari spesial.',
    'home.post.deleteConfirm': 'Yakin ingin menghapus catatan ini?',
    'home.post.deleted': 'Catatan berhasil dihapus.',
    'home.post.deleteFailed': 'Gagal menghapus catatan.',
    'home.post.favoriteFailed': 'Gagal mengubah status suka.',
    'calendar.title': 'Kalender',
    'calendar.subtitle': 'Titik merah menandakan hari yang punya catatan',
    'calendar.selectDate': 'Pilih tanggal',
    'calendar.entries': '{count} catatan',
    'calendar.none': 'Tidak ada catatan',
    'calendar.emptyTitle': 'Tidak ada catatan di hari ini',
    'calendar.emptySubtitle': 'Kalau kamu menulis di beranda, tanggal ini akan diberi titik',
    'connect.title': 'Hubungkan pasangan',
    'connect.subtitle': 'Masukkan email pasangan untuk membuat ruang kalian berdua.',
    'connect.soloTitle': 'Mulai sendiri dulu',
    'connect.soloSubtitle': 'Bahkan sebelum terhubung, kamu sudah bisa mencoba catatan, kalender, dan hadiah.',
    'connect.createSpace': 'Buat ruang kita',
    'connect.creatingSpace': 'Sedang membuat...',
    'connect.partnerEmail': 'Email pasangan',
    'connect.myEmail': 'Emailku',
    'connect.request': 'Kirim permintaan',
    'connect.connecting': 'Sedang menghubungkan...',
    'connect.connected': 'Berhasil terhubung dengan pasangan.',
    'connect.created': 'Ruang kalian berhasil dibuat.',
    'connect.logout': 'Keluar',
    'connect.requiresSignup': 'Pasangan juga harus punya akun DuoDiary.',
    'auth.loginSuccess': 'Berhasil masuk.',
    'auth.loginTitle': 'Masuk dengan akun demo di bawah tanpa perlu daftar.',
    'auth.usernamePlaceholder': 'ID akun (gunwoo1004 / intan1717)',
    'auth.passwordPlaceholder': 'Kata sandi',
    'auth.accounts': 'Akun yang bisa dipakai',
    'auth.password': 'Kata sandi',
    'auth.supabaseHint': 'Di lingkungan Supabase asli, masuklah dengan akun dan kata sandi di atas. Jika env Supabase tidak ada, aplikasi akan berjalan dalam mode demo lokal.',
    'auth.loggingIn': 'Sedang masuk…',
    'auth.login': 'Masuk',
    'auth.demoLogin': 'Masuk demo tanpa Supabase',
    'auth.quickStart1': 'Bisa langsung dipakai tanpa daftar.',
    'auth.quickStart2': 'Akun yang tersedia hanya gunwoo1004 dan intan1717.',
    'create.title': 'Posting baru',
    'create.share': 'Bagikan',
    'create.sharing': 'Sedang membagikan...',
    'create.contentPlaceholder': 'Tulis caption...',
    'create.mood': 'Perasaan hari ini',
    'create.selectMedia': 'Pilih foto/video dari album',
    'create.selectedFiles': '{count} file dipilih',
    'create.pick': 'Pilih',
    'create.tagPlaceholder': 'Masukkan tag lalu tekan Enter',
    'create.uploading': 'Sedang mengunggah foto/video...',
    'create.savedDemo': 'Catatan berhasil disimpan! (mode demo)',
    'create.saved': 'Catatan berhasil disimpan!',
    'create.saveFailed': 'Gagal menyimpan.',
    'profile.posts': 'Postingan',
    'profile.days': 'Hari Kita',
    'profile.partner': 'Pasangan',
    'profile.bio': '❤️ Ruang berharga bersama {name}',
    'profile.editAnniversary': 'Ubah hari jadi',
    'profile.logout': 'Keluar',
    'profile.setAnniversary': 'Atur tanggal mulai hubungan',
    'profile.anniversaryUpdated': 'Hari jadi berhasil diperbarui.',
    'profile.anniversaryUpdateFailed': 'Gagal memperbarui.',
    'profile.loggedOut': 'Berhasil keluar.',
    'profile.logoutFailed': 'Gagal keluar.',
    'shop.title': 'Toko Kupon',
    'shop.subtitle': 'Kupon spesial yang bisa kalian kirim satu sama lain',
    'shop.gift': 'Kirim Hadiah',
    'shop.received': 'Hadiah Diterima',
    'shop.sent': 'Hadiah Terkirim',
    'shop.emptyReceived': 'Belum ada hadiah yang diterima.',
    'shop.emptySent': 'Belum ada hadiah yang dikirim.',
    'shop.scheduleTitle': 'Jadwalkan Penggunaan',
    'shop.scheduleHint': 'Pilih waktu lalu tekan “Gunakan” agar status di hadiah terkirim pasangan juga ikut nonaktif.',
    'shop.use': 'Gunakan',
    'shop.useAction': 'Gunakan',
    'shop.used': 'Sudah Dipakai',
    'shop.waiting': 'Menunggu dipakai',
    'shop.refund': 'Batalkan',
    'shop.refunded': 'Berhasil dibatalkan. Kupon aktif lagi.',
    'shop.refundFailed': 'Gagal membatalkan.',
    'shop.usedSuccess': 'Kupon berhasil digunakan.',
    'shop.usedFailed': 'Gagal memproses penggunaan.',
    'shop.selectDateTime': 'Pilih tanggal dan waktunya dulu.',
    'shop.scheduleLabel': 'Jadwal',
    'shop.sendGift': 'Kirim hadiah',
    'shop.template': 'Pilih template',
    'shop.createGift': 'Buat hadiah',
    'shop.titlePlaceholder': 'Nama kupon (contoh: pijat 30 menit)',
    'shop.descriptionPlaceholder': 'Deskripsi (contoh: untuk pasangan yang lelah...)',
    'shop.messagePlaceholder': 'Tinggalkan pesan (opsional)',
    'shop.sending': 'Sedang mengirim...',
    'shop.giftSent': 'Hadiah berhasil dikirim!',
    'shop.titleRequired': 'Masukkan nama kupon dulu.',
    'shop.descriptionRequired': 'Masukkan deskripsi hadiah dulu.',
    'shop.authNotReady': 'Informasi login belum siap.',
    'shop.partnerMissing': 'Belum ada pasangan yang terhubung, jadi hadiah belum bisa dikirim.',
    'error.unknown': 'Terjadi kesalahan yang tidak diketahui.',
    'error.sessionFetchTimeout': 'Pengambilan sesi terlalu lama. Coba cek jaringan dulu ya.',
    'error.profileSyncTimeout': 'Sinkronisasi profil terlalu lama.',
    'error.profileFetchTimeout': 'Pengambilan profil terlalu lama.',
    'error.sessionExpired': 'Sesi sudah habis. Silakan login lagi dengan email.',
    'error.sessionLoadFailed': 'Gagal memuat sesi.',
    'error.authFailed': 'Gagal memproses autentikasi.',
    'error.usernameRequired': 'Masukkan ID akun dulu.',
    'error.passwordRequired': 'Masukkan kata sandi dulu.',
    'error.invalidDemoAccount': 'Akun demo yang tersedia hanya gunwoo1004 dan intan1717.',
    'error.loginFailed': 'Gagal login.',
    'error.invalidCredentials': 'ID atau kata sandi tidak benar.',
    'error.partnerConnectUnavailable': 'Menghubungkan pasangan lewat email baru tersedia setelah Edge Function disambungkan.',
    'error.coupleInfoTimeout': 'Data pasangan terlalu lama dimuat.',
    'error.partnerInfoTimeout': 'Data pasangan terlalu lama dimuat.',
    'error.familyInfoTimeout': 'Data keluarga terlalu lama dimuat.',
    'error.coupleIdRequired': 'Couple ID diperlukan.',
    'error.fileRequired': 'File diperlukan.',
    'error.unsupportedFileType': 'Tipe file tidak didukung: {type}',
    'error.fileTooLarge': 'Ukuran file terlalu besar. Maksimal 50MB.',
    'error.uploadFailed': 'Gagal mengunggah: {reason}',
    'error.batchUploadFailed': 'Gagal mengunggah beberapa file: {reason}',
    'error.deleteFailed': 'Gagal menghapus: {reason}',
    'error.bucketNotFound': 'Bucket upload tidak ditemukan.',
    'error.database54001': 'Upload gagal karena batas database.',
    'template.massage': 'Pijat 30 menit',
    'template.massageDesc': 'Kupon pijat segar untuk pasangan yang lelah',
    'template.dishes': 'Gantikan cuci piring hari ini',
    'template.dishesDesc': 'Cuci piring yang merepotkan, hari ini aku yang kerjakan!',
    'template.menu': 'Hak pilih menu makan',
    'template.menuDesc': 'Hari ini kamu yang tentukan semuanya!',
    'template.errand': 'Kupon satu kali bantu urusan',
    'template.errandDesc': 'Suruh apa saja, aku yang jalan!',
    'demo.anniversary.marriage': 'Hari pernikahan',
    'demo.anniversary.wifeBirthday': 'Ulang tahun istri',
    'demo.anniversary.babyBirthday': 'Hari lahir Haeun',
    'demo.oneLiner1': 'Hari ini aku tersenyum lagi karena memikirkanmu :)',
    'demo.oneLiner2': 'Di akhir hari, kamu selalu jadi orang pertama yang aku pikirkan.',
    'demo.oneLiner3': 'Hari biasa pun terasa spesial kalau bersamamu.',
    'demo.oneLiner4': 'Hari ini pun aku ingin tetap ada di pihakmu.',
    'demo.couponMessage1': 'Kamu hebat hari ini!',
    'demo.couponMessage2': 'Kemarin kamu kelihatan sangat lelah hehe',
  },
};

const LANGUAGE_STORAGE_KEY = 'duodiary-language';

type I18nContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number | null | undefined>) => string;
  dateLocale: Locale;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function formatTemplate(template: string, vars?: Record<string, string | number | null | undefined>) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''));
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'ko';
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === 'id' ? 'id' : 'ko';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nContextType>(() => {
    const t = (key: string, vars?: Record<string, string | number | null | undefined>) =>
      formatTemplate(translations[language][key] ?? translations.ko[key] ?? key, vars);

    return {
      language,
      setLanguage,
      t,
      dateLocale: language === 'id' ? idLocale : koLocale,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

function localizeErrorDetail(message: string, t: I18nContextType['t']) {
  const normalized = message.trim();

  if (normalized.includes('Bucket not found')) return t('error.bucketNotFound');
  if (normalized.includes('database error, code: 54001')) return t('error.database54001');
  if (normalized.includes('Couple ID required')) return t('error.coupleIdRequired');
  if (normalized.includes('File required')) return t('error.fileRequired');
  if (normalized.includes('Unsupported file type:')) {
    return t('error.unsupportedFileType', { type: normalized.split('Unsupported file type:')[1]?.trim() ?? '' });
  }
  if (normalized.includes('File too large')) return t('error.fileTooLarge');
  if (normalized.includes('인증 세션 조회가 지연')) return t('error.sessionFetchTimeout');
  if (normalized.includes('프로필 동기화가 지연')) return t('error.profileSyncTimeout');
  if (normalized.includes('프로필 조회가 지연')) return t('error.profileFetchTimeout');
  if (normalized.includes('세션이 만료되었어요')) return t('error.sessionExpired');
  if (normalized.includes('계정 아이디를 입력해 주세요')) return t('error.usernameRequired');
  if (normalized.includes('비밀번호를 입력해 주세요')) return t('error.passwordRequired');
  if (normalized.includes('사용 가능한 데모 계정')) return t('error.invalidDemoAccount');
  if (normalized.includes('아이디 또는 비밀번호가 올바르지 않습니다') || normalized.includes('Invalid login credentials')) {
    return t('error.invalidCredentials');
  }
  if (normalized.includes('로그인에 실패했어요')) return t('error.loginFailed');
  if (normalized.includes('파트너 이메일 연결은 Edge Function 연동 후 지원됩니다')) {
    return t('error.partnerConnectUnavailable');
  }
  if (normalized.includes('커플 정보를 불러오는데 시간이 오래 걸리고 있어요')) return t('error.coupleInfoTimeout');
  if (normalized.includes('파트너 정보를 불러오는데 시간이 오래 걸리고 있어요')) return t('error.partnerInfoTimeout');
  if (normalized.includes('가족 계정 정보를 불러오는데 시간이 오래 걸리고 있어요')) return t('error.familyInfoTimeout');

  return normalized;
}

export function localizeErrorMessage(error: unknown, t: I18nContextType['t']) {
  const raw = String((error as { message?: string } | undefined)?.message ?? error ?? '').trim();
  if (!raw) return t('error.unknown');

  if (raw.startsWith('Batch upload failed:')) {
    return t('error.batchUploadFailed', {
      reason: localizeErrorDetail(raw.replace('Batch upload failed:', '').trim(), t),
    });
  }
  if (raw.startsWith('Upload failed:')) {
    return t('error.uploadFailed', {
      reason: localizeErrorDetail(raw.replace('Upload failed:', '').trim(), t),
    });
  }
  if (raw.startsWith('Delete failed:')) {
    return t('error.deleteFailed', {
      reason: localizeErrorDetail(raw.replace('Delete failed:', '').trim(), t),
    });
  }
  if (raw.startsWith('세션 로딩 실패:')) {
    return `${t('error.sessionLoadFailed')}: ${localizeErrorDetail(raw.replace('세션 로딩 실패:', '').trim(), t)}`;
  }
  if (raw.startsWith('인증 처리 실패:')) {
    return `${t('error.authFailed')}: ${localizeErrorDetail(raw.replace('인증 처리 실패:', '').trim(), t)}`;
  }

  return localizeErrorDetail(raw, t);
}
