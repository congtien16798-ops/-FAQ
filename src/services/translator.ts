import { Language, CategoryItem } from '../types';
import { translations } from '../constants/translations';

// In-memory cache for fast instant rendering across the app
const memoryCache: Record<string, string> = {};

// Load cache from localStorage
try {
  const saved = localStorage.getItem('kmu_auto_translations');
  if (saved) {
    Object.assign(memoryCache, JSON.parse(saved));
  }
} catch {
  // ignore
}

let persistTimeout: any = null;
const persistCache = () => {
  if (persistTimeout) return;
  persistTimeout = setTimeout(() => {
    try {
      localStorage.setItem('kmu_auto_translations', JSON.stringify(memoryCache));
    } catch {
      // ignore storage quota errors
    }
    persistTimeout = null;
  }, 1000);
};

// Language code mapping for Google Translate API
const langMap: Record<Language, string> = {
  ko: 'ko',
  en: 'en',
  vi: 'vi',
  mn: 'mn',
  zh: 'zh-CN',
};

// Queue for pending translation requests to prevent duplicate in-flight fetches
const pendingRequests = new Map<string, Promise<string>>();

/**
 * Translates a single plain text from sourceLang (default 'ko') to targetLang (en, vi, mn, zh).
 * If targetLang === sourceLang or text is empty, returns original text immediately.
 */
export async function translateText(
  text: string,
  targetLang: Language,
  sourceLang: string = 'ko'
): Promise<string> {
  if (!text || !text.trim() || targetLang === sourceLang) {
    return text;
  }

  const trimmed = text.trim();
  const cacheKey = `${sourceLang}->${targetLang}:${trimmed}`;

  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey)!;
  }

  // Handle long text chunking to prevent HTTP 414 URI Too Long errors
  if (trimmed.length > 700) {
    const lines = trimmed.split('\n');
    const chunks: string[] = [];
    let currentChunk = '';

    for (const line of lines) {
      if ((currentChunk + '\n' + line).length > 600 && currentChunk) {
        chunks.push(currentChunk);
        currentChunk = line;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n' + line : line;
      }
    }
    if (currentChunk) chunks.push(currentChunk);

    if (chunks.length > 1) {
      const fetchPromise = (async () => {
        try {
          const translatedChunks = await Promise.all(
            chunks.map((chunk) => translateText(chunk, targetLang, sourceLang))
          );
          const joined = translatedChunks.join('\n');
          memoryCache[cacheKey] = joined;
          persistCache();
          return joined;
        } catch (err) {
          console.warn(`[AutoTranslator] Chunk translation failed for [${targetLang}]:`, err);
          return text;
        } finally {
          pendingRequests.delete(cacheKey);
        }
      })();

      pendingRequests.set(cacheKey, fetchPromise);
      return fetchPromise;
    }
  }

  const tl = langMap[targetLang] || 'en';
  const sl = sourceLang === 'ko' ? 'ko' : sourceLang;

  const fetchPromise = (async () => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(
        trimmed
      )}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Translation HTTP error: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts = data[0].map((item: any[]) => item[0]);
        const fullTranslated = translatedParts.join('');
        if (fullTranslated) {
          memoryCache[cacheKey] = fullTranslated;
          persistCache();
          return fullTranslated;
        }
      }
      return text;
    } catch (err) {
      console.warn(`[AutoTranslator] Translation failed for [${targetLang}], using original:`, err);
      return text;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Translates multiple texts in parallel with deduplication.
 */
export async function translateTexts(
  texts: string[],
  targetLang: Language,
  sourceLang: string = 'ko'
): Promise<string[]> {
  if (targetLang === sourceLang) return texts;
  return Promise.all(texts.map((t) => translateText(t, targetLang, sourceLang)));
}

/**
 * Safely translates HTML content by parsing DOM and translating only the text nodes.
 * This guarantees 100% preservation of all HTML tags, classes, styles, and attributes.
 */
export async function translateHtml(
  html: string,
  targetLang: Language,
  sourceLang: string = 'ko'
): Promise<string> {
  if (!html || !html.trim() || targetLang === sourceLang) {
    return html;
  }

  // If there are no HTML tags, use plain translateText
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return translateText(html, targetLang, sourceLang);
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');

    // Collect all text nodes with actual non-whitespace content
    const textNodes: Node[] = [];
    const walker = document.createTreeWalker(
      doc.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          return node.nodeValue && node.nodeValue.trim().length > 0
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode);
      currentNode = walker.nextNode();
    }

    if (textNodes.length === 0) {
      return html;
    }

    // Extract unique strings
    const uniqueTexts = Array.from(new Set(textNodes.map((n) => n.nodeValue!.trim())));
    const translations = await translateTexts(uniqueTexts, targetLang, sourceLang);

    const transMap = new Map<string, string>();
    uniqueTexts.forEach((txt, idx) => {
      transMap.set(txt, translations[idx]);
    });

    // Replace text node values preserving leading/trailing spaces
    for (const node of textNodes) {
      const original = node.nodeValue || '';
      const trimmed = original.trim();
      const translated = transMap.get(trimmed);
      if (translated) {
        const leading = original.match(/^\s*/)?.[0] || '';
        const trailing = original.match(/\s*$/)?.[0] || '';
        node.nodeValue = `${leading}${translated}${trailing}`;
      }
    }

    return doc.body.innerHTML;
  } catch (err) {
    console.warn('[AutoTranslator] Failed to parse HTML for translation:', err);
    return html;
  }
}

