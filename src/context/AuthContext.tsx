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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          localStorage.setItem('kmu_admin_session', 'true');
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
            if (adminDoc.exists()) {
              setIsAdmin(true);
              localStorage.setItem('kmu_admin_session', 'true');
            } else if (localStorage.getItem('kmu_admin_session') !== 'true') {
              setIsAdmin(false);
            }
          } catch {
            if (localStorage.getItem('kmu_admin_session') !== 'true') {
              setIsAdmin(false);
            }
          }
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
      if (result.user.email === ADMIN_EMAIL) {
        setIsAdmin(true);
        localStorage.setItem('kmu_admin_session', 'true');
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
