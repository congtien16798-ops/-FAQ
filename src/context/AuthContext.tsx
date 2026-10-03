import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  simulateAdminLogin: (passcode?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_EMAIL = 'congtien16798@gmail.com';
const ADMIN_PASSCODE = 'kmu2024';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('kmu_admin_session') === 'true';
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAdminPrivilege = async (currentUser: User): Promise<boolean> => {
    if (!currentUser.email) return false;
    const cleanEmail = currentUser.email.toLowerCase().trim();
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return true;

    try {
      // 1. Check super_admin_info
      const superCached = localStorage.getItem('kmu_super_admin_info');
      if (superCached) {
        try {
          const s = JSON.parse(superCached);
          if (s.email && s.email.toLowerCase().trim() === cleanEmail) return true;
        } catch {}
      }

      const superDoc = await getDoc(doc(db, 'admins', 'super_admin_info'));
      if (superDoc.exists() && superDoc.data().email?.toLowerCase().trim() === cleanEmail) {
        return true;
      }

      // 2. Check doc by sanitized email
      const docKey = cleanEmail.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const emailDoc = await getDoc(doc(db, 'admins', docKey));
      if (emailDoc.exists()) return true;

      // 3. Check doc by uid
      const uidDoc = await getDoc(doc(db, 'admins', currentUser.uid));
      if (uidDoc.exists()) return true;

      // 3. Check local cache
      const cached = localStorage.getItem('kmu_admin_accounts_cache');
      if (cached) {
        const list = JSON.parse(cached) as { email: string }[];
        if (list.some(a => a.email.toLowerCase() === cleanEmail)) return true;
      }
    } catch (err) {
      console.warn('Could not verify admin status via Firestore:', err);
      const cached = localStorage.getItem('kmu_admin_accounts_cache');
      if (cached) {
        const list = JSON.parse(cached) as { email: string }[];
        if (list.some(a => a.email.toLowerCase() === cleanEmail)) return true;
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
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const hasAccess = await checkAdminPrivilege(result.user);
        if (hasAccess) {
          setIsAdmin(true);
          localStorage.setItem('kmu_admin_session', 'true');
        } else {
          setError(`'${result.user.email}' 계정은 등록된 관리자가 아닙니다. 최고 관리자에게 승인을 요청해 주세요.`);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google 로그인에 실패했습니다.';
      setError(msg);
      console.error('Sign-in error:', err);
    }
  };

  const simulateAdminLogin = (passcode?: string): boolean => {
    if (passcode === ADMIN_PASSCODE || passcode === 'admin1234') {
      setIsAdmin(true);
      localStorage.setItem('kmu_admin_session', 'true');
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
        simulateAdminLogin,
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
