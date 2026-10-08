export type Language = 'ko' | 'en' | 'vi' | 'mn' | 'zh';

export type FaqCategory = 'attendance' | 'visa' | 'dormitory' | 'admin' | 'life' | (string & {});

export type SearchButtonShape = 'square' | 'rounded' | 'pill';
export type SearchButtonSize = 'sm' | 'md' | 'lg';

export interface RelatedSite {
  id: string;
  name: string;
  nameEn?: string;
  url: string;
  badge?: string;
  desc?: string;
}

export interface CategoryItem {
  id: string;
  name: {
    ko: string;
    en?: string;
    vi?: string;
    mn?: string;
    zh?: string;
  };
  icon: string;
}

export interface FaqItem {
  id: string;
  category: FaqCategory;
  title: string;
  content: string;
  pinned: boolean;
  hidden?: boolean;
  order?: number;
  views?: number;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
}

export type DocumentFileType = 'pdf' | 'hwp' | 'docx' | 'xlsx';

export interface DocumentItem {
  id: string;
  category: string;
  title: string;
  description: string;
  fileType: DocumentFileType;
  fileName: string;
  fileSize: string;
  downloadUrl: string;
  hidden?: boolean;
  order?: number;
  createdAt: string;
  updatedAt?: string;
}

export type ScheduleTerm = 'spring' | 'summer' | 'fall' | 'winter' | 'special';
export type ScheduleEventType = 'academic' | 'exam' | 'holiday' | 'activity' | 'admission';

export interface ScheduleEvent {
  id: string;
  title: string;
  titleEn?: string;
  year?: number; // 년도 구분 (예: 2025, 2026)
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  term: ScheduleTerm; // 봄학기, 여름학기, 가을학기, 겨울학기, 특별과정
  type: ScheduleEventType; // academic: 학사/수업, exam: 시험/평가, holiday: 휴일/방학, activity: 문화체험, admission: 모집/등록
  time?: string;
  location?: string;
  description?: string;
  important?: boolean;
  hidden?: boolean;
  order?: number;
  createdAt: string;
  updatedAt: string;
}

export const getScheduleYear = (event: Partial<ScheduleEvent>): number => {
  if (event.year) return event.year;
  if (event.startDate) {
    const y = parseInt(event.startDate.slice(0, 4), 10);
    if (!isNaN(y)) return y;
  }
  return 2026;
};

export type InquiryStatus = 'pending' | 'resolved';

export interface InquiryItem {
  id: string;
  studentId: string;
  name: string;
  phone?: string; // 연락처 (선택 사항)
  content: string;
  status: InquiryStatus;
  adminNote?: string;
  hidden?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LogoType = 'none' | 'text' | 'image' | 'symbol_text';
export type PopupStyle = 'modal' | 'banner';
export type PopupIconType = 'bell' | 'alert' | 'calendar' | 'info';

export interface SiteConfig {
  mainColor: string;
  accentColor: string;
  warnColor: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  bgType: 'color' | 'campus';
  campusBgUrl?: string;
  // Logo Design Features
  logoType?: LogoType;
  logoText?: string;
  logoSubText?: string;
  logoTextColor?: string;
  logoFontWeight?: 'bold' | 'black' | 'medium';
  logoUrl?: string;
  logoHeight: number;
  logoSymbolIcon?: 'university' | 'graduation' | 'book' | 'shield' | 'globe';
  showLogoTitle?: boolean; // 로고 옆 메인 타이틀/배너 표시 여부 (기본: true)
  showHeroBanner?: boolean; // 포털 메인 배너 표시 여부 (기본: true)
  // Popup Notice Features & Design
  popupEnabled?: boolean;
  popupTitle?: string;
  popupBadge?: string;
  popupContent?: string;
  popupColor?: string;
  popupStyle?: PopupStyle;
  popupIcon?: PopupIconType;
  popupLinkText?: string;
  popupLinkTab?: 'faq' | 'downloads' | 'inquiry' | 'schedule' | '';
  popupLinkUrl?: string;
  // Search Button & Search Bar Design
  searchButtonText?: string;
  searchButtonSize?: SearchButtonSize;
  searchButtonShape?: SearchButtonShape;
  searchButtonRadius?: number;
  searchButtonColor?: string;
  searchButtonShowIcon?: boolean;
  searchButtonIconType?: 'search' | 'arrow' | 'sparkles';
  searchBarRadius?: number;
  fontSize: 'standard' | 'large';
  fontFamily?: 'noto' | 'pretendard' | 'nanum' | 'gowun' | 'inter' | 'system';
  fontSizeScale?: 'compact' | 'standard' | 'large' | 'xlarge';
  fontHeadingWeight?: 'medium' | 'bold' | 'black';
  fontLineHeight?: 'compact' | 'normal' | 'spacious';
  borderRadius: number;
  officeHours: string;
  phone: string;
  email: string;
  location: string;
  showInstagram: boolean;
  showYoutube: boolean;
  instagramUrl?: string;
  youtubeUrl?: string;
  // Related Foreign Student Sites
  showRelatedSites?: boolean;
  relatedSites?: RelatedSite[];
  // Academic Calendar Settings (현재 학기 정보 설정)
  currentAcademicYear?: number;
  currentAcademicTerm?: ScheduleTerm;
  categories: CategoryItem[];
  // Chatbot Settings
  chatbotEnabled?: boolean;
  chatbotName?: string;
  chatbotSubtitle?: string;
  chatbotWelcomeMsg?: string;
  chatbotPlaceholder?: string;
  chatbotColor?: string;
  chatbotBadgeText?: string;
  chatbotSuggestions?: string[];
  chatbotNoMatchMsg?: string;
  chatbotShowInquiryOnNoMatch?: boolean;
  // 1:1 Quick Inquiry Settings
  inquiryEnabled?: boolean;
  inquiryTitle?: string;
  inquirySubtitle?: string;
  inquiryBadgeText?: string;
  inquiryNotice?: string;
  inquiryStudentIdLabel?: string;
  inquiryStudentIdPlaceholder?: string;
  inquiryNameLabel?: string;
  inquiryNamePlaceholder?: string;
  inquiryPhoneLabel?: string;
  inquiryPhonePlaceholder?: string;
  inquiryContentLabel?: string;
  inquiryContentPlaceholder?: string;
  inquiryMinLength?: number;
  inquiryMaxLength?: number;
  inquiryEnableQuiz?: boolean;
  inquiryPrivacyNotice?: string;
  inquiryPrivacyConsentText?: string;
  inquirySuccessTitle?: string;
  inquirySuccessDesc?: string;
  inquiryPausedNotice?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ConfigArchiveItem {
  id: string;
  timestamp: string;
  title: string;
  author?: string;
  note?: string;
  configSnapshot: SiteConfig;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'editor';
  department?: string;
  phone?: string;
  note?: string;
  createdAt: string;
  lastLoginAt?: string;
}