// High-frequency international student terms lexicon for instant zero-latency multi-lingual search
export const MULTI_LANG_SEARCH_LEXICON: Record<string, { ko: string; lang: Language }> = {
  // Vietnamese (vi)
  'gia han visa': { ko: '비자 연장 외국인등록증 체류기간', lang: 'vi' },
  'gia hạn visa': { ko: '비자 연장 외국인등록증 체류기간', lang: 'vi' },
  'gia han': { ko: '비자 연장 기한연장', lang: 'vi' },
  'gia hạn': { ko: '비자 연장 기한연장', lang: 'vi' },
  'ky tuc xa': { ko: '기숙사 생활관 외박 퇴사', lang: 'vi' },
  'ký túc xá': { ko: '기숙사 생활관 외박 퇴사', lang: 'vi' },
  'ky tuc': { ko: '기숙사 생활관', lang: 'vi' },
  'ký túc': { ko: '기숙사 생활관', lang: 'vi' },
  'ngoai tru': { ko: '외박 기숙사 외박신청', lang: 'vi' },
  'ngoại trú': { ko: '외박 기숙사 외박신청', lang: 'vi' },
  'diem danh': { ko: '출석 출석률 80% 결석', lang: 'vi' },
  'điểm danh': { ko: '출석 출석률 80% 결석', lang: 'vi' },
  'chuyen can': { ko: '출석률 근태 성실도', lang: 'vi' },
  'chuyên cần': { ko: '출석률 근태 성실도', lang: 'vi' },
  'nghi hoc': { ko: '결석 휴학 공결 병결', lang: 'vi' },
  'nghỉ học': { ko: '결석 휴학 공결 병결', lang: 'vi' },
  'hoc bong': { ko: '장학금 성적장학금 면제', lang: 'vi' },
  'học bổng': { ko: '장학금 성적장학금 면제', lang: 'vi' },
  'hoc phi': { ko: '등록금 수업료 고지서', lang: 'vi' },
  'học phí': { ko: '등록금 수업료 고지서', lang: 'vi' },
  'thoi khoa bieu': { ko: '한국어학당 일정 학사일정 수업시간표', lang: 'vi' },
  'thời khóa biểu': { ko: '한국어학당 일정 학사일정 수업시간표', lang: 'vi' },
  'lich hoc': { ko: '한국어학당 일정 학사일정 수업', lang: 'vi' },
  'lịch học': { ko: '한국어학당 일정 학사일정 수업', lang: 'vi' },
  'lich': { ko: '한국어학당 일정 캘린더', lang: 'vi' },
  'lịch': { ko: '한국어학당 일정 캘린더', lang: 'vi' },
  'hoc ky': { ko: '학기 정규학기', lang: 'vi' },
  'học kỳ': { ko: '학기 정규학기', lang: 'vi' },
  'mua xuan': { ko: '봄학기 3월 개강', lang: 'vi' },
  'mùa xuân': { ko: '봄학기 3월 개강', lang: 'vi' },
  'mua he': { ko: '여름학기 6월', lang: 'vi' },
  'mùa hè': { ko: '여름학기 6월', lang: 'vi' },
  'mua thu': { ko: '가을학기 9월 개강', lang: 'vi' },
  'mùa thu': { ko: '가을학기 9월 개강', lang: 'vi' },
  'mua dong': { ko: '겨울학기 12월', lang: 'vi' },
  'mùa đông': { ko: '겨울학기 12월', lang: 'vi' },
  'thi': { ko: '시험 중간고사 기말고사 평가', lang: 'vi' },
  'kiem tra': { ko: '시험 레벨테스트 평가', lang: 'vi' },
  'kiểm tra': { ko: '시험 레벨테스트 평가', lang: 'vi' },
  'bao hiem': { ko: '국민건강보험 유학생보험 병원', lang: 'vi' },
  'bảo hiểm': { ko: '국민건강보험 유학생보험 병원', lang: 'vi' },
  'ngan hang': { ko: '은행 계좌 통장 계명대', lang: 'vi' },
  'ngân hàng': { ko: '은행 계좌 통장 계명대', lang: 'vi' },
  'don xin': { ko: '신청서 서식 다운로드 서류', lang: 'vi' },
  'đơn xin': { ko: '신청서 서식 다운로드 서류', lang: 'vi' },
  'tai ve': { ko: '서식 다운로드 서식자료실', lang: 'vi' },
  'tải về': { ko: '서식 다운로드 서식자료실', lang: 'vi' },
  'tot nghiep': { ko: '수료 졸업 수료식', lang: 'vi' },
  'tốt nghiệp': { ko: '수료 졸업 수료식', lang: 'vi' },

  // Chinese (zh)
  '签证延期': { ko: '비자 연장 외국인등록증 출입국', lang: 'zh' },
  '签证': { ko: '비자 D-4 외국인등록증', lang: 'zh' },
  '续签': { ko: '비자 연장 체류기간 연장', lang: 'zh' },
  '宿舍': { ko: '기숙사 생활관 외박신청 퇴사', lang: 'zh' },
  '学生宿舍': { ko: '기숙사 생활관', lang: 'zh' },
  '外宿': { ko: '기숙사 외박 외박신청', lang: 'zh' },
  '退宿': { ko: '기숙사 퇴사 환불', lang: 'zh' },
  '出勤': { ko: '출석 출석률 80% 결석', lang: 'zh' },
  '出勤率': { ko: '출석률 80% 최소 출석', lang: 'zh' },
  '旷课': { ko: '결석 무단결석', lang: 'zh' },
  '缺勤': { ko: '결석 병결 공결', lang: 'zh' },
  '请假': { ko: '공결 신청서 휴학', lang: 'zh' },
  '奖学金': { ko: '장학금 성적장학금 수혜', lang: 'zh' },
  '学费': { ko: '등록금 수업료 납부 고지서', lang: 'zh' },
  '学费缴纳': { ko: '등록금 가상계좌 납부', lang: 'zh' },
  '日程表': { ko: '한국어학당 일정 학사일정 캘린더', lang: 'zh' },
  '校历': { ko: '한국어학당 일정 학사일정', lang: 'zh' },
  '日程': { ko: '한국어학당 일정', lang: 'zh' },
  '学期': { ko: '학기 정규학기', lang: 'zh' },
  '春季学期': { ko: '봄학기 3월 개강', lang: 'zh' },
  '夏季学期': { ko: '여름학기 6월', lang: 'zh' },
  '秋季学期': { ko: '가을학기 9월 개강', lang: 'zh' },
  '冬季学期': { ko: '겨울학기 12월', lang: 'zh' },
  '春季': { ko: '봄학기', lang: 'zh' },
  '夏季': { ko: '여름학기', lang: 'zh' },
  '秋季': { ko: '가을학기', lang: 'zh' },
  '冬季': { ko: '겨울학기', lang: 'zh' },
  '开学': { ko: '개강 수업 시작', lang: 'zh' },
  '放假': { ko: '종강 방학 휴일', lang: 'zh' },
  '考试': { ko: '시험 중간고사 기말고사 평가', lang: 'zh' },
  '分班考试': { ko: '레벨테스트 분반평가', lang: 'zh' },
  '保险': { ko: '국민건강보험 유학생보험', lang: 'zh' },
  '健康保险': { ko: '국민건강보험 공단', lang: 'zh' },
  '银行': { ko: '은행 계좌 통장 개설', lang: 'zh' },
  '存款证明': { ko: '잔고증명서 은행 잔고', lang: 'zh' },
  '表格': { ko: '서식 자료실 신청서 다운로드', lang: 'zh' },
  '申请书': { ko: '신청서 서식 다운로드', lang: 'zh' },
  '下载': { ko: '서식 다운로드', lang: 'zh' },
  '在学证明': { ko: '재학증명서 증명서 발급', lang: 'zh' },
  '结业': { ko: '수료식 수료증 졸업', lang: 'zh' },

  // Mongolian (mn)
  'виз сунгах': { ko: '비자 연장 외국인등록증', lang: 'mn' },
  'виз': { ko: '비자 D-4 연장', lang: 'mn' },
  'дотуур байр': { ko: '기숙사 생활관 외박', lang: 'mn' },
  'байр': { ko: '기숙사 생활관', lang: 'mn' },
  'ирц': { ko: '출석 출석률 80% 결석', lang: 'mn' },
  'хичээл таслах': { ko: '결석 공결 무단결석', lang: 'mn' },
  'чөлөө': { ko: '공결 신청 휴학', lang: 'mn' },
  'тэтгэлэг': { ko: '장학금 성적장학금', lang: 'mn' },
  'сургалтын төлбөр': { ko: '등록금 수업료 납부', lang: 'mn' },
  'төлбөр': { ko: '등록금 납부 고지서', lang: 'mn' },
  'хуваарь': { ko: '한국어학당 일정 학사일정', lang: 'mn' },
  'хичээлийн хуваарь': { ko: '한국어학당 일정 시간표 수업', lang: 'mn' },
  'хаврын улирал': { ko: '봄학기 3월', lang: 'mn' },
  'зуны улирал': { ko: '여름학기 6월', lang: 'mn' },
  'намрын улирал': { ko: '가을학기 9월', lang: 'mn' },
  'өвлийн улирал': { ko: '겨울학기 12월', lang: 'mn' },
  'шалгалт': { ko: '시험 중간고사 기말고사 평가', lang: 'mn' },
  'түвшин тогтоох': { ko: '레벨테스트 분반평가', lang: 'mn' },
  'даатгал': { ko: '국민건강보험 보험료', lang: 'mn' },
  'банк': { ko: '은행 계좌 통장', lang: 'mn' },
  'маягт': { ko: '서식 자료실 신청서 다운로드', lang: 'mn' },
  'өргөдөл': { ko: '신청서 서식 다운로드', lang: 'mn' },
  'татаж авах': { ko: '서식 다운로드', lang: 'mn' },
  'төгсөлт': { ko: '수료식 졸업 수료증', lang: 'mn' },

  // English (en)
  'visa extension': { ko: '비자 연장 외국인등록증 체류기간', lang: 'en' },
  'extend visa': { ko: '비자 연장 체류기간', lang: 'en' },
  'visa': { ko: '비자 D-4 외국인등록증', lang: 'en' },
  'alien registration': { ko: '외국인등록증 출입국', lang: 'en' },
  'arc': { ko: '외국인등록증 체류카드', lang: 'en' },
  'dormitory': { ko: '기숙사 생활관 외박 퇴사', lang: 'en' },
  'dorm': { ko: '기숙사 생활관', lang: 'en' },
  'overnight stay': { ko: '기숙사 외박 외박신청', lang: 'en' },
  'leave dorm': { ko: '기숙사 퇴사 환불', lang: 'en' },
  'attendance': { ko: '출석 출석률 80% 결석', lang: 'en' },
  'attendance rate': { ko: '출석률 80% 최소기준', lang: 'en' },
  'absent': { ko: '결석 공결 병결', lang: 'en' },
  'absence': { ko: '결석 공결 휴학', lang: 'en' },
  'scholarship': { ko: '장학금 성적장학금 감면', lang: 'en' },
  'tuition': { ko: '등록금 수업료 고지서', lang: 'en' },
  'tuition fee': { ko: '등록금 납부 가상계좌', lang: 'en' },
  'schedule': { ko: '한국어학당 일정 학사일정 캘린더', lang: 'en' },
  'calendar': { ko: '한국어학당 일정 캘린더 연간 월간', lang: 'en' },
  'academic calendar': { ko: '한국어학당 일정 학사일정', lang: 'en' },
  'spring semester': { ko: '봄학기 3월 개강', lang: 'en' },
  'summer semester': { ko: '여름학기 6월', lang: 'en' },
  'fall semester': { ko: '가을학기 9월 개강', lang: 'en' },
  'winter semester': { ko: '겨울학기 12월', lang: 'en' },
  'spring term': { ko: '봄학기', lang: 'en' },
  'summer term': { ko: '여름학기', lang: 'en' },
  'fall term': { ko: '가을학기', lang: 'en' },
  'winter term': { ko: '겨울학기', lang: 'en' },
  'exam': { ko: '시험 중간고사 기말고사 평가', lang: 'en' },
  'test': { ko: '시험 평가 레벨테스트', lang: 'en' },
  'level test': { ko: '레벨테스트 분반평가', lang: 'en' },
  'insurance': { ko: '국민건강보험 보험료 병원', lang: 'en' },
  'health insurance': { ko: '국민건강보험 공단', lang: 'en' },
  'bank': { ko: '은행 계좌 통장 개설', lang: 'en' },
  'bank account': { ko: '은행 계좌 통장', lang: 'en' },
  'form': { ko: '서식 신청서 자료실 다운로드', lang: 'en' },
  'forms': { ko: '서식자료실 신청서 양식', lang: 'en' },
  'download': { ko: '서식 다운로드 서류', lang: 'en' },
  'application': { ko: '신청서 서식 다운로드', lang: 'en' },
  'certificate': { ko: '재학증명서 성적증명서 수료증', lang: 'en' },
  'graduation': { ko: '수료식 졸업 수료증', lang: 'en' },
  'completion': { ko: '수료식 수료 수료증 발급', lang: 'en' },
};

