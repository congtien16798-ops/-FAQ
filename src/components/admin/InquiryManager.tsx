import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, Check, MessageSquare, AlertCircle, Trash2, Globe, Sparkles, Settings } from 'lucide-react';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryItem | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [transInqText, setTransInqText] = useState<string | null>(null);
  const [inqTargetLang, setInqTargetLang] = useState<string | null>(null);
  const [isTranslatingInq, setIsTranslatingInq] = useState(false);

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
      // Auto detect source or default to 'auto'/'ko'
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
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inq.studentId.includes(q) ||
      inq.name.toLowerCase().includes(q) ||
      inq.content.toLowerCase().includes(q)
    );
  });

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
      setAlertMsg(`상태가 '${nextStatus === 'resolved' ? '확인완료' : '접수됨'}'으로 변경되었습니다.`);
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Toggle status error:', err);
      setInquiries((prev) => prev.map((item) => (item.id === inq.id ? updated : item)));
    }
  };

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
      setAlertMsg('담당자 메모가 저장되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Save note error:', err);
      setInquiries((prev) => prev.map((item) => (item.id === selectedInquiry.id ? updated : item)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 이 문의 내역을 삭제하시겠습니까?')) return;
    try {
      try {
        await deleteDoc(doc(db, 'inquiries', id));
      } catch (fbErr) {
        handleFirestoreError(fbErr, OperationType.DELETE, `inquiries/${id}`);
      }
      setInquiries((prev) => prev.filter((item) => item.id !== id));
      if (selectedInquiry?.id === id) setSelectedInquiry(null);
      setAlertMsg('문의가 삭제되었습니다.');
      setTimeout(() => setAlertMsg(null), 3000);
    } catch (err) {
      console.error('Delete inquiry error:', err);
      setInquiries((prev) => prev.filter((item) => item.id !== id));
    }
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
          <MessageSquare className="w-3.5 h-3.5" />
          <span>접수 목록 관리 ({inquiries.length})</span>
          {inquiries.filter((i) => i.status === 'pending').length > 0 && (
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                inquiryTab === 'list' ? 'bg-amber-400 text-gray-900' : 'bg-amber-100 text-amber-800'
              }`}
            >
              대기 {inquiries.filter((i) => i.status === 'pending').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setInquiryTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-bold transition-all cursor-pointer ${
            inquiryTab === 'settings'
              ? 'bg-[#2E7D5B] text-white shadow-xs'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>1:1 빠른 문의 설정</span>
        </button>
      </div>

      {inquiryTab === 'settings' ? (
        <InquirySettings />
      ) : (
        <>
          {alertMsg && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{alertMsg}</span>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-gray-200">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                1:1 빠른 문의 접수 현황
              </h3>
              <p className="text-xs text-gray-500">
                유학생이 비로그인 간편 폼으로 등록한 질문 목록을 확인하고 처리 상태를 관리합니다.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                총 <strong className="text-gray-900 font-bold">{inquiries.length}</strong>건 (접수대기:{' '}
                <strong className="text-amber-600">
                  {inquiries.filter((i) => i.status === 'pending').length}
                </strong>
                건)
              </span>
            </div>
          </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              statusFilter === 'all'
                ? 'bg-[#1A3B6B] text-white border-[#1A3B6B] font-semibold'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            전체 ({inquiries.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-600 font-semibold'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            접수됨 ({inquiries.filter((i) => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('resolved')}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              statusFilter === 'resolved'
                ? 'bg-[#2E7D5B] text-white border-[#2E7D5B] font-semibold'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            확인완료 ({inquiries.filter((i) => i.status === 'resolved').length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학번 또는 성명 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded border border-gray-200 focus:outline-none focus:bg-white focus:border-[#1A3B6B]"
          />
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Inquiries Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
              <th className="py-2.5 px-3 w-28">접수일시</th>
              <th className="py-2.5 px-3 w-28">학번</th>
              <th className="py-2.5 px-3 w-24">성명</th>
              <th className="py-2.5 px-3">문의 내용</th>
              <th className="py-2.5 px-3 w-24 text-center">처리 상태</th>
              <th className="py-2.5 px-3 w-24 text-center">관리</th>
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
                        ? 'bg-blue-50/60'
                        : 'hover:bg-gray-50/80'
                    }`}
                  >
                    <td className="py-3 px-3 text-gray-500 font-mono text-[11px]">
                      {new Date(inq.createdAt).toLocaleDateString('ko-KR')}{' '}
                      <span className="text-gray-400">
                        {new Date(inq.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-gray-900">
                      {inq.studentId}
                    </td>
                    <td className="py-3 px-3 font-medium text-gray-800">
                      {inq.name}
                    </td>
                    <td className="py-3 px-3">
                      <div className="line-clamp-1 text-gray-700 max-w-md">
                        {inq.content}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(inq)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          isPending
                            ? 'bg-[#2E7D5B] hover:bg-[#25664a] text-white'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {isPending ? '완료 처리' : '대기로 전환'}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selected Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-md max-w-xl w-full p-6 border border-[#E2E5E8] shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div className="flex items-center gap-2">
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
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="text-gray-500 block">학번:</span>
                  <span className="font-mono font-bold text-gray-900 text-sm">
                    {selectedInquiry.studentId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">성명:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {selectedInquiry.name}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">접수 일시:</span>
                  <span className="font-mono text-gray-700">
                    {new Date(selectedInquiry.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">연락처 안내:</span>
                  <span className="text-gray-700">학적부 등록 연락처로 회신</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-gray-700">
                    문의 내용:
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">Google 번역:</span>
                    <button
                      type="button"
                      onClick={() => handleTranslateInquiry('ko')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        inqTargetLang === 'ko'
                          ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇰🇷 한국어
                    </button>
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
                      🇻🇳 VN
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTranslateInquiry('mn')}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                        inqTargetLang === 'mn'
                          ? 'bg-[#1A3B6B] text-white border-[#1A3B6B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🇲🇳 MN
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
                    className="flex-1 px-3 py-1.5 rounded border border-gray-300"
                  />
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-black text-white rounded font-semibold"
                  >
                    메모 저장
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleDelete(selectedInquiry.id)}
                  className="text-red-600 hover:text-red-800 flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>문의 삭제</span>
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleStatus(selectedInquiry)}
                    className={`px-4 py-2 rounded font-bold text-white transition-colors ${
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
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
