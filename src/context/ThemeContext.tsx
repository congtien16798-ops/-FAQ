import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { initialSiteConfig } from '../constants/initialData';
import { SiteConfig, ConfigArchiveItem } from '../types';

interface ThemeContextType {
  config: SiteConfig;
  draftConfig: SiteConfig;
  liveConfig: SiteConfig;
  archives: ConfigArchiveItem[];
  isDesignMode: boolean;
  setIsDesignMode: (val: boolean) => void;
  updateDraft: (updates: Partial<SiteConfig>) => void;
  updateConfig: (updates: Partial<SiteConfig>) => Promise<boolean>;
  saveDraftToLive: (publishTitle?: string) => Promise<boolean>;
  resetDraftToLive: () => void;
  resetToFactoryDefaults: () => Promise<void>;
  createArchiveSnapshot: (title?: string, note?: string) => Promise<ConfigArchiveItem>;
  restoreArchive: (archiveId: string, toDraftOnly?: boolean) => Promise<boolean>;
  deleteArchive: (archiveId: string) => Promise<boolean>;
  isSaving: boolean;
  saveMessage: string | null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'kmu_theme_config';
const LOCAL_STORAGE_DRAFT_KEY = 'kmu_theme_draft';
const LOCAL_STORAGE_ARCHIVES_KEY = 'kmu_theme_archives';

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

  const [archives, setArchives] = useState<ConfigArchiveItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_ARCHIVES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      // Initial default archive snapshot
      const defaultArchive: ConfigArchiveItem = {
        id: 'initial-system-default',
        timestamp: new Date().toISOString(),
        title: '계명대학교 정통 네이비 기본 테마 (출고 기본본)',
        author: '시스템 관리자',
        note: '초기 설치 시점의 표준 공식 템플릿입니다.',
        configSnapshot: initialSiteConfig,
      };
      return [defaultArchive];
    } catch {
      return [];
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

  // On mount: listen to real-time site_config changes
  useEffect(() => {
    const docRef = doc(db, 'site_config', 'main');
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as Partial<SiteConfig>;
        const merged: SiteConfig = { ...initialSiteConfig, ...remoteData };
        setConfig(merged);
        setDraftConfig((prev) => (isDesignMode ? prev : merged));
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        applyCssVariables(merged);
      } else {
        applyCssVariables(config);
      }
    }, (err) => {
      console.warn('Real-time site_config listener warning, using local cache:', err);
      applyCssVariables(config);
    });

    return () => unsub();
  }, [isDesignMode]);

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

  const saveDraftToLive = async (publishTitle?: string): Promise<boolean> => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const now = new Date();
      const toSave = {
        ...draftConfig,
        updatedAt: now.toISOString(),
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

      // Automatically create a version archive snapshot (보관)
      const archiveItem: ConfigArchiveItem = {
        id: `pub-${now.getTime()}`,
        timestamp: now.toISOString(),
        title:
          publishTitle ||
          `게시 적용본 (${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
          })})`,
        author: '관리자',
        note: '학생 포털에 실시간 게시 및 반영된 설정입니다.',
        configSnapshot: toSave,
      };

      const updatedArchives = [archiveItem, ...archives.filter((a) => a.id !== archiveItem.id).slice(0, 29)];
      setArchives(updatedArchives);
      try {
        localStorage.setItem(LOCAL_STORAGE_ARCHIVES_KEY, JSON.stringify(updatedArchives));
      } catch {
        // ignore
      }

      setSaveMessage('설정이 성공적으로 게시 및 적용되었으며, 보관함에 새 버전이 보관되었습니다.');
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

  const createArchiveSnapshot = async (title?: string, note?: string): Promise<ConfigArchiveItem> => {
    const now = new Date();
    const newArchive: ConfigArchiveItem = {
      id: `arc-${now.getTime()}`,
      timestamp: now.toISOString(),
      title:
        title?.trim() ||
        `수동 보관본 (${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        })})`,
      author: '관리자',
      note: note?.trim() || '현재 디자인 모드 작업 상태가 보관되었습니다.',
      configSnapshot: { ...draftConfig },
    };

    const updated = [newArchive, ...archives.filter((a) => a.id !== newArchive.id).slice(0, 29)];
    setArchives(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_ARCHIVES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return newArchive;
  };

  const restoreArchive = async (archiveId: string, toDraftOnly = false): Promise<boolean> => {
    const target = archives.find((a) => a.id === archiveId);
    if (!target) return false;

    if (toDraftOnly) {
      setDraftConfig(target.configSnapshot);
      try {
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(target.configSnapshot));
      } catch {
        // ignore
      }
      if (isDesignMode) {
        applyCssVariables(target.configSnapshot);
      }
      return true;
    } else {
      setConfig(target.configSnapshot);
      setDraftConfig(target.configSnapshot);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(target.configSnapshot));
        localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(target.configSnapshot));
      } catch {
        // ignore
      }
      applyCssVariables(target.configSnapshot);

      try {
        await setDoc(doc(db, 'site_config', 'main'), target.configSnapshot);
      } catch {
        // ignore
      }
      return true;
    }
  };

  const deleteArchive = async (archiveId: string): Promise<boolean> => {
    const updated = archives.filter((a) => a.id !== archiveId);
    setArchives(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_ARCHIVES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return true;
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

  const effectiveConfig = isDesignMode ? draftConfig : config;

  return (
    <ThemeContext.Provider
      value={{
        config: effectiveConfig,
        draftConfig,
        liveConfig: config,
        archives,
        isDesignMode,
        setIsDesignMode,
        updateDraft,
        updateConfig,
        saveDraftToLive,
        resetDraftToLive,
        resetToFactoryDefaults,
        createArchiveSnapshot,
        restoreArchive,
        deleteArchive,
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
