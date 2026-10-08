import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Info, 
  Save, 
  Eye, 
  Check, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Layout, 
  Palette, 
  Sparkles, 
  RotateCcw,
  Globe
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { RichTextEditor } from './RichTextEditor';
import { NoticePopup } from '../NoticePopup';
import { SiteConfig, PopupIconType, PopupStyle, Language } from '../../types';

export const NoticePopupManager: React.FC = () => {
  const { config, updateConfig } = useTheme();

  // Local Editor States initialized from config
  const [popupEnabled, setPopupEnabled] = useState<boolean>(!!config.popupEnabled);
  const [popupStyle, setPopupStyle] = useState<PopupStyle>(config.popupStyle || 'modal');
  const [popupColor, setPopupColor] = useState<string>(config.popupColor || '#1A3B6B');
  const [popupIcon, setPopupIcon] = useState<PopupIconType>(config.popupIcon || 'bell');
  const [popupBadge, setPopupBadge] = useState<string>(config.popupBadge || '중요 공지');
  const [popupTitle, setPopupTitle] = useState<string>(config.popupTitle || '');
  const [popupContent, setPopupContent] = useState<string>(config.popupContent || '');
  const [popupLinkText, setPopupLinkText] = useState<string>(config.popupLinkText || '');
  const [popupLinkTab, setPopupLinkTab] = useState<'downloads' | 'schedule' | 'faq' | 'inquiry' | ''>(
    (config.popupLinkTab as any) || 'downloads'
  );
  const [popupLinkUrl, setPopupLinkUrl] = useState<string>(config.popupLinkUrl || '');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLang, setPreviewLang] = useState<Language>('ko');

  // Keep local state in sync when config updates from external source
  useEffect(() => {
    setPopupEnabled(!!config.popupEnabled);
    setPopupStyle(config.popupStyle || 'modal');
    setPopupColor(config.popupColor || '#1A3B6B');
    setPopupIcon(config.popupIcon || 'bell');
    setPopupBadge(config.popupBadge || '중요 공지');
    setPopupTitle(config.popupTitle || '');
    setPopupContent(config.popupContent || '');
    setPopupLinkText(config.popupLinkText || '');
    setPopupLinkTab((config.popupLinkTab as any) || 'downloads');
    setPopupLinkUrl(config.popupLinkUrl || '');
  }, [config]);

  // Handle Save
  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    const updates: Partial<SiteConfig> = {
      popupEnabled,
      popupStyle,
      popupColor,
      popupIcon,
      popupBadge: popupBadge.trim(),
      popupTitle: popupTitle.trim(),
      popupContent,
      popupLinkText: popupLinkText.trim(),
      popupLinkTab,
      popupLinkUrl: popupLinkUrl.trim(),
    };

    const ok = await updateConfig(updates);
    setIsSaving(false);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Draft config for preview
  const draftConfig: SiteConfig = {
    ...config,
    popupEnabled: true,
    popupStyle,
    popupColor,
    popupIcon,
    popupBadge,
    popupTitle,
    popupContent,
    popupLinkText,
    popupLinkTab,
    popupLinkUrl,
  };

  return (
    <div className="space-y-6">
      {/* Live Preview Modal */}
      {previewOpen && (
        <NoticePopup
          config={draftConfig}
          currentLang={previewLang}
          forceOpen={true}
          onCloseForceOpen={() => setPreviewOpen(false)}
        />
      )}

      {/* Top Controller Header */}
      <div className="bg-white rounded-lg border border-[#E2E5E8] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1A3B6B] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900">공지 팝업 관리</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                popupEnabled 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                  : 'bg-gray-100 text-gray-600 border border-gray-300'
              }`}>
                {popupEnabled ? '포털 노출 활성화' : '노출 비활성화'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              외국인 유학생 접속 시 노출되는 메인 알림 팝업 창을 독립적으로 설정하고 서식, 표, 사진을 편집합니다.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded border border-emerald-200 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>설정 저장 완료!</span>
            </span>
          )}

          {/* Test Preview Trigger Button */}
          <button
            onClick={() => setPreviewOpen(true)}
            className="py-2 px-3.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="현재 작성 중인 팝업 디자인을 즉시 확인합니다."
          >
            <Eye className="w-4 h-4" />
            <span>실시간 팝업 미리보기 열기</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-2 px-4 rounded-md bg-[#1A3B6B] hover:bg-[#152e54] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? '저장 중...' : '공지 팝업 저장'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Basic Settings & Style (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Section 1: Activation & Layout Style */}
          <div className="bg-white rounded-lg border border-[#E2E5E8] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <Layout className="w-4 h-4 text-[#1A3B6B]" />
              <span>팝업 사용 및 디자인 형태</span>
            </h3>

            {/* Toggle Enable */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50/70">
              <div>
                <span className="font-bold text-gray-900 block text-xs">
                  공지 팝업 기능 사용
                </span>
                <span className="text-[11px] text-gray-500 block">
                  방문 학생에게 공지창 표시 여부
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={popupEnabled}
                  onChange={(e) => setPopupEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E7D5B]"></div>
              </label>
            </div>

            {/* Layout Style choice */}
            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1.5">
                디자인 형태 (Layout)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPopupStyle('modal')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    popupStyle === 'modal'
                      ? 'border-[#1A3B6B] bg-blue-50/70 ring-1 ring-[#1A3B6B]'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900 text-xs mb-0.5">🏛️ 중앙 모달 창</div>
                  <div className="text-[10px] text-gray-500">화면 중앙 집중 (중요/필수 공지)</div>
                </button>

                <button
                  type="button"
                  onClick={() => setPopupStyle('banner')}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    popupStyle === 'banner'
                      ? 'border-[#1A3B6B] bg-blue-50/70 ring-1 ring-[#1A3B6B]'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-gray-900 text-xs mb-0.5">📌 플로팅 배너</div>
                  <div className="text-[10px] text-gray-500">우측 하단 고정 (비간섭형 알림)</div>
                </button>
              </div>
            </div>

            {/* Header Color Picker */}
            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1.5 flex items-center justify-between">
                <span>헤더 테마 색상</span>
                <span className="font-mono text-[10px] text-gray-400">{popupColor}</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { label: '네이비', color: '#1A3B6B' },
                  { label: '주의 오렌지', color: '#D97736' },
                  { label: '행정 그린', color: '#2E7D5B' },
                  { label: '와인 레드', color: '#8B1D2C' },
                ].map((col) => (
                  <button
                    key={col.color}
                    type="button"
                    onClick={() => setPopupColor(col.color)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold text-white transition-all cursor-pointer ${
                      popupColor === col.color ? 'scale-105 ring-2 ring-offset-1 ring-gray-400 font-bold' : 'opacity-85 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: col.color }}
                  >
                    {col.label}
                  </button>
                ))}
                <input
                  type="color"
                  value={popupColor}
                  onChange={(e) => setPopupColor(e.target.value)}
                  className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 ml-1"
                  title="직접 색상 선택"
                />
              </div>
            </div>

            {/* Representative Icon */}
            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1.5">
                대표 아이콘
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'bell', label: '알림 종', icon: <Bell className="w-3.5 h-3.5" /> },
                  { id: 'alert', label: '주의/긴급', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                  { id: 'calendar', label: '학사일정', icon: <Calendar className="w-3.5 h-3.5" /> },
                  { id: 'info', label: '일반안내', icon: <Info className="w-3.5 h-3.5" /> },
                ].map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setPopupIcon(ic.id as any)}
                    className={`p-2 rounded border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      popupIcon === ic.id
                        ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {ic.icon}
                    <span className="text-[10px]">{ic.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Action Link Button Config */}
          <div className="bg-white rounded-lg border border-[#E2E5E8] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2 pb-2 border-b border-gray-100">
              <ExternalLink className="w-4 h-4 text-[#1A3B6B]" />
              <span>바로가기 버튼 설정 (선택 사항)</span>
            </h3>

            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1">
                버튼 텍스트 문구
              </label>
              <input
                type="text"
                value={popupLinkText}
                onChange={(e) => setPopupLinkText(e.target.value)}
                placeholder="예: 비자 연장 서식 다운로드 바로가기"
                className="w-full px-3 py-2 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1">
                클릭 시 이동할 포털 내부 탭
              </label>
              <select
                value={popupLinkTab}
                onChange={(e) => setPopupLinkTab(e.target.value as any)}
                className="w-full px-3 py-2 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
              >
                <option value="downloads">서식 자료실 (Downloads)</option>
                <option value="schedule">한국어학당 학사 일정 (Schedule)</option>
                <option value="faq">자주 묻는 질문 (FAQ)</option>
                <option value="inquiry">1:1 문의 상담 (Inquiry)</option>
                <option value="">내부 탭 없음</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1">
                또는 외부 연결 웹사이트 URL
              </label>
              <input
                type="url"
                value={popupLinkUrl}
                onChange={(e) => setPopupLinkUrl(e.target.value)}
                placeholder="예: https://www.hikorea.go.kr (새 창으로 이동)"
                className="w-full px-3 py-2 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                * 외부 URL이 입력된 경우 내부 탭 대신 해당 웹사이트가 새 탭으로 열립니다.
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Title & Rich Text Content Editor (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-white rounded-lg border border-[#E2E5E8] p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-900 flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1A3B6B]" />
                <span>공지 제목 및 본문 내용 편집</span>
              </span>
              <span className="text-[11px] font-normal text-gray-500">
                서식 편집, 표(Table) 삽입, 사진 첨부 및 정렬 지원
              </span>
            </h3>

            {/* Badge & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-1">
                <label className="block font-semibold text-gray-700 text-xs mb-1">
                  상단 뱃지 문구
                </label>
                <input
                  type="text"
                  value={popupBadge}
                  onChange={(e) => setPopupBadge(e.target.value)}
                  placeholder="예: 중요 공지"
                  className="w-full px-3 py-2 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-gray-700 text-xs mb-1">
                  공지 팝업 제목
                </label>
                <input
                  type="text"
                  value={popupTitle}
                  onChange={(e) => setPopupTitle(e.target.value)}
                  placeholder="예: 2026학년도 가을학기 비자(D-4) 연장 및 체류 관리 안내"
                  className="w-full px-3 py-2 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B] font-bold"
                />
              </div>
            </div>

            {/* Rich Text Editor for Popup Content */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-semibold text-gray-700 text-xs">
                  팝업 본문 상세 내용 (서식·표·사진 삽입)
                </label>
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span>💡 툴바의 표(Table)와 사진(Image) 버튼을 활용하세요</span>
                </div>
              </div>

              <RichTextEditor
                value={popupContent}
                onChange={setPopupContent}
                placeholder="유학생들에게 안내할 공지사항 본문 내용을 입력하세요. 표, 목록, 사진을 자유롭게 삽입하고 크기/정렬을 조절할 수 있습니다."
                minHeight="380px"
              />
            </div>

            {/* Multi-language Translation Test Preview Bar */}
            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">다국어 번역 미리보기 언어:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { code: 'ko' as Language, label: '한국어 🇰🇷' },
                  { code: 'vi' as Language, label: 'Tiếng Việt 🇻🇳' },
                  { code: 'en' as Language, label: 'English 🇺🇸' },
                  { code: 'zh' as Language, label: '中文 🇨🇳' },
                  { code: 'mn' as Language, label: 'Монгол 🇲🇳' },
                ].map((lng) => (
                  <button
                    key={lng.code}
                    type="button"
                    onClick={() => {
                      setPreviewLang(lng.code);
                      setPreviewOpen(true);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      previewLang === lng.code && previewOpen
                        ? 'bg-[#1A3B6B] text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {lng.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
