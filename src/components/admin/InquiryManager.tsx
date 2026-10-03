import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Check,
  MessageSquare,
  AlertCircle,
  Trash2,
  Globe,
  Sparkles,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  X
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { InquiryItem, InquiryStatus, Language } from '../../types';
import { translateText } from '../../services/translator';
import { InquirySettings } from './InquirySettings';

interface InquiryManagerProps {
  inquiries: InquiryItem[];
  setInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
}

export const InquiryManager: React.FC<InquiryManagerProps> = ({
  inquiries,
  setInquiries,
}) => {
  const [inquiryTab, setInquiryTab] = useState<'list' | 'settings'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [transInqText, setTransInqText] = useState<string | null>(null);
  const [inqTargetLang, setInqTargetLang] = useState<string | null>(null);
  const [isTranslatingInq, setIsTranslatingInq] = useState(false);

  // Delete & Hide Management Dialog State
  const [deleteTarget, setDeleteTarget] = useState<InquiryItem | null>(null);
  const [confirmPermanentTarget, setConfirmPermanentTarget] = useState<InquiryItem | null>(null);

  const showToast = (msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const handleTranslateInquiry = async (targetLang: Language) => {
    if (!selectedInquiry) return;
    if (inqTargetLang === targetLang && transInqText) {
      setTransInqText(null);
      setInqTargetLang(null);
      return;
    }

    setIsTranslatingInq(true);
    setInqTargetLang(targetLang);
    try {
      const translated = await translateText(selectedInquiry.content, targetLang, targetLang === 'ko' ? 'en' : 'ko');
      setTransInqText(translated);
    } catch {
      setTransInqText(selectedInquiry.content);
    } finally {
      setIsTranslatingInq(false);
    }
  };

  const filteredInquiries = inquiries.filter((inq) => {
    if (statusFilter !== 'all' && inq.status !== statusFilter) return false;
    if (visibilityFilter === 'visible' && inq.hidden) return false;
    if (visibilityFilter === 'hidden' && !inq.hidden) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inq.studentId.includes(q) ||
      inq.name.toLowerCase().includes(q) ||
      inq.content.toLowerCase().includes(q)
    );
  });

  const hiddenCount = inquiries.filter((i) => i.hidden).length;

  // Toggle Visibility (숨기기 / 보이기)
  const handleToggleVisibility = async (id: string, newHidden: boolean) => {
    const target = inquiries.find((i) => i.id === id);
    if (!target) return;

    const timestamp = new Date().toISOString();
    const updated: InquiryItem = {
      ...target,
      hidden: newHidden,
      updatedAt: timestamp,
    };

    const newInquiries = inquiries.map((i) => (i.id === id ? updated : i));
    setInquiries(newInquiries);
    if (selectedInquiry?.id === id) {
      setSelectedInquiry(updated);
    }

    try {
      localStorage.setItem('kmu_inquiries_cache', JSON.stringify(newInquiries));
      await setDoc(doc(db, 'inquiries', id), updated);
    } catch (err) {
      console.warn('Inquiry visibility update warning:', err);
    }

    if (deleteTarget && deleteTarget.id === id) {
      setDeleteTarget(null);
    }

    showToast(
      newHidden
        ? `'${target.name}' 학생의 문의를 목록에서 숨김(보관) 처리했습니다.`
        : `'${target.name}' 학생의 문의를 다시 목록에 노출합니다.`
    );
  };

  // Toggle Status
  const handleToggleStatus = async (inq: InquiryItem) => {
    const nextStatus: InquiryStatus = inq.status === 'pending' ? 'resolved' : 'pending';
    const timestamp = new Date().toISOString();
    const updated = { ...inq, status: nextStatus, updatedAt: timestamp };

    try {
      try {
        await updateDoc(doc(db, 'inquiries', inq.id), {
          status: nextStatus,
          updatedAt: timestamp,
        });
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.UPDATE, `inquiries/${inq.id}`);
      }

      setInquiries((prev) => prev.map((item) => (item.id === inq.id ? updated : item)));
      if (selectedInquiry?.id === inq.id) {
        setSelectedInquiry(updated);
      }
      showToast(`상태가 '${nextStatus === 'resolved' ? '확인완료' : '접수됨'}'으로 변경되었습니다.`);
    } catch (err) {
      console.error('Toggle status error:', err);
      setInquiries((prev) => prev.map((item) => (item.id === inq.id ? updated : item)));
    }
  };

  // Save Note
  const handleSaveNote = async () => {
    if (!selectedInquiry) return;
    const timestamp = new Date().toISOString();
    const updated = { ...selectedInquiry, adminNote, updatedAt: timestamp };

    try {
      try {
        await updateDoc(doc(db, 'inquiries', selectedInquiry.id), {
          adminNote,
          updatedAt: timestamp,
        });
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.UPDATE, `inquiries/${selectedInquiry.id}`);
      }

      setInquiries((prev) => prev.map((item) => (item.id === selectedInquiry.id ? updated : item)));
      setSelectedInquiry(updated);
      showToast('담당자 메모가 저장되었습니다.');
    } catch (err) {
      console.error('Save note error:', err);
      setInquiries((prev) => prev.map((item) => (item.id === selectedInquiry.id ? updated : item)));
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (id: string) => {
    const target = inquiries.find((item) => item.id === id);
    const targetName = target ? `${target.name} (${target.studentId})` : '해당 문의';

    const newInquiries = inquiries.filter((item) => item.id !== id);
    setInquiries(newInquiries);
    if (selectedInquiry?.id === id) setSelectedInquiry(null);

    try {
      localStorage.setItem('kmu_inquiries_cache', JSON.stringify(newInquiries));
      await deleteDoc(doc(db, 'inquiries', id));
    } catch (fbErr) {
      console.warn('Inquiry delete remote warning:', fbErr);
    }

    setDeleteTarget(null);
    setConfirmPermanentTarget(null);
    showToast(`'${targetName}' 문의 내역이 영구 삭제되었습니다.`);
  };

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs">
      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 mb-6 pb-3 border-b border-gray-200">
        <button
          onClick={() => setInquiryTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
            inquiryTab === 'list'
              ? 'bg-[#2E7D5B] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>문의 접수 내역 ({inquiries.length})</span>
          {hiddenCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-semibold">
              {hiddenCount}개 숨김
            </span>
          )}
        </button>

        <button
          onClick={() => setInquiryTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
            inquiryTab === 'settings'
              ? 'bg-[#2E7D5B] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Settings className="w-4 h-4 text-emerald-600" />
          <span>문의 창구 설정 및 문구</span>
        </button>
      </div>

      {alertMsg && (
        <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{alertMsg}</span>
        </div>
      )}

      {inquiryTab === 'settings' ? (
        <InquirySettings />
      ) : (
        <div>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-0.5 text-xs">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#2E7D5B] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  전체 ({inquiries.length})
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
                    statusFilter === 'pending'
                      ? 'bg-[#2E7D5B] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  접수대기 ({inquiries.filter((i) => i.status === 'pending').length})
                </button>
                <button
                  onClick={() => setStatusFilter('resolved')}
                  className={`px-3 py-1 rounded transition-colors font-medium cursor-pointer ${
                    statusFilter === 'resolved'
                      ? 'bg-[#2E7D5B] text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  확인완료 ({inquiries.filter((i) => i.status === 'resolved').length})
                </button>
              </div>

              {/* Visibility Filter */}
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded border border-gray-200 text-xs bg-gray-50 text-gray-700 font-medium"
              >
                <option value="all">전체 상태 (노출+숨김)</option>
                <option value="visible">일반 목록</option>
                <option value="hidden">숨김 보관 ({hiddenCount}개)</option>
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="학번 또는 성명 검색..."
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

          {/* Inquiries Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-md">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                  <th className="py-2.5 px-3 w-28">접수일시</th>
                  <th className="py-2.5 px-3 w-24">학번</th>
                  <th className="py-2.5 px-3 w-24">성명</th>
                  <th className="py-2.5 px-3">문의 내용</th>
                  <th className="py-2.5 px-3 w-24 text-center">처리 상태</th>
                  <th className="py-2.5 px-3 w-32 text-center">상태 / 관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-400">
                      접수된 문의 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map((inq) => {
                    const isPending = inq.status === 'pending';
                    return (
                      <tr
                        key={inq.id}
                        onClick={() => {
                          setSelectedInquiry(inq);
                          setAdminNote(inq.adminNote || '');
                          setTransInqText(null);
                          setInqTargetLang(null);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedInquiry?.id === inq.id
                            ? 'bg-blue-50/70'
                            : inq.hidden
                            ? 'bg-amber-50/25 hover:bg-amber-50/40'
                            : 'hover:bg-gray-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {new Date(inq.createdAt).toLocaleDateString('ko-KR')}{' '}
                          <span className="text-gray-400">
                            {new Date(inq.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-gray-900 whitespace-nowrap">
                          {inq.studentId}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800 whitespace-nowrap">
                          {inq.name}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {inq.hidden && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5">
                                <EyeOff className="w-3 h-3 text-amber-700" />
                                숨김 보관
                              </span>
                            )}
                            <span className="line-clamp-1 text-gray-700 max-w-md">{inq.content}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                              isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            {isPending ? '접수됨' : '확인완료'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            {/* Toggle Visibility */}
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(inq.id, !inq.hidden)}
                              className={`p-1.5 rounded transition-colors cursor-pointer border ${
                                inq.hidden
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent'
                              }`}
                              title={inq.hidden ? '목록에 다시 노출 (현재 숨김 보관)' : '목록에서 숨기기'}
                            >
                              {inq.hidden ? <EyeOff className="w-3.5 h-3.5 text-amber-700" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => handleToggleStatus(inq)}
                              className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                                isPending
                                  ? 'bg-[#2E7D5B] hover:bg-[#25664a] text-white'
                                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                              }`}
                            >
                              {isPending ? '완료' : '대기'}
                            </button>

                            <button
                              onClick={() => setDeleteTarget(inq)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="삭제 또는 숨김"
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

      {/* ===================== DIALOG 1: INQUIRY SAFE DELETE & HIDE ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>문의 내역 삭제 및 숨김 관리</span>
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
                <div className="font-bold text-gray-900 text-sm">{deleteTarget.name} ({deleteTarget.studentId})</div>
                <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">
                  {deleteTarget.content}
                </div>
                {deleteTarget.hidden && (
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">
                    현재 목록에서 숨김 처리된 상태입니다.
                  </div>
                )}
              </div>

              <p className="text-gray-600 leading-relaxed">
                해당 문의 내역을 완전히 삭제하시겠습니까, 아니면 목록에서 보이지 않도록 숨김 보관하시겠습니까?
              </p>

              {/* Action 1: Hide from list */}
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
                    {deleteTarget.hidden ? '목록에 다시 노출 (숨김 해제)' : '목록에서 숨기기 (권장)'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {deleteTarget.hidden
                      ? '일반 문의 접수 목록에 다시 노출합니다.'
                      : '데이터를 삭제하지 않고 목록에서만 즉시 감춥니다. 언제든 다시 보이게 복원할 수 있습니다.'}
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

      {/* ===================== DIALOG 2: INQUIRY PERMANENT DELETE DOUBLE CONFIRMATION ===================== */}
      {confirmPermanentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 sm:p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="flex items-center gap-2.5 text-red-600 mb-3 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>영구 삭제 재확인</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-4">
              정말 <strong className="text-gray-900 font-bold">'{confirmPermanentTarget.name} ({confirmPermanentTarget.studentId})'</strong> 학생의 문의 내역을 영구 삭제하시겠습니까?
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

      {/* Selected Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-xl w-full p-6 border border-[#E2E5E8] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-base">
                  문의 상세 정보
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold ${
                    selectedInquiry.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedInquiry.status === 'pending' ? '접수됨' : '확인완료'}
                </span>
                {selectedInquiry.hidden && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <EyeOff className="w-3.5 h-3.5" />
                    숨김 보관
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="text-gray-500 block mb-0.5">학번:</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {selectedInquiry.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">성명:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {selectedInquiry.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">접수 일시:</span>
                  <span className="text-gray-700 font-mono">
                    {new Date(selectedInquiry.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block mb-0.5">처리 상태:</span>
                  <span className="font-semibold text-gray-800">
                    {selectedInquiry.status === 'pending' ? '답변 대기 중' : '답변 및 확인 완료'}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-gray-700">
                    문의 내용:
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400 mr-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      실시간 번역:
                    </span>
                    <button
                      type="button"
                      onClick={() => handleTranslateInquiry('en')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        inqTargetLang === 'en'
                          ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇺🇸 EN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslateInquiry('vi')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        inqTargetLang === 'vi'
                          ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇻🇳 VI
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslateInquiry('zh')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        inqTargetLang === 'zh'
                          ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇨🇳 CN
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200 text-gray-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {isTranslatingInq ? (
                    <span className="text-blue-600 animate-pulse font-medium">Google 번역 엔진으로 변환 중...</span>
                  ) : (
                    transInqText || selectedInquiry.content
                  )}
                </div>
                {transInqText && (
                  <p className="text-[10px] text-blue-600 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>[{inqTargetLang?.toUpperCase()}] 언어로 Google 자동 번역된 결과입니다.</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  행정실 내부 메모 (Admin Note):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="예: 2026-09-30 전화로 비자 서류 안내 완료 (담당: 김선생님)"
                    className="flex-1 px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="px-3.5 py-1.5 bg-gray-800 hover:bg-black text-white rounded font-semibold cursor-pointer"
                  >
                    메모 저장
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleVisibility(selectedInquiry.id, !selectedInquiry.hidden)}
                    className="text-amber-700 hover:text-amber-900 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {selectedInquiry.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{selectedInquiry.hidden ? '숨김 해제' : '목록 숨기기'}</span>
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => {
                      const target = selectedInquiry;
                      setSelectedInquiry(null);
                      setDeleteTarget(target);
                    }}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>문의 삭제</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(selectedInquiry)}
                    className={`px-4 py-2 rounded font-bold text-white transition-colors cursor-pointer ${
                      selectedInquiry.status === 'pending'
                        ? 'bg-[#2E7D5B] hover:bg-[#25664a]'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {selectedInquiry.status === 'pending'
                      ? '확인완료 상태로 변경'
                      : '접수대기로 되돌리기'}
                  </button>
                  <button
                    onClick={() => setSelectedInquiry(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
