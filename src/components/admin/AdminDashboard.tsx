import React, { useState } from 'react';
import { 
  Shield, 
  Sparkles, 
  HelpCircle, 
  FileText, 
  MessageSquare, 
  LogOut, 
  AlertCircle,
  Bot,
  Calendar,
  Users,
  X,
  Bell
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
import { NoticePopupManager } from './NoticePopupManager';

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
  const { user, isAdmin, loading, error, signInWithGoogle, signOut, clearError } = useAuth();
  const { config, isDesignMode, setIsDesignMode } = useTheme();

  const [activeAdminTab, setActiveAdminTab] = useState<'design' | 'popup' | 'faqs' | 'docs' | 'inquiries' | 'schedules' | 'chatbot' | 'accounts'>('design');

  const pendingInquiriesCount = inquiries.filter((i) => i.status === 'pending').length;

  // If not logged in as Admin, show Google Account Exclusive Login
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <div className="bg-white rounded-lg border border-[#E2E5E8] p-8 shadow-sm text-center">
          <div className="w-16 h-16 rounded-full bg-[#1A3B6B]/10 text-[#1A3B6B] flex items-center justify-center mx-auto mb-5 border border-[#1A3B6B]/20">
            <Shield className="w-8 h-8 text-[#1A3B6B]" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-6">
            계명대학교 한국어학당 관리자 인증
          </h2>

          {/* Error Message Box */}
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 text-red-700 text-xs rounded-md border border-red-200 text-left flex items-start justify-between gap-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{error}</p>
              </div>
              <button
                type="button"
                onClick={clearError}
                className="text-red-400 hover:text-red-700 p-0.5 cursor-pointer shrink-0"
                title="닫기"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Exclusive Google Sign-In Button */}
          <div>
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full py-3 px-4 rounded-md text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 flex items-center justify-center gap-3 shadow-xs hover:shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
              <span>{loading ? 'Google 인증 진행 중...' : 'Google 계정으로 관리자 로그인'}</span>
            </button>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 text-center">
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

        {/* Logged-in Google Admin Profile & Logout */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="flex items-center gap-2.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            {user?.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={user.name || 'Google Profile'}
                className="w-7 h-7 rounded-full border border-gray-300 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-blue-100 text-[#1A3B6B] flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name[0] : 'G'}
              </div>
            )}
            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-gray-900 truncate max-w-[120px]">{user?.name || '관리자'}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-[#1A3B6B]">
                  Google 인증
                </span>
              </div>
              <div className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">{user?.email}</div>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors shrink-0 whitespace-nowrap cursor-pointer shadow-2xs"
            title="관리자 로그아웃"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Tab Switcher Buttons */}
      <div className="bg-white rounded-md border border-[#E2E5E8] p-2 mb-6 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll sm:flex-wrap pb-1 sm:pb-0">
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
            onClick={() => setActiveAdminTab('popup')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'popup'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>공지 팝업 관리</span>
            {config.popupEnabled && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" title="팝업 활성화 상태" />
            )}
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
            {pendingInquiriesCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                activeAdminTab === 'inquiries'
                  ? 'bg-amber-400 text-slate-900'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                미답변 {pendingInquiriesCount}
              </span>
            )}
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
            <span>한국어학당 일정 ({schedules.length})</span>
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
            <span>안내 챗봇 설정</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('accounts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors shrink-0 whitespace-nowrap cursor-pointer ${
              activeAdminTab === 'accounts'
                ? 'bg-[#1A3B6B] text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>관리자 계정 관리</span>
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
            onExit={() => setActiveAdminTab('popup')}
          />
        )}
        {activeAdminTab === 'popup' && <NoticePopupManager />}
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
        {activeAdminTab === 'accounts' && <AdminAccountManager />}
      </div>
    </div>
  );
};
