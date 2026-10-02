import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Pin, Search, Check, AlertCircle, Eye, Image as ImageIcon, GripVertical } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { FaqItem, FaqCategory } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { RichTextEditor } from './RichTextEditor';

interface FaqManagerProps {
  faqs: FaqItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
}

export const FaqManager: React.FC<FaqManagerProps> = ({ faqs, setFaqs }) => {
  const { user } = useAuth();
  const { config } = useTheme();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FaqCategory | 'all'>('all');

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Modal / Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FaqCategory>('attendance');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const filteredFaqs = (faqs || []).filter((faq) => {
    if (!faq) return false;
    const matchesCat = categoryFilter === 'all' || faq.category === categoryFilter;
    if (!matchesCat) return false;
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (faq.title?.toLowerCase() || '').includes(q) ||
      (faq.content?.toLowerCase() || '').includes(q)
    );
  });

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
    setAlertMsg('질문 목록 순서가 성공적으로 변경되었습니다.');
    setTimeout(() => setAlertMsg(null), 2500);

    // Save to local storage cache immediately
    try {
      localStorage.setItem('kmu_faqs_cache', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Save to Firestore
    try {
      for (const item of updated) {
        await setDoc(doc(db, 'faqs', item.id), { order: item.order }, { merge: true });
      }
    } catch (err) {
      console.warn('Remote sync order failed, saved locally:', err);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('attendance');
    setContent('<p>안내할 내용을 입력해 주세요.</p>');
    setPinned(false);
    setImageUrl('');
    setIsEditing(true);
  };

  const openEditModal = (faq: FaqItem) => {
    setEditingId(faq.id);
    setTitle(faq.title);
    setCategory(faq.category);
    setContent(faq.content);
    setPinned(faq.pinned);
    setImageUrl(faq.imageUrl || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setAlertMsg('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    const id = editingId || `faq-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const faqPayload: FaqItem = {
      id,
      category,
      title: title.trim(),
      content: content.trim(),
      pinned,
      views: editingId ? faqs.find((f) => f.id === editingId)?.views || 100 : 0,
      imageUrl: imageUrl.trim() || undefined,
      createdAt: editingId ? faqs.find((f) => f.id === editingId)?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
      authorId: user?.uid || 'admin',
    };

    try {
      // Save to Firestore
      try {
        await setDoc(doc(db, 'faqs', id), faqPayload);
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.WRITE, `faqs/${id}`);
      }

      // Update local state
      setFaqs((prev) => {
        const idx = prev.findIndex((f) => f.id === id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = faqPayload;
          return updated;
        }
        return [faqPayload, ...prev];
      });

      setIsEditing(false);
      setAlertMsg('FAQ가 성공적으로 저장되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save FAQ:', err);
      // Fallback local update
      setFaqs((prev) => {
        const idx = prev.findIndex((f) => f.id === id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = faqPayload;
          return updated;
        }
        return [faqPayload, ...prev];
      });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 FAQ 안내 글을 삭제하시겠습니까?')) return;
    try {
      try {
        await deleteDoc(doc(db, 'faqs', id));
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.DELETE, `faqs/${id}`);
      }
      setFaqs((prev) => prev.filter((f) => f.id !== id));
      setAlertMsg('FAQ가 삭제되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setFaqs((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleTogglePin = async (faq: FaqItem) => {
    const updated = { ...faq, pinned: !faq.pinned, updatedAt: new Date().toISOString() };
    try {
      await setDoc(doc(db, 'faqs', faq.id), updated);
    } catch (fbErr) {
      // fallback
    }
    setFaqs((prev) => prev.map((f) => (f.id === faq.id ? updated : f)));
  };

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs">
      {/* Toast Alert */}
      {alertMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{alertMsg}</span>
        </div>
      )}

      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            자주 묻는 질문 (FAQ) 게시판 관리
          </h3>
          <p className="text-xs text-gray-500">
            외국인 유학생에게 제공되는 공식 FAQ 안내를 등록, 수정, 삭제하거나 상단 공지로 고정할 수 있습니다.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-[#122a4d] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>새 FAQ 작성</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
              categoryFilter === 'all'
                ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
            }`}
          >
            전체
          </button>
          {(config.categories || []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 text-xs rounded border transition-colors whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              {cat.name.ko || cat.id}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="FAQ 제목 또는 내용 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded border border-gray-200 focus:outline-none focus:bg-white focus:border-[#1A3B6B]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* FAQ Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
              <th className="py-2.5 px-2 w-14 text-center">순서</th>
              <th className="py-2.5 px-3 w-14 text-center">고정</th>
              <th className="py-2.5 px-3 w-24">카테고리</th>
              <th className="py-2.5 px-3">질문 제목</th>
              <th className="py-2.5 px-3 w-28 text-center">수정일</th>
              <th className="py-2.5 px-3 w-24 text-center">관리</th>
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
                      isDragging ? 'opacity-40 bg-gray-100' : isOver ? 'border-t-2 border-[#1A3B6B] bg-blue-50/60' : 'hover:bg-gray-50/80'
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
                        className={`p-1 rounded transition-colors ${
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
                        {config.categories?.find((c) => c.id === faq.category)?.name.ko || faq.category}
                      </span>
                    </td>

                    {/* Title */}
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                        {faq.pinned && (
                          <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-[#D97736] text-white">
                            공지
                          </span>
                        )}
                        <span>{faq.title}</span>
                      </div>
                    </td>

                    {/* Updated date */}
                    <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                      {new Date(faq.updatedAt).toLocaleDateString('ko-KR')}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(faq)}
                          className="p-1 text-gray-500 hover:text-[#1A3B6B] hover:bg-gray-100 rounded"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(faq.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="삭제"
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

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-4xl w-full p-6 max-h-[92vh] overflow-y-auto border border-[#E2E5E8] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h4 className="text-base font-bold text-gray-900">
                {editingId ? 'FAQ 수정' : '새 FAQ 작성'}
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
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
                    {(config.categories || []).map((cat) => (
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <span>답변 본문 내용</span>
                    <span className="text-red-500">*</span>
                    <span className="text-[11px] font-normal text-gray-500">
                      (서식 편집, 표 삽입, 사진 첨부 및 크기/정렬 조절 가능)
                    </span>
                  </label>
                </div>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="답변 내용을 자유롭게 작성하세요..."
                  minHeight="280px"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  참조 안내 이미지 웹 URL (선택 사항)
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://... 이미지 링크 (본문 내 사진 삽입 외 별도 첨부 시)"
                  className="w-full px-3 py-1.5 rounded border border-gray-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100 border border-gray-300 font-medium"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? '저장 중...' : '저장 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
