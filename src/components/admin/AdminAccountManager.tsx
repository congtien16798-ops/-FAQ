import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Search,
  Mail,
  User,
  Info,
  Clock,
  KeyRound,
  X
} from 'lucide-react';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth, PRIMARY_ADMIN_EMAIL } from '../../context/AuthContext';

export interface AdminAccountItem {
  id: string;
  email: string;
  name: string;
  memo?: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
  registeredBy?: string;
}

const LOCAL_ADMINS_CACHE_KEY = 'kmu_admin_list';

export const AdminAccountManager: React.FC = () => {
  const { user } = useAuth();

  const [adminList, setAdminList] = useState<AdminAccountItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_ADMINS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'super_admin',
        email: PRIMARY_ADMIN_EMAIL,
        name: '한국어학당 총괄 주관리자',
        memo: '시스템 총괄 관리 및 보안 총책임',
        role: 'super_admin',
        createdAt: '2024-01-01T00:00:00.000Z',
        registeredBy: '시스템 기본 생성',
      },
    ];
  });

  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New admin form states
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newMemo, setNewMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<AdminAccountItem | null>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Fetch admin accounts from Firestore
  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'admins'));
      const fetched: AdminAccountItem[] = [];

      snap.forEach((d) => {
        if (d.id === 'super_admin_info') return;
        const data = d.data();
        if (data.email) {
          fetched.push({
            id: d.id,
            email: data.email,
            name: data.name || '관리자',
            memo: data.memo || '',
            role: data.role === 'super_admin' ? 'super_admin' : 'admin',
            createdAt: data.createdAt || new Date().toISOString(),
            registeredBy: data.registeredBy || '관리자 등록',
          });
        }
      });

      // Ensure PRIMARY_ADMIN_EMAIL is present in the list
      const hasSuper = fetched.some(
        (a) => a.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()
      );
      if (!hasSuper) {
        fetched.unshift({
          id: 'super_admin',
          email: PRIMARY_ADMIN_EMAIL,
          name: '한국어학당 총괄 주관리자',
          memo: '시스템 총괄 관리 및 보안 총책임',
          role: 'super_admin',
          createdAt: '2024-01-01T00:00:00.000Z',
          registeredBy: '시스템 기본 생성',
        });
      }

      setAdminList(fetched);
      localStorage.setItem(LOCAL_ADMINS_CACHE_KEY, JSON.stringify(fetched));
    } catch (err) {
      console.warn('Failed to fetch admins from Firestore:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Handle register new Google admin
  const handleRegisterAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.toLowerCase().trim();

    if (!cleanEmail) {
      showToast('구글 이메일 주소를 입력해 주세요.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      showToast('올바른 이메일 형식(예: user@gmail.com)을 입력해 주세요.', 'error');
      return;
    }

    // Check duplicate
    if (adminList.some((a) => a.email.toLowerCase() === cleanEmail)) {
      showToast('이미 관리자로 등록되어 있는 이메일 주소입니다.', 'error');
      return;
    }

    setIsSubmitting(true);
    const docKey = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const timestamp = new Date().toISOString();

    const newAdminData: AdminAccountItem = {
      id: docKey,
      email: cleanEmail,
      name: newName.trim() || '관리자',
      memo: newMemo.trim() || '한국어학당 포털 관리자',
      role: 'admin',
      createdAt: timestamp,
      registeredBy: user?.email || PRIMARY_ADMIN_EMAIL,
    };

    try {
      await setDoc(doc(db, 'admins', docKey), newAdminData);

      const updated = [newAdminData, ...adminList];
      setAdminList(updated);
      localStorage.setItem(LOCAL_ADMINS_CACHE_KEY, JSON.stringify(updated));

      setNewEmail('');
      setNewName('');
      setNewMemo('');
      showToast(`'${cleanEmail}' 계정이 관리자로 성공적으로 등록되었습니다.`);
    } catch (err) {
      console.error('Failed to register admin doc:', err);
      // Fallback local persistence
      const updated = [newAdminData, ...adminList];
      setAdminList(updated);
      localStorage.setItem(LOCAL_ADMINS_CACHE_KEY, JSON.stringify(updated));
      setNewEmail('');
      setNewName('');
      setNewMemo('');
      showToast(`'${cleanEmail}' 계정이 관리자로 등록되었습니다. (로컬 동기화 완료)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete admin
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      showToast('주 관리자(Super Admin) 계정은 삭제할 수 없습니다.', 'error');
      setDeleteTarget(null);
      return;
    }

    try {
      const docKey = deleteTarget.email.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
      await deleteDoc(doc(db, 'admins', docKey));

      const updated = adminList.filter((a) => a.email.toLowerCase() !== deleteTarget.email.toLowerCase());
      setAdminList(updated);
      localStorage.setItem(LOCAL_ADMINS_CACHE_KEY, JSON.stringify(updated));
      showToast(`'${deleteTarget.email}' 관리자 계정이 삭제되었습니다.`);
    } catch (err) {
      console.error('Failed to delete admin doc:', err);
      const updated = adminList.filter((a) => a.email.toLowerCase() !== deleteTarget.email.toLowerCase());
      setAdminList(updated);
      localStorage.setItem(LOCAL_ADMINS_CACHE_KEY, JSON.stringify(updated));
      showToast(`'${deleteTarget.email}' 관리자 계정이 삭제되었습니다. (로컬 반영)`);
    } finally {
      setDeleteTarget(null);
    }
  };

  const filteredAdmins = adminList.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.email.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      (a.memo && a.memo.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold flex items-center gap-2 animate-slide-up ${
            toastMsg.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Header Info Banner */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#1A3B6B]/10 text-[#1A3B6B] flex items-center justify-center font-bold shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#1A3B6B]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span>Google 관리자 계정 통합 관리</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-[#1A3B6B]">
                  총 {adminList.length}명 등록
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                등록된 구글 계정만 계명대학교 한국어학당 관리자 센터에 로그인할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded text-xs text-blue-900 flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-blue-950 font-semibold mb-0.5">보안 및 권한 안내</strong>
            관리자로 등록된 구글 계정은 FAQ 작성/수정/삭제, 서식 배포, 1:1 학생 문의 조회 및 답변 처리 권한을 갖습니다. 신뢰할 수 있는 담당 교직원의 계정만 등록해 주세요.
          </div>
        </div>
      </div>

      {/* Register New Admin Card */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 sm:p-5 shadow-xs">
        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-100">
          <UserPlus className="w-4 h-4 text-[#1A3B6B]" />
          <span>신규 Google 관리자 계정 등록</span>
        </h4>

        <form onSubmit={handleRegisterAdmin} className="space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Google 이메일 주소 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="예: admin@gmail.com"
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs rounded border border-gray-300 focus:border-[#1A3B6B] focus:ring-1 focus:ring-[#1A3B6B]"
                />
              </div>
            </div>

            {/* Name / Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                관리자 성명 및 소속 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="예: 김선생님 (한국어학당 학사팀)"
                  required
                  className="w-full pl-8 pr-3 py-2 text-xs rounded border border-gray-300 focus:border-[#1A3B6B] focus:ring-1 focus:ring-[#1A3B6B]"
                />
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                담당 업무 및 메모 (선택)
              </label>
              <input
                type="text"
                value={newMemo}
                onChange={(e) => setNewMemo(e.target.value)}
                placeholder="예: D-4 비자 연장, 출결 및 서식 관리"
                className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:border-[#1A3B6B] focus:ring-1 focus:ring-[#1A3B6B]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1A3B6B] hover:bg-blue-900 text-white rounded text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '등록 처리 중...' : 'Google 관리자 등록'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Admin List Card */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>등록된 관리자 목록 ({filteredAdmins.length}명)</span>
          </h4>

          {/* Search bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이메일, 성명, 담당 검색..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded border border-gray-300 focus:border-[#1A3B6B]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto border border-gray-200 rounded-md">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <th className="py-2.5 px-3 w-12 text-center">번호</th>
                <th className="py-2.5 px-3">Google 이메일</th>
                <th className="py-2.5 px-3">성명 / 소속</th>
                <th className="py-2.5 px-3">담당 업무 (메모)</th>
                <th className="py-2.5 px-3 w-28 text-center">권한 등급</th>
                <th className="py-2.5 px-3 w-28 text-center">등록일시</th>
                <th className="py-2.5 px-3 w-20 text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    검색 결과와 일치하는 관리자 계정이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm, idx) => {
                  const isSuper = adm.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
                  return (
                    <tr key={adm.id || adm.email} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-gray-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 font-medium text-gray-900">
                          <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{adm.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-gray-800">
                        {adm.name}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {adm.memo || '-'}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {isSuper ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            ★ 총괄 주관리자
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✓ 일반 관리자
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center text-gray-500 font-mono text-[11px] whitespace-nowrap">
                        {adm.createdAt ? new Date(adm.createdAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {isSuper ? (
                          <span className="text-[11px] text-gray-400 font-medium">
                            보호됨
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(adm)}
                            className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="관리자 계정 권한 해제(삭제)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-sm w-full p-5 shadow-2xl border border-gray-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h5 className="font-bold text-gray-900 text-sm flex items-center gap-1.5 text-red-600">
                <Trash2 className="w-4 h-4" />
                <span>관리자 권한 해제</span>
              </h5>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              <strong>{deleteTarget.name}</strong> (<span className="font-mono text-gray-800">{deleteTarget.email}</span>) 님의 관리자 권한을 해제하시겠습니까?
              <br />
              <span className="text-red-600 mt-1 block">해제 후에는 해당 구글 계정으로 관리자 로그인이 불가능해집니다.</span>
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                권한 해제(삭제)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
