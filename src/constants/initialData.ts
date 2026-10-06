import { FaqItem, DocumentItem, SiteConfig } from '../types';

export const initialSiteConfig: SiteConfig = {
  mainColor: '#1A3B6B', // Matte Navy
  accentColor: '#2E7D5B', // Deep Administrative Green
  warnColor: '#D97736', // Warm Dull Orange
  heroTitle: '계명대학교 한국어학당 가이드',
  heroSubtitle: '출결, 비자, 기숙사 생활 등 자주 묻는 질문을 검색해 보세요.',
  searchPlaceholder: '비자 연장, 출석 기준, 기숙사 외박 등을 검색해 보세요',
  bgType: 'color',
  // Logo Design Defaults
  logoType: 'none',
  logoText: '계명대학교',
  logoSubText: 'KEIMYUNG UNIVERSITY',
  logoTextColor: '#1A3B6B',
  logoFontWeight: 'bold',
  logoUrl: '',
  logoHeight: 40,
  logoSymbolIcon: 'university',
  // Popup Notice Defaults
  popupEnabled: true,
  popupTitle: '2026학년도 가을학기 비자(D-4) 연장 및 체류 관리 안내',
  popupBadge: '중요 공지',
  popupContent: '계명대학교 한국어학당 유학생 여러분의 안정적인 체류를 위해 비자 연장 신청 기간 및 출석 기준을 공지합니다.\n\n1. 체류기간 만료일 4개월 전부터 관할 출입국 사전 방문예약 또는 하이코리아 전자민원 신청이 필수입니다.\n2. 직전 학기 출석률 80% 미만 시 비자 연장이 제한될 수 있으니 출결 관리에 각별히 유의하시기 바랍니다.\n3. 문의: 국제처 외국인학생지원팀 (동영관 101호 / 053-580-6923)',
  popupColor: '#1A3B6B',
  popupStyle: 'modal',
  popupIcon: 'bell',
  popupLinkText: '비자 연장 서식 다운로드 바로가기',
  popupLinkTab: 'downloads',
  // Search Button & Bar Design Defaults
  searchButtonText: '검색',
  searchButtonSize: 'md',
  searchButtonShape: 'rounded',
  searchButtonRadius: 6,
  searchButtonColor: '',
  searchButtonShowIcon: true,
  searchButtonIconType: 'search',
  searchBarRadius: 8,
  fontSize: 'standard',
  fontFamily: 'noto',
  fontSizeScale: 'standard',
  fontHeadingWeight: 'bold',
  fontLineHeight: 'normal',
  borderRadius: 6,
  officeHours: '평일 09:00 ~ 17:00 (점심시간 12:00 ~ 13:00 / 주말·공휴일 휴무)',
  phone: '053-580-6923 ~ 6924 (국제사업센터)',
  email: 'kmu_intl@kmu.ac.kr',
  location: '대구광역시 달서구 달구벌대로 1095 계명대학교 성서캠퍼스 동영관(Dongyeong Hall) 101호 국제처',
  showInstagram: true,
  showYoutube: true,
  instagramUrl: 'https://www.instagram.com/keimyung_university',
  youtubeUrl: 'https://www.youtube.com/@KeimyungUniversity',
  // Related Websites for International Students
  showRelatedSites: true,
  relatedSites: [
    {
      id: 'hikorea',
      name: '하이코리아',
      nameEn: 'Hi Korea',
      url: 'https://www.hikorea.go.kr',
      badge: '출입국 민원',
      desc: '대한민국 전자정부 외국인종합안내포털 (체류기간 연장, 외국인등록증)',
    },
    {
      id: 'topik',
      name: '한국어능력시험 (TOPIK)',
      nameEn: 'TOPIK',
      url: 'https://www.topik.go.kr',
      badge: '한국어 평가',
      desc: '국립국제교육원 TOPIK 공식 접수 및 성적증명서 발급',
    },
    {
      id: 'studyinkorea',
      name: '스터디인코리아',
      nameEn: 'Study in Korea',
      url: 'https://www.studyinkorea.go.kr',
      badge: '유학 포털',
      desc: '교육부 국립국제교육원 한국유학 종합 시스템 및 정부초청장학금(GKS)',
    },
    {
      id: 'socinet',
      name: '사회통합정보망 (소시넷)',
      nameEn: 'Soci-Net',
      url: 'https://www.socinet.go.kr',
      badge: '이민자 통합',
      desc: '법무부 이민자 사회통합프로그램(KIIP) 및 조기적응프로그램 신청',
    },
    {
      id: 'immigration',
      name: '대구출입국·외국인사무소',
      nameEn: 'Daegu Immigration',
      url: 'https://www.immigration.go.kr',
      badge: '관할 출입국',
      desc: '대구광역시 동구 신서로 115 관할 출입국 및 사전방문예약 안내',
    },
  ],
  categories: [
    {
      id: 'attendance',
      name: {
        ko: '출결/수업',
        en: 'Attendance & Class',
        vi: 'Điểm danh & Lớp học',
        zh: '出勤/课程',
      },
      icon: 'CalendarCheck',
    },
    {
      id: 'visa',
      name: {
        ko: '비자/체류',
        en: 'Visa & Stay',
        vi: 'Visa & Lưu trú',
        zh: '签证/居留',
      },
      icon: 'FileBadge',
    },
    {
      id: 'dormitory',
      name: {
        ko: '기숙사',
        en: 'Dormitory',
        vi: 'Ký túc xá',
        zh: '宿舍',
      },
      icon: 'Building2',
    },
    {
      id: 'admin',
      name: {
        ko: '행정/증명서',
        en: 'Admin & Forms',
        vi: 'Hành chính & Hồ sơ',
        zh: '行政/证明',
      },
      icon: 'ScrollText',
    },
    {
      id: 'life',
      name: {
        ko: '유학생활',
        en: 'Campus Life',
        vi: 'Đời sống du học',
        zh: '留学生活',
      },
      icon: 'GraduationCap',
    },
  ],
  // Academic Calendar Settings (현재 학기 정보 설정)
  currentAcademicYear: 2026,
  currentAcademicTerm: 'spring',
  // Chatbot Settings Defaults
  chatbotEnabled: true,
  chatbotName: '계명어학당 안내 챗봇',
  chatbotSubtitle: '24시간 유학생 실시간 상담',
  chatbotWelcomeMsg: '안녕하세요! 계명대학교 한국어학당 안내 챗봇입니다. 🎓\nD-4 비자 연장, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정 서식, 한국어학당 일정 등 무엇이든 물어보세요!',
  chatbotPlaceholder: '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준, 일정)',
  chatbotColor: '#1A3B6B',
  chatbotBadgeText: '한국어학당 안내 챗봇',
  chatbotSuggestions: [
    'D-4 비자 연장에 필요한 서류는 무엇인가요?',
    '수료 및 비자 연장을 위한 최소 출석률은?',
    '한국어학당 학생도 합법적으로 아르바이트 가능한가요?',
    '국제처 행정실(동영관 101호) 위치와 운영시간은?',
    '명교생활관(기숙사) 외박 신청은 어떻게 하나요?',
  ],
  // 1:1 Quick Inquiry Settings Defaults
  inquiryEnabled: true,
  inquiryTitle: '1:1 빠른 문의 접수',
  inquirySubtitle: '한국어학당 학사 및 비자 등 궁금한 점을 남겨주시면 담당 선생님이 확인 후 신속히 연락드립니다.',
  inquiryBadgeText: '',
  inquiryNotice: '',
  inquiryStudentIdLabel: '학번',
  inquiryStudentIdPlaceholder: '학번 8~10자리 숫자 입력 (예: 20241234)',
  inquiryNameLabel: '성명',
  inquiryNamePlaceholder: '외국인등록증 또는 여권상 영문/한글 성명',
  inquiryPhoneLabel: '연락처 (전화/메신저)',
  inquiryPhonePlaceholder: '예: 010-1234-5678, 카톡 ID',
  inquiryContentLabel: '문의 내용',
  inquiryContentPlaceholder: '비자 연장, 출결, 기숙사, 서류 등 궁금하신 사항을 자세히 적어주세요.',
  inquiryMinLength: 10,
  inquiryMaxLength: 1000,
  inquiryEnableQuiz: true,
  inquiryPrivacyNotice: '개인정보 수집 및 이용 안내: 수집항목(학번, 성명, 문의내용)은 1:1 학사 행정 상담 및 답변 처리를 위해서만 이용되며, 관련 법령에 따라 안전하게 보관됩니다.',
  inquiryPrivacyConsentText: '개인정보 수집 및 이용에 동의합니다.',
  inquirySuccessTitle: '문의가 정상적으로 접수되었습니다!',
  inquirySuccessDesc: '담당 선생님이 내용을 확인한 후 학번 또는 행정 시스템에 등록된 연락처로 신속히 답변해 드리겠습니다.',
  inquiryPausedNotice: '현재 행정실 사정으로 1:1 빠른 문의 온라인 접수가 일시 중단되었습니다. 급한 용무는 행정실(동영관 101호)로 전화 또는 방문 문의 바랍니다.',
};

