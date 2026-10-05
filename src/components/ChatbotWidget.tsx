import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  BookOpen,
  FileText,
  Calendar,
  User,
  ChevronDown,
  Globe,
  ExternalLink,
  HelpCircle,
  Mail,
  Check
} from 'lucide-react';
import { Language, FaqItem, DocumentItem, ScheduleEvent } from '../types';
import { useTheme } from '../context/ThemeContext';
import { translateText, translateTexts } from '../services/translator';

export interface RecommendedItem {
  id: string;
  type: 'faq' | 'doc' | 'schedule';
  title: string;
  category?: string;
  snippet?: string;
  actionLabel?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  recommendations?: RecommendedItem[];
  showInquiryButton?: boolean;
}

interface ChatbotWidgetProps {
  currentLang: Language;
  faqs?: FaqItem[];
  documents?: DocumentItem[];
  schedules?: ScheduleEvent[];
  onNavigateTab?: (tab: string, itemId?: string) => void;
}

// Detect language of user query to reply in their native language automatically
const detectUserQueryLang = (text: string, fallbackLang: Language): Language => {
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) return 'ko';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u0400-\u04FF]/.test(text)) return 'mn';
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(text)) return 'vi';
  if (/[a-zA-Z]/.test(text)) return 'en';
  return fallbackLang;
};

