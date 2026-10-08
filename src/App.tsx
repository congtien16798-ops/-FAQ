import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db, safeSetDoc } from './firebase';
import { Language, FaqItem, DocumentItem, InquiryItem, ScheduleEvent, FaqCategory } from './types';
import { initialFaqs, initialDocuments } from './constants/initialData';
import { INITIAL_SCHEDULES } from './constants/initialSchedules';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { AdminBar } from './components/admin/AdminBar';
import { HeroSection } from './components/HeroSection';
import { FaqSection } from './components/FaqSection';
import { DownloadsSection } from './components/DownloadsSection';
import { InquirySection } from './components/InquirySection';
import { ScheduleSection } from './components/ScheduleSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ThemeCustomizer } from './components/admin/ThemeCustomizer';
import { NoticePopup } from './components/NoticePopup';
import { ChatbotWidget } from './components/ChatbotWidget';
import { IntegratedSearchResults } from './components/IntegratedSearchResults';
import { parseShareUrl } from './services/shareHelper';

const LOCAL_FAQS_KEY = 'kmu_faqs_cache';
const LOCAL_DOCS_KEY = 'kmu_docs_cache';
const LOCAL_INQUIRIES_KEY = 'kmu_inquiries';
const LOCAL_SCHEDULES_KEY = 'kmu_schedules_cache';

const LEGACY_MOCK_IDS = new Set([
  'faq-1', 'faq-2', 'faq-3', 'faq-4', 'faq-5', 'faq-6', 'faq-7', 'faq-8',
  'doc-1', 'doc-2', 'doc-3', 'doc-4', 'doc-5', 'doc-6',
  'sch-spring-1', 'sch-summer-1', 'sch-fall-1', 'sch-winter-1',
  'inq-sample-1', 'inq-sample-2',
]);

function MainApp() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem('kmu_language') as Language) || 'ko';
  });

  const [activeTab, setActiveTab] = useState<'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | 'all'>('all');

  const [targetFaqId, setTargetFaqId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const { targetFaqId } = parseShareUrl();
    return targetFaqId;
  });

  const { config, isDesignMode, setIsDesignMode } = useTheme();
  const { isAdmin } = useAuth();

  // Listen for direct deep links / URL search params / hash
  useEffect(() => {
    const handleUrlNavigation = () => {
      const { targetFaqId: parsedFaqId, targetTab } = parseShareUrl();
      if (parsedFaqId) {
        setTargetFaqId(parsedFaqId);
        setActiveTab('faq');
        setSearchQuery('');
        setSelectedCategory('all');
        if (isDesignMode) setIsDesignMode(false);
      } else if (targetTab && ['faq', 'downloads', 'inquiry', 'schedule', 'admin'].includes(targetTab)) {
        setActiveTab(targetTab as any);
      }
    };

    handleUrlNavigation();
    window.addEventListener('popstate', handleUrlNavigation);
    window.addEventListener('hashchange', handleUrlNavigation);
    return () => {
      window.removeEventListener('popstate', handleUrlNavigation);
      window.removeEventListener('hashchange', handleUrlNavigation);
    };
  }, [isDesignMode, setIsDesignMode]);

