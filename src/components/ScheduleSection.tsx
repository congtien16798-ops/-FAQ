import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronDown,
  X
} from 'lucide-react';
import { ScheduleEvent, ScheduleTerm, Language, getScheduleYear } from '../types';
import { translations } from '../constants/translations';
import { translateText } from '../services/translator';
import { useTheme } from '../context/ThemeContext';

interface ScheduleSectionProps {
  schedules: ScheduleEvent[];
  currentLang: Language;
  onNavigateInquiry?: () => void;
}

interface SemesterTabInfo {
  id: ScheduleTerm;
  labelKo: string;
  labelEn: string;
  labelVi: string;
  labelZh: string;
  months: string;
}

const SEMESTER_TABS: SemesterTabInfo[] = [
  {
    id: 'spring',
    labelKo: '봄학기',
    labelEn: 'Spring Term',
    labelVi: 'Học kỳ Mùa Xuân',
    labelZh: '春季学期',
    months: '3월 ~ 5월',
  },
  {
    id: 'summer',
    labelKo: '여름학기',
    labelEn: 'Summer Term',
    labelVi: 'Học kỳ Mùa Hè',
    labelZh: '夏季学期',
    months: '6월 ~ 8월',
  },
  {
    id: 'fall',
    labelKo: '가을학기',
    labelEn: 'Fall Term',
    labelVi: 'Học kỳ Mùa Thu',
    labelZh: '秋季学期',
    months: '9월 ~ 11월',
  },
  {
    id: 'winter',
    labelKo: '겨울학기',
    labelEn: 'Winter Term',
    labelVi: 'Học kỳ Mùa Đông',
    labelZh: '冬季学期',
    months: '12월 ~ 2월',
  },
];

