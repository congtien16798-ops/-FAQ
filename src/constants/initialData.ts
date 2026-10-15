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
        mn: 'Ирц / Хичээл',
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
        mn: 'Виз / Оршин суух',
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
        mn: 'Дотуур байр',
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
        mn: 'Захиргаа / Тодорхойлолт',
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
        mn: 'Оюутны амьдрал',
      },
      icon: 'GraduationCap',
    },
    {
      id: 'entry_exit',
      name: {
        ko: '입국/출국',
        en: 'Entry & Exit',
        vi: 'Xuất nhập cảnh',
        zh: '出入境',
        mn: 'Хил нэвтрэх',
      },
      icon: 'Plane',
    },
  ],
  // Academic Calendar Settings (현재 학기 정보 설정)
  currentAcademicYear: 2026,
  currentAcademicTerm: 'spring',
  // Chatbot Settings Defaults
  chatbotEnabled: true,
  chatbotName: '계명어학당 안내 챗봇',
  chatbotSubtitle: 'FAQ·서식·학사일정 실시간 안내',
  chatbotWelcomeMsg: '안녕하세요! 계명대학교 한국어학당 안내 챗봇입니다. 🎓\n관리자가 등록한 자주 묻는 질문(FAQ), 행정 서식 자료, 한국어학당 학사일정을 바탕으로 정확하게 안내해 드립니다. 궁금한 점을 질문해 보세요!',
  chatbotPlaceholder: '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준, 일정)',
  chatbotColor: '#1A3B6B',
  chatbotBadgeText: '등록 정보 기반 안내',
  chatbotSuggestions: [
    'D-4 비자 연장에 필요한 서류는 무엇인가요?',
    '수료 및 비자 연장을 위한 최소 출석률은?',
    '2026학년도 한국어학당 학사 일정 알려주세요',
    '외국인 유학생 아르바이트(시간제 취업) 가능한가요?',
    '국제처 행정실(동영관 101호) 위치와 운영시간은?',
  ],
  chatbotNoMatchMsg: '문의하신 내용과 일치하는 공식 FAQ 및 행정 등록 정보가 현재 없습니다. 정확한 안내를 위해 담당 선생님께 1:1 빠른 문의를 남겨주시면 신속히 답변해 드리겠습니다.',
  chatbotShowInquiryOnNoMatch: true,
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

// Standard KMU Official Administrative Form Documents
export const initialDocuments: DocumentItem[] = [
  {
    id: 'doc-d4-visa-extension',
    title: '[양식] D-4 일반연수 체류기간 연장 통합신청서 (출입국 표준)',
    category: '비자/체류',
    description: 'D-4 어학연수생 체류기간 연장 신청 시 작성하는 법무부 출입국 외국인관서 공식 통합신청서 양식입니다.',
    fileType: 'pdf',
    fileName: 'D-4_체류기간연장_통합신청서.pdf',
    fileSize: '245 KB',
    downloadUrl: '#',
    hidden: false,
    order: 1,
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-15T09:00:00.000Z',
  },
  {
    id: 'doc-part-time-work',
    title: '[양식] 외국인 유학생 시간제취업(아르바이트) 확인서',
    category: '비자/체류',
    description: '한국어학당 연수생 시간제 취업 허가 신청을 위한 학교 담당자 확인 및 고용주 서명 양식입니다.',
    fileType: 'hwp',
    fileName: '외국인유학생_시간제취업확인서.hwp',
    fileSize: '118 KB',
    downloadUrl: '#',
    hidden: false,
    order: 2,
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
  },
  {
    id: 'doc-absence-leave',
    title: '[양식] 한국어학당 결석 공결(병결) 승인 신청서',
    category: '출결/수료',
    description: '질병 또는 부득이한 사유로 결석 시 진료확인서를 첨부하여 행정실(동영관 101호)에 제출하는 공식 양식입니다.',
    fileType: 'hwp',
    fileName: '한국어학당_공결_병결_신청서.hwp',
    fileSize: '92 KB',
    downloadUrl: '#',
    hidden: false,
    order: 3,
    createdAt: '2026-03-03T11:00:00.000Z',
    updatedAt: '2026-03-16T11:00:00.000Z',
  },
  {
    id: 'doc-dorm-leave',
    title: '[양식] 명교생활관(기숙사) 외박 및 장기부재 신청서',
    category: '기숙사/생활',
    description: '명교생활관 사생의 주말 외박 또는 방학 중 장기 부재 시 작성하는 사생 전용 신청서 양식입니다.',
    fileType: 'docx',
    fileName: '명교생활관_외박신청서.docx',
    fileSize: '74 KB',
    downloadUrl: '#',
    hidden: false,
    order: 4,
    createdAt: '2026-03-04T12:00:00.000Z',
    updatedAt: '2026-03-17T12:00:00.000Z',
  },
  {
    id: 'doc-residence-confirm',
    title: '[서식] 외국인 유학생 체류지 입증서류 (거주·숙소제공 확인서)',
    category: '비자/체류',
    description: '체류지 입증을 위해 원룸 임대차계약서 또는 숙소 제공자 확인을 받을 때 사용하는 공식 서식입니다.',
    fileType: 'pdf',
    fileName: '거주숙소제공확인서.pdf',
    fileSize: '156 KB',
    downloadUrl: '#',
    hidden: false,
    order: 5,
    createdAt: '2026-03-05T14:00:00.000Z',
    updatedAt: '2026-03-18T14:00:00.000Z',
  },
];

