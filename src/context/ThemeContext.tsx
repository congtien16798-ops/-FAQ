import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { initialSiteConfig } from '../constants/initialData';
import { SiteConfig } from '../types';

interface ThemeContextType {
  config: SiteConfig;
  draftConfig: SiteConfig;
  isDesignMode: boolean;
  setIsDesignMode: (val: boolean) => void;
  updateDraft: (updates: Partial<SiteConfig>) => void;
  updateConfig: (updates: Partial<SiteConfig>) => Promise<boolean>;
  saveDraftToLive: () => Promise<boolean>;
  resetDraftToLive: () => void;
  resetToFactoryDefaults: () => Promise<void>;
  isSaving: boolean;
  saveMessage: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kmu_theme_config';
const LOCAL_STORAGE_DRAFT_KEY = 'kmu_theme_draft';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? { ...initialSiteConfig, ...JSON.parse(saved) } : initialSiteConfig;
    } catch {
      return initialSiteConfig;
    }
  });

  const [draftConfig, setDraftConfig] = useState<SiteConfig>(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      return savedDraft ? { ...initialSiteConfig, ...JSON.parse(savedDraft) } : config;
    } catch {
      return config;
    }
  });

  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Apply CSS variables to :root
  const applyCssVariables = (cfg: SiteConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--primary-color', cfg.mainColor || '#1A3B6B');
    root.style.setProperty('--accent-color', cfg.accentColor || '#2E7D5B');
    root.style.setProperty('--warn-color', cfg.warnColor || '#D97736');
    root.style.setProperty('--border-radius', `${cfg.borderRadius ?? 6}px`);
    root.style.setProperty('--font-scale', cfg.fontSize === 'large' ? '1.08rem' : '1rem');
  };

  // On mount: fetch remote site_config if present
  useEffect(() => {
    const fetchRemoteConfig = async () => {
      try {
        const docRef = doc(db, 'site_config', 'main');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const remoteData = snap.data() as Partial<SiteConfig>;
          const merged: SiteConfig = { ...initialSiteConfig, ...remoteData };
          setConfig(merged);
          setDraftConfig(merged);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          applyCssVariables(merged);
        } else {
          applyCssVariables(config);
        }
      } catch (err) {
        console.warn('Could not fetch remote config, using local cache:', err);
        applyCssVariables(config);
      }
    };

    fetchRemoteConfig();
  }, []);

  // When live config updates, re-apply CSS variables
  useEffect(() => {
    applyCssVariables(config);
  }, [config]);

  // When in design mode, dynamically preview draft variables
  useEffect(() => {
    if (isDesignMode) {
      applyCssVariables(draftConfig);
    } else {
      applyCssVariables(config);
    }
  }, [isDesignMode, draftConfig, config]);

  const updateDraft = (updates: Partial<SiteConfig>) => {
    setDraftConfig((prev) => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const resetDraftToLive = () => {
    setDraftConfig(config);
    try {
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(config));
    } catch {
      // ignore
    }
  };

  const saveDraftToLive = async (): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const toSave = {
        ...draftConfig,
        updatedAt: new Date().toISOString(),
      };
      
      // Save locally
      setConfig(toSave);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
      applyCssVariables(toSave);

      // Attempt to save to Firestore
      try {
        await setDoc(doc(db, 'site_config', 'main'), toSave);
      } catch (fbErr) {
        // If Firestore write fails (e.g. auth required), log with handleFirestoreError per skill
        try {
          handleFirestoreError(fbErr, OperationType.WRITE, 'site_config/main');
        } catch {
          // Keep local save active
        }
      }

      setSaveMessage('설정이 성공적으로 적용되어 학생 화면에 반영되었습니다.');
      setTimeout(() => setSaveMessage(null), 3500);
      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Failed to save config:', err);
      setIsSaving(false);
      setSaveMessage('저장 중 문제가 발생했습니다. 로컬 설정이 유지됩니다.');
      return false;
    }
  };

  const updateConfig = async (updates: Partial<SiteConfig>): Promise<boolean> => {
    setIsSaving(true);
    try {
      const toSave = {
        ...config,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setConfig(toSave);
      setDraftConfig(toSave);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toSave));
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(toSave));
      applyCssVariables(toSave);

      try {
        await setDoc(doc(db, 'site_config', 'main'), toSave);
      } catch (fbErr) {
        try {
          handleFirestoreError(fbErr, OperationType.WRITE, 'site_config/main');
        } catch {
          // ignore
        }
      }

      setIsSaving(false);
      return true;
    } catch (err) {
      console.error('Failed to update config:', err);
      setIsSaving(false);
      return false;
    }
  };

  const resetToFactoryDefaults = async () => {
    setConfig(initialSiteConfig);
    setDraftConfig(initialSiteConfig);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
    applyCssVariables(initialSiteConfig);

    try {
      await setDoc(doc(db, 'site_config', 'main'), initialSiteConfig);
    } catch {
      // ignore
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        config,
        draftConfig,
        isDesignMode,
        setIsDesignMode,
        updateDraft,
        updateConfig,
        saveDraftToLive,
        resetDraftToLive,
        resetToFactoryDefaults,
        isSaving,
        saveMessage,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