// Safe reconciliation: never wipe local posts if Firestore snapshot is empty or delayed
  function mergeWithLocalCache<T extends { id: string }>(
    remoteItems: T[],
    localKey: string,
    onMissingInRemote?: (missingItem: T) => void
  ): T[] {
    try {
      const cachedStr = localStorage.getItem(localKey);
      if (!cachedStr) return remoteItems;
      const localItems = JSON.parse(cachedStr) as T[];
      if (!Array.isArray(localItems) || localItems.length === 0) return remoteItems;

      const remoteIds = new Set(remoteItems.map((r) => r.id));
      const merged = [...remoteItems];

      for (const localItem of localItems) {
        if (!localItem || !localItem.id) continue;
        if (!remoteIds.has(localItem.id)) {
          merged.push(localItem);
          if (onMissingInRemote) {
            onMissingInRemote(localItem);
          }
        }
      }
      return merged;
    } catch {
      return remoteItems;
    }
  }

  // FAQs State: defaults to local cache or clean empty array
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_FAQS_KEY);
      if (cached) {
        return JSON.parse(cached) as FaqItem[];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Documents State: defaults to local cache or clean empty array
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_DOCS_KEY);
      if (cached) {
        return JSON.parse(cached) as DocumentItem[];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Inquiries State: defaults to local cache or clean empty array
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_INQUIRIES_KEY);
      if (cached) {
        return JSON.parse(cached) as InquiryItem[];
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Schedules State: defaults to local cache or clean empty array
  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SCHEDULES_KEY);
      if (cached) {
        return JSON.parse(cached) as ScheduleEvent[];
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync Language
  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('kmu_language', lang);
  };

  // Real-time Firestore Listeners
  useEffect(() => {
    // 1. Real-time FAQs Listener
    const unsubFaqs = onSnapshot(collection(db, 'faqs'), (snap) => {
      const list: FaqItem[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: data.id || docSnap.id } as FaqItem);
      });

      const reconciled = mergeWithLocalCache(list, LOCAL_FAQS_KEY, (missing) => {
        safeSetDoc(doc(db, 'faqs', missing.id), missing).catch(console.warn);
      });

      reconciled.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

      setFaqs(reconciled);
      try {
        localStorage.setItem(LOCAL_FAQS_KEY, JSON.stringify(reconciled));
      } catch {
        // ignore
      }
    }, (err) => {
      console.warn('Real-time faqs listener error, using local fallback:', err);
    });

    // 2. Real-time Documents Listener
    const unsubDocs = onSnapshot(collection(db, 'documents'), (snap) => {
      const list: DocumentItem[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: data.id || docSnap.id } as DocumentItem);
      });

      const reconciled = mergeWithLocalCache(list, LOCAL_DOCS_KEY, (missing) => {
        safeSetDoc(doc(db, 'documents', missing.id), missing).catch(console.warn);
      });

      reconciled.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return 0;
      });

      setDocuments(reconciled);
      try {
        localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(reconciled));
      } catch {
        // ignore
      }
    }, (err) => {
      console.warn('Real-time documents listener error, using local fallback:', err);
    });

    // 3. Real-time Inquiries Listener
    const unsubInquiries = onSnapshot(collection(db, 'inquiries'), (snap) => {
      const list: InquiryItem[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: data.id || docSnap.id } as InquiryItem);
      });

      const reconciled = mergeWithLocalCache(list, LOCAL_INQUIRIES_KEY, (missing) => {
        safeSetDoc(doc(db, 'inquiries', missing.id), missing).catch(console.warn);
      });

      reconciled.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInquiries(reconciled);
      try {
        localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(reconciled));
        localStorage.setItem('kmu_inquiries_cache', JSON.stringify(reconciled));
      } catch {
        // ignore
      }
    }, (err) => {
      console.warn('Real-time inquiries listener error:', err);
    });

    // 4. Real-time Schedules Listener
    const unsubSchedules = onSnapshot(collection(db, 'schedules'), (snap) => {
      const list: ScheduleEvent[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({ ...data, id: data.id || docSnap.id } as ScheduleEvent);
      });

      const reconciled = mergeWithLocalCache(list, LOCAL_SCHEDULES_KEY, (missing) => {
        safeSetDoc(doc(db, 'schedules', missing.id), missing).catch(console.warn);
      });

      reconciled.sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return (a.startDate || '').localeCompare(b.startDate || '');
      });

      setSchedules(reconciled);
      try {
        localStorage.setItem(LOCAL_SCHEDULES_KEY, JSON.stringify(reconciled));
      } catch {
        // ignore
      }
    }, (err) => {
      console.warn('Real-time schedules listener error:', err);
    });

    return () => {
      unsubFaqs();
      unsubDocs();
      unsubInquiries();
      unsubSchedules();
    };
  }, []);

  // Persist local caches
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_FAQS_KEY, JSON.stringify(faqs));
    } catch {
      // ignore
    }
  }, [faqs]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(inquiries));
    } catch {
      // ignore
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SCHEDULES_KEY, JSON.stringify(schedules));
    } catch {
      // ignore
    }
  }, [schedules]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F9] selection:bg-[#1A3B6B] selection:text-white">
      {/* Top Floating Admin Bar if logged in */}
      <AdminBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main GNB Navbar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSearchQuery('');
          setActiveTab(tab);
        }}
      />

      {/* Content Router */}
      <main className="flex-1">
        {/* ADMIN DASHBOARD: Shows all 7 management tabs (Design, FAQ, Docs, Inquiries, Schedules, Chatbot, Accounts) */}
        {activeTab === 'admin' ? (
          <AdminDashboard
            faqs={faqs}
            setFaqs={setFaqs}
            documents={documents}
            setDocuments={setDocuments}
            inquiries={inquiries}
            setInquiries={setInquiries}
            schedules={schedules}
            setSchedules={setSchedules}
            onExitAdmin={() => setActiveTab('faq')}
          />
        ) : isDesignMode ? (
          /* DESIGN MODE: Standalone Fullscreen Customizer if opened directly from portal */
          <ThemeCustomizer
            faqs={faqs}
            documents={documents}
            schedules={schedules}
            currentLang={currentLang}
            onExit={() => setIsDesignMode(false)}
          />
        ) : (
          /* STUDENT PORTAL VIEWS */
          <>
            {/* Hero Section with Comprehensive Search Bar */}
            {config.showHeroBanner !== false && (
              <HeroSection
                currentLang={currentLang}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            )}

            {/* If user searched in the large search bar: Show Comprehensive Unified Search Results */}
            {searchQuery.trim() !== '' ? (
              <IntegratedSearchResults
                faqs={faqs}
                documents={documents}
                schedules={schedules}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                currentLang={currentLang}
                onSelectLanguage={(lang) => setCurrentLang(lang)}
                onNavigateTab={(tab) => {
                  setSearchQuery('');
                  setActiveTab(tab);
                }}
              />
            ) : (
              <>
                {/* TAB: Frequently Asked Questions */}
                {activeTab === 'faq' && (
                  <FaqSection
                    faqs={faqs}
                    currentLang={currentLang}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    searchQuery={searchQuery}
                    targetFaqId={targetFaqId}
                    onClearTargetFaqId={() => setTargetFaqId(null)}
                  />
                )}

                {/* TAB: Downloads & Forms Repository */}
                {activeTab === 'downloads' && (
                  <DownloadsSection
                    documents={documents}
                    currentLang={currentLang}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                )}

                {/* TAB: Academic Schedule (한국어학당 일정) */}
                {activeTab === 'schedule' && (
                  <ScheduleSection
                    schedules={schedules}
                    currentLang={currentLang}
                    onNavigateInquiry={() => setActiveTab('inquiry')}
                  />
                )}

                {/* TAB: 1:1 Fast Inquiry Registration (1:1 빠른 문의) */}
                {activeTab === 'inquiry' && (
                  <InquirySection
                    currentLang={currentLang}
                    onSuccessSubmitted={() => {}}
                    onNavigateSchedule={() => setActiveTab('schedule')}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Campus Administrative Footer */}
      {!isDesignMode && <Footer currentLang={currentLang} />}

      {/* Notice Popup Modal or Floating Banner */}
      {!isDesignMode && (
        <NoticePopup
          config={config}
          currentLang={currentLang}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* 24/7 Knowledge Guide Chatbot */}
      {!isDesignMode && activeTab !== 'admin' && (
        <ChatbotWidget
          currentLang={currentLang}
          faqs={faqs}
          documents={documents}
          schedules={schedules}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
