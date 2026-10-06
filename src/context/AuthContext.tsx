import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface GoogleAdminUser {
  email: string;
  name: string;
  photoUrl?: string;
  id?: string;
  uid?: string;
}

interface AuthContextType {
  user: GoogleAdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary authorized admin Google email
export const PRIMARY_ADMIN_EMAIL = 'congtien16798@gmail.com';
const LOCAL_STORAGE_GOOGLE_USER_KEY = 'kmu_admin_google_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleAdminUser | null>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GOOGLE_USER_KEY);
      if (saved) {
        return JSON.parse(saved) as GoogleAdminUser;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_GOOGLE_USER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as GoogleAdminUser;
        return !!parsed.email;
      }
    } catch {
      // ignore
    }
    return false;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const verifyIsAdmin = async (email: string): Promise<boolean> => {
    if (!email) return false;
    const clean = email.toLowerCase().trim();
    if (clean === PRIMARY_ADMIN_EMAIL.toLowerCase()) return true;

    try {
      // 1. Check doc by sanitized email
      const docKey = clean.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const emailDoc = await getDoc(doc(db, 'admins', docKey));
      if (emailDoc.exists()) return true;

      // 2. Check super_admin_info doc in Firestore
      const superDoc = await getDoc(doc(db, 'admins', 'super_admin_info'));
      if (superDoc.exists() && superDoc.data()?.email?.toLowerCase().trim() === clean) {
        return true;
      }

      // 3. Check local cache fallback
      try {
        const cached = localStorage.getItem('kmu_admin_list');
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.some((a: any) => a.email?.toLowerCase().trim() === clean)) {
            return true;
          }
        }
      } catch {
        // ignore
      }
    } catch (err) {
      console.warn('Firestore admin verification fallback:', err);
    }
    return false;
  };

  useEffect(() => {
    // Listen to Firebase Auth state if active
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser && fbUser.email) {
        const isAuth = await verifyIsAdmin(fbUser.email);
        if (isAuth) {
          const adminUser: GoogleAdminUser = {
            email: fbUser.email,
            name: fbUser.displayName || '관리자',
            photoUrl: fbUser.photoURL || undefined,
            id: fbUser.uid,
            uid: fbUser.uid,
          };
          setUser(adminUser);
          setIsAdmin(true);
          localStorage.setItem(LOCAL_STORAGE_GOOGLE_USER_KEY, JSON.stringify(adminUser));
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);

    try {
      // Standard Firebase Auth signInWithPopup (Avoids origin_mismatch)
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        const email = result.user.email.toLowerCase().trim();
        const isAuthorized = await verifyIsAdmin(email);
        if (isAuthorized) {
          const adminUser: GoogleAdminUser = {
            email: result.user.email,
            name: result.user.displayName || '관리자',
            photoUrl: result.user.photoURL || undefined,
            id: result.user.uid,
            uid: result.user.uid,
          };
          setUser(adminUser);
          setIsAdmin(true);
          localStorage.setItem(LOCAL_STORAGE_GOOGLE_USER_KEY, JSON.stringify(adminUser));
          setError(null);
        } else {
          setError(
            `'${result.user.email}' 구글 계정은 관리자로 등록되어 있지 않습니다. 관리자 권한 구글 계정(${PRIMARY_ADMIN_EMAIL})으로 로그인해 주세요.`
          );
        }
      }
    } catch (err: unknown) {
      console.error('Google Sign-In Error:', err);
      const errObj = err as { code?: string; message?: string };
      const code = errObj.code || '';
      const msg = errObj.message || '';

      if (code === 'auth/popup-blocked' || msg.includes('popup_blocked')) {
        setError('브라우저에서 Google 로그인 팝업이 차단되었습니다. 브라우저 주소창에서 팝업을 허용하신 후 다시 시도해 주세요.');
      } else if (code === 'auth/popup-closed-by-user' || msg.includes('popup_closed') || msg.includes('access_denied')) {
        setError('Google 로그인 창이 닫혔습니다. 로그인을 진행하려면 [Google 계정으로 관리자 로그인] 버튼을 눌러주세요.');
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setError('현재 배포 도메인이 Firebase 승인 도메인에 등록되지 않았습니다. Firebase 콘솔(Authentication > Settings > Authorized Domains)에서 배포 도메인을 추가해 주세요.');
      } else if (msg.includes('identity-toolkit') || msg.includes('identitytoolkit.googleapis.com')) {
        setError('Google Cloud 인증 서비스가 초기화 중입니다. 잠시 후 [Google 계정으로 관리자 로그인]을 다시 클릭해 주세요.');
      } else {
        setError(`Google 로그인 안내: ${msg || '로그인을 완료하지 못했습니다. 다시 시도해 주세요.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setUser(null);
    setIsAdmin(false);
    setError(null);
    localStorage.removeItem(LOCAL_STORAGE_GOOGLE_USER_KEY);
    localStorage.removeItem('kmu_admin_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        error,
        signInWithGoogle,
        signOut,
        clearError,
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