/**
 * Detect language of input string
 * Supports Korean, Chinese, Mongolian, Vietnamese, English
 */
export function detectLanguage(text: string, fallback: Language = 'ko'): Language {
  if (!text || !text.trim()) return fallback;
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Check lexicon first for exact or partial phrase match
  for (const [phrase, entry] of Object.entries(MULTI_LANG_SEARCH_LEXICON)) {
    if (lower === phrase || lower.includes(phrase)) {
      return entry.lang;
    }
  }

  // 1. Hangul (Korean)
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(trimmed)) {
    return 'ko';
  }

  // 2. Chinese (Hanzi)
  if (/[\u4E00-\u9FFF]/.test(trimmed)) {
    return 'zh';
  }

  // 3. Cyrillic (Mongolian)
  if (/[\u0400-\u04FF]/.test(trimmed)) {
    return 'mn';
  }

  // 4. Vietnamese (Latin with unique Vietnamese diacritics)
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(trimmed)) {
    return 'vi';
  }

  // 5. Check common unaccented Vietnamese phrases and tokens
  const viTokens = [
    'gia han', 'ky tuc', 'hoc phi', 'diem danh', 'sinh vien', 'thoi gian',
    'lich hoc', 'dong tien', 'hoc bong', 'chuyen can', 'nghi hoc', 'vang mat',
    'thoi khoa bieu', 'ngoai tru', 'bao hiem', 'ngan hang', 'don xin', 'tai ve',
    'tot nghiep', 'dang ky', 'thong bao', 'nhap hoc', 'lop hoc', 'giao vien'
  ];
  if (viTokens.some((tok) => lower.includes(tok))) {
    return 'vi';
  }

  // 6. English / Latin alphabet
  if (/[a-zA-Z]/.test(trimmed)) {
    return 'en';
  }

  return fallback;
}