// Helper: Strip HTML
const stripHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
};

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  currentLang,
  faqs = [],
  documents = [],
  schedules = [],
  onNavigateTab,
}) => {
  const { config } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Active chat language (defaults to portal currentLang, can be changed by user or auto-detected)
  const [chatLang, setChatLang] = useState<Language>(currentLang);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    setChatLang(currentLang);
  }, [currentLang]);

  // Dynamic Translated strings
  const [transName, setTransName] = useState(config.chatbotName || '계명어학당 안내 챗봇');
  const [transSubtitle, setTransSubtitle] = useState(config.chatbotSubtitle || '24시간 유학생 실시간 상담');
  const [transWelcome, setTransWelcome] = useState(
    config.chatbotWelcomeMsg ||
      '안녕하세요! 계명대학교 한국어학당 안내 챗봇입니다. 🎓\nD-4 비자 연장, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정 서식, 한국어학당 일정 등 무엇이든 물어보세요!'
  );
  const [transPlaceholder, setTransPlaceholder] = useState(
    config.chatbotPlaceholder || '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준, 일정)'
  );
  const [transBadge, setTransBadge] = useState(config.chatbotBadgeText || '한국어학당 안내 챗봇');
  const [transSuggestions, setTransSuggestions] = useState<string[]>(
    config.chatbotSuggestions || [
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '2026학년도 한국어학당 학사 일정 알려주세요',
      '외국인 유학생 아르바이트(시간제 취업) 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
    ]
  );

  // Auto-translate configured properties whenever chatLang or config changes
  useEffect(() => {
    const rawName = config.chatbotName || '계명어학당 안내 챗봇';
    const rawSubtitle = config.chatbotSubtitle || '24시간 유학생 실시간 상담';
    const rawBadge = config.chatbotBadgeText || '한국어학당 안내 챗봇';
    const rawWelcome =
      config.chatbotWelcomeMsg ||
      '안녕하세요! 계명대학교 한국어학당 안내 챗봇입니다. 🎓\nD-4 비자 연장, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정 서식, 한국어학당 일정 등 무엇이든 물어보세요!';
    const rawPlaceholder = config.chatbotPlaceholder || '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준, 일정)';
    const rawSuggestions = config.chatbotSuggestions || [
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '2026학년도 한국어학당 학사 일정 알려주세요',
      '외국인 유학생 아르바이트(시간제 취업) 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
    ];

    if (chatLang === 'ko') {
      setTransName(rawName);
      setTransSubtitle(rawSubtitle);
      setTransBadge(rawBadge);
      setTransWelcome(rawWelcome);
      setTransPlaceholder(rawPlaceholder);
      setTransSuggestions(rawSuggestions);
      return;
    }

    let isMounted = true;
    Promise.all([
      translateText(rawName, chatLang, 'ko'),
      translateText(rawSubtitle, chatLang, 'ko'),
      translateText(rawBadge, chatLang, 'ko'),
      translateText(rawWelcome, chatLang, 'ko'),
      translateText(rawPlaceholder, chatLang, 'ko'),
      translateTexts(rawSuggestions, chatLang, 'ko'),
    ]).then(([tName, tSub, tBadge, tWel, tPlace, tSugg]) => {
      if (isMounted) {
        setTransName(tName);
        setTransSubtitle(tSub);
        setTransBadge(tBadge);
        setTransWelcome(tWel);
        setTransPlaceholder(tPlace);
        setTransSuggestions(tSugg);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [
    chatLang,
    config.chatbotName,
    config.chatbotSubtitle,
    config.chatbotBadgeText,
    config.chatbotWelcomeMsg,
    config.chatbotPlaceholder,
    config.chatbotSuggestions,
  ]);

  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: transWelcome,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update welcome message if language or transWelcome changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].id === 'welcome-1') {
      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: transWelcome,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [transWelcome]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
    }
  }, [isOpen]);

  if (config.chatbotEnabled === false) {
    return null;
  }

  // Pure Deterministic Knowledge Base Search & Recommendation Engine
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    const userQueryLang = detectUserQueryLang(query, chatLang);

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 1. If user asked in foreign language, translate the query to Korean for high-accuracy keyword matching
      let koreanQuery = query.toLowerCase();
      if (userQueryLang !== 'ko') {
        try {
          const translatedQ = await translateText(query, 'ko', userQueryLang);
          if (translatedQ) {
            koreanQuery = `${query.toLowerCase()} ${translatedQ.toLowerCase()}`;
          }
        } catch {
          // fallback to original query
        }
      }

      const qTokens = koreanQuery
        .replace(/[.,?!~:;()[\]{}"']/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 2);

      // Candidate matches container
      interface CandidateMatch {
        type: 'faq' | 'doc' | 'schedule';
        score: number;
        item: any;
      }
      const candidates: CandidateMatch[] = [];

      // 2. Search FAQs
      (faqs || []).forEach((faq) => {
        if (!faq || faq.hidden) return;
        const title = (faq.title || '').toLowerCase();
        const contentPlain = stripHtml(faq.content || '').toLowerCase();
        const category = (faq.category || '').toLowerCase();

        let score = 0;
        if (title.includes(koreanQuery) || koreanQuery.includes(title)) score += 30;

        qTokens.forEach((tok) => {
          if (title.includes(tok)) score += 10;
          if (category.includes(tok)) score += 6;
          if (contentPlain.includes(tok)) score += 3;
        });

        if (score > 0) {
          candidates.push({ type: 'faq', score, item: faq });
        }
      });

      // 3. Search Documents (자료실/서식)
      (documents || []).forEach((doc) => {
        if (!doc || doc.hidden) return;
        const title = (doc.title || '').toLowerCase();
        const desc = (doc.description || '').toLowerCase();
        const file = (doc.fileName || '').toLowerCase();
        const cat = (doc.category || '').toLowerCase();

        let score = 0;
        if (title.includes(koreanQuery) || koreanQuery.includes(title)) score += 30;

        qTokens.forEach((tok) => {
          if (title.includes(tok)) score += 10;
          if (cat.includes(tok)) score += 6;
          if (file.includes(tok)) score += 5;
          if (desc.includes(tok)) score += 3;
        });

        if (score > 0) {
          candidates.push({ type: 'doc', score, item: doc });
        }
      });

      // 4. Search Schedules (한국어학당 일정)
      const termKeywordMap: Record<string, string> = {
        spring: '봄학기 봄 spring 1학기',
        summer: '여름학기 여름 summer',
        fall: '가을학기 가을 fall 2학기',
        winter: '겨울학기 겨울 winter',
      };
      const typeKeywordMap: Record<string, string> = {
        academic: '학사 수업 개강 종강 등록금',
        exam: '시험 중간고사 기말고사 평가 레벨테스트',
        holiday: '휴일 방학 공휴일 연휴 설날 추석',
        activity: '문화체험 체험 야유회 현장체험',
        admission: '모집 등록 원서 접수',
      };

      (schedules || []).forEach((sch) => {
        if (!sch || sch.hidden) return;
        const title = (sch.title || '').toLowerCase();
        const titleEn = (sch.titleEn || '').toLowerCase();
        const desc = (sch.description || '').toLowerCase();
        const loc = (sch.location || '').toLowerCase();
        const termKw = (termKeywordMap[sch.term] || '').toLowerCase();
        const typeKw = (typeKeywordMap[sch.type] || '').toLowerCase();
        const dates = `${sch.startDate || ''} ${sch.endDate || ''}`.toLowerCase();

        let score = 0;
        if (title.includes(koreanQuery) || koreanQuery.includes(title)) score += 30;

        qTokens.forEach((tok) => {
          if (title.includes(tok)) score += 10;
          if (titleEn.includes(tok)) score += 8;
          if (termKw.includes(tok)) score += 8;
          if (typeKw.includes(tok)) score += 7;
          if (loc.includes(tok)) score += 5;
          if (desc.includes(tok)) score += 3;
          if (dates.includes(tok)) score += 5;
        });

        // If general query asks about schedules
        if (koreanQuery.includes('일정') || koreanQuery.includes('학사') || koreanQuery.includes('schedule')) {
          score += 4;
        }

        if (score > 0) {
          candidates.push({ type: 'schedule', score, item: sch });
        }
      });

      // Sort candidates by score descending
      candidates.sort((a, b) => b.score - a.score);

      // Check if we have matched content
      if (candidates.length === 0) {
        // No match found -> Guide to 1:1 Inquiry as requested
        let fallbackKo = `문의하신 **'${query}'** 내용과 관련된 공식 안내 자료나 일정이 현재 등록되어 있지 않습니다. 😥\n\n정확하고 빠른 안내를 위해 담당 선생님께 **1:1 빠른 문의**를 남겨주시면 확인 후 학적 연락처로 신속히 답변해 드리겠습니다.`;
        let finalFallback = fallbackKo;

        if (userQueryLang !== 'ko') {
          try {
            finalFallback = await translateText(fallbackKo, userQueryLang, 'ko');
          } catch {
            finalFallback = fallbackKo;
          }
        }

        const assistantMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: finalFallback,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          showInquiryButton: true,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // We have matches! Take top 1~3 items
        const topMatches = candidates.slice(0, 3);
        const best = topMatches[0];

        // Synthesize answer exclusively from admin data
        let answerKo = '';

        if (best.type === 'faq') {
          const f = best.item as FaqItem;
          const plain = stripHtml(f.content || '');
          // extract first 2~3 meaningful sentences
          const snippet = plain.split('\n').filter(Boolean).slice(0, 4).join('\n• ');
          answerKo = `**[FAQ 안내: ${f.title}]**\n\n• ${snippet}`;
        } else if (best.type === 'schedule') {
          const s = best.item as ScheduleEvent;
          answerKo = `**[한국어학당 일정: ${s.title}]**\n\n• **일정 기간**: ${s.startDate}${s.startDate !== s.endDate ? ` ~ ${s.endDate}` : ''}\n• **장소/대상**: ${s.location || '교내/전체 유학생'}\n• **상세 내용**: ${s.description || '정규 학사 일정'}`;
        } else {
          const d = best.item as DocumentItem;
          answerKo = `**[서식·자료실: ${d.title}]**\n\n• **안내**: ${d.description || '유학생 행정 제출 서식'}\n• **첨부 파일**: ${d.fileName} (${d.fileSize || '다운로드 가능'})\n• **분류**: ${d.category}`;
        }

        // Translate the answer text into the user's query language if needed
        let finalAnswer = answerKo;
        if (userQueryLang !== 'ko') {
          try {
            finalAnswer = await translateText(answerKo, userQueryLang, 'ko');
          } catch {
            finalAnswer = answerKo;
          }
        }

        // Build recommendations
        const recList: RecommendedItem[] = [];
        for (const m of topMatches) {
          if (m.type === 'faq') {
            const f = m.item as FaqItem;
            let displayTitle = f.title;
            if (userQueryLang !== 'ko') {
              try {
                displayTitle = await translateText(f.title, userQueryLang, 'ko');
              } catch {
                // keep
              }
            }
            recList.push({
              id: f.id,
              type: 'faq',
              title: displayTitle,
              category: f.category,
              snippet: stripHtml(f.content || '').slice(0, 60) + '...',
              actionLabel: userQueryLang === 'en' ? 'View FAQ' : userQueryLang === 'vi' ? 'Xem FAQ' : userQueryLang === 'zh' ? '查看FAQ' : '해당 FAQ 보기',
            });
          } else if (m.type === 'doc') {
            const d = m.item as DocumentItem;
            let displayTitle = d.title;
            if (userQueryLang !== 'ko') {
              try {
                displayTitle = await translateText(d.title, userQueryLang, 'ko');
              } catch {
                // keep
              }
            }
            recList.push({
              id: d.id,
              type: 'doc',
              title: displayTitle,
              category: d.category,
              snippet: d.description || d.fileName,
              actionLabel: userQueryLang === 'en' ? 'Download Form' : userQueryLang === 'vi' ? 'Tải biểu mẫu' : userQueryLang === 'zh' ? '下载资料' : '서식 다운로드',
            });
          } else {
            const s = m.item as ScheduleEvent;
            let displayTitle = s.title;
            if (userQueryLang !== 'ko') {
              try {
                displayTitle = await translateText(s.title, userQueryLang, 'ko');
              } catch {
                // keep
              }
            }
            recList.push({
              id: s.id,
              type: 'schedule',
              title: displayTitle,
              category: '한국어학당 일정',
              snippet: `${s.startDate} ~ ${s.endDate} (${s.location || '교내'})`,
              actionLabel: userQueryLang === 'en' ? 'View Schedule' : userQueryLang === 'vi' ? 'Xem lịch trình' : userQueryLang === 'zh' ? '查看日程' : '일정 확인하기',
            });
          }
        }

        const assistantMsg: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: finalAnswer,
          timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          recommendations: recList,
        };

        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.warn('Knowledge matching error:', err);
      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: '안내 정보 검색 중 일시적인 오류가 발생했습니다. 행정실(동영관 101호) 또는 1:1 빠른 문의를 이용해 주세요.',
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        showInquiryButton: true,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: transWelcome,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Handle recommendation click -> navigate to corresponding section
  const handleRecommendationClick = (rec: RecommendedItem) => {
    if (!onNavigateTab) return;
    if (rec.type === 'faq') {
      onNavigateTab('faq', rec.id);
    } else if (rec.type === 'doc') {
      onNavigateTab('downloads', rec.id);
    } else if (rec.type === 'schedule') {
      onNavigateTab('schedule', rec.id);
    }
    setIsOpen(false);
  };

  // Format message text with basic markdown highlights (bold, bullets, breaks)
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 leading-relaxed text-xs">
        {lines.map((line, idx) => {
          if (!line.trim()) return <div key={idx} className="h-1" />;

          const parts = line.split(/(\*\*.*?\*\*)/g);
          return (
            <p key={idx} className={line.startsWith('•') || line.startsWith('-') ? 'pl-2 text-gray-700' : 'text-gray-800'}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-gray-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </p>
          );
        })}
      </div>
    );
  };

  const botThemeColor = config.chatbotColor || config.mainColor || '#1A3B6B';

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 select-none print:hidden">
        {!isOpen && hasUnread && (
          <div
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-200 text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50 transition-transform hover:-translate-y-0.5 animate-bounce [animation-duration:3s]"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{transBadge}</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-13 h-13 sm:w-14 sm:h-14 rounded-full text-white shadow-lg flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 relative"
          style={{ backgroundColor: botThemeColor }}
          aria-label={isOpen ? '챗봇 닫기' : '유학생 안내 챗봇 열기'}
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
              {hasUnread && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  1
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat Window Modal */}
      {isOpen && (
        <div className="fixed bottom-20 sm:bottom-22 right-3 sm:right-6 w-[calc(100vw-24px)] sm:w-[390px] md:w-[410px] h-[550px] max-h-[82vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 print:hidden">
          {/* Header */}
          <div
            className="px-4 py-3.5 text-white flex items-center justify-between shrink-0 shadow-xs"
            style={{ backgroundColor: botThemeColor }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <BookOpen className="w-4.5 h-4.5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm tracking-tight">{transName}</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/20 text-white">
                    실시간 가이드
                  </span>
                </div>
                <p className="text-[11px] text-white/80 line-clamp-1">{transSubtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  title="답변 언어 선택"
                >
                  <Globe className="w-3 h-3" />
                  <span className="uppercase">{chatLang}</span>
                  <ChevronDown className="w-2.5 h-2.5 opacity-80" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-60 text-gray-800 text-xs">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setChatLang(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-gray-100 cursor-pointer ${
                          chatLang === l.code ? 'font-bold text-[#1A3B6B] bg-blue-50/60' : ''
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </span>
                        {chatLang === l.code && <Check className="w-3 h-3 text-[#1A3B6B]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Chat */}
              <button
                type="button"
                onClick={handleReset}
                className="p-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="대화 초기화"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md bg-white/15 hover:bg-white/25 text-white/90 hover:text-white transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#F8FAFC]">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs"
                      style={{ backgroundColor: botThemeColor }}
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                    </div>
                  )}

                  <div className={`max-w-[86%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-xs shadow-2xs ${
                        isUser
                          ? 'text-white rounded-br-xs'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-xs'
                      }`}
                      style={isUser ? { backgroundColor: botThemeColor } : {}}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        renderFormattedMessage(msg.content)
                      )}
                    </div>

                    {/* Recommendation Cards (관리자 업로드된 FAQ, 서식, 일정 추천) */}
                    {!isUser && msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="w-full mt-2 space-y-1.5">
                        <div className="text-[10px] font-bold text-gray-400 px-1 flex items-center gap-1">
                          <span>관련 추천 게시글·자료:</span>
                        </div>
                        {msg.recommendations.map((rec) => {
                          const isFaq = rec.type === 'faq';
                          const isDoc = rec.type === 'doc';
                          return (
                            <div
                              key={rec.id}
                              onClick={() => handleRecommendationClick(rec)}
                              className="w-full p-2.5 rounded-lg border border-gray-200 bg-white hover:border-[#1A3B6B] hover:shadow-xs transition-all cursor-pointer flex flex-col gap-1 text-left group"
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                                    isFaq
                                      ? 'bg-blue-50 text-[#1A3B6B] border border-blue-200'
                                      : isDoc
                                      ? 'bg-emerald-50 text-[#2E7D5B] border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {isFaq ? (
                                    <HelpCircle className="w-2.5 h-2.5" />
                                  ) : isDoc ? (
                                    <FileText className="w-2.5 h-2.5" />
                                  ) : (
                                    <Calendar className="w-2.5 h-2.5" />
                                  )}
                                  <span>{isFaq ? 'FAQ 안내' : isDoc ? '서식·자료실' : '한국어학당 일정'}</span>
                                </span>
                                <span className="text-[10px] text-[#1A3B6B] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                                  <span>{rec.actionLabel || '바로가기'}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              </div>
                              <h5 className="font-bold text-gray-900 text-xs group-hover:text-[#1A3B6B] transition-colors line-clamp-1">
                                {rec.title}
                              </h5>
                              {rec.snippet && (
                                <p className="text-[10px] text-gray-500 line-clamp-1">
                                  {rec.snippet}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* 1:1 Inquiry Jump Button if no content or specifically guided */}
                    {!isUser && msg.showInquiryButton && (
                      <div className="w-full mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (onNavigateTab) onNavigateTab('inquiry');
                            setIsOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-[#2E7D5B] hover:bg-[#246348] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>1:1 빠른 문의 바로 접수하기</span>
                        </button>
                      </div>
                    )}

                    <span className="text-[10px] text-gray-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-full bg-slate-200 text-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: botThemeColor }}
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-xs text-xs text-gray-500 shadow-2xs flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce"></span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {chatLang === 'en'
                      ? 'Searching portal knowledge...'
                      : chatLang === 'vi'
                      ? 'Đang tìm kiếm thông tin tài liệu...'
                      : chatLang === 'zh'
                      ? '正在检索学堂资料与日程...'
                      : chatLang === 'mn'
                      ? 'Мэдээлэл хайж байна...'
                      : '안내 자료 및 일정을 검색하고 있습니다...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll select-none">
            <span className="text-[10px] font-bold text-gray-400 shrink-0 flex items-center gap-0.5">
              <span>추천 질문:</span>
            </span>
            {transSuggestions.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip)}
                className="px-2.5 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-[#1A3B6B] text-gray-600 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border border-gray-200/80 hover:border-blue-200 cursor-pointer min-h-[30px] flex items-center shrink-0"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 sm:p-3 bg-white border-t border-gray-200 flex items-center gap-2 safe-bottom"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={transPlaceholder}
              className="flex-1 px-3 py-2 text-sm sm:text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#1A3B6B] focus:bg-white transition-colors"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-xl text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-2xs min-w-[36px]"
              style={{ backgroundColor: botThemeColor }}
              title="보내기"
              aria-label="메시지 보내기"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
