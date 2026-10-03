import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  LogIn, 
  Lock, 
  KeyRound, 
  LogOut, 
  User as UserIcon,
  AlertCircle,
  Bot,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { FaqItem, DocumentItem, InquiryItem, ScheduleEvent } from '../../types';
import { ThemeCustomizer } from './ThemeCustomizer';
import { FaqManager } from './FaqManager';
import { DocumentManager } from './DocumentManager';
import { InquiryManager } from './InquiryManager';
import { ChatbotManager } from './ChatbotManager';
import { ScheduleManager } from './ScheduleManager';
import { AdminAccountManager } from './AdminAccountManager';

interface AdminDashboardProps {
  faqs: FaqItem[];
  setFaqs: React.Dispatch<React.SetStateAction<FaqItem[]>>;
  documents: DocumentItem[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentItem[]>>;
  inquiries: InquiryItem[];
  setInquiries: React.Dispatch<React.SetStateAction<InquiryItem[]>>;
  schedules: ScheduleEvent[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
  onExitAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  faqs,
  setFaqs,
  documents,
  setDocuments,
  inquiries,
  setInquiries,
  schedules,
  setSchedules,
  onExitAdmin,
}) => {
  const {
    user,
    pendingGoogleUser,
    isAdmin,
    signInWithGoogle,
    approveAndRegisterGoogleAdmin,
    loginWithAdminEmail,
    loginAsPrimaryAdmin,
    signOut,
    simulateAdminLogin,
    error: authError,
    clearAuthError,
    clearPendingGoogleUser,
  } = useAuth();
  const { isDesignMode, setIsDesignMode } = useTheme();

  const [activeAdminTab, setActiveAdminTab] = useState<'design' | 'faqs' | 'docs' | 'inquiries' | 'schedules' | 'chatbot' | 'admins'>('design');
  const [passcode, setPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Quick email login state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [showEmailLoginForm, setShowEmailLoginForm] = useState(false);

  // Pending Google user passcode state
  const [pendingPasscode, setPendingPasscode] = useState('');
  const [pendingError, setPendingError] = useState(false);
  const [isRegisteringGoogleAdmin, setIsRegisteringGoogleAdmin] = useState(false);

  const handlePasscodeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = simulateAdminLogin(passcode);
    if (!success) {
      setPasscodeError(true);
    } else {
      setPasscodeError(false);
    }
  };

  const handleEmailQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithAdminEmail(adminEmailInput);
  };

