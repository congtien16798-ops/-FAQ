/**
 * Share Helper Service
 * Generates unified shareable URLs and parses deep-link parameters.
 */

export const getFaqShareUrl = (faqId: string): string => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const cleanId = encodeURIComponent(faqId.trim());
  // Generates dual query-param and hash for maximum compatibility across all apps and messengers
  return `${origin}${pathname}?tab=faq&faq=${cleanId}#faq-${cleanId}`;
};

export const parseShareUrl = (): {
  targetFaqId: string | null;
  targetTab: string | null;
} => {
  if (typeof window === 'undefined') {
    return { targetFaqId: null, targetTab: null };
  }

  try {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash || '';

    // 1. Detect target FAQ from query parameters
    let targetFaqId = params.get('faq') || params.get('id');

    // 2. If not found in query params, detect from hash (#faq-xxxx)
    if (!targetFaqId && hash.startsWith('#faq-')) {
      targetFaqId = decodeURIComponent(hash.replace('#faq-', ''));
    }

    // 3. Detect tab parameter
    let targetTab = params.get('tab');
    if (!targetTab && targetFaqId) {
      targetTab = 'faq';
    }

    return { targetFaqId, targetTab };
  } catch (err) {
    console.warn('Error parsing share URL:', err);
    return { targetFaqId: null, targetTab: null };
  }
};
