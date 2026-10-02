import React, { useState, useEffect } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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

const LOCAL_FAQS_KEY = 'kmu_faqs_cache';
const LOCAL_DOCS_KEY = 'kmu_docs_cache';
const LOCAL_INQUIRIES_KEY = 'kmu_inquiries';
const LOCAL_SCHEDULES_KEY = 'kmu_schedules_cache';

function MainApp() {
  const [currentLang, setCurrentLang] = useState<Language>(() => {
    return (localStorage.getItem('kmu_language') as Language) || 'ko';
  });

  const [activeTab, setActiveTab] = useState<'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin'>('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FaqCategory | 'all'>('all');

  const { config, isDesignMode, setIsDesignMode } = useTheme();
  const { isAdmin } = useAuth();

  // FAQs State
  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_FAQS_KEY);
      return cached ? JSON.parse(cached) : initialFaqs;
    } catch {
      return initialFaqs;
    }
  });

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_DOCS_KEY);
      return cached ? JSON.parse(cached) : initialDocuments;
    } catch {
      return initialDocuments;
    }
  });

  // Inquiries State
  const [inquiries, setInquiries] = useState<InquiryItem[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_INQUIRIES_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return [
      {
        id: 'inq-sample-1',
        studentId: '20241289',
        name: 'LE VAN QUAN',
        content: '한국어학당 3급 재학 중인데 다음 학기 D-4 비자 연장 시 은행 잔고증명서 금액 기준이 어떻게 되나요?',
        status: 'pending',
        adminNote: '대구출입국 최신 공시 기준(1,000만원 이상) 안내 예정',
        createdAt: '2026-09-29T10:15:00Z',
        updatedAt: '2026-09-29T10:15:00Z',
      },
      {
        id: 'inq-sample-2',
        studentId: '20239841',
        name: 'WANG JIA',
        content: '명교생활관 2학기 퇴사 후 원룸으로 이사할 예정인데, 체류지 변경 신고를 학교에서 대행해 주시나요?',
        status: 'resolved',
        adminNote: '2026-09-30 관할 구청(달서구청) 또는 하이코리아 전자민원 직접 접수 안내 완료',
        createdAt: '2026-09-28T14:20:00Z',
        updatedAt: '2026-09-30T09:00:00Z',
      },
    ];
  });

  // Schedules State
  const [schedules, setSchedules] = useState<ScheduleEvent[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_SCHEDULES_KEY);
      return cached ? JSON.parse(cached) : INITIAL_SCHEDULES;
    } catch {
      return INITIAL_SCHEDULES;
    }
  });

  // Sync Language
  const handleLanguageChange = (lang: Language) => {
    setCurrentLang(lang);
    localStorage.setItem('kmu_language', lang);
  };

  // Fetch Firestore FAQs, Documents, Inquiries on boot
  useEffect(() => {
    // 1. FAQs
    const fetchFaqs = async () => {
      try {
        const snap = await getDocs(collection(db, 'faqs'));
        if (!snap.empty) {
          const list: FaqItem[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as FaqItem);
          });
          list.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
          });
          setFaqs(list);
          localStorage.setItem(LOCAL_FAQS_KEY, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('Could not load remote faqs, using initial dataset:', err);
      }
    };

    // 2. Documents
    const fetchDocs = async () => {
      try {
        const snap = await getDocs(collection(db, 'documents'));
        if (!snap.empty) {
          const list: DocumentItem[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as DocumentItem);
          });
          list.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            if (a.order !== undefined) return -1;
            if (b.order !== undefined) return 1;
            return 0;
          });
          setDocuments(list);
          localStorage.setItem(LOCAL_DOCS_KEY, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('Could not load remote documents, using initial dataset:', err);
      }
    };

    // 3. Inquiries
    const fetchInquiries = async () => {
      if (isAdmin) {
        try {
          const snap = await getDocs(collection(db, 'inquiries'));
          if (!snap.empty) {
            const list: InquiryItem[] = [];
            snap.forEach((docSnap) => {
              list.push(docSnap.data() as InquiryItem);
            });
            // Sort by date desc
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setInquiries(list);
            localStorage.setItem(LOCAL_INQUIRIES_KEY, JSON.stringify(list));
          }
        } catch (err) {
          console.warn('Could not load remote inquiries:', err);
        }
      }
    };

    // 4. Schedules
    const fetchSchedules = async () => {
      try {
        const snap = await getDocs(collection(db, 'schedules'));
        if (!snap.empty) {
          const list: ScheduleEvent[] = [];
          snap.forEach((docSnap) => {
            list.push(docSnap.data() as ScheduleEvent);
          });
          list.sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
            return a.startDate.localeCompare(b.startDate);
          });
          setSchedules(list);
          localStorage.setItem(LOCAL_SCHEDULES_KEY, JSON.stringify(list));
        }
      } catch (err) {
        console.warn('Could not load remote schedules:', err);
      }
    };

    fetchFaqs();
    fetchDocs();
    fetchInquiries();
    fetchSchedules();
  }, [isAdmin]);

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
        {/* DESIGN MODE: Split View Customizer */}
        {isDesignMode ? (
          <ThemeCustomizer />
        ) : activeTab === 'admin' ? (
          /* ADMIN DASHBOARD */
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
        ) : (
          /* STUDENT PORTAL VIEWS */
          <>
            {/* Hero Section with Comprehensive Search Bar */}
            <HeroSection
              currentLang={currentLang}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* If user searched in the large search bar: Show Comprehensive Unified Search Results */}
            {searchQuery.trim() !== '' ? (
              <IntegratedSearchResults
                faqs={faqs}
                documents={documents}
                searchQuery={searchQuery}
                onClearSearch={() => setSearchQuery('')}
                currentLang={currentLang}
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
                  />
                )}

                {/* TAB: Downloads & Forms Repository */}
                {activeTab === 'downloads' && (
                  <DownloadsSection
                    documents={documents}
                    currentLang={currentLang}
                  />
                )}

                {/* TAB: 1:1 Fast Inquiry Registration */}
                {activeTab === 'inquiry' && (
                  <InquirySection
                    currentLang={currentLang}
                    onSuccessSubmitted={() => {}}
                    onNavigateSchedule={() => setActiveTab('schedule')}
                  />
                )}

                {/* TAB: Academic Schedule */}
                {activeTab === 'schedule' && (
                  <ScheduleSection
                    schedules={schedules}
                    currentLang={currentLang}
                    onNavigateInquiry={() => setActiveTab('inquiry')}
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

      {/* 24/7 AI Guide Chatbot */}
      {!isDesignMode && activeTab !== 'admin' && (
        <ChatbotWidget
          currentLang={currentLang}
          faqs={faqs}
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
