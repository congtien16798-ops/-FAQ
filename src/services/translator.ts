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
 * Post-processes Vietnamese translation to correct machine-translation inaccuracies
 * in Korean university, dormitory, and immigration administration contexts.
 */
export function refineVietnameseTranslation(text: string): string {
  if (!text) return text;
  let res = text;

  // 1. Dormitory checkout (퇴사) mistranslated as job resignation (từ chức / thôi việc / nghỉ việc)
  res = res.replace(/(?:đơn|thủ tục|hồ sơ|ngày|đăng ký|xin)\s+(?:xin\s+)?(?:thôi việc|từ chức|nghỉ việc)\s+(?:tại|ở)?\s*(?:ký túc xá|KTX)/gi, 'thủ tục trả phòng KTX (rời ký túc xá)');
  res = res.replace(/thôi việc tại ký túc xá|từ chức ký túc xá|nghỉ việc ký túc xá|thôi việc ktx/gi, 'trả phòng ký túc xá (rời KTX)');
  res = res.replace(/\b(?:thôi việc|từ chức|nghỉ việc)\b/gi, (match, offset, str) => {
    const context = str.slice(Math.max(0, offset - 40), Math.min(str.length, offset + 40));
    if (/ký túc xá|ktx|phòng|sinh hoạt|myeonggyo|명교/i.test(context)) {
      return 'trả phòng KTX';
    }
    return match;
  });

  // 2. Overnight stay outside dorm (외박)
  res = res.replace(/ngủ bên ngoài|ngủ ngoài/gi, 'nghỉ qua đêm ngoài KTX (ngoại trú)');
  res = res.replace(/đơn ngủ ngoài/gi, 'đơn xin nghỉ qua đêm ngoài KTX');

  // 3. Excused absence (공결) mistranslated as public holiday (kỳ nghỉ công cộng)
  res = res.replace(/kỳ nghỉ công cộng|nghỉ lễ công cộng/gi, 'nghỉ học có phép (công kết)');
  res = res.replace(/nghỉ phép chính thức/gi, 'nghỉ học có phép (công kết)');

  // 4. Illness absence (병결)
  res = res.replace(/kết hợp bệnh tật|bệnh tật kết hợp/gi, 'nghỉ ốm có giấy khám bệnh (병결)');

  // 5. Alien registration card (외국인등록증)
  res = res.replace(/chứng nhận đăng ký người nước ngoài/gi, 'Thẻ đăng ký người nước ngoài (ARC)');
  res = res.replace(/thẻ đăng ký người nước ngoài/gi, 'Thẻ đăng ký người nước ngoài (ARC)');

  // 6. Extension of stay (체류기간 연장)
  res = res.replace(/kéo dài thời gian ở lại|kéo dài thời gian cư trú/gi, 'gia hạn thời gian lưu trú (gia hạn visa)');
  res = res.replace(/thời gian ở lại/gi, 'thời gian lưu trú');

  // 7. Korean Language Institute (한국어학당)
  res = res.replace(/trường học tiếng Hàn|trường tiếng Hàn/gi, 'Viện Ngôn ngữ Hàn Quốc');
  res = res.replace(/học viện tiếng Hàn/gi, 'Viện Ngôn ngữ tiếng Hàn (한국어학당)');

  // 8. Tuition (등록금 / 수업료)
  res = res.replace(/phí đăng ký học kỳ/gi, 'học phí học kỳ');
  res = res.replace(/hóa đơn phí đăng ký|thông báo phí đăng ký/gi, 'thông báo nộp học phí');

  // 9. Merit scholarship (성적장학금)
  res = res.replace(/học bổng lớp/gi, 'học bổng thành tích học tập');

  // 10. Certificate of completion (수료증) & Graduation (수료식)
  res = res.replace(/chứng chỉ hoàn thành/gi, 'Giấy chứng nhận hoàn thành khóa học (수료증)');
  res = res.replace(/lễ hoàn thành khóa học/gi, 'Lễ bế giảng (수료식)');

  // 11. Certificate of enrollment (재학증명서)
  res = res.replace(/chứng nhận đang học|chứng chỉ đang học/gi, 'Giấy chứng nhận đang theo học (재학증명서)');

  // 12. Part-time employment permit (시간제취업허가서)
  res = res.replace(/giấy phép làm việc bán thời gian/gi, 'Giấy phép làm thêm (시간제 취업 허가서)');

  // 13. National Health Insurance (국민건강보험)
  res = res.replace(/bảo hiểm y tế quốc gia/gi, 'Bảo hiểm Y tế Quốc gia Hàn Quốc (NHIS)');

  // 14. Bank balance certificate (잔고증명서)
  res = res.replace(/chứng nhận số dư/gi, 'Giấy xác nhận số dư tài khoản ngân hàng (잔고증명서)');

  // 15. Keimyung campus names & buildings
  res = res.replace(/khuôn viên Daemyung/gi, 'Cơ sở Daemyung (대명캠퍼스)');
  res = res.replace(/khuôn viên Seongseo/gi, 'Cơ sở Seongseo (성서캠퍼스)');

  return res;
}

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

  // Handle long text chunking for huge articles
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
    // 1. Try server-side AI translation endpoint first (empowered by Gemini 3.8 Flash)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const apiRes = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, targetLang, sourceLang: sl }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && data.translated) {
          const finalResult = targetLang === 'vi' ? refineVietnameseTranslation(data.translated) : data.translated;
          memoryCache[cacheKey] = finalResult;
          persistCache();
          return finalResult;
        }
      }
    } catch {
      // Proceed to fallback
    }

    // 2. Fallback to Google Translate GTX endpoint + Domain Post-Processing
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
        let fullTranslated = translatedParts.join('');
        if (fullTranslated) {
          if (targetLang === 'vi') {
            fullTranslated = refineVietnameseTranslation(fullTranslated);
          }
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
  'be giang': { ko: '수료식 수료증 졸업', lang: 'vi' },
  'bế giảng': { ko: '수료식 수료증 졸업', lang: 'vi' },
  'the arc': { ko: '외국인등록증 체류카드 비자', lang: 'vi' },
  'the cu tru': { ko: '외국인등록증 체류카드 체류기간연장', lang: 'vi' },
  'thẻ cư trú': { ko: '외국인등록증 체류카드 체류기간연장', lang: 'vi' },
  'the ngoai kieu': { ko: '외국인등록증 체류카드', lang: 'vi' },
  'thẻ ngoại kiều': { ko: '외국인등록증 체류카드', lang: 'vi' },
  'tra phong ktx': { ko: '기숙사 퇴사 환불 생활관', lang: 'vi' },
  'trả phòng ktx': { ko: '기숙사 퇴사 환불 생활관', lang: 'vi' },
  'tra phong': { ko: '기숙사 퇴사 생활관', lang: 'vi' },
  'trả phòng': { ko: '기숙사 퇴사 생활관', lang: 'vi' },
  'roi ktx': { ko: '기숙사 퇴사 환불', lang: 'vi' },
  'rời ktx': { ko: '기숙사 퇴사 환불', lang: 'vi' },
  'lam them': { ko: '시간제취업 아르바이트 체류자격외활동허가', lang: 'vi' },
  'làm thêm': { ko: '시간제취업 아르바이트 체류자격외활동허가', lang: 'vi' },
  'part time': { ko: '시간제취업 아르바이트', lang: 'vi' },
  'ar bait': { ko: '아르바이트 시간제취업', lang: 'vi' },
  'viec lam': { ko: '시간제취업 아르바이트', lang: 'vi' },
  'việc làm': { ko: '시간제취업 아르바이트', lang: 'vi' },
  'cong ket': { ko: '공결 신청서 진단서 결석', lang: 'vi' },
  'công kết': { ko: '공결 신청서 진단서 결석', lang: 'vi' },
  'nghi phep': { ko: '공결 신청서 결석 휴학', lang: 'vi' },
  'nghỉ phép': { ko: '공결 신청서 결석 휴학', lang: 'vi' },
  'nghi om': { ko: '공결 병결 진단서 병원', lang: 'vi' },
  'nghỉ ốm': { ko: '공결 병결 진단서 병원', lang: 'vi' },
  'so du ngan hang': { ko: '잔고증명서 은행 잔고', lang: 'vi' },
  'số dư ngân hàng': { ko: '잔고증명서 은행 잔고', lang: 'vi' },
  'sao ke': { ko: '잔고증명서 은행 거래내역', lang: 'vi' },
  'sao kê': { ko: '잔고증명서 은행 거래내역', lang: 'vi' },
  'xac nhan so du': { ko: '잔고증명서 은행 잔고', lang: 'vi' },
  'xác nhận số dư': { ko: '잔고증명서 은행 잔고', lang: 'vi' },
  'dong hoc phi': { ko: '등록금 납부 가상계좌', lang: 'vi' },
  'đóng học phí': { ko: '등록금 납부 가상계좌', lang: 'vi' },
  'nop hoc phi': { ko: '등록금 납부 가상계좌', lang: 'vi' },
  'nộp học phí': { ko: '등록금 납부 가상계좌', lang: 'vi' },
  'bang diem': { ko: '성적증명서 성적', lang: 'vi' },
  'bảng điểm': { ko: '성적증명서 성적', lang: 'vi' },
  'giay xac nhan': { ko: '재학증명서 증명서 서식', lang: 'vi' },
  'giấy xác nhận': { ko: '재학증명서 증명서 서식', lang: 'vi' },
  'bao hiem y te': { ko: '국민건강보험 공단', lang: 'vi' },
  'bảo hiểm y tế': { ko: '국민건강보험 공단', lang: 'vi' },
  'thi giua ky': { ko: '시험 중간고사 평가', lang: 'vi' },
  'thi giữa kỳ': { ko: '시험 중간고사 평가', lang: 'vi' },
  'thi cuoi ky': { ko: '시험 기말고사 평가', lang: 'vi' },
  'thi cuối kỳ': { ko: '시험 기말고사 평가', lang: 'vi' },
  'xep lop': { ko: '레벨테스트 분반평가', lang: 'vi' },
  'xếp lớp': { ko: '레벨테스트 분반평가', lang: 'vi' },

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

export const STANDARD_CATEGORY_NAMES: Record<string, Record<Language, string>> = {
  attendance: {
    ko: '출결/수업',
    en: 'Attendance & Class',
    vi: 'Điểm danh & Lớp học',
    zh: '出勤/课程',
    mn: 'Ирц / Хичээл',
  },
  visa: {
    ko: '비자/체류',
    en: 'Visa & Stay',
    vi: 'Visa & Lưu trú',
    zh: '签证/居留',
    mn: 'Виз / Оршин суух',
  },
  dormitory: {
    ko: '기숙사',
    en: 'Dormitory',
    vi: 'Ký túc xá',
    zh: '宿舍',
    mn: 'Дотуур байр',
  },
  admin: {
    ko: '행정/증명서',
    en: 'Admin & Forms',
    vi: 'Hành chính & Hồ sơ',
    zh: '行政/证明',
    mn: 'Захиргаа / Тодорхойлолт',
  },
  life: {
    ko: '유학생활',
    en: 'Campus Life',
    vi: 'Đời sống du học',
    zh: '留学生活',
    mn: 'Оюутны амьдрал',
  },
  entryexit: {
    ko: '입국/출국',
    en: 'Entry & Exit',
    vi: 'Xuất nhập cảnh',
    zh: '出入境',
    mn: 'Хил нэвтрэх',
  },
  entry_exit: {
    ko: '입국/출국',
    en: 'Entry & Exit',
    vi: 'Xuất nhập cảnh',
    zh: '出入境',
    mn: 'Хил нэвтрэх',
  },
  all: {
    ko: '전체보기',
    en: 'All',
    vi: 'Tất cả',
    zh: '全部',
    mn: 'Бүгд',
  },
};

/**
 * Normalizes category keys across all 5 languages (KO, EN, VI, ZH, MN)
 * and custom category configurations.
 */
export function normalizeCategory(cat: string | undefined | null, configCategories?: CategoryItem[]): string {
  if (!cat) return '';
  const raw = cat.trim();
  const c = raw.toLowerCase().replace(/[\s\-_/&]+/g, ' ');

  // 1. Check custom config categories if provided
  if (configCategories && configCategories.length > 0) {
    for (const item of configCategories) {
      if (item.id && (raw === item.id || c === item.id.toLowerCase())) {
        return item.id;
      }
      if (item.name) {
        for (const val of Object.values(item.name)) {
          if (val && (raw === val || c === val.toLowerCase())) {
            return item.id;
          }
        }
      }
    }
  }

  // 2. All / View All
  if (
    c === 'all' ||
    raw === '전체' ||
    raw === '전체보기' ||
    c === 'view all' ||
    c === 'tất cả' ||
    c === 'xem tất cả' ||
    raw === '全部' ||
    raw === '查看全部' ||
    c === 'бүгд' ||
    c === 'бүгдийг харах'
  ) {
    return 'all';
  }

  // 3. Attendance / Class
  if (
    c === 'attendance' ||
    c === 'attendance class' ||
    c === 'attendance and class' ||
    raw.includes('출결') ||
    raw.includes('수업') ||
    raw.includes('출석') ||
    c.includes('điểm danh') ||
    c.includes('lớp học') ||
    c.includes('chuyên cần') ||
    raw.includes('出勤') ||
    raw.includes('课程') ||
    raw.includes('考勤') ||
    c.includes('ирц') ||
    c.includes('хичээл')
  ) {
    return 'attendance';
  }

  // 4. Visa / Stay
  if (
    c === 'visa' ||
    c === 'visa stay' ||
    c === 'visa and stay' ||
    c === 'stay' ||
    c === 'immigration' ||
    raw.includes('비자') ||
    raw.includes('체류') ||
    c.includes('thị thực') ||
    c.includes('lưu trú') ||
    raw.includes('签证') ||
    raw.includes('居留') ||
    c.includes('виз') ||
    c.includes('оршин суух')
  ) {
    return 'visa';
  }

  // 5. Dormitory
  if (
    c === 'dormitory' ||
    c === 'dorm' ||
    c === 'residence hall' ||
    c === 'housing' ||
    raw.includes('기숙사') ||
    raw.includes('생활관') ||
    raw.includes('명교') ||
    raw.includes('외박') ||
    c.includes('ký túc xá') ||
    c.includes('ktx') ||
    raw.includes('宿舍') ||
    raw.includes('生活馆') ||
    c.includes('дотуур байр') ||
    c.includes('байр')
  ) {
    return 'dormitory';
  }

  // 6. Admin / Forms / Certificates
  if (
    c === 'admin' ||
    c === 'admin forms' ||
    c === 'admin certificate' ||
    c === 'admin certificates' ||
    c === 'administration' ||
    c === 'forms' ||
    c === 'certificate' ||
    c === 'certificates' ||
    c === 'documents' ||
    raw.includes('행정') ||
    raw.includes('증명서') ||
    raw.includes('서식') ||
    raw.includes('양식') ||
    raw.includes('자료실') ||
    c.includes('hành chính') ||
    c.includes('giấy tờ') ||
    c.includes('hồ sơ') ||
    c.includes('biểu mẫu') ||
    c.includes('chứng nhận') ||
    raw.includes('行政') ||
    raw.includes('证明') ||
    raw.includes('表格') ||
    c.includes('захиргаа') ||
    c.includes('тодорхойлолт') ||
    c.includes('маягт')
  ) {
    return 'admin';
  }

  // 7. Campus Life
  if (
    c === 'life' ||
    c === 'campus life' ||
    c === 'student life' ||
    raw.includes('유학생활') ||
    raw.includes('캠퍼스생활') ||
    raw.includes('대학생활') ||
    c.includes('đời sống du học') ||
    c.includes('đời sống') ||
    c.includes('sinh hoạt') ||
    raw.includes('留学生活') ||
    raw.includes('校园生活') ||
    c.includes('оюутны амьдрал') ||
    c.includes('амьдрал')
  ) {
    return 'life';
  }

  // 8. Entry & Exit (입국/출국)
  if (
    c === 'entryexit' ||
    c === 'entry exit' ||
    c === 'entry_exit' ||
    c === 'entry and exit' ||
    raw.includes('입국') ||
    raw.includes('출국') ||
    c.includes('xuất nhập cảnh') ||
    c.includes('nhập cảnh') ||
    c.includes('xuất cảnh') ||
    raw.includes('出入境') ||
    c.includes('хил нэвтрэх')
  ) {
    return 'entryexit';
  }

  return raw;
}

/**
 * Checks whether two category identifiers or labels match across all languages.
 */
export function matchCategory(
  catA: string | undefined | null,
  catB: string | undefined | null,
  configCategories?: CategoryItem[]
): boolean {
  if (!catA || !catB) return false;
  const normA = normalizeCategory(catA, configCategories);
  const normB = normalizeCategory(catB, configCategories);
  if (normA === 'all' || normB === 'all') return true;
  if (normA === normB) return true;
  return catA.trim().toLowerCase() === catB.trim().toLowerCase();
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

  // 1. Check custom categories first if explicitly provided
  if (configCategories && configCategories.length > 0) {
    const found = configCategories.find((c) => {
      if (c.id && c.id.toLowerCase() === trimmed.toLowerCase()) return true;
      if (c.name) {
        return (
          c.name.ko === trimmed ||
          c.name.en === trimmed ||
          c.name.vi === trimmed ||
          c.name.zh === trimmed ||
          c.name.mn === trimmed
        );
      }
      return false;
    });

    if (found?.name) {
      if (lang === 'ko' && found.name.ko) return found.name.ko;
      if (found.name[lang] && found.name[lang] !== found.name.ko) {
        return found.name[lang]!;
      }
    }
  }

  // 2. Standard normalized category lookup (Instant dictionary with zero latency)
  const norm = normalizeCategory(trimmed, configCategories);
  const normClean = norm.toLowerCase().replace(/[\s\-_]+/g, '');
  if (STANDARD_CATEGORY_NAMES[norm]) {
    return STANDARD_CATEGORY_NAMES[norm][lang] || STANDARD_CATEGORY_NAMES[norm].ko;
  }
  if (STANDARD_CATEGORY_NAMES[normClean]) {
    return STANDARD_CATEGORY_NAMES[normClean][lang] || STANDARD_CATEGORY_NAMES[normClean].ko;
  }

  // 3. Custom category fallback
  if (configCategories && configCategories.length > 0) {
    const found = configCategories.find((c) => c.id === norm || c.id === trimmed || c.name?.ko === trimmed);
    if (found?.name) {
      if (lang === 'ko') return found.name.ko || trimmed;
      if (found.name[lang]) return found.name[lang]!;
      return found.name.ko || trimmed;
    }
  }

  // 4. Memory cache fallback if available
  const cacheKey = `ko->${lang}:${trimmed}`;
  if (memoryCache[cacheKey]) {
    return memoryCache[cacheKey];
  }

  return trimmed;
}

