import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Search,
  Star,
  MessageSquare,
  X
} from 'lucide-react';
import { ScheduleEvent, ScheduleTerm, ScheduleEventType, Language } from '../types';
import { translations } from '../constants/translations';
import { translateText } from '../services/translator';

interface ScheduleSectionProps {
  schedules: ScheduleEvent[];
  currentLang: Language;
  onNavigateInquiry?: () => void;
}

const TERM_NAMES: Record<ScheduleTerm, { ko: string; en: string; bg: string; border: string; text: string }> = {
  spring: { ko: '봄학기', en: 'Spring Term', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
  summer: { ko: '여름학기', en: 'Summer Term', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
  fall: { ko: '가을학기', en: 'Fall Term', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
  winter: { ko: '겨울학기', en: 'Winter Term', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
  special: { ko: '특별과정', en: 'Special Programs', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
};

const TYPE_CONFIG: Record<ScheduleEventType, { label: string; en: string; bg: string; text: string; dot: string }> = {
  academic: { label: '학사/수업', en: 'Academic', bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-600' },
  exam: { label: '시험/평가', en: 'Exam', bg: 'bg-amber-100', text: 'text-amber-900', dot: 'bg-amber-500' },
  holiday: { label: '공휴일/휴강', en: 'Holiday', bg: 'bg-rose-100', text: 'text-rose-800', dot: 'bg-rose-500' },
  activity: { label: '문화체험', en: 'Culture', bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  admission: { label: '모집/등록', en: 'Admission', bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-600' },
};

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedules,
  currentLang,
  onNavigateInquiry,
}) => {
  const t = translations[currentLang] || translations.ko;

  const [viewMode, setViewMode] = useState<'annual' | 'monthly' | 'weekly'>('annual');
  const [selectedTerm, setSelectedTerm] = useState<ScheduleTerm | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ScheduleEventType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Month state for monthly view: default to current date or first schedule's date
  const [calendarDate, setCalendarDate] = useState<Date>(() => {
    return new Date(2025, 2, 1); // March 2025 (Spring start)
  });

  // Week state for weekly view: default to calendarDate
  const [weekDate, setWeekDate] = useState<Date>(() => {
    return new Date(2025, 2, 3); // Monday March 3, 2025
  });

  // Dynamic Translations Map for schedules
  const [translatedMap, setTranslatedMap] = useState<Record<string, { title: string; desc: string }>>({});

  useEffect(() => {
    if (currentLang === 'ko') {
      setTranslatedMap({});
      return;
    }

    let isMounted = true;
    const translateAll = async () => {
      const map: Record<string, { title: string; desc: string }> = {};
      for (const ev of schedules) {
        if (!ev) continue;
        const transTitle = ev.titleEn && currentLang === 'en'
          ? ev.titleEn
          : await translateText(ev.title, currentLang, 'ko');
        const transDesc = ev.description
          ? await translateText(ev.description, currentLang, 'ko')
          : '';
        map[ev.id] = { title: transTitle, desc: transDesc };
      }
      if (isMounted) {
        setTranslatedMap(map);
      }
    };

    translateAll();
    return () => {
      isMounted = false;
    };
  }, [currentLang, schedules]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return (schedules || []).filter((item) => {
      if (!item || item.hidden) return false;
      if (selectedTerm !== 'all' && item.term !== selectedTerm) return false;
      if (selectedType !== 'all' && item.type !== selectedType) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const trans = translatedMap[item.id];
        const matchTitle = (item.title || '').toLowerCase().includes(q) ||
          (trans?.title || '').toLowerCase().includes(q) ||
          (item.titleEn || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q) ||
          (trans?.desc || '').toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    }).sort((a, b) => {
      // sort by startDate
      return a.startDate.localeCompare(b.startDate);
    });
  }, [schedules, selectedTerm, selectedType, searchQuery, translatedMap]);

  // Helper getters
  const getEventTitle = (ev: ScheduleEvent) => {
    if (currentLang === 'ko') return ev.title;
    if (currentLang === 'en' && ev.titleEn) return ev.titleEn;
    return translatedMap[ev.id]?.title || ev.title;
  };

  const getEventDesc = (ev: ScheduleEvent) => {
    if (currentLang === 'ko') return ev.description || '';
    return translatedMap[ev.id]?.desc || ev.description || '';
  };

  // Calendar calculations
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth(); // 0-indexed

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean; events: ScheduleEvent[] }[] = [];

    // Prev month padding
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = month === 0 ? 12 : month;
      const prevY = month === 0 ? year - 1 : year;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        events: schedules.filter((s) => !s.hidden && s.startDate <= dateStr && s.endDate >= dateStr),
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: true,
        events: schedules.filter((s) => !s.hidden && s.startDate <= dateStr && s.endDate >= dateStr),
      });
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remainingDays = 42 - days.length; // 6 rows of 7
    if (remainingDays > 0 && remainingDays < 14) {
      for (let dayNum = 1; dayNum <= remainingDays; dayNum++) {
        const nextM = month === 11 ? 1 : month + 2;
        const nextY = month === 11 ? year + 1 : year;
        const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
        days.push({
          dateStr,
          dayNum,
          isCurrentMonth: false,
          events: schedules.filter((s) => !s.hidden && s.startDate <= dateStr && s.endDate >= dateStr),
        });
      }
    }

    return days;
  }, [year, month, schedules]);

  // Week calculation (Monday through Sunday)
  const weekDays = useMemo(() => {
    const current = new Date(weekDate);
    const day = current.getDay();
    // Diff to get to Monday (if day is 0/Sunday, treat as 7)
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(current.setDate(diff));

    const days: { dateStr: string; dayNum: number; dayNameKo: string; dayNameEn: string; dateObj: Date; events: ScheduleEvent[] }[] = [];
    const dayNamesKo = ['월', '화', '수', '목', '금', '토', '일'];
    const dayNamesEn = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const dateStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: nextDay.getDate(),
        dayNameKo: dayNamesKo[i],
        dayNameEn: dayNamesEn[i],
        dateObj: nextDay,
        events: schedules.filter((s) => !s.hidden && s.startDate <= dateStr && s.endDate >= dateStr),
      });
    }
    return days;
  }, [weekDate, schedules]);

  // Handle month prev/next
  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };
  const handleTodayMonth = () => {
    setCalendarDate(new Date());
  };

  // Handle week prev/next
  const handlePrevWeek = () => {
    const prev = new Date(weekDate);
    prev.setDate(prev.getDate() - 7);
    setWeekDate(prev);
  };
  const handleNextWeek = () => {
    const next = new Date(weekDate);
    next.setDate(next.getDate() + 7);
    setWeekDate(next);
  };
  const handleTodayWeek = () => {
    setWeekDate(new Date());
  };

  // Term-grouped schedules for annual view
  const termsOrder: ScheduleTerm[] = ['spring', 'summer', 'fall', 'winter', 'special'];

  return (
    <section className="max-w-6xl mx-auto px-4 py-8 sm:py-10">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-lg border border-[#E2E5E8] p-5 sm:p-6 mb-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {t.scheduleTitle || '일정표'}
            </h2>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md border border-gray-200 self-start md:self-center shrink-0">
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-white text-[#1A3B6B] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.viewAnnual || '연간 일정'}
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-[#1A3B6B] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.viewMonthly || '월간 캘린더'}
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-white text-[#1A3B6B] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {t.viewWeekly || '주간 일정'}
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Term & Type Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Term Selector */}
            <div className="flex items-center bg-gray-50 rounded border border-gray-200 p-0.5 text-xs">
              <button
                onClick={() => setSelectedTerm('all')}
                className={`px-2.5 py-1 rounded transition-colors font-medium ${
                  selectedTerm === 'all'
                    ? 'bg-[#1A3B6B] text-white shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.allTerms || '전체 학기'}
              </button>
              {(['spring', 'summer', 'fall', 'winter'] as ScheduleTerm[]).map((term) => (
                <button
                  key={term}
                  onClick={() => setSelectedTerm(term)}
                  className={`px-2.5 py-1 rounded transition-colors font-medium ${
                    selectedTerm === term
                      ? 'bg-[#1A3B6B] text-white shadow-2xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{TERM_NAMES[term].ko}</span>
                </button>
              ))}
            </div>

            {/* Type Selector Dropdown / Chips */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="px-2.5 py-1.5 rounded border border-gray-200 bg-white text-xs text-gray-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
            >
              <option value="all">전체 일정 분류</option>
              <option value="academic">학사 / 수업</option>
              <option value="exam">시험 / 성취도 평가</option>
              <option value="holiday">공휴일 / 휴강</option>
              <option value="activity">한국 문화체험</option>
              <option value="admission">모집 / 등록</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div className="relative min-w-[200px] sm:min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="일정명, 장소, 내용 검색..."
              className="w-full pl-8 pr-7 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: ANNUAL VIEW (연간 학사 일정표) */}
      {viewMode === 'annual' && (
        <div className="space-y-6">
          {termsOrder.map((termKey) => {
            if (selectedTerm !== 'all' && selectedTerm !== termKey) return null;
            const termInfo = TERM_NAMES[termKey];
            const termEvents = filteredSchedules.filter((e) => e.term === termKey);

            if (termEvents.length === 0 && selectedTerm === termKey) {
              return (
                <div key={termKey} className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-xs">
                  해당 학기에 검색 조건과 일치하는 일정이 없습니다.
                </div>
              );
            }
            if (termEvents.length === 0) return null;

            return (
              <div
                key={termKey}
                className="bg-white rounded-lg border border-[#E2E5E8] overflow-hidden shadow-xs"
              >
                {/* Term Header */}
                <div className={`${termInfo.bg} px-4 sm:px-5 py-3 border-b ${termInfo.border} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <h3 className={`font-bold text-sm sm:text-base ${termInfo.text}`}>
                      {currentLang === 'en' ? termInfo.en : termInfo.ko}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-gray-200 text-gray-700">
                    총 {termEvents.length}개 일정
                  </span>
                </div>

                {/* Term Events Table / List */}
                <div className="divide-y divide-gray-100">
                  {termEvents.map((ev) => {
                    const typeCfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.academic;
                    const isMultiDay = ev.startDate !== ev.endDate;

                    return (
                      <div
                        key={ev.id}
                        onClick={() => setSelectedEvent(ev)}
                        className="p-4 sm:p-4.5 hover:bg-blue-50/40 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        {/* Left: Date & Type */}
                        <div className="sm:w-48 shrink-0 flex items-center sm:flex-col sm:items-start gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${typeCfg.dot}`}></span>
                            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.text}`}>
                              {currentLang === 'en' ? typeCfg.en : typeCfg.label}
                            </span>
                            {ev.important && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5">
                                <Star className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                                <span>주요</span>
                              </span>
                            )}
                          </div>

                          <div className="font-mono text-xs sm:text-sm font-bold text-gray-900 sm:mt-1">
                            {ev.startDate}
                            {isMultiDay && <span className="text-gray-400 font-normal"> ~ {ev.endDate}</span>}
                          </div>
                        </div>

                        {/* Middle: Title & Description */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-gray-900 group-hover:text-[#1A3B6B] transition-colors flex items-center gap-2">
                            <span>{getEventTitle(ev)}</span>
                            {currentLang !== 'ko' && ev.title && (
                              <span className="text-xs text-gray-400 font-normal truncate">
                                ({ev.title})
                              </span>
                            )}
                          </h4>
                          {getEventDesc(ev) && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">
                              {getEventDesc(ev)}
                            </p>
                          )}
                        </div>

                        {/* Right: Time & Location Badges */}
                        <div className="shrink-0 flex sm:flex-col items-end gap-1.5 text-[11px] text-gray-500 pt-1 sm:pt-0">
                          {ev.time && (
                            <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span>{ev.time}</span>
                            </div>
                          )}
                          {ev.location && ev.location !== '-' && (
                            <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 max-w-[200px] truncate">
                              <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: MONTHLY VIEW (월간 캘린더) */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-lg border border-[#E2E5E8] overflow-hidden shadow-xs">
          {/* Calendar Header Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900">
                {year}년 {month + 1}월
              </h3>
              <span className="text-xs text-gray-500">
                ({new Date(year, month).toLocaleString('en', { month: 'long' })})
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer shadow-2xs"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTodayMonth}
                className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer shadow-2xs"
              >
                오늘
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer shadow-2xs"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 text-center text-xs font-bold text-gray-600 bg-gray-100/60 py-2">
            <span className="text-rose-600">일 (Sun)</span>
            <span>월 (Mon)</span>
            <span>화 (Tue)</span>
            <span>수 (Wed)</span>
            <span>목 (Thu)</span>
            <span>금 (Fri)</span>
            <span className="text-blue-600">토 (Sat)</span>
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {calendarDays.map((dayItem, idx) => {
              const isToday =
                new Date().toISOString().slice(0, 10) === dayItem.dateStr;
              const hasEvents = dayItem.events.length > 0;

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] sm:min-h-[110px] p-1 sm:p-1.5 transition-colors relative flex flex-col justify-between ${
                    dayItem.isCurrentMonth
                      ? isToday
                        ? 'bg-blue-50/60 ring-1 ring-inset ring-[#1A3B6B]'
                        : 'bg-white hover:bg-gray-50/80'
                      : 'bg-gray-50/50 text-gray-400'
                  }`}
                >
                  {/* Day Number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        isToday
                          ? 'bg-[#1A3B6B] text-white'
                          : dayItem.isCurrentMonth
                          ? idx % 7 === 0
                            ? 'text-rose-600'
                            : idx % 7 === 6
                            ? 'text-blue-600'
                            : 'text-gray-800'
                          : 'text-gray-400'
                      }`}
                    >
                      {dayItem.dayNum}
                    </span>
                    {hasEvents && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1A3B6B]"></span>
                    )}
                  </div>

                  {/* Day Events Pills */}
                  <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                    {dayItem.events.slice(0, 3).map((ev) => {
                      const typeCfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.academic;
                      return (
                        <div
                          key={ev.id}
                          onClick={() => setSelectedEvent(ev)}
                          className={`text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded truncate cursor-pointer transition-transform hover:scale-[1.02] shadow-2xs ${typeCfg.bg} ${typeCfg.text}`}
                          title={`${ev.title} (${ev.time || ''})`}
                        >
                          {ev.important && '★ '}
                          {getEventTitle(ev)}
                        </div>
                      );
                    })}
                    {dayItem.events.length > 3 && (
                      <span className="text-[10px] text-gray-500 font-medium block text-right">
                        +{dayItem.events.length - 3}개 더보기
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: WEEKLY TIMELINE (주간 일정표) */}
      {viewMode === 'weekly' && (
        <div className="bg-white rounded-lg border border-[#E2E5E8] overflow-hidden shadow-xs">
          {/* Week Header Controls */}
          <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-gray-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {weekDays[0].dateStr} ~ {weekDays[6].dateStr} 주간 일정
              </h3>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer shadow-2xs"
                title="이전 주"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleTodayWeek}
                className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-100 text-xs font-semibold text-gray-700 cursor-pointer shadow-2xs"
              >
                이번 주
              </button>
              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer shadow-2xs"
                title="다음 주"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7 Days List */}
          <div className="divide-y divide-gray-100">
            {weekDays.map((dayItem) => {
              const isToday =
                new Date().toISOString().slice(0, 10) === dayItem.dateStr;

              return (
                <div
                  key={dayItem.dateStr}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-start gap-4 ${
                    isToday ? 'bg-blue-50/40' : 'hover:bg-gray-50/60'
                  }`}
                >
                  {/* Day Identifier */}
                  <div className="md:w-36 shrink-0 flex items-center md:flex-col md:items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg sm:text-xl font-bold font-mono ${
                          isToday ? 'text-[#1A3B6B]' : 'text-gray-900'
                        }`}
                      >
                        {dayItem.dateStr.slice(5)}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isToday
                            ? 'bg-[#1A3B6B] text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {dayItem.dayNameKo}요일 ({dayItem.dayNameEn})
                      </span>
                    </div>
                    {isToday && (
                      <span className="text-[10px] font-bold text-[#1A3B6B] bg-blue-100 px-1.5 py-0.2 rounded">
                        오늘 (TODAY)
                      </span>
                    )}
                  </div>

                  {/* Day Events */}
                  <div className="flex-1 space-y-2">
                    {dayItem.events.length === 0 ? (
                      <p className="text-xs text-gray-400 py-1 italic">
                        등록된 학사 일정이 없습니다.
                      </p>
                    ) : (
                      dayItem.events.map((ev) => {
                        const typeCfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.academic;
                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="p-3 rounded-md border border-gray-200 bg-white hover:border-[#1A3B6B] transition-colors cursor-pointer group shadow-2xs"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeCfg.bg} ${typeCfg.text}`}>
                                  {typeCfg.label}
                                </span>
                                {ev.important && (
                                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-red-500" />
                                    <span>주요</span>
                                  </span>
                                )}
                              </div>
                              {ev.time && (
                                <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  {ev.time}
                                </span>
                              )}
                            </div>

                            <h5 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#1A3B6B] transition-colors">
                              {getEventTitle(ev)}
                            </h5>
                            {getEventDesc(ev) && (
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {getEventDesc(ev)}
                              </p>
                            )}
                            {ev.location && ev.location !== '-' && (
                              <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{ev.location}</span>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${TYPE_CONFIG[selectedEvent.type]?.bg} ${TYPE_CONFIG[selectedEvent.type]?.text}`}>
                {TYPE_CONFIG[selectedEvent.type]?.label}
              </span>
              <span className="text-xs font-medium text-gray-500">
                {TERM_NAMES[selectedEvent.term]?.ko}
              </span>
              {selectedEvent.important && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-red-500" />
                  <span>주요 일정</span>
                </span>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1">
              {getEventTitle(selectedEvent)}
            </h3>
            {selectedEvent.titleEn && currentLang !== 'en' && (
              <p className="text-xs text-gray-500 mb-4">{selectedEvent.titleEn}</p>
            )}

            {/* Meta Info */}
            <div className="bg-gray-50 rounded-lg p-3.5 space-y-2 border border-gray-200 text-xs mb-4">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-[#1A3B6B] shrink-0" />
                <span className="font-semibold text-gray-900">일정 기간:</span>
                <span className="font-mono">
                  {selectedEvent.startDate}
                  {selectedEvent.startDate !== selectedEvent.endDate && ` ~ ${selectedEvent.endDate}`}
                </span>
              </div>
              {selectedEvent.time && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Clock className="w-4 h-4 text-[#1A3B6B] shrink-0" />
                  <span className="font-semibold text-gray-900">시간:</span>
                  <span>{selectedEvent.time}</span>
                </div>
              )}
              {selectedEvent.location && selectedEvent.location !== '-' && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-[#1A3B6B] shrink-0" />
                  <span className="font-semibold text-gray-900">장소:</span>
                  <span>{selectedEvent.location}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {getEventDesc(selectedEvent) && (
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-700 mb-1">상세 안내</h4>
                <p className="text-xs text-gray-600 leading-relaxed bg-gray-50/50 p-3 rounded border border-gray-100 whitespace-pre-wrap">
                  {getEventDesc(selectedEvent)}
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {onNavigateInquiry ? (
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    onNavigateInquiry();
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#2E7D5B] font-bold hover:underline"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>해당 일정 1:1 빠른 문의하기</span>
                </button>
              ) : <div />}

              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded bg-[#1A3B6B] text-white text-xs font-bold hover:bg-blue-900 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Help Banner */}
      <div className="mt-8 bg-gradient-to-r from-[#1A3B6B] to-[#243447] text-white rounded-lg p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold text-sm sm:text-base">
            학사 일정 및 출결, 비자 연장에 대해 궁금한 점이 있으신가요?
          </h4>
          <p className="text-xs text-blue-200">
            한국어학당 행정실에 1:1 빠른 문의를 남겨주시면 담당 선생님이 상세히 안내해 드립니다.
          </p>
        </div>
        {onNavigateInquiry && (
          <button
            onClick={onNavigateInquiry}
            className="px-4 py-2 rounded bg-[#2E7D5B] hover:bg-[#256348] text-white text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>1:1 빠른 문의 바로가기</span>
          </button>
        )}
      </div>
    </section>
  );
};