  const handleRegisterPendingGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisteringGoogleAdmin(true);
    try {
      const ok = await approveAndRegisterGoogleAdmin(pendingPasscode);
      if (!ok) {
        setPendingError(true);
      } else {
        setPendingError(false);
      }
    } finally {
      setIsRegisteringGoogleAdmin(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If not logged in as Admin, show login screen
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-md border border-[#E2E5E8] p-8 shadow-xs text-center">
          <div className="w-14 h-14 rounded-full bg-[#1A3B6B]/10 text-[#1A3B6B] flex items-center justify-center mx-auto mb-4 border border-[#1A3B6B]/20">
            <Shield className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-gray-900 mb-1">
            계명대학교 관리자 인증
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            한국어학당 유학생 포털 관리자 전용 로그인 페이지입니다.
          </p>

          {/* Pending Google User Authorization Form */}
          {pendingGoogleUser && (
            <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-md text-left animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A3B6B] mb-1">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Google 계정 인증 성공</span>
              </div>
              <p className="text-[11px] text-gray-600 mb-3">
                <span className="font-semibold text-gray-800">{pendingGoogleUser.email}</span> 계정으로 로그인되었습니다. 최초 1회 행정실 관리자 코드(<span className="font-mono font-bold text-[#1A3B6B]">kmu2024</span>)를 입력하시면 관리자 명단에 등록되어 즉시 접속됩니다.
              </p>
              <form onSubmit={handleRegisterPendingGoogle} className="space-y-2">
                <input
                  type="password"
                  value={pendingPasscode}
                  onChange={(e) => {
                    setPendingPasscode(e.target.value);
                    setPendingError(false);
                  }}
                  placeholder="행정실 관리자 코드 입력 (kmu2024)"
                  className="w-full px-3 py-2 text-xs rounded border border-blue-300 focus:outline-none focus:border-[#1A3B6B] bg-white"
                />
                {pendingError && (
                  <p className="text-[10px] text-red-600">
                    인증코드가 올바르지 않습니다. (kmu2024 입력)
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isRegisteringGoogleAdmin}
                    className="flex-1 py-2 bg-[#1A3B6B] hover:bg-[#122a4d] text-white text-xs font-bold rounded transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isRegisteringGoogleAdmin ? '등록 중...' : '관리자로 승인 등록 및 접속'}
                  </button>
                  <button
                    type="button"
                    onClick={clearPendingGoogleUser}
                    className="px-2.5 py-2 border border-gray-300 bg-white hover:bg-gray-100 text-gray-600 text-xs rounded cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          {authError && !pendingGoogleUser && (
            <div className="mb-5 p-3.5 bg-amber-50/90 text-amber-900 text-xs rounded-md border border-amber-300 text-left space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-amber-950">
                    {authError.includes('Identity Toolkit') || authError.includes('691355247972')
                      ? 'Firebase Auth (Identity Toolkit API) 설정 안내'
                      : '관리자 로그인 알림'}
                  </div>
                  <p className="leading-relaxed text-[11px] text-amber-800">{authError}</p>
                </div>
              </div>

              {/* Direct Instant Action Buttons */}
              <div className="pt-1 border-t border-amber-200/80 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={loginAsPrimaryAdmin}
                  className="w-full py-2 bg-[#1A3B6B] hover:bg-[#122a4d] text-white text-xs font-bold rounded shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>⚡ 주 관리자(congtien16798@gmail.com) 계정으로 즉시 접속</span>
                </button>
                <button
                  type="button"
                  onClick={() => simulateAdminLogin('kmu2024')}
                  className="w-full py-1.5 bg-white hover:bg-gray-50 border border-amber-300 text-gray-800 text-[11px] font-semibold rounded cursor-pointer transition-colors"
                >
                  행정실 코드(kmu2024)로 즉시 접속
                </button>
              </div>
            </div>
          )}

          {/* Option 1: Firebase Google Auth */}
          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded text-xs font-bold text-gray-800 bg-white border border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.86c2.26-2.09 3.68-5.17 3.68-9.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.37 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              <span>{isLoggingIn ? 'Google 인증 진행 중...' : 'Google 계정으로 관리자 로그인'}</span>
            </button>

            {/* Quick Primary Admin Button for Fast Access */}
            <button
              type="button"
              onClick={loginAsPrimaryAdmin}
              className="w-full py-2 px-3 rounded text-[11px] font-semibold text-blue-900 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <span>⚡ 주 관리자(congtien16798@gmail.com) 원클릭 접속</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-gray-400 text-[11px]">또는 간편 인증코드 입력</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Option 2: Administrative Passcode */}
            <form onSubmit={handlePasscodeLogin} className="space-y-3 text-left">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-700">
                    행정실 관리자 코드 (테스트용: kmu2024)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowEmailLoginForm(!showEmailLoginForm)}
                    className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                  >
                    {showEmailLoginForm ? '코드 입력으로 전환' : '등록 이메일로 인증'}
                  </button>
                </div>

                {!showEmailLoginForm ? (
                  <>
                    <div className="relative">
                      <input
                        type="password"
                        value={passcode}
                        onChange={(e) => {
                          setPasscode(e.target.value);
                          setPasscodeError(false);
                        }}
                        placeholder="인증코드 입력"
                        className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
                      />
                      <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-2.5" />
                    </div>
                    {passcodeError && (
                      <p className="text-[11px] text-red-600 mt-1">
                        인증코드가 올바르지 않습니다. (kmu2024 입력)
                      </p>
                    )}
                  </>
                ) : (
                  <div className="space-y-1.5">
                    <input
                      type="email"
                      value={adminEmailInput}
                      onChange={(e) => setAdminEmailInput(e.target.value)}
                      placeholder="등록된 관리자 이메일 (예: congtien16798@gmail.com)"
                      className="w-full px-3 py-2 text-xs rounded border border-gray-300 focus:outline-none focus:border-[#1A3B6B]"
                    />
                    <button
                      type="button"
                      onClick={handleEmailQuickLogin}
                      className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded cursor-pointer"
                    >
                      이메일 확인 및 로그인
                    </button>
                  </div>
                )}
              </div>

              {!showEmailLoginForm && (
                <button
                  type="submit"
                  className="w-full py-2 bg-[#1A3B6B] hover:bg-[#122a4d] text-white text-xs font-bold rounded transition-colors shadow-2xs cursor-pointer"
                >
                  관리자 모드 접속
                </button>
              )}
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={onExitAdmin}
              className="text-xs text-gray-500 hover:text-gray-800 font-medium cursor-pointer"
            >
              ← 학생용 가이드 홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When Logged In as Admin:
  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Admin Header Bar */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-4 mb-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#1A3B6B] text-white flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              계명대학교 한국어학당 종합 관리자 센터
            </h2>
            <p className="text-xs text-gray-500">
              디자인 테마 커스텀, FAQ 관리, 서식 배포, 1:1 학생 문의를 통합 관리합니다.
            </p>
          </div>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll sm:flex-wrap pb-1 sm:pb-0 -mx-1 px-1">
          <button
            onClick={() => setActiveAdminTab('design')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'design'
                ? 'bg-[#D97736] text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>디자인 모드</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('faqs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'faqs'
                ? 'bg-[#1A3B6B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ 관리 ({faqs.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'docs'
                ? 'bg-[#1A3B6B] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>서식 관리 ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('inquiries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'inquiries'
                ? 'bg-[#2E7D5B] text-white'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>1:1 빠른 문의 ({inquiries.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('schedules')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'schedules'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>일정표 관리 ({schedules.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('chatbot')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'chatbot'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#1A3B6B]" />
            <span>AI 챗봇 설정</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('admins')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'admins'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
            <span>관리자 계정 관리</span>
          </button>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs text-red-600 hover:bg-red-50 border border-red-200 transition-colors ml-1 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Render Active Tab */}
      <div>
        {activeAdminTab === 'design' && (
          <ThemeCustomizer
            faqs={faqs}
            documents={documents}
            schedules={schedules}
          />
        )}
        {activeAdminTab === 'faqs' && <FaqManager faqs={faqs} setFaqs={setFaqs} />}
        {activeAdminTab === 'docs' && (
          <DocumentManager documents={documents} setDocuments={setDocuments} />
        )}
        {activeAdminTab === 'inquiries' && (
          <InquiryManager inquiries={inquiries} setInquiries={setInquiries} />
        )}
        {activeAdminTab === 'schedules' && (
          <ScheduleManager schedules={schedules} setSchedules={setSchedules} />
        )}
        {activeAdminTab === 'chatbot' && <ChatbotManager />}
        {activeAdminTab === 'admins' && <AdminAccountManager />}
      </div>
    </div>
  );
};
