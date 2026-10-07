import React, { useState, useRef, useEffect } from 'react';
import { 
  Palette, 
  Layout, 
  Type, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Sliders, 
  Phone, 
  MapPin, 
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Eye,
  Bell,
  AlertTriangle,
  Calendar,
  Info,
  ExternalLink,
  Landmark,
  GraduationCap,
  BookOpen,
  Shield,
  Globe,
  SlidersHorizontal,
  Tags,
  Plus,
  Trash2,
  Edit3,
  CalendarCheck,
  FileBadge,
  Building2,
  ScrollText,
  HeartPulse,
  Coins,
  Briefcase,
  Compass,
  Search,
  ArrowRight,
  HelpCircle,
  Bot,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Link2,
  Upload,
  Smartphone,
  Tablet,
  Monitor,
  Archive,
  History,
  Maximize2,
  Minimize2,
  FileCheck,
  FolderArchive
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { KmuLogo } from '../KmuLogo';
import { NoticePopup } from '../NoticePopup';
import { Navbar } from '../Navbar';
import { HeroSection } from '../HeroSection';
import { FaqSection } from '../FaqSection';
import { DownloadsSection } from '../DownloadsSection';
import { ScheduleSection } from '../ScheduleSection';
import { InquirySection } from '../InquirySection';
import { Footer } from '../Footer';
import { IntegratedSearchResults } from '../IntegratedSearchResults';
import { 
  LogoType, 
  PopupStyle, 
  PopupIconType, 
  CategoryItem, 
  RelatedSite, 
  ConfigArchiveItem,
  FaqItem,
  DocumentItem,
  ScheduleEvent,
  Language
} from '../../types';
import { DEFAULT_RELATED_SITES } from '../../constants/initialRelatedSites';
import { initialFaqs, initialDocuments } from '../../constants/initialData';
import { INITIAL_SCHEDULES } from '../../constants/initialSchedules';

export interface ThemeCustomizerProps {
  faqs?: FaqItem[];
  documents?: DocumentItem[];
  schedules?: ScheduleEvent[];
  currentLang?: Language;
  onExit?: () => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  faqs,
  documents,
  schedules,
  currentLang = 'ko',
  onExit,
}) => {
  const {
    config,
    draftConfig,
    archives,
    updateDraft,
    saveDraftToLive,
    resetDraftToLive,
    resetToFactoryDefaults,
    createArchiveSnapshot,
    restoreArchive,
    deleteArchive,
    isSaving,
    saveMessage,
    setIsDesignMode,
  } = useTheme();

  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'brand' | 'logo' | 'hero' | 'archive' | 'popup' | 'footer' | 'mood' | 'chatbot'
  >('brand');
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const [logoPreviewBgDark, setLogoPreviewBgDark] = useState(false);
  const [logoFileNotice, setLogoFileNotice] = useState<string | null>(null);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  // Archive & Publishing States (요청 6: 적용하기 / 게시하기 및 보관)
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishVersionTitle, setPublishVersionTitle] = useState('');
  const [isCreatingManualArchive, setIsCreatingManualArchive] = useState(false);
  const [manualArchiveTitle, setManualArchiveTitle] = useState('');
  const [manualArchiveNote, setManualArchiveNote] = useState('');
  const [archiveActionToast, setArchiveActionToast] = useState<string | null>(null);
  const [restoreConfirmTarget, setRestoreConfirmTarget] = useState<ConfigArchiveItem | null>(null);
  const [deleteArchiveTarget, setDeleteArchiveTarget] = useState<ConfigArchiveItem | null>(null);

  // Live Preview Enhancement States (요청 8: 실시간 미리보기 보완 및 개선)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewSection, setPreviewSection] = useState<'all' | 'hero' | 'faq' | 'docs' | 'schedule' | 'inquiry' | 'popup'>('all');
  const [previewLang, setPreviewLang] = useState<'ko' | 'en' | 'vi' | 'zh' | 'mn'>('ko');
  const [previewFaqExpanded, setPreviewFaqExpanded] = useState<string | null>('faq-preview-1');
  const [previewSearchText, setPreviewSearchText] = useState('');
  const [previewSelectedCategory, setPreviewSelectedCategory] = useState<string>('all');
  const [previewTab, setPreviewTab] = useState<'faq' | 'downloads' | 'inquiry' | 'schedule'>('faq');
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);

  // Activate design mode in ThemeContext on mount so draftConfig & draft CSS variables are active
  useEffect(() => {
    setIsDesignMode(true);
    return () => {
      setIsDesignMode(false);
    };
  }, [setIsDesignMode]);

  // Real datasets for authentic 1:1 Live Preview (미리보기와 메인화면 일치화)
  const isMockItem = (id?: string) => {
    if (!id) return true;
    return (
      /^faq-[1-8]$/.test(id) ||
      /^doc-[1-6]$/.test(id) ||
      /^sch-(spring|summer|fall|winter|2025|2026)/.test(id)
    );
  };

  const effectiveFaqs: FaqItem[] = (faqs && faqs.length > 0)
    ? faqs.filter((f) => !isMockItem(f?.id))
    : (() => {
        try {
          const c = localStorage.getItem('kmu_faqs_cache');
          return c ? JSON.parse(c).filter((f: any) => !isMockItem(f?.id)) : [];
        } catch {
          return [];
        }
      })();

  const effectiveDocs: DocumentItem[] = (documents && documents.length > 0)
    ? documents.filter((d) => !isMockItem(d?.id))
    : (() => {
        try {
          const c = localStorage.getItem('kmu_docs_cache');
          return c ? JSON.parse(c).filter((d: any) => !isMockItem(d?.id)) : [];
        } catch {
          return [];
        }
      })();

  const effectiveSchedules: ScheduleEvent[] = (schedules && schedules.length > 0)
    ? schedules.filter((s) => !isMockItem(s?.id))
    : (() => {
        try {
          const c = localStorage.getItem('kmu_schedules_cache');
          return c ? JSON.parse(c).filter((s: any) => !isMockItem(s?.id)) : [];
        } catch {
          return [];
        }
      })();

  // Preset themes
  const presets = [
    {
      name: '정통 계명대 네이비 (기본)',
      mainColor: '#1A3B6B',
      accentColor: '#2E7D5B',
      warnColor: '#D97736',
    },
    {
      name: '비사 포레스트 그린',
      mainColor: '#1E4d38',
      accentColor: '#1A3B6B',
      warnColor: '#C86428',
    },
    {
      name: '학술 클래식 슬레이트',
      mainColor: '#243447',
      accentColor: '#306850',
      warnColor: '#cf632b',
    },
    {
      name: '계명 로열 마린블루',
      mainColor: '#004ea1',
      accentColor: '#207850',
      warnColor: '#e07020',
    },
  ];

  const categoryIcons = [
    { id: 'CalendarCheck', label: '출결/일정', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'FileBadge', label: '비자/문서', icon: <FileBadge className="w-4 h-4" /> },
    { id: 'Building2', label: '기숙사/건물', icon: <Building2 className="w-4 h-4" /> },
    { id: 'ScrollText', label: '행정/서식', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'GraduationCap', label: '학위/졸업', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'Coins', label: '장학/등록금', icon: <Coins className="w-4 h-4" /> },
    { id: 'Briefcase', label: '취업/알바', icon: <Briefcase className="w-4 h-4" /> },
    { id: 'HeartPulse', label: '건강/보험', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'Compass', label: '생활/교통', icon: <Compass className="w-4 h-4" /> },
    { id: 'BookOpen', label: '수업/도서관', icon: <BookOpen className="w-4 h-4" /> },
  ];

  const handleSaveDraft = () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleOpenPublishModal = () => {
    const now = new Date();
    setPublishVersionTitle(
      `게시본 (${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      })})`
    );
    setShowPublishModal(true);
  };

  const handlePublishSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await saveDraftToLive(publishVersionTitle || undefined);
    setShowPublishModal(false);
    setPublishVersionTitle('');
  };

  // Logo file upload handler (요청 7: 로고 이미지 파일 업로드 기능)
  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processLogoFile(files[0]);
  };

  const processLogoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, SVG, WebP)만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('로고 파일 용량은 5MB 이하로 업로드해 주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        updateDraft({
          logoType: 'image',
          logoUrl: dataUrl,
        });
        setLogoFileNotice(`✓ 로고 업로드 성공: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Manual archive snapshot creation (요청 6: 수정 후 보관 기능)
  const handleCreateManualArchive = async (e: React.FormEvent) => {
    e.preventDefault();
    await createArchiveSnapshot(manualArchiveTitle, manualArchiveNote);
    setManualArchiveTitle('');
    setManualArchiveNote('');
    setIsCreatingManualArchive(false);
    setArchiveActionToast('현재 설정이 보관함에 안전하게 백업되었습니다.');
    setTimeout(() => setArchiveActionToast(null), 3000);
  };

  const handleRestoreArchiveConfirmed = async () => {
    if (!restoreConfirmTarget) return;
    await restoreArchive(restoreConfirmTarget.id, false);
    setRestoreConfirmTarget(null);
    setArchiveActionToast(`'${restoreConfirmTarget.title}' 버전이 실시간 포털에 복원되었습니다.`);
    setTimeout(() => setArchiveActionToast(null), 3000);
  };

  const handleDeleteArchiveConfirmed = async () => {
    if (!deleteArchiveTarget) return;
    await deleteArchive(deleteArchiveTarget.id);
    setDeleteArchiveTarget(null);
    setArchiveActionToast('보관된 버전 기록이 삭제되었습니다.');
    setTimeout(() => setArchiveActionToast(null), 3000);
  };

  // Related Sites Editor State & Handlers
  const [editingSite, setEditingSite] = useState<RelatedSite | null>(null);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [siteFormName, setSiteFormName] = useState('');
  const [siteFormNameEn, setSiteFormNameEn] = useState('');
  const [siteFormUrl, setSiteFormUrl] = useState('');
  const [siteFormBadge, setSiteFormBadge] = useState('');
  const [siteFormDesc, setSiteFormDesc] = useState('');

  const currentRelatedSites: RelatedSite[] = (draftConfig.relatedSites && draftConfig.relatedSites.length > 0)
    ? draftConfig.relatedSites
    : DEFAULT_RELATED_SITES;

  const handleOpenAddSite = () => {
    setEditingSite(null);
    setSiteFormName('');
    setSiteFormNameEn('');
    setSiteFormUrl('https://');
    setSiteFormBadge('공식포털');
    setSiteFormDesc('');
    setIsAddingSite(true);
  };

  const handleOpenEditSite = (site: RelatedSite) => {
    setEditingSite(site);
    setSiteFormName(site.name);
    setSiteFormNameEn(site.nameEn || '');
    setSiteFormUrl(site.url);
    setSiteFormBadge(site.badge || '');
    setSiteFormDesc(site.desc || '');
    setIsAddingSite(true);
  };

  const handleSaveSiteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteFormName.trim() || !siteFormUrl.trim()) {
      alert('사이트 명칭과 URL 주소를 입력해 주세요.');
      return;
    }
    const currentList = [...currentRelatedSites];
    if (editingSite) {
      const idx = currentList.findIndex(s => s.id === editingSite.id);
      if (idx !== -1) {
        currentList[idx] = {
          ...editingSite,
          name: siteFormName.trim(),
          nameEn: siteFormNameEn.trim(),
          url: siteFormUrl.trim(),
          badge: siteFormBadge.trim(),
          desc: siteFormDesc.trim(),
        };
      }
    } else {
      const newId = `site-${Date.now()}`;
      currentList.push({
        id: newId,
        name: siteFormName.trim(),
        nameEn: siteFormNameEn.trim(),
        url: siteFormUrl.trim(),
        badge: siteFormBadge.trim(),
        desc: siteFormDesc.trim(),
      });
    }
    updateDraft({ relatedSites: currentList });
    setIsAddingSite(false);
    setEditingSite(null);
  };

  const handleDeleteSite = (id: string) => {
    if (!window.confirm('해당 바로가기 웹사이트를 삭제하시겠습니까?')) return;
    const filtered = currentRelatedSites.filter(s => s.id !== id);
    updateDraft({ relatedSites: filtered });
  };

  const handleMoveSite = (idx: number, direction: 'up' | 'down') => {
    const list = [...currentRelatedSites];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    updateDraft({ relatedSites: list });
  };

  const handleResetRelatedSites = () => {
    if (!window.confirm('유학생 관련 웹사이트 바로가기를 기본 5개(하이코리아, TOPIK, 스터디인코리아 등)로 복원하시겠습니까?')) return;
    updateDraft({ relatedSites: DEFAULT_RELATED_SITES });
  };

  return (
    <div className="bg-[#f0f2f5] min-h-[calc(100vh-120px)] p-4 md:p-6">
      {/* Test Notice Popup if triggered */}
      {previewPopupOpen && (
        <NoticePopup
          config={draftConfig}
          forceOpen={true}
          onCloseForceOpen={() => setPreviewPopupOpen(false)}
        />
      )}

      {/* Top Controller Bar */}
      <div className="max-w-7xl mx-auto bg-white rounded-md border border-[#E2E5E8] p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-amber-50 text-amber-700 border border-amber-200">
            <Sparkles className="w-5 h-5 text-[#D97736]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span>디자인 모드 (Theme Customizer)</span>
            </h2>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {saveMessage && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              {saveMessage}
            </span>
          )}

          {archiveActionToast && (
            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200 animate-fade-in flex items-center gap-1">
              <Archive className="w-3.5 h-3.5 text-purple-600" />
              {archiveActionToast}
            </span>
          )}

          {draftSavedToast && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              임시 저장 완료
            </span>
          )}

          <button
            onClick={() => {
              if (onExit) {
                onExit();
              } else {
                setIsDesignMode(false);
              }
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            편집 종료
          </button>

          <button
            onClick={resetDraftToLive}
            title="현재 서버에 저장된 상태로 되돌리기"
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>원복</span>
          </button>

          <button
            onClick={handleSaveDraft}
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>임시 저장</span>
          </button>

          {/* Manual Snapshot Backup Button */}
          <button
            onClick={() => {
              const now = new Date();
              setManualArchiveTitle(
                `디자인 백업 (${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })})`
              );
              setManualArchiveNote('');
              setIsCreatingManualArchive(true);
            }}
            className="px-3 py-1.5 rounded text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="현재 설정을 버전 보관함에 즉시 백업"
          >
            <Archive className="w-3.5 h-3.5 text-purple-600" />
            <span>현재 설정 보관</span>
          </button>

          {/* Publish / Apply Button */}
          <button
            onClick={handleOpenPublishModal}
            disabled={isSaving}
            className="px-4 py-1.5 rounded text-xs font-bold text-white transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: draftConfig.mainColor || '#1A3B6B' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? '게시 중...' : '적용하기 / 게시하기'}</span>
          </button>
        </div>
      </div>

      {/* Split View Container */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Customization Controls (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-md border border-[#E2E5E8] shadow-xs overflow-hidden">
          {/* Section Tabs */}
          <div className="flex border-b border-[#E2E5E8] bg-gray-50 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveCategoryTab('brand')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeCategoryTab === 'brand'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              컬러 테마
            </button>
            <button
              onClick={() => setActiveCategoryTab('logo')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeCategoryTab === 'logo'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              로고 편집
            </button>
            <button
              onClick={() => setActiveCategoryTab('hero')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeCategoryTab === 'hero'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              메인 배너/검색
            </button>
            <button
              onClick={() => setActiveCategoryTab('archive')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeCategoryTab === 'archive'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-purple-600" />
              <span>보관함 ({archives.length})</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab('popup')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeCategoryTab === 'popup'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
              <span>공지 팝업</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab('footer')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeCategoryTab === 'footer'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              푸터/관련 사이트
            </button>
            <button
              onClick={() => setActiveCategoryTab('mood')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeCategoryTab === 'mood'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-indigo-600" />
              <span>폰트 세부 설정</span>
            </button>
            <button
              onClick={() => setActiveCategoryTab('chatbot')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeCategoryTab === 'chatbot'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span>챗봇</span>
            </button>
          </div>

          <div className="p-5 max-h-[calc(100vh-250px)] overflow-y-auto text-xs">
            {/* TAB 1: Brand & Colors */}
            {activeCategoryTab === 'brand' && (
              <div className="space-y-5">
                <div>
                  <label className="block font-bold text-gray-800 mb-2">
                    빠른 테마 프리셋
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() =>
                          updateDraft({
                            mainColor: preset.mainColor,
                            accentColor: preset.accentColor,
                            warnColor: preset.warnColor,
                          })
                        }
                        className="p-2.5 rounded border border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-white text-left transition-all flex flex-col gap-1.5"
                      >
                        <span className="font-semibold text-gray-800 text-[11px]">
                          {preset.name}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.mainColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.accentColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-black/10"
                            style={{ backgroundColor: preset.warnColor }}
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      메인 브랜드 컬러 (헤더, 주요 버튼, 포인트)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftConfig.mainColor}
                        onChange={(e) => updateDraft({ mainColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={draftConfig.mainColor}
                        onChange={(e) => updateDraft({ mainColor: e.target.value })}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono text-xs w-28 uppercase"
                      />
                      <span className="text-[11px] text-gray-400">
                        기본: #1A3B6B (매트 네이비)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      서브 포인트 컬러 (행정 안내 및 검색 버튼 기본)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftConfig.accentColor}
                        onChange={(e) => updateDraft({ accentColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={draftConfig.accentColor}
                        onChange={(e) => updateDraft({ accentColor: e.target.value })}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono text-xs w-28 uppercase"
                      />
                      <span className="text-[11px] text-gray-400">
                        기본: #2E7D5B (딥 그린)
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      주의 및 중요 알림 컬러 (중요 공지용)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draftConfig.warnColor}
                        onChange={(e) => updateDraft({ warnColor: e.target.value })}
                        className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0.5"
                      />
                      <input
                        type="text"
                        value={draftConfig.warnColor}
                        onChange={(e) => updateDraft({ warnColor: e.target.value })}
                        className="px-2 py-1 bg-gray-50 border border-gray-200 rounded font-mono text-xs w-28 uppercase"
                      />
                      <span className="text-[11px] text-gray-400">
                        기본: #D97736 (덜-오렌지)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Logo Design Feature */}
            {activeCategoryTab === 'logo' && (
              <div className="space-y-5">
                {/* Logo Title Toggle */}
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-gray-900 text-xs mb-0.5">
                      로고 옆 메인 타이틀/배너 표시 (활성 / 비활성)
                    </div>
                    <div className="text-[11px] text-gray-500">
                      상단 헤더의 로고 우측에 포털 명칭(타이틀/배너 텍스트)을 노출하거나 숨깁니다.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateDraft({ showLogoTitle: draftConfig.showLogoTitle === false ? true : false })}
                    className={`px-3 py-1.5 rounded text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                      draftConfig.showLogoTitle !== false
                        ? 'bg-[#1A3B6B] text-white shadow-2xs'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {draftConfig.showLogoTitle !== false ? '✓ 활성 (표시)' : '✕ 비활성 (숨김)'}
                  </button>
                </div>

                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    로고 형태 선택 (Logo Type)
                  </label>
                  <p className="text-[11px] text-gray-500 mb-3">
                    헤더 상단에 표시할 로고의 형식을 선택하세요.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateDraft({ logoType: 'none' })}
                      className={`p-3 rounded border text-left transition-all ${
                        (draftConfig.logoType || 'none') === 'none'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">로고 없음 (미사용)</div>
                      <div className="text-[11px] text-gray-500">포털 타이틀만 단독 표시</div>
                    </button>

                    <button
                      onClick={() => updateDraft({ logoType: 'symbol_text' })}
                      className={`p-3 rounded border text-left transition-all ${
                        draftConfig.logoType === 'symbol_text'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">심볼 + 텍스트</div>
                      <div className="text-[11px] text-gray-500">엠블럼 아이콘과 대학명</div>
                    </button>

                    <button
                      onClick={() => updateDraft({ logoType: 'text' })}
                      className={`p-3 rounded border text-left transition-all ${
                        draftConfig.logoType === 'text'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">텍스트 워드마크</div>
                      <div className="text-[11px] text-gray-500">서체 중심 타이포그래피</div>
                    </button>

                    <button
                      onClick={() => updateDraft({ logoType: 'image' })}
                      className={`p-3 rounded border text-left transition-all ${
                        draftConfig.logoType === 'image'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">이미지 로고</div>
                      <div className="text-[11px] text-gray-500">공식 로고 이미지 / URL</div>
                    </button>
                  </div>
                </div>

                {/* Sub Options for Symbol & Text */}
                {(draftConfig.logoType === 'symbol_text' || draftConfig.logoType === 'text') && (
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          메인 로고 문구
                        </label>
                        <input
                          type="text"
                          value={draftConfig.logoText || '계명대학교'}
                          onChange={(e) => updateDraft({ logoText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 focus:bg-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          보조 영문 문구
                        </label>
                        <input
                          type="text"
                          value={draftConfig.logoSubText || 'KEIMYUNG UNIVERSITY'}
                          onChange={(e) => updateDraft({ logoSubText: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 focus:bg-white text-xs"
                        />
                      </div>
                    </div>

                    {/* Symbol Selection if symbol_text */}
                    {draftConfig.logoType === 'symbol_text' && (
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1.5">
                          심볼 아이콘 선택
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { id: 'university', label: '대학 전경', icon: <Landmark className="w-4 h-4" /> },
                            { id: 'graduation', label: '학사모', icon: <GraduationCap className="w-4 h-4" /> },
                            { id: 'book', label: '학술 도서', icon: <BookOpen className="w-4 h-4" /> },
                            { id: 'shield', label: '방패 엠블럼', icon: <Shield className="w-4 h-4" /> },
                            { id: 'globe', label: '국제처 지구', icon: <Globe className="w-4 h-4" /> },
                          ].map((sym) => (
                            <button
                              key={sym.id}
                              onClick={() => updateDraft({ logoSymbolIcon: sym.id as any })}
                              className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                                (draftConfig.logoSymbolIcon || 'university') === sym.id
                                  ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {sym.icon}
                              <span className="text-[10px] truncate max-w-full">{sym.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Text Styling */}
                    <div className="grid grid-cols-2 gap-3 items-center">
                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          폰트 두께
                        </label>
                        <select
                          value={draftConfig.logoFontWeight || 'bold'}
                          onChange={(e) => updateDraft({ logoFontWeight: e.target.value as any })}
                          className="w-full px-2 py-1.5 rounded border border-gray-200 text-xs bg-gray-50"
                        >
                          <option value="medium">중간 (Medium)</option>
                          <option value="bold">두껍게 (Bold - 기본)</option>
                          <option value="black">매우 두껍게 (Black)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-gray-700 mb-1">
                          로고 색상
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={draftConfig.logoTextColor || draftConfig.mainColor}
                            onChange={(e) => updateDraft({ logoTextColor: e.target.value })}
                            className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5"
                          />
                          <button
                            onClick={() => updateDraft({ logoTextColor: draftConfig.mainColor })}
                            className="text-[10px] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200"
                          >
                            테마 컬러 일치
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub Options for Image with File Upload */}
                {draftConfig.logoType === 'image' && (
                  <div className="space-y-4 pt-3 border-t border-gray-100">
                    <div>
                      <label className="block font-bold text-gray-800 text-xs mb-1.5 flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5 text-[#1A3B6B]" />
                        <span>로고 이미지 파일 직접 업로드 (PC 파일 선택)</span>
                      </label>
                      
                      <input
                        type="file"
                        ref={logoFileInputRef}
                        onChange={handleLogoFileSelect}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        className="hidden"
                      />

                      <div
                        onClick={() => logoFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            processLogoFile(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-gray-300 hover:border-[#1A3B6B] hover:bg-blue-50/30 p-4 rounded-lg text-center cursor-pointer transition-all group"
                      >
                        <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1A3B6B] mx-auto mb-1.5 transition-colors" />
                        <p className="font-bold text-gray-800 text-xs">
                          클릭하여 로고 이미지 파일을 선택하거나 여기로 드래그하세요
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1">
                          지원 포맷: PNG, SVG, JPG, WebP (배경이 투명한 PNG/SVG 권장)
                        </p>
                      </div>

                      {logoFileNotice && (
                        <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{logoFileNotice}</span>
                        </div>
                      )}
                    </div>

                    {/* Current Logo Preview Thumbnail */}
                    {draftConfig.logoUrl && (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-gray-700">등록된 로고 이미지:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setLogoPreviewBgDark(!logoPreviewBgDark)}
                              className="text-[10px] px-2 py-0.5 rounded border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 cursor-pointer"
                            >
                              {logoPreviewBgDark ? '밝은 배경' : '어두운 배경'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                updateDraft({ logoUrl: '' });
                                setLogoFileNotice(null);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        <div
                          className={`p-3 rounded border flex items-center justify-center transition-colors ${
                            logoPreviewBgDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                          }`}
                          style={{ minHeight: '60px' }}
                        >
                          <img
                            src={draftConfig.logoUrl}
                            alt="로고 미리보기"
                            style={{ maxHeight: `${draftConfig.logoHeight || 40}px` }}
                            className="w-auto object-contain block"
                          />
                        </div>
                      </div>
                    )}

                    {/* Alternative URL Input */}
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1 text-xs">
                        또는 이미지 웹 URL 직접 입력
                      </label>
                      <input
                        type="text"
                        value={draftConfig.logoUrl || ''}
                        onChange={(e) => updateDraft({ logoUrl: e.target.value })}
                        placeholder="https://... 또는 /kmu_type67_view.jpg"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 bg-gray-50 focus:bg-white text-xs"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateDraft({ logoUrl: '/kmu_type67_view.jpg' });
                          setLogoFileNotice('✓ 계명대학교 공식 기본 워드마크로 지정되었습니다.');
                        }}
                        className="px-2.5 py-1.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 transition-colors cursor-pointer"
                      >
                        계명대 공식 기본 워드마크 설정
                      </button>
                    </div>
                  </div>
                )}

                {/* Logo Height Slider */}
                {draftConfig.logoType && draftConfig.logoType !== 'none' && (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-gray-700 font-semibold">
                        로고 노출 높이: {draftConfig.logoHeight || 40}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={56}
                      value={draftConfig.logoHeight || 40}
                      onChange={(e) => updateDraft({ logoHeight: parseInt(e.target.value, 10) })}
                      className="w-full cursor-pointer accent-[#1A3B6B]"
                    />
                  </div>
                )}

                {/* Live Logo Preview Box */}
                {draftConfig.logoType && draftConfig.logoType !== 'none' && (
                  <div className="p-3 rounded border border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold text-gray-600">로고 실시간 렌더링 미리보기</span>
                      <button
                        onClick={() => setLogoPreviewBgDark(!logoPreviewBgDark)}
                        className="text-[10px] text-gray-500 hover:text-gray-900 underline"
                      >
                        {logoPreviewBgDark ? '밝은 배경으로 보기' : '어두운 배경으로 보기'}
                      </button>
                    </div>
                    <div
                      className={`p-4 rounded border flex items-center justify-center transition-colors min-h-[70px] ${
                        logoPreviewBgDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <KmuLogo config={draftConfig} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Hero Section & Search Button Design (NEW FEATURES!) */}
            {activeCategoryTab === 'hero' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    배경 스타일
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateDraft({ bgType: 'color' })}
                      className={`p-2.5 rounded border text-left font-medium transition-colors ${
                        draftConfig.bgType === 'color'
                          ? 'border-[#1A3B6B] bg-blue-50/50 text-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      단색 테마 배경 (네이비)
                    </button>
                    <button
                      onClick={() => updateDraft({ bgType: 'campus' })}
                      className={`p-2.5 rounded border text-left font-medium transition-colors ${
                        draftConfig.bgType === 'campus'
                          ? 'border-[#1A3B6B] bg-blue-50/50 text-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      은은한 캠퍼스 사진 배경
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    메인 타이틀 문구
                  </label>
                  <input
                    type="text"
                    value={draftConfig.heroTitle}
                    onChange={(e) => updateDraft({ heroTitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    포털 상단과 메인 배너의 대표 타이틀로 사용됩니다.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    검색창 안내 문구 (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={draftConfig.searchPlaceholder}
                    onChange={(e) => updateDraft({ searchPlaceholder: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Search Button & Search Bar Design Controls */}
                <div className="pt-4 border-t border-gray-100 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-[#2E7D5B]" />
                      <span>검색 버튼 디자인 (모양, 크기, 곡선 등)</span>
                    </span>
                    <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium">
                      실시간 반영
                    </span>
                  </div>

                  {/* Button text */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      검색 버튼 문구
                    </label>
                    <input
                      type="text"
                      value={draftConfig.searchButtonText || '검색'}
                      onChange={(e) => updateDraft({ searchButtonText: e.target.value })}
                      placeholder="검색"
                      className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                    />
                  </div>

                  {/* Button Size */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      검색 버튼 크기 (Size)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'sm', label: '소형 (Compact)' },
                        { id: 'md', label: '표준 (Standard)' },
                        { id: 'lg', label: '대형 (Large)' },
                      ].map((sz) => (
                        <button
                          key={sz.id}
                          onClick={() => updateDraft({ searchButtonSize: sz.id as any })}
                          className={`py-1.5 px-2 rounded border text-center transition-all ${
                            (draftConfig.searchButtonSize || 'md') === sz.id
                              ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Shape */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      검색 버튼 모양 (Shape)
                    </label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      {[
                        { id: 'rounded', label: '둥근 사각 (Rounded)' },
                        { id: 'pill', label: '타원 알약형 (Pill)' },
                        { id: 'square', label: '직각 사각형 (Sharp)' },
                      ].map((sh) => (
                        <button
                          key={sh.id}
                          onClick={() => updateDraft({ searchButtonShape: sh.id as any })}
                          className={`py-1.5 px-2 rounded border text-center transition-all ${
                            (draftConfig.searchButtonShape || 'rounded') === sh.id
                              ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                              : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-white'
                          }`}
                        >
                          {sh.label}
                        </button>
                      ))}
                    </div>

                    {(draftConfig.searchButtonShape || 'rounded') === 'rounded' && (
                      <div className="bg-gray-50 p-2.5 rounded border border-gray-100">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[11px] text-gray-600 font-semibold">
                            버튼 모서리 곡선(곡률): {draftConfig.searchButtonRadius ?? 6}px
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={20}
                          value={draftConfig.searchButtonRadius ?? 6}
                          onChange={(e) => updateDraft({ searchButtonRadius: parseInt(e.target.value, 10) })}
                          className="w-full cursor-pointer accent-[#1A3B6B]"
                        />
                      </div>
                    )}
                  </div>

                  {/* Search Bar Frame Radius */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-gray-700">
                        검색창 전체 프레임 곡률: {draftConfig.searchBarRadius ?? 8}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={24}
                      value={draftConfig.searchBarRadius ?? 8}
                      onChange={(e) => updateDraft({ searchBarRadius: parseInt(e.target.value, 10) })}
                      className="w-full cursor-pointer accent-[#1A3B6B]"
                    />
                  </div>

                  {/* Button Color */}
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      검색 버튼 전용 색상
                    </label>
                    <div className="flex items-center gap-2">
                      {[
                        { label: '포인트 그린', color: '#2E7D5B' },
                        { label: '메인 네이비', color: '#1A3B6B' },
                        { label: '주의 오렌지', color: '#D97736' },
                        { label: '차콜 블랙', color: '#243447' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          onClick={() => updateDraft({ searchButtonColor: c.color })}
                          className={`w-6 h-6 rounded-full border border-black/10 transition-transform ${
                            (draftConfig.searchButtonColor || draftConfig.accentColor) === c.color ? 'scale-110 ring-2 ring-offset-1 ring-gray-400' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                      <input
                        type="color"
                        value={draftConfig.searchButtonColor || draftConfig.accentColor || '#2E7D5B'}
                        onChange={(e) => updateDraft({ searchButtonColor: e.target.value })}
                        className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 ml-1"
                      />
                    </div>
                  </div>

                  {/* Button Icon options */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-700">버튼 아이콘 표시</span>
                      <input
                        type="checkbox"
                        checked={draftConfig.searchButtonShowIcon ?? true}
                        onChange={(e) => updateDraft({ searchButtonShowIcon: e.target.checked })}
                        className="rounded text-[#1A3B6B] focus:ring-0 w-3.5 h-3.5"
                      />
                    </div>

                    {(draftConfig.searchButtonShowIcon ?? true) && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'search', label: '돋보기 (Search)', icon: <Search className="w-3.5 h-3.5" /> },
                          { id: 'arrow', label: '화살표 (Arrow)', icon: <ArrowRight className="w-3.5 h-3.5" /> },
                          { id: 'sparkles', label: '스파클 (AI)', icon: <Sparkles className="w-3.5 h-3.5" /> },
                        ].map((ic) => (
                          <button
                            key={ic.id}
                            onClick={() => updateDraft({ searchButtonIconType: ic.id as any })}
                            className={`py-1.5 px-2 rounded border flex items-center justify-center gap-1 text-[11px] transition-all ${
                              (draftConfig.searchButtonIconType || 'search') === ic.id
                                ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {ic.icon}
                            <span>{ic.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: Version Archive & Backup (요청 6: 수정 및 변경 후 적용하기 또는 게시하기 기능 추가 및 보관) */}
            {activeCategoryTab === 'archive' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-lg text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <Archive className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-purple-950 block">디자인 및 설정 버전 보관함</span>
                        <p className="text-purple-800/90 text-[11px] mt-0.5 leading-relaxed">
                          '적용하기 / 게시하기' 시 자동으로 새 버전이 보관되며, 언제든지 원하는 과거 버전으로 되돌리거나 미리보기로 불러올 수 있습니다.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        setManualArchiveTitle(
                          `디자인 백업 (${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })})`
                        );
                        setManualArchiveNote('');
                        setIsCreatingManualArchive(true);
                      }}
                      className="px-3 py-1.5 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>현재 설정 보관</span>
                    </button>
                  </div>
                </div>

                {/* Relocation notice for categories per request 4 */}
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-md text-xs text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    <strong>카테고리 관리 위치 안내:</strong> 디자인 모드에 있던 카테고리 관리는 <strong>[FAQ 관리 &gt; 카테고리 통합 관리]</strong> 탭으로 이동되었습니다. 질문 게시글과 카테고리를 한 화면에서 더 직관적으로 관리하실 수 있습니다.
                  </div>
                </div>

                {/* Manual Archive Creation Form */}
                {isCreatingManualArchive && (
                  <form
                    onSubmit={handleCreateManualArchive}
                    className="p-3.5 rounded-lg border border-purple-200 bg-purple-50/40 space-y-3 animate-fade-in"
                  >
                    <div className="font-bold text-gray-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FolderArchive className="w-4 h-4 text-purple-700" />
                        <span>현재 편집 설정 즉시 보관하기</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCreatingManualArchive(false)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        보관본 버전 명칭 *
                      </label>
                      <input
                        type="text"
                        required
                        value={manualArchiveTitle}
                        onChange={(e) => setManualArchiveTitle(e.target.value)}
                        placeholder="예: 2026 가을학기 신학기 테마 백업"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        메모 / 변경 사유 (선택)
                      </label>
                      <input
                        type="text"
                        value={manualArchiveNote}
                        onChange={(e) => setManualArchiveNote(e.target.value)}
                        placeholder="예: 신규 로고 및 그린 테마 적용 전 백업"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-purple-600"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsCreatingManualArchive(false)}
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded bg-purple-700 text-white font-bold cursor-pointer"
                      >
                        보관 완료
                      </button>
                    </div>
                  </form>
                )}

                {/* Archive List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-600 px-1">
                    <span>저장된 버전 목록 (총 {archives.length}개)</span>
                    <span className="text-[11px] text-gray-400">최대 30개까지 자동 보관</span>
                  </div>

                  {archives.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-xs">
                      보관된 버전이 없습니다.
                    </div>
                  ) : (
                    archives.map((item, idx) => {
                      const isInitial = item.id === 'initial-system-default';
                      const isLiveMatch = JSON.stringify(item.configSnapshot) === JSON.stringify(config);

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 rounded-lg border transition-all ${
                            isLiveMatch
                              ? 'border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300'
                              : 'border-gray-200 bg-white hover:border-gray-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="font-bold text-gray-900 text-xs">{item.title}</span>
                                {isLiveMatch && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    현재 포털 적용 중
                                  </span>
                                )}
                                {isInitial && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-100 text-gray-600">
                                    초기 기본본
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap font-mono">
                                <span>{new Date(item.timestamp).toLocaleString('ko-KR')}</span>
                                {item.author && <span>• 작성: {item.author}</span>}
                              </div>

                              {item.note && (
                                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                                  {item.note}
                                </p>
                              )}

                              {/* Snapshot Color preview tags */}
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[10px] text-gray-400">테마 컬러:</span>
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                                  style={{ backgroundColor: item.configSnapshot.mainColor }}
                                  title={`메인: ${item.configSnapshot.mainColor}`}
                                />
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                                  style={{ backgroundColor: item.configSnapshot.accentColor }}
                                  title={`포인트: ${item.configSnapshot.accentColor}`}
                                />
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 inline-block"
                                  style={{ backgroundColor: item.configSnapshot.warnColor }}
                                  title={`주의: ${item.configSnapshot.warnColor}`}
                                />
                                <span className="text-[10px] text-gray-400 ml-1">
                                  로고: {item.configSnapshot.logoType || 'none'}
                                </span>
                              </div>
                            </div>

                            {/* Version Actions */}
                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  restoreArchive(item.id, true);
                                  setArchiveActionToast(`'${item.title}' 버전이 미리보기에 임시 불러와졌습니다.`);
                                  setTimeout(() => setArchiveActionToast(null), 3000);
                                }}
                                className="px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors cursor-pointer"
                                title="학생 화면에는 영향 없이 우측 미리보기로만 불러옵니다"
                              >
                                미리보기 불러오기
                              </button>

                              <button
                                type="button"
                                onClick={() => setRestoreConfirmTarget(item)}
                                className="px-2.5 py-1 rounded text-[11px] font-bold bg-[#1A3B6B] hover:bg-[#122a4d] text-white transition-colors cursor-pointer"
                                title="학생 포털에 즉시 복원 적용합니다"
                              >
                                실시간 복원
                              </button>

                              {!isInitial && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteArchiveTarget(item)}
                                  className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                  title="보관본 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: Notice Popup Settings & Design */}
            {activeCategoryTab === 'popup' && (
              <div className="space-y-5">
                {/* Enable Toggle & Test Button */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50">
                  <div>
                    <span className="font-bold text-gray-900 block text-xs">
                      공지 팝업 기능 사용
                    </span>
                    <span className="text-[11px] text-gray-500 block">
                      유학생 접속 시 비자 연장, 한국어학당 일정 등 주요 안내 노출
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!draftConfig.popupEnabled}
                      onChange={(e) => updateDraft({ popupEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E7D5B]"></div>
                  </label>
                </div>

                {/* Test Preview Trigger Button */}
                <button
                  onClick={() => setPreviewPopupOpen(true)}
                  className="w-full py-2.5 px-3 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>실시간 팝업 미리보기 열기 (테스트 확인)</span>
                </button>

                {/* Popup Layout Style */}
                <div>
                  <label className="block font-bold text-gray-800 mb-1.5">
                    팝업 디자인 형태 (Layout Style)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateDraft({ popupStyle: 'modal' })}
                      className={`p-3 rounded border text-left transition-all ${
                        (draftConfig.popupStyle || 'modal') === 'modal'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">🏛️ 중앙 모달 창</div>
                      <div className="text-[11px] text-gray-500">화면 중앙 집중 (중요/필수 공지용)</div>
                    </button>

                    <button
                      onClick={() => updateDraft({ popupStyle: 'banner' })}
                      className={`p-3 rounded border text-left transition-all ${
                        draftConfig.popupStyle === 'banner'
                          ? 'border-[#1A3B6B] bg-blue-50/60 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 hover:bg-white'
                      }`}
                    >
                      <div className="font-bold text-gray-900 text-xs mb-0.5">📌 플로팅 배너</div>
                      <div className="text-[11px] text-gray-500">우측 하단 고정 알림 (비간섭형)</div>
                    </button>
                  </div>
                </div>

                {/* Popup Header Color */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    팝업 헤더 테마 색상
                  </label>
                  <div className="flex items-center gap-2">
                    {[
                      { label: '네이비', color: '#1A3B6B' },
                      { label: '주의 오렌지', color: '#D97736' },
                      { label: '행정 그린', color: '#2E7D5B' },
                      { label: '와인 레드', color: '#8B1D2C' },
                    ].map((col) => (
                      <button
                        key={col.color}
                        onClick={() => updateDraft({ popupColor: col.color })}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold text-white transition-transform ${
                          (draftConfig.popupColor || '#1A3B6B') === col.color ? 'scale-105 ring-2 ring-offset-1 ring-gray-400' : 'opacity-80 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: col.color }}
                      >
                        {col.label}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={draftConfig.popupColor || '#1A3B6B'}
                      onChange={(e) => updateDraft({ popupColor: e.target.value })}
                      className="w-7 h-7 rounded border border-gray-300 cursor-pointer p-0.5 ml-1"
                    />
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1.5">
                    팝업 대표 아이콘
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'bell', label: '알림 종', icon: <Bell className="w-3.5 h-3.5" /> },
                      { id: 'alert', label: '주의/긴급', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
                      { id: 'calendar', label: '한국어학당 일정', icon: <Calendar className="w-3.5 h-3.5" /> },
                      { id: 'info', label: '일반안내', icon: <Info className="w-3.5 h-3.5" /> },
                    ].map((ic) => (
                      <button
                        key={ic.id}
                        onClick={() => updateDraft({ popupIcon: ic.id as any })}
                        className={`p-2 rounded border flex flex-col items-center gap-1 transition-all ${
                          (draftConfig.popupIcon || 'bell') === ic.id
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

                {/* Popup Texts */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="block font-semibold text-gray-700 mb-1">
                        상단 뱃지 문구
                      </label>
                      <input
                        type="text"
                        value={draftConfig.popupBadge || '중요 공지'}
                        onChange={(e) => updateDraft({ popupBadge: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block font-semibold text-gray-700 mb-1">
                        팝업 제목
                      </label>
                      <input
                        type="text"
                        value={draftConfig.popupTitle || ''}
                        onChange={(e) => updateDraft({ popupTitle: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      팝업 본문 내용 (줄바꿈 지원)
                    </label>
                    <textarea
                      rows={5}
                      value={draftConfig.popupContent || ''}
                      onChange={(e) => updateDraft({ popupContent: e.target.value })}
                      placeholder="공지할 내용을 입력하세요..."
                      className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white leading-relaxed"
                    />
                  </div>

                  {/* Action Link Button Config */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        바로가기 버튼 문구 (선택)
                      </label>
                      <input
                        type="text"
                        value={draftConfig.popupLinkText || ''}
                        onChange={(e) => updateDraft({ popupLinkText: e.target.value })}
                        placeholder="예: 서식 다운로드 바로가기"
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        클릭 시 이동할 탭
                      </label>
                      <select
                        value={draftConfig.popupLinkTab || 'downloads'}
                        onChange={(e) => updateDraft({ popupLinkTab: e.target.value as any })}
                        className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50"
                      >
                        <option value="downloads">서식 자료실 (Downloads)</option>
                        <option value="faq">자주 묻는 질문 (FAQ)</option>
                        <option value="inquiry">1:1 문의 상담 (Inquiry)</option>
                        <option value="">링크 없음 (단순 닫기)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: Footer & Related Websites */}
            {activeCategoryTab === 'footer' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    운영시간 안내 문구
                  </label>
                  <input
                    type="text"
                    value={draftConfig.officeHours}
                    onChange={(e) => updateDraft({ officeHours: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      연락처 (전화번호)
                    </label>
                    <input
                      type="text"
                      value={draftConfig.phone}
                      onChange={(e) => updateDraft({ phone: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      대표 이메일
                    </label>
                    <input
                      type="text"
                      value={draftConfig.email}
                      onChange={(e) => updateDraft({ email: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    위치 (상세 주소 및 건물)
                  </label>
                  <textarea
                    rows={2}
                    value={draftConfig.location}
                    onChange={(e) => updateDraft({ location: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
                  />
                </div>

                {/* Related Websites Management Section */}
                <div className="pt-3 border-t border-gray-200 space-y-3">
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800 block text-xs">
                        유학생 관련 웹사이트 바로가기 노출
                      </span>
                      <span className="text-[11px] text-gray-500 block">
                        푸터 하단에 하이코리아, TOPIK 등 유학생 필수 포털 바로가기를 표시합니다.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.showRelatedSites !== false}
                        onChange={(e) => updateDraft({ showRelatedSites: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2E7D5B]"></div>
                    </label>
                  </div>

                  {draftConfig.showRelatedSites !== false && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block font-bold text-gray-800 text-xs">
                          바로가기 사이트 목록 ({currentRelatedSites.length}개)
                        </label>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleResetRelatedSites}
                            className="text-[11px] text-gray-500 hover:text-gray-800 hover:underline flex items-center gap-1 px-1.5 py-0.5"
                            title="기본 5개 사이트로 복원"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>기본 복원</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleOpenAddSite}
                            className="text-xs bg-[#1A3B6B] hover:bg-blue-900 text-white font-bold px-2.5 py-1 rounded flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            <span>새 바로가기 추가</span>
                          </button>
                        </div>
                      </div>

                      {/* Sites List */}
                      <div className="divide-y divide-gray-200 border border-gray-200 rounded bg-white overflow-hidden text-xs">
                        {currentRelatedSites.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-xs">
                            등록된 바로가기 사이트가 없습니다.
                          </div>
                        ) : (
                          currentRelatedSites.map((site, sIdx) => (
                            <div
                              key={site.id}
                              className="p-2.5 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex flex-col text-gray-400">
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSite(sIdx, 'up')}
                                    disabled={sIdx === 0}
                                    className="hover:text-gray-700 disabled:opacity-20 leading-none p-0.5"
                                    title="위로 이동"
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMoveSite(sIdx, 'down')}
                                    disabled={sIdx === currentRelatedSites.length - 1}
                                    className="hover:text-gray-700 disabled:opacity-20 leading-none p-0.5"
                                    title="아래로 이동"
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-gray-800 truncate">
                                      {site.name}
                                    </span>
                                    {site.nameEn && (
                                      <span className="text-[10px] text-gray-400 truncate hidden sm:inline">
                                        ({site.nameEn})
                                      </span>
                                    )}
                                    {site.badge && (
                                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                        {site.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                                    <Link2 className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{site.url}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <a
                                  href={site.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-400 hover:text-[#1A3B6B] rounded"
                                  title="사이트 링크 열기"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditSite(site)}
                                  className="p-1 text-blue-600 hover:text-blue-800 rounded hover:bg-blue-50"
                                  title="수정"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSite(site.id)}
                                  className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Add / Edit Site Modal */}
                  {isAddingSite && (
                    <div className="p-3.5 rounded border border-[#1A3B6B]/30 bg-blue-50/50 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-900 text-xs flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-[#1A3B6B]" />
                          <span>{editingSite ? '웹사이트 바로가기 수정' : '새 웹사이트 바로가기 추가'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddingSite(false)}
                          className="text-gray-400 hover:text-gray-700 text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            사이트 명칭 (한국어, 필수)
                          </label>
                          <input
                            type="text"
                            required
                            value={siteFormName}
                            onChange={(e) => setSiteFormName(e.target.value)}
                            placeholder="예: 하이코리아"
                            className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            영문 명칭 (선택)
                          </label>
                          <input
                            type="text"
                            value={siteFormNameEn}
                            onChange={(e) => setSiteFormNameEn(e.target.value)}
                            placeholder="예: Hi Korea"
                            className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            URL 링크 주소 (https://...)
                          </label>
                          <input
                            type="url"
                            required
                            value={siteFormUrl}
                            onChange={(e) => setSiteFormUrl(e.target.value)}
                            placeholder="https://www.hikorea.go.kr"
                            className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            구분 뱃지
                          </label>
                          <input
                            type="text"
                            value={siteFormBadge}
                            onChange={(e) => setSiteFormBadge(e.target.value)}
                            placeholder="예: 출입국 민원"
                            className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          설명 / 툴팁 안내 문구
                        </label>
                        <input
                          type="text"
                          value={siteFormDesc}
                          onChange={(e) => setSiteFormDesc(e.target.value)}
                          placeholder="예: 대한민국 전자정부 외국인종합안내포털 (체류기간 연장, 외국인등록)"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsAddingSite(false)}
                          className="px-3 py-1 rounded bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveSiteSubmit}
                          className="px-3 py-1 rounded bg-[#1A3B6B] hover:bg-blue-900 text-white font-bold text-xs"
                        >
                          {editingSite ? '수정 내용 적용' : '추가하기'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* SNS Section with URL Editing */}
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <label className="block font-bold text-gray-800">
                    SNS 설정 및 링크 주소
                  </label>

                  {/* Instagram */}
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        인스타그램 (Instagram)
                      </span>
                      <label className="flex items-center gap-1 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showInstagram}
                          onChange={(e) => updateDraft({ showInstagram: e.target.checked })}
                          className="rounded text-[#1A3B6B] focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>노출 활성화</span>
                      </label>
                    </div>
                    {draftConfig.showInstagram && (
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          인스타그램 프로필 URL 주소
                        </label>
                        <input
                          type="text"
                          value={draftConfig.instagramUrl || ''}
                          onChange={(e) => updateDraft({ instagramUrl: e.target.value })}
                          placeholder="https://www.instagram.com/계정명"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-white focus:bg-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* YouTube */}
                  <div className="p-3 rounded border border-gray-200 bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-600"></span>
                        유튜브 (YouTube)
                      </span>
                      <label className="flex items-center gap-1 text-[11px] text-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showYoutube}
                          onChange={(e) => updateDraft({ showYoutube: e.target.checked })}
                          className="rounded text-[#1A3B6B] focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>노출 활성화</span>
                      </label>
                    </div>
                    {draftConfig.showYoutube && (
                      <div>
                        <label className="block text-[11px] text-gray-500 mb-1">
                          유튜브 채널 URL 주소
                        </label>
                        <input
                          type="text"
                          value={draftConfig.youtubeUrl || ''}
                          onChange={(e) => updateDraft({ youtubeUrl: e.target.value })}
                          placeholder="https://www.youtube.com/@채널명"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-white focus:bg-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: Mood & Font Detailed Settings */}
            {activeCategoryTab === 'mood' && (
              <div className="space-y-5">
                {/* 1. Font Family Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-gray-800 text-xs flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-indigo-600" />
                      <span>포털 대표 글꼴 (Font Family)</span>
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">다국어 최적화 웹폰트</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      {
                        id: 'noto',
                        name: '본고딕 (Noto Sans)',
                        family: "'Noto Sans KR', sans-serif",
                        desc: '정통 공식 서체 (기본값)',
                        badge: '공식 표준',
                      },
                      {
                        id: 'pretendard',
                        name: '프리텐더드 (Pretendard)',
                        family: "'Pretendard', sans-serif",
                        desc: '모던 깔끔 화면 가독성',
                        badge: '인기 서체',
                      },
                      {
                        id: 'nanum',
                        name: '나눔고딕 (Nanum Gothic)',
                        family: "'Nanum Gothic', sans-serif",
                        desc: '부드럽고 친근한 서체',
                        badge: '네이버',
                      },
                      {
                        id: 'gowun',
                        name: '고운돋움 (Gowun Dodum)',
                        family: "'Gowun Dodum', sans-serif",
                        desc: '단정하고 따뜻한 감성',
                        badge: '감성형',
                      },
                      {
                        id: 'inter',
                        name: '인터 (Inter)',
                        family: "'Inter', sans-serif",
                        desc: '영문/글로벌 인터페이스',
                        badge: '영문 최적화',
                      },
                      {
                        id: 'system',
                        name: '시스템 기본 서체',
                        family: '-apple-system, system-ui, sans-serif',
                        desc: '기기 기본 내장 서체',
                        badge: '경량 속도',
                      },
                    ].map((font) => {
                      const isSelected = (draftConfig.fontFamily || 'noto') === font.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => updateDraft({ fontFamily: font.id as any })}
                          className={`p-2.5 rounded border text-left transition-all cursor-pointer relative ${
                            isSelected
                              ? 'border-[#1A3B6B] bg-blue-50/70 shadow-xs ring-1 ring-[#1A3B6B]'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-[#1A3B6B]' : 'text-gray-900'
                              }`}
                              style={{ fontFamily: font.family }}
                            >
                              {font.name}
                            </span>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-semibold shrink-0 ${
                                isSelected
                                  ? 'bg-[#1A3B6B] text-white'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {font.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight">{font.desc}</p>
                          <div
                            className="text-[11px] text-gray-700 mt-1 font-semibold"
                            style={{ fontFamily: font.family }}
                          >
                            가나다 Aa 123
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Font Size Scale */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-gray-800 text-xs">
                      글자 크기 배율 (Font Size Scale)
                    </label>
                    <span className="text-[11px] text-gray-500 font-medium">전체 포털 텍스트에 적용</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'compact', label: '컴팩트 (94%)', desc: '한눈에 많은 정보', fontSize: 'standard' },
                      { id: 'standard', label: '표준 (100%)', desc: '기본 권장 크기', fontSize: 'standard' },
                      { id: 'large', label: '확대 (106%)', desc: '유학생 가독성 향상', fontSize: 'large' },
                      { id: 'xlarge', label: '특대형 (112%)', desc: '시원하고 큰 글씨', fontSize: 'large' },
                    ].map((sz) => {
                      const currentScale = draftConfig.fontSizeScale || (draftConfig.fontSize === 'large' ? 'large' : 'standard');
                      const isSelected = currentScale === sz.id;
                      return (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => updateDraft({
                            fontSizeScale: sz.id as any,
                            fontSize: sz.fontSize as any,
                          })}
                          className={`p-2 rounded border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#1A3B6B] bg-blue-50/70 font-bold text-[#1A3B6B] shadow-xs'
                              : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium'
                          }`}
                        >
                          <div className="text-xs">{sz.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{sz.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Heading Weight & Line Height */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Heading Weight */}
                  <div>
                    <label className="block font-bold text-gray-800 text-xs mb-1.5">
                      제목 굵기 (Heading Weight)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'medium', label: '보통 (600)' },
                        { id: 'bold', label: '굵게 (700)' },
                        { id: 'black', label: '아주 굵게 (800)' },
                      ].map((wt) => {
                        const isSelected = (draftConfig.fontHeadingWeight || 'bold') === wt.id;
                        return (
                          <button
                            key={wt.id}
                            type="button"
                            onClick={() => updateDraft({ fontHeadingWeight: wt.id as any })}
                            className={`py-1.5 px-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#1A3B6B] bg-blue-50/70 font-bold text-[#1A3B6B]'
                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium'
                            }`}
                          >
                            {wt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Line Height */}
                  <div>
                    <label className="block font-bold text-gray-800 text-xs mb-1.5">
                      본문 줄간격 (Line Height)
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'compact', label: '좁게 (1.45)' },
                        { id: 'normal', label: '보통 (1.60)' },
                        { id: 'spacious', label: '넓게 (1.75)' },
                      ].map((lh) => {
                        const isSelected = (draftConfig.fontLineHeight || 'normal') === lh.id;
                        return (
                          <button
                            key={lh.id}
                            type="button"
                            onClick={() => updateDraft({ fontLineHeight: lh.id as any })}
                            className={`py-1.5 px-2 rounded border text-center text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#1A3B6B] bg-blue-50/70 font-bold text-[#1A3B6B]'
                                : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium'
                            }`}
                          >
                            {lh.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 4. Live Font Preview Box */}
                <div className="p-3.5 bg-gray-50 rounded-md border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-gray-700">실시간 폰트 렌더링 미리보기</span>
                    <span className="text-[10px] text-gray-400">적용 서체: {draftConfig.fontFamily || 'noto'}</span>
                  </div>
                  <div
                    className="p-3 bg-white rounded border border-gray-200 space-y-1.5"
                    style={{
                      fontFamily:
                        draftConfig.fontFamily === 'pretendard'
                          ? "'Pretendard', sans-serif"
                          : draftConfig.fontFamily === 'nanum'
                          ? "'Nanum Gothic', sans-serif"
                          : draftConfig.fontFamily === 'gowun'
                          ? "'Gowun Dodum', sans-serif"
                          : draftConfig.fontFamily === 'inter'
                          ? "'Inter', sans-serif"
                          : draftConfig.fontFamily === 'system'
                          ? '-apple-system, system-ui, sans-serif'
                          : "'Noto Sans KR', sans-serif",
                    }}
                  >
                    <div
                      className="text-gray-900"
                      style={{
                        fontWeight: draftConfig.fontHeadingWeight === 'black' ? 800 : draftConfig.fontHeadingWeight === 'medium' ? 600 : 700,
                        fontSize: draftConfig.fontSizeScale === 'xlarge' ? '15px' : draftConfig.fontSizeScale === 'large' ? '14px' : '13px',
                      }}
                    >
                      계명대학교 한국어학당 유학생 안내 포털
                    </div>
                    <div
                      className="text-gray-600"
                      style={{
                        fontSize: draftConfig.fontSizeScale === 'xlarge' ? '13px' : draftConfig.fontSizeScale === 'large' ? '12px' : '11px',
                        lineHeight: draftConfig.fontLineHeight === 'compact' ? 1.45 : draftConfig.fontLineHeight === 'spacious' ? 1.75 : 1.6,
                      }}
                    >
                      D-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청 등 주요 학사 안내 사항을 확인하세요.
                    </div>
                    <div className="text-[11px] text-gray-400 pt-0.5">
                      Keimyung University Korean Language Institute • 启明大学韩国语学堂 • Viện Ngôn ngữ Hàn Quốc
                    </div>
                  </div>
                </div>

                {/* 5. Card Border Radius */}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-800 text-xs">
                      카드 모서리 둥글기 (Border Radius)
                    </label>
                    <span className="text-xs font-mono font-bold text-[#1A3B6B]">
                      {draftConfig.borderRadius}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={16}
                    step={2}
                    value={draftConfig.borderRadius}
                    onChange={(e) => updateDraft({ borderRadius: parseInt(e.target.value, 10) })}
                    className="w-full cursor-pointer accent-[#1A3B6B]"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium">
                    <span>직각 (0px)</span>
                    <span>기본 둥글기 (6px)</span>
                    <span>부드럽게 (16px)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: Guide Chatbot */}
            {activeCategoryTab === 'chatbot' && (
              <div className="space-y-4">
                <div className="p-3 rounded border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">
                      챗봇 활성화 상태
                    </span>
                    <span className="text-[10px] text-gray-500">
                      학생 화면 우측 하단에 유학생 안내 챗봇 상담 버튼을 표시합니다.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfig.chatbotEnabled !== false}
                      onChange={(e) => updateDraft({ chatbotEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1A3B6B]"></div>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    챗봇 이름
                  </label>
                  <input
                    type="text"
                    value={draftConfig.chatbotName || '계명어학당 안내 챗봇'}
                    onChange={(e) => updateDraft({ chatbotName: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    챗봇 상태/부제목 문구
                  </label>
                  <input
                    type="text"
                    value={draftConfig.chatbotSubtitle || '등록 정보 기반 실시간 안내'}
                    onChange={(e) => updateDraft({ chatbotSubtitle: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    첫 환영 인사말
                  </label>
                  <textarea
                    rows={3}
                    value={
                      draftConfig.chatbotWelcomeMsg ||
                      '안녕하세요! 계명대학교 한국어학당 안내 챗봇입니다. 🎓\n관리자가 등록한 자주 묻는 질문(FAQ), 행정 서식 자료, 한국어학당 학사일정을 바탕으로 정확하게 안내해 드립니다. 궁금한 점을 질문해 보세요!'
                    }
                    onChange={(e) => updateDraft({ chatbotWelcomeMsg: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white leading-relaxed text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    입력창 안내 문구 (Placeholder)
                  </label>
                  <input
                    type="text"
                    value={
                      draftConfig.chatbotPlaceholder ||
                      '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준, 일정)'
                    }
                    onChange={(e) => updateDraft({ chatbotPlaceholder: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    챗봇 테마 색상
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draftConfig.chatbotColor || draftConfig.mainColor || '#1A3B6B'}
                      onChange={(e) => updateDraft({ chatbotColor: e.target.value })}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={draftConfig.chatbotColor || draftConfig.mainColor || '#1A3B6B'}
                      onChange={(e) => updateDraft({ chatbotColor: e.target.value })}
                      className="w-28 px-2 py-1 rounded border border-gray-300 uppercase font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-2">
                  <Globe className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>자동 다국어 지원:</strong> 한국어로 작성하시면 학생 화면에서는 선택한 언어(영어, 베트남어, 중국어, 몽골어)로 실시간 자동 번역되어 표시됩니다.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Interactive Split Preview (7 cols) - 요청 8: 실시간 미리보기 기능 보완 및 개선 */}
        <div className="lg:col-span-7 bg-white rounded-md border border-[#E2E5E8] shadow-xs overflow-hidden sticky top-20">
          {/* Preview Controller Top Bar */}
          <div className="bg-gray-50 px-3.5 py-2.5 border-b border-[#E2E5E8] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-gray-800 ml-1">실시간 라이브 미리보기</span>
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                임시 반영 중
              </span>
            </div>

            {/* Device Switcher & Fullscreen Preview Button */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-gray-200/80 p-0.5 rounded border border-gray-300">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="데스크톱 PC 화면 (100%)"
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">PC</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    previewDevice === 'tablet'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="태블릿 화면 (768px)"
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">태블릿</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="모바일 화면 (375px)"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">모바일</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFullScreenPreview(true)}
                className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 cursor-pointer"
                title="전체화면으로 학생 포털 미리보기"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Section Filter Toolbar inside Preview */}
          <div className="bg-white px-3 py-1.5 border-b border-gray-200 flex items-center justify-between gap-2 overflow-x-auto text-[11px]">
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-gray-400 font-semibold mr-1">미리보기 영역:</span>
              {[
                { id: 'all', label: '전체 화면' },
                { id: 'hero', label: '메인 배너' },
                { id: 'faq', label: '자주 묻는 질문' },
                { id: 'docs', label: '서식 다운로드' },
                { id: 'schedule', label: '한국어학당 일정' },
                { id: 'inquiry', label: '1:1 빠른 문의' },
              ].map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    setPreviewSection(sec.id as any);
                    if (sec.id === 'faq') setPreviewTab('faq');
                    else if (sec.id === 'docs') setPreviewTab('downloads');
                    else if (sec.id === 'schedule') setPreviewTab('schedule');
                    else if (sec.id === 'inquiry') setPreviewTab('inquiry');
                  }}
                  className={`px-2 py-0.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                    previewSection === sec.id
                      ? 'bg-[#1A3B6B] text-white font-bold'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Language preview toggle */}
            <div className="flex items-center gap-1 shrink-0 ml-auto">
              <span className="text-gray-400 font-semibold">언어:</span>
              {(['ko', 'en', 'vi', 'zh', 'mn'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setPreviewLang(l)}
                  className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase transition-colors cursor-pointer ${
                    previewLang === l
                      ? 'bg-[#2E7D5B] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Preview Canvas Container with Responsive Width Wrapper */}
          <div className="p-4 bg-gray-100/90 max-h-[calc(100vh-270px)] overflow-y-auto flex justify-center">
            <div
              className={`bg-white border shadow-xs overflow-hidden transition-all duration-200 w-full ${
                previewDevice === 'mobile'
                  ? 'max-w-[375px]'
                  : previewDevice === 'tablet'
                  ? 'max-w-[680px]'
                  : 'max-w-full'
              }`}
              style={{
                borderRadius: `${draftConfig.borderRadius}px`,
                borderColor: '#E2E5E8',
              }}
            >
              {/* Real Student Portal Navbar */}
              <Navbar
                currentLang={previewLang}
                onLanguageChange={setPreviewLang}
                activeTab={previewTab}
                setActiveTab={(tab) => {
                  if (tab !== 'admin') {
                    setPreviewTab(tab);
                    if (tab === 'faq') setPreviewSection('faq');
                    else if (tab === 'downloads') setPreviewSection('docs');
                    else if (tab === 'schedule') setPreviewSection('schedule');
                    else if (tab === 'inquiry') setPreviewSection('inquiry');
                  }
                }}
                config={draftConfig}
              />

              {/* Popup Notice Preview if selected */}
              {previewSection === 'popup' && draftConfig.popupEnabled && (
                <div className="p-4 bg-amber-50 border-b border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#1A3B6B] text-white">
                      {draftConfig.popupBadge || '공지사항'}
                    </span>
                    <h4 className="text-xs font-bold text-gray-900">{draftConfig.popupTitle}</h4>
                  </div>
                  <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed mb-3">
                    {draftConfig.popupContent}
                  </p>
                  {draftConfig.popupLinkText && (
                    <button
                      type="button"
                      onClick={() => {
                        if (draftConfig.popupLinkTab) {
                          setPreviewTab(draftConfig.popupLinkTab);
                          if (draftConfig.popupLinkTab === 'faq') setPreviewSection('faq');
                          else if (draftConfig.popupLinkTab === 'downloads') setPreviewSection('docs');
                        }
                      }}
                      className="text-[11px] text-[#1A3B6B] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{draftConfig.popupLinkText}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Real Hero Section */}
              {(previewSection === 'all' || previewSection === 'hero') && (
                <HeroSection
                  currentLang={previewLang}
                  searchQuery={previewSearchText}
                  setSearchQuery={setPreviewSearchText}
                  selectedCategory={previewSelectedCategory as any}
                  setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                  config={draftConfig}
                />
              )}

              {/* Search Results OR Tab Content */}
              {previewSearchText.trim() !== '' ? (
                <IntegratedSearchResults
                  faqs={effectiveFaqs}
                  documents={effectiveDocs}
                  searchQuery={previewSearchText}
                  onClearSearch={() => setPreviewSearchText('')}
                  currentLang={previewLang}
                  onNavigateTab={(tab) => {
                    setPreviewSearchText('');
                    if (tab === 'faq') { setPreviewTab('faq'); setPreviewSection('faq'); }
                    else if (tab === 'downloads') { setPreviewTab('downloads'); setPreviewSection('docs'); }
                    else if (tab === 'schedule') { setPreviewTab('schedule'); setPreviewSection('schedule'); }
                    else if (tab === 'inquiry') { setPreviewTab('inquiry'); setPreviewSection('inquiry'); }
                  }}
                />
              ) : (
                <>
                  {/* Frequently Asked Questions */}
                  {(previewSection === 'all' || previewSection === 'faq') && previewTab === 'faq' && (
                    <FaqSection
                      faqs={effectiveFaqs}
                      currentLang={previewLang}
                      selectedCategory={previewSelectedCategory as any}
                      setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                      searchQuery=""
                    />
                  )}

                  {/* Downloads & Forms */}
                  {(previewSection === 'all' || previewSection === 'docs') && previewTab === 'downloads' && (
                    <DownloadsSection
                      documents={effectiveDocs}
                      currentLang={previewLang}
                      selectedCategory={previewSelectedCategory}
                      setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                    />
                  )}

                  {/* Academic Calendar */}
                  {(previewSection === 'all' || previewSection === 'schedule') && previewTab === 'schedule' && (
                    <ScheduleSection
                      schedules={effectiveSchedules}
                      currentLang={previewLang}
                    />
                  )}

                  {/* 1:1 Inquiry */}
                  {(previewSection === 'all' || previewSection === 'inquiry') && previewTab === 'inquiry' && (
                    <InquirySection currentLang={previewLang} config={draftConfig} />
                  )}
                </>
              )}

              {/* Real Footer */}
              <Footer currentLang={previewLang} config={draftConfig} />
            </div>
          </div>
        </div>
      </div>

      {/* ===================== MODAL 1: PUBLISH & APPLY CONFIRMATION (요청 6) ===================== */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border border-blue-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-[#1A3B6B]" />
                <span>학생 포털에 게시 및 적용하기</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50/80 rounded border border-blue-200 text-blue-900 leading-relaxed">
                지금 적용하시면 현재 디자인 모드에서 수정한 색상, 로고, 메인 배너 및 검색 설정이 <strong>실제 유학생 포털 화면에 즉시 반영</strong>됩니다.
                <br />
                <span className="text-[11px] text-blue-700 mt-1 block">
                  ※ 안전한 관리를 위해 게시 시점에 자동으로 <strong>버전 보관함</strong>에 현재 설정이 영구 보관됩니다.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  게시 버전 명칭 (이력 식별용)
                </label>
                <input
                  type="text"
                  required
                  value={publishVersionTitle}
                  onChange={(e) => setPublishVersionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#1A3B6B]"
                  placeholder="예: 2026학년도 1학기 네이비 테마 및 공식 로고 적용"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? '게시 중...' : '지금 즉시 게시 및 보관'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: RESTORE VERSION CONFIRMATION ===================== */}
      {restoreConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 border border-purple-200 text-xs">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm mb-3">
              <Archive className="w-5 h-5 text-purple-700" />
              <span>과거 보관 버전 실시간 복원</span>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              정말 <strong className="text-gray-900 font-bold">'{restoreConfirmTarget.title}'</strong> 버전으로 학생 포털의 모든 디자인을 되돌리시겠습니까?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRestoreConfirmTarget(null)}
                className="px-3.5 py-1.5 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleRestoreArchiveConfirmed}
                className="px-4 py-1.5 rounded bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs cursor-pointer"
              >
                복원 실행
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: DELETE ARCHIVE CONFIRMATION ===================== */}
      {deleteArchiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 border border-red-200 text-xs">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>보관 버전 삭제</span>
            </div>

            <p className="text-gray-700 leading-relaxed mb-4">
              보관된 <strong className="text-gray-900 font-bold">'{deleteArchiveTarget.title}'</strong> 버전 기록을 삭제하시겠습니까? 삭제된 보관본은 복구할 수 없습니다.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteArchiveTarget(null)}
                className="px-3.5 py-1.5 rounded text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteArchiveConfirmed}
                className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: FULLSCREEN INTERACTIVE PREVIEW (요청 8) ===================== */}
      {isFullScreenPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col p-2 sm:p-6 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-2xl flex flex-col h-full overflow-hidden border border-gray-300">
            {/* Modal Header */}
            <div className="bg-gray-900 text-white px-4 py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="font-bold text-sm">학생 포털 전체화면 실시간 미리보기 (Live Simulator)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenPublishModal}
                  className="px-3 py-1 rounded bg-[#2E7D5B] hover:bg-[#236348] text-white font-bold transition-colors cursor-pointer"
                >
                  이 설정으로 즉시 게시
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullScreenPreview(false)}
                  className="p-1 rounded text-gray-400 hover:text-white cursor-pointer"
                  title="닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body iframe-like container */}
            <div className="flex-1 overflow-y-auto bg-[#F7F8F9]">
              <Navbar
                currentLang={previewLang}
                onLanguageChange={setPreviewLang}
                activeTab={previewTab}
                setActiveTab={(tab) => {
                  if (tab !== 'admin') {
                    setPreviewTab(tab as any);
                  }
                }}
                config={draftConfig}
              />

              <HeroSection
                currentLang={previewLang}
                searchQuery={previewSearchText}
                setSearchQuery={setPreviewSearchText}
                selectedCategory={previewSelectedCategory as any}
                setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                config={draftConfig}
              />

              {previewSearchText.trim() !== '' ? (
                <IntegratedSearchResults
                  faqs={effectiveFaqs}
                  documents={effectiveDocs}
                  searchQuery={previewSearchText}
                  onClearSearch={() => setPreviewSearchText('')}
                  currentLang={previewLang}
                  onNavigateTab={(tab) => {
                    setPreviewSearchText('');
                    if (tab === 'faq') setPreviewTab('faq');
                    else if (tab === 'downloads') setPreviewTab('downloads');
                    else if (tab === 'schedule') setPreviewTab('schedule');
                    else if (tab === 'inquiry') setPreviewTab('inquiry');
                  }}
                />
              ) : (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                  {previewTab === 'faq' && (
                    <FaqSection
                      faqs={effectiveFaqs}
                      currentLang={previewLang}
                      selectedCategory={previewSelectedCategory as any}
                      setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                      searchQuery=""
                    />
                  )}
                  {previewTab === 'downloads' && (
                    <DownloadsSection
                      documents={effectiveDocs}
                      currentLang={previewLang}
                      selectedCategory={previewSelectedCategory}
                      setSelectedCategory={(cat) => setPreviewSelectedCategory(cat)}
                    />
                  )}
                  {previewTab === 'schedule' && (
                    <ScheduleSection
                      schedules={effectiveSchedules}
                      currentLang={previewLang}
                    />
                  )}
                  {previewTab === 'inquiry' && (
                    <InquirySection currentLang={previewLang} config={draftConfig} />
                  )}
                </div>
              )}

              <Footer currentLang={previewLang} config={draftConfig} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