export interface LanguageMeta {
  code: Language;
  nameKo: string;
  nameNative: string;
  flag: string;
}

export function getLangMeta(lang: Language): LanguageMeta {
  switch (lang) {
    case 'vi':
      return { code: 'vi', nameKo: '베트남어', nameNative: 'Tiếng Việt', flag: '🇻🇳' };
    case 'zh':
      return { code: 'zh', nameKo: '중국어', nameNative: '简体中文', flag: '🇨🇳' };
    case 'mn':
      return { code: 'mn', nameKo: '몽골어', nameNative: 'Монгол хэл', flag: '🇲🇳' };
    case 'en':
      return { code: 'en', nameKo: '영어', nameNative: 'English', flag: '🇺🇸' };
    case 'ko':
    default:
      return { code: 'ko', nameKo: '한국어', nameNative: '한국어', flag: '🇰🇷' };
  }
}

export interface SearchQueryDetection {
  originalQuery: string;
  detectedLang: Language;
  translatedKorean: string;
  searchKeywords: string[];
  langMeta: LanguageMeta;
}

/**
 * Automatically detects the language of a search query and translates it to Korean
 * for matching against Korean content in the portal database.
 */
export async function detectAndTranslateSearchQuery(
  query: string
): Promise<SearchQueryDetection> {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      originalQuery: query,
      detectedLang: 'ko',
      translatedKorean: '',
      searchKeywords: [],
      langMeta: getLangMeta('ko'),
    };
  }

  const detected = detectLanguage(trimmed, 'ko');
  const langMeta = getLangMeta(detected);
  const lower = trimmed.toLowerCase();

  // 1. Check local lexicon for instant zero-latency exact or partial match
  let lexiconMatch: string | null = null;
  for (const [key, val] of Object.entries(MULTI_LANG_SEARCH_LEXICON)) {
    if (lower === key || lower.includes(key) || key.includes(lower)) {
      lexiconMatch = val.ko;
      break;
    }
  }

  if (detected === 'ko') {
    return {
      originalQuery: trimmed,
      detectedLang: 'ko',
      translatedKorean: trimmed,
      searchKeywords: [trimmed],
      langMeta,
    };
  }

  // If matched in lexicon, combine with query
  if (lexiconMatch) {
    const kws = Array.from(new Set([trimmed, ...lexiconMatch.split(/\s+/)])).filter(Boolean);
    return {
      originalQuery: trimmed,
      detectedLang: detected,
      translatedKorean: lexiconMatch,
      searchKeywords: kws,
      langMeta,
    };
  }

  // 2. Fallback to Google Translation API
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ko&dt=t&q=${encodeURIComponent(
      trimmed
    )}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      let translated = '';
      if (Array.isArray(data) && Array.isArray(data[0])) {
        translated = data[0].map((item: any[]) => item[0]).join('');
      }

      // Check if Google's detected language differs
      let finalLang = detected;
      const apiDetected = data?.[2];
      if (apiDetected) {
        if (apiDetected.startsWith('vi')) finalLang = 'vi';
        else if (apiDetected.startsWith('zh')) finalLang = 'zh';
        else if (apiDetected.startsWith('mn')) finalLang = 'mn';
        else if (apiDetected.startsWith('en')) finalLang = 'en';
      }

      const finalKo = (translated || trimmed).trim();
      const kws = Array.from(new Set([trimmed, ...finalKo.split(/\s+/)])).filter(Boolean);

      return {
        originalQuery: trimmed,
        detectedLang: finalLang,
        translatedKorean: finalKo,
        searchKeywords: kws,
        langMeta: getLangMeta(finalLang),
      };
    }
  } catch (err) {
    console.warn('[AutoTranslator] Failed to detect/translate search query:', err);
  }

  return {
    originalQuery: trimmed,
    detectedLang: detected,
    translatedKorean: trimmed,
    searchKeywords: [trimmed],
    langMeta,
  };
}