// Initial Standard FAQs showcasing rich formatting, boxes, tables, files, and linked document shortcuts
export const initialFaqs: FaqItem[] = [
  {
    id: 'faq-d4-extension',
    category: 'visa',
    title: 'D-4 비자 체류기간 연장 절차 및 필수 제출 서류 안내',
    pinned: true,
    hidden: false,
    views: 420,
    relatedDocumentIds: ['doc-d4-visa-extension', 'doc-residence-confirm'],
    content: `
      <div class="faq-callout-box" data-box-type="info" draggable="true" style="background-color: #EFF6FF; border-left: 4px solid #1A3B6B; border-radius: 8px; padding: 14px 16px; margin: 14px 0; font-size: 13px; line-height: 1.6; position: relative;">
        <div class="box-action-bar" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; user-select: none;">
          <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #475569; background: #E2E8F0; padding: 2px 8px; border-radius: 4px; cursor: grab;">
            <span>⠿ 드래그 이동</span>
            <span style="color: #94A3B8;">|</span>
            <button type="button" class="btn-block-move-up" title="위로 이동" style="background: white; border: 1px solid #CBD5E1; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▲ 위로</button>
            <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: white; border: 1px solid #CBD5E1; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▼ 아래로</button>
          </div>
          <button type="button" class="btn-delete-callout-box" title="박스 삭제" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
            <span>박스 삭제 ✕</span>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #1A3B6B; margin-bottom: 6px; font-size: 13.5px;">
          <span>ℹ️</span><span>중요 안내: D-4 연장 신청 기간</span>
        </div>
        <div>체류기간 만료일 <strong>4개월 전부터 만료 당일까지</strong> 관할 출입국 외국인청 방문 예약 또는 <a href="https://www.hikorea.go.kr" target="_blank" rel="noopener noreferrer" style="color: #1A3B6B; text-decoration: underline; font-weight: bold;">하이코리아(HiKorea) 전자민원</a>으로 신청 가능합니다.</div>
      </div>

      <p>계명대학교 한국어학당 연수생 여러분의 체류기간 연장 시 필요한 기본 구비서류 및 기준을 안내해 드립니다.</p>

      <div class="table-responsive" draggable="true" style="overflow-x: auto; margin: 14px 0; position: relative;">
        <div class="table-action-bar" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; user-select: none;">
          <div class="block-drag-handle" draggable="true" title="표를 잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #475569; background: #F1F5F9; border: 1px solid #CBD5E1; padding: 2px 8px; border-radius: 4px; cursor: grab;">
            <span>⠿ 표 이동</span>
            <span style="color: #CBD5E1;">|</span>
            <button type="button" class="btn-block-move-up" title="표를 위로 이동" style="background: white; border: 1px solid #CBD5E1; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▲ 위로</button>
            <button type="button" class="btn-block-move-down" title="표를 아래로 이동" style="background: white; border: 1px solid #CBD5E1; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▼ 아래로</button>
          </div>
          <button type="button" class="btn-delete-table" title="표 전체 삭제" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
            <span>표 삭제 ✕</span>
          </button>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; border: 1px solid #CBD5E1; background-color: #ffffff;">
          <thead>
            <tr style="background-color: #1A3B6B; color: #ffffff;">
              <th style="border: 1px solid #CBD5E1; padding: 8px 10px; text-align: center; width: 25%;">구분</th>
              <th style="border: 1px solid #CBD5E1; padding: 8px 10px; text-align: center; width: 45%;">필수 제출 서류</th>
              <th style="border: 1px solid #CBD5E1; padding: 8px 10px; text-align: center; width: 30%;">발급 및 유의사항</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px; font-weight: bold; text-align: center; background: #F8FAFC;">기본 서류</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">통합신청서, 여권 원본 및 사본, 외국인등록증(ARC), 수수료 6만원</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">하이코리아 신청 시 수수료 5만원 감면</td>
            </tr>
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px; font-weight: bold; text-align: center; background: #F8FAFC;">학사 서류</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">한국어학당 재학증명서, 출석·성적증명서, 등록금 납입영수증</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">동영관 101호 행정실에서 발급 가능</td>
            </tr>
            <tr>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px; font-weight: bold; text-align: center; background: #F8FAFC;">체류지 입증</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">기숙사 거주확인서 또는 부동산 임대차계약서</td>
              <td style="border: 1px solid #CBD5E1; padding: 8px 10px;">타인 명의 숙소 시 거주숙소제공확인서 필수</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="faq-doc-shortcut-card" data-doc-id="doc-d4-visa-extension" draggable="true" style="background-color: #F0F5FA; border: 1.5px solid #1A3B6B; border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; flex-direction: column; gap: 8px; font-family: inherit; position: relative;">
        <div contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #1A3B6B; background: #DBEAFE; padding: 2px 7px; border-radius: 4px; cursor: grab; user-select: none;">
              <span>⠿ 이동</span>
              <button type="button" class="btn-block-move-up" title="위로 이동" style="background: white; border: 1px solid #93C5FD; border-radius: 3px; cursor: pointer; color: #1E40AF; padding: 1px 4px; font-size: 10px; font-weight: bold;">▲</button>
              <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: white; border: 1px solid #93C5FD; border-radius: 3px; cursor: pointer; color: #1E40AF; padding: 1px 4px; font-size: 10px; font-weight: bold;">▼</button>
            </div>
            <span style="background-color: #1A3B6B; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px;">서식 및 자료실</span>
            <span style="background-color: #DC2626; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">PDF</span>
            <span style="font-size: 11px; color: #64748B;">[비자/체류]</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 500;">용량: 245 KB</span>
            <button type="button" class="btn-delete-doc-shortcut" data-doc-id="doc-d4-visa-extension" title="서식자료실 연동 카드 삭제" style="background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 3px 8px; font-size: 10.5px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
              <span>연동 삭제 ✕</span>
            </button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; font-size: 13.5px; color: #0F254A;">📄 [양식] D-4 일반연수 체류기간 연장 통합신청서 (출입국 표준)</div>
            <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">D-4 어학연수생 체류기간 연장 신청 시 작성하는 법무부 출입국 외국인관서 공식 통합신청서 양식입니다.</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-faq-doc-download" data-doc-id="doc-d4-visa-extension" style="background-color: #1A3B6B; color: #ffffff; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 5px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <span>즉시 다운로드</span>
            </button>
            <a href="#downloads" class="btn-faq-doc-navigate" style="background-color: #ffffff; color: #1A3B6B; border: 1px solid #1A3B6B; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              <span>자료실 보기</span>
            </a>
          </div>
        </div>
      </div>

      <div class="faq-callout-box" data-box-type="tip" draggable="true" style="background-color: #F5F3FF; border-left: 4px solid #7C3AED; border-radius: 8px; padding: 14px 16px; margin: 14px 0; font-size: 13px; line-height: 1.6; position: relative;">
        <div class="box-action-bar" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; user-select: none;">
          <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #475569; background: #EDE9FE; padding: 2px 8px; border-radius: 4px; cursor: grab;">
            <span>⠿ 드래그 이동</span>
            <span style="color: #94A3B8;">|</span>
            <button type="button" class="btn-block-move-up" title="위로 이동" style="background: white; border: 1px solid #DDD6FE; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▲ 위로</button>
            <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: white; border: 1px solid #DDD6FE; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▼ 아래로</button>
          </div>
          <button type="button" class="btn-delete-callout-box" title="박스 삭제" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
            <span>박스 삭제 ✕</span>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #7C3AED; margin-bottom: 6px; font-size: 13.5px;">
          <span>💡</span><span>출석률 기준 꿀팁</span>
        </div>
        <div>직전 학기 출석률이 80% 미만인 경우 비자 연장에 제한이 있거나 사유서를 요구받을 수 있으니 사전에 행정실 담당 선생님과 상담 바랍니다.</div>
      </div>
    `,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-15T10:00:00.000Z',
    authorId: 'admin',
  },
  {
    id: 'faq-attendance-completion',
    category: 'attendance',
    title: '한국어학당 정규과정 수료 및 공결(병결) 승인 처리 기준',
    pinned: false,
    hidden: false,
    views: 310,
    relatedDocumentIds: ['doc-absence-leave'],
    content: `
      <div class="faq-callout-box" data-box-type="warning" draggable="true" style="background-color: #FFFBEB; border-left: 4px solid #D97706; border-radius: 8px; padding: 14px 16px; margin: 14px 0; font-size: 13px; line-height: 1.6; position: relative;">
        <div class="box-action-bar" contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; user-select: none;">
          <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; color: #475569; background: #FEF3C7; padding: 2px 8px; border-radius: 4px; cursor: grab;">
            <span>⠿ 드래그 이동</span>
            <span style="color: #94A3B8;">|</span>
            <button type="button" class="btn-block-move-up" title="위로 이동" style="background: white; border: 1px solid #FDE68A; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▲ 위로</button>
            <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: white; border: 1px solid #FDE68A; border-radius: 3px; cursor: pointer; color: #1E293B; padding: 1px 5px; font-size: 10px; font-weight: bold;">▼ 아래로</button>
          </div>
          <button type="button" class="btn-delete-callout-box" title="박스 삭제" style="background: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
            <span>박스 삭제 ✕</span>
          </button>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: #D97706; margin-bottom: 6px; font-size: 13.5px;">
          <span>⚠️</span><span>수료 요건: 출석률 80% 이상 필수</span>
        </div>
        <div>한국어학당 정규과정 한 학기 총 수업일수(200시간) 중 <strong>80% 이상 출석</strong>해야 수료증이 발급되며 다음 학기 진급이 가능합니다.</div>
      </div>

      <p>질병으로 결석한 경우 병원 진료확인서 또는 진단서를 발급받아 아래 공결(병결) 승인 신청서와 함께 3일 이내에 행정실에 제출해야 공결 처리됩니다.</p>

      <div class="faq-doc-shortcut-card" data-doc-id="doc-absence-leave" draggable="true" style="background-color: #F0F5FA; border: 1.5px solid #1A3B6B; border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; flex-direction: column; gap: 8px; font-family: inherit; position: relative;">
        <div contenteditable="false" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 600; color: #1A3B6B; background: #DBEAFE; padding: 2px 7px; border-radius: 4px; cursor: grab; user-select: none;">
              <span>⠿ 이동</span>
              <button type="button" class="btn-block-move-up" title="위로 이동" style="background: white; border: 1px solid #93C5FD; border-radius: 3px; cursor: pointer; color: #1E40AF; padding: 1px 4px; font-size: 10px; font-weight: bold;">▲</button>
              <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: white; border: 1px solid #93C5FD; border-radius: 3px; cursor: pointer; color: #1E40AF; padding: 1px 4px; font-size: 10px; font-weight: bold;">▼</button>
            </div>
            <span style="background-color: #1A3B6B; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px;">서식 및 자료실</span>
            <span style="background-color: #0284C7; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">HWP</span>
            <span style="font-size: 11px; color: #64748B;">[출결/수료]</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 500;">용량: 92 KB</span>
            <button type="button" class="btn-delete-doc-shortcut" data-doc-id="doc-absence-leave" title="서식자료실 연동 카드 삭제" style="background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 3px 8px; font-size: 10.5px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
              <span>연동 삭제 ✕</span>
            </button>
          </div>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; font-size: 13.5px; color: #0F254A;">📄 [양식] 한국어학당 결석 공결(병결) 승인 신청서</div>
            <div style="font-size: 11.5px; color: #475569; margin-top: 2px;">질병 또는 부득이한 사유로 결석 시 진료확인서를 첨부하여 행정실(동영관 101호)에 제출하는 공식 양식입니다.</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-faq-doc-download" data-doc-id="doc-absence-leave" style="background-color: #1A3B6B; color: #ffffff; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 5px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <span>즉시 다운로드</span>
            </button>
            <a href="#downloads" class="btn-faq-doc-navigate" style="background-color: #ffffff; color: #1A3B6B; border: 1px solid #1A3B6B; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              <span>자료실 보기</span>
            </a>
          </div>
        </div>
      </div>
    `,
    createdAt: '2026-03-02T10:00:00.000Z',
    updatedAt: '2026-03-16T10:00:00.000Z',
    authorId: 'admin',
  },
];