export const ScheduleSection: React.FC<ScheduleSectionProps> = ({
  schedules,
  currentLang,
}) => {
  const t = translations[currentLang] || translations.ko;
  const { config } = useTheme();

  // Admin Configured Defaults
  const adminDefaultYear = config.currentAcademicYear || 2026;
  const adminDefaultTerm: ScheduleTerm = (config.currentAcademicTerm as ScheduleTerm) || 'spring';

  // Student Selected State (Defaults to Admin Settings, selectable by student via dropdowns)
  const [selectedYear, setSelectedYear] = useState<number>(() => config.currentAcademicYear || 2026);
  const [selectedTerm, setSelectedTerm] = useState<ScheduleTerm>(
    () => (config.currentAcademicTerm as ScheduleTerm) || 'spring'
  );
  const [hasUserManuallySelected, setHasUserManuallySelected] = useState<boolean>(false);

  const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);

  // Automatically update initial filter values when admin configuration loads or changes
  useEffect(() => {
    if (!hasUserManuallySelected) {
      if (config.currentAcademicYear) {
        setSelectedYear(config.currentAcademicYear);
      }
      if (config.currentAcademicTerm) {
        setSelectedTerm(config.currentAcademicTerm as ScheduleTerm);
      }
    }
  }, [config.currentAcademicYear, config.currentAcademicTerm, hasUserManuallySelected]);

  // Compute available years dynamically
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>([
      adminDefaultYear,
      2025,
      2026,
      2027,
    ]);

    (schedules || []).forEach((ev) => {
      if (ev) {
        yearsSet.add(getScheduleYear(ev));
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a); // descending: 2027, 2026, 2025...
  }, [schedules, adminDefaultYear]);

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

  // Filtered schedules for current Year & Term
  const semesterSchedules = useMemo(() => {
    return (schedules || [])
      .filter((item) => {
        if (!item || item.hidden) return false;
        const evYear = getScheduleYear(item);
        if (evYear !== selectedYear) return false;
        if (item.term !== selectedTerm) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined && a.order !== b.order) {
          return a.order - b.order;
        }
        return a.startDate.localeCompare(b.startDate);
      });
  }, [schedules, selectedYear, selectedTerm]);

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

  const getSemesterLabel = (sem: SemesterTabInfo) => {
    switch (currentLang) {
      case 'en':
        return sem.labelEn;
      case 'vi':
        return sem.labelVi;
      case 'zh':
        return sem.labelZh;
      default:
        return sem.labelKo;
    }
  };

  // Format Month-Day (월-일만 표시, e.g. "10-31" or "10-14 ~ 10-16")
  const formatMonthDay = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.length >= 10 && dateStr.charAt(4) === '-') {
      return dateStr.slice(5); // "MM-DD"
    }
    return dateStr;
  };

  const formatEventDateDisplay = (start: string, end: string) => {
    const s = formatMonthDay(start);
    if (!end || start === end) {
      return s;
    }
    const e = formatMonthDay(end);
    return `${s} ~ ${e}`;
  };

  const currentTermInfo = SEMESTER_TABS.find((t) => t.id === selectedTerm) || SEMESTER_TABS[0];

  return (
    <section className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Header & Term Filters */}
      <div className="mb-6 pb-4 border-b border-[#E2E5E8]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Title & Note */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <h2 className="text-xl font-bold text-[#1A3B6B] shrink-0">
              {t.scheduleTitle || '한국어학당 일정'}
            </h2>
            <span className="text-xs text-gray-400 hidden md:inline">
              * 본 일정은 학사 사정에 따라 변동될 수 있습니다.
            </span>
          </div>

          {/* Right: Year & Term Dropdown Filters */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap shrink-0">
            {/* Year Dropdown */}
            <div className="relative">
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(Number(e.target.value));
                  setHasUserManuallySelected(true);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 sm:py-2 bg-white hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1A3B6B] rounded-full text-xs font-semibold text-gray-800 cursor-pointer shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}년도
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Semester Dropdown */}
            <div className="relative">
              <select
                id="term-select"
                value={selectedTerm}
                onChange={(e) => {
                  setSelectedTerm(e.target.value as ScheduleTerm);
                  setHasUserManuallySelected(true);
                }}
                className="appearance-none pl-3 pr-8 py-1.5 sm:py-2 bg-white hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1A3B6B] rounded-full text-xs font-semibold text-gray-800 cursor-pointer shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-[#1A3B6B]"
              >
                {SEMESTER_TABS.map((sem) => (
                  <option key={sem.id} value={sem.id}>
                    {getSemesterLabel(sem)}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Small Screen Note */}
        <p className="text-xs text-gray-400 mt-2 md:hidden">
          * 본 일정은 학사 사정에 따라 변동될 수 있습니다.
        </p>
      </div>

      {/* SCHEDULE EVENTS LIST */}
      <div className="space-y-3">
        {semesterSchedules.length === 0 ? (
          <div className="bg-white rounded-md border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
            <CalendarIcon className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">
              선택하신 {selectedYear}년도 {getSemesterLabel(currentTermInfo)}에 등록된 일정이 없습니다.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              다른 학기 또는 년도를 선택해 보세요.
            </p>
          </div>
        ) : (
          semesterSchedules.map((ev) => {
            return (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="bg-white rounded-md border border-[#E2E5E8] hover:border-gray-300 transition-all shadow-2xs overflow-hidden cursor-pointer group"
              >
                {/* Header Row (Unified with FAQ standard) */}
                <div className="px-4 py-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                    {/* Date: MM-DD (Bold, same font size as title, center aligned) */}
                    <span className="text-sm md:text-base font-bold shrink-0 text-gray-900 tracking-tight">
                      {formatEventDateDisplay(ev.startDate, ev.endDate)}
                    </span>

                    {/* Semi-transparent Divider Line (반투명 구분선) */}
                    <span className="w-px h-3.5 sm:h-4 bg-gray-300/80 shrink-0" aria-hidden="true" />

                    {/* Schedule Title (Bold, same font size as date, center aligned) */}
                    <h4 className="text-sm md:text-base font-bold text-gray-800 group-hover:text-[#1A3B6B] transition-colors leading-snug flex-1 truncate sm:whitespace-normal">
                      {getEventTitle(ev)}
                    </h4>

                    {/* Location Badge (Optional) */}
                    {ev.location && ev.location !== '-' && (
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 shrink-0">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{ev.location}</span>
                      </span>
                    )}

                    {/* Time Badge (Optional) */}
                    {ev.time && (
                      <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 shrink-0">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{ev.time}</span>
                      </span>
                    )}
                  </div>

                  {/* Right Action Hint */}
                  <div className="flex items-center gap-1 shrink-0 text-gray-400">
                    <span className="text-xs text-gray-400 group-hover:text-[#1A3B6B] transition-colors font-medium hidden sm:inline">
                      상세보기
                    </span>
                    <span className="text-sm text-gray-400 group-hover:text-[#1A3B6B] transition-colors">
                      ›
                    </span>
                  </div>
                </div>

                {/* Description Body if present */}
                {getEventDesc(ev) && (
                  <div className="px-4 pb-3.5 pt-2 border-t border-gray-100 text-xs sm:text-sm text-gray-600 leading-relaxed bg-[#fafafa]/50">
                    <p className="line-clamp-2">{getEventDesc(ev)}</p>
                    {(ev.time || (ev.location && ev.location !== '-')) && (
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 sm:hidden flex-wrap">
                        {ev.location && ev.location !== '-' && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{ev.location}</span>
                          </div>
                        )}
                        {ev.time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>{ev.time}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* EVENT DETAIL MODAL */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-2xl border border-gray-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-[#1A3B6B] border border-blue-200">
                {selectedYear}년도 {getSemesterLabel(currentTermInfo)}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 leading-snug">
              {getEventTitle(selectedEvent)}
            </h3>

            {/* Meta Info */}
            <div className="bg-gray-50 rounded-lg p-3.5 space-y-2 border border-gray-200 text-xs my-4">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="w-4 h-4 text-[#1A3B6B] shrink-0" />
                <span className="font-semibold text-gray-900">일정 기간:</span>
                <span className="font-bold text-gray-900">
                  {formatEventDateDisplay(selectedEvent.startDate, selectedEvent.endDate)}
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

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded bg-[#1A3B6B] text-white text-xs font-bold hover:bg-blue-900 transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
