import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Maximize2,
  Minimize2,
  Info,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  X,
  Palette,
  Type,
  Minus,
  Plus,
  ChevronDown,
  Check,
  Indent,
  Outdent,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '답변 내용을 입력하고 서식을 자유롭게 꾸며보세요...',
  minHeight = '280px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [codeValue, setCodeValue] = useState(value);

  // Active / Selected Image State for inline resizing
  const [selectedImg, setSelectedImg] = useState<HTMLImageElement | null>(null);
  const [imgWidthPercent, setImgWidthPercent] = useState<number>(100);
  const [imgAlign, setImgAlign] = useState<'left' | 'center' | 'right'>('center');
  const [imgBorder, setImgBorder] = useState<boolean>(true);
  const [imgRounded, setImgRounded] = useState<string>('rounded-md');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [insertWidthPreset, setInsertWidthPreset] = useState<number>(75);
  const [insertAlignPreset, setInsertAlignPreset] = useState<'left' | 'center' | 'right'>('center');

  // Text color & Highlight pickers
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [fontSize, setFontSize] = useState('3'); // 1 to 7

  // Track if user is dragging an image resize handle
  const isDraggingResize = useRef(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Sync incoming value to editor DOM when value changes externally
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

  // Insert Callout Box
  const insertCallout = (type: 'info' | 'warning' | 'success') => {
    let calloutHtml = '';
    if (type === 'info') {
      calloutHtml = `
        <div style="background-color: #EFF6FF; border-left: 4px solid #1A3B6B; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
          <strong style="color: #1A3B6B; display: block; margin-bottom: 4px;">ℹ️ 중요 안내 사항</strong>
          <p style="margin: 0; color: #1E3A8A; font-size: 13px;">여기에 안내할 세부 내용을 입력하세요.</p>
        </div><p><br></p>
      `;
    } else if (type === 'warning') {
      calloutHtml = `
        <div style="background-color: #FEF3C7; border-left: 4px solid #D97706; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
          <strong style="color: #92400E; display: block; margin-bottom: 4px;">⚠️ 주의 및 유의사항</strong>
          <p style="margin: 0; color: #78350F; font-size: 13px;">마감기한 미준수 시 불이익이 발생할 수 있습니다.</p>
        </div><p><br></p>
      `;
    } else {
      calloutHtml = `
        <div style="background-color: #ECFDF5; border-left: 4px solid #059669; padding: 12px 16px; margin: 12px 0; border-radius: 4px;">
          <strong style="color: #065F46; display: block; margin-bottom: 4px;">✅ 확인 및 권장 사항</strong>
          <p style="margin: 0; color: #047857; font-size: 13px;">제출 전 서류 목록을 꼼꼼히 확인해 주세요.</p>
        </div><p><br></p>
      `;
    }
    insertCustomHtml(calloutHtml);
  };

  // Table insertion modal & settings
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [tableHasHeader, setTableHasHeader] = useState(true);
  const [tableTheme, setTableTheme] = useState<'navy' | 'gray' | 'clean' | 'green'>('navy');

  // Active / Selected Table & Cell State for inline table editing
  const [selectedCell, setSelectedCell] = useState<HTMLTableCellElement | null>(null);
  const [selectedTable, setSelectedTable] = useState<HTMLTableElement | null>(null);
  const [showCellBgPicker, setShowCellBgPicker] = useState(false);
  const [showListTypePicker, setShowListTypePicker] = useState(false);

  // Insert Custom Configured Table
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
      borderColor = '#CBD5E1';
    } else if (theme === 'green') {
      headerBg = '#2E7D5B';
      headerColor = '#ffffff';
      altRowBg = '#F0FDF4';
      borderColor = '#CBD5E1';
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

  // Table Editing Row Operations
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

  // Table Editing Column Operations
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

  // Table Cell Styling Operations
  const setCellBg = (color: string) => {
    if (!selectedCell) return;
    selectedCell.style.backgroundColor = color;
    handleEditorInput();
    setShowCellBgPicker(false);
  };

  const setCellAlignment = (align: 'left' | 'center' | 'right') => {
    if (!selectedCell) return;
    selectedCell.style.textAlign = align;
    handleEditorInput();
  };

  const toggleCellHeader = () => {
    if (!selectedCell) return;
    const isTh = selectedCell.tagName.toLowerCase() === 'th';
    const newCell = document.createElement(isTh ? 'td' : 'th');
    newCell.innerHTML = selectedCell.innerHTML;
    newCell.style.cssText = selectedCell.style.cssText;
    newCell.style.padding = '9px 12px';
    newCell.style.border = '1px solid #CBD5E1';

    if (!isTh) {
      newCell.style.fontWeight = 'bold';
      newCell.style.backgroundColor = '#1A3B6B';
      newCell.style.color = '#ffffff';
    } else {
      newCell.style.fontWeight = 'normal';
      newCell.style.backgroundColor = '#ffffff';
      newCell.style.color = '#1E293B';
    }

    selectedCell.parentElement?.replaceChild(newCell, selectedCell);
    setSelectedCell(newCell);
    handleEditorInput();
  };

  const deleteTable = () => {
    if (!selectedTable) return;
    const container = selectedTable.closest('.table-responsive') || selectedTable;
    container.remove();
    setSelectedTable(null);
    setSelectedCell(null);
    handleEditorInput();
  };

  // List Type Selection Helper
  const applyNumberedList = (type: '1' | 'a' | 'A' | 'i' | 'hangul' | 'circled') => {
    execCmd('insertOrderedList');
    // Find active OL and apply list style
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const parentNode =
        sel.anchorNode.nodeType === 3
          ? sel.anchorNode.parentElement
          : (sel.anchorNode as HTMLElement);
      const ol = parentNode?.closest('ol');
      if (ol) {
        if (type === 'hangul') {
          ol.style.listStyleType = 'hangul';
          ol.setAttribute('data-list-style', 'hangul');
        } else if (type === 'circled') {
          ol.setAttribute('data-list-style', 'circled');
          ol.style.listStyleType = 'decimal-leading-zero';
        } else {
          ol.type = type;
          ol.style.listStyleType =
            type === '1'
              ? 'decimal'
              : type === 'a'
              ? 'lower-alpha'
              : type === 'A'
              ? 'upper-alpha'
              : 'lower-roman';
        }
      }
    }
    setShowListTypePicker(false);
    handleEditorInput();
  };

  // Handle clicks inside editor to select images, tables, and cells
  const handleEditorClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    // Check if clicked an image
    if (target.tagName === 'IMG') {
      const img = target as HTMLImageElement;
      setSelectedImg(img);
      const styleWidth = img.style.width;
      if (styleWidth.endsWith('%')) {
        setImgWidthPercent(parseInt(styleWidth, 10));
      } else if (img.getAttribute('data-percent')) {
        setImgWidthPercent(parseInt(img.getAttribute('data-percent') || '100', 10));
      } else {
        setImgWidthPercent(100);
      }

      if (img.style.margin === '0px auto' || (img.style.marginLeft === 'auto' && img.style.marginRight === 'auto')) {
        setImgAlign('center');
      } else if (img.style.marginLeft === 'auto') {
        setImgAlign('right');
      } else {
        setImgAlign('left');
      }
      setSelectedCell(null);
      setSelectedTable(null);
      return;
    }

    if (!target.closest('#image-control-bar')) {
      setSelectedImg(null);
    }

    // Check if clicked inside a table cell (td or th)
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

  // Keyboard navigation & smart list formatting
  const handleEditorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      // If inside table cell, tab moves to next cell or creates new row
      if (selectedCell && selectedTable) {
        const allCells = Array.from(selectedTable.querySelectorAll('td, th')) as HTMLTableCellElement[];
        const currIdx = allCells.indexOf(selectedCell);

        if (e.shiftKey) {
          if (currIdx > 0) {
            allCells[currIdx - 1].focus();
            allCells.forEach((c) => c.classList.remove('cell-selected'));
            allCells[currIdx - 1].classList.add('cell-selected');
            setSelectedCell(allCells[currIdx - 1]);
          }
        } else {
          if (currIdx < allCells.length - 1) {
            allCells[currIdx + 1].focus();
            allCells.forEach((c) => c.classList.remove('cell-selected'));
            allCells[currIdx + 1].classList.add('cell-selected');
            setSelectedCell(allCells[currIdx + 1]);
          } else {
            // Append new row at table end
            insertRow('below');
            setTimeout(() => {
              const updatedCells = Array.from(selectedTable.querySelectorAll('td, th')) as HTMLTableCellElement[];
              if (updatedCells.length > allCells.length) {
                const newCell = updatedCells[allCells.length];
                newCell.focus();
                allCells.forEach((c) => c.classList.remove('cell-selected'));
                newCell.classList.add('cell-selected');
                setSelectedCell(newCell);
              }
            }, 10);
          }
        }
        return;
      }

      // Normal text / list indent & outdent
      if (e.shiftKey) {
        execCmd('outdent');
      } else {
        execCmd('indent');
      }
    }
  };

  // Update selected image style directly
  const applyImageStyles = (
    widthPercent: number,
    align: 'left' | 'center' | 'right',
    border: boolean,
    rounded: string
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

    selectedImg.style.border = border ? '1px solid #E2E8F0' : 'none';
    selectedImg.style.borderRadius = rounded === 'rounded-xl' ? '12px' : rounded === 'rounded-md' ? '6px' : '0px';

    handleEditorInput();
  };

  // Change image width preset
  const handleSetImageWidth = (percent: number) => {
    setImgWidthPercent(percent);
    applyImageStyles(percent, imgAlign, imgBorder, imgRounded);
  };

  // Change image alignment
  const handleSetImageAlign = (align: 'left' | 'center' | 'right') => {
    setImgAlign(align);
    applyImageStyles(imgWidthPercent, align, imgBorder, imgRounded);
  };

  // Delete selected image
  const handleDeleteSelectedImage = () => {
    if (!selectedImg) return;
    selectedImg.remove();
    setSelectedImg(null);
    handleEditorInput();
  };

  // Mouse Drag Handle for resizing image
  const handleStartResizeDrag = (e: React.MouseEvent) => {
    if (!selectedImg || !editorRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingResize.current = true;
    dragStartX.current = e.clientX;
    dragStartWidth.current = selectedImg.offsetWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingResize.current || !selectedImg || !editorRef.current) return;
      const deltaX = moveEvent.clientX - dragStartX.current;
      const containerWidth = editorRef.current.clientWidth || 600;
      const newPixelWidth = Math.max(100, Math.min(containerWidth, dragStartWidth.current + deltaX));
      const newPercent = Math.round((newPixelWidth / containerWidth) * 100);
      setImgWidthPercent(newPercent);
      applyImageStyles(newPercent, imgAlign, imgBorder, imgRounded);
    };

    const handleMouseUp = () => {
      isDraggingResize.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Insert image function
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

    if (isCodeView) {
      setCodeValue((prev) => prev + '\n' + imgHtml);
      onChange(codeValue + '\n' + imgHtml);
    } else {
      editorRef.current?.focus();
      document.execCommand('insertHTML', false, imgHtml);
      handleEditorInput();
    }

    setImageModalOpen(false);
    setImagePreview(null);
    setImageUrlInput('');
  };

  // File Upload Handler
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, GIF, WebP 등)만 업로드할 수 있습니다.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  // Clipboard Paste Support for Images
  const handleEditorPaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (uploadEvent) => {
            const src = uploadEvent.target?.result as string;
            insertImageIntoEditor(src, 75, 'center');
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  // Drag & Drop Image onto editor
  const handleEditorDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const src = uploadEvent.target?.result as string;
          insertImageIntoEditor(src, 75, 'center');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Code View Toggle
  const toggleCodeView = () => {
    if (isCodeView) {
      // Switching from code to visual
      if (editorRef.current) {
        editorRef.current.innerHTML = codeValue;
      }
      onChange(codeValue);
      setIsCodeView(false);
    } else {
      // Switching from visual to code
      if (editorRef.current) {
        setCodeValue(editorRef.current.innerHTML);
      }
      setIsCodeView(true);
    }
  };

  // Color Palettes
  const textColors = [
    { label: '기본 검정', value: '#111827' },
    { label: 'KMU 남색', value: '#1A3B6B' },
    { label: 'KMU 주황', value: '#D97736' },
    { label: '초록색', value: '#2E7D5B' },
    { label: '빨간색', value: '#DC2626' },
    { label: '파란색', value: '#2563EB' },
    { label: '회색', value: '#6B7280' },
  ];

  const highlightColors = [
    { label: '없음', value: 'transparent' },
    { label: '노랑 형광펜', value: '#FEF08A' },
    { label: '연파랑', value: '#BAE6FD' },
    { label: '연초록', value: '#BBF7D0' },
    { label: '연주황', value: '#FED7AA' },
    { label: '연분홍', value: '#FBCFE8' },
  ];

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#1A3B6B] transition-colors">
      {/* Hidden File Input */}
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

        {/* Heading / Block selector */}
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'p') execCmd('formatBlock', '<p>');
            else if (val === 'h2') execCmd('formatBlock', '<h2>');
            else if (val === 'h3') execCmd('formatBlock', '<h3>');
            else if (val === 'h4') execCmd('formatBlock', '<h4>');
          }}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 cursor-pointer"
          defaultValue="p"
        >
          <option value="p">본문 (기본)</option>
          <option value="h2">제목 1 (대제목)</option>
          <option value="h3">제목 2 (중제목)</option>
          <option value="h4">제목 3 (소제목)</option>
        </select>

        {/* Font Size */}
        <select
          value={fontSize}
          onChange={(e) => {
            setFontSize(e.target.value);
            execCmd('fontSize', e.target.value);
          }}
          className="px-2 py-1 bg-white border border-gray-300 rounded text-[11px] font-medium text-gray-700 cursor-pointer"
        >
          <option value="2">글자 작게 (12px)</option>
          <option value="3">글자 보통 (14px)</option>
          <option value="4">글자 약간 크게 (16px)</option>
          <option value="5">글자 크게 (18px)</option>
        </select>

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

        {/* Text Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
            }}
            className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer"
            title="글자 색상"
          >
            <Type className="w-3.5 h-3.5 text-[#1A3B6B]" />
            <span>글자색</span>
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-lg p-2 flex flex-col gap-1 w-32 animate-fade-in">
              <span className="text-[10px] text-gray-400 font-semibold px-1">글자색 선택</span>
              {textColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execCmd('foreColor', c.value);
                    setShowColorPicker(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left text-xs"
                >
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: c.value }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Dropdown */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
            }}
            className="px-2 py-1 hover:bg-gray-200 rounded flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer"
            title="형광펜 강조"
          >
            <Palette className="w-3.5 h-3.5 text-amber-500" />
            <span>형광펜</span>
          </button>

          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-lg p-2 flex flex-col gap-1 w-32 animate-fade-in">
              <span className="text-[10px] text-gray-400 font-semibold px-1">형광펜 선택</span>
              {highlightColors.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    execCmd('hiliteColor', c.value);
                    setShowHighlightPicker(false);
                  }}
                  className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left text-xs"
                >
                  <span
                    className="w-3 h-3 rounded border border-gray-300"
                    style={{ backgroundColor: c.value === 'transparent' ? '#ffffff' : c.value }}
                  />
                  <span>{c.label}</span>
                </button>
              ))}
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

        {/* Lists, Indentation & Divider */}
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

          {/* Numbered List with Type Dropdown */}
          <div className="relative flex items-center">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyNumberedList('1')}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer flex items-center"
              title="번호 매기기 목록 (1, 2, 3...)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowListTypePicker(!showListTypePicker)}
              className="px-0.5 py-1 hover:bg-gray-200 rounded text-gray-500 cursor-pointer"
              title="번호 매기기 양식 선택 (1., 가., ①, A.)"
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {showListTypePicker && (
              <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-md shadow-lg p-1.5 w-38 flex flex-col gap-1 animate-fade-in">
                <span className="text-[10px] text-gray-400 font-semibold px-2 py-0.5">번호 양식 선택</span>
                {[
                  { label: '1, 2, 3... (숫자)', type: '1' as const },
                  { label: '가, 나, 다... (한글)', type: 'hangul' as const },
                  { label: '①, ②, ③... (원문자)', type: 'circled' as const },
                  { label: 'A, B, C... (영문 대문자)', type: 'A' as const },
                  { label: 'a, b, c... (영문 소문자)', type: 'a' as const },
                  { label: 'I, II, III... (로마자)', type: 'i' as const },
                ].map((item) => (
                  <button
                    key={item.type}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyNumberedList(item.type)}
                    className="flex items-center px-2 py-1 rounded hover:bg-blue-50 hover:text-[#1A3B6B] text-left text-xs transition-colors"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Indent / Outdent for Nested Sub-lists */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('indent')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="들여쓰기 (Tab / 하위 번호 목록)"
          >
            <Indent className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('outdent')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="내어쓰기 (Shift+Tab / 상위 번호 목록)"
          >
            <Outdent className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => execCmd('insertHorizontalRule')}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-700 cursor-pointer"
            title="구분선 삽입"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-gray-200 mx-0.5" />

        {/* Pre-styled Callouts */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertCallout('info')}
            className="px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-blue-200"
            title="파란색 안내 박스 삽입"
          >
            <Info className="w-3 h-3" />
            <span>안내 박스</span>
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => insertCallout('warning')}
            className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer border border-amber-200"
            title="주의/경고 박스 삽입"
          >
            <AlertTriangle className="w-3 h-3" />
            <span>주의 박스</span>
          </button>
        </div>

        {/* Table & Link */}
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setTableModalOpen(true)}
          className="px-2 py-0.5 bg-blue-50 text-[#1A3B6B] hover:bg-blue-100 rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer border border-blue-200"
          title="표 삽입 및 크기/테마 설정"
        >
          <TableIcon className="w-3.5 h-3.5 text-[#1A3B6B]" />
          <span>표 삽입</span>
        </button>

        {/* IMAGE INSERT BUTTON (Highlighted feature) */}
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
          <span>사진 삽입</span>
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

      {/* FLOATING IMAGE CONTROLLER (When an image is clicked in editor) */}
      {selectedImg && !isCodeView && (
        <div
          id="image-control-bar"
          className="bg-slate-900 text-white p-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400 flex items-center gap-1 text-[11px]">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>선택된 사진 크기 & 정렬:</span>
            </span>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              {[
                { label: '25% (작게)', val: 25 },
                { label: '50% (중간)', val: 50 },
                { label: '75% (크게)', val: 75 },
                { label: '100% (가득)', val: 100 },
              ].map((p) => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => handleSetImageWidth(p.val)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                    imgWidthPercent === p.val
                      ? 'bg-[#1A3B6B] text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Slider */}
            <div className="flex items-center gap-1.5 ml-2">
              <input
                type="range"
                min="15"
                max="100"
                value={imgWidthPercent}
                onChange={(e) => handleSetImageWidth(parseInt(e.target.value, 10))}
                className="w-20 cursor-pointer accent-[#D97736]"
              />
              <span className="font-mono text-[11px] text-amber-300 w-8">{imgWidthPercent}%</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Alignment buttons */}
            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onClick={() => handleSetImageAlign('left')}
                className={`p-1 rounded cursor-pointer ${
                  imgAlign === 'left' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="사진 왼쪽 정렬"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetImageAlign('center')}
                className={`p-1 rounded cursor-pointer ${
                  imgAlign === 'center' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="사진 가운데 정렬"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => handleSetImageAlign('right')}
                className={`p-1 rounded cursor-pointer ${
                  imgAlign === 'right' ? 'bg-[#1A3B6B] text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="사진 오른쪽 정렬"
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>

            {/* Border toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !imgBorder;
                setImgBorder(next);
                applyImageStyles(imgWidthPercent, imgAlign, next, imgRounded);
              }}
              className={`px-2 py-0.5 rounded text-[10px] border cursor-pointer ${
                imgBorder
                  ? 'border-blue-400 text-blue-300 bg-blue-950/40'
                  : 'border-slate-700 text-slate-400'
              }`}
            >
              테두리 선
            </button>

            {/* Rounded toggle */}
            <button
              type="button"
              onClick={() => {
                const next = imgRounded === 'rounded-xl' ? 'rounded-none' : imgRounded === 'rounded-md' ? 'rounded-xl' : 'rounded-md';
                setImgRounded(next);
                applyImageStyles(imgWidthPercent, imgAlign, imgBorder, next);
              }}
              className="px-2 py-0.5 rounded text-[10px] border border-slate-700 text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              둥근 모서리
            </button>

            {/* Delete Image */}
            <button
              type="button"
              onClick={handleDeleteSelectedImage}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer ml-1"
              title="사진 삭제"
            >
              <Trash2 className="w-3 h-3" />
              <span>사진 삭제</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING TABLE CONTROLLER (When a table cell is clicked in editor) */}
      {selectedTable && selectedCell && !isCodeView && (
        <div
          id="table-control-bar"
          className="bg-[#1e293b] text-white p-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs shadow-md animate-fade-in"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-amber-300 flex items-center gap-1 text-[11px] mr-1">
              <TableIcon className="w-3.5 h-3.5" />
              <span>
                표 편집 [{(selectedCell.parentElement as HTMLTableRowElement)?.rowIndex + 1}행{' '}
                {selectedCell.cellIndex + 1}열]
              </span>
            </span>

            {/* Row actions */}
            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRow('above')}
                className="px-2 py-0.5 rounded text-[10px] text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                title="선택한 위치 위에 새 행 추가"
              >
                <span>⬆ 행 추가</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertRow('below')}
                className="px-2 py-0.5 rounded text-[10px] text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                title="선택한 위치 아래에 새 행 추가"
              >
                <span>⬇ 행 추가</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={deleteCurrentRow}
                className="px-1.5 py-0.5 rounded text-[10px] text-red-300 hover:bg-red-900/50 cursor-pointer"
                title="현재 행 삭제"
              >
                <span>행 삭제</span>
              </button>
            </div>

            {/* Column actions */}
            <div className="flex items-center gap-0.5 bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertColumn('left')}
                className="px-2 py-0.5 rounded text-[10px] text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                title="선택한 위치 왼쪽에 새 열 추가"
              >
                <span>⬅ 열 추가</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertColumn('right')}
                className="px-2 py-0.5 rounded text-[10px] text-slate-200 hover:text-white hover:bg-slate-700 cursor-pointer flex items-center gap-0.5"
                title="선택한 위치 오른쪽에 새 열 추가"
              >
                <span>➡ 열 추가</span>
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={deleteCurrentColumn}
                className="px-1.5 py-0.5 rounded text-[10px] text-red-300 hover:bg-red-900/50 cursor-pointer"
                title="현재 열 삭제"
              >
                <span>열 삭제</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Cell Background Color */}
            <div className="relative">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowCellBgPicker(!showCellBgPicker)}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 cursor-pointer"
                title="선택 셀 배경색 변경"
              >
                <Palette className="w-3 h-3 text-amber-400" />
                <span>셀 색상</span>
              </button>

              {showCellBgPicker && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white text-gray-800 border border-gray-200 rounded-md shadow-lg p-2 w-36 flex flex-col gap-1">
                  <span className="text-[10px] text-gray-400 font-semibold px-1">셀 배경색</span>
                  {[
                    { label: '기본 (흰색)', color: '#ffffff' },
                    { label: 'KMU 연남색', color: '#EFF6FF' },
                    { label: '연회색', color: '#F1F5F9' },
                    { label: '연노랑', color: '#FEF9C3' },
                    { label: '연초록', color: '#ECFDF5' },
                    { label: '연주황', color: '#FFEDD5' },
                    { label: '진한 남색 (헤더)', color: '#1A3B6B' },
                  ].map((bg) => (
                    <button
                      key={bg.color}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setCellBg(bg.color)}
                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 text-left text-xs"
                    >
                      <span
                        className="w-3 h-3 rounded border border-gray-300 shrink-0"
                        style={{ backgroundColor: bg.color }}
                      />
                      <span className="truncate">{bg.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cell Alignment */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded border border-slate-700">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCellAlignment('left')}
                className="p-1 rounded text-slate-300 hover:text-white cursor-pointer"
                title="셀 내용 좌측 정렬"
              >
                <AlignLeft className="w-3 h-3" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCellAlignment('center')}
                className="p-1 rounded text-slate-300 hover:text-white cursor-pointer"
                title="셀 내용 가운데 정렬"
              >
                <AlignCenter className="w-3 h-3" />
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setCellAlignment('right')}
                className="p-1 rounded text-slate-300 hover:text-white cursor-pointer"
                title="셀 내용 우측 정렬"
              >
                <AlignRight className="w-3 h-3" />
              </button>
            </div>

            {/* Toggle Header Cell */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleCellHeader}
              className="px-2 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 cursor-pointer"
              title="현재 셀을 헤더(th) 또는 일반(td)으로 전환"
            >
              제목 셀 전환
            </button>

            {/* Delete Table */}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteTable}
              className="px-2 py-0.5 rounded text-[10px] bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-1 cursor-pointer ml-1"
              title="표 전체 삭제"
            >
              <Trash2 className="w-3 h-3" />
              <span>표 삭제</span>
            </button>

            {/* Close Bar */}
            <button
              type="button"
              onClick={() => {
                setSelectedCell(null);
                setSelectedTable(null);
              }}
              className="p-1 text-slate-400 hover:text-white cursor-pointer ml-1"
              title="표 편집 닫기"
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
            rows={12}
            className="w-full p-4 font-mono text-xs text-gray-800 bg-gray-900 text-green-400 leading-relaxed focus:outline-none resize-y"
            placeholder="HTML 코드를 직접 입력할 수 있습니다..."
            style={{ minHeight }}
          />
        ) : (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleEditorInput}
            onClick={handleEditorClick}
            onKeyDown={handleEditorKeyDown}
            onPaste={handleEditorPaste}
            onDrop={handleEditorDrop}
            onDragOver={(e) => e.preventDefault()}
            className="p-4 text-xs text-gray-800 leading-relaxed focus:outline-none overflow-y-auto prose prose-sm max-w-none [&_img]:transition-all [&_img:hover]:ring-2 [&_img:hover]:ring-blue-400 [&_table]:border-collapse [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_td]:border [&_td]:border-gray-300 [&_td]:p-2"
            style={{ minHeight }}
            data-placeholder={placeholder}
          />
        )}

        {/* Drag handle overlay when image is selected */}
        {selectedImg && !isCodeView && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: selectedImg.offsetTop,
              left: selectedImg.offsetLeft,
              width: selectedImg.offsetWidth,
              height: selectedImg.offsetHeight,
              border: '2px solid #2563EB',
              borderRadius: '6px',
            }}
          >
            <div
              onMouseDown={handleStartResizeDrag}
              className="absolute -bottom-2 -right-2 w-4 h-4 bg-blue-600 border-2 border-white rounded-full cursor-se-resize pointer-events-auto shadow-md hover:scale-125 transition-transform"
              title="드래그하여 크기 조절"
            />
          </div>
        )}
      </div>

      {/* Editor Footer Help Bar */}
      <div className="bg-gray-50 border-t border-gray-200 px-3 py-1.5 flex flex-wrap items-center justify-between text-[11px] text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-gray-600">
            <span>💡 단축키:</span>
            <kbd className="px-1 py-0.2 bg-gray-200 rounded text-[10px]">Ctrl+B</kbd> 굵게,
            <kbd className="px-1 py-0.2 bg-gray-200 rounded text-[10px] ml-1">Ctrl+I</kbd> 기울임
          </span>
          <span className="hidden sm:inline text-gray-400">• 사진은 복사(Ctrl+V)하거나 드래그하여 바로 넣을 수 있습니다.</span>
        </div>
        <span className="text-[10px] text-gray-400">
          사진을 클릭하면 크기(%) 및 정렬 조절 바가 나타납니다.
        </span>
      </div>

      {/* PHOTO INSERT MODAL */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-md w-full p-5 shadow-2xl border border-gray-200 animate-scale-in">
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

            {/* Tabs: File Upload vs URL */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                type="button"
                onClick={() => setImageTab('upload')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  imageTab === 'upload'
                    ? 'border-[#1A3B6B] text-[#1A3B6B]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                내 컴퓨터에서 사진 선택
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`flex-1 py-2 text-xs font-bold text-center border-b-2 cursor-pointer transition-colors ${
                  imageTab === 'url'
                    ? 'border-[#1A3B6B] text-[#1A3B6B]'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                웹 이미지 주소 (URL)
              </button>
            </div>

            {imageTab === 'upload' ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#1A3B6B] rounded-lg p-6 text-center bg-gray-50 hover:bg-blue-50/30 cursor-pointer transition-all"
                >
                  <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-700 text-xs">
                    클릭하여 사진 파일 선택
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    또는 이미지 파일을 이 영역으로 끌어다 놓으세요 (PNG, JPG, WebP)
                  </p>
                </div>

                {imagePreview && (
                  <div className="p-2 border border-gray-200 rounded bg-gray-50 text-center">
                    <p className="text-[11px] text-gray-500 mb-1.5 font-medium">선택된 사진 미리보기:</p>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-40 mx-auto rounded border border-gray-200 shadow-2xs"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    이미지 URL 입력:
                  </label>
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

                {imageUrlInput && (
                  <div className="p-2 border border-gray-200 rounded bg-gray-50 text-center">
                    <img
                      src={imageUrlInput}
                      alt="Preview"
                      onError={() => setImagePreview(null)}
                      className="max-h-40 mx-auto rounded border border-gray-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Insertion Options: Size & Align */}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  기본 삽입 크기:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: '25% (작게)', val: 25 },
                    { label: '50% (중간)', val: 50 },
                    { label: '75% (기본)', val: 75 },
                    { label: '100% (가득)', val: 100 },
                  ].map((s) => (
                    <button
                      key={s.val}
                      type="button"
                      onClick={() => setInsertWidthPreset(s.val)}
                      className={`py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                        insertWidthPreset === s.val
                          ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  기본 정렬:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: '왼쪽 정렬', val: 'left' as const },
                    { label: '가운데 정렬', val: 'center' as const },
                    { label: '오른쪽 정렬', val: 'right' as const },
                  ].map((a) => (
                    <button
                      key={a.val}
                      type="button"
                      onClick={() => setInsertAlignPreset(a.val)}
                      className={`py-1 rounded text-[10px] font-semibold border cursor-pointer transition-colors ${
                        insertAlignPreset === a.val
                          ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Buttons */}
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
                className="px-4 py-1.5 rounded text-xs bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
              >
                본문에 사진 삽입하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLE INSERT MODAL */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-lg w-full p-5 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <TableIcon className="w-4 h-4 text-[#1A3B6B]" />
                <span>표 삽입 및 서식 설정</span>
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
              {/* Row & Column Controls */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    행 (가로 줄 수)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTableRows(Math.max(1, tableRows - 1))}
                      className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold text-gray-900 w-8 text-center">
                      {tableRows}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTableRows(Math.min(15, tableRows + 1))}
                      className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    열 (세로 칸 수)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTableCols(Math.max(1, tableCols - 1))}
                      className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono text-sm font-bold text-gray-900 w-8 text-center">
                      {tableCols}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTableCols(Math.min(8, tableCols + 1))}
                      className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700 flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-500 mr-1">빠른 크기:</span>
                {[
                  { r: 2, c: 2, label: '2×2' },
                  { r: 3, c: 3, label: '3×3' },
                  { r: 4, c: 3, label: '4×3' },
                  { r: 5, c: 4, label: '5×4' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setTableRows(p.r);
                      setTableCols(p.c);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer transition-colors ${
                      tableRows === p.r && tableCols === p.c
                        ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Header Option */}
              <label className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer border border-gray-100 select-none">
                <input
                  type="checkbox"
                  checked={tableHasHeader}
                  onChange={(e) => setTableHasHeader(e.target.checked)}
                  className="rounded text-[#1A3B6B] focus:ring-[#1A3B6B] cursor-pointer"
                />
                <span className="text-xs font-semibold text-gray-800">
                  첫 번째 행을 제목(헤더)으로 지정
                </span>
              </label>

              {/* Theme Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">
                  표 스타일 테마 선택:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'navy' as const, name: 'KMU 네이비', desc: '국민대 대표 남색 헤더', color: '#1A3B6B' },
                    { id: 'gray' as const, name: '모던 그레이', desc: '단정하고 부드러운 회색', color: '#64748B' },
                    { id: 'green' as const, name: '소프트 그린', desc: '안정적인 녹색 포인트', color: '#2E7D5B' },
                    { id: 'clean' as const, name: '미니멀 라인', desc: '깔끔한 테두리 중심', color: '#334155' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTableTheme(t.id)}
                      className={`p-2.5 rounded border text-left cursor-pointer transition-all ${
                        tableTheme === t.id
                          ? 'border-[#1A3B6B] bg-blue-50/50 ring-1 ring-[#1A3B6B]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="font-bold text-xs text-gray-900">{t.name}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mini Preview Box */}
              <div>
                <span className="block text-[11px] font-semibold text-gray-500 mb-1">미리보기:</span>
                <div className="border border-gray-200 rounded p-2 bg-gray-50 max-h-32 overflow-hidden">
                  <table className="w-full text-[10px] border-collapse bg-white border border-gray-200">
                    {tableHasHeader && (
                      <thead>
                        <tr>
                          {Array.from({ length: tableCols }).map((_, i) => (
                            <th
                              key={i}
                              className="p-1 border border-gray-300 font-bold text-left"
                              style={{
                                backgroundColor:
                                  tableTheme === 'navy'
                                    ? '#1A3B6B'
                                    : tableTheme === 'gray'
                                    ? '#F1F5F9'
                                    : tableTheme === 'green'
                                    ? '#2E7D5B'
                                    : '#ffffff',
                                color:
                                  tableTheme === 'navy' || tableTheme === 'green'
                                    ? '#ffffff'
                                    : '#1E293B',
                              }}
                            >
                              헤더 {i + 1}
                            </th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {Array.from({ length: Math.min(3, tableHasHeader ? tableRows - 1 : tableRows) }).map((_, r) => (
                        <tr key={r}>
                          {Array.from({ length: tableCols }).map((_, c) => (
                            <td key={c} className="p-1 border border-gray-200 text-gray-400">
                              내용
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
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
                className="px-4 py-1.5 rounded text-xs bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold cursor-pointer shadow-2xs"
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
