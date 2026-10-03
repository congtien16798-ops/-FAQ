import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Mail, 
  User, 
  Building, 
  Check, 
  AlertCircle, 
  X, 
  Crown,
  KeyRound,
  Shield,
  Clock,
  Edit2,
  ArrowRightLeft,
  Phone,
  FileText,
  AlertTriangle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../firebase';
import { AdminAccount } from '../../types';

export const INITIAL_SUPER_ADMIN_EMAIL = 'congtien16798@gmail.com';
const LOCAL_STORAGE_ADMINS_KEY = 'kmu_admin_accounts_cache';
const LOCAL_STORAGE_SUPER_ADMIN_KEY = 'kmu_super_admin_info';

const defaultSuperAdmin: AdminAccount = {
  id: 'admin-super-primary',
  email: INITIAL_SUPER_ADMIN_EMAIL,
  name: '최고 관리자 (Cong Tien)',
  role: 'super_admin',
  department: '국제교류원 / 한국어학당 총괄',
  phone: '053-580-6923',
  note: '계명대학교 한국어학당 시스템 총괄 관리자',
  createdAt: '2026-09-01T00:00:00.000Z',
};

export const AdminAccountManager: React.FC = () => {
  // Super Admin state
  const [superAdmin, setSuperAdmin] = useState<AdminAccount>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_SUPER_ADMIN_KEY);
      if (cached) {
        return { ...defaultSuperAdmin, ...JSON.parse(cached) };
      }
    } catch {
      // ignore
    }
    return defaultSuperAdmin;
  });

  // Secondary admins state
  const [secondaryAdmins, setSecondaryAdmins] = useState<AdminAccount[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_ADMINS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as AdminAccount[];
        return parsed.filter(a => a.email.toLowerCase() !== defaultSuperAdmin.email.toLowerCase());
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditSuperModalOpen, setIsEditSuperModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Admin Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('한국어학당 교학팀');
  const [role, setRole] = useState<'admin' | 'editor'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Super Admin Form State
  const [editSuperName, setEditSuperName] = useState(superAdmin.name);
  const [editSuperDept, setEditSuperDept] = useState(superAdmin.department || '');
  const [editSuperPhone, setEditSuperPhone] = useState(superAdmin.phone || '');
  const [editSuperNote, setEditSuperNote] = useState(superAdmin.note || '');
  const [isSavingSuper, setIsSavingSuper] = useState(false);

  // Transfer Super Admin Form State
  const [transferTargetMode, setTransferTargetMode] = useState<'existing' | 'new'>('existing');
  const [selectedExistingEmail, setSelectedExistingEmail] = useState('');
  const [newTransferEmail, setNewTransferEmail] = useState('');
  const [newTransferName, setNewTransferName] = useState('');
  const [newTransferDept, setNewTransferDept] = useState('한국어학당 교학팀');
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Sync edit form when superAdmin changes
  useEffect(() => {
    setEditSuperName(superAdmin.name);
    setEditSuperDept(superAdmin.department || '');
    setEditSuperPhone(superAdmin.phone || '');
    setEditSuperNote(superAdmin.note || '');
  }, [superAdmin]);

  // Real-time listener for Super Admin Profile from Firestore
  useEffect(() => {
    const unsubSuper = onSnapshot(doc(db, 'admins', 'super_admin_info'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<AdminAccount>;
        const merged: AdminAccount = {
          ...defaultSuperAdmin,
          ...data,
          role: 'super_admin',
        };
        setSuperAdmin(merged);
        try {
          localStorage.setItem(LOCAL_STORAGE_SUPER_ADMIN_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
    }, (err) => {
      console.warn('Real-time listener on super_admin_info:', err);
    });

    return () => unsubSuper();
  }, []);

  // Real-time listener for secondary admins in Firestore
  useEffect(() => {
    const unsubAdmins = onSnapshot(collection(db, 'admins'), (snapshot) => {
      const remoteList: AdminAccount[] = [];
      snapshot.forEach((docSnap) => {
        if (docSnap.id === 'super_admin_info') return; // Dedicated doc for super admin
        const data = docSnap.data() as Partial<AdminAccount>;
        if (!data.email) return;
        
        // Exclude current super admin
        if (data.email.toLowerCase() === superAdmin.email.toLowerCase()) return;

        remoteList.push({
          id: docSnap.id,
          email: data.email,
          name: data.name || '관리자',
          role: data.role || 'admin',
          department: data.department || '한국어학당',
          phone: data.phone,
          note: data.note,
          createdAt: data.createdAt || new Date().toISOString(),
          lastLoginAt: data.lastLoginAt,
        });
      });

      setSecondaryAdmins(remoteList);
      try {
        localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(remoteList));
      } catch {
        // ignore
      }
    }, (err) => {
      console.warn('Real-time listener on admins collection failed:', err);
    });

    return () => unsubAdmins();
  }, [superAdmin.email]);

  // Combined list with Super Admin always on top
  const allAdmins = [superAdmin, ...secondaryAdmins];

  // 1. Add New Admin
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !cleanName) {
      showToast('이메일과 관리자 성함을 모두 입력해 주세요.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      showToast('유효한 이메일 주소 형식을 입력해 주세요.');
      return;
    }

    if (allAdmins.some((a) => a.email.toLowerCase() === cleanEmail)) {
      showToast('이미 등록된 관리자 이메일입니다.');
      return;
    }

    setIsSubmitting(true);
    const newId = `admin-${Date.now()}`;
    const newAdmin: AdminAccount = {
      id: newId,
      email: cleanEmail,
      name: cleanName,
      department: department.trim() || '한국어학당',
      role,
      createdAt: new Date().toISOString(),
    };

    try {
      const docKey = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
      await setDoc(doc(db, 'admins', docKey), newAdmin);

      const updated = [...secondaryAdmins, newAdmin];
      setSecondaryAdmins(updated);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(updated));

      setEmail('');
      setName('');
      setDepartment('한국어학당 교학팀');
      setIsAddModalOpen(false);
      showToast(`'${cleanName}' 관리자 계정이 성공적으로 등록되었습니다.`);
    } catch (err) {
      console.error('Error adding admin:', err);
      const updated = [...secondaryAdmins, newAdmin];
      setSecondaryAdmins(updated);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(updated));
      setIsAddModalOpen(false);
      showToast(`'${cleanName}' 관리자가 로컬에 등록되었습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Edit Super Admin Info (주 관리자 정보 수정)
  const handleOpenEditSuper = () => {
    setEditSuperName(superAdmin.name);
    setEditSuperDept(superAdmin.department || '');
    setEditSuperPhone(superAdmin.phone || '');
    setEditSuperNote(superAdmin.note || '');
    setIsEditSuperModalOpen(true);
  };

  const handleSaveSuperAdminInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSuperName.trim()) {
      showToast('주 관리자 성함을 입력해 주세요.');
      return;
    }

    setIsSavingSuper(true);
    const updatedSuper: AdminAccount = {
      ...superAdmin,
      name: editSuperName.trim(),
      department: editSuperDept.trim() || '한국어학당 총괄',
      phone: editSuperPhone.trim(),
      note: editSuperNote.trim(),
    };

    try {
      // 1. Save to dedicated super_admin_info doc
      await setDoc(doc(db, 'admins', 'super_admin_info'), updatedSuper);

      // 2. Also update sanitized email doc
      const docKey = superAdmin.email.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
      await setDoc(doc(db, 'admins', docKey), updatedSuper);

      // 3. Update local state & cache
      setSuperAdmin(updatedSuper);
      localStorage.setItem(LOCAL_STORAGE_SUPER_ADMIN_KEY, JSON.stringify(updatedSuper));

      setIsEditSuperModalOpen(false);
      showToast('주 관리자 정보가 성공적으로 수정되었습니다.');
    } catch (err) {
      console.warn('Super admin info remote save fallback:', err);
      setSuperAdmin(updatedSuper);
      localStorage.setItem(LOCAL_STORAGE_SUPER_ADMIN_KEY, JSON.stringify(updatedSuper));
      setIsEditSuperModalOpen(false);
      showToast('주 관리자 정보가 로컬에 저장되었습니다.');
    } finally {
      setIsSavingSuper(false);
    }
  };

  // 3. Transfer Super Admin (주 관리자 권한 이전)
  const handleOpenTransfer = () => {
    setTransferTargetMode(secondaryAdmins.length > 0 ? 'existing' : 'new');
    setSelectedExistingEmail(secondaryAdmins[0]?.email || '');
    setNewTransferEmail('');
    setNewTransferName('');
    setNewTransferDept('한국어학당 교학팀');
    setConfirmPhrase('');
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (confirmPhrase.trim() !== '이전 확인') {
      showToast("확인을 위해 '이전 확인' 문구를 정확히 입력해 주세요.");
      return;
    }

    let targetEmail = '';
    let targetName = '';
    let targetDept = '';

    if (transferTargetMode === 'existing') {
      const found = secondaryAdmins.find((a) => a.email.toLowerCase() === selectedExistingEmail.toLowerCase());
      if (!found) {
        showToast('이전 대상 관리자를 선택해 주세요.');
        return;
      }
      targetEmail = found.email;
      targetName = found.name;
      targetDept = found.department || '한국어학당';
    } else {
      targetEmail = newTransferEmail.trim().toLowerCase();
      targetName = newTransferName.trim();
      targetDept = newTransferDept.trim() || '한국어학당';

      if (!targetEmail || !targetName) {
        showToast('새 주 관리자의 이메일과 성함을 모두 입력해 주세요.');
        return;
      }
      if (!targetEmail.includes('@') || !targetEmail.includes('.')) {
        showToast('유효한 이메일 주소 형식을 입력해 주세요.');
        return;
      }
    }

    if (targetEmail.toLowerCase() === superAdmin.email.toLowerCase()) {
      showToast('현재 주 관리자에게는 이전할 수 없습니다.');
      return;
    }

    setIsTransferring(true);
    const now = new Date().toISOString();

    // 1. Demoted old super admin to regular admin
    const demotedOldSuper: AdminAccount = {
      ...superAdmin,
      role: 'admin',
    };

    // 2. New Super Admin
    const newSuper: AdminAccount = {
      id: `admin-super-${Date.now()}`,
      email: targetEmail,
      name: targetName,
      department: targetDept,
      role: 'super_admin',
      createdAt: now,
    };

    try {
      // 1. Write new super admin to super_admin_info
      await setDoc(doc(db, 'admins', 'super_admin_info'), newSuper);

      // 2. Write new super admin to its sanitized email doc
      const newDocKey = targetEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
      await setDoc(doc(db, 'admins', newDocKey), newSuper);

      // 3. Demote old super admin in admins collection
      const oldDocKey = superAdmin.email.toLowerCase().replace(/[^a-zA-Z0-9_.-]/g, '_');
      await setDoc(doc(db, 'admins', oldDocKey), demotedOldSuper);

      // 4. Update local states
      setSuperAdmin(newSuper);
      localStorage.setItem(LOCAL_STORAGE_SUPER_ADMIN_KEY, JSON.stringify(newSuper));

      // Remove new super from secondary admins and add old super
      const newSecondary = secondaryAdmins
        .filter((a) => a.email.toLowerCase() !== targetEmail.toLowerCase())
        .concat(demotedOldSuper);
      setSecondaryAdmins(newSecondary);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(newSecondary));

      setIsTransferModalOpen(false);
      showToast(`'${targetName}'(${targetEmail}) 님에게 주 관리자 권한이 성공적으로 이전되었습니다.`);
    } catch (err) {
      console.warn('Super admin transfer remote error:', err);
      setSuperAdmin(newSuper);
      localStorage.setItem(LOCAL_STORAGE_SUPER_ADMIN_KEY, JSON.stringify(newSuper));

      const newSecondary = secondaryAdmins
        .filter((a) => a.email.toLowerCase() !== targetEmail.toLowerCase())
        .concat(demotedOldSuper);
      setSecondaryAdmins(newSecondary);
      localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(newSecondary));

      setIsTransferModalOpen(false);
      showToast(`'${targetName}' 님에게 주 관리자 권한이 로컬에 이전되었습니다.`);
    } finally {
      setIsTransferring(false);
    }
  };

  // 4. Delete Secondary Admin
  const handleDeleteAdmin = async (admin: AdminAccount) => {
    if (admin.email.toLowerCase() === superAdmin.email.toLowerCase()) {
      showToast('주 관리자 계정은 삭제할 수 없습니다. 필요 시 권한 이전을 이용하세요.');
      setDeleteTarget(null);
      return;
    }

    try {
      const docKey = admin.email.replace(/[^a-zA-Z0-9_.-]/g, '_');
      await deleteDoc(doc(db, 'admins', docKey));
      await deleteDoc(doc(db, 'admins', admin.id));
    } catch (err) {
      console.warn('Remote admin deletion failed, proceeding with local update:', err);
    }

    const updated = secondaryAdmins.filter((a) => a.email !== admin.email && a.id !== admin.id);
    setSecondaryAdmins(updated);
    localStorage.setItem(LOCAL_STORAGE_ADMINS_KEY, JSON.stringify(updated));
    setDeleteTarget(null);
    showToast(`'${admin.name}' 관리자 계정이 삭제되었습니다.`);
  };

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 shadow-xs">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1A3B6B] text-white px-4 py-3 rounded-md shadow-lg text-xs flex items-center gap-2 border border-blue-400 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E2E5E8]">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1A3B6B]" />
            <span>포털 관리자 권한 및 계정 관리</span>
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            계명대학교 한국어학당 포털을 관리할 수 있는 주 관리자 및 승인된 관리자 계정 목록입니다.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#1A3B6B] hover:bg-[#132c52] text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>새 관리자 등록</span>
        </button>
      </div>

      {/* Super Admin Special Highlight Card (주 관리자 정보 및 빠른 액션) */}
      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-blue-50/60 border border-amber-200/90 text-xs mb-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
              <Crown className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm text-gray-900">{superAdmin.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200 text-amber-900 border border-amber-300">
                  주 관리자 (Super Admin)
                </span>
                {superAdmin.phone && (
                  <span className="text-gray-500 text-[11px] flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span>{superAdmin.phone}</span>
                  </span>
                )}
              </div>
              <div className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800">{superAdmin.department}</span>
                <span>•</span>
                <span className="text-[#1A3B6B] font-semibold">{superAdmin.email}</span>
                {superAdmin.note && (
                  <>
                    <span>•</span>
                    <span className="text-gray-500 italic">"{superAdmin.note}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Super Admin Action Buttons (정보 수정 & 권한 이전) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenEditSuper}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-amber-100/60 text-amber-900 border border-amber-300 font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-700" />
              <span>주 관리자 정보 수정</span>
            </button>
            <button
              type="button"
              onClick={handleOpenTransfer}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>주 관리자 권한 이전</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admins Table */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8f9fa] border-b border-gray-200 text-gray-700 font-bold">
            <tr>
              <th className="py-3 px-3 w-14 text-center">No</th>
              <th className="py-3 px-3">관리자 성함 / 소속</th>
              <th className="py-3 px-3">Google 로그인 이메일</th>
              <th className="py-3 px-3 w-28 text-center">권한 등급</th>
              <th className="py-3 px-3 w-32 text-center">등록일시</th>
              <th className="py-3 px-3 w-32 text-center">관리 액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {allAdmins.map((admin, idx) => {
              const isSuper = admin.email.toLowerCase() === superAdmin.email.toLowerCase();

              return (
                <tr key={admin.id || admin.email} className={`hover:bg-gray-50/70 transition-colors ${isSuper ? 'bg-amber-50/30 font-medium' : ''}`}>
                  <td className="py-3 px-3 text-center text-gray-400 text-[11px]">
                    {idx + 1}
                  </td>

                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${isSuper ? 'bg-amber-100 text-amber-800 font-bold' : 'bg-blue-100 text-blue-800'}`}>
                        {isSuper ? <Crown className="w-4 h-4 text-amber-600" /> : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{admin.name}</span>
                          {isSuper && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              주 관리자
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {admin.department || '한국어학당'}
                          {admin.phone && ` • ${admin.phone}`}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-gray-700">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="font-semibold text-gray-900">{admin.email}</span>
                    </span>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isSuper ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                        주 관리자
                      </span>
                    ) : admin.role === 'editor' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        콘텐츠 편집자
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                        일반 관리자
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-center text-gray-500 text-[11px]">
                    {admin.createdAt ? admin.createdAt.slice(0, 10) : '-'}
                  </td>

                  <td className="py-3 px-3 text-center">
                    {isSuper ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={handleOpenEditSuper}
                          className="p-1 rounded text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="주 관리자 정보 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleOpenTransfer}
                          className="p-1 rounded text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="주 관리자 권한 이전"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(admin)}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="관리자 권한 해제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ===================== MODAL 1: ADD NEW ADMIN ===================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 border border-gray-200">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1A3B6B]" />
                <span>신규 관리자 계정 등록</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Google 로그인 이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="예: assistant@kmu.ac.kr 또는 gmail.com"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden text-xs"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  해당 관리자가 로그인할 때 사용하는 실제 Google 이메일을 입력해야 합니다.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  관리자 성함 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: 김계명 조교, 이한국 담당관"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  소속 부서 / 직책
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="예: 한국어학당 교학팀, 국제처 유학생지원팀"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  권한 등급
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'editor')}
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden text-xs bg-white"
                >
                  <option value="admin">일반 관리자 (FAQ, 서식, 일정, 문의 등 전체 관리)</option>
                  <option value="editor">콘텐츠 편집자 (FAQ 및 서식 등록/수정 전용)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-[#132c52] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? '등록 중...' : '관리자 추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 2: EDIT SUPER ADMIN INFO (주 관리자 정보 수정) ===================== */}
      {isEditSuperModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 animate-in fade-in duration-150 border border-amber-300">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-600" />
                <span>주 관리자(최고 관리자) 정보 수정</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsEditSuperModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSuperAdminInfo} className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900">
                <span className="font-bold">현재 주 관리자 계정:</span>{' '}
                <span className="font-semibold">{superAdmin.email}</span>
                <p className="text-[11px] text-amber-800 mt-1">
                  ※ 로그인 이메일 변경은 <strong>'주 관리자 권한 이전'</strong> 기능을 통해 안전하게 진행할 수 있습니다.
                </p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  주 관리자 성함 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editSuperName}
                  onChange={(e) => setEditSuperName(e.target.value)}
                  placeholder="예: 최고 관리자 (Cong Tien)"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  소속 부서 및 직책
                </label>
                <input
                  type="text"
                  value={editSuperDept}
                  onChange={(e) => setEditSuperDept(e.target.value)}
                  placeholder="예: 국제교류원 / 한국어학당 총괄"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  비상 연락처 / 내선번호
                </label>
                <input
                  type="text"
                  value={editSuperPhone}
                  onChange={(e) => setEditSuperPhone(e.target.value)}
                  placeholder="예: 053-580-6923"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  관리자 메모 / 담당 업무
                </label>
                <textarea
                  rows={2}
                  value={editSuperNote}
                  onChange={(e) => setEditSuperNote(e.target.value)}
                  placeholder="예: 계명대학교 한국어학당 포털 시스템 총괄 운영"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditSuperModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSavingSuper}
                  className="px-5 py-2 rounded text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSavingSuper ? '저장 중...' : '정보 저장'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 3: TRANSFER SUPER ADMIN (주 관리자 권한 이전) ===================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-5 sm:p-6 animate-in fade-in duration-150 border border-amber-400">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <span>주 관리자(최고 권한) 이전</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              {/* Important Warning Notice */}
              <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-300 text-amber-950 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <div className="font-extrabold text-amber-900 text-xs">
                    ⚠️ 주 관리자 권한 이전 시 주의사항
                  </div>
                  <p>
                    1. 주 관리자 권한을 이전하면 지정된 대상 계정이 <strong>포털의 유일한 최고 관리자</strong>가 됩니다.
                  </p>
                  <p>
                    2. 현재 주 관리자(<span className="font-bold">{superAdmin.name}</span> / {superAdmin.email})는 <strong>일반 관리자(Admin)</strong> 권한으로 안전하게 자동 전환됩니다.
                  </p>
                </div>
              </div>

              {/* Target Selection Mode */}
              <div>
                <label className="block font-bold text-gray-700 mb-1.5">
                  이전 대상 선택 방식
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTransferTargetMode('existing')}
                    disabled={secondaryAdmins.length === 0}
                    className={`p-2.5 rounded border text-center font-bold transition-all cursor-pointer ${
                      transferTargetMode === 'existing'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100 disabled:opacity-40'
                    }`}
                  >
                    기존 등록 관리자 중 선택 ({secondaryAdmins.length}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransferTargetMode('new')}
                    className={`p-2.5 rounded border text-center font-bold transition-all cursor-pointer ${
                      transferTargetMode === 'new'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-2xs'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    신규 관리자 직접 입력
                  </button>
                </div>
              </div>

              {transferTargetMode === 'existing' ? (
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    신임 주 관리자 계정 선택 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedExistingEmail}
                    onChange={(e) => setSelectedExistingEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs bg-white font-medium"
                  >
                    {secondaryAdmins.map((adm) => (
                      <option key={adm.id || adm.email} value={adm.email}>
                        {adm.name} ({adm.email}) - {adm.department}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      신임 주 관리자 Google 이메일 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={newTransferEmail}
                      onChange={(e) => setNewTransferEmail(e.target.value)}
                      placeholder="예: new_director@kmu.ac.kr 또는 gmail.com"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      관리자 성함 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newTransferName}
                      onChange={(e) => setNewTransferName(e.target.value)}
                      placeholder="예: 박계명 원장, 최한국 팀장"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      소속 부서 / 직책
                    </label>
                    <input
                      type="text"
                      value={newTransferDept}
                      onChange={(e) => setNewTransferDept(e.target.value)}
                      placeholder="예: 국제처 한국어학당 원장실"
                      className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Safety Confirmation Step */}
              <div className="pt-2 border-t border-gray-200">
                <label className="block font-bold text-gray-900 mb-1">
                  안전 확인 입력 <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-500 mb-2">
                  실수로 인한 권한 이전을 방지하기 위해 아래 입력란에 <span className="font-extrabold text-amber-700 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">이전 확인</span>을 정확히 입력해 주세요.
                </p>
                <input
                  type="text"
                  required
                  value={confirmPhrase}
                  onChange={(e) => setConfirmPhrase(e.target.value)}
                  placeholder="이전 확인"
                  className="w-full px-3 py-2 rounded border border-gray-300 focus:border-amber-600 focus:outline-hidden text-xs font-bold text-center"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isTransferring || confirmPhrase.trim() !== '이전 확인'}
                  className="px-5 py-2 rounded text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors cursor-pointer shadow-xs disabled:opacity-40 flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>{isTransferring ? '이전 처리 중...' : '주 관리자 권한 이전 실행'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL 4: DELETE ADMIN ===================== */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-5 animate-in fade-in duration-150 border border-gray-200 text-xs">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">관리자 권한 해제</h4>
                <p className="text-gray-500 text-[11px]">선택한 계정의 관리자 권한을 해제합니다.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-1 mb-4">
              <div className="font-bold text-gray-800">{deleteTarget.name}</div>
              <div className="text-gray-500">{deleteTarget.email}</div>
              <div className="text-[11px] text-gray-400">{deleteTarget.department}</div>
            </div>

            <p className="text-gray-600 text-[11px] leading-relaxed mb-4">
              권한을 해제하면 해당 계정은 더 이상 관리자 대시보드에 접근할 수 없습니다. 계속하시겠습니까?
            </p>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDeleteAdmin(deleteTarget)}
                className="px-3.5 py-1.5 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              >
                권한 해제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
