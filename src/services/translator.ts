import { Language } from '../types';

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
