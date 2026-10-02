import React, { useState } from 'react';
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
  Link2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { KmuLogo } from '../KmuLogo';
import { NoticePopup } from '../NoticePopup';
import { LogoType, PopupStyle, PopupIconType, CategoryItem, RelatedSite } from '../../types';
import { DEFAULT_RELATED_SITES } from '../../constants/initialRelatedSites';

export const ThemeCustomizer: React.FC = () => {
  const {
    config,
    draftConfig,
    updateDraft,
    saveDraftToLive,
    resetDraftToLive,
    resetToFactoryDefaults,
    isSaving,
    saveMessage,
    setIsDesignMode,
  } = useTheme();

  const [activeCategoryTab, setActiveCategoryTab] = useState<
    'brand' | 'logo' | 'hero' | 'categories' | 'popup' | 'footer' | 'mood' | 'chatbot'
  >('brand');
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [previewPopupOpen, setPreviewPopupOpen] = useState(false);
  const [logoPreviewBgDark, setLogoPreviewBgDark] = useState(false);

  // Category Editor State
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatId, setNewCatId] = useState('');
  const [newCatKo, setNewCatKo] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('FileBadge');

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

  const handlePublish = async () => {
    await saveDraftToLive();
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId.trim() || !newCatKo.trim()) {
      alert('카테고리 ID와 한국어 명칭을 입력해 주세요.');
      return;
    }

    const cleanId = newCatId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const currentCats = draftConfig.categories || [];
    if (currentCats.some(c => c.id === cleanId)) {
      alert('이미 존재하는 카테고리 ID입니다. 다른 ID를 입력해 주세요.');
      return;
    }

    const newCategory: CategoryItem = {
      id: cleanId,
      name: {
        ko: newCatKo.trim(),
      },
      icon: newCatIcon,
    };

    updateDraft({
      categories: [...currentCats, newCategory],
    });

    // Reset Form
    setNewCatId('');
    setNewCatKo('');
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = (cat: CategoryItem) => {
    const updated = (draftConfig.categories || []).map(c => (c.id === cat.id ? cat : c));
    updateDraft({ categories: updated });
    setEditingCategory(null);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('정말 이 카테고리를 삭제하시겠습니까? 관련 FAQ의 카테고리 태그도 영향을 받을 수 있습니다.')) {
      const filtered = (draftConfig.categories || []).filter(c => c.id !== catId);
      updateDraft({ categories: filtered });
    }
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
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                실시간 분할 뷰
              </span>
            </h2>
            <p className="text-xs text-gray-500">
              색상, 로고, 검색 버튼 디자인, 카테고리, 팝업 및 관련 사이트를 편집하면 우측 미리보기에 즉시 반영됩니다.
            </p>
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

          {draftSavedToast && (
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 animate-fade-in flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              임시 저장 완료
            </span>
          )}

          <button
            onClick={() => setIsDesignMode(false)}
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            편집 종료
          </button>

          <button
            onClick={resetDraftToLive}
            title="현재 서버에 저장된 상태로 되돌리기"
            className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>원복</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('모든 디자인을 계명대학교 초기 기본값으로 초기화하시겠습니까?')) {
                resetToFactoryDefaults();
              }
            }}
            title="출고 초기값으로 재설정"
            className="px-2.5 py-1.5 rounded text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            초기화
          </button>

          <button
            onClick={handleSaveDraft}
            className="px-3.5 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 transition-colors flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5 text-gray-500" />
            <span>임시 저장</span>
          </button>

          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-1.5 rounded text-xs font-bold text-white transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            style={{ backgroundColor: draftConfig.mainColor || '#1A3B6B' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isSaving ? '배포 중...' : '적용하기 (학생 화면 반영)'}</span>
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
              로고 디자인
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
              onClick={() => setActiveCategoryTab('categories')}
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap flex items-center gap-1 ${
                activeCategoryTab === 'categories'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Tags className="w-3.5 h-3.5 text-blue-600" />
              <span>카테고리 관리</span>
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
              className={`py-2.5 px-3 font-semibold text-center border-b-2 transition-colors whitespace-nowrap ${
                activeCategoryTab === 'mood'
                  ? 'border-[#1A3B6B] text-[#1A3B6B] bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              폰트/곡률
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
              <span>AI 챗봇</span>
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

                {/* Sub Options for Image */}
                {draftConfig.logoType === 'image' && (
                  <div className="space-y-3 pt-3 border-t border-gray-100">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        로고 이미지 URL
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
                        onClick={() => updateDraft({ logoUrl: '/kmu_type67_view.jpg' })}
                        className="px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:bg-blue-100 transition-colors"
                      >
                        계명대 공식 워드마크 설정
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

            {/* TAB 4: Category Management */}
            {activeCategoryTab === 'categories' && (
              <div className="space-y-4">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => {
                      setIsAddingCategory(!isAddingCategory);
                      setEditingCategory(null);
                    }}
                    className="px-2.5 py-1 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 카테고리</span>
                  </button>
                </div>

                {/* Add New Category Form */}
                {isAddingCategory && (
                  <form
                    onSubmit={handleAddCategorySubmit}
                    className="p-3.5 rounded border border-blue-200 bg-blue-50/40 space-y-3 animate-fade-in"
                  >
                    <div className="font-bold text-gray-900 text-xs flex items-center justify-between">
                      <span>새 카테고리 등록</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          카테고리 ID (영문 고유 식별자)*
                        </label>
                        <input
                          type="text"
                          required
                          value={newCatId}
                          onChange={(e) => setNewCatId(e.target.value)}
                          placeholder="예: scholarship, job, health"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#1A3B6B]"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">영문 소문자 및 숫자 조합</p>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                          한국어 명칭 (필수)*
                        </label>
                        <input
                          type="text"
                          required
                          value={newCatKo}
                          onChange={(e) => setNewCatKo(e.target.value)}
                          placeholder="예: 장학/등록금, 취업/아르바이트"
                          className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-[#1A3B6B]"
                        />
                        <p className="text-[10px] text-gray-400 mt-0.5">포털 기본 표시 명칭</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        대표 아이콘 선택
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {categoryIcons.map((ic) => (
                          <button
                            key={ic.id}
                            type="button"
                            onClick={() => setNewCatIcon(ic.id)}
                            className={`p-1.5 rounded border flex flex-col items-center gap-1 text-[10px] transition-colors cursor-pointer ${
                              newCatIcon === ic.id
                                ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            {ic.icon}
                            <span className="truncate max-w-full">{ic.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded bg-[#1A3B6B] text-white font-bold cursor-pointer"
                      >
                        추가 완료
                      </button>
                    </div>
                  </form>
                )}

                {/* Edit Category Inline Form */}
                {editingCategory && (
                  <div className="p-3.5 rounded border border-amber-300 bg-amber-50/50 space-y-3 animate-fade-in">
                    <div className="font-bold text-gray-900 text-xs flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span>카테고리 수정:</span>
                        <code className="text-xs bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono">
                          {editingCategory.id}
                        </code>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-400 hover:text-gray-700 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                        한국어 명칭
                      </label>
                      <input
                        type="text"
                        value={editingCategory.name.ko || ''}
                        onChange={(e) =>
                          setEditingCategory({
                            ...editingCategory,
                            name: { ...editingCategory.name, ko: e.target.value },
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs bg-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        대표 아이콘
                      </label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {categoryIcons.map((ic) => (
                          <button
                            key={ic.id}
                            type="button"
                            onClick={() =>
                              setEditingCategory({ ...editingCategory, icon: ic.id })
                            }
                            className={`p-1.5 rounded border flex flex-col items-center gap-1 text-[10px] cursor-pointer ${
                              editingCategory.icon === ic.id
                                ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                                : 'border-gray-200 bg-white text-gray-600'
                            }`}
                          >
                            {ic.icon}
                            <span className="truncate max-w-full">{ic.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateCategory(editingCategory)}
                        className="px-3.5 py-1 rounded bg-[#2E7D5B] text-white font-bold cursor-pointer"
                      >
                        수정 저장
                      </button>
                    </div>
                  </div>
                )}

                {/* Categories List */}
                <div className="space-y-2">
                  {(draftConfig.categories || []).map((cat, idx) => (
                    <div
                      key={cat.id}
                      className="p-3 rounded border border-gray-200 bg-gray-50 flex items-center justify-between hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1A3B6B] flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{cat.name.ko}</span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({cat.id})
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsAddingCategory(false);
                          }}
                          className="p-1 rounded text-gray-500 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
                          title="수정"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
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
                      유학생 접속 시 비자 연장, 학사 일정 등 주요 안내 노출
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
                      { id: 'calendar', label: '학사일정', icon: <Calendar className="w-3.5 h-3.5" /> },
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
                      className="w-full px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white leading-relaxed font-sans"
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

            {/* TAB 7: Mood & Layout */}
            {activeCategoryTab === 'mood' && (
              <div className="space-y-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    가독성 폰트 크기
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateDraft({ fontSize: 'standard' })}
                      className={`p-2.5 rounded border text-left font-medium transition-colors ${
                        draftConfig.fontSize === 'standard'
                          ? 'border-[#1A3B6B] bg-blue-50/50 text-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      기본 표준 크기 (Standard)
                    </button>
                    <button
                      onClick={() => updateDraft({ fontSize: 'large' })}
                      className={`p-2.5 rounded border text-left font-medium transition-colors ${
                        draftConfig.fontSize === 'large'
                          ? 'border-[#1A3B6B] bg-blue-50/50 text-[#1A3B6B]'
                          : 'border-gray-200 bg-gray-50 text-gray-700'
                      }`}
                    >
                      시니어/유학생 가독성 확대 (+1px)
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-gray-700">
                      카드 모서리 둥글기 (Border Radius)
                    </label>
                    <span className="text-xs font-mono text-gray-500">
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
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>직각 (0px)</span>
                    <span>약간 둥글게 (6px)</span>
                    <span>부드럽게 (16px)</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 8: AI Chatbot */}
            {activeCategoryTab === 'chatbot' && (
              <div className="space-y-4">
                <div className="p-3 rounded border border-blue-200 bg-blue-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-gray-900 block">
                      챗봇 활성화 상태
                    </span>
                    <span className="text-[10px] text-gray-500">
                      학생 화면 우측 하단에 AI 챗봇 상담 버튼을 표시합니다.
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
                    value={draftConfig.chatbotName || '계명어학당 AI 챗봇'}
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
                    value={draftConfig.chatbotSubtitle || '24시간 유학생 실시간 상담'}
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
                      '안녕하세요! 계명대학교 한국어학당 AI 가이드 챗봇입니다. 🎓\nD-4 비자 연장 서류, 최소 출석률 기준(80% 이상), 기숙사 외박 신청, 행정실 위치 등 무엇이든 물어보세요!'
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
                      '질문을 입력하세요... (예: D-4 연장 서류, 출석률 기준)'
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

        {/* Right: Live Interactive Split Preview (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-md border border-[#E2E5E8] shadow-xs overflow-hidden sticky top-20">
          <div className="bg-gray-50 px-4 py-2.5 border-b border-[#E2E5E8] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="font-semibold text-gray-700 ml-2">실시간 라이브 미리보기 (Live Preview)</span>
            </div>
            <span className="text-[11px] text-gray-400 font-mono">
              반영 대기 중 (Draft Preview)
            </span>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="p-4 bg-gray-100 max-h-[calc(100vh-250px)] overflow-y-auto">
            <div
              className="bg-white border shadow-xs overflow-hidden transition-all"
              style={{
                borderRadius: `${draftConfig.borderRadius}px`,
                borderColor: '#E2E5E8',
              }}
            >
              {/* Preview Header */}
              <div className="p-3 border-b border-[#E2E5E8] flex items-center justify-between bg-white">
                <div className="flex items-center gap-2.5">
                  {draftConfig.logoType && draftConfig.logoType !== 'none' && (
                    <KmuLogo config={draftConfig} />
                  )}
                  <span
                    className="block text-xs font-bold tracking-tight"
                    style={{ color: draftConfig.mainColor }}
                  >
                    {draftConfig.heroTitle}
                  </span>
                </div>
                <div className="flex gap-1 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-semibold">
                    KO
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">
                    EN
                  </span>
                </div>
              </div>

              {/* Preview Hero Banner */}
              <div
                className="p-6 text-center text-white"
                style={{
                  backgroundColor: draftConfig.bgType === 'campus' ? undefined : draftConfig.mainColor,
                  backgroundImage: draftConfig.bgType === 'campus'
                    ? 'linear-gradient(rgba(18, 40, 75, 0.88), rgba(26, 59, 107, 0.94)), url("https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=80")'
                    : undefined,
                  backgroundSize: 'cover',
                }}
              >
                <h3 className="text-base font-extrabold mb-3">
                  {draftConfig.heroTitle}
                </h3>

                {/* Preview Search bar with custom button design */}
                <div
                  className="bg-white p-1 flex items-center shadow-md text-xs text-gray-400 max-w-md mx-auto transition-all"
                  style={{ borderRadius: `${draftConfig.searchBarRadius ?? draftConfig.borderRadius ?? 8}px` }}
                >
                  <span className="px-2">🔍</span>
                  <span className="text-gray-500 text-[11px] truncate flex-1 text-left">
                    {draftConfig.searchPlaceholder}
                  </span>
                  <span
                    className="font-bold text-white flex items-center justify-center gap-1 transition-all"
                    style={{
                      backgroundColor: draftConfig.searchButtonColor || draftConfig.accentColor || draftConfig.mainColor,
                      borderRadius: draftConfig.searchButtonShape === 'square'
                        ? '0px'
                        : draftConfig.searchButtonShape === 'pill'
                        ? '9999px'
                        : `${draftConfig.searchButtonRadius ?? 6}px`,
                      padding: draftConfig.searchButtonSize === 'sm'
                        ? '3px 8px'
                        : draftConfig.searchButtonSize === 'lg'
                        ? '8px 16px'
                        : '5px 12px',
                      fontSize: draftConfig.searchButtonSize === 'sm' ? '10px' : draftConfig.searchButtonSize === 'lg' ? '12px' : '11px',
                    }}
                  >
                    {draftConfig.searchButtonShowIcon !== false && (
                      draftConfig.searchButtonIconType === 'arrow' ? '➔' : draftConfig.searchButtonIconType === 'sparkles' ? '✨' : '🔍'
                    )}
                    <span>{draftConfig.searchButtonText || '검색'}</span>
                  </span>
                </div>

                {/* Preview Categories Quick Chips */}
                <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
                  {(draftConfig.categories || []).map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-white/15 text-white/90 border border-white/20"
                    >
                      {cat.name.ko}
                    </span>
                  ))}
                </div>
              </div>

              {/* Preview Content Snippet */}
              <div className="p-4 space-y-3 bg-[#fafbfc]">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 pb-1 border-b border-gray-200">
                  <span>자주 묻는 질문 (FAQ) 미리보기</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-white"
                    style={{ backgroundColor: draftConfig.warnColor }}
                  >
                    중요 안내
                  </span>
                </div>

                <div
                  className="p-3 bg-white border border-[#E2E5E8] shadow-xs text-xs flex items-center justify-between"
                  style={{ borderRadius: `${draftConfig.borderRadius}px` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: draftConfig.accentColor }}
                    ></span>
                    <span className="font-semibold text-gray-800">
                      비자(D-4) 연장 신청은 언제부터 가능한가요?
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px]">▼</span>
                </div>

                <div
                  className="p-3 bg-white border border-[#E2E5E8] shadow-xs text-xs flex items-center justify-between"
                  style={{ borderRadius: `${draftConfig.borderRadius}px` }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: draftConfig.accentColor }}
                    ></span>
                    <span className="font-semibold text-gray-800">
                      기숙사(명교생활관) 외박 신청 방법
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px]">▼</span>
                </div>
              </div>

              {/* Preview Footer */}
              <div className="p-3 bg-[#243447] text-white text-[10px] space-y-1.5">
                <div className="flex justify-between items-center text-gray-300">
                  <span>{draftConfig.phone}</span>
                  <span>{draftConfig.email}</span>
                </div>
                <div className="text-gray-400 truncate">
                  {draftConfig.location}
                </div>
                {draftConfig.showRelatedSites !== false && (
                  <div className="pt-1 border-t border-gray-700/60 text-[9px] text-gray-400 flex items-center gap-1.5 flex-wrap">
                    <span className="text-gray-300 font-semibold">관련 사이트:</span>
                    <span className="text-blue-300">하이코리아</span>
                    <span>•</span>
                    <span className="text-blue-300">TOPIK</span>
                    <span>•</span>
                    <span className="text-blue-300">스터디인코리아</span>
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-700/60 text-gray-400">
                  <span className="font-semibold text-gray-300">SNS:</span>
                  {draftConfig.showInstagram && <span className="text-pink-400">Instagram</span>}
                  {draftConfig.showYoutube && <span className="text-red-400">YouTube</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
