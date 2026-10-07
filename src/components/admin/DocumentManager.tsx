import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  FileText,
  Download,
  Upload,
  GripVertical,
  Eye,
  EyeOff,
  AlertCircle,
  AlertTriangle,
  X,
  FileCheck,
  Save,
  Sparkles
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, safeSetDoc, handleFirestoreError, OperationType } from '../../firebase';
import { DocumentItem, DocumentFileType } from '../../types';

interface DocumentManagerProps {
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
  documents,
  setDocuments,
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('비자/체류');
  const [description, setDescription] = useState('');
  const [fileType, setFileType] = useState<DocumentFileType>('pdf');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('150 KB');
  const [downloadUrl, setDownloadUrl] = useState('#');
  const [hidden, setHidden] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [uploadedFileNotice, setUploadedFileNotice] = useState<string | null>(null);
  const [autoIntervenedInfo, setAutoIntervenedInfo] = useState<{
    fileName: string;
    fileSize: string;
    fileType: DocumentFileType;
  } | null>(null);

  // Delete & Hide Management Dialog State
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [confirmPermanentTarget, setConfirmPermanentTarget] = useState<DocumentItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Filter out any legacy sample IDs
  useEffect(() => {
    if (!documents || documents.length === 0) return;
    const LEGACY_MOCKS = new Set(['doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6']);
    const legacyItems = documents.filter((d) => d && d.id && LEGACY_MOCKS.has(d.id.toLowerCase()));

    if (legacyItems.length > 0) {
      const validOnly = documents.filter((d) => !legacyItems.includes(d));
      setDocuments(validOnly);
      try {
        localStorage.setItem('kmu_docs_cache', JSON.stringify(validOnly));
      } catch {
        // ignore
      }
      legacyItems.forEach(async (docItem) => {
        if (docItem?.id) {
          try {
            await deleteDoc(doc(db, 'documents', docItem.id));
          } catch {
            // ignore
          }
        }
      });
    }
  }, [documents, setDocuments]);

  const categories = ['all', ...Array.from(new Set(documents.filter((d) => d?.category && d.title?.trim()).map((d) => d.category)))];

