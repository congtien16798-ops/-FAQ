import React, { useState, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Check,
  Globe,
  MessageSquare,
  Palette,
  RotateCcw,
  Type,
  AlertCircle,
  HelpCircle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Language } from '../../types';
import { translateText, translateTexts } from '../../services/translator';

export const ChatbotManager: React.FC = () => {
  const { config, updateConfig } = useTheme();

  // Local Form States
  const [enabled, setEnabled] = useState(config.chatbotEnabled !== false);
  const [botName, setBotName] = useState(config.chatbotName || '계명어학당 AI 챗봇');
  const [botSubtitle, setBotSubtitle] = useState(config.chatbotSubtitle || '24시간 유학생 실시간 상담');
  const [badgeText, setBadgeText] = useState(config.chatbotBadgeText || 'AI 가이드 챗봇');
  const [welcomeMsg, setWelcomeMsg] = useState(
    config.chatbotWelcomeMsg ||
      '안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 🎓\nD-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정실 위치 등 무엇이든 물어보세요!'
  );
  const [placeholder, setPlaceholder] = useState(
    config.chatbotPlaceholder || '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)'
  );
  const [botColor, setBotColor] = useState(config.chatbotColor || config.mainColor || '#1A3B6B');
  const [suggestions, setSuggestions] = useState<string[]>(
    config.chatbotSuggestions || [
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '한국어학당 학생도 합법적으로 아르바이트 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
      '명교생활관(기숙사) 외박 신청은 어떻게 하나요?',
    ]
  );
  const [newSuggestion, setNewSuggestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Auto-Translation Preview State
  const [previewLang, setPreviewLang] = useState<Language>('ko');
  const [isTranslatingPreview, setIsTranslatingPreview] = useState(false);
  const [translatedData, setTranslatedData] = useState<{
    name: string;
    subtitle: string;
    badge: string;
    welcome: string;
    placeholder: string;
    suggestions: string[];
  } | null>(null);

  // Sync state if config updates externally
  useEffect(() => {
    setEnabled(config.chatbotEnabled !== false);
    if (config.chatbotName) setBotName(config.chatbotName);
    if (config.chatbotSubtitle) setBotSubtitle(config.chatbotSubtitle);
    if (config.chatbotBadgeText) setBadgeText(config.chatbotBadgeText);
    if (config.chatbotWelcomeMsg) setWelcomeMsg(config.chatbotWelcomeMsg);
    if (config.chatbotPlaceholder) setPlaceholder(config.chatbotPlaceholder);
    if (config.chatbotColor) setBotColor(config.chatbotColor);
    if (config.chatbotSuggestions) setSuggestions(config.chatbotSuggestions);
  }, [config]);

  // Load preview translations whenever previewLang or contents change
  const handleLoadTranslationPreview = async (lang: Language) => {
    setPreviewLang(lang);
    if (lang === 'ko') {
      setTranslatedData(null);
      return;
    }

    setIsTranslatingPreview(true);
    try {
      const [tName, tSub, tBadge, tWelcome, tPlace, tSugg] = await Promise.all([
        translateText(botName, lang, 'ko'),
        translateText(botSubtitle, lang, 'ko'),
        translateText(badgeText, lang, 'ko'),
        translateText(welcomeMsg, lang, 'ko'),
        translateText(placeholder, lang, 'ko'),
        translateTexts(suggestions, lang, 'ko'),
      ]);

      setTranslatedData({
        name: tName,
        subtitle: tSub,
        badge: tBadge,
        welcome: tWelcome,
        placeholder: tPlace,
        suggestions: tSugg,
      });
    } catch {
      setTranslatedData({
        name: botName,
        subtitle: botSubtitle,
        badge: badgeText,
        welcome: welcomeMsg,
        placeholder,
        suggestions,
      });
    } finally {
      setIsTranslatingPreview(false);
    }
  };

  const handleAddSuggestion = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSuggestion.trim();
    if (!trimmed) return;
    if (suggestions.includes(trimmed)) {
      alert('이미 등록된 추천 질문입니다.');
      return;
    }
    setSuggestions([...suggestions, trimmed]);
    setNewSuggestion('');
  };

  const handleDeleteSuggestion = (index: number) => {
    setSuggestions(suggestions.filter((_, i) => i !== index));
  };

  const handleMoveSuggestion = (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= suggestions.length) return;
    const updated = [...suggestions];
    const temp = updated[index];
    updated[index] = updated[newIdx];
    updated[newIdx] = temp;
    setSuggestions(updated);
  };

  const handleResetDefaults = () => {
    if (!window.confirm('챗봇 설정을 기본값으로 초기화하시겠습니까?')) return;
    setBotName('계명어학당 AI 챗봇');
    setBotSubtitle('24시간 유학생 실시간 상담');
    setBadgeText('AI 가이드 챗봇');
    setWelcomeMsg(
      '안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 🎓\nD-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정실 위치 등 무엇이든 물어보세요!'
    );
    setPlaceholder('질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)');
    setBotColor(config.mainColor || '#1A3B6B');
    setSuggestions([
      'D-4 비자 연장에 필요한 서류는 무엇인가요?',
      '수료 및 비자 연장을 위한 최소 출석률은?',
      '한국어학당 학생도 합법적으로 아르바이트 가능한가요?',
      '국제처 행정실(동영관 101호) 위치와 운영시간은?',
      '명교생활관(기숙사) 외박 신청은 어떻게 하나요?',
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        chatbotEnabled: enabled,
        chatbotName: botName.trim(),
        chatbotSubtitle: botSubtitle.trim(),
        chatbotBadgeText: badgeText.trim(),
        chatbotWelcomeMsg: welcomeMsg.trim(),
        chatbotPlaceholder: placeholder.trim(),
        chatbotColor: botColor,
        chatbotSuggestions: suggestions,
      });

      setToastMsg('챗봇 설정이 성공적으로 저장되었습니다!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save chatbot config:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const colorPresets = [
    { label: 'KMU 네이비', value: '#1A3B6B' },
    { label: '행정 그린', value: '#2E7D5B' },
    { label: '포인트 오렌지', value: '#D97736' },
    { label: '청록 틸', value: '#0D9488' },
    { label: '딥 퍼플', value: '#6D28D9' },
    { label: '다크 슬레이트', value: '#334155' },
  ];

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#1A3B6B]" />
              <span>AI 가이드 챗봇 종합 설정</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-[#1A3B6B]">
              Gemini AI
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            외국인 유학생 포털 우측 하단에 표시되는 24시간 실시간 AI 상담 챗봇의 이름, 추천 질문, 환영 인사말 및 자동 다국어 번역을 설정합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본값 복원</span>
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-1.5 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '저장 중...' : '설정 저장'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Configuration Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Activation Toggle */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/60 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-gray-900 block">
                챗봇 활성화 상태
              </span>
              <span className="text-[11px] text-gray-500">
                학생 포털 화면 우측 하단에 AI 챗봇 상담 플로팅 버튼을 표시합니다.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A3B6B]"></div>
            </label>
          </div>

          {/* Section 2: Basic Naming & Badges */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Type className="w-4 h-4 text-[#1A3B6B]" />
              <span>챗봇 명칭 및 플로팅 런처 설정</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  챗봇 이름 (상단 헤더 표시)*
                </label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="예: 계명어학당 AI 챗봇"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  챗봇 상태/부제목 문구
                </label>
                <input
                  type="text"
                  value={botSubtitle}
                  onChange={(e) => setBotSubtitle(e.target.value)}
                  placeholder="예: 24시간 유학생 실시간 상담"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                플로팅 런처 버튼 라벨 (PC 화면)
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="예: AI 가이드 챗봇"
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
              />
            </div>

            {/* Color selection */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1.5">
                챗봇 테마 색상
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {colorPresets.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setBotColor(c.value)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      botColor === c.value
                        ? 'border-gray-900 ring-2 ring-[#1A3B6B]/20 bg-gray-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: c.value }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
                <div className="flex items-center gap-1.5 ml-1">
                  <input
                    type="color"
                    value={botColor}
                    onChange={(e) => setBotColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer border border-gray-300 p-0"
                  />
                  <span className="text-[10px] font-mono text-gray-500 uppercase">{botColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Messages & Input Placeholder */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <MessageSquare className="w-4 h-4 text-[#1A3B6B]" />
              <span>환영 메시지 및 입력창 설정</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                첫 환영 인사말 (Welcome Message)
              </label>
              <textarea
                rows={3}
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder="학생이 챗봇을 열었을 때 가장 먼저 보게 되는 안내 인사말을 입력하세요."
                className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B] leading-relaxed"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                한국어로 입력하시면 학생이 선택한 언어(영어, 베트남어, 중국어, 몽골어)로 자동 번역되어 전달됩니다.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                입력창 안내 문구 (Placeholder)
              </label>
              <input
                type="text"
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="예: 질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)"
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
              />
            </div>
          </div>

          {/* Section 4: Suggested Questions (Chips) */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D97736]" />
                <span>추천 질문 목록 설정 ({suggestions.length}개)</span>
              </h4>
              <span className="text-[10px] text-gray-400">클릭 한 번으로 질문할 수 있는 칩 버튼</span>
            </div>

            {/* Add new suggestion form */}
            <form onSubmit={handleAddSuggestion} className="flex gap-2">
              <input
                type="text"
                value={newSuggestion}
                onChange={(e) => setNewSuggestion(e.target.value)}
                placeholder="새 추천 질문 입력 (예: D-4 비자 연장 비용은 얼마인가요?)"
                className="flex-1 px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>추가</span>
              </button>
            </form>

            {/* List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {suggestions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-200 text-xs"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1A3B6B] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate text-gray-800 font-medium">{item}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSuggestion(idx, 'up')}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === suggestions.length - 1}
                      onClick={() => handleMoveSuggestion(idx, 'down')}
                      className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSuggestion(idx)}
                      className="p-1 text-gray-400 hover:text-red-600 cursor-pointer ml-1"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Auto-Translation Preview & Live Chatbot Mockup */}
        <div className="lg:col-span-5 space-y-4">
          {/* AUTO-TRANSLATION PREVIEW TOOLBAR */}
          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#1A3B6B]" />
                <span>🌐 챗봇 자동 다국어 번역 실시간 테스트</span>
              </span>
            </div>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              설정하신 챗봇 이름, 환영 인사, 추천 질문이 외국인 유학생 화면에서 실시간으로 어떻게 자동 번역되는지 확인해 보세요.
            </p>

            {/* Language tabs */}
            <div className="flex items-center gap-1 flex-wrap">
              {[
                { code: 'ko' as Language, label: '🇰🇷 한국어 (원문)' },
                { code: 'en' as Language, label: '🇺🇸 English' },
                { code: 'vi' as Language, label: '🇻🇳 Tiếng Việt' },
                { code: 'zh' as Language, label: '🇨🇳 中文' },
                { code: 'mn' as Language, label: '🇲🇳 Монгол' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLoadTranslationPreview(lang.code)}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all cursor-pointer ${
                    previewLang === lang.code
                      ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] shadow-2xs'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {isTranslatingPreview && (
              <p className="text-xs text-blue-700 animate-pulse font-medium">
                Google 자동 번역 엔진으로 다국어 변환 중입니다...
              </p>
            )}
          </div>

          {/* INTERACTIVE CHATBOT LIVE PREVIEW */}
          <div className="rounded-2xl border border-gray-300 shadow-lg overflow-hidden bg-white max-w-sm mx-auto flex flex-col h-[520px]">
            {/* Header */}
            <div
              className="p-3 text-white flex items-center justify-between shadow-xs"
              style={{ backgroundColor: botColor }}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="font-bold text-xs flex items-center gap-1">
                    <span>
                      {translatedData && previewLang !== 'ko'
                        ? translatedData.name
                        : botName}
                    </span>
                    <span className="text-[9px] bg-amber-400 text-slate-900 font-extrabold px-1 py-0.2 rounded-full">
                      AI
                    </span>
                  </div>
                  <div className="text-[10px] text-blue-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
                    <span>
                      {translatedData && previewLang !== 'ko'
                        ? translatedData.subtitle
                        : botSubtitle}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded font-mono uppercase">
                {previewLang}
              </span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-3 bg-slate-50/60 overflow-y-auto space-y-3 text-xs">
              {/* Welcome bubble */}
              <div className="flex gap-2 items-start">
                <div
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: botColor }}
                >
                  <Bot className="w-3.5 h-3.5 text-amber-300" />
                </div>
                <div className="bg-white border border-gray-200 p-2.5 rounded-2xl rounded-bl-xs text-xs text-gray-800 leading-relaxed shadow-2xs whitespace-pre-wrap">
                  {translatedData && previewLang !== 'ko'
                    ? translatedData.welcome
                    : welcomeMsg}
                </div>
              </div>
            </div>

            {/* Quick Suggestions Chips in Preview */}
            <div className="p-2 bg-white border-t border-gray-100 flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(translatedData && previewLang !== 'ko'
                ? translatedData.suggestions
                : suggestions
              ).map((chip, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] whitespace-nowrap border border-gray-200 shrink-0 font-medium"
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-1.5">
              <input
                type="text"
                readOnly
                placeholder={
                  translatedData && previewLang !== 'ko'
                    ? translatedData.placeholder
                    : placeholder
                }
                className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              />
              <button
                type="button"
                className="w-7 h-7 rounded-lg text-white flex items-center justify-center shrink-0"
                style={{ backgroundColor: botColor }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
