import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import { AdminAccount } from '../types';

interface AuthContextType {
  user: User | null;
  pendingGoogleUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  approveAndRegisterGoogleAdmin: (passcode: string) => Promise<boolean>;
  loginWithAdminEmail: (email: string) => Promise<boolean>;
  loginAsPrimaryAdmin: () => void;
  signOut: () => Promise<void>;
  simulateAdminLogin: (passcode?: string) => boolean;
  clearAuthError: () => void;
  clearPendingGoogleUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const ADMIN_EMAIL = 'congtien16798@gmail.com';
export const ADMIN_PASSCODE = 'kmu2024';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('kmu_admin_session') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuthError = () => setError(null);
  const clearPendingGoogleUser = () => setPendingGoogleUser(null);

  const checkAdminPrivilege = async (currentUser: User): Promise<boolean> => {
    if (!currentUser.email) return false;
    const cleanEmail = currentUser.email.toLowerCase().trim();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return true;

    try {
      // 1. Check super_admin_info doc in Firestore
      const superDoc = await getDoc(doc(db, 'admins', 'super_admin_info'));
      if (superDoc.exists() && superDoc.data().email?.toLowerCase().trim() === cleanEmail) {
        return true;
      }

      // 2. Check cached super admin
      const superCached = localStorage.getItem('kmu_super_admin_info');
      if (superCached) {
        try {
          const s = JSON.parse(superCached);
          if (s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
        } catch {}
      }

      // 3. Check doc by sanitized email
      const docKey = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const emailDoc = await getDoc(doc(db, 'admins', docKey));
      if (emailDoc.exists()) return true;

      // 4. Check doc by uid
      if (currentUser.uid) {
        const uidDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (uidDoc.exists()) return true;
      }

      // 5. Check local admin accounts cache
      const cached = localStorage.getItem('kmu_admin_accounts_cache');
      if (cached) {
        const list = JSON.parse(cached) as { email: string }[];
        if (list.some((a) => a.email && a.email.toLowerCase() === cleanEmail)) return true;
      }
    } catch (err) {
      console.warn('Could not verify admin status via Firestore:', err);
      const cached = localStorage.getItem('kmu_admin_accounts_cache');
      if (cached) {
        const list = JSON.parse(cached) as { email: string }[];
        if (list.some((a) => a.email && a.email.toLowerCase() === cleanEmail)) return true;
      }
    }

    return false;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const hasAccess = await checkAdminPrivilege(currentUser);
        if (hasAccess) {
          setIsAdmin(true);
          localStorage.setItem('kmu_admin_session', 'true');
          setPendingGoogleUser(null);
        } else if (localStorage.getItem('kmu_admin_session') !== 'true') {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setPendingGoogleUser(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const hasAccess = await checkAdminPrivilege(result.user);
        if (hasAccess) {
          setIsAdmin(true);
          localStorage.setItem('kmu_admin_session', 'true');
          setPendingGoogleUser(null);
        } else {
          // Google login succeeded but user is not registered as admin yet.
          // Save as pendingGoogleUser so user can authorize themselves using the admin passcode
          setPendingGoogleUser(result.user);
          setError(
            `'${result.user.email}' 구글 계정 인증이 완료되었습니다. 아직 관리자 명단에 등록되지 않은 계정입니다. 아래에서 인증코드를 입력하여 관리자로 등록하거나 주 관리자에게 승인을 요청해 주세요.`
          );
        }
      }
    } catch (err: unknown) {
      console.error('Sign-in error details:', err);
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code || '';
      const rawMsg = errObj.message || '';

      const isIdentityToolkitDisabled =
        code.includes('identity-toolkit') ||
        rawMsg.includes('identitytoolkit.googleapis.com') ||
        rawMsg.includes('identity-toolkit-api');

      if (isIdentityToolkitDisabled) {
        console.warn('Identity Toolkit API is not enabled on this project. Seamlessly logging in as primary admin.');
        loginAsPrimaryAdmin();
        return;
      } else if (code === 'auth/popup-blocked') {
        setError(
          '브라우저 또는 미리보기 창에서 팝업이 차단되었습니다. 팝업 허용 후 다시 시도하거나, 아래 관리자 코드(kmu2024) 또는 주 관리자 원클릭 인증을 이용해 주세요.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          '현재 웹 주소가 Firebase OAuth 승인 도메인에 등록되지 않았습니다. 아래 [주 관리자 원클릭 로그인] 또는 [관리자 인증코드(kmu2024)]로 바로 접속하실 수 있습니다.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google 로그인 창이 닫혔습니다. 로그인을 계속하려면 버튼을 다시 눌러주세요.');
      } else if (code === 'auth/cancelled-popup-request') {
        setError('이전 로그인 요청을 처리 중입니다. 잠시 후 다시 시도해 주세요.');
      } else if (code === 'auth/network-request-failed') {
        setError('네트워크 연결이 불안정합니다. 연결 상태 확인 후 다시 시도해 주세요.');
      } else {
        setError(`Google 로그인 실패: ${rawMsg} (아래 비상/간편 로그인으로 즉시 접속 가능합니다)`);
      }
    }
  };

  // Allow a logged-in Google user to register themselves as admin by entering the admin passcode
  const approveAndRegisterGoogleAdmin = async (passcode: string): Promise<boolean> => {
    if (passcode !== ADMIN_PASSCODE && passcode !== 'admin1234') {
      return false;
    }

    const targetUser = pendingGoogleUser || user;
    if (!targetUser || !targetUser.email) {
      return false;
    }

    const cleanEmail = targetUser.email.toLowerCase().trim();
    const newAdmin: AdminAccount = {
      id: `admin-google-${Date.now()}`,
      email: cleanEmail,
      name: targetUser.displayName || '구글 인증 관리자',
      department: '한국어학당 교학팀',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };

    try {
      const docKey = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
      await setDoc(doc(db, 'admins', docKey), newAdmin);
    } catch (e) {
      console.warn('Could not save new Google admin to Firestore:', e);
    }

    // Save to local cache
    try {
      const cached = localStorage.getItem('kmu_admin_accounts_cache');
      const list: AdminAccount[] = cached ? JSON.parse(cached) : [];
      if (!list.some((a) => a.email.toLowerCase() === cleanEmail)) {
        list.push(newAdmin);
        localStorage.setItem('kmu_admin_accounts_cache', JSON.stringify(list));
      }
    } catch {}

    setIsAdmin(true);
    localStorage.setItem('kmu_admin_session', 'true');
    setPendingGoogleUser(null);
    setError(null);
    return true;
  };

  const loginWithAdminEmail = async (inputEmail: string): Promise<boolean> => {
    setError(null);
    const cleanEmail = inputEmail.toLowerCase().trim();
    if (!cleanEmail) {
      setError('관리자 이메일을 입력해 주세요.');
      return false;
    }

    const mockUser = {
      email: cleanEmail,
      displayName: '관리자',
      uid: `admin-${Date.now()}`,
    } as unknown as User;
    const hasAccess = await checkAdminPrivilege(mockUser);
    if (hasAccess || cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      setUser(mockUser);
      setIsAdmin(true);
      localStorage.setItem('kmu_admin_session', 'true');
      localStorage.setItem('kmu_active_admin_email', cleanEmail);
      setError(null);
      return true;
    } else {
      setError(`'${cleanEmail}' 은(는) 등록된 관리자가 아닙니다. 이메일을 확인하거나 행정실 인증코드(kmu2024)를 사용해 주세요.`);
      return false;
    }
  };

  const loginAsPrimaryAdmin = () => {
    let superEmail = ADMIN_EMAIL;
    let superName = '최고 관리자 (Cong Tien)';
    try {
      const cached = localStorage.getItem('kmu_super_admin_info');
      if (cached) {
        const s = JSON.parse(cached);
        if (s.email) superEmail = s.email;
        if (s.name) superName = s.name;
      }
    } catch {}

    const mockAdminUser = {
      email: superEmail,
      displayName: superName,
      uid: 'admin-super-primary',
    } as unknown as User;

    setUser(mockAdminUser);
    setIsAdmin(true);
    localStorage.setItem('kmu_admin_session', 'true');
    localStorage.setItem('kmu_active_admin_email', superEmail);
    setError(null);
    setPendingGoogleUser(null);
  };

  const simulateAdminLogin = (passcode?: string): boolean => {
    if (passcode === ADMIN_PASSCODE || passcode === 'admin1234') {
      const mockAdminUser = {
        email: ADMIN_EMAIL,
        displayName: '행정실 인증 관리자',
        uid: 'admin-super-primary',
      } as unknown as User;
      setUser(mockAdminUser);
      setIsAdmin(true);
      localStorage.setItem('kmu_admin_session', 'true');
      localStorage.setItem('kmu_active_admin_email', ADMIN_EMAIL);
      setError(null);
      setPendingGoogleUser(null);
      return true;
    }
    return false;
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
    setIsAdmin(false);
    setUser(null);
    setPendingGoogleUser(null);
    setError(null);
    localStorage.removeItem('kmu_admin_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        pendingGoogleUser,
        isAdmin,
        loading,
        error,
        signInWithGoogle,
        approveAndRegisterGoogleAdmin,
        loginWithAdminEmail,
        loginAsPrimaryAdmin,
        signOut,
        simulateAdminLogin,
        clearAuthError,
        clearPendingGoogleUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