/**
 * Normalizes category keys across Korean and English representations.
 */
export function normalizeCategory(cat: string | undefined | null): string {
  if (!cat) return '';
  const c = cat.trim().toLowerCase();
  if (c === 'all' || c === '전체' || c === '전체보기') return 'all';
  if (c === 'attendance' || c === '출결/수업' || c === '출결' || c === '수업') return 'attendance';
  if (c === 'visa' || c === '비자/체류' || c === '비자' || c === '체류') return 'visa';
  if (c === 'dormitory' || c === '기숙사' || c === '생활관') return 'dormitory';
  if (c === 'admin' || c === '행정/증명서' || c === '행정' || c === '증명서') return 'admin';
  if (c === 'life' || c === '유학생활' || c === '생활') return 'life';
  return c;
}

/**
 * Checks whether two category identifiers or labels match.
 */
export function matchCategory(catA: string | undefined | null, catB: string | undefined | null): boolean {
  if (!catA || !catB) return false;
  const normA = normalizeCategory(catA);
  const normB = normalizeCategory(catB);
  if (normA === 'all' || normB === 'all') return true;
  return normA === normB || catA === catB;
}

/**
 * Universal category translation helper guaranteeing instant, 100% reliable translation
 * across Korean, English, Vietnamese, Chinese, and Mongolian with zero latency.
 */