export const initialFaqs: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'attendance',
    title: '한국어학당 정규학기 수료 및 비자 연장을 위한 최소 출석률 기준은 어떻게 되나요?',
    content: `
      <p class="mb-3">계명대학교 한국어학당 정규과정 학생은 <strong>법무부 출입국 외국인정책본부 규정</strong>에 따라 엄격한 출석 관리를 받습니다.</p>
      
      <div class="bg-gray-50 border-l-4 border-[#1A3B6B] p-3 mb-3 text-sm">
        <ul class="list-disc pl-5 space-y-1">
          <li><strong>수료 기준:</strong> 총 수업시간(200시간) 중 <span class="text-[#2E7D5B] font-bold">80% 이상 출석</span> 및 학업 성적 평균 70점 이상 취득</li>
          <li><strong>비자(D-4) 연장 제한:</strong> 학기 출석률이 <strong>70% 미만</strong>일 경우 다음 학기 비자 연장이 불허되거나 1회 경고 조치됩니다.</li>
          <li><strong>연속 2회 경고:</strong> 출석률 70% 미만 2회 누적 시 강제 퇴학 및 출입국관리사무소에 비자 취소 통보됩니다.</li>
        </ul>
      </div>

      <p class="text-sm text-gray-700">지각 3회 또는 조퇴 3회는 결석 1회로 환산되오니 수업 시작 10분 전까지 반드시 강의실(동영관 Dongyeong Hall)에 입실해 주시기 바랍니다.</p>
    `,
    pinned: true,
    views: 1420,
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'faq-2',
    category: 'attendance',
    title: '질병으로 결석한 경우 공결(출석 인정) 신청 절차와 제출 서류는 무엇인가요?',
    content: `
      <p class="mb-3">질병, 입원, 공공기관 방문 등 부득이한 사유로 결석한 경우 <strong>공결인정신청서</strong>를 제출하여 출석을 인정받을 수 있습니다.</p>
      
      <div class="space-y-2 mb-3 text-sm">
        <div class="flex items-start gap-2">
          <span class="inline-block px-2 py-0.5 bg-[#2E7D5B] text-white rounded text-xs">신청 기한</span>
          <span>결석일로부터 <strong>3일 이내</strong> (주말 및 공휴일 제외) 행정실(동영관 101호) 제출</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="inline-block px-2 py-0.5 bg-[#1A3B6B] text-white rounded text-xs">증빙 서류</span>
          <span>병원 진단서 또는 진료확인서 (질병명 및 진료일자가 명시된 공식 원본), 결석계 서식</span>
        </div>
        <div class="flex items-start gap-2">
          <span class="inline-block px-2 py-0.5 bg-[#D97736] text-white rounded text-xs">유의사항</span>
          <span>약국 영수증이나 단순 처방전은 공결 서류로 인정되지 않습니다. 한 학기 최대 공결 인정 일수는 10일을 초과할 수 없습니다.</span>
        </div>
      </div>
      <p class="text-sm text-gray-600">※ 서식은 상단 [서식 및 자료실] 메뉴에서 <em>'공결 인정원'</em>을 다운로드받아 작성하세요.</p>
    `,
    pinned: false,
    views: 890,
    createdAt: '2026-09-05T10:00:00Z',
    updatedAt: '2026-09-15T11:00:00Z',
  },
  {
    id: 'faq-3',
    category: 'visa',
    title: 'D-4 어학연수 비자 체류기간 연장은 언제, 어떻게 신청해야 하나요?',
    content: `
      <p class="mb-3">체류기간 만료일 <strong>4개월 전부터 만료일 당일까지</strong> 신청 가능합니다. 만료일을 하루라도 넘기면 불법체류로 과태료가 부과되므로 미리 신청해야 합니다.</p>
      
      <h4 class="font-bold text-[#1A3B6B] text-sm mb-2">필요 구비 서류:</h4>
      <ol class="list-decimal pl-5 space-y-1 text-sm mb-4">
        <li>통합신청서 (출입국 표준 서식 34호)</li>
        <li>여권 원본 및 외국인등록증(ARC)</li>
        <li>한국어학당 재학증명서 및 출석·성적증명서 (동영관 101호 발급)</li>
        <li>다음 학기 등록금 납부확인서 또는 수납영수증</li>
        <li>체류지 입증서류 (기숙사 거주확인서 또는 원룸 임대차계약서 사본)</li>
        <li>재정입증서류 (은행 잔고증명서: 출석률 70%대 학생은 필수 요구)</li>
        <li>수수료: 전자민원(HiKorea) 50,000원 / 출입국 방문 60,000원</li>
      </ol>

      <div class="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
        <strong>대구출입국관리사무소 안내:</strong> 방문 신청 시 하이코리아(hikorea.go.kr)에서 사전 방문예약이 필수입니다. 학교 단체 연장 대행 기간(매 학기 초 공지)을 활용하시면 편리합니다.
      </div>
    `,
    pinned: true,
    views: 2310,
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-25T16:00:00Z',
  },
  {
    id: 'faq-4',
    category: 'visa',
    title: '한국어학당 학생도 합법적으로 아르바이트(시간제 취업)를 할 수 있나요?',
    content: `
      <p class="mb-3">D-4(일반연수) 자격 소지자는 <strong>입국 후 6개월이 경과</strong>하고 일정 요건을 충족하면 사전 허가를 받아 아르바이트를 할 수 있습니다.</p>

      <div class="border border-gray-200 rounded p-3 mb-3 text-sm space-y-2">
        <p><strong>1. 기본 자격 요건:</strong></p>
        <ul class="list-disc pl-5 text-gray-700">
          <li>대한민국 입국일 기준 6개월(두 학기) 경과</li>
          <li>직전 학기 출석률 90% 이상</li>
          <li>TOPIK(한국어능력시험) 2급 이상 취득자 우대 (미취득 시 주당 근무시간 10시간으로 제한)</li>
        </ul>
        <p><strong>2. 허용 근무 시간:</strong> 학기 중 평일 최대 주 20시간 (주말 및 방학 중 제한 완화 가능)</p>
        <p><strong>3. 절차:</strong> 사업주와 표준근로계약서 작성 → <em>'시간제취업 확인서'</em> 작성 후 행정실(동영관 101호) 담당자 서명 → 대구출입국 승인 득한 후 근무 시작</p>
      </div>

      <p class="text-xs text-red-600 font-semibold">※ 출입국의 사전 허가 없이 근무할 경우 불법취업으로 강제 출국 및 벌금형 처분을 받을 수 있습니다.</p>
    `,
    pinned: false,
    views: 1750,
    createdAt: '2026-09-03T14:00:00Z',
    updatedAt: '2026-09-18T10:20:00Z',
  },
  {
    id: 'faq-5',
    category: 'dormitory',
    title: '명교생활관(기숙사) 통금시간과 외박 신청은 어떻게 하나요?',
    content: `
      <p class="mb-3">계명대학교 명교생활관(Myeonggyo Dormitory)은 안전한 단체생활을 위해 출입 통금 시간을 엄격히 운영하고 있습니다.</p>
      
      <div class="bg-blue-50 border border-blue-200 rounded p-3 text-sm mb-3">
        <p class="font-bold text-[#1A3B6B] mb-1">■ 출입문 폐쇄(통금) 시간: 매일 23:30 ~ 익일 05:00</p>
        <p class="text-gray-700">통금 시간 이후 출입 시 벌점 2점이 부과되며, 누적 벌점 10점 초과 시 즉시 퇴사 조치됩니다.</p>
      </div>

      <h4 class="font-semibold text-sm mb-1">외박 신청 방법:</h4>
      <ul class="list-disc pl-5 text-sm space-y-1 text-gray-700 mb-3">
        <li><strong>신청 마감:</strong> 외박 당일 <strong>21:00까지</strong> 행정실 또는 기숙사 포털(my.kmu.ac.kr)에서 신청</li>
        <li><strong>신청 일수:</strong> 1회 신청 시 최대 3박 4일까지 가능 (여행 시 상세 행선지 입력)</li>
        <li><strong>무단 외박:</strong> 사전 승인 없이 외박할 경우 벌점 3점이 즉시 부과됩니다.</li>
      </ul>
      <p class="text-sm text-gray-600">방학 중 장기 귀국이나 외부 체류 시에는 별도의 '장기 외박 사유서'를 사감실에 제출해야 합니다.</p>
    `,
    pinned: false,
    views: 1120,
    createdAt: '2026-09-04T16:00:00Z',
    updatedAt: '2026-09-19T09:15:00Z',
  },
  {
    id: 'faq-6',
    category: 'dormitory',
    title: '기숙사 입사 시 필수 제출 서류(결핵검사)와 반입 금지 품목은 무엇인가요?',
    content: `
      <p class="mb-3">명교생활관 신규 입사 및 재입사자는 단체 감염병 예방을 위해 <strong>결핵 진단서(흉부 X-ray)</strong>를 입사 당일 반드시 제출해야 합니다.</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm">
        <div class="p-3 bg-gray-50 border border-gray-200 rounded">
          <p class="font-bold text-[#1A3B6B] mb-1">필수 서류:</p>
          <ul class="list-disc pl-4 space-y-1 text-gray-700">
            <li>입사일 기준 3개월 이내 발급된 흉부 X선 검사 결과서 (정상 소견)</li>
            <li>여권 사본 및 입사 확인증</li>
          </ul>
        </div>
        <div class="p-3 bg-red-50 border border-red-200 rounded">
          <p class="font-bold text-red-700 mb-1">절대 반입 금지 품목 (화재 예방):</p>
          <ul class="list-disc pl-4 space-y-1 text-red-800">
            <li>전기장판, 전기히터, 전열기구</li>
            <li>커피포트, 인덕션, 가스버너, 밥솥</li>
            <li>애완동물, 인화성 물질, 향초</li>
          </ul>
        </div>
      </div>
      <p class="text-sm text-gray-700">※ 헤어드라이어 및 휴대폰/노트북 충전기는 사용 가능합니다.</p>
    `,
    pinned: false,
    views: 940,
    createdAt: '2026-09-06T10:00:00Z',
    updatedAt: '2026-09-17T11:45:00Z',
  },
  {
    id: 'faq-7',
    category: 'admin',
    title: '재학증명서, 성적증명서, 수료증명서는 어디서 발급받을 수 있나요?',
    content: `
      <p class="mb-3">증명서 발급은 교내 무인발급기, 온라인, 또는 행정실 방문을 통해 즉시 발급 가능합니다.</p>

      <div class="space-y-2 mb-3 text-sm">
        <div class="p-3 border border-gray-200 rounded">
          <p class="font-bold text-[#1A3B6B]">1. 교내 무인자동발급기 (Kiosk)</p>
          <p class="text-gray-700">위치: <strong>바우어관(Bauer Hall) 1층</strong> 로비, 동영관 1층 로비<br>이용시간: 24시간 연중무휴 (학번 및 주민등록번호/생년월일 입력 발급, 수수료 1통당 500원~1,000원)</p>
        </div>
        <div class="p-3 border border-gray-200 rounded">
          <p class="font-bold text-[#1A3B6B]">2. 국제처 행정실 방문 발급</p>
          <p class="text-gray-700">위치: <strong>동영관(Dongyeong Hall) 101호</strong> 외국인학생지원팀<br>운영시간: 평일 09:00~17:00 (영문/한글 증명서 즉시 발급 가능)</p>
        </div>
      </div>
    `,
    pinned: false,
    views: 1300,
    createdAt: '2026-09-07T13:00:00Z',
    updatedAt: '2026-09-22T15:00:00Z',
  },
  {
    id: 'faq-8',
    category: 'life',
    title: '성서캠퍼스와 대명캠퍼스 간 셔틀버스 운행 시간 및 이용 방법은?',
    content: `
      <p class="mb-3">계명대학교는 성서캠퍼스(본교)와 대명캠퍼스 간 무료 통학 셔틀버스를 학기 중 평일에 정기 운행합니다.</p>
      
      <div class="bg-gray-50 p-3 rounded border border-gray-200 text-sm mb-3">
        <p class="font-semibold text-[#1A3B6B] mb-2">운행 구간 및 승차 장소:</p>
        <ul class="list-disc pl-5 space-y-1 text-gray-700">
          <li><strong>성서캠퍼스 승차장:</strong> 동영관 앞 버스정류장 및 바우어관 버스베이</li>
          <li><strong>대명캠퍼스 승차장:</strong> 대명캠퍼스 본관 앞 회차로</li>
          <li><strong>운행 간격:</strong> 오전 08:30부터 17:30까지 매시 정각 및 30분 (약 30분 간격 운행)</li>
          <li><strong>이용 요금:</strong> 계명대 학생증(모바일 신분증 포함) 소지자 전액 무료</li>
        </ul>
      </div>
      <p class="text-sm text-gray-600">※ 방학 중에는 운행 시간이 단축되므로 학교 종합정보포털의 공지사항을 확인하시기 바랍니다.</p>
    `,
    pinned: false,
    views: 780,
    createdAt: '2026-09-08T15:00:00Z',
    updatedAt: '2026-09-21T09:30:00Z',
  },
];

