import React, { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  ChevronDown,
  Globe,
  ExternalLink,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Language, FaqItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { translateText, translateTexts } from '../services/translator';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatbotWidgetProps {
  currentLang: Language;
  faqs?: FaqItem[];
  onNavigateTab?: (tab: string) => void;
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  currentLang,
  faqs = [],
  onNavigateTab,
}) => {
  const { config } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Active chat language (defaults to portal currentLang, can be toggled by user)
  const [chatLang, setChatLang] = useState<Language>(currentLang);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Sync when outer portal currentLang changes
  useEffect(() => {
    setChatLang(currentLang);
  }, [currentLang]);

  // Dynamic Auto-Translated strings
  const [transName, setTransName] = useState(config.chatbotName || '계명어학당 AI 챗봇');
  const [transSubtitle, setTransSubtitle] = useState(config.chatbotSubtitle || '24시간 유학생 실시간 상담');
  const [transWelcome, setTransWelcome] = useState(
    config.chatbotWelcomeMsg ||
      '안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 🎓\nD-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정실 위치 등 유학생 생활에 대해 궁금한 점을 언제든 물어보세요!'
  );
  const [transPlaceholder, setTransPlaceholder] = useState(
    config.chatbotPlaceholder || '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)'
  );
  const [transBadge, setTransBadge] = useState(config.chatbotBadgeText || 'AI 가이드 챗봇');
  const [transSuggestions, setTransSuggestions] = useState<string[]>(
    config.chatbotSuggestions || [
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '한국어학당 학생도 합법적으로 아르바이트 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
      '명교생활관(기숙사) 외박 신청은 어떻게 하나요?',
    ]
  );

  // Auto-translate configured properties whenever chatLang or config changes
  useEffect(() => {
    const rawName = config.chatbotName || '계명어학당 AI 챗봇';
    const rawSubtitle = config.chatbotSubtitle || '24시간 유학생 실시간 상담';
    const rawBadge = config.chatbotBadgeText || 'AI 가이드 챗봇';
    const rawWelcome =
      config.chatbotWelcomeMsg ||
      '안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 🎓\nD-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정실 위치 등 유학생 생활에 대해 궁금한 점을 언제든 물어보세요!';
    const rawPlaceholder = config.chatbotPlaceholder || '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)';
    const rawSuggestions = config.chatbotSuggestions || [
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '한국어학당 학생도 합법적으로 아르바이트 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
      '명교생활관(기숙사) 외박 신청은 어떻게 하나요?',
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

  // Update welcome message if language or transWelcome changes and only initial message exists
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

  // If chatbot is disabled in config, don't render
  if (config.chatbotEnabled === false) {
    return null;
  }

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentLang: chatLang,
          faqs: (faqs || []).filter((f) => !f.hidden).slice(0, 15).map((f) => ({
            category: f.category,
            title: f.title,
            content: f.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      let botReply = data.text || '';

      if (!botReply) {
        throw new Error('Empty response');
      }

      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: botReply,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('Chat API error, using intelligent fallback with auto-translation:', err);

      // Rule-based base responses
      let rawFallback = '';
      const lower = query.toLowerCase();
      if (lower.includes('비자') || lower.includes('d-4') || lower.includes('visa')) {
        rawFallback = `**[D-4 비자 연장 신청 필수 안내]**\n\n• **신청 기간**: 체류기간 만료일 4개월 전부터 관할 출입국 예약 또는 하이코리아 전자민원 신청\n• **구비 서류**:\n1. 통합신청서, 여권 원본/사본, 외국인등록증\n2. 한국어학당 재학증명서, 출석·성적증명서 (동영관 101호 발급)\n3. 체류지 입증서류 (기숙사 거주확인서 또는 임대차계약서)\n4. 은행 잔고증명서 (1,000만원 이상 등 기준 금액)\n\n※ 직전 학기 출석률이 80% 미만인 경우 비자 연장에 제한이 있을 수 있으니 사전에 행정실 상담을 권장합니다.`;
      } else if (lower.includes('출석') || lower.includes('attendance')) {
        rawFallback = `**[출석률 및 수료 기준 안내]**\n\n• **정규과정 최소 출석률**: **80% 이상** 유지 필수\n• **비자 불이익 주의**: 출석률이 70% 미만으로 떨어질 경우 출입국외국인청에 통보되며 차기 비자 연장이 제한됩니다.\n• **공결(질병) 처리**: 질병으로 결석 시 반드시 3일 이내에 병원 진료확인서/진단서를 동영관 101호 행정실에 제출해야 합니다.`;
      } else if (lower.includes('알바') || lower.includes('취업') || lower.includes('job') || lower.includes('work')) {
        rawFallback = `**[외국인 유학생 아르바이트(시간제 취업) 안내]**\n\n• D-4 어학연수생은 입국 후 **6개월 경과** 후 출석률 90% 이상인 경우에 한하여 법무부 '체류자격 외 활동허가' 승인 후 합법 취업이 가능합니다.\n• **허용 시간**: 학기 중 주당 최대 10~20시간 (TOPIK 등급별 차등)\n• 사전 허가 없이 근무할 경우 불법취업으로 강제퇴거 등 엄중 처벌되니 주의하세요!`;
      } else {
        rawFallback = `**계명대학교 국제처 한국어학당 행정실 안내**\n\n• **위치**: 성서캠퍼스 동영관 101호 (외국인학생지원팀)\n• **운영시간**: 평일 09:00 ~ 17:00 (점심시간 12:00 ~ 13:00)\n• **전화**: 053-580-6923, 6924\n\n궁금한 사항을 구체적으로 질문해 주시면 관련 행정 절차를 자세히 안내해 드립니다!`;
      }

      // Auto-translate fallback text if target language is not Korean
      let finalFallback = rawFallback;
      if (chatLang !== 'ko') {
        try {
          finalFallback = await translateText(rawFallback, chatLang, 'ko');
        } catch {
          finalFallback = rawFallback;
        }
      }

      const assistantMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: finalFallback,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
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

  // Format message text with basic markdown highlights (bold, bullets, breaks)
  const renderFormattedMessage = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Bold parsing **text**
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={idx} className="m-0">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-gray-900">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('• ') || part.startsWith('- ') || part.startsWith('* ')) {
                  return (
                    <span key={pIdx} className="inline-block pl-1 text-gray-800">
                      <span className="text-[#1A3B6B] font-bold mr-1">•</span>
                      {part.slice(2)}
                    </span>
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

  const availableLanguages: { code: Language; label: string; flag: string }[] = [
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'mn', label: 'Монгол', flag: '🇲🇳' },
  ];

  const currentLangObj =
    availableLanguages.find((l) => l.code === chatLang) || availableLanguages[0];

  const botThemeColor = config.chatbotColor || config.mainColor || '#1A3B6B';

  return (
    <>
      {/* Floating Chatbot Launcher Button */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 select-none safe-bottom">
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-2.5 px-3.5 py-3 sm:px-4 sm:py-3 bg-[#1A3B6B] hover:bg-[#122a4d] text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 cursor-pointer border border-blue-400/40 min-h-[48px]"
            style={{ backgroundColor: botThemeColor }}
            title={`${transName} - 24/7 AI 상담`}
            aria-label={`${transName} - 24/7 AI 상담`}
          >
            {/* Pulsing notification dot */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
              </span>
            )}

            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-amber-300" />
            </div>

            <div className="text-left hidden sm:block pr-1">
              <div className="text-xs font-bold leading-tight flex items-center gap-1">
                <span>{transBadge}</span>
                <Sparkles className="w-3 h-3 text-amber-300 inline" />
              </div>
              <div className="text-[10px] text-blue-200 leading-tight">
                {transSubtitle}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Chatbot Window Modal / Floating Box */}
      {isOpen && (
        <div className="fixed inset-x-2 bottom-2 top-10 sm:inset-auto sm:bottom-6 sm:right-6 z-50 sm:w-[420px] sm:h-[600px] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-scale-in">
          {/* Header */}
          <div
            className="px-3.5 sm:px-4 py-3 sm:py-3.5 text-white flex items-center justify-between select-none shadow-xs transition-colors shrink-0"
            style={{ backgroundColor: botThemeColor }}
          >
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5 truncate">
                  <span className="truncate">{transName}</span>
                  <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1.5 py-0.2 rounded-full shrink-0">
                    AI
                  </span>
                </div>
                <div className="text-[10px] sm:text-[11px] text-blue-200 flex items-center gap-1.5 truncate">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>
                  <span className="truncate">{transSubtitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Language Switcher Pill */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="px-2 py-1 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-semibold text-white flex items-center gap-1 transition-colors cursor-pointer border border-white/20 min-h-[30px]"
                  title="챗봇 언어 변경 / Change Language"
                  aria-label="챗봇 언어 변경"
                >
                  <span>{currentLangObj.flag}</span>
                  <span>{currentLangObj.code.toUpperCase()}</span>
                  <ChevronDown className="w-3 h-3 text-blue-200" />
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-50 bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200 py-1 w-36 animate-fade-in text-xs">
                    <div className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 border-b border-gray-100 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-[#1A3B6B]" />
                      <span>대화 언어 선택</span>
                    </div>
                    {availableLanguages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setChatLang(l.code);
                          setShowLangMenu(false);
                        }}
                        className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-gray-100 transition-colors cursor-pointer ${
                          chatLang === l.code ? 'font-bold text-[#1A3B6B] bg-blue-50/60' : ''
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <span>{l.flag}</span>
                          <span>{l.label}</span>
                        </span>
                        {chatLang === l.code && <Check className="w-3.5 h-3.5 text-[#1A3B6B]" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reset Conversation */}
              <button
                onClick={handleReset}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="대화 초기화"
                aria-label="대화 초기화"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                title="닫기"
                aria-label="챗봇 닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice Tag */}
          <div className="px-3.5 py-1.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between text-[11px] text-[#1A3B6B]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2E7D5B]" />
              <span>계명대 한국어학당 가이드 기반 다국어 지원</span>
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                onNavigateTab?.('inquiry');
              }}
              className="text-[10px] font-semibold text-blue-700 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>1:1 문의 바로가기</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Message List Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
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
                      <Bot className="w-4 h-4 text-amber-300" />
                    </div>
                  )}

                  <div className={`max-w-[84%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
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

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div
                  className="w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: botThemeColor }}
                >
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div className="bg-white border border-gray-200 px-3.5 py-2.5 rounded-2xl rounded-bl-xs text-xs text-gray-500 shadow-2xs flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-[#1A3B6B] rounded-full animate-bounce"></span>
                  </span>
                  <span className="text-[11px] text-gray-500">
                    {chatLang === 'en'
                      ? 'AI is generating a response...'
                      : chatLang === 'vi'
                      ? 'AI đang tạo câu trả lời...'
                      : chatLang === 'zh'
                      ? 'AI 正在生成回答...'
                      : chatLang === 'mn'
                      ? 'AI хариулт бэлтгэж байна...'
                      : 'AI가 답변을 생성하고 있습니다...'}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll select-none">
            <span className="text-[10px] font-bold text-gray-400 shrink-0 flex items-center gap-0.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
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
              className="flex-1 px-3 py-2 text-base sm:text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-[#1A3B6B] focus:bg-white transition-colors"
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