export function getTranslatedCategory(
  category: string | undefined | null,
  lang: Language,
  configCategories?: CategoryItem[]
): string {
  if (!category) return '';
  const trimmed = category.trim();
  const lower = trimmed.toLowerCase();
  const t = translations[lang] || translations.ko;

  if (lower === 'all' || trimmed === '전체' || trimmed === '전체보기') {
    return t.categoryAll || '전체보기';
  }
  if (lower === 'attendance' || trimmed === '출결/수업' || trimmed === '출결' || trimmed === '수업') {
    return t.catAttendance || '출결/수업';
  }
  if (lower === 'visa' || trimmed === '비자/체류' || trimmed === '비자' || trimmed === '체류') {
    return t.catVisa || '비자/체류';
  }
  if (lower === 'dormitory' || trimmed === '기숙사' || trimmed === '생활관') {
    return t.catDormitory || '기숙사';
  }
  if (lower === 'admin' || trimmed === '행정/증명서' || trimmed === '행정' || trimmed === '증명서') {
    return t.catAdmin || '행정/증명서';
  }
  if (lower === 'life' || trimmed === '유학생활' || trimmed === '생활') {
    return t.catLife || '유학생활';
  }

  // Check custom categories if defined
  if (configCategories && configCategories.length > 0) {
    const found = configCategories.find(
      (c) => c.id === trimmed || c.id.toLowerCase() === lower || c.name.ko === trimmed
    );
    if (found?.name) {
      if (lang !== 'ko' && found.name[lang] && found.name[lang] !== found.name.ko) {
        return found.name[lang]!;
      }
      return found.name.ko || trimmed;
    }
  }

  return trimmed;
}

