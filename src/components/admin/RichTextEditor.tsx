import React, { useState, useRef, useEffect, useCallback } from 'react';
import { optimizeImage } from '../../services/imageOptimizer';
import { DocumentItem } from '../../types';
import { triggerDocumentDownload } from '../../services/downloadHelper';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Image as ImageIcon,
  Link as LinkIcon,
  Table as TableIcon,
  Code,
  Undo2,
  Redo2,
  Trash2,
  Upload,
  Info,
  AlertTriangle,
  CheckCircle2,
  X,
  Palette,
  Type,
  Minus,
  Plus,
  ChevronDown,
  Check,
  Indent,
  Outdent,
  FileText,
  Download,
  Paperclip,
  FolderDown,
  AlertOctagon,
  Lightbulb,
  Maximize2,
  Search,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  documents?: DocumentItem[];
}

// 1. Font Family Presets (Requirement 1: 다양화 및 미반영 오류 수정)
export const FONT_FAMILY_OPTIONS = [
  { label: '본문 기본 고딕 (Pretendard / Noto)', value: "Pretendard, 'Noto Sans KR', -apple-system, sans-serif" },
  { label: '나눔고딕 (Nanum Gothic)', value: "'Nanum Gothic', sans-serif" },
  { label: '나눔명조 (Nanum Myeongjo)', value: "'Nanum Myeongjo', serif" },
  { label: '고운바탕 (Gowun Batang)', value: "'Gowun Batang', serif" },
  { label: '고운돋움 (Gowun Dodum)', value: "'Gowun Dodum', sans-serif" },
  { label: '맑은 고딕 (Malgun Gothic)', value: "'Malgun Gothic', '맑은 고딕', sans-serif" },
  { label: '바탕체 / 명조 (Batang)', value: "Batang, '바탕', serif" },
  { label: '돋움체 (Dotum)', value: "Dotum, '돋움', sans-serif" },
  { label: '영문 / 코딩 고정폭 (Monospace)', value: "D2Coding, 'Courier New', monospace" },
];

// 2. Font Size 8 to 20 in 1-unit steps + larger headings (Requirement 2)
export const FONT_SIZE_OPTIONS = [
  8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 24, 28,
];

// 3. Rich Categorized Text Color Palette (Requirement 3: 글자색 다양화)
export const TEXT_COLOR_PALETTES = [
  {
    group: '모노톤 (흑백/회색)',
    colors: [
      { label: '기본 검정', value: '#111827' },
      { label: '진회색', value: '#374151' },
      { label: '슬레이트', value: '#64748B' },
      { label: '연회색', value: '#9CA3AF' },
      { label: '순백색', value: '#FFFFFF' },
    ],
  },
  {
    group: '계명대 & 블루 계열',
    colors: [
      { label: 'KMU 딥네이비', value: '#0F254A' },
      { label: 'KMU 네이비', value: '#1A3B6B' },
      { label: '로얄 블루', value: '#2563EB' },
      { label: '스카이 블루', value: '#0284C7' },
      { label: '인디고', value: '#4F46E5' },
    ],
  },
  {
    group: '강조 & 오렌지/레드 계열',
    colors: [
      { label: 'KMU 주황', value: '#D97736' },
      { label: '선셋 오렌지', value: '#EA580C' },
      { label: '선명한 빨강', value: '#DC2626' },
      { label: '다크 와인', value: '#991B1B' },
      { label: '로즈 핑크', value: '#E11D48' },
    ],
  },
  {
    group: '행정 & 초록/에메랄드 계열',
    colors: [
      { label: 'KMU 행정그린', value: '#2E7D5B' },
      { label: '포레스트', value: '#16A34A' },
      { label: '에메랄드', value: '#059669' },
      { label: '청록 (틸)', value: '#0D9488' },
    ],
  },
  {
    group: '보라 & 앰버 계열',
    colors: [
      { label: '바이올렛', value: '#7C3AED' },
      { label: '퍼플', value: '#9333EA' },
      { label: '골드 앰버', value: '#D97706' },
      { label: '브라운', value: '#854D0E' },
    ],
  },
];

export const HIGHLIGHT_COLORS = [
  { label: '없음 (투명)', value: 'transparent' },
  { label: '노랑 형광펜', value: '#FEF08A' },
  { label: '연파랑 형광펜', value: '#BAE6FD' },
  { label: '연초록 형광펜', value: '#BBF7D0' },
  { label: '연주황 형광펜', value: '#FED7AA' },
  { label: '연분홍 형광펜', value: '#FBCFE8' },
  { label: '연보라 형광펜', value: '#E9D5FF' },
];

