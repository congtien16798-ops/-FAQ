import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Check, FileText, Download, Globe, GripVertical } from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
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
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const filteredDocs = (documents || []).filter((d) => {
    if (!d) return false;
    const q = (search || '').trim().toLowerCase();
    if (!q) return true;
    return (
      (d.title?.toLowerCase() || '').includes(q) ||
      (d.category?.toLowerCase() || '').includes(q) ||
      (d.fileName?.toLowerCase() || '').includes(q)
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
    setAlertMsg('서식 목록 순서가 성공적으로 변경되었습니다.');
    setTimeout(() => setAlertMsg(null), 2500);

    // Save to localStorage immediately
    try {
      localStorage.setItem('kmu_docs_cache', JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Save to Firestore
    try {
      for (const item of updated) {
        await setDoc(doc(db, 'documents', item.id), { order: item.order }, { merge: true });
      }
    } catch (err) {
      console.warn('Remote sync order failed, saved locally:', err);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setTitle('');
    setCategory('비자/체류');
    setDescription('');
    setFileType('pdf');
    setFileName('new_application_form.pdf');
    setFileSize('120 KB');
    setDownloadUrl('#');
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
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileName.trim()) {
      setAlertMsg('서식 제목과 파일명을 입력해 주세요.');
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
      fileSize: fileSize.trim(),
      downloadUrl: downloadUrl.trim() || '#',
      createdAt: editingId ? documents.find((d) => d.id === editingId)?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
    };

    try {
      try {
        await setDoc(doc(db, 'documents', id), payload);
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.WRITE, `documents/${id}`);
      }

      setDocuments((prev) => {
        const idx = prev.findIndex((d) => d.id === id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        }
        return [payload, ...prev];
      });

      setIsEditing(false);
      setAlertMsg('서식이 성공적으로 등록/수정되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Document save error:', err);
      setDocuments((prev) => {
        const idx = prev.findIndex((d) => d.id === id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = payload;
          return updated;
        }
        return [payload, ...prev];
      });
      setIsEditing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 서식을 삭제하시겠습니까?')) return;
    try {
      try {
        await deleteDoc(doc(db, 'documents', id));
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.DELETE, `documents/${id}`);
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setAlertMsg('서식이 삭제되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Delete error:', err);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    }
  };

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs">
      {alertMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{alertMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-200">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            서식 및 자료실 파일 관리
          </h3>
          <p className="text-xs text-gray-500">
            유학생 신청서, 서약서 등 다운로드 가능한 행정 서식 목록을 관리합니다.
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-[#122a4d] transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>새 서식 등록</span>
        </button>
      </div>

      <div className="mb-4 flex justify-end">
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="서식명 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded border border-gray-200 focus:outline-none focus:bg-white focus:border-[#1A3B6B]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold select-none">
              <th className="py-2.5 px-2 w-14 text-center">순서</th>
              <th className="py-2.5 px-3 w-28">카테고리</th>
              <th className="py-2.5 px-3">서식명</th>
              <th className="py-2.5 px-3 w-20 text-center">형식</th>
              <th className="py-2.5 px-3 w-24 text-center">용량</th>
              <th className="py-2.5 px-3 w-24 text-center">관리</th>
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
              filteredDocs.map((doc, index) => {
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <tr
                    key={doc.id}
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
                            onClick={() => handleMoveStep(doc, 'up')}
                            disabled={index === 0}
                            className="p-0.5 text-[9px] text-gray-400 hover:text-[#1A3B6B] disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                            title="위로 이동"
                            aria-label="위로 이동"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveStep(doc, 'down')}
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
                        {doc.category}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{doc.title}</div>
                      <div className="text-gray-400 text-[11px] font-mono">{doc.fileName}</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {doc.fileType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px]">
                      {doc.fileSize}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openEditModal(doc)}
                          className="p-1 text-gray-500 hover:text-[#1A3B6B] hover:bg-gray-100 rounded cursor-pointer"
                          title="수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
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

      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-lg w-full p-6 border border-[#E2E5E8] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <h4 className="text-base font-bold text-gray-900">
                {editingId ? '서식 수정' : '새 서식 등록'}
              </h4>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    카테고리 구분
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="예: 비자/체류, 기숙사"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    파일 포맷
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value as DocumentFileType)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 bg-white"
                  >
                    <option value="pdf">PDF 문서</option>
                    <option value="hwp">한글 (HWP)</option>
                    <option value="docx">워드 (DOCX)</option>
                    <option value="xlsx">엑셀 (XLSX)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  서식 명칭 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 체류기간 연장허가 신청서"
                  className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    다운로드 파일명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="stay_extension_form.pdf"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    파일 크기
                  </label>
                  <input
                    type="text"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    placeholder="예: 240 KB"
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded text-gray-700 hover:bg-gray-100 border border-gray-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-[#1A3B6B] hover:bg-[#122a4d] text-white font-bold"
                >
                  저장 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
