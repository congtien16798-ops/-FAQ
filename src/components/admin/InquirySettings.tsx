import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  Globe,
  Sparkles,
  Check,
  Lock,
  Type,
  ShieldCheck,
  AlertCircle,
  FileText,
  HelpCircle,
  Eye,
  Sliders,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Language } from '../../types';
import { translateText } from '../../services/translator';

export const InquirySettings: React.FC = () => {
  const { config, updateConfig } = useTheme();

  // Local Form States
  const [enabled, setEnabled] = useState(config.inquiryEnabled !== false);
  const [title, setTitle] = useState(config.inquiryTitle || '1:1 빠른 문의 접수');
  const [subtitle, setSubtitle] = useState(
    config.inquirySubtitle ||
      '한국어학당 학사 및 비자 등 궁금한 점을 남겨주시면 담당 선생님이 확인 후 신속히 연락드립니다.'
  );
  const [badgeText, setBadgeText] = useState(config.inquiryBadgeText || '비로그인 간편 접수');
  const [notice, setNotice] = useState(
    config.inquiryNotice ||
      '접수된 문의는 행정실 운영시간(09:00~17:00) 내 순차적으로 확인됩니다. 비자 만료일이 촉박한 경우 행정실(동영관 101호)에 직접 방문해 주시기 바랍니다.'
  );
  const [studentIdLabel, setStudentIdLabel] = useState(config.inquiryStudentIdLabel || '학번');
  const [studentIdPlaceholder, setStudentIdPlaceholder] = useState(
    config.inquiryStudentIdPlaceholder || '학번 8~10자리 숫자 입력 (예: 20241234)'
  );
  const [nameLabel, setNameLabel] = useState(config.inquiryNameLabel || '성명');
  const [namePlaceholder, setNamePlaceholder] = useState(
    config.inquiryNamePlaceholder || '외국인등록증 또는 여권상 영문/한글 성명'
  );
  const [contentLabel, setContentLabel] = useState(config.inquiryContentLabel || '문의 내용');
  const [contentPlaceholder, setContentPlaceholder] = useState(
    config.inquiryContentPlaceholder || '비자 연장, 출결, 기숙사, 서류 등 궁금하신 사항을 자세히 적어주세요.'
  );
  const [minLength, setMinLength] = useState<number>(config.inquiryMinLength || 10);
  const [maxLength, setMaxLength] = useState<number>(config.inquiryMaxLength || 1000);
  const [enableQuiz, setEnableQuiz] = useState(config.inquiryEnableQuiz !== false);
  const [privacyNotice, setPrivacyNotice] = useState(
    config.inquiryPrivacyNotice ||
      '개인정보 수집 및 이용 안내: 수집항목(학번, 성명, 문의내용)은 1:1 학사 행정 상담 및 답변 처리를 위해서만 이용되며, 관련 법령에 따라 안전하게 보관됩니다.'
  );
  const [privacyConsentText, setPrivacyConsentText] = useState(
    config.inquiryPrivacyConsentText || '개인정보 수집 및 이용에 동의합니다.'
  );
  const [successTitle, setSuccessTitle] = useState(
    config.inquirySuccessTitle || '문의가 정상적으로 접수되었습니다!'
  );
  const [successDesc, setSuccessDesc] = useState(
    config.inquirySuccessDesc ||
      '담당 선생님이 내용을 확인한 후 학번 또는 행정 시스템에 등록된 연락처로 신속히 답변해 드리겠습니다.'
  );
  const [pausedNotice, setPausedNotice] = useState(
    config.inquiryPausedNotice ||
      '현재 행정실 사정으로 1:1 빠른 문의 온라인 접수가 일시 중단되었습니다. 급한 용무는 행정실(동영관 101호)로 전화 또는 방문 문의 바랍니다.'
  );

  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Live Auto-Translation Preview State (기본값 한국어로 설정하여 실시간 타이핑 즉시 반영)
  const [previewLang, setPreviewLang] = useState<Language>('ko');
  const [previewMode, setPreviewMode] = useState<'form' | 'success'>('form');
  const [isTranslatingPreview, setIsTranslatingPreview] = useState(false);
  const [translatedData, setTranslatedData] = useState<{
    title: string;
    subtitle: string;
    badge: string;
    notice: string;
    studentIdLabel: string;
    studentIdPlaceholder: string;
    nameLabel: string;
    namePlaceholder: string;
    contentLabel: string;
    contentPlaceholder: string;
    privacyNotice: string;
    privacyConsentText: string;
    successTitle: string;
    successDesc: string;
    pausedNotice: string;
  } | null>(null);

  // Sync state if config updates externally
  useEffect(() => {
    setEnabled(config.inquiryEnabled !== false);
    if (config.inquiryTitle) setTitle(config.inquiryTitle);
    if (config.inquirySubtitle) setSubtitle(config.inquirySubtitle);
    if (config.inquiryBadgeText) setBadgeText(config.inquiryBadgeText);
    if (config.inquiryNotice) setNotice(config.inquiryNotice);
    if (config.inquiryStudentIdLabel) setStudentIdLabel(config.inquiryStudentIdLabel);
    if (config.inquiryStudentIdPlaceholder) setStudentIdPlaceholder(config.inquiryStudentIdPlaceholder);
    if (config.inquiryNameLabel) setNameLabel(config.inquiryNameLabel);
    if (config.inquiryNamePlaceholder) setNamePlaceholder(config.inquiryNamePlaceholder);
    if (config.inquiryContentLabel) setContentLabel(config.inquiryContentLabel);
    if (config.inquiryContentPlaceholder) setContentPlaceholder(config.inquiryContentPlaceholder);
    if (config.inquiryMinLength) setMinLength(config.inquiryMinLength);
    if (config.inquiryMaxLength) setMaxLength(config.inquiryMaxLength);
    if (config.inquiryEnableQuiz !== undefined) setEnableQuiz(config.inquiryEnableQuiz);
    if (config.inquiryPrivacyNotice) setPrivacyNotice(config.inquiryPrivacyNotice);
    if (config.inquiryPrivacyConsentText) setPrivacyConsentText(config.inquiryPrivacyConsentText);
    if (config.inquirySuccessTitle) setSuccessTitle(config.inquirySuccessTitle);
    if (config.inquirySuccessDesc) setSuccessDesc(config.inquirySuccessDesc);
    if (config.inquiryPausedNotice) setPausedNotice(config.inquiryPausedNotice);
  }, [config]);

  // Load preview translations whenever previewLang changes
  const handleLoadTranslationPreview = async (lang: Language) => {
    setPreviewLang(lang);
    if (lang === 'ko') {
      setTranslatedData(null);
      return;
    }

    setIsTranslatingPreview(true);
    try {
      const [
        tTitle,
        tSubtitle,
        tBadge,
        tNotice,
        tStudentLabel,
        tStudentPlaceholder,
        tNameLabel,
        tNamePlaceholder,
        tContentLabel,
        tContentPlaceholder,
        tPrivacyNotice,
        tPrivacyConsent,
        tSuccessTitle,
        tSuccessDesc,
        tPausedNotice,
      ] = await Promise.all([
        translateText(title, lang, 'ko'),
        translateText(subtitle, lang, 'ko'),
        translateText(badgeText, lang, 'ko'),
        translateText(notice, lang, 'ko'),
        translateText(studentIdLabel, lang, 'ko'),
        translateText(studentIdPlaceholder, lang, 'ko'),
        translateText(nameLabel, lang, 'ko'),
        translateText(namePlaceholder, lang, 'ko'),
        translateText(contentLabel, lang, 'ko'),
        translateText(contentPlaceholder, lang, 'ko'),
        translateText(privacyNotice, lang, 'ko'),
        translateText(privacyConsentText, lang, 'ko'),
        translateText(successTitle, lang, 'ko'),
        translateText(successDesc, lang, 'ko'),
        translateText(pausedNotice, lang, 'ko'),
      ]);

      setTranslatedData({
        title: tTitle,
        subtitle: tSubtitle,
        badge: tBadge,
        notice: tNotice,
        studentIdLabel: tStudentLabel,
        studentIdPlaceholder: tStudentPlaceholder,
        nameLabel: tNameLabel,
        namePlaceholder: tNamePlaceholder,
        contentLabel: tContentLabel,
        contentPlaceholder: tContentPlaceholder,
        privacyNotice: tPrivacyNotice,
        privacyConsentText: tPrivacyConsent,
        successTitle: tSuccessTitle,
        successDesc: tSuccessDesc,
        pausedNotice: tPausedNotice,
      });
    } catch {
      setTranslatedData(null);
    } finally {
      setIsTranslatingPreview(false);
    }
  };

  const handleResetDefaults = () => {
    if (!window.confirm('1:1 빠른 문의 설정을 기본값으로 초기화하시겠습니까?')) return;
    setEnabled(true);
    setTitle('1:1 빠른 문의 접수');
    setSubtitle('한국어학당 학사 및 비자 등 궁금한 점을 남겨주시면 담당 선생님이 확인 후 신속히 연락드립니다.');
    setBadgeText('비로그인 간편 접수');
    setNotice(
      '접수된 문의는 행정실 운영시간(09:00~17:00) 내 순차적으로 확인됩니다. 비자 만료일이 촉박한 경우 행정실(동영관 101호)에 직접 방문해 주시기 바랍니다.'
    );
    setStudentIdLabel('학번');
    setStudentIdPlaceholder('학번 8~10자리 숫자 입력 (예: 20241234)');
    setNameLabel('성명');
    setNamePlaceholder('외국인등록증 또는 여권상 영문/한글 성명');
    setContentLabel('문의 내용');
    setContentPlaceholder('비자 연장, 출결, 기숙사, 서류 등 궁금하신 사항을 자세히 적어주세요.');
    setMinLength(10);
    setMaxLength(1000);
    setEnableQuiz(true);
    setPrivacyNotice(
      '개인정보 수집 및 이용 안내: 수집항목(학번, 성명, 문의내용)은 1:1 학사 행정 상담 및 답변 처리를 위해서만 이용되며, 관련 법령에 따라 안전하게 보관됩니다.'
    );
    setPrivacyConsentText('개인정보 수집 및 이용에 동의합니다.');
    setSuccessTitle('문의가 정상적으로 접수되었습니다!');
    setSuccessDesc('담당 선생님이 내용을 확인한 후 학번 또는 행정 시스템에 등록된 연락처로 신속히 답변해 드리겠습니다.');
    setPausedNotice(
      '현재 행정실 사정으로 1:1 빠른 문의 온라인 접수가 일시 중단되었습니다. 급한 용무는 행정실(동영관 101호)로 전화 또는 방문 문의 바랍니다.'
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateConfig({
        inquiryEnabled: enabled,
        inquiryTitle: title.trim(),
        inquirySubtitle: subtitle.trim(),
        inquiryBadgeText: badgeText.trim(),
        inquiryNotice: notice.trim(),
        inquiryStudentIdLabel: studentIdLabel.trim(),
        inquiryStudentIdPlaceholder: studentIdPlaceholder.trim(),
        inquiryNameLabel: nameLabel.trim(),
        inquiryNamePlaceholder: namePlaceholder.trim(),
        inquiryContentLabel: contentLabel.trim(),
        inquiryContentPlaceholder: contentPlaceholder.trim(),
        inquiryMinLength: minLength,
        inquiryMaxLength: maxLength,
        inquiryEnableQuiz: enableQuiz,
        inquiryPrivacyNotice: privacyNotice.trim(),
        inquiryPrivacyConsentText: privacyConsentText.trim(),
        inquirySuccessTitle: successTitle.trim(),
        inquirySuccessDesc: successDesc.trim(),
        inquiryPausedNotice: pausedNotice.trim(),
      });

      setToastMsg('1:1 빠른 문의 설정이 성공적으로 저장되었습니다!');
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save inquiry config:', err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 text-[#2E7D5B]" />
              <span>1:1 빠른 문의 폼 & 운영 설정</span>
            </h4>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-[#2E7D5B]">
              운영 관리
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            학생 포털의 1:1 빠른 문의 접수 활성화 여부, 입력 필드 라벨, 글자 수 제한, 보안 퀴즈 및 자동 다국어 번역을 설정합니다.
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
            className="px-4 py-1.5 rounded bg-[#2E7D5B] hover:bg-[#236348] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? '저장 중...' : '설정 저장'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Settings Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Activation Toggle */}
          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50/70 flex items-center justify-between">
            <div>
              <span className="font-bold text-xs text-gray-900 block">
                1:1 빠른 문의 온라인 접수 사용
              </span>
              <span className="text-[11px] text-gray-500">
                비활성화 시 학생 화면에 접수 일시 중단 안내 박스가 표시되고 접수가 차단됩니다.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2E7D5B]"></div>
            </label>
          </div>

          {!enabled && (
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/80 space-y-1.5">
              <label className="block text-[11px] font-bold text-amber-900">
                접수 일시 중단 시 학생 안내 문구
              </label>
              <textarea
                rows={2}
                value={pausedNotice}
                onChange={(e) => setPausedNotice(e.target.value)}
                placeholder="학생에게 보여줄 중단 사유 및 행정실 연락처를 입력하세요."
                className="w-full px-3 py-1.5 text-xs rounded border border-amber-300 focus:outline-none focus:border-amber-600 bg-white"
              />
            </div>
          )}

          {/* Section 2: Page Titles & Notices */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Type className="w-4 h-4 text-[#2E7D5B]" />
              <span>페이지 제목 및 상단 안내문 설정</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  문의 폼 제목*
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 1:1 빠른 문의 접수"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  상단 배지 텍스트
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="예: 비로그인 간편 접수"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                부제목 / 상세 설명
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="예: 한국어학당 학사 및 비자 등 궁금한 점을 남겨주시면..."
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                운영시간 및 긴급 방문 안내문 (폼 상단 박스)
              </label>
              <textarea
                rows={2}
                value={notice}
                onChange={(e) => setNotice(e.target.value)}
                placeholder="예: 접수된 문의는 행정실 운영시간(09:00~17:00) 내 순차적으로 확인됩니다..."
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B] leading-relaxed"
              />
            </div>
          </div>

          {/* Section 3: Input Fields Configuration */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <Sliders className="w-4 h-4 text-[#2E7D5B]" />
              <span>입력 필드 라벨 및 입력창 설정</span>
            </h5>

            {/* Student ID field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  학번 입력 라벨
                </label>
                <input
                  type="text"
                  value={studentIdLabel}
                  onChange={(e) => setStudentIdLabel(e.target.value)}
                  placeholder="예: 학번"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  학번 Placeholder
                </label>
                <input
                  type="text"
                  value={studentIdPlaceholder}
                  onChange={(e) => setStudentIdPlaceholder(e.target.value)}
                  placeholder="예: 학번 8~10자리 숫자 입력 (예: 20241234)"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            {/* Name field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  성명 입력 라벨
                </label>
                <input
                  type="text"
                  value={nameLabel}
                  onChange={(e) => setNameLabel(e.target.value)}
                  placeholder="예: 성명"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  성명 Placeholder
                </label>
                <input
                  type="text"
                  value={namePlaceholder}
                  onChange={(e) => setNamePlaceholder(e.target.value)}
                  placeholder="예: 외국인등록증 또는 여권상 영문/한글 성명"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            {/* Content field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  문의내용 입력 라벨
                </label>
                <input
                  type="text"
                  value={contentLabel}
                  onChange={(e) => setContentLabel(e.target.value)}
                  placeholder="예: 문의 내용"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  문의내용 Placeholder
                </label>
                <input
                  type="text"
                  value={contentPlaceholder}
                  onChange={(e) => setContentPlaceholder(e.target.value)}
                  placeholder="예: 비자 연장, 출결, 기숙사, 서류 등 궁금하신 사항..."
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>

            {/* Length limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  최소 입력 글자 수 (최소 5자 권장)
                </label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={minLength}
                  onChange={(e) => setMinLength(parseInt(e.target.value) || 10)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  최대 입력 글자 수 (최대 2000자)
                </label>
                <input
                  type="number"
                  min={100}
                  max={2000}
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value) || 1000)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Security & Anti-Bot Quiz */}
          <div className="p-4 rounded-lg border border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2E7D5B]" />
                <span>스팸 방지 덧셈 퀴즈 (Anti-Bot)</span>
              </h5>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableQuiz}
                  onChange={(e) => setEnableQuiz(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E7D5B]"></div>
              </label>
            </div>
            <p className="text-[11px] text-gray-500">
              {enableQuiz
                ? '자동 스팸 봇 방지를 위해 제출 전 랜덤 덧셈 퀴즈(예: 7 + 5 = ?)를 풀도록 합니다.'
                : '스팸 방지 퀴즈가 비활성화되어 학생들이 퀴즈 없이 즉시 문의를 접수할 수 있습니다.'}
            </p>
          </div>

          {/* Section 5: Privacy Notice & Completion Modal */}
          <div className="space-y-3.5 p-4 rounded-lg border border-gray-200 bg-white">
            <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 pb-2 border-b border-gray-100">
              <FileText className="w-4 h-4 text-[#2E7D5B]" />
              <span>개인정보 수집 동의 및 접수 완료 안내</span>
            </h5>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                개인정보 수집 및 이용 안내문
              </label>
              <textarea
                rows={2}
                value={privacyNotice}
                onChange={(e) => setPrivacyNotice(e.target.value)}
                placeholder="수집 항목, 이용 목적, 보관 기간을 입력하세요."
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B] leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                동의 체크박스 라벨 문구
              </label>
              <input
                type="text"
                value={privacyConsentText}
                onChange={(e) => setPrivacyConsentText(e.target.value)}
                placeholder="예: 개인정보 수집 및 이용에 동의합니다."
                className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  접수 완료 팝업 제목
                </label>
                <input
                  type="text"
                  value={successTitle}
                  onChange={(e) => setSuccessTitle(e.target.value)}
                  placeholder="예: 문의가 정상적으로 접수되었습니다!"
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  접수 완료 팝업 상세 안내
                </label>
                <input
                  type="text"
                  value={successDesc}
                  onChange={(e) => setSuccessDesc(e.target.value)}
                  placeholder="예: 담당 선생님이 내용을 확인한 후 신속히 연락드립니다."
                  className="w-full px-3 py-1.5 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#2E7D5B]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Auto-Translation Preview & Live Mockup */}
        <div className="lg:col-span-5 space-y-4">
          {/* AUTO-TRANSLATION PREVIEW TOOLBAR */}
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#2E7D5B]" />
                <span>🌐 1:1 문의 폼 자동 다국어 번역 실시간 테스트</span>
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              한국어로 설정하면 유학생의 언어 환경(영어, 베트남어, 몽골어, 중국어)에 맞춰 자동 번역됩니다. 아래 탭을 눌러 각 언어별 번역 상태를 즉시 테스트해 보세요.
            </p>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  { code: 'ko', label: '🇰🇷 한국어' },
                  { code: 'en', label: '🇺🇸 English' },
                  { code: 'vi', label: '🇻🇳 Tiếng Việt' },
                  { code: 'mn', label: '🇲🇳 Монгол' },
                  { code: 'zh', label: '🇨🇳 中文' },
                ] as { code: Language; label: string }[]
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleLoadTranslationPreview(lang.code)}
                  className={`px-2.5 py-1 text-xs rounded font-semibold transition-all cursor-pointer ${
                    previewLang === lang.code
                      ? 'bg-[#2E7D5B] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}

              {previewLang !== 'ko' && (
                <button
                  type="button"
                  onClick={() => handleLoadTranslationPreview(previewLang)}
                  disabled={isTranslatingPreview}
                  className="px-2 py-1 text-[11px] rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 font-bold ml-auto flex items-center gap-1 cursor-pointer transition-colors"
                  title="현재 입력된 한글 설정 내용을 이 언어로 다시 번역합니다"
                >
                  <RefreshCw className={`w-3 h-3 ${isTranslatingPreview ? 'animate-spin' : ''}`} />
                  <span>번역 새로고침</span>
                </button>
              )}
            </div>

            {isTranslatingPreview && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>다국어 실시간 번역 생성 중...</span>
              </div>
            )}
          </div>

          {/* LIVE FORM MOCKUP (STUDENT VIEW) */}
          {(() => {
            const isKo = previewLang === 'ko';
            const displayBadge = isKo ? badgeText : (translatedData?.badge || badgeText);
            const displayTitle = isKo ? title : (translatedData?.title || title);
            const displaySubtitle = isKo ? subtitle : (translatedData?.subtitle || subtitle);
            const displayNotice = isKo ? notice : (translatedData?.notice || notice);
            const displayStudentIdLabel = isKo ? studentIdLabel : (translatedData?.studentIdLabel || studentIdLabel);
            const displayStudentIdPlaceholder = isKo ? studentIdPlaceholder : (translatedData?.studentIdPlaceholder || studentIdPlaceholder);
            const displayNameLabel = isKo ? nameLabel : (translatedData?.nameLabel || nameLabel);
            const displayNamePlaceholder = isKo ? namePlaceholder : (translatedData?.namePlaceholder || namePlaceholder);
            const displayContentLabel = isKo ? contentLabel : (translatedData?.contentLabel || contentLabel);
            const displayContentPlaceholder = isKo ? contentPlaceholder : (translatedData?.contentPlaceholder || contentPlaceholder);
            const displayPrivacyNotice = isKo ? privacyNotice : (translatedData?.privacyNotice || privacyNotice);
            const displayPrivacyConsentText = isKo ? privacyConsentText : (translatedData?.privacyConsentText || privacyConsentText);
            const displayPausedNotice = isKo ? pausedNotice : (translatedData?.pausedNotice || pausedNotice);
            const displaySuccessTitle = isKo ? successTitle : (translatedData?.successTitle || successTitle);
            const displaySuccessDesc = isKo ? successDesc : (translatedData?.successDesc || successDesc);

            return (
              <div className="border border-gray-300 rounded-lg shadow-sm bg-white overflow-hidden">
                <div className="bg-[#2E7D5B] px-4 py-2.5 text-white flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-bold">학생 화면 실시간 미리보기 (Live Mockup)</span>
                  </div>

                  {/* Mode Toggle: Form vs Success Modal */}
                  <div className="flex items-center gap-1 bg-white/20 p-0.5 rounded text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('form')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        previewMode === 'form' ? 'bg-white text-[#2E7D5B] shadow-2xs' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      접수 폼 화면
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('success')}
                      className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                        previewMode === 'success' ? 'bg-white text-[#2E7D5B] shadow-2xs' : 'text-white hover:bg-white/10'
                      }`}
                    >
                      완료 팝업
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-50/70 space-y-4 text-xs">
                  {previewMode === 'success' ? (
                    /* SUCCESS COMPLETION MODAL PREVIEW */
                    <div className="bg-white p-6 rounded-lg border border-gray-200 text-center space-y-3.5 shadow-xs animate-in fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2E7D5B] flex items-center justify-center mx-auto border border-emerald-200">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-gray-900 leading-snug">
                          {displaySuccessTitle}
                        </h4>
                        <p className="text-xs text-gray-600 mt-1.5 leading-relaxed max-w-sm mx-auto">
                          {displaySuccessDesc}
                        </p>
                      </div>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('form')}
                          className="px-4 py-2 bg-[#2E7D5B] hover:bg-[#236348] text-white text-xs font-bold rounded-md transition-colors cursor-pointer shadow-xs"
                        >
                          확인 (폼 화면으로 돌아가기)
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* REGULAR FORM MOCKUP */
                    <>
                      {/* Header inside mockup */}
                      <div className="pb-3 border-b border-gray-200">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#2E7D5B]/10 text-[#2E7D5B] mb-1.5">
                          <Lock className="w-3 h-3" />
                          <span>{displayBadge}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1A3B6B]">
                          {displayTitle}
                        </h4>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {displaySubtitle}
                        </p>

                        {displayNotice && (
                          <div className="mt-2.5 p-2 bg-blue-50 border border-blue-200 rounded text-[10px] text-blue-900 leading-relaxed">
                            ℹ️ {displayNotice}
                          </div>
                        )}
                      </div>

                      {/* Form fields mockup */}
                      <div className="bg-white p-3.5 rounded border border-gray-200 space-y-3">
                        {!enabled ? (
                          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded text-center">
                            <p className="font-bold text-xs">접수 일시 중단 안내</p>
                            <p className="text-[11px] mt-1">{displayPausedNotice}</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="block text-[10px] font-semibold text-gray-600 mb-1">
                                  {displayStudentIdLabel} *
                                </span>
                                <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-400 truncate">
                                  {displayStudentIdPlaceholder}
                                </div>
                              </div>
                              <div>
                                <span className="block text-[10px] font-semibold text-gray-600 mb-1">
                                  {displayNameLabel} *
                                </span>
                                <div className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-400 truncate">
                                  {displayNamePlaceholder}
                                </div>
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[10px] font-semibold text-gray-600">
                                  {displayContentLabel} *
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono">
                                  0 / {maxLength}자 (최소 {minLength}자)
                                </span>
                              </div>
                              <div className="p-2 bg-gray-50 border border-gray-200 rounded text-[11px] text-gray-400 h-16 leading-relaxed">
                                {displayContentPlaceholder}
                              </div>
                            </div>

                            {enableQuiz && (
                              <div className="p-2 bg-gray-100 rounded border border-gray-200 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-gray-700">
                                  스팸방지: 7 + 5 = ?
                                </span>
                                <div className="px-3 py-1 bg-white border border-gray-300 rounded text-[10px] text-gray-400">
                                  정답 입력
                                </div>
                              </div>
                            )}

                            <div className="space-y-1 pt-1">
                              <div className="p-2 bg-gray-50 rounded border border-gray-200 text-[10px] text-gray-500 leading-relaxed">
                                {displayPrivacyNotice}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-700">
                                <input type="checkbox" readOnly checked className="w-3.5 h-3.5 rounded" />
                                <span className="font-medium">
                                  {displayPrivacyConsentText} *
                                </span>
                              </div>
                            </div>

                            <div className="pt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setPreviewMode('success')}
                                className="text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                              >
                                [완료 팝업 시뮬레이션]
                              </button>
                              <div className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#2E7D5B] text-white rounded text-[11px] font-bold shadow-xs">
                                <span>문의 접수하기</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