// 5. Line Height Presets (Requirement 5: 줄 높이 설정)
export const LINE_HEIGHT_OPTIONS = [
  { label: '1.0 (100% 매우 좁게)', value: '1.0' },
  { label: '1.2 (120% 좁게)', value: '1.2' },
  { label: '1.4 (140% 약간 좁게)', value: '1.4' },
  { label: '1.6 (160% 기본 권장)', value: '1.6' },
  { label: '1.8 (180% 넓게)', value: '1.8' },
  { label: '2.0 (200% 여유)', value: '2.0' },
  { label: '2.2 (220% 넉넉하게)', value: '2.2' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '답변 본문 내용을 입력하고 서식을 자유롭게 꾸며보세요...',
  minHeight = '300px',
  documents: propDocuments,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineDocInputRef = useRef<HTMLInputElement>(null);

  const [isCodeView, setIsCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value);

  // 1. Font Family & Size State (Requirement 1 & 2)
  const [currentFontFamily, setCurrentFontFamily] = useState(FONT_FAMILY_OPTIONS[0].value);
  const [currentFontSize, setCurrentFontSize] = useState<number>(14);

  // 3. Text Color & Highlight State (Requirement 3)
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#1A3B6B');
  const [customHighlightColor, setCustomHighlightColor] = useState('#FEF08A');

  // 4. Box Customizer Modal & Active Box State (Requirement 4)
  const [boxModalOpen, setBoxModalOpen] = useState(false);
  const [boxPreset, setBoxPreset] = useState<'info' | 'warning' | 'alert' | 'success' | 'tip' | 'doc' | 'custom'>('info');
  const [boxBgColor, setBoxBgColor] = useState('#EFF6FF');
  const [boxBorderColor, setBoxBorderColor] = useState('#1A3B6B');
  const [boxBorderStyle, setBoxBorderStyle] = useState<'left' | 'full' | 'dashed' | 'shadow'>('left');
  const [boxRadius, setBoxRadius] = useState<'0px' | '6px' | '12px'>('6px');
  const [boxIcon, setBoxIcon] = useState('ℹ️');
  const [boxTitle, setBoxTitle] = useState('중요 안내 사항');
  const [boxContent, setBoxContent] = useState('여기에 세부 안내 및 상세 내용을 입력하세요.');
  const [selectedBoxEl, setSelectedBoxEl] = useState<HTMLElement | null>(null);

  // 5. Line Height State (Requirement 5)
  const [currentLineHeight, setCurrentLineHeight] = useState('1.6');

  // 6. File Attachment state for inline document box (Requirement 6)
  const [fileBoxModalOpen, setFileBoxModalOpen] = useState(false);
  const [pendingFileName, setPendingFileName] = useState('');
  const [pendingFileSize, setPendingFileSize] = useState('');
  const [pendingFileDataUrl, setPendingFileDataUrl] = useState('');
  const [pendingFileType, setPendingFileType] = useState('pdf');

  // 7. Library Document Shortcut Modal (Requirement 7)
  const [docShortcutModalOpen, setDocShortcutModalOpen] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [availableDocs, setAvailableDocs] = useState<DocumentItem[]>([]);

  // Load available documents from props or local cache
  useEffect(() => {
    if (propDocuments && propDocuments.length > 0) {
      setAvailableDocs(propDocuments);
    } else {
      try {
        const cached = localStorage.getItem('kmu_docs_cache');
        if (cached) {
          setAvailableDocs(JSON.parse(cached));
        }
      } catch {
        // ignore
      }
    }
  }, [propDocuments]);

  // Active / Selected Image State for inline resizing
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgWidthPercent, setImgWidthPercent] = useState<number>(100);
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [insertWidthPreset, setInsertWidthPreset] = useState<number>(75);
  const [insertAlignPreset, setInsertAlignPreset] = useState<'left' | 'center' | 'right'>('center');

  // Active / Selected Table & Cell State
  const [selectedCell, setSelectedCell] = useState<HTMLTableCellElement | null>(null);
  const [selectedTable, setSelectedTable] = useState<HTMLTableElement | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [tableTheme, setTableTheme] = useState<'navy' | 'gray' | 'clean' | 'green'>('navy');
  const [showCellBgPicker, setShowCellBgPicker] = useState(false);
  const [showListTypePicker, setShowListTypePicker] = useState(false);

  // Link insertion modal & settings
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [linkText, setLinkText] = useState('');
  const [linkNewTab, setLinkNewTab] = useState(true);
  const savedSelectionRange = useRef<Range | null>(null);

  // Dragging resize for image
  const isDraggingResize = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Sync incoming value to editor DOM
  useEffect(() => {
    if (editorRef.current && !isCodeView) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
    setCodeValue(value);
  }, [value, isCodeView]);

  // Handle editor input
  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      setCodeValue(html);
    }
  }, [onChange]);

  // Execute standard formatting commands
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (isCodeView) return;
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    handleEditorInput();
  };

  // Insert custom HTML block
  const insertCustomHtml = (html: string) => {
    if (isCodeView) {
      setCodeValue((prev) => prev + '\n' + html);
      onChange(codeValue + '\n' + html);
      return;
    }
    editorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    handleEditorInput();
  };

  // 1. Font Family Application (Requirement 1)
  const applyFontFamily = (fontValue: string) => {
    setCurrentFontFamily(fontValue);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    if (sel.isCollapsed) {
      // Insert placeholder span for future typing
      const span = document.createElement('span');
      span.style.fontFamily = fontValue;
      span.innerHTML = '&#8203;';
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand('fontName', false, fontValue);
      // Ensure generated font tags carry the explicit inline font-family
      if (editorRef.current) {
        const fontTags = editorRef.current.querySelectorAll('font');
        fontTags.forEach((el) => {
          const fontEl = el as HTMLElement;
          if (fontEl.getAttribute('face') === fontValue) {
            fontEl.style.fontFamily = fontValue;
          }
        });
      }
    }
    handleEditorInput();
  };

  // 2. Font Size 8 to 20 in 1-unit increments (Requirement 2)
  const applyFontSize = (sizePx: number) => {
    const validSize = Math.max(8, Math.min(48, sizePx));
    setCurrentFontSize(validSize);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    if (sel.isCollapsed) {
      const span = document.createElement('span');
      span.style.fontSize = `${validSize}px`;
      span.style.lineHeight = '1.5';
      span.innerHTML = '&#8203;';
      const range = sel.getRangeAt(0);
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      document.execCommand('fontSize', false, '7');
      if (editorRef.current) {
        const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
        fontTags.forEach((el) => {
          const fontEl = el as HTMLElement;
          fontEl.removeAttribute('size');
          fontEl.style.fontSize = `${validSize}px`;
          fontEl.style.lineHeight = '1.5';
        });
      }
    }
    handleEditorInput();
  };

  const handleStepFontSize = (delta: number) => {
    applyFontSize(currentFontSize + delta);
  };

  // 3. Text Color & Highlight Application (Requirement 3)
  const applyTextColor = (colorHex: string) => {
    execCmd('foreColor', colorHex);
    setShowColorPicker(false);
  };

  const applyHighlightColor = (colorHex: string) => {
    execCmd('hiliteColor', colorHex);
    setShowHighlightPicker(false);
  };

  // 5. Line Height Application (Requirement 5)
  const applyLineHeight = (lineHeight: string) => {
    setCurrentLineHeight(lineHeight);
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    let node: Node | null = sel.anchorNode;
    if (node && node.nodeType === 3) {
      node = node.parentElement;
    }
    const blockEl = (node as HTMLElement)?.closest('p, div, li, h1, h2, h3, h4, td, th');
    if (blockEl && editorRef.current?.contains(blockEl)) {
      (blockEl as HTMLElement).style.lineHeight = lineHeight;
      handleEditorInput();
    } else {
      execCmd('formatBlock', '<p>');
      setTimeout(() => {
        const activeBlock = window.getSelection()?.anchorNode?.parentElement?.closest('p, div');
        if (activeBlock) {
          (activeBlock as HTMLElement).style.lineHeight = lineHeight;
          handleEditorInput();
        }
      }, 10);
    }
  };

  // 4. Box Preset Switcher & Insertion (Requirement 4)
  const setPresetDetails = (preset: 'info' | 'warning' | 'alert' | 'success' | 'tip' | 'doc') => {
    setBoxPreset(preset);
    if (preset === 'info') {
      setBoxBgColor('#EFF6FF');
      setBoxBorderColor('#1A3B6B');
      setBoxBorderStyle('left');
      setBoxIcon('ℹ️');
      setBoxTitle('중요 안내 사항');
      setBoxContent('여기에 학사 또는 체류 관련 세부 안내 사항을 입력하세요.');
    } else if (preset === 'warning') {
      setBoxBgColor('#FFFBEB');
      setBoxBorderColor('#D97706');
      setBoxBorderStyle('left');
      setBoxIcon('⚠️');
      setBoxTitle('주의 및 유의사항');
      setBoxContent('마감 기한 및 필수 제출 서류 미준수 시 불이익이 발생할 수 있습니다.');
    } else if (preset === 'alert') {
      setBoxBgColor('#FEF2F2');
      setBoxBorderColor('#DC2626');
      setBoxBorderStyle('full');
      setBoxIcon('🚨');
      setBoxTitle('필독 / 절대 금지 사항');
      setBoxContent('불법 취업 및 출석률 80% 미달 시 비자 연장이 제한되거나 취소될 수 있습니다.');
    } else if (preset === 'success') {
      setBoxBgColor('#ECFDF5');
      setBoxBorderColor('#059669');
      setBoxBorderStyle('left');
      setBoxIcon('✅');
      setBoxTitle('확인 및 권장 사항');
      setBoxContent('방문 예약 전 필수 준비 서류 목록을 꼼꼼하게 확인해 주시기 바랍니다.');
    } else if (preset === 'tip') {
      setBoxBgColor('#F5F3FF');
      setBoxBorderColor('#7C3AED');
      setBoxBorderStyle('left');
      setBoxIcon('💡');
      setBoxTitle('신청 꿀팁 & 편의 정보');
      setBoxContent('하이코리아 전자민원으로 신청 시 출입국 방문 없이 수수료를 감면받을 수 있습니다.');
    } else if (preset === 'doc') {
      setBoxBgColor('#F8FAFC');
      setBoxBorderColor('#64748B');
      setBoxBorderStyle('full');
      setBoxIcon('📁');
      setBoxTitle('관련 행정 서식 제출 안내');
      setBoxContent('서식자료실에서 양식을 다운로드하여 작성 후 행정실(동영관 101호)로 제출 바랍니다.');
    }
  };

  const insertConfiguredBox = () => {
    let borderCss = '';
    if (boxBorderStyle === 'left') {
      borderCss = `border-left: 4px solid ${boxBorderColor}; border-top: none; border-right: none; border-bottom: none;`;
    } else if (boxBorderStyle === 'full') {
      borderCss = `border: 1.5px solid ${boxBorderColor};`;
    } else if (boxBorderStyle === 'dashed') {
      borderCss = `border: 1.5px dashed ${boxBorderColor};`;
    } else {
      borderCss = `border: 1px solid ${boxBorderColor}40; box-shadow: 0 2px 8px rgba(0,0,0,0.06);`;
    }

    const boxHtml = `
      <div class="faq-callout-box" data-box-type="${boxPreset}" style="background-color: ${boxBgColor}; ${borderCss} border-radius: ${boxRadius}; padding: 14px 16px; margin: 14px 0; font-size: 13px; line-height: 1.6; transition: all 0.2s ease;">
        ${boxTitle ? `<div style="display: flex; align-items: center; gap: 6px; font-weight: bold; color: ${boxBorderColor}; margin-bottom: 6px; font-size: 13.5px;">${boxIcon ? `<span>${boxIcon}</span>` : ''}<span>${boxTitle}</span></div>` : ''}
        <div style="margin: 0; color: #1e293b;">${boxContent}</div>
      </div>
      <p><br></p>
    `;

    insertCustomHtml(boxHtml);
    setBoxModalOpen(false);
  };

  // 6. File Box Insertion (Requirement 6)
  const handleSelectInlineFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      setPendingFileName(file.name);
      setPendingFileSize(sizeStr);
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      setPendingFileType(ext);

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setPendingFileDataUrl(loadEvent.target?.result as string);
        setFileBoxModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertInlineFileBox = () => {
    if (!pendingFileName || !pendingFileDataUrl) return;

    let badgeBg = '#1A3B6B';
    if (pendingFileType === 'pdf') badgeBg = '#DC2626';
    else if (pendingFileType === 'hwp' || pendingFileType === 'hwpx') badgeBg = '#0284C7';
    else if (pendingFileType === 'docx' || pendingFileType === 'doc') badgeBg = '#2563EB';
    else if (pendingFileType === 'xlsx' || pendingFileType === 'xls') badgeBg = '#16A34A';

    const fileBoxHtml = `
      <div class="faq-inline-file-box" data-file-name="${pendingFileName}" data-file-url="${pendingFileDataUrl}" style="background-color: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; margin: 12px 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: inherit;">
        <div style="display: flex; align-items: center; gap: 10px; min-width: 0;">
          <span style="background-color: ${badgeBg}; color: #ffffff; font-weight: bold; font-size: 10px; padding: 3px 6px; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.5px;">${pendingFileType}</span>
          <div style="min-width: 0;">
            <div style="font-weight: 600; font-size: 13px; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pendingFileName}</div>
            <div style="font-size: 11px; color: #64748B;">파일 크기: ${pendingFileSize}</div>
          </div>
        </div>
        <a href="${pendingFileDataUrl}" download="${pendingFileName}" style="background-color: #1A3B6B; color: #ffffff; font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
          <span>다운로드</span>
        </a>
      </div>
      <p><br></p>
    `;

    insertCustomHtml(fileBoxHtml);
    setFileBoxModalOpen(false);
    setPendingFileName('');
    setPendingFileDataUrl('');
  };

  // 7. Library Document Shortcut Insertion (Requirement 7)
  const insertLibraryDocShortcut = (doc: DocumentItem) => {
    let typeBadgeBg = '#1A3B6B';
    if (doc.fileType === 'pdf') typeBadgeBg = '#DC2626';
    else if (doc.fileType === 'hwp') typeBadgeBg = '#0284C7';
    else if (doc.fileType === 'docx') typeBadgeBg = '#2563EB';
    else if (doc.fileType === 'xlsx') typeBadgeBg = '#16A34A';

    const shortcutHtml = `
      <div class="faq-doc-shortcut-card" data-doc-id="${doc.id}" style="background-color: #F0F5FA; border: 1.5px solid #1A3B6B; border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; flex-direction: column; gap: 8px; font-family: inherit;">
        <div style="display: flex; items-center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="background-color: #1A3B6B; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px;">서식 및 자료실</span>
            <span style="background-color: ${typeBadgeBg}; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${doc.fileType}</span>
            <span style="font-size: 11px; color: #64748B;">[${doc.category}]</span>
          </div>
          <span style="font-size: 11px; color: #64748B; font-weight: 500;">용량: ${doc.fileSize}</span>
        </div>
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <div>
            <div style="font-weight: 700; font-size: 13.5px; color: #0F254A;">📄 ${doc.title}</div>
            ${doc.description ? `<div style="font-size: 11.5px; color: #475569; margin-top: 2px;">${doc.description}</div>` : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <button type="button" class="btn-faq-doc-download" data-doc-id="${doc.id}" style="background-color: #1A3B6B; color: #ffffff; font-size: 12px; font-weight: bold; padding: 6px 14px; border-radius: 5px; border: none; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
              <span>즉시 다운로드</span>
            </button>
            <a href="#downloads" style="background-color: #ffffff; color: #1A3B6B; border: 1px solid #1A3B6B; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              <span>자료실 보기</span>
            </a>
          </div>
        </div>
      </div>
      <p><br></p>
    `;

    insertCustomHtml(shortcutHtml);
    setDocShortcutModalOpen(false);
  };

  // Image Upload Handler
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, GIF, WebP 등)만 업로드할 수 있습니다.');
      return;
    }
    try {
      const optimized = await optimizeImage(file, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
      setImagePreview(optimized);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Insert image into editor
  const insertImageIntoEditor = (src: string, widthPercent: number, align: 'left' | 'center' | 'right') => {
    const marginStyle =
      align === 'center'
        ? 'margin: 12px auto; display: block;'
        : align === 'right'
        ? 'margin: 12px 0 12px auto; display: block;'
        : 'margin: 12px auto 12px 0; display: block;';

    const imgHtml = `
      <img
        src="${src}"
        alt="안내 이미지"
        data-percent="${widthPercent}"
        style="width: ${widthPercent}%; max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #E2E8F0; ${marginStyle} cursor: pointer;"
      /><p><br></p>
    `;

    insertCustomHtml(imgHtml);
    setImageModalOpen(false);
    setImagePreview(null);
    setImageUrlInput('');
  };

  // Image resize & alignment
  const applyImageStyles = (
    widthPercent: number,
    align: 'left' | 'center' | 'right'
  ) => {
    if (!selectedImg) return;
    selectedImg.setAttribute('data-percent', widthPercent.toString());
    selectedImg.style.width = `${widthPercent}%`;
    selectedImg.style.maxWidth = '100%';
    selectedImg.style.height = 'auto';
    selectedImg.style.display = 'block';

    if (align === 'center') {
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = 'auto';
    } else if (align === 'right') {
      selectedImg.style.marginLeft = 'auto';
      selectedImg.style.marginRight = '0';
    } else {
      selectedImg.style.marginLeft = '0';
      selectedImg.style.marginRight = 'auto';
    }
    handleEditorInput();
  };

  const handleSetImageWidth = (percent: number) => {
    setImgWidthPercent(percent);
    applyImageStyles(percent, imgAlign);
  };

  const handleSetImageAlign = (align: 'left' | 'center' | 'right') => {
    setImgAlign(align);
    applyImageStyles(imgWidthPercent, align);
  };

  // Table Insertion
  const insertCustomTable = (
    rows: number,
    cols: number,
    hasHeader: boolean,
    theme: 'navy' | 'gray' | 'clean' | 'green'
  ) => {
    let headerBg = '#1A3B6B';
    let headerColor = '#ffffff';
    let altRowBg = '#F0F5FA';
    let borderColor = '#CBD5E1';

    if (theme === 'gray') {
      headerBg = '#F1F5F9';
      headerColor = '#1E293B';
      altRowBg = '#FAFAFA';
    } else if (theme === 'green') {
      headerBg = '#2E7D5B';
      headerColor = '#ffffff';
      altRowBg = '#F0FDF4';
    } else if (theme === 'clean') {
      headerBg = '#ffffff';
      headerColor = '#1A3B6B';
      altRowBg = '#ffffff';
      borderColor = '#E2E8F0';
    }

    let theadHtml = '';
    if (hasHeader) {
      let thCells = '';
      for (let c = 0; c < cols; c++) {
        const title = c === 0 ? '항목' : c === 1 ? '세부 내용' : `기준 ${c}`;
        thCells += `<th style="padding: 10px 12px; border: 1px solid ${borderColor}; background-color: ${headerBg}; color: ${headerColor}; font-weight: bold; text-align: left;">${title}</th>`;
      }
      theadHtml = `<thead><tr>${thCells}</tr></thead>`;
    }

    let tbodyHtml = '';
    const bodyRowsCount = hasHeader ? rows - 1 : rows;
    for (let r = 0; r < Math.max(1, bodyRowsCount); r++) {
      let tdCells = '';
      const rowBg = r % 2 === 1 && theme !== 'clean' ? altRowBg : '#ffffff';
      for (let c = 0; c < cols; c++) {
        tdCells += `<td style="padding: 9px 12px; border: 1px solid ${borderColor}; background-color: ${rowBg};">&nbsp;</td>`;
      }
      tbodyHtml += `<tr>${tdCells}</tr>`;
    }

    const tableHtml = `
      <div class="table-responsive" style="overflow-x: auto; margin: 14px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; border: 1px solid ${borderColor}; background-color: #ffffff;">
          ${theadHtml}
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>
      <p><br></p>
    `;

    insertCustomHtml(tableHtml);
    setTableModalOpen(false);
  };

  // Table Row & Col operations
  const insertRow = (direction: 'above' | 'below') => {
    if (!selectedCell || !selectedTable) return;
    const row = selectedCell.closest('tr');
    if (!row || !row.parentElement) return;

    const colCount = row.children.length;
    const isHeader = row.parentElement.tagName === 'THEAD';
    const newRow = document.createElement('tr');

    for (let i = 0; i < colCount; i++) {
      const cell = document.createElement(isHeader && direction === 'above' ? 'th' : 'td');
      cell.style.padding = '9px 12px';
      cell.style.border = '1px solid #CBD5E1';
      cell.innerHTML = '&nbsp;';
      newRow.appendChild(cell);
    }

    if (direction === 'above') {
      row.parentElement.insertBefore(newRow, row);
    } else {
      if (row.nextSibling) {
        row.parentElement.insertBefore(newRow, row.nextSibling);
      } else {
        row.parentElement.appendChild(newRow);
      }
    }
    handleEditorInput();
  };

  const deleteCurrentRow = () => {
    if (!selectedCell || !selectedTable) return;
    const row = selectedCell.closest('tr');
    if (!row) return;

    const allRows = selectedTable.querySelectorAll('tr');
    if (allRows.length <= 1) {
      const container = selectedTable.closest('.table-responsive') || selectedTable;
      container.remove();
      setSelectedTable(null);
      setSelectedCell(null);
    } else {
      row.remove();
      setSelectedCell(null);
    }
    handleEditorInput();
  };

  const insertColumn = (direction: 'left' | 'right') => {
    if (!selectedCell || !selectedTable) return;
    const colIndex = selectedCell.cellIndex;
    const rows = selectedTable.querySelectorAll('tr');

    rows.forEach((r) => {
      const isHeaderRow = r.parentElement?.tagName === 'THEAD' || r.querySelector('th') !== null;
      const newCell = document.createElement(isHeaderRow ? 'th' : 'td');
      newCell.style.padding = '9px 12px';
      newCell.style.border = '1px solid #CBD5E1';
      newCell.innerHTML = '&nbsp;';

      if (isHeaderRow && r.children[0]) {
        const sample = r.children[0] as HTMLElement;
        newCell.style.backgroundColor = sample.style.backgroundColor || '#1A3B6B';
        newCell.style.color = sample.style.color || '#ffffff';
        newCell.style.fontWeight = 'bold';
      }

      if (direction === 'left') {
        r.insertBefore(newCell, r.children[colIndex]);
      } else {
        if (r.children[colIndex + 1]) {
          r.insertBefore(newCell, r.children[colIndex + 1]);
        } else {
          r.appendChild(newCell);
        }
      }
    });
    handleEditorInput();
  };

  const deleteCurrentColumn = () => {
    if (!selectedCell || !selectedTable) return;
    const colIndex = selectedCell.cellIndex;
    const rows = selectedTable.querySelectorAll('tr');

    if (rows.length > 0 && rows[0].children.length <= 1) {
      const container = selectedTable.closest('.table-responsive') || selectedTable;
      container.remove();
      setSelectedTable(null);
      setSelectedCell(null);
    } else {
      rows.forEach((r) => {
        if (r.children[colIndex]) {
          r.children[colIndex].remove();
        }
      });
      setSelectedCell(null);
    }
    handleEditorInput();
  };

  // Link insertion
  const openLinkModal = () => {
    const sel = window.getSelection();
    let selectedStr = '';
    if (sel && sel.rangeCount > 0) {
      savedSelectionRange.current = sel.getRangeAt(0).cloneRange();
      selectedStr = sel.toString();
    } else {
      savedSelectionRange.current = null;
    }
    setLinkText(selectedStr);
    setLinkUrl('https://');
    setLinkNewTab(true);
    setLinkModalOpen(true);
  };

  const handleInsertLink = () => {
    if (!linkUrl.trim() || linkUrl.trim() === 'https://') {
      alert('유효한 링크 URL을 입력해 주세요.');
      return;
    }
    const finalUrl = linkUrl.trim().startsWith('http') ? linkUrl.trim() : `https://${linkUrl.trim()}`;
    const displayText = linkText.trim() || finalUrl;
    const targetAttr = linkNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const anchorHtml = `<a href="${finalUrl}"${targetAttr} style="color: #1A3B6B; font-weight: 600; text-decoration: underline;" class="faq-link hover:underline">${displayText}</a>`;

    editorRef.current?.focus();
    if (savedSelectionRange.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelectionRange.current);
    }
    insertCustomHtml(anchorHtml);
    setLinkModalOpen(false);
  };

  // Click handler inside editor (select images, boxes, tables, or cells)
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if clicked a callout box
    const box = target.closest('.faq-callout-box') as HTMLElement | null;
    if (box) {
      setSelectedBoxEl(box);
    } else if (!target.closest('#box-control-bar')) {
      setSelectedBoxEl(null);
    }

    // Check if clicked an image
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImg(img);
      const styleWidth = img.style.width;
      if (styleWidth.endsWith('%')) {
        setImgWidthPercent(parseInt(styleWidth, 10));
      } else {
        setImgWidthPercent(100);
      }
      setSelectedCell(null);
      setSelectedTable(null);
      return;
    }

    if (!target.closest('#image-control-bar')) {
      setSelectedImg(null);
    }

    // Check table cell
    const cell = target.closest('td, th') as HTMLTableCellElement | null;
    const table = target.closest('table') as HTMLTableElement | null;

    if (editorRef.current) {
      editorRef.current.querySelectorAll('.cell-selected').forEach((el) => {
        el.classList.remove('cell-selected');
      });
    }

    if (cell && table) {
      cell.classList.add('cell-selected');
      setSelectedCell(cell);
      setSelectedTable(table);
    } else if (!target.closest('#table-control-bar')) {
      setSelectedCell(null);
      setSelectedTable(null);
    }
  };

  // Keyboard navigation
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        execCmd('outdent');
      } else {
        execCmd('indent');
      }
    }
  };

  // Code view toggle
  const toggleCodeView = () => {
    if (isCodeView) {
      if (editorRef.current) {
        editorRef.current.innerHTML = codeValue;
      }
      onChange(codeValue);
      setIsCodeView(false);
    } else {
      if (editorRef.current) {
        setCodeValue(editorRef.current.innerHTML);
      }
      setIsCodeView(true);
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#1A3B6B] transition-colors">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />
      <input
        type="file"
        ref={inlineDocInputRef}
        className="hidden"
        onChange={handleSelectInlineFile}
      />

      {/* Main Formatting Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex flex-wrap items-center gap-1 text-xs select-none">
        {/* Undo / Redo */}
        <div className="flex items-center border-r border-gray-200 pr-1 mr-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('undo')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="실행 취소 (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('redo')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="다시 실행 (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. 글꼴 선택기 (Requirement 1: 오류 수정 및 다양화) */}
        <div className="flex items-center">
          <select
            value={currentFontFamily}
            onChange={(e) => applyFontFamily(e.target.value)}
            className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 cursor-pointer max-w-[130px] truncate"
            title="글꼴 변경 (본문 기본 고딕, 나눔명조, 고운바탕, 맑은 고딕 등)"
          >
            {FONT_FAMILY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. 글자 크기: 8부터 20까지 1단위 설정 + 헤딩 (Requirement 2) */}
        <div className="flex items-center gap-0.5 bg-white border border-gray-300 rounded px-1 py-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepFontSize(-1)}
            disabled={currentFontSize <= 8}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 cursor-pointer"
            title="글자 크기 1px 축소"
          >
            <Minus className="w-3 h-3" />
          </button>
          <select
            value={currentFontSize}
            onChange={(e) => applyFontSize(parseInt(e.target.value, 10))}
            className="bg-transparent text-[11px] font-bold text-gray-800 text-center cursor-pointer focus:outline-none px-0.5"
            title="글자 크기 (8px~20px 1단위)"
          >
            {FONT_SIZE_OPTIONS.map((sz) => (
              <option key={sz} value={sz}>
                {sz}px {sz === 14 ? '(기본)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleStepFontSize(1)}
            disabled={currentFontSize >= 48}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 disabled:opacity-30 cursor-pointer"
            title="글자 크기 1px 확대"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* 5. 줄 높이 (Line Height) 설정기 (Requirement 5) */}
        <div className="flex items-center">
          <select
            value={currentLineHeight}
            onChange={(e) => applyLineHeight(e.target.value)}
            className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 cursor-pointer"
            title="줄 높이(행간) 설정"
          >
            {LINE_HEIGHT_OPTIONS.map((lh) => (
              <option key={lh.value} value={lh.value}>
                줄간격 {lh.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* Basic Styles: Bold, Italic, Underline, Strike */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('bold')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 font-bold cursor-pointer"
            title="굵게 (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('italic')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 italic cursor-pointer"
            title="기울임 (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('underline')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 underline cursor-pointer"
            title="밑줄 (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('strikeThrough')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 line-through cursor-pointer"
            title="취소선"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* 3. 글자색 드롭다운 (Requirement 3: 글자색 다양화) */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer"
            title="글자 색상 다양화 선택"
          >
            <Type className="w-3.5 h-3.5 text-[#1A3B6B]" />
            <span>글자색</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-xl p-3 w-64 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-gray-100">
                <span className="text-[11px] font-bold text-gray-700">다양한 글자색 선택</span>
                <button
                  type="button"
                  onClick={() => setShowColorPicker(false)}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Categorized Palette */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {TEXT_COLOR_PALETTES.map((grp) => (
                  <div key={grp.group}>
                    <span className="text-[10px] text-gray-400 font-semibold block mb-1">
                      {grp.group}
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {grp.colors.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => applyTextColor(c.value)}
                          className="w-7 h-7 rounded border border-gray-300 hover:scale-110 transition-transform relative group cursor-pointer shadow-2xs"
                          style={{ backgroundColor: c.value }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Color Picker */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-600 font-semibold">스펙트럼 직접 선택:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={customTextColor}
                    onChange={(e) => setCustomTextColor(e.target.value)}
                    className="w-6 h-6 rounded border border-gray-300 cursor-pointer p-0"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyTextColor(customTextColor)}
                    className="px-2 py-0.5 rounded text-[10px] bg-[#1A3B6B] text-white font-bold cursor-pointer"
                  >
                    적용
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 형광펜 (Highlight) Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer"
            title="형광펜 강조 색상"
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>형광펜</span>
            <ChevronDown className="w-2.5 h-2.5 text-gray-400" />
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-xl p-2.5 w-48 animate-fade-in text-xs">
              <span className="text-[10px] text-gray-400 font-semibold px-1 block mb-1.5">형광펜 강조색 선택</span>
              <div className="flex flex-col gap-1">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHighlightColor(c.value)}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left text-xs cursor-pointer"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded border border-gray-300"
                      style={{ backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value }}
                    />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Direct Color Picker */}
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-600 font-semibold">직접 선택:</span>
                <div className="flex items-center gap-1">
                  <input
                    type="color"
                    value={customHighlightColor}
                    onChange={(e) => setCustomHighlightColor(e.target.value)}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer p-0"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyHighlightColor(customHighlightColor)}
                    className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-white font-bold cursor-pointer"
                  >
                    적용
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyLeft')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="왼쪽 정렬"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyCenter')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="가운데 정렬"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('justifyRight')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="오른쪽 정렬"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* Lists & Indents */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertUnorderedList')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="글머리 기호 목록 (•)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertOrderedList')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="번호 매기기 목록 (1, 2, 3...)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('indent')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="들여쓰기 (Tab)"
          >
            <Indent className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('outdent')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="내어쓰기 (Shift+Tab)"
          >
            <Outdent className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* 4. 박스 추가 및 설정 기능 (Requirement 4) */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setPresetDetails('info');
            setBoxModalOpen(true);
          }}
          className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-amber-300"
          title="안내/주의/경고 등 박스 추가 및 배경색/테두리 설정"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-700" />
          <span>박스 추가/설정</span>
        </button>

        {/* 6. 파일 첨부 박스 삽입 (Requirement 6) */}
        <button
          type="button"
          onClick={() => inlineDocInputRef.current?.click()}
          className="px-2 py-1 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-emerald-300"
          title="본문에 직접 파일 다운로드 카드 삽입 (PDF, HWP, DOCX, ZIP 등)"
        >
          <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
          <span>파일 박스 삽입</span>
        </button>

        {/* 7. 서식 및 자료실 바로가기 기능 (Requirement 7) */}
        <button
          type="button"
          onClick={() => setDocShortcutModalOpen(true)}
          className="px-2.5 py-1 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-indigo-300"
          title="서식 및 자료실 게시글 바로가기 및 다운로드 카드 삽입"
        >
          <FolderDown className="w-3.5 h-3.5 text-indigo-700" />
          <span>서식자료실 연동</span>
        </button>

        {/* Table & Link */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setTableModalOpen(true)}
          className="px-2 py-1 bg-blue-50 text-[#1A3B6B] hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-blue-200"
          title="표 삽입 및 크기/테마 설정"
        >
          <TableIcon className="w-3.5 h-3.5 text-[#1A3B6B]" />
          <span>표 삽입</span>
        </button>

        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={openLinkModal}
          className="px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
          title="웹 링크 삽입"
        >
          <LinkIcon className="w-3.5 h-3.5 text-gray-600" />
          <span>링크</span>
        </button>

        {/* PHOTO INSERT */}
        <button
          type="button"
          onClick={() => {
            setImagePreview(null);
            setImageUrlInput('');
            setImageModalOpen(true);
          }}
          className="ml-auto px-2.5 py-1 bg-[#1A3B6B] hover:bg-[#122a4d] text-white rounded text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
          title="사진 파일 또는 웹 이미지 삽입"
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
          <span>사진</span>
        </button>

        {/* Code / HTML toggle */}
        <button
          type="button"
          onClick={toggleCodeView}
          className={`p-1.5 rounded cursor-pointer transition-colors ${
            isCodeView ? 'bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-600'
          }`}
          title={isCodeView ? '서식 편집 모드로 복귀' : 'HTML 소스 코드 보기'}
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* FLOATING BOX CONTROLLER (When a callout box is clicked in editor) */}
      {selectedBoxEl && !isCodeView && (
        <div
          id="box-control-bar"
          className="bg-slate-900 text-white px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>선택된 박스 스타일 변경:</span>
            </span>

            {/* Quick Color Chips */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded border border-slate-700">
              {[
                { bg: '#EFF6FF', border: '#1A3B6B', label: '블루' },
                { bg: '#FFFBEB', border: '#D97706', label: '옐로우' },
                { bg: '#FEF2F2', border: '#DC2626', label: '레드' },
                { bg: '#ECFDF5', border: '#059669', label: '그린' },
                { bg: '#F5F3FF', border: '#7C3AED', label: '퍼플' },
                { bg: '#F8FAFC', border: '#64748B', label: '그레이' },
              ].map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => {
                    if (selectedBoxEl) {
                      selectedBoxEl.style.backgroundColor = c.bg;
                      selectedBoxEl.style.borderColor = c.border;
                      handleEditorInput();
                    }
                  }}
                  className="w-4 h-4 rounded border border-slate-600 hover:scale-125 transition-transform cursor-pointer"
                  style={{ backgroundColor: c.bg }}
                  title={`${c.label} 색상으로 변경`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedBoxEl) {
                  selectedBoxEl.remove();
                  setSelectedBoxEl(null);
                  handleEditorInput();
                }
              }}
              className="px-2 py-0.5 rounded text-[10px] bg-red-900/60 hover:bg-red-800 text-red-200 border border-red-700 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>박스 삭제</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedBoxEl(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING IMAGE CONTROLLER (When an image is clicked) */}
      {selectedImg && !isCodeView && (
        <div
          id="image-control-bar"
          className="bg-slate-900 text-white p-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>선택된 사진 크기:</span>
            </span>
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSetImageWidth(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                    imgWidthPercent === p ? 'bg-[#1A3B6B] text-white font-bold' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onClick={() => handleSetImageAlign('left')}
                className={`p-1 rounded cursor-pointer ${imgAlign === 'left' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'}`}
                title="사진 왼쪽 정렬"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetImageAlign('center')}
                className={`p-1 rounded cursor-pointer ${imgAlign === 'center' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'}`}
                title="사진 가운데 정렬"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetImageAlign('right')}
                className={`p-1 rounded cursor-pointer ${imgAlign === 'right' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'}`}
                title="사진 오른쪽 정렬"
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                selectedImg.remove();
                setSelectedImg(null);
                handleEditorInput();
              }}
              className="p-1 text-red-400 hover:text-red-200 cursor-pointer"
              title="사진 삭제"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedImg(null)}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="relative">
        {isCodeView ? (
          <textarea
            value={codeValue}
            onChange={(e) => {
              setCodeValue(e.target.value);
              onChange(e.target.value);
            }}
            rows={14}
            className="w-full p-4 font-mono text-xs text-green-400 bg-gray-900 leading-relaxed focus:outline-none resize-y"
            placeholder="HTML 소스 코드를 직접 편집할 수 있습니다..."
            style={{ minHeight }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeyDown}
            className="p-4 text-xs text-gray-800 leading-relaxed focus:outline-none overflow-y-auto prose prose-sm max-w-none [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-blue-400 [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}
      </div>

      {/* Editor Footer Status & Shortcut Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-gray-600">
            <span>💡 팁:</span>
            <kbd className="px-1 py-0.2 bg-gray-200 rounded text-[10px]">Ctrl+B</kbd> 굵게,
            <kbd className="px-1 py-0.2 bg-gray-200 rounded text-[10px] ml-1">Ctrl+I</kbd> 기울임,
            <kbd className="px-1 py-0.2 bg-gray-200 rounded text-[10px] ml-1">Tab</kbd> 들여쓰기
          </span>
          <span className="hidden sm:inline text-gray-400">• 박스나 이미지를 클릭하여 실시간 수정할 수 있습니다.</span>
        </div>
        <span className="text-[10px] text-gray-400">
          현재 서식: {currentFontSize}px / 행간 {currentLineHeight}
        </span>
      </div>

      {/* ===================== MODAL 4: BOX CUSTOMIZER MODAL (Requirement 4) ===================== */}
      {boxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-[#1A3B6B]" />
                <span>안내 박스 추가 및 상세 설정</span>
              </h5>
              <button
                type="button"
                onClick={() => setBoxModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="block font-bold text-gray-700 mb-1.5">1. 추천 박스 프리셋 선택:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'info' as const, label: 'ℹ️ 일반 안내', bg: '#EFF6FF', border: '#1A3B6B' },
                  { id: 'warning' as const, label: '⚠️ 주의/유의', bg: '#FFFBEB', border: '#D97706' },
                  { id: 'alert' as const, label: '🚨 중요/경고', bg: '#FEF2F2', border: '#DC2626' },
                  { id: 'success' as const, label: '✅ 확인/권장', bg: '#ECFDF5', border: '#059669' },
                  { id: 'tip' as const, label: '💡 꿀팁/참고', bg: '#F5F3FF', border: '#7C3AED' },
                  { id: 'doc' as const, label: '📁 서식/제출', bg: '#F8FAFC', border: '#64748B' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPresetDetails(p.id)}
                    className={`p-2 rounded border text-left cursor-pointer transition-all flex items-center gap-1.5 ${
                      boxPreset === p.id
                        ? 'border-[#1A3B6B] ring-1 ring-[#1A3B6B] font-bold shadow-2xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ backgroundColor: p.bg }}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.border }} />
                    <span className="text-[11px] truncate text-gray-800">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Settings */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Background color */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">배경 색상:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={boxBgColor}
                      onChange={(e) => setBoxBgColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={boxBgColor}
                      onChange={(e) => setBoxBgColor(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Border color */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">테두리 색상:</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={boxBorderColor}
                      onChange={(e) => setBoxBorderColor(e.target.value)}
                      className="w-8 h-8 rounded border border-gray-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={boxBorderColor}
                      onChange={(e) => setBoxBorderColor(e.target.value)}
                      className="w-24 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Border style */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">테두리 형태:</label>
                  <select
                    value={boxBorderStyle}
                    onChange={(e) => setBoxBorderStyle(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs cursor-pointer"
                  >
                    <option value="left">좌측 굵은 포인트선</option>
                    <option value="full">전체 실선 테두리</option>
                    <option value="dashed">전체 점선 테두리</option>
                    <option value="shadow">그림자 카드 스타일</option>
                  </select>
                </div>

                {/* Corner radius */}
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">모서리 곡률:</label>
                  <select
                    value={boxRadius}
                    onChange={(e) => setBoxRadius(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs cursor-pointer"
                  >
                    <option value="0px">0px (각진 모서리)</option>
                    <option value="6px">6px (기본 둥근 모서리)</option>
                    <option value="12px">12px (부드러운 라운드)</option>
                  </select>
                </div>
              </div>

              {/* Title & Icon */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-1">
                  <label className="block font-semibold text-gray-700 mb-1">아이콘:</label>
                  <select
                    value={boxIcon}
                    onChange={(e) => setBoxIcon(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-gray-300 rounded text-xs cursor-pointer"
                  >
                    <option value="ℹ️">ℹ️ 안내</option>
                    <option value="⚠️">⚠️ 주의</option>
                    <option value="🚨">🚨 경고</option>
                    <option value="✅">✅ 확인</option>
                    <option value="💡">💡 팁</option>
                    <option value="📌">📌 고정</option>
                    <option value="📁">📁 서식</option>
                    <option value="📢">📢 공지</option>
                    <option value="">(없음)</option>
                  </select>
                </div>
                <div className="col-span-3">
                  <label className="block font-semibold text-gray-700 mb-1">박스 상단 제목:</label>
                  <input
                    type="text"
                    value={boxTitle}
                    onChange={(e) => setBoxTitle(e.target.value)}
                    placeholder="예: 중요 안내 사항"
                    className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* Body Content */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">안내 본문 내용:</label>
                <textarea
                  rows={2}
                  value={boxContent}
                  onChange={(e) => setBoxContent(e.target.value)}
                  placeholder="박스 안에 들어갈 세부 안내 문구를 입력하세요..."
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded text-xs resize-none"
                />
              </div>
            </div>

            {/* Live Preview */}
            <div className="mb-4">
              <span className="block text-[11px] font-bold text-gray-600 mb-1.5">실시간 미리보기:</span>
              <div
                style={{
                  backgroundColor: boxBgColor,
                  borderRadius: boxRadius,
                  padding: '12px 14px',
                  boxShadow: boxBorderStyle === 'shadow' ? '0 2px 8px rgba(0,0,0,0.06)' : undefined,
                  ...(boxBorderStyle === 'left'
                    ? {
                        borderTop: 'none',
                        borderRight: 'none',
                        borderBottom: 'none',
                        borderLeft: `4px solid ${boxBorderColor}`,
                      }
                    : boxBorderStyle === 'full'
                    ? {
                        border: `1.5px solid ${boxBorderColor}`,
                      }
                    : boxBorderStyle === 'dashed'
                    ? {
                        border: `1.5px dashed ${boxBorderColor}`,
                      }
                    : {
                        border: `1px solid ${boxBorderColor}40`,
                      }),
                }}
              >
                {boxTitle && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      color: boxBorderColor,
                      marginBottom: '4px',
                    }}
                  >
                    {boxIcon && <span>{boxIcon}</span>}
                    <span>{boxTitle}</span>
                  </div>
                )}
                <div style={{ color: '#1E293B', fontSize: '12px' }}>{boxContent}</div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setBoxModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={insertConfiguredBox}
                className="px-4 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-blue-900 cursor-pointer shadow-xs"
              >
                본문에 박스 삽입하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 6: INLINE FILE BOX INSERTION (Requirement 6) ===================== */}
      {fileBoxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span>본문 파일 다운로드 카드 삽입</span>
              </h5>
              <button
                type="button"
                onClick={() => setFileBoxModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200 mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A3B6B]" />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-gray-900 text-xs truncate">{pendingFileName}</div>
                  <div className="text-[11px] text-gray-500">용량: {pendingFileSize}</div>
                </div>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-4 text-[11.5px]">
              선택한 파일의 직접 다운로드 링크 카드가 본문에 깔끔하게 삽입됩니다. 학생들은 FAQ 답변을 읽으며 바로 클릭하여 다운로드할 수 있습니다.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setFileBoxModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={insertInlineFileBox}
                className="px-4 py-1.5 rounded text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 cursor-pointer shadow-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>본문에 카드 삽입</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL 7: LIBRARY DOCUMENTS SHORTCUT (Requirement 7) ===================== */}
      {docShortcutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-xl w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-3 shrink-0">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <FolderDown className="w-4 h-4 text-indigo-700" />
                <span>서식 및 자료실 연동 바로가기 카드 삽입</span>
              </h5>
              <button
                type="button"
                onClick={() => setDocShortcutModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-gray-600 mb-3 text-[11.5px] shrink-0">
              등록된 공식 행정 서식 중 본 게시글과 관련된 자료를 선택하세요. 본문에 즉시 다운로드 가능한 안내 카드가 삽입됩니다.
            </p>

            {/* Search filter */}
            <div className="relative mb-3 shrink-0">
              <input
                type="text"
                value={docSearchQuery}
                onChange={(e) => setDocSearchQuery(e.target.value)}
                placeholder="서식 제목 또는 카테고리 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded focus:outline-none focus:border-[#1A3B6B]"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {availableDocs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FolderDown className="w-8 h-8 mx-auto text-gray-300 mb-1.5" />
                  <span>현재 등록된 서식 및 자료가 없습니다.</span>
                </div>
              ) : (
                availableDocs
                  .filter((d) => {
                    const q = docSearchQuery.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      (d.title || '').toLowerCase().includes(q) ||
                      (d.category || '').toLowerCase().includes(q)
                    );
                  })
                  .map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 bg-gray-50 hover:bg-blue-50/60 rounded border border-gray-200 hover:border-[#1A3B6B] transition-all flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#1A3B6B] text-white">
                            {doc.fileType.toUpperCase()}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-900">
                            {doc.category}
                          </span>
                          <span className="text-[11px] text-gray-400">{doc.fileSize}</span>
                        </div>
                        <div className="font-bold text-gray-900 text-xs truncate group-hover:text-[#1A3B6B]">
                          {doc.title}
                        </div>
                        {doc.description && (
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">{doc.description}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => insertLibraryDocShortcut(doc)}
                        className="px-3 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-blue-900 shrink-0 cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>본문 삽입</span>
                      </button>
                    </div>
                  ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200 shrink-0 mt-3">
              <button
                type="button"
                onClick={() => setDocShortcutModalOpen(false)}
                className="px-4 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO INSERT MODAL */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#1A3B6B]" />
                <span>답변 본문에 사진 삽입</span>
              </h5>
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-2 font-bold text-center border-b-2 cursor-pointer ${
                  imageTab === 'upload' ? 'border-[#1A3B6B] text-[#1A3B6B]' : 'border-transparent text-gray-500'
                }`}
              >
                내 컴퓨터 파일 업로드
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-2 font-bold text-center border-b-2 cursor-pointer ${
                  imageTab === 'url' ? 'border-[#1A3B6B] text-[#1A3B6B]' : 'border-transparent text-gray-500'
                }`}
              >
                웹 이미지 URL
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#1A3B6B] rounded-lg p-6 text-center bg-gray-50 hover:bg-blue-50/30 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-700 text-xs">클릭하여 사진 파일 선택</p>
                  <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, WebP 이미지 지원</p>
                </div>

                {imagePreview && (
                  <div className="p-2 border border-gray-200 rounded bg-gray-50 text-center">
                    <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded border border-gray-200" />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="url"
                  value={imageUrlInput}
                  onChange={(e) => {
                    setImageUrlInput(e.target.value);
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
                />
              </div>
            )}

            {/* Presets */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-600 font-semibold">삽입 크기:</span>
              <div className="flex gap-1">
                {[25, 50, 75, 100].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInsertWidthPreset(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer ${
                      insertWidthPreset === s ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B]' : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                disabled={!imagePreview && !imageUrlInput}
                onClick={() => {
                  const targetSrc = imagePreview || imageUrlInput;
                  if (targetSrc) {
                    insertImageIntoEditor(targetSrc, insertWidthPreset, insertAlignPreset);
                  }
                }}
                className="px-4 py-1.5 rounded text-xs bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                본문에 사진 삽입
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LINK INSERT MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-indigo-600" />
                <span>웹 링크 삽입 및 설정</span>
              </h5>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">링크 표시 텍스트:</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="예: 하이코리아 전자민원 바로가기"
                  className="w-full px-3 py-1.5 rounded border border-gray-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">이동할 웹 링크 URL:</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://www.hikorea.go.kr"
                  className="w-full px-3 py-1.5 rounded border border-gray-300 font-mono"
                />
              </div>

              <label className="flex items-center gap-2 p-1.5 rounded hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkNewTab}
                  onChange={(e) => setLinkNewTab(e.target.checked)}
                  className="rounded text-[#1A3B6B]"
                />
                <span className="text-gray-700 font-medium">새 창/새 탭에서 열기 (target="_blank")</span>
              </label>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 rounded text-xs bg-[#1A3B6B] hover:bg-blue-900 text-white font-bold cursor-pointer"
              >
                링크 삽입하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE INSERT MODAL */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-scale-in text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-[#1A3B6B]" />
                <span>표(Table) 삽입 및 테마 설정</span>
              </h5>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">행(가로 줄) 수:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableRows}
                    onChange={(e) => setTableRows(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">열(세로 칸) 수:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={tableCols}
                    onChange={(e) => setTableCols(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.target.checked)}
                  className="rounded text-[#1A3B6B]"
                />
                <span className="font-semibold text-gray-800">첫 번째 행을 제목(헤더)으로 지정</span>
              </label>

              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">표 스타일 테마:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'navy' as const, name: 'KMU 네이비', color: '#1A3B6B' },
                    { id: 'gray' as const, name: '모던 그레이', color: '#64748B' },
                    { id: 'green' as const, name: '소프트 그린', color: '#2E7D5B' },
                    { id: 'clean' as const, name: '미니멀 라인', color: '#334155' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTableTheme(t.id)}
                      className={`p-2 rounded border text-left cursor-pointer flex items-center gap-2 ${
                        tableTheme === t.id ? 'border-[#1A3B6B] bg-blue-50 ring-1 ring-[#1A3B6B]' : 'border-gray-200'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                      <span className="font-bold text-xs">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => insertCustomTable(tableRows, tableCols, tableHasHeader, tableTheme)}
                className="px-4 py-1.5 rounded text-xs bg-[#1A3B6B] hover:bg-blue-900 text-white font-bold cursor-pointer"
              >
                본문에 표 삽입하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