export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-1',
    category: '비자/체류',
    title: '체류기간 연장허가 신청서 (통합서식 34호)',
    description: 'D-4 어학연수 비자 만료 전 관할 출입국관리사무소 또는 학교 대행 신청 시 사용하는 법무부 표준 신청 양식입니다.',
    fileType: 'pdf',
    fileName: 'application_for_extension_of_stay.pdf',
    fileSize: '245 KB',
    downloadUrl: '#',
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'doc-2',
    category: '비자/체류',
    title: '외국인 유학생 시간제취업(아르바이트) 확인서',
    description: '아르바이트 시작 전 학교 담당자 추천 날인 및 고용주 서명을 받아 출입국사무소에 허가 신청하는 서식입니다.',
    fileType: 'hwp',
    fileName: 'part_time_work_permit_kmu.hwp',
    fileSize: '78 KB',
    downloadUrl: '#',
    createdAt: '2026-09-01T09:00:00Z',
  },
  {
    id: 'doc-3',
    category: '기숙사',
    title: '명교생활관 외박 신청서 및 서약서',
    description: '기숙사 거주 학생이 1박 이상 외박 또는 방학 중 장기 체류지 변경 시 사감실에 사전 제출하는 서식입니다.',
    fileType: 'docx',
    fileName: 'myeonggyo_dorm_overnight_request.docx',
    fileSize: '52 KB',
    downloadUrl: '#',
    createdAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'doc-4',
    category: '행정/수업',
    title: '결석 사유서 및 공결 인정원',
    description: '병원 진료, 질병, 또는 공적 사유로 수업 결석 시 진료확인서와 함께 결석일로부터 3일 이내 제출하는 양식입니다.',
    fileType: 'pdf',
    fileName: 'absence_excuse_application.pdf',
    fileSize: '190 KB',
    downloadUrl: '#',
    createdAt: '2026-09-03T11:00:00Z',
  },
  {
    id: 'doc-5',
    category: '행정/등록',
    title: '한국어학당 등록금 환불 신청서',
    description: '과정 수강 포기, 질병, 비자 거절 등으로 인한 등록금 반환 청구 시 통장 사본과 함께 제출하는 신청서입니다.',
    fileType: 'hwp',
    fileName: 'tuition_refund_application.hwp',
    fileSize: '65 KB',
    downloadUrl: '#',
    createdAt: '2026-09-04T12:00:00Z',
  },
  {
    id: 'doc-6',
    category: '비자/체류',
    title: '외국인 체류지 변경(이사) 신고서',
    description: '원룸 이사 또는 기숙사 퇴사 후 새 주소지로 이전 시 14일 이내 구청 또는 출입국에 신고하는 안내서 및 서식입니다.',
    fileType: 'pdf',
    fileName: 'change_of_residence_report.pdf',
    fileSize: '160 KB',
    downloadUrl: '#',
    createdAt: '2026-09-05T14:00:00Z',
  },
];
