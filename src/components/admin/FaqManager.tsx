import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Pin,
  Search,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  GripVertical,
  AlertTriangle,
  Tags,
  ChevronUp,
  ChevronDown,
  X,
  Save,
  HelpCircle,
  GraduationCap,
  Building2,
  FileText,
  Compass,
  CreditCard,
  HeartHandshake,
  Layers,
  Paperclip,
  Download,
  FolderDown,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, safeSetDoc, handleFirestoreError, OperationType } from '../../firebase';
import { FaqItem, FaqCategory, CategoryItem, Language, DocumentItem, FaqAttachment } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RichTextEditor } from './RichTextEditor';
import { optimizeImage } from '../../services/imageOptimizer';
import { matchCategory, STANDARD_CATEGORY_NAMES, translateText } from '../../services/translator';
import { triggerAttachmentDownload, triggerDocumentDownload } from '../../services/downloadHelper';
import { markItemAsDeleted } from '../../services/deletedTracker';

interface FaqManagerProps {
  faqs: FaqItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
  documents?: DocumentItem[];
}

import { CATEGORY_ICON_OPTIONS, renderCategoryIcon } from '../../constants/categoryIcons';

export const FaqManager: React.FC<FaqManagerProps> = ({ faqs, setFaqs, documents = [] }) => {
  const { user } = useAuth();
  const { config, updateConfig } = useTheme();

  // Top Tabs: FAQ list vs Category Management
  const [activeTab, setActiveTab] = useState<'faqs' | 'categories'>('faqs');

  // FAQ List States
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // FAQ Modal / Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FaqCategory>('attendance');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [attachments, setAttachments] = useState<FaqAttachment[]>([]);
  const [relatedDocumentIds, setRelatedDocumentIds] = useState<string[]>([]);
  const faqAttachmentInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Modal Expansion State (Requirement 5)
  const [isModalExpanded, setIsModalExpanded] = useState(false);

  // Administrative Document Search & Linkage State (Requirements 2, 3)
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [isDocSearchOpen, setIsDocSearchOpen] = useState(false);

  // Delete & Hide Management Dialog State
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
  const [confirmPermanentTarget, setConfirmPermanentTarget] = useState<FaqItem | null>(null);

  // Category Management States
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [catId, setCatId] = useState('');
  const [catNameKo, setCatNameKo] = useState('');
  const [catIcon, setCatIcon] = useState('HelpCircle');
  const [deleteCatTarget, setDeleteCatTarget] = useState<CategoryItem | null>(null);

  const categories = config.categories || [];

  const showToast = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  // Filtered FAQs (Safe: preserves all registered posts without filtering empty title/content)
  const filteredFaqs = (faqs || []).filter((faq) => {
    if (!faq) return false;

    const matchesCat = categoryFilter === 'all' || matchCategory(faq.category, categoryFilter);
    if (!matchesCat) return false;
    if (visibilityFilter === 'visible' && faq.hidden) return false;
    if (visibilityFilter === 'hidden' && !faq.hidden) return false;
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (faq.title?.toLowerCase() || '').includes(q) ||
      (faq.content?.toLowerCase() || '').includes(q)
    );
  });

  const hiddenCount = (faqs || []).filter((f) => f.hidden).length;

  // Toggle Visibility (학생 숨기기 / 보이기)
  const handleToggleVisibility = async (id: string, newHidden: boolean) => {
    const target = faqs.find((f) => f.id === id);
    if (!target) return;

    const timestamp = new Date().toISOString();
    const updated: FaqItem = {
      ...target,
      hidden: newHidden,
      updatedAt: timestamp,
    };

    const newFaqs = faqs.map((f) => (f.id === id ? updated : f));
    setFaqs(newFaqs);

    try {
      localStorage.setItem('kmu_faqs_cache', JSON.stringify(newFaqs));
      await safeSetDoc(doc(db, 'faqs', id), updated);
    } catch (err) {
      console.warn('Faq visibility update warning:', err);
    }

    if (deleteTarget && deleteTarget.id === id) {
      setDeleteTarget(null);
    }

    showToast(
      newHidden
        ? `'${target.title}' FAQ 항목을 학생들에게 비노출(숨김) 처리했습니다.`
        : `'${target.title}' FAQ 항목을 학생들에게 다시 정상 노출합니다.`
    );
  };

  // Permanent Delete
  const handlePermanentDelete = async (id: string) => {
    const target = faqs.find((f) => f.id === id);
    const targetTitle = target?.title || '해당 FAQ';

    markItemAsDeleted(id);
    const newFaqs = faqs.filter((f) => f.id !== id);
    setFaqs(newFaqs);
    setDeleteTarget(null);
    setConfirmPermanentTarget(null);

    try {
      localStorage.setItem('kmu_faqs_cache', JSON.stringify(newFaqs));
      await deleteDoc(doc(db, 'faqs', id));
      showToast(`'${targetTitle}' FAQ 항목이 영구 삭제되었습니다.`);
    } catch (fbErr) {
      console.warn('Faq remote delete warning:', fbErr);
      showToast(`'${targetTitle}' FAQ 항목이 삭제되었습니다.`);
    }
  };

  // Reorder Drag & Drop
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

    const draggedItem = filteredFaqs[draggedIndex];
    const targetItem = filteredFaqs[targetIndex];

    const fromIdx = faqs.findIndex((f) => f.id === draggedItem.id);
    const toIdx = faqs.findIndex((f) => f.id === targetItem.id);

    if (fromIdx < 0 || toIdx < 0) return;

    const newFaqs = [...faqs];
    const [removed] = newFaqs.splice(fromIdx, 1);
    newFaqs.splice(toIdx, 0, removed);

    await applyReorder(newFaqs);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleMoveStep = async (item: FaqItem, direction: 'up' | 'down') => {
    const currentIndex = faqs.findIndex((f) => f.id === item.id);
    if (currentIndex < 0) return;
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= faqs.length) return;

    const newFaqs = [...faqs];
    const temp = newFaqs[currentIndex];
    newFaqs[currentIndex] = newFaqs[targetIndex];
    newFaqs[targetIndex] = temp;

    await applyReorder(newFaqs);
  };

  const applyReorder = async (reordered: FaqItem[]) => {
    const updated = reordered.map((item, idx) => ({ ...item, order: idx }));
    setFaqs(updated);
    showToast('질문 목록 순서가 성공적으로 변경되었습니다.');

    try {
      localStorage.setItem('kmu_faqs_cache', JSON.stringify(updated));
      await Promise.all(
        updated.map((item) =>
          safeSetDoc(doc(db, 'faqs', item.id), { order: item.order }, { merge: true })
        )
      );
    } catch (err) {
      console.warn('Remote sync order failed, saved locally:', err);
    }
  };

  // Modal Open
  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory(categories[0]?.id as any || 'attendance');
    setContent('<p>안내할 내용을 입력해 주세요.</p>');
    setPinned(false);
    setHidden(false);
    setImageUrl('');
    setAttachments([]);
    setRelatedDocumentIds([]);
    setDocSearchQuery('');
    setIsDocSearchOpen(false);
    setIsModalExpanded(false);
    setIsEditing(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingId(faq.id);
    setTitle(faq.title);
    setCategory(faq.category);
    setContent(faq.content);
    setPinned(faq.pinned);
    setHidden(faq.hidden || false);
    setImageUrl(faq.imageUrl || '');
    setAttachments(faq.attachments || []);
    setRelatedDocumentIds(faq.relatedDocumentIds || []);
    setDocSearchQuery('');
    setIsDocSearchOpen(false);
    setIsModalExpanded(false);
    setIsEditing(true);
  };

  // Filtered documents for modal search
  const searchedDocuments = (documents || []).filter((doc) => {
    if (!docSearchQuery.trim()) return true;
    const q = docSearchQuery.toLowerCase();
    return (
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.category && doc.category.toLowerCase().includes(q)) ||
      (doc.description && doc.description.toLowerCase().includes(q)) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
      (doc.fileType && doc.fileType.toLowerCase().includes(q))
    );
  });

  // Attachment and Document Helpers
  const handleUploadAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const dataUrl = loadEvt.target?.result as string;
        const newAtt: FaqAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: sizeStr,
          url: dataUrl,
          type: ext,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });
    showToast(`${files.length}개 파일이 첨부되었습니다.`);
  };

  // Requirement 1: 파일 다운로드 카드 삭제 기능
  const handleRemoveAttachment = (attId: string) => {
    const targetAtt = attachments.find((a) => a.id === attId);
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
    if (targetAtt) {
      setContent((prev) => {
        const div = document.createElement('div');
        div.innerHTML = prev;
        const matchingCards = div.querySelectorAll(`.faq-inline-file-box[data-file-name="${targetAtt.name}"]`);
        matchingCards.forEach((c) => c.remove());
        return div.innerHTML;
      });
      showToast(`'${targetAtt.name}' 파일 및 다운로드 카드가 삭제되었습니다.`);
    } else {
      showToast('첨부파일이 제거되었습니다.');
    }
  };

  const handleInsertAttachmentToContent = (att: FaqAttachment) => {
    let badgeBg = '#1A3B6B';
    const ext = (att.type || '').toLowerCase();
    if (ext === 'pdf') badgeBg = '#DC2626';
    else if (ext === 'hwp' || ext === 'hwpx') badgeBg = '#0284C7';
    else if (ext === 'docx' || ext === 'doc') badgeBg = '#2563EB';
    else if (ext === 'xlsx' || ext === 'xls') badgeBg = '#16A34A';

    const fileHtml = `
      <div class="faq-inline-file-box" data-file-name="${att.name}" data-file-url="${att.url}" draggable="true" style="background-color: #F8FAFC; border: 1.5px solid #CBD5E1; border-radius: 8px; padding: 12px 16px; margin: 12px 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-family: inherit; position: relative;">
        <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
          <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 600; color: #64748B; background: #E2E8F0; padding: 2px 6px; border-radius: 4px; cursor: grab; user-select: none;">
            <span>⠿</span>
            <button type="button" class="btn-block-move-up" title="위로 이동" style="background: none; border: none; cursor: pointer; color: #475569; padding: 0 2px; font-size: 10px;">▲</button>
            <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: none; border: none; cursor: pointer; color: #475569; padding: 0 2px; font-size: 10px;">▼</button>
          </div>
          <span style="background-color: ${badgeBg}; color: #ffffff; font-weight: bold; font-size: 10px; padding: 3px 6px; border-radius: 4px; text-transform: uppercase;">${ext}</span>
          <div style="min-width: 0;">
            <div style="font-weight: 600; font-size: 13px; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${att.name}</div>
            <div style="font-size: 11px; color: #64748B;">용량: ${att.size}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 6px;">
          <a href="${att.url}" download="${att.name}" style="background-color: #1A3B6B; color: #ffffff; font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer; white-space: nowrap;">
            <span>다운로드</span>
          </a>
          <button type="button" class="btn-delete-inline-file" title="파일 다운로드 카드 삭제" style="background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 5px; padding: 5px 8px; font-size: 11px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
            <span>삭제 ✕</span>
          </button>
        </div>
      </div>
      <p><br></p>
    `;
    setContent((prev) => prev + '\n' + fileHtml);
    showToast(`'${att.name}' 다운로드 카드가 본문에 삽입되었습니다.`);
  };

  const handleToggleRelatedDocument = (docId: string) => {
    const isCurrentlyLinked = relatedDocumentIds.includes(docId);
    if (isCurrentlyLinked) {
      handleRemoveRelatedDocument(docId);
    } else {
      setRelatedDocumentIds((prev) => [...prev, docId]);
      const docItem = (documents || []).find((d) => d.id === docId);
      showToast(`'${docItem?.title || '서식'}' 행정 서식이 연동되었습니다.`);
    }
  };

  // Requirement 2: 서식 자료실 연동 삭제 기능
  const handleRemoveRelatedDocument = (docId: string) => {
    const docItem = (documents || []).find((d) => d.id === docId);
    setRelatedDocumentIds((prev) => prev.filter((id) => id !== docId));
    setContent((prev) => {
      const div = document.createElement('div');
      div.innerHTML = prev;
      const matchingCards = div.querySelectorAll(`.faq-doc-shortcut-card[data-doc-id="${docId}"]`);
      matchingCards.forEach((c) => c.remove());
      return div.innerHTML;
    });
    showToast(`'${docItem?.title || '서식'}' 서식 자료실 연동 및 카드가 삭제되었습니다.`);
  };

  // Requirement 3: 서식 및 자료실 바로가기 및 즉시 다운로드 연동 본문 카드 삽입
  const handleInsertDocToContent = (doc: DocumentItem) => {
    let typeBadgeBg = '#1A3B6B';
    if (doc.fileType === 'pdf') typeBadgeBg = '#DC2626';
    else if (doc.fileType === 'hwp') typeBadgeBg = '#0284C7';
    else if (doc.fileType === 'docx') typeBadgeBg = '#2563EB';
    else if (doc.fileType === 'xlsx') typeBadgeBg = '#16A34A';

    const shortcutHtml = `
      <div class="faq-doc-shortcut-card" data-doc-id="${doc.id}" draggable="true" style="background-color: #F0F5FA; border: 1.5px solid #1A3B6B; border-radius: 8px; padding: 14px 18px; margin: 14px 0; display: flex; flex-direction: column; gap: 8px; font-family: inherit; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="block-drag-handle" draggable="true" title="잡고 드래그하여 이동" style="display: inline-flex; align-items: center; gap: 2px; font-size: 11px; font-weight: 600; color: #1A3B6B; background: #DBEAFE; padding: 2px 6px; border-radius: 4px; cursor: grab; user-select: none;">
              <span>⠿</span>
              <button type="button" class="btn-block-move-up" title="위로 이동" style="background: none; border: none; cursor: pointer; color: #1E40AF; padding: 0 2px; font-size: 10px;">▲</button>
              <button type="button" class="btn-block-move-down" title="아래로 이동" style="background: none; border: none; cursor: pointer; color: #1E40AF; padding: 0 2px; font-size: 10px;">▼</button>
            </div>
            <span style="background-color: #1A3B6B; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 7px; border-radius: 4px;">서식 및 자료실</span>
            <span style="background-color: ${typeBadgeBg}; color: #ffffff; font-size: 10px; font-weight: bold; padding: 2px 6px; border-radius: 4px; text-transform: uppercase;">${doc.fileType}</span>
            <span style="font-size: 11px; color: #64748B;">[${doc.category}]</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #64748B; font-weight: 500;">용량: ${doc.fileSize}</span>
            <button type="button" class="btn-delete-doc-shortcut" data-doc-id="${doc.id}" title="서식자료실 연동 카드 삭제" style="background-color: #FEE2E2; color: #DC2626; border: 1px solid #FCA5A5; border-radius: 4px; padding: 3px 7px; font-size: 10.5px; font-weight: bold; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
              <span>연동 삭제 ✕</span>
            </button>
          </div>
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
            <a href="#downloads" class="btn-faq-doc-navigate" style="background-color: #ffffff; color: #1A3B6B; border: 1px solid #1A3B6B; font-size: 12px; font-weight: 600; padding: 5px 10px; border-radius: 5px; text-decoration: none; display: inline-flex; align-items: center; gap: 4px; cursor: pointer;">
              <span>자료실 보기</span>
            </a>
          </div>
        </div>
      </div>
      <p><br></p>
    `;
    setContent((prev) => prev + '\n' + shortcutHtml);
    if (!relatedDocumentIds.includes(doc.id)) {
      setRelatedDocumentIds((prev) => [...prev, doc.id]);
    }
    showToast(`'${doc.title}' 서식 바로가기 카드가 본문에 삽입되었습니다.`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      showToast('FAQ 제목을 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const id = editingId || `faq-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Fast image optimization if image is provided as data URL
    let finalImageUrl = imageUrl.trim();
    if (finalImageUrl.startsWith('data:image')) {
      try {
        finalImageUrl = await optimizeImage(finalImageUrl, { maxWidth: 1200, maxHeight: 1200, quality: 0.82 });
      } catch {
        // use as-is
      }
    }

    const faqPayload: FaqItem = {
      id,
      category,
      title: cleanTitle,
      content: content.trim() || '<p>안내 내용</p>',
      pinned,
      hidden,
      views: editingId ? faqs.find((f) => f.id === editingId)?.views || 100 : 0,
      imageUrl: finalImageUrl || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
      relatedDocumentIds: relatedDocumentIds.length > 0 ? relatedDocumentIds : undefined,
      createdAt: editingId ? faqs.find((f) => f.id === editingId)?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
      authorId: user?.uid || 'admin',
    };

    // 1. Instant optimistic state update and local cache persistence
    let nextList: FaqItem[] = [];
    setFaqs((prev) => {
      const idx = prev.findIndex((f) => f.id === id);
      if (idx >= 0) {
        nextList = [...prev];
        nextList[idx] = faqPayload;
      } else {
        nextList = [faqPayload, ...prev];
      }
      try {
        localStorage.setItem('kmu_faqs_cache', JSON.stringify(nextList));
      } catch {
        // ignore
      }
      return nextList;
    });

    // Close modal immediately for lightning-fast responsiveness
    setIsEditing(false);
    setIsSubmitting(false);
    showToast('FAQ가 신속하고 안전하게 등록/저장되었습니다.');

    // 2. High-speed concurrent Firestore persistence in background
    safeSetDoc(doc(db, 'faqs', id), faqPayload)
      .then(() => {
        // Done
      })
      .catch((fbErr) => {
        console.warn('Firestore sync note:', fbErr);
        handleFirestoreError(fbErr, OperationType.WRITE, `faqs/${id}`);
      });
  };

  const handleTogglePin = async (faq: FaqItem) => {
    const updated = { ...faq, pinned: !faq.pinned, updatedAt: new Date().toISOString() };
    const nextFaqs = faqs.map((f) => (f.id === faq.id ? updated : f));
    setFaqs(nextFaqs);
    try {
      localStorage.setItem('kmu_faqs_cache', JSON.stringify(nextFaqs));
      await safeSetDoc(doc(db, 'faqs', faq.id), updated);
    } catch (fbErr) {
      console.warn('Toggle pin note:', fbErr);
    }
  };

  // Category Handlers
  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCatId('');
    setCatNameKo('');
    setCatIcon('HelpCircle');
    setIsAddingCategory(true);
  };

  const handleOpenEditCategory = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setCatId(cat.id);
    setCatNameKo(cat.name.ko || '');
    setCatIcon(cat.icon || 'HelpCircle');
    setIsAddingCategory(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catId.trim() || !catNameKo.trim()) {
      showToast('카테고리 ID와 한국어 명칭을 입력해 주세요.');
      return;
    }

    const cleanId = catId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const cleanKo = catNameKo.trim();

    const nameTranslations: CategoryItem['name'] = {
      ko: cleanKo,
    };
    if (STANDARD_CATEGORY_NAMES[cleanId]) {
      nameTranslations.en = STANDARD_CATEGORY_NAMES[cleanId].en;
      nameTranslations.vi = STANDARD_CATEGORY_NAMES[cleanId].vi;
      nameTranslations.zh = STANDARD_CATEGORY_NAMES[cleanId].zh;
      nameTranslations.mn = STANDARD_CATEGORY_NAMES[cleanId].mn;
    } else {
      nameTranslations.en = editingCategory?.name?.en && editingCategory.name.en !== editingCategory.name.ko ? editingCategory.name.en : cleanKo;
      nameTranslations.vi = editingCategory?.name?.vi && editingCategory.name.vi !== editingCategory.name.ko ? editingCategory.name.vi : cleanKo;
      nameTranslations.zh = editingCategory?.name?.zh && editingCategory.name.zh !== editingCategory.name.ko ? editingCategory.name.zh : cleanKo;
      nameTranslations.mn = editingCategory?.name?.mn && editingCategory.name.mn !== editingCategory.name.ko ? editingCategory.name.mn : cleanKo;

      try {
        const [en, vi, zh, mn] = await Promise.all([
          translateText(cleanKo, 'en'),
          translateText(cleanKo, 'vi'),
          translateText(cleanKo, 'zh'),
          translateText(cleanKo, 'mn'),
        ]);
        if (en && en !== cleanKo) nameTranslations.en = en;
        if (vi && vi !== cleanKo) nameTranslations.vi = vi;
        if (zh && zh !== cleanKo) nameTranslations.zh = zh;
        if (mn && mn !== cleanKo) nameTranslations.mn = mn;
      } catch {
        // keep fallback
      }
    }

    const newCategory: CategoryItem = {
      id: cleanId,
      name: nameTranslations,
      icon: catIcon,
    };

    let updatedList: CategoryItem[] = [];
    if (editingCategory) {
      updatedList = categories.map((c) => (c.id === editingCategory.id ? newCategory : c));
    } else {
      if (categories.some((c) => c.id === cleanId)) {
        showToast('이미 존재하는 카테고리 ID입니다. 다른 ID를 입력해 주세요.');
        return;
      }
      updatedList = [...categories, newCategory];
    }

    await updateConfig({ categories: updatedList });
    setIsAddingCategory(false);
    showToast(editingCategory ? '카테고리가 성공적으로 수정되었습니다.' : '새 카테고리가 등록되었습니다.');
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    const count = faqs.filter((f) => f.category === cat.id).length;
    if (count > 0) {
      showToast(`이 카테고리를 사용하는 FAQ가 ${count}개 있습니다. 먼저 FAQ의 카테고리를 변경해 주세요.`);
      return;
    }
    const updated = categories.filter((c) => c.id !== cat.id);
    await updateConfig({ categories: updated });
    setDeleteCatTarget(null);
    showToast(`'${cat.name.ko}' 카테고리가 삭제되었습니다.`);
  };

  const handleMoveCategory = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;
    const list = [...categories];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    await updateConfig({ categories: list });
    showToast('카테고리 순서가 변경되었습니다.');
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

      {/* Main Top Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('faqs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'faqs'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>FAQ 게시글 관리 ({faqs.length})</span>
            {hiddenCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
                {hiddenCount}개 숨김
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'categories'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Tags className="w-4 h-4 text-amber-500" />
            <span>카테고리 분류 관리 ({categories.length})</span>
          </button>
        </div>

        {activeTab === 'faqs' ? (
          <button
            onClick={openNewModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-[#122a4d] transition-colors shadow-xs self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 FAQ 작성</span>
          </button>
        ) : (
          <button
            onClick={handleOpenAddCategory}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#2E7D5B] hover:bg-[#256348] transition-colors shadow-xs self-start sm:self-center cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>새 카테고리 추가</span>
          </button>
        )}
      </div>

      {/* ===================== TAB 1: FAQ LIST ===================== */}
      {activeTab === 'faqs' && (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Category Filter */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 text-xs rounded border transition-colors cursor-pointer ${
                    categoryFilter === 'all'
                      ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  전체 분류
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id as any)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap cursor-pointer ${
                      categoryFilter === cat.id
                        ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {cat.name.ko || cat.id}
                  </button>
                ))}
              </div>

              {/* Visibility Filter (노출 / 숨김) */}
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

            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="FAQ 제목 또는 내용 검색..."
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

          {/* FAQ Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
                  <th className="py-2.5 px-2 w-14 text-center">순서</th>
                  <th className="py-2.5 px-3 w-14 text-center">고정</th>
                  <th className="py-2.5 px-3 w-28">카테고리</th>
                  <th className="py-2.5 px-3">질문 제목 및 상태</th>
                  <th className="py-2.5 px-3 w-28 text-center">수정일</th>
                  <th className="py-2.5 px-3 w-28 text-center">상태 / 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFaqs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      해당 조건의 FAQ가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const isDragging = draggedIndex === index;
                    const isOver = dragOverIndex === index;

                    return (
                      <tr
                        key={faq.id}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`transition-colors ${
                          isDragging
                            ? 'opacity-40 bg-gray-100'
                            : isOver
                            ? 'border-t-2 border-[#1A3B6B] bg-blue-50/60'
                            : faq.hidden
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
                                onClick={() => handleMoveStep(faq, 'up')}
                                disabled={index === 0}
                                className="p-0.5 text-[9px] text-gray-400 hover:text-[#1A3B6B] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="위로 이동"
                                aria-label="위로 이동"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveStep(faq, 'down')}
                                disabled={index === filteredFaqs.length - 1}
                                className="p-0.5 text-[9px] text-gray-400 hover:text-[#1A3B6B] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="아래로 이동"
                                aria-label="아래로 이동"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Pin Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleTogglePin(faq)}
                            title={faq.pinned ? '상단 고정 해제' : '상단 공지로 고정'}
                            className={`p-1 rounded transition-colors cursor-pointer ${
                              faq.pinned
                                ? 'text-[#D97736] bg-[#D97736]/10'
                                : 'text-gray-300 hover:text-gray-500'
                            }`}
                          >
                            <Pin className="w-4 h-4 fill-current" />
                          </button>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-[#1A3B6B]">
                            {categories.find((c) => c.id === faq.category)?.name.ko || faq.category}
                          </span>
                        </td>

                        {/* Title & Badges */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-gray-900 flex items-center gap-1.5 flex-wrap">
                            {faq.pinned && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#D97736] text-white">
                                공지
                              </span>
                            )}
                            {faq.hidden && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                <EyeOff className="w-3 h-3 text-amber-700" />
                                학생 숨김
                              </span>
                            )}
                            <span>{faq.title || '(제목 없음)'}</span>
                          </div>
                        </td>

                        {/* Updated date */}
                        <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                          {new Date(faq.updatedAt).toLocaleDateString('ko-KR')}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* 1-click Visibility Toggle Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(faq.id, !faq.hidden)}
                              className={`p-1.5 rounded transition-colors cursor-pointer border ${
                                faq.hidden
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent'
                              }`}
                              title={faq.hidden ? '학생에게 보이기 (현재 숨김 상태)' : '학생에게 숨기기 (현재 노출 중)'}
                            >
                              {faq.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(faq)}
                              className="p-1.5 text-gray-500 hover:text-[#1A3B6B] hover:bg-gray-100 rounded cursor-pointer"
                              title="수정"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Trigger Button */}
                            <button
                              onClick={() => setDeleteTarget(faq)}
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
        </div>
      )}

      {/* ===================== TAB 2: CATEGORY MANAGEMENT ===================== */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="p-3 bg-blue-50/70 rounded-md border border-blue-200 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2">
              <Tags className="w-4 h-4 text-[#1A3B6B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-900 block">카테고리 통합 관리</span>
                <p className="text-gray-600 mt-0.5">
                  FAQ 분류 탭 및 학생 포털의 카테고리 태그를 등록, 수정, 순서 변경할 수 있습니다.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="px-3 py-1.5 rounded bg-[#2E7D5B] text-white font-bold hover:bg-[#256348] transition-colors shrink-0 shadow-xs flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>카테고리 추가</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <tr>
                  <th className="py-2.5 px-3 w-16 text-center">순서</th>
                  <th className="py-2.5 px-3 w-20 text-center">아이콘</th>
                  <th className="py-2.5 px-3 w-36">카테고리 ID</th>
                  <th className="py-2.5 px-3">카테고리 명칭 (한국어)</th>
                  <th className="py-2.5 px-3 w-24 text-center">연결 FAQ</th>
                  <th className="py-2.5 px-3 w-28 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((cat, idx) => {
                  const faqCount = faqs.filter((f) => f.category === cat.id).length;
                  return (
                    <tr key={cat.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 'up')}
                            disabled={idx === 0}
                            className="p-0.5 text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer"
                            title="위로 이동"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(idx, 'down')}
                            disabled={idx === categories.length - 1}
                            className="p-0.5 text-gray-400 hover:text-gray-800 disabled:opacity-20 cursor-pointer"
                            title="아래로 이동"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-blue-50 text-[#1A3B6B]">
                          {renderCategoryIcon(cat.icon)}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-gray-700">
                        {cat.id}
                      </td>

                      <td className="py-2.5 px-3 font-bold text-gray-900">
                        {cat.name.ko}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                          {faqCount}개
                        </span>
                      </td>

                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditCategory(cat)}
                            className="p-1.5 text-gray-500 hover:text-[#1A3B6B] hover:bg-gray-100 rounded cursor-pointer"
                            title="카테고리 수정"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteCatTarget(cat)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="카테고리 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== DIALOG 1: FAQ SAFE DELETE & HIDE ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>FAQ 삭제 및 학생 숨김 관리</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <div className="font-bold text-gray-900 text-sm">{deleteTarget.title}</div>
                <div className="text-[11px] text-gray-500 mt-1">
                  카테고리: {categories.find((c) => c.id === deleteTarget.category)?.name.ko || deleteTarget.category}
                </div>
                {deleteTarget.hidden && (
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">
                    현재 학생 포털에서 숨김 처리된 상태입니다.
                  </div>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                해당 FAQ를 완전히 삭제하시겠습니까, 아니면 학생들이 보지 못하도록 일시적으로 숨기시겠습니까?
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
                      ? 'FAQ 목록에 다시 정상적으로 노출합니다.'
                      : '데이터를 삭제하지 않고 학생 화면에서만 즉시 감춥니다. 언제든 다시 보이게 복원할 수 있습니다.'}
                  </div>
                </div>
              </button>

              {/* Action 2: Permanent Delete */}
              <button
                type="button"
                onClick={() => handlePermanentDelete(deleteTarget.id)}
                className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-red-800 text-xs sm:text-sm flex items-center gap-1.5">
                    <span>영구 삭제</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-200 text-red-900 rounded font-normal">복구 불가</span>
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

      {/* ===================== DIALOG 2: FAQ PERMANENT DELETE DOUBLE CONFIRMATION ===================== */}
      {confirmPermanentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 sm:p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 mb-3 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>영구 삭제 재확인</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              정말 <strong className="text-gray-900 font-bold">'{confirmPermanentTarget.title}'</strong> FAQ 항목을 영구 삭제하시겠습니까?
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

      {/* ===================== DIALOG: CATEGORY DELETE CONFIRMATION ===================== */}
      {deleteCatTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 border border-gray-200">
            <div className="flex items-center gap-2 text-gray-900 font-bold text-sm mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>카테고리 삭제 확인</span>
            </div>
            <p className="text-xs text-gray-600 mb-4 leading-relaxed">
              정말 <strong className="text-gray-900 font-bold">'{deleteCatTarget.name.ko}'</strong> 카테고리를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCatTarget(null)}
                className="px-3 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCategory(deleteCatTarget)}
                className="px-3 py-1.5 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT CATEGORY ===================== */}
      {isAddingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 border border-gray-200 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Tags className="w-4 h-4 text-[#1A3B6B]" />
                <span>{editingCategory ? '카테고리 수정' : '새 카테고리 추가'}</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  카테고리 고유 ID (영문, 필수) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingCategory}
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  placeholder="예: scholarship, housing, visa"
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B] disabled:bg-gray-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  한국어 명칭 (필수) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catNameKo}
                  onChange={(e) => setCatNameKo(e.target.value)}
                  placeholder="예: 장학금/등록금"
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">카테고리 아이콘</label>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 border border-gray-200 rounded-md bg-gray-50/50">
                  {CATEGORY_ICON_OPTIONS.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setCatIcon(item.id)}
                        className={`p-2 rounded border flex flex-col items-center gap-1 cursor-pointer transition-all ${
                          catIcon === item.id
                            ? 'border-[#1A3B6B] bg-blue-50 text-[#1A3B6B] font-bold ring-1 ring-[#1A3B6B]'
                            : 'border-gray-200 hover:bg-white bg-white text-gray-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span className="text-[10px] truncate w-full text-center">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-blue-900 cursor-pointer shadow-xs"
                >
                  저장하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE / EDIT FAQ ===================== */}
      {isEditing && (
        <div className={`fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-xs transition-all ${
          isModalExpanded ? 'p-0' : 'p-3 sm:p-4'
        }`}>
          <div className={`bg-white border border-[#E2E5E8] shadow-2xl flex flex-col transition-all ${
            isModalExpanded
              ? 'w-full h-full max-w-none max-h-none rounded-none p-4 sm:p-6'
              : 'rounded-lg max-w-4xl w-full p-5 sm:p-6 max-h-[94vh]'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-gray-900">
                  {editingId ? 'FAQ 수정' : '새 FAQ 작성'}
                </h4>
                {isModalExpanded ? (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-[#1A3B6B] text-[11px] font-bold border border-blue-200">
                    전체화면 확장 모드 (넓은 화면에서 작성 중)
                  </span>
                ) : (
                  <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                    (서식 작성 및 행정 서식/파일 연동)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Expand / Collapse Button (Requirement 5) */}
                <button
                  type="button"
                  onClick={() => setIsModalExpanded((prev) => !prev)}
                  className="px-2.5 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                  title={isModalExpanded ? '기본 창 크기로 축소' : '더 큰 화면에서 작성하기 (편집창 전체 확장)'}
                >
                  {isModalExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5 text-[#1A3B6B]" />}
                  <span className="hidden sm:inline">{isModalExpanded ? '창 축소' : '편집창 전체 확장'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
                  title="닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs flex-1 min-h-0 overflow-y-auto pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    카테고리 선택
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FaqCategory)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.ko || cat.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded text-[#1A3B6B]"
                    />
                    <span className="font-semibold text-gray-800">
                      상단 중요 공지로 고정 (Pinned)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  질문 제목 (Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: D-4 체류기간 연장 필요 서류 및 방문 예약 방법"
                  className="w-full px-3 py-2 rounded border border-gray-300 font-medium"
                />
              </div>

              {/* Rich WYSIWYG Editor */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                  <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>답변 본문 내용</span>
                    <span className="text-red-500">*</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      (서식 편집, 글꼴 다양화, 안내 박스, 파일/서식 카드, 표, 드래그 앤 드롭 이동 및 삭제 지원)
                    </span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                      ⠿ 드래그 앤 드롭 이동 및 삭제 지원
                    </span>
                    <span className="text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 font-medium hidden sm:inline">
                      ↕ 본문 스크롤바 지원
                    </span>
                  </div>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="답변 내용을 자유롭게 작성하세요..."
                  minHeight={isModalExpanded ? '380px' : '280px'}
                  maxHeight={isModalExpanded ? '600px' : '450px'}
                  documents={documents}
                />
              </div>

              {/* Requirement 3: 서식 및 자료실 바로가기 및 즉시 다운로드 연동 */}
              <div className="p-3.5 rounded-lg border border-indigo-200 bg-indigo-50/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <label className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                      <FolderDown className="w-4 h-4 text-indigo-700" />
                      <span>서식 자료실 연동 관리 (관련 서식 바로가기 & 즉시 다운로드)</span>
                    </label>
                    <p className="text-[11px] text-indigo-800 mt-0.5">
                      기존에 등록된 행정 서식 목록을 검색하고 연동할 수 있습니다. 학생 화면에 ‘관련 서식 및 자료실 바로가기’ 카드가 표시되어, 게시글을 읽으며 해당 서식을 즉시 다운로드하거나 자료실 탭으로 바로 이동할 수 있습니다.
                    </p>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold shrink-0 self-start sm:self-auto">
                    현재 연동 서식: {relatedDocumentIds.length}개
                  </span>
                </div>

                {/* Search existing admin documents to link */}
                <div className="space-y-2 mb-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      placeholder="연동할 행정 서식명, 구분, 파일명 검색 (예: D-4, 체류, 시간제취업)..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded border border-indigo-200 text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    {docSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setDocSearchQuery('')}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown/Box when searching */}
                  {docSearchQuery.trim() && (
                    <div className="max-h-48 overflow-y-auto bg-white border border-indigo-200 rounded-md p-2 space-y-1 shadow-sm">
                      <div className="text-[11px] font-semibold text-gray-500 px-1 pb-1 border-b border-gray-100 flex items-center justify-between">
                        <span>검색된 행정 서식 ({searchedDocuments.length}건)</span>
                        <span className="text-[10px] text-indigo-600">클릭하여 연동 추가</span>
                      </div>
                      {searchedDocuments.length === 0 ? (
                        <div className="py-3 text-center text-gray-400 text-xs">
                          일치하는 행정 서식이 없습니다.
                        </div>
                      ) : (
                        searchedDocuments.map((doc) => {
                          const isLinked = relatedDocumentIds.includes(doc.id);
                          return (
                            <div
                              key={doc.id}
                              className={`p-2 rounded border flex items-center justify-between gap-2 transition-colors ${
                                isLinked ? 'bg-indigo-50/70 border-indigo-300' : 'bg-gray-50 hover:bg-white border-gray-200'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase bg-[#1A3B6B]">
                                    {doc.fileType}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-[#1A3B6B]">
                                    {doc.category}
                                  </span>
                                  <span className="font-semibold text-gray-800 text-xs truncate">
                                    {doc.title}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5 truncate">
                                  용량: {doc.fileSize} {doc.description ? `· ${doc.description}` : ''}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleRelatedDocument(doc.id)}
                                  className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors ${
                                    isLinked
                                      ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                                  }`}
                                >
                                  {isLinked ? '연동 해제 ✕' : '+ 연동 추가'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInsertDocToContent(doc)}
                                  className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 text-xs font-medium cursor-pointer"
                                  title="본문 커서 위치에 바로가기 카드 삽입"
                                >
                                  본문 삽입
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* List of Currently Linked Documents */}
                {relatedDocumentIds.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    <div className="text-[11px] font-semibold text-indigo-900 flex items-center justify-between">
                      <span>연동 완료된 서식 목록 (학생 화면에 바로가기 카드 자동 노출):</span>
                      <span className="text-[10px] text-gray-500">본문 삽입 시 본문 중간에도 표시됩니다</span>
                    </div>
                    {relatedDocumentIds.map((docId) => {
                      const doc = documents?.find((d) => d.id === docId);
                      if (!doc) return null;
                      return (
                        <div
                          key={doc.id}
                          className="p-2.5 bg-white rounded-md border border-indigo-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase bg-[#1A3B6B]">
                                {doc.fileType}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-blue-50 text-[#1A3B6B]">
                                {doc.category}
                              </span>
                              <span className="font-bold text-gray-900 text-xs">
                                📄 {doc.title}
                              </span>
                              <span className="text-[11px] text-gray-400">({doc.fileSize})</span>
                            </div>
                            {doc.description && (
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate">{doc.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => handleInsertDocToContent(doc)}
                              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#1A3B6B] border border-blue-200 text-xs font-semibold cursor-pointer"
                              title="본문 내용에 이 서식 바로가기 카드 삽입"
                            >
                              본문에 카드 삽입
                            </button>
                            <button
                              type="button"
                              onClick={() => triggerDocumentDownload(doc)}
                              className="px-2.5 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-medium cursor-pointer flex items-center gap-1"
                              title="서식 파일 즉시 다운로드 테스트"
                            >
                              <Download className="w-3 h-3 text-gray-500" />
                              <span>즉시 다운로드</span>
                            </button>
                            {/* Requirement 2: 서식 자료실 연동 삭제 기능 */}
                            <button
                              type="button"
                              onClick={() => handleRemoveRelatedDocument(doc.id)}
                              className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold cursor-pointer flex items-center gap-1"
                              title="이 FAQ에서 서식 연동 삭제 및 본문 카드 삭제"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>연동 삭제</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-2.5 px-3 bg-white/70 rounded border border-dashed border-indigo-200 text-center text-gray-500 text-xs">
                    상단 검색창에서 관련 행정 서식을 검색하여 연동해 보세요. 연동 시 학생 화면에 ‘관련 서식 및 자료실 바로가기’가 자동으로 안내됩니다.
                  </div>
                )}
              </div>

              {/* Requirement 1: 파일 첨부 및 파일 다운로드 카드 삭제 기능 */}
              <div className="p-3.5 rounded-lg border border-gray-200 bg-gray-50/70">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div>
                    <label className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                      <Paperclip className="w-4 h-4 text-[#1A3B6B]" />
                      <span>게시글 첨부파일 및 다운로드 카드 관리</span>
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      FAQ 게시글에 직접 파일을 첨부하고 본문에 다운로드 카드를 삽입하거나 삭제할 수 있습니다.
                    </p>
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={faqAttachmentInputRef}
                      onChange={handleUploadAttachment}
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => faqAttachmentInputRef.current?.click()}
                      className="px-3 py-1.5 rounded bg-[#1A3B6B] hover:bg-blue-900 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>파일 첨부하기</span>
                    </button>
                  </div>
                </div>

                {attachments.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-2.5 bg-white rounded border border-gray-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white uppercase bg-slate-700">
                            {att.type || 'file'}
                          </span>
                          <span className="font-medium text-gray-800 truncate text-xs">
                            {att.name}
                          </span>
                          <span className="text-[11px] text-gray-400">({att.size})</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleInsertAttachmentToContent(att)}
                            className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#1A3B6B] border border-blue-200 text-xs font-semibold cursor-pointer"
                          >
                            본문 삽입
                          </button>
                          <a
                            href={att.url}
                            download={att.name}
                            className="px-2.5 py-1 rounded bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-medium cursor-pointer flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span>다운로드</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold cursor-pointer flex items-center gap-1"
                            title="첨부파일 및 본문 다운로드 카드 삭제"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>파일 삭제</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 px-3 bg-white/70 rounded border border-dashed border-gray-200 text-center text-gray-400 text-xs">
                    첨부된 파일이 없습니다. 필요 시 파일을 첨부하고 본문에 다운로드 카드를 배치할 수 있습니다.
                  </div>
                )}
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
                      체크하면 학생 FAQ 목록에서 보이지 않으며, 관리자 모드에서만 확인 및 복원할 수 있습니다.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-200">
                {editingId ? (
                  <button
                    type="button"
                    onClick={() => {
                      const currentFaq = faqs.find((f) => f.id === editingId);
                      if (currentFaq) {
                        setIsEditing(false);
                        setDeleteTarget(currentFaq);
                      }
                    }}
                    className="px-3.5 py-2 rounded text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>게시글 삭제</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100 border border-gray-300 font-medium cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? '저장 중...' : '저장 완료'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
