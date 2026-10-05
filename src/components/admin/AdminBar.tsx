import React from 'react';
import { Shield, Sparkles, LayoutDashboard, Eye, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface AdminBarProps {
  activeTab: 'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin';
  setActiveTab: (tab: 'faq' | 'downloads' | 'inquiry' | 'schedule' | 'admin') => void;
}

export const AdminBar: React.FC<AdminBarProps> = ({ activeTab, setActiveTab }) => {
  const { user, signOut, isAdmin } = useAuth();
  const { isDesignMode, setIsDesignMode } = useTheme();

  if (!isAdmin) return null;

  return (
    <div className="bg-[#122a4d] text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs flex flex-wrap items-center justify-between gap-2 border-b border-blue-900 shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold tracking-wide flex items-center gap-1.5 text-[11px] sm:text-xs">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>계명대 관리자 모드</span>
        </span>
        {user?.email && (
          <span className="hidden md:inline text-blue-200/80">({user.email})</span>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
        {/* Admin Dashboard Tab */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] sm:text-xs transition-colors cursor-pointer min-h-[28px] ${
            activeTab === 'admin'
              ? 'bg-blue-600 text-white font-semibold'
              : 'bg-white/10 hover:bg-white/20 text-blue-100'
          }`}
        >
          <LayoutDashboard className="w-3 h-3" />
          <span>대시보드</span>
        </button>

        {/* View Student Portal */}
        <button
          onClick={() => {
            setIsDesignMode(false);
            setActiveTab('faq');
          }}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] sm:text-xs bg-white/10 hover:bg-white/20 text-blue-100 transition-colors cursor-pointer min-h-[28px]"
        >
          <Eye className="w-3 h-3" />
          <span className="hidden sm:inline">학생 포털</span>
          <span className="sm:hidden">포털</span>
        </button>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="flex items-center gap-1 px-2 py-1 rounded text-[11px] sm:text-xs text-red-200 hover:text-white hover:bg-red-900/40 transition-colors ml-0.5 cursor-pointer min-h-[28px]"
          title="로그아웃"
          aria-label="로그아웃"
        >
          <LogOut className="w-3 h-3" />
          <span>종료</span>
        </button>
      </div>
    </div>
  );
};
