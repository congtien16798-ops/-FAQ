import React from 'react';
import {
  CalendarCheck,
  FileBadge,
  FileText,
  Building2,
  ScrollText,
  GraduationCap,
  HeartPulse,
  HeartHandshake,
  BookOpen,
  Compass,
  CreditCard,
  Coins,
  Briefcase,
  HelpCircle,
  Globe,
  UserCheck,
  Bell,
  Award,
  MapPin,
  Sparkles,
  LucideIcon
} from 'lucide-react';

export interface CategoryIconOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const CATEGORY_ICON_OPTIONS: CategoryIconOption[] = [
  { id: 'GraduationCap', label: '학사/수업', icon: GraduationCap },
  { id: 'CalendarCheck', label: '출결/일정', icon: CalendarCheck },
  { id: 'FileBadge', label: '비자/체류', icon: FileBadge },
  { id: 'FileText', label: '서식/행정', icon: FileText },
  { id: 'Building2', label: '기숙사/캠퍼스', icon: Building2 },
  { id: 'Compass', label: '유학생활', icon: Compass },
  { id: 'CreditCard', label: '장학/등록금', icon: CreditCard },
  { id: 'Coins', label: '금융/비용', icon: Coins },
  { id: 'HeartHandshake', label: '상담/지원', icon: HeartHandshake },
  { id: 'HeartPulse', label: '건강/보험', icon: HeartPulse },
  { id: 'BookOpen', label: '도서/한국어', icon: BookOpen },
  { id: 'ScrollText', label: '공지/증명서', icon: ScrollText },
  { id: 'Briefcase', label: '진로/알바', icon: Briefcase },
  { id: 'Globe', label: '국제교류', icon: Globe },
  { id: 'UserCheck', label: '학생인증', icon: UserCheck },
  { id: 'Award', label: '장학/성취', icon: Award },
  { id: 'Bell', label: '알림/소식', icon: Bell },
  { id: 'MapPin', label: '시설/위치', icon: MapPin },
  { id: 'Sparkles', label: '특별과정', icon: Sparkles },
  { id: 'HelpCircle', label: '일반/기타', icon: HelpCircle },
];

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  CalendarCheck,
  FileBadge,
  FileText,
  Building2,
  Compass,
  CreditCard,
  Coins,
  HeartHandshake,
  HeartPulse,
  BookOpen,
  ScrollText,
  Briefcase,
  Globe,
  UserCheck,
  Award,
  Bell,
  MapPin,
  Sparkles,
  HelpCircle,
};

export const renderCategoryIcon = (iconName?: string, className: string = 'w-4 h-4'): React.ReactNode => {
  if (!iconName || iconName.trim() === '') {
    return <HelpCircle className={className} />;
  }

  const raw = iconName.trim();

  // 1. Direct exact match
  if (ICON_MAP[raw]) {
    const IconComp = ICON_MAP[raw];
    return <IconComp className={className} />;
  }

  // 2. Normalized match (remove hyphens, underscores, spaces, lowercase)
  const cleanKey = raw.toLowerCase().replace(/[-_\s]/g, '');
  const matchedKey = Object.keys(ICON_MAP).find(
    (k) => k.toLowerCase().replace(/[-_\s]/g, '') === cleanKey
  );
  if (matchedKey && ICON_MAP[matchedKey]) {
    const IconComp = ICON_MAP[matchedKey];
    return <IconComp className={className} />;
  }

  // 3. Fallback by semantic keyword and standard category IDs
  const lower = raw.toLowerCase();
  if (lower.includes('calendar') || lower.includes('date') || lower.includes('attendance') || lower === '출결') {
    return <CalendarCheck className={className} />;
  }
  if (lower.includes('visa') || lower.includes('badge') || lower.includes('stay') || lower === '비자') {
    return <FileBadge className={className} />;
  }
  if (lower.includes('dorm') || lower.includes('building') || lower.includes('housing') || lower === '기숙사') {
    return <Building2 className={className} />;
  }
  if (lower.includes('scroll') || lower.includes('admin') || lower === '행정' || lower === '증명서') {
    return <ScrollText className={className} />;
  }
  if (lower.includes('compass') || lower.includes('life') || lower === '유학생활' || lower === '생활') {
    return <Compass className={className} />;
  }
  if (lower.includes('card') || lower.includes('money') || lower.includes('scholarship') || lower.includes('tuition')) {
    return <CreditCard className={className} />;
  }
  if (lower.includes('coin')) {
    return <Coins className={className} />;
  }
  if (lower.includes('academic') || lower.includes('graduat') || lower.includes('degree') || lower.includes('class')) {
    return <GraduationCap className={className} />;
  }
  if (lower.includes('file') || lower.includes('doc') || lower.includes('form')) {
    return <FileText className={className} />;
  }
  if (lower.includes('book') || lower.includes('study')) {
    return <BookOpen className={className} />;
  }
  if (lower.includes('heart') || lower.includes('hand') || lower.includes('counsel')) {
    return <HeartHandshake className={className} />;
  }
  if (lower.includes('pulse') || lower.includes('health') || lower.includes('medic') || lower.includes('insur')) {
    return <HeartPulse className={className} />;
  }
  if (lower.includes('globe') || lower.includes('world') || lower.includes('internat')) {
    return <Globe className={className} />;
  }
  if (lower.includes('user') || lower.includes('student')) {
    return <UserCheck className={className} />;
  }
  if (lower.includes('award') || lower.includes('prize')) {
    return <Award className={className} />;
  }
  if (lower.includes('bell') || lower.includes('alert') || lower.includes('notice')) {
    return <Bell className={className} />;
  }
  if (lower.includes('pin') || lower.includes('map') || lower.includes('locat')) {
    return <MapPin className={className} />;
  }
  if (lower.includes('sparkle') || lower.includes('star')) {
    return <Sparkles className={className} />;
  }
  if (lower.includes('brief') || lower.includes('work') || lower.includes('job')) {
    return <Briefcase className={className} />;
  }

  return <HelpCircle className={className} />;
};
