import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Lock, HelpCircle, ShieldCheck, Clock, MapPin, Phone, Calendar } from 'lucide-react';
import { collection, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Language, InquiryItem, SiteConfig } from '../types';
import { translations } from '../constants/translations';
import { useTheme } from '../context/ThemeContext';
import { translateText } from '../services/translator';

interface InquirySectionProps {
  currentLang: Language;
  onSuccessSubmitted?: () => void;
  onNavigateSchedule?: () => void;
  config?: Partial<SiteConfig>;
}

export const InquirySection: React.FC<InquirySectionProps> = ({
  currentLang,
  onSuccessSubmitted,
  onNavigateSchedule,
  config: propConfig,
}) => {
  const t = translations[currentLang] || translations.ko;
  const themeContext = useTheme();
  const config = { ...themeContext.config, ...(propConfig || {}) };

  // Config settings with defaults
  const inquiryEnabled = config.inquiryEnabled !== false;
  const minLength = config.inquiryMinLength || 10;
  const maxLength = config.inquiryMaxLength || 1000;
  const enableQuiz = config.inquiryEnableQuiz !== false;

  // Dynamic Translations state
  const [transTitle, setTransTitle] = useState(config.inquiryTitle || t.inquiryTitle);
  const [transSubtitle, setTransSubtitle] = useState(config.inquirySubtitle || t.inquirySub);
  const [transBadge, setTransBadge] = useState(config.inquiryBadgeText || '비로그인 간편 접수');
  const [transNotice, setTransNotice] = useState(config.inquiryNotice || '');
  const [transStudentIdLabel, setTransStudentIdLabel] = useState(config.inquiryStudentIdLabel || t.studentIdLabel);
  const [transStudentIdPlaceholder, setTransStudentIdPlaceholder] = useState(
    config.inquiryStudentIdPlaceholder || t.studentIdPlaceholder
  );
  const [transNameLabel, setTransNameLabel] = useState(config.inquiryNameLabel || t.nameLabel);
  const [transNamePlaceholder, setTransNamePlaceholder] = useState(
    config.inquiryNamePlaceholder || t.namePlaceholder
  );
  const [transContentLabel, setTransContentLabel] = useState(config.inquiryContentLabel || t.contentLabel);
  const [transContentPlaceholder, setTransContentPlaceholder] = useState(
    config.inquiryContentPlaceholder || t.contentPlaceholder
  );
  const [transPrivacyNotice, setTransPrivacyNotice] = useState(config.inquiryPrivacyNotice || t.privacyNotice);
  const [transPrivacyConsent, setTransPrivacyConsent] = useState(config.inquiryPrivacyConsentText || t.privacyConsent);
  const [transSuccessTitle, setTransSuccessTitle] = useState(config.inquirySuccessTitle || t.inquirySuccessTitle);
  const [transSuccessDesc, setTransSuccessDesc] = useState(config.inquirySuccessDesc || t.inquirySuccessDesc);
  const [transPausedNotice, setTransPausedNotice] = useState(
    config.inquiryPausedNotice ||
      '현재 행정실 사정으로 1:1 빠른 문의 온라인 접수가 일시 중단되었습니다. 급한 용무는 행정실로 전화 또는 방문 문의 바랍니다.'
  );

  // Sync and auto-translate when currentLang or config changes
  useEffect(() => {
    const rawTitle = config.inquiryTitle || '1:1 빠른 문의 접수';
    const rawSubtitle =
      config.inquirySubtitle ||
      '한국어학당 학사 및 비자 등 궁금한 점을 남겨주시면 담당 선생님이 확인 후 신속히 연락드립니다.';
    const rawBadge = config.inquiryBadgeText || '비로그인 간편 접수';
    const rawNotice =
      config.inquiryNotice ||
      '접수된 문의는 행정실 운영시간(09:00~17:00) 내 순차적으로 확인됩니다. 비자 만료일이 촉박한 경우 행정실(동영관 101호)에 직접 방문해 주시기 바랍니다.';
    const rawStudentLabel = config.inquiryStudentIdLabel || '학번';
    const rawStudentPlace = config.inquiryStudentIdPlaceholder || '학번 7자리 영문 대문자+숫자 입력 (예: F014567)';
    const rawNameLabel = config.inquiryNameLabel || '성명';
    const rawNamePlace = config.inquiryNamePlaceholder || '외국인등록증 또는 여권상 영문/한글 성명';
    const rawContentLabel = config.inquiryContentLabel || '문의 내용';
    const rawContentPlace =
      config.inquiryContentPlaceholder || '비자 연장, 출결, 기숙사, 서류 등 궁금하신 사항을 자세히 적어주세요.';
    const rawPrivacyNotice =
      config.inquiryPrivacyNotice ||
      '개인정보 수집 및 이용 안내: 수집항목(학번, 성명, 문의내용)은 1:1 학사 행정 상담 및 답변 처리를 위해서만 이용되며, 관련 법령에 따라 안전하게 보관됩니다.';
    const rawPrivacyConsent = config.inquiryPrivacyConsentText || '개인정보 수집 및 이용에 동의합니다.';
    const rawSuccessTitle = config.inquirySuccessTitle || '문의가 정상적으로 접수되었습니다!';
    const rawSuccessDesc =
      config.inquirySuccessDesc ||
      '담당 선생님이 내용을 확인한 후 학번 또는 행정 시스템에 등록된 연락처로 신속히 답변해 드리겠습니다.';
    const rawPausedNotice =
      config.inquiryPausedNotice ||
      '현재 행정실 사정으로 1:1 빠른 문의 온라인 접수가 일시 중단되었습니다. 급한 용무는 행정실(동영관 101호)로 전화 또는 방문 문의 바랍니다.';

    if (currentLang === 'ko') {
      setTransTitle(rawTitle);
      setTransSubtitle(rawSubtitle);
      setTransBadge(rawBadge);
      setTransNotice(rawNotice);
      setTransStudentIdLabel(rawStudentLabel);
      setTransStudentIdPlaceholder(rawStudentPlace);
      setTransNameLabel(rawNameLabel);
      setTransNamePlaceholder(rawNamePlace);
      setTransContentLabel(rawContentLabel);
      setTransContentPlaceholder(rawContentPlace);
      setTransPrivacyNotice(rawPrivacyNotice);
      setTransPrivacyConsent(rawPrivacyConsent);
      setTransSuccessTitle(rawSuccessTitle);
      setTransSuccessDesc(rawSuccessDesc);
      setTransPausedNotice(rawPausedNotice);
      return;
    }

    let isMounted = true;
    Promise.all([
      translateText(rawTitle, currentLang, 'ko'),
      translateText(rawSubtitle, currentLang, 'ko'),
      translateText(rawBadge, currentLang, 'ko'),
      translateText(rawNotice, currentLang, 'ko'),
      translateText(rawStudentLabel, currentLang, 'ko'),
      translateText(rawStudentPlace, currentLang, 'ko'),
      translateText(rawNameLabel, currentLang, 'ko'),
      translateText(rawNamePlace, currentLang, 'ko'),
      translateText(rawContentLabel, currentLang, 'ko'),
      translateText(rawContentPlace, currentLang, 'ko'),
      translateText(rawPrivacyNotice, currentLang, 'ko'),
      translateText(rawPrivacyConsent, currentLang, 'ko'),
      translateText(rawSuccessTitle, currentLang, 'ko'),
      translateText(rawSuccessDesc, currentLang, 'ko'),
      translateText(rawPausedNotice, currentLang, 'ko'),
    ]).then(
      ([
        tTitle,
        tSubtitle,
        tBadge,
        tNotice,
        tStdLabel,
        tStdPlace,
        tNmLabel,
        tNmPlace,
        tCtLabel,
        tCtPlace,
        tPrivNotice,
        tPrivConsent,
        tSuccTitle,
        tSuccDesc,
        tPauseNotice,
      ]) => {
        if (isMounted) {
          setTransTitle(tTitle);
          setTransSubtitle(tSubtitle);
          setTransBadge(tBadge);
          setTransNotice(tNotice);
          setTransStudentIdLabel(tStdLabel);
          setTransStudentIdPlaceholder(tStdPlace);
          setTransNameLabel(tNmLabel);
          setTransNamePlaceholder(tNmPlace);
          setTransContentLabel(tCtLabel);
          setTransContentPlaceholder(tCtPlace);
          setTransPrivacyNotice(tPrivNotice);
          setTransPrivacyConsent(tPrivConsent);
          setTransSuccessTitle(tSuccTitle);
          setTransSuccessDesc(tSuccDesc);
          setTransPausedNotice(tPauseNotice);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [
    currentLang,
    config.inquiryTitle,
    config.inquirySubtitle,
    config.inquiryBadgeText,
    config.inquiryNotice,
    config.inquiryStudentIdLabel,
    config.inquiryStudentIdPlaceholder,
    config.inquiryNameLabel,
    config.inquiryNamePlaceholder,
    config.inquiryContentLabel,
    config.inquiryContentPlaceholder,
    config.inquiryPrivacyNotice,
    config.inquiryPrivacyConsentText,
    config.inquirySuccessTitle,
    config.inquirySuccessDesc,
    config.inquiryPausedNotice,
  ]);

  // Form State
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');
  const [consent, setConsent] = useState(false);
  const [botAnswer, setBotAnswer] = useState('');

  // Math Quiz for anti-bot
  const [num1, setNum1] = useState(7);
  const [num2, setNum2] = useState(5);

  // Status & Validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const generateNewQuiz = () => {
    const a = Math.floor(Math.random() * 8) + 2; // 2..9
    const b = Math.floor(Math.random() * 8) + 2; // 2..9
    setNum1(a);
    setNum2(b);
    setBotAnswer('');
  };

  useEffect(() => {
    generateNewQuiz();
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    // Student ID: Exactly 7 alphanumeric characters (e.g. F014567)
    const studentIdRegex = /^[A-Z0-9]{7}$/;
    if (!studentId.trim() || !studentIdRegex.test(studentId.trim())) {
      errs.studentId = '학번은 영문 대문자 및 숫자로 구성된 7자리로 입력해야 합니다. (예: F014567)';
    }

    // Name: min 2 chars
    if (!name.trim() || name.trim().length < 2) {
      errs.name = t.nameError;
    }

    // Content: minLength ~ maxLength chars
    if (!content.trim() || content.trim().length < minLength) {
      errs.content = `${transContentLabel}: ${minLength}자 이상 입력해 주세요. (${t.contentError})`;
    }

    // Consent
    if (!consent) {
      errs.consent = t.privacyError;
    }

    // Math Quiz
    if (enableQuiz) {
      const expected = num1 + num2;
      if (parseInt(botAnswer.trim(), 10) !== expected) {
        errs.bot = t.antiBotError;
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    const newId = `inq-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const newInquiry: InquiryItem = {
      id: newId,
      studentId: studentId.trim(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      content: content.trim(),
      status: 'pending',
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    try {
      // Save to Firestore
      try {
        await setDoc(doc(db, 'inquiries', newId), newInquiry);
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.CREATE, `inquiries/${newId}`);
      }

      // Also save to localStorage inquiries cache so student/admin has immediate persistence
      try {
        const stored = localStorage.getItem('kmu_inquiries');
        const list: InquiryItem[] = stored ? JSON.parse(stored) : [];
        list.unshift(newInquiry);
        localStorage.setItem('kmu_inquiries', JSON.stringify(list));
      } catch {
        // ignore
      }

      // Clear form
      setStudentId('');
      setName('');
      setPhone('');
      setContent('');
      setConsent(false);
      setBotAnswer('');
      generateNewQuiz();
      setErrors({});
      setShowSuccessModal(true);
    } catch (err) {
      console.error('Inquiry submission error:', err);
      try {
        const stored = localStorage.getItem('kmu_inquiries');
        const list: InquiryItem[] = stored ? JSON.parse(stored) : [];
        list.unshift(newInquiry);
        localStorage.setItem('kmu_inquiries', JSON.stringify(list));
        setShowSuccessModal(true);
      } catch {
        setErrors({ submit: '접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Quick Link to Academic Calendar banner (Unified Card Header) */}
      {onNavigateSchedule && (
        <div className="mb-5 p-3.5 sm:p-4 bg-white border border-[#E2E5E8] rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <span className="text-sm md:text-base font-bold shrink-0 text-[#1A3B6B] flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>학사 일정 안내</span>
            </span>
            <span className="w-px h-3.5 sm:h-4 bg-gray-300/80 shrink-0" aria-hidden="true" />
            <h4 className="text-sm md:text-base font-bold text-gray-800 truncate">
              한국어학당 연간·학기별 학사 일정 확인
            </h4>
          </div>
          <button
            type="button"
            onClick={onNavigateSchedule}
            className="px-3 py-1.5 rounded bg-[#1A3B6B] hover:bg-blue-900 text-white text-xs font-bold shrink-0 transition-colors cursor-pointer shadow-2xs flex items-center justify-center gap-1 min-h-[32px]"
          >
            <span>일정 확인하기</span>
            <span>→</span>
          </button>
        </div>
      )}

      {/* Header Card (Unified with FAQ standard) */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 sm:p-5 mb-5 shadow-xs">
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="text-sm md:text-base font-bold shrink-0 text-[#2E7D5B] flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>{transBadge}</span>
          </span>
          <span className="w-px h-3.5 sm:h-4 bg-gray-300/80 shrink-0" aria-hidden="true" />
          <h2 className="text-sm md:text-base font-bold text-gray-900 leading-snug">
            {transTitle}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mt-2 leading-relaxed">
          {transSubtitle}
        </p>

        {transNotice && (
          <div className="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded text-xs sm:text-sm text-blue-900 leading-relaxed flex items-start gap-2">
            <span className="shrink-0 text-sm">ℹ️</span>
            <span>{transNotice}</span>
          </div>
        )}
      </div>

      {/* If Inquiry is paused by admin */}
      {!inquiryEnabled ? (
        <div className="bg-white rounded-md border border-[#E2E5E8] p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              1:1 빠른 문의 온라인 접수 일시 중단 안내
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              {transPausedNotice}
            </p>
          </div>

          <div className="max-w-md mx-auto p-4 bg-gray-50 border border-gray-200 rounded text-left text-xs text-gray-600 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1A3B6B] shrink-0" />
              <span><strong>행정실 운영시간:</strong> {config.officeHours}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#1A3B6B] shrink-0" />
              <span><strong>전화 문의:</strong> {config.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1A3B6B] shrink-0" />
              <span><strong>방문 위치:</strong> {config.location}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Active Form Container */
        <div className="bg-white rounded-md border border-[#E2E5E8] p-3.5 sm:p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Student ID, Name & Phone Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
              {/* Student ID */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {transStudentIdLabel} <span className="text-red-500">*</span>
                  <span className="text-[10px] text-gray-400 font-normal ml-1">(대문자+숫자 7자리)</span>
                </label>
                <input
                  type="text"
                  value={studentId}
                  maxLength={7}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                    setStudentId(val);
                    if (errors.studentId) setErrors((prev) => ({ ...prev, studentId: '' }));
                  }}
                  placeholder="예: F014567"
                  className={`w-full px-3 py-2 sm:py-2 text-base sm:text-xs rounded border transition-colors font-bold uppercase tracking-wider ${
                    errors.studentId
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#1A3B6B] focus:bg-white'
                  }`}
                />
                {errors.studentId && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.studentId}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {transNameLabel} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  maxLength={50}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder={transNamePlaceholder}
                  className={`w-full px-3 py-2 sm:py-2 text-base sm:text-xs rounded border transition-colors ${
                    errors.name
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-gray-200 focus:border-[#1A3B6B] focus:bg-white'
                  }`}
                />
                {errors.name && (
                  <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>
                )}
              </div>

              {/* Phone / Contact (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center justify-between">
                  <span>연락처 (전화/메신저)</span>
                  <span className="text-[10px] text-gray-400 font-normal">선택사항</span>
                </label>
                <input
                  type="text"
                  value={phone}
                  maxLength={30}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="예: 010-1234-5678, 카톡 ID"
                  className="w-full px-3 py-2 sm:py-2 text-base sm:text-xs rounded border border-gray-200 focus:border-[#1A3B6B] focus:bg-white transition-colors"
                />
              </div>
            </div>

            {/* Inquiry Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">
                  {transContentLabel} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-medium text-gray-400">
                  {content.length} / {maxLength}자 (최소 {minLength}자)
                </span>
              </div>
              <textarea
                rows={5}
                value={content}
                maxLength={maxLength}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
                }}
                placeholder={transContentPlaceholder}
                className={`w-full px-3 py-2.5 text-base sm:text-xs rounded border transition-colors leading-relaxed ${
                  errors.content
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-gray-200 focus:border-[#1A3B6B] focus:bg-white'
                }`}
              />
              {errors.content && (
                <p className="text-[11px] text-red-600 mt-1">{errors.content}</p>
              )}
            </div>

            {/* Anti-Bot Math Quiz */}
            {enableQuiz && (
              <div className="bg-[#f8f9fa] rounded p-3 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-center gap-2 text-xs text-gray-700 flex-wrap">
                    <span className="font-semibold text-[#1A3B6B]">{t.antiBotQuestion}</span>
                    <span className="px-2.5 py-1 bg-white font-bold text-sm rounded border border-gray-300 text-gray-800">
                      {num1} + {num2} = ?
                    </span>
                    <button
                      type="button"
                      onClick={generateNewQuiz}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                      title="다른 문제 풀기"
                      aria-label="새 퀴즈 문제"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="w-full sm:w-40">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={botAnswer}
                      maxLength={3}
                      onChange={(e) => {
                        setBotAnswer(e.target.value.replace(/[^0-9]/g, ''));
                        if (errors.bot) setErrors((prev) => ({ ...prev, bot: '' }));
                      }}
                      placeholder={t.antiBotPlaceholder}
                      className={`w-full px-3 py-2 sm:py-1.5 text-base sm:text-xs text-center font-bold bg-white rounded border ${
                        errors.bot ? 'border-red-500' : 'border-gray-300 focus:border-[#1A3B6B]'
                      }`}
                    />
                  </div>
                </div>
                {errors.bot && (
                  <p className="text-[11px] text-red-600 mt-1.5">{errors.bot}</p>
                )}
              </div>
            )}

            {/* Privacy Consent Agreement */}
            <div className="pt-1">
              <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 leading-relaxed mb-2 break-word-safe">
                {transPrivacyNotice}
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none py-1">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    if (errors.consent) setErrors((prev) => ({ ...prev, consent: '' }));
                  }}
                  className="w-4 h-4 rounded text-[#1A3B6B] focus:ring-[#1A3B6B] border-gray-300 shrink-0"
                />
                <span className="text-xs font-medium text-gray-800">
                  {transPrivacyConsent} <span className="text-red-500">*</span>
                </span>
              </label>
              {errors.consent && (
                <p className="text-[11px] text-red-600 mt-1">{errors.consent}</p>
              )}
            </div>

            {/* General Submit Error */}
            {errors.submit && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errors.submit}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded text-sm sm:text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#25664a] shadow-xs transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? '접수 중...' : t.submitInquiry}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Completion Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-white rounded-md max-w-md w-full p-6 text-center border border-[#E2E5E8] shadow-xl animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#2E7D5B] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-2">
              {transSuccessTitle}
            </h3>

            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              {transSuccessDesc}
            </p>

            <div className="p-3 bg-gray-50 rounded border border-gray-200 text-left text-xs text-gray-500 mb-5 space-y-1">
              <p>• <strong>행정실 운영시간:</strong> {config.officeHours}</p>
              <p>• <strong>문의처:</strong> {config.phone} (동영관 101호)</p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-2.5 bg-[#1A3B6B] hover:bg-[#142e54] text-white text-xs font-bold rounded transition-colors cursor-pointer"
            >
              {t.inquiryCompleteButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