  const filteredDocs = (documents || []).filter((d) => {
    if (!d || !d.title || d.title.trim() === '' || !d.fileName || d.fileName.trim() === '') return false;
    if (categoryFilter !== 'all' && d.category !== categoryFilter) return false;
    if (visibilityFilter === 'visible' && d.hidden) return false;
    if (visibilityFilter === 'hidden' && !d.hidden) return false;

    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (d.title?.toLowerCase() || '').includes(q) ||
      (d.category?.toLowerCase() || '').includes(q) ||
      (d.fileName?.toLowerCase() || '').includes(q)
    );
  });

  const hiddenCount = (documents || []).filter((d) => d.hidden).length;

  // Toggle Visibility (학생 숨기기 / 보이기)
  const handleToggleVisibility = async (id: string, newHidden: boolean) => {
    const target = documents.find((d) => d.id === id);
    if (!target) return;

    const timestamp = new Date().toISOString();
    const updated: DocumentItem = {
      ...target,
      hidden: newHidden,
      updatedAt: timestamp,
    };

    const newDocs = documents.map((d) => (d.id === id ? updated : d));
    setDocuments(newDocs);

    try {
      localStorage.setItem('kmu_docs_cache', JSON.stringify(newDocs));
      await safeSetDoc(doc(db, 'documents', id), updated);
    } catch (err) {
      console.warn('Doc visibility update warning:', err);
    }

    if (deleteTarget && deleteTarget.id === id) {
      setDeleteTarget(null);
    }

    showToast(
      newHidden
        ? `'${target.title}' 서식을 학생들에게 비노출(숨김) 처리했습니다.`
        : `'${target.title}' 서식을 학생들에게 다시 정상 노출합니다.`
    );
  };

  // Permanent Delete
  const handlePermanentDelete = async (id: string) => {
    const target = documents.find((d) => d.id === id);
    const targetTitle = target?.title || '해당 서식';

    const newDocs = documents.filter((d) => d.id !== id);
    setDocuments(newDocs);

    try {
      localStorage.setItem('kmu_docs_cache', JSON.stringify(newDocs));
      await deleteDoc(doc(db, 'documents', id));
    } catch (fbErr) {
      console.warn('Doc remote delete warning:', fbErr);
    }

    setDeleteTarget(null);
    setConfirmPermanentTarget(null);
    showToast(`'${targetTitle}' 서식이 영구 삭제되었습니다.`);
  };

  // Drag and drop ordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', index.toString());
    } catch {
      // ignore
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const draggedDoc = filteredDocs[draggedIndex];
    const targetDoc = filteredDocs[targetIndex];

    const fromIdx = documents.findIndex((d) => d.id === draggedDoc.id);
    const toIdx = documents.findIndex((d) => d.id === targetDoc.id);

    if (fromIdx < 0 || toIdx < 0) return;

    const newDocs = [...documents];
    const [removed] = newDocs.splice(fromIdx, 1);
    newDocs.splice(toIdx, 0, removed);

    await applyReorder(newDocs);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveStep = async (docItem: DocumentItem, direction: 'up' | 'down') => {
    const currentIndex = documents.findIndex((d) => d.id === docItem.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= documents.length) return;

    const newDocs = [...documents];
    const temp = newDocs[currentIndex];
    newDocs[currentIndex] = newDocs[targetIndex];
    newDocs[targetIndex] = temp;

    await applyReorder(newDocs);
  };

  const applyReorder = async (reordered: DocumentItem[]) => {
    const updated = reordered.map((item, idx) => ({ ...item, order: idx }));
    setDocuments(updated);
    showToast('서식 목록 순서가 성공적으로 변경되었습니다.');

    try {
      localStorage.setItem('kmu_docs_cache', JSON.stringify(updated));
      for (const item of updated) {
        await safeSetDoc(doc(db, 'documents', item.id), { order: item.order }, { merge: true });
      }
    } catch (err) {
      console.warn('Remote sync order failed, saved locally:', err);
    }
  };

  // Open modal
  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('비자/체류');
    setDescription('');
    setFileType('pdf');
    setFileName('');
    setFileSize('');
    setDownloadUrl('#');
    setHidden(false);
    setUploadedFileNotice(null);
    setAutoIntervenedInfo(null);
    setIsEditing(true);
  };

  const openEditModal = (d: DocumentItem) => {
    setEditingId(d.id);
    setTitle(d.title);
    setCategory(d.category);
    setDescription(d.description);
    setFileType(d.fileType);
    setFileName(d.fileName);
    setFileSize(d.fileSize);
    setDownloadUrl(d.downloadUrl);
    setHidden(d.hidden || false);
    setUploadedFileNotice(d.downloadUrl && d.downloadUrl !== '#' ? `현재 등록된 파일: ${d.fileName}` : null);
    setAutoIntervenedInfo(null);
    setIsEditing(true);
  };

  // File Upload Handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processSelectedFile(files[0]);
  };

  const processSelectedFile = (file: File) => {
    // 1. Format size automatically
    const sizeInKb = file.size / 1024;
    const formattedSize =
      sizeInKb >= 1024
        ? `${(sizeInKb / 1024).toFixed(1)} MB`
        : `${Math.round(sizeInKb)} KB`;

    // 2. Detect type automatically
    const lowerName = file.name.toLowerCase();
    let detectedType: DocumentFileType = 'pdf';
    if (lowerName.endsWith('.hwp') || lowerName.endsWith('.hwpx')) detectedType = 'hwp';
    else if (lowerName.endsWith('.docx') || lowerName.endsWith('.doc')) detectedType = 'docx';
    else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) detectedType = 'xlsx';

    // 3. Automatically intervene: Set name & size & type
    setFileName(file.name);
    setFileSize(formattedSize);
    setFileType(detectedType);
    setAutoIntervenedInfo({
      fileName: file.name,
      fileSize: formattedSize,
      fileType: detectedType,
    });

    if (!title.trim()) {
      // Suggest title from file name without extension
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName);
    }

    // 4. Read file as base64 data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setDownloadUrl(dataUrl);
        setUploadedFileNotice(`✓ 파일 업로드 및 자동 분석 완료: ${file.name} (${formattedSize})`);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automatically detect file format when filename is changed or typed
  const handleFileNameChange = (val: string) => {
    setFileName(val);
    const lower = val.trim().toLowerCase();
    if (lower.endsWith('.hwp') || lower.endsWith('.hwpx')) {
      setFileType('hwp');
    } else if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      setFileType('docx');
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) {
      setFileType('xlsx');
    } else if (lower.endsWith('.pdf')) {
      setFileType('pdf');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim()) {
      showToast('서식 명칭과 파일명을 모두 입력하거나 파일을 업로드해 주세요.');
      return;
    }

    const id = editingId || `doc-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const payload: DocumentItem = {
      id,
      category: category.trim(),
      title: title.trim(),
      description: description.trim(),
      fileType,
      fileName: fileName.trim(),
      fileSize: fileSize.trim() || '100 KB',
      downloadUrl: downloadUrl.trim() || '#',
      hidden,
      createdAt: editingId ? documents.find((d) => d.id === editingId)?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
    };

    // 1. Immediately update in-memory state and localStorage
    let nextDocs: DocumentItem[] = [];
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.id === id);
      if (idx >= 0) {
        nextDocs = [...prev];
        nextDocs[idx] = payload;
      } else {
        nextDocs = [payload, ...prev];
      }
      try {
        localStorage.setItem('kmu_docs_cache', JSON.stringify(nextDocs));
      } catch {
        // ignore
      }
      return nextDocs;
    });

    // 2. Persist to Firestore with safeSetDoc
    try {
      await safeSetDoc(doc(db, 'documents', id), payload);
      showToast('서식이 안전하게 등록/수정되었습니다.');
    } catch (fbErr) {
      console.warn('Document firestore sync note:', fbErr);
      handleFirestoreError(fbErr, OperationType.WRITE, `documents/${id}`);
      showToast('서식이 안전하게 저장되었습니다 (로컬 캐시 반영 완료).');
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs">
      {/* Toast Alert */}
      {alertMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1A3B6B]" />
              <span>서식 및 자료실 파일 관리</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              총 {documents.length}개
            </span>
            {hiddenCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                {hiddenCount}개 숨김
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            유학생 신청서, 서약서 등 실제 다운로드 가능한 서식 파일을 업로드하고 관리합니다.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-[#122a4d] transition-colors shadow-xs self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>새 서식 등록 (파일 업로드)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat === 'all' ? '전체 서식' : cat}
              </button>
            ))}
          </div>

          {/* Visibility Filter */}
          <select
            value={visibilityFilter}
            onChange={(e) => setVisibilityFilter(e.target.value as any)}
            className="px-2.5 py-1 rounded border border-gray-200 text-xs bg-gray-50 text-gray-700 font-medium"
          >
            <option value="all">전체 상태 (노출+숨김)</option>
            <option value="visible">학생에게 노출 중</option>
            <option value="hidden">학생에게 숨김 ({hiddenCount}개)</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="서식명 또는 파일명 검색..."
            className="w-full pl-8 pr-7 py-1.5 text-xs bg-gray-50 rounded border border-gray-200 focus:outline-hidden focus:bg-white focus:border-[#1A3B6B]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Document Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-md">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
              <th className="py-2.5 px-2 w-14 text-center">순서</th>
              <th className="py-2.5 px-3 w-28">카테고리</th>
              <th className="py-2.5 px-3">서식명 및 파일</th>
              <th className="py-2.5 px-3 w-20 text-center">형식</th>
              <th className="py-2.5 px-3 w-24 text-center">용량</th>
              <th className="py-2.5 px-3 w-28 text-center">상태 / 관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  등록된 서식이 없습니다.
                </td>
              </tr>
            ) : (
              filteredDocs.map((docItem, index) => {
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <tr
                    key={docItem.id}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`transition-colors ${
                      isDragging
                        ? 'opacity-40 bg-gray-100'
                        : isOver
                        ? 'border-t-2 border-[#1A3B6B] bg-blue-50/60'
                        : docItem.hidden
                        ? 'bg-amber-50/25 hover:bg-amber-50/40'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    {/* Drag Handle & Up/Down buttons */}
                    <td className="py-2 px-2 text-center select-none">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnd={handleDragEnd}
                          className="p-1 rounded text-gray-400 hover:text-gray-800 hover:bg-gray-200 cursor-grab active:cursor-grabbing transition-colors"
                          title="드래그하여 순서 변경"
                        >
                          <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col -space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleMoveStep(docItem, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-[9px] text-gray-400 hover:text-[#1A3B6B] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            title="위로 이동"
                            aria-label="위로 이동"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(docItem, 'down')}
                            disabled={index === filteredDocs.length - 1}
                            className="p-0.5 text-[9px] text-gray-400 hover:text-[#1A3B6B] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            title="아래로 이동"
                            aria-label="아래로 이동"
                          >
                            ▼
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
                        {docItem.category}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{docItem.title}</span>
                        {docItem.hidden && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                            <EyeOff className="w-3 h-3 text-amber-700" />
                            학생 숨김
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-[11px] font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{docItem.fileName}</span>
                        {docItem.downloadUrl && docItem.downloadUrl !== '#' && (
                          <a
                            href={docItem.downloadUrl}
                            download={docItem.fileName}
                            className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10px]"
                            title="다운로드 테스트"
                          >
                            <Download className="w-3 h-3" />
                            <span>다운로드</span>
                          </a>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {docItem.fileType}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                      {docItem.fileSize}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* 1-click Visibility Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(docItem.id, !docItem.hidden)}
                          className={`p-1.5 rounded transition-colors cursor-pointer border ${
                            docItem.hidden
                              ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent'
                          }`}
                          title={docItem.hidden ? '학생에게 보이기 (현재 숨김 상태)' : '학생에게 숨기기 (현재 노출 중)'}
                        >
                          {docItem.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => openEditModal(docItem)}
                          className="p-1.5 text-gray-500 hover:text-[#1A3B6B] hover:bg-gray-100 rounded cursor-pointer"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteTarget(docItem)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                          title="삭제 또는 학생 숨김"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== DIALOG 1: DOCUMENT SAFE DELETE & HIDE ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>서식 삭제 및 학생 숨김 관리</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <div className="font-bold text-gray-900 text-sm">{deleteTarget.title}</div>
                <div className="text-[11px] text-gray-500 font-mono mt-1">
                  파일명: {deleteTarget.fileName} ({deleteTarget.fileSize})
                </div>
                {deleteTarget.hidden && (
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">
                    현재 학생 포털에서 숨김 처리된 상태입니다.
                  </div>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                해당 서식을 완전히 삭제하시겠습니까, 아니면 학생들이 보지 못하도록 일시적으로 숨기시겠습니까?
              </p>

              {/* Action 1: Hide from students */}
              <button
                type="button"
                onClick={() => handleToggleVisibility(deleteTarget.id, !deleteTarget.hidden)}
                className="w-full text-left p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100/80 transition-all flex items-start gap-3 cursor-pointer group"
              >
                {deleteTarget.hidden ? (
                  <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                ) : (
                  <EyeOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                )}
                <div>
                  <div className="font-bold text-amber-900 text-xs sm:text-sm">
                    {deleteTarget.hidden ? '학생 포털에 다시 보이기 (숨김 해제)' : '학생에게만 숨기기 (권장)'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {deleteTarget.hidden
                      ? '서식 자료실에 다시 정상적으로 노출합니다.'
                      : '데이터를 삭제하지 않고 서식 자료실에서만 즉시 감춥니다. 언제든 다시 보이게 복원할 수 있습니다.'}
                  </div>
                </div>
              </button>

              {/* Action 2: Trigger Second Confirmation */}
              <button
                type="button"
                onClick={() => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  setConfirmPermanentTarget(target);
                }}
                className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-red-800 text-xs sm:text-sm">
                    영구 삭제
                  </div>
                  <div className="text-[11px] text-red-600 mt-0.5">
                    데이터베이스 및 목록에서 완전히 삭제하며 복구할 수 없습니다.
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== DIALOG 2: DOCUMENT PERMANENT DELETE DOUBLE CONFIRMATION ===================== */}
      {confirmPermanentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 sm:p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-2.5 text-red-600 mb-3 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>영구 삭제 재확인</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              정말 <strong className="text-gray-900 font-bold">'{confirmPermanentTarget.title}'</strong> 서식을 영구 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-semibold block mt-1">※ 삭제된 데이터는 복구할 수 없습니다.</span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmPermanentTarget(null)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handlePermanentDelete(confirmPermanentTarget.id)}
                className="px-3.5 py-1.5 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>영구 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT DOCUMENT WITH FILE UPLOAD ===================== */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-lg w-full p-6 border border-[#E2E5E8] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#1A3B6B]" />
                <span>{editingId ? '서식 수정' : '새 서식 등록'}</span>
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              {/* FILE UPLOAD DROPZONE */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#1A3B6B]" />
                  <span>서식 파일 업로드 (PC에서 파일 선택)</span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.hwp,.docx,.doc,.xlsx,.xls,.zip"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processSelectedFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-gray-300 hover:border-[#1A3B6B] hover:bg-blue-50/30 p-4 rounded-lg text-center cursor-pointer transition-all group"
                >
                  <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1A3B6B] mx-auto mb-2 transition-colors" />
                  <p className="font-bold text-gray-800 text-xs">
                    클릭하여 파일을 선택하거나 여기로 드래그하세요
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">
                    지원 포맷: PDF, HWP, DOCX, XLSX, ZIP (업로드 시 용량 및 포맷 자동 감지)
                  </p>
                </div>

                {uploadedFileNotice && (
                  <div className="mt-2 p-2 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{uploadedFileNotice}</span>
                  </div>
                )}

                {/* Automatic Intervention Feedback Card */}
                {autoIntervenedInfo && (
                  <div className="mt-2.5 p-3 bg-blue-50/80 border border-blue-200 rounded-md text-xs text-blue-900 animate-in fade-in duration-150">
                    <div className="flex items-center gap-1.5 font-bold mb-1.5 text-[#1A3B6B]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>서식 파일 자동 개입 완료</span>
                      <span className="text-[10px] font-normal text-gray-500">(파일명, 용량, 포맷이 자동으로 추출 및 반영되었습니다)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-white p-2 rounded border border-blue-100">
                      <div>
                        <span className="text-gray-500 block text-[10px]">다운로드 파일명</span>
                        <span className="font-mono font-bold text-gray-900 truncate block">{autoIntervenedInfo.fileName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">감지된 파일 크기</span>
                        <span className="font-bold text-gray-900 block">{autoIntervenedInfo.fileSize}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block text-[10px]">인식된 파일 포맷</span>
                        <span className="font-bold text-[#1A3B6B] uppercase block">{autoIntervenedInfo.fileType} 문서</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  서식 명칭 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 체류기간 연장허가 신청서"
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                />
              </div>

              {/* Category & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    카테고리 구분
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="예: 비자/체류, 기숙사, 학사"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>파일 포맷</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      자동 감지
                    </span>
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as DocumentFileType)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  >
                    <option value="pdf">PDF 문서</option>
                    <option value="hwp">한글 (HWP/HWPX)</option>
                    <option value="docx">워드 (DOCX/DOC)</option>
                    <option value="xlsx">엑셀 (XLSX/XLS)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  서식 설명
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="유학생 제출 시 주의사항 및 용도 설명"
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                />
              </div>

              {/* File details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>다운로드 파일명 <span className="text-red-500">*</span></span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      자동 개입
                    </span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fileName}
                    onChange={(e) => handleFileNameChange(e.target.value)}
                    placeholder="stay_extension_form.pdf"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1 flex items-center justify-between">
                    <span>파일 크기</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      자동 계산
                    </span>
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="예: 240 KB"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 text-xs"
                  />
                </div>
              </div>

              {/* Hide from students toggle */}
              <div className="p-3 rounded bg-amber-50/70 border border-amber-200">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hidden}
                    onChange={(e) => setHidden(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-900 flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                      학생 포털에서 숨기기 (임시 비노출)
                    </span>
                    <span className="text-[11px] text-amber-700 block mt-0.5">
                      체크하면 학생 서식 자료실에서 보이지 않으며, 관리자 모드에서만 확인 및 복원할 수 있습니다.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100 border border-gray-300 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>저장 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
