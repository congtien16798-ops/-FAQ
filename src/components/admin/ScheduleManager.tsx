import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Star,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { ScheduleEvent, ScheduleTerm, ScheduleEventType } from '../../types';
import { INITIAL_SCHEDULES } from '../../constants/initialSchedules';

interface ScheduleManagerProps {
  schedules: ScheduleEvent[];
  setSchedules: React.Dispatch<React.SetStateAction<ScheduleEvent[]>>;
}

const TERM_OPTIONS: { value: ScheduleTerm; label: string }[] = [
  { value: 'spring', label: '봄학기 (3~5월)' },
  { value: 'summer', label: '여름학기 (6~8월)' },
  { value: 'fall', label: '가을학기 (9~11월)' },
  { value: 'winter', label: '겨울학기 (12~2월)' },
  { value: 'special', label: '특별과정 및 연중' },
];

const TYPE_OPTIONS: { value: ScheduleEventType; label: string; color: string }[] = [
  { value: 'academic', label: '학사 / 정규 수업', color: 'bg-blue-100 text-blue-800' },
  { value: 'exam', label: '시험 / 성취도 평가', color: 'bg-amber-100 text-amber-900' },
  { value: 'holiday', label: '공휴일 / 휴강', color: 'bg-rose-100 text-rose-800' },
  { value: 'activity', label: '한국 문화체험', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'admission', label: '모집 / 접수 / 등록', color: 'bg-purple-100 text-purple-800' },
];

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  schedules,
  setSchedules,
}) => {
  const [selectedTermFilter, setSelectedTermFilter] = useState<ScheduleTerm | 'all'>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<ScheduleEventType | 'all'>('all');
  const [selectedVisibilityFilter, setSelectedVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Drag and Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);

  // Delete & Hide Management Dialog State
  const [deleteTarget, setDeleteTarget] = useState<ScheduleEvent | null>(null);
  const [confirmPermanentTarget, setConfirmPermanentTarget] = useState<ScheduleEvent | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formTitleEn, setFormTitleEn] = useState('');
  const [formTerm, setFormTerm] = useState<ScheduleTerm>('spring');
  const [formType, setFormType] = useState<ScheduleEventType>('academic');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImportant, setFormImportant] = useState(false);
  const [formHidden, setFormHidden] = useState(false);

  // Toast / feedback message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormTitleEn('');
    setFormTerm('spring');
    setFormType('academic');
    const todayStr = new Date().toISOString().slice(0, 10);
    setFormStartDate(todayStr);
    setFormEndDate(todayStr);
    setFormTime('');
    setFormLocation('');
    setFormDescription('');
    setFormImportant(false);
    setFormHidden(false);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (ev: ScheduleEvent) => {
    setEditingEvent(ev);
    setFormTitle(ev.title);
    setFormTitleEn(ev.titleEn || '');
    setFormTerm(ev.term);
    setFormType(ev.type);
    setFormStartDate(ev.startDate);
    setFormEndDate(ev.endDate);
    setFormTime(ev.time || '');
    setFormLocation(ev.location || '');
    setFormDescription(ev.description || '');
    setFormImportant(ev.important || false);
    setFormHidden(ev.hidden || false);
    setIsModalOpen(true);
  };

  // Save Event (Create or Update)
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formStartDate) {
      showToast('일정 제목과 시작일을 반드시 입력해 주세요.', 'error');
      return;
    }

    const endDate = formEndDate || formStartDate;
    if (endDate < formStartDate) {
      showToast('종료일은 시작일보다 이전일 수 없습니다.', 'error');
      return;
    }

    const now = new Date().toISOString();

    if (editingEvent) {
      // Update
      const updated: ScheduleEvent = {
        ...editingEvent,
        title: formTitle.trim(),
        titleEn: formTitleEn.trim() || undefined,
        term: formTerm,
        type: formType,
        startDate: formStartDate,
        endDate: endDate,
        time: formTime.trim() || undefined,
        location: formLocation.trim() || undefined,
        description: formDescription.trim() || undefined,
        important: formImportant,
        hidden: formHidden,
        updatedAt: now,
      };

      const newList = schedules.map((item) => (item.id === editingEvent.id ? updated : item));
      setSchedules(newList);
      try {
        localStorage.setItem('kmu_schedules_cache', JSON.stringify(newList));
        await setDoc(doc(db, 'schedules', updated.id), updated);
      } catch (err) {
        console.warn('Remote sync error:', err);
      }
      showToast('일정이 성공적으로 수정되었습니다.');
    } else {
      // Create
      const newId = `sch-${Date.now()}`;
      const newEvent: ScheduleEvent = {
        id: newId,
        title: formTitle.trim(),
        titleEn: formTitleEn.trim() || undefined,
        term: formTerm,
        type: formType,
        startDate: formStartDate,
        endDate: endDate,
        time: formTime.trim() || undefined,
        location: formLocation.trim() || undefined,
        description: formDescription.trim() || undefined,
        important: formImportant,
        hidden: formHidden,
        order: schedules.length,
        createdAt: now,
        updatedAt: now,
      };

      const newList = [...schedules, newEvent];
      setSchedules(newList);
      try {
        localStorage.setItem('kmu_schedules_cache', JSON.stringify(newList));
        await setDoc(doc(db, 'schedules', newId), newEvent);
      } catch (err) {
        console.warn('Remote sync error:', err);
      }
      showToast('새로운 일정이 등록되었습니다.');
    }

    setIsModalOpen(false);
  };

  // Toggle Visibility (학생 숨기기 / 보이기)
  const handleToggleVisibility = async (id: string, newHidden: boolean) => {
    const target = schedules.find((item) => item.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    const updated: ScheduleEvent = {
      ...target,
      hidden: newHidden,
      updatedAt: now,
    };

    const newList = schedules.map((item) => (item.id === id ? updated : item));
    setSchedules(newList);

    try {
      localStorage.setItem('kmu_schedules_cache', JSON.stringify(newList));
      await setDoc(doc(db, 'schedules', id), updated);
    } catch (err) {
      console.warn('Visibility update error:', err);
    }

    if (deleteTarget && deleteTarget.id === id) {
      setDeleteTarget(null);
    }

    showToast(
      newHidden
        ? `'${target.title}' 일정을 학생들에게 비노출(숨김) 처리했습니다.`
        : `'${target.title}' 일정을 학생들에게 다시 정상 노출합니다.`
    );
  };

  // Permanent Delete Event (from DB & list)
  const handlePermanentDelete = async (id: string) => {
    const target = schedules.find((item) => item.id === id);
    const targetTitle = target?.title || '해당 일정';

    const newList = schedules.filter((item) => item.id !== id);
    setSchedules(newList);

    try {
      localStorage.setItem('kmu_schedules_cache', JSON.stringify(newList));
      await deleteDoc(doc(db, 'schedules', id));
    } catch (err) {
      console.warn('Remote delete error:', err);
    }

    setDeleteTarget(null);
    showToast(`'${targetTitle}' 일정이 영구 삭제되었습니다.`);
  };

  // Move up / down
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= schedules.length) return;

    const list = [...schedules];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // re-assign orders
    list.forEach((item, idx) => {
      item.order = idx;
    });

    setSchedules(list);
    try {
      localStorage.setItem('kmu_schedules_cache', JSON.stringify(list));
      // update in background
      Promise.all(
        list.map((item) =>
          setDoc(doc(db, 'schedules', item.id), item).catch((e) => console.warn(e))
        )
      );
    } catch (err) {
      console.warn('Order sync warning:', err);
    }
    showToast('일정 순서가 변경되었습니다.');
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const list = [...schedules];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(dropIndex, 0, draggedItem);

    list.forEach((item, idx) => {
      item.order = idx;
    });

    setSchedules(list);
    setDraggedIndex(null);

    try {
      localStorage.setItem('kmu_schedules_cache', JSON.stringify(list));
      Promise.all(
        list.map((item) =>
          setDoc(doc(db, 'schedules', item.id), item).catch((e) => console.warn(e))
        )
      );
    } catch (err) {
      console.warn('Drag reorder error:', err);
    }
    showToast('일정 순서가 변경되었습니다.');
  };

  // Reset to initial default schedules
  const handleResetToDefaults = async () => {
    setSchedules(INITIAL_SCHEDULES);
    try {
      localStorage.setItem('kmu_schedules_cache', JSON.stringify(INITIAL_SCHEDULES));
      for (const ev of INITIAL_SCHEDULES) {
        await setDoc(doc(db, 'schedules', ev.id), ev);
      }
    } catch (err) {
      console.warn('Reset error:', err);
    }
    showToast('기본 일정표로 초기화되었습니다.');
  };

  // Filtered schedules for table
  const displayedSchedules = schedules.filter((item) => {
    if (!item) return false;
    if (selectedTermFilter !== 'all' && item.term !== selectedTermFilter) return false;
    if (selectedTypeFilter !== 'all' && item.type !== selectedTypeFilter) return false;
    if (selectedVisibilityFilter === 'visible' && item.hidden) return false;
    if (selectedVisibilityFilter === 'hidden' && !item.hidden) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = (item.title || '').toLowerCase().includes(q) ||
        (item.titleEn || '').toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchLoc = (item.location || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchLoc) return false;
    }

    return true;
  });

  const hiddenCount = schedules.filter((s) => s.hidden).length;

  return (
    <div className="bg-white rounded-md border border-[#E2E5E8] p-5 sm:p-6 shadow-xs">
      {/* Toast Notification */}
      {statusMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-[#1A3B6B] text-white'
              : 'bg-red-600 text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1A3B6B]" />
              <span>일정표 관리</span>
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              총 {schedules.length}개 일정
            </span>
            {hiddenCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                <EyeOff className="w-3 h-3" />
                {hiddenCount}개 숨김
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            일정을 등록, 수정하고 순서를 변경할 수 있으며, 학생 비노출(숨김) 기능을 지원합니다.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
          <button
            onClick={handleResetToDefaults}
            className="px-3 py-1.5 rounded text-xs text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center gap-1 cursor-pointer"
            title="초기 기본 일정 데이터로 복원"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 일정 복원</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-blue-900 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>새 일정 등록</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="py-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Term Filter */}
          <select
            value={selectedTermFilter}
            onChange={(e) => setSelectedTermFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 text-gray-700 font-medium"
          >
            <option value="all">전체 학기 ({schedules.length})</option>
            <option value="spring">봄학기</option>
            <option value="summer">여름학기</option>
            <option value="fall">가을학기</option>
            <option value="winter">겨울학기</option>
            <option value="special">특별과정</option>
          </select>

          {/* Type Filter */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 text-gray-700 font-medium"
          >
            <option value="all">전체 일정 분류</option>
            <option value="academic">학사 / 정규 수업</option>
            <option value="exam">시험 / 성취도 평가</option>
            <option value="holiday">공휴일 / 휴강</option>
            <option value="activity">한국 문화체험</option>
            <option value="admission">모집 / 접수 / 등록</option>
          </select>

          {/* Visibility Filter (노출 / 숨김) */}
          <select
            value={selectedVisibilityFilter}
            onChange={(e) => setSelectedVisibilityFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 text-gray-700 font-medium"
          >
            <option value="all">전체 상태 (노출+숨김)</option>
            <option value="visible">학생에게 노출 중</option>
            <option value="hidden">학생에게 숨김 ({hiddenCount}개)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[200px] sm:min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="일정명, 장소, 내용 검색..."
            className="w-full pl-8 pr-7 py-1.5 rounded border border-gray-200 text-xs bg-gray-50 focus:bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Schedule Table / List */}
      <div className="border border-gray-200 rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f0f3f6] text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3 w-16 text-center">순서</th>
                <th className="py-2.5 px-3 w-24">학기</th>
                <th className="py-2.5 px-3 w-28">분류</th>
                <th className="py-2.5 px-3 w-36">일정 기간</th>
                <th className="py-2.5 px-4">일정 명칭 및 상세 내용</th>
                <th className="py-2.5 px-3 w-36">시간 / 장소</th>
                <th className="py-2.5 px-3 w-28 text-right">상태 / 관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedSchedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400 text-xs">
                    등록된 일정이 없습니다.
                  </td>
                </tr>
              ) : (
                displayedSchedules.map((ev, idx) => {
                  const globalIdx = schedules.findIndex((s) => s.id === ev.id);
                  const typeOpt = TYPE_OPTIONS.find((t) => t.value === ev.type) || TYPE_OPTIONS[0];

                  return (
                    <tr
                      key={ev.id}
                      draggable
                      onDragStart={() => handleDragStart(globalIdx)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(globalIdx)}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        draggedIndex === globalIdx ? 'opacity-40 bg-blue-100/50' : ''
                      } ${ev.hidden ? 'bg-amber-50/20' : ''}`}
                    >
                      {/* Drag & Order */}
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 p-0.5"
                            title="드래그하여 순서 변경"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </span>
                          <span className="font-mono text-gray-500 text-[11px] w-5 text-center">
                            {globalIdx + 1}
                          </span>
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(globalIdx, 'up')}
                              disabled={globalIdx === 0}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none p-0.5 cursor-pointer"
                              title="위로 이동"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(globalIdx, 'down')}
                              disabled={globalIdx === schedules.length - 1}
                              className="text-gray-400 hover:text-gray-700 disabled:opacity-20 leading-none p-0.5 cursor-pointer"
                              title="아래로 이동"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Term */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="font-semibold text-gray-800 text-[11px]">
                          {ev.term === 'spring' && '봄학기'}
                          {ev.term === 'summer' && '여름학기'}
                          {ev.term === 'fall' && '가을학기'}
                          {ev.term === 'winter' && '겨울학기'}
                          {ev.term === 'special' && '특별과정'}
                        </span>
                      </td>

                      {/* Type Badge */}
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${typeOpt.color}`}>
                          {typeOpt.label}
                        </span>
                      </td>

                      {/* Date Range */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-700 whitespace-nowrap">
                        <div>{ev.startDate}</div>
                        {ev.startDate !== ev.endDate && (
                          <div className="text-[10px] text-gray-400">~ {ev.endDate}</div>
                        )}
                      </td>

                      {/* Title & Desc */}
                      <td className="py-2.5 px-4 min-w-[200px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900">{ev.title}</span>
                          {ev.important && (
                            <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-red-500" />
                              주요
                            </span>
                          )}
                          {ev.hidden && (
                            <span className="text-[9px] font-bold text-amber-700 bg-amber-100/90 border border-amber-300 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <EyeOff className="w-2.5 h-2.5" />
                              학생 숨김
                            </span>
                          )}
                        </div>
                        {ev.titleEn && (
                          <div className="text-[11px] text-gray-400 mt-0.5">{ev.titleEn}</div>
                        )}
                        {ev.description && (
                          <div className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                            {ev.description}
                          </div>
                        )}
                      </td>

                      {/* Time / Location */}
                      <td className="py-2.5 px-3 text-[11px] whitespace-nowrap">
                        {ev.time && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-3 h-3 text-gray-400 shrink-0" />
                            <span>{ev.time}</span>
                          </div>
                        )}
                        {ev.location && ev.location !== '-' && (
                          <div className="flex items-center gap-1 text-gray-500 mt-0.5 truncate max-w-[140px]">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{ev.location}</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1-click Toggle Visibility (학생 숨기기 / 보이기) */}
                          <button
                            type="button"
                            onClick={() => handleToggleVisibility(ev.id, !ev.hidden)}
                            className={`p-1.5 rounded transition-colors cursor-pointer border ${
                              ev.hidden
                                ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 border-transparent'
                            }`}
                            title={ev.hidden ? '학생에게 보이기 (현재 숨김 상태)' : '학생에게 숨기기 (현재 노출 중)'}
                          >
                            {ev.hidden ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1.5 rounded text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors cursor-pointer"
                            title="일정 수정"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete / Hide dialog trigger */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(ev)}
                            className="p-1.5 rounded text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors cursor-pointer"
                            title="일정 삭제 또는 학생 숨김"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAFE DELETE & VISIBILITY DIALOG (replaces window.confirm) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold text-sm sm:text-base">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                <span>일정 삭제 및 학생 숨김 관리</span>
              </div>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="bg-gray-50 rounded p-3 border border-gray-200">
                <div className="font-bold text-gray-900 text-sm">{deleteTarget.title}</div>
                <div className="font-mono text-xs text-gray-600 mt-1">
                  기간: {deleteTarget.startDate} {deleteTarget.startDate !== deleteTarget.endDate && `~ ${deleteTarget.endDate}`}
                </div>
                {deleteTarget.hidden && (
                  <div className="text-[11px] text-amber-700 font-semibold mt-1">
                    현재 학생 포털에서 숨김 처리된 상태입니다.
                  </div>
                )}
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                해당 일정을 완전히 삭제하시겠습니까, 아니면 학생들이 보지 못하도록 일시적으로 숨기시겠습니까?
              </p>

              {/* Action 1: Hide from Students (Recommended) */}
              <button
                type="button"
                onClick={() => handleToggleVisibility(deleteTarget.id, !deleteTarget.hidden)}
                className="w-full text-left p-3 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100/80 transition-all flex items-start gap-3 cursor-pointer group"
              >
                {deleteTarget.hidden ? (
                  <Eye className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                ) : (
                  <EyeOff className="w-5 h-5 text-amber-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                )}
                <div>
                  <div className="font-bold text-amber-900 text-xs sm:text-sm">
                    {deleteTarget.hidden ? '학생 포털에 다시 보이기 (숨김 해제)' : '학생에게만 숨기기 (권장)'}
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    {deleteTarget.hidden
                      ? '학생 일정표에 다시 정상적으로 노출합니다.'
                      : '데이터를 삭제하지 않고 학생 일정표에서만 즉시 감춥니다. 언제든 다시 보이게 복원할 수 있습니다.'}
                  </div>
                </div>
              </button>

              {/* Action 2: Permanent Delete */}
              <button
                type="button"
                onClick={() => {
                  const target = deleteTarget;
                  setDeleteTarget(null);
                  setConfirmPermanentTarget(target);
                }}
                className="w-full text-left p-3 rounded-lg border border-red-200 bg-red-50/70 hover:bg-red-100 transition-all flex items-start gap-3 cursor-pointer group"
              >
                <Trash2 className="w-5 h-5 text-red-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold text-red-800 text-xs sm:text-sm">
                    영구 삭제
                  </div>
                  <div className="text-[11px] text-red-600 mt-0.5">
                    데이터베이스 및 목록에서 완전히 삭제하며 복구할 수 없습니다.
                  </div>
                </div>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECOND CONFIRMATION MODAL FOR PERMANENT DELETE */}
      {confirmPermanentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full p-5 sm:p-6 border border-red-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-red-600 mb-3 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />
              <span>영구 삭제 재확인</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed mb-4">
              정말 <strong className="text-gray-900 font-bold">'{confirmPermanentTarget.title}'</strong> 일정을 영구 삭제하시겠습니까?
              <br />
              <span className="text-red-600 font-semibold block mt-1">※ 삭제된 데이터는 복구할 수 없습니다.</span>
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmPermanentTarget(null)}
                className="px-3.5 py-1.5 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePermanentDelete(confirmPermanentTarget.id);
                  setConfirmPermanentTarget(null);
                }}
                className="px-3.5 py-1.5 rounded text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>영구 삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-xl w-full p-5 sm:p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1A3B6B]" />
                  <span>{editingEvent ? '일정 수정' : '새 일정 등록'}</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  학생 포털의 연간, 월간, 주간 일정표에 반영되는 정보를 입력해 주세요.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEvent} className="space-y-3.5 text-xs">
              {/* Title KO */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  일정 명칭 (한국어, 필수) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="예: 2025학년도 봄학기 개강"
                  className="w-full px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden"
                />
              </div>

              {/* Title EN */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  일정 명칭 (영어, 선택)
                </label>
                <input
                  type="text"
                  value={formTitleEn}
                  onChange={(e) => setFormTitleEn(e.target.value)}
                  placeholder="e.g. 2025 Spring Term Commencement"
                  className="w-full px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B] focus:outline-hidden"
                />
              </div>

              {/* Term & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">해당 학기</label>
                  <select
                    value={formTerm}
                    onChange={(e) => setFormTerm(e.target.value as ScheduleTerm)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B] bg-white"
                  >
                    {TERM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">일정 분류</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as ScheduleEventType)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B] bg-white"
                  >
                    {TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    시작일 (YYYY-MM-DD) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    종료일 (당일 일정인 경우 동일)
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                  />
                </div>
              </div>

              {/* Time & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">시간 안내 (선택)</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="예: 09:00 ~ 13:00 또는 종일"
                    className="w-full px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">장소 안내 (선택)</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="예: 동영관 101호"
                    className="w-full px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-gray-700 mb-1">상세 안내 문구</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="준비물, 공지사항, 유의할 점 등을 입력하세요."
                  className="w-full px-3 py-1.5 rounded border border-gray-300 focus:border-[#1A3B6B]"
                />
              </div>

              {/* Options: Important & Hidden */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-2.5 rounded bg-gray-50 border border-gray-200">
                  <input
                    type="checkbox"
                    id="formImportantCheck"
                    checked={formImportant}
                    onChange={(e) => setFormImportant(e.target.checked)}
                    className="w-4 h-4 text-[#1A3B6B] rounded border-gray-300 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="formImportantCheck" className="text-xs text-gray-800 font-semibold cursor-pointer">
                    주요 일정으로 강조 (별표 뱃지 표시)
                  </label>
                </div>

                {/* Hide from students toggle */}
                <div className="flex items-start gap-2.5 p-2.5 rounded bg-amber-50/70 border border-amber-200">
                  <input
                    type="checkbox"
                    id="formHiddenCheck"
                    checked={formHidden}
                    onChange={(e) => setFormHidden(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-gray-300 focus:ring-amber-500 cursor-pointer mt-0.5"
                  />
                  <label htmlFor="formHiddenCheck" className="text-xs text-amber-900 cursor-pointer">
                    <span className="font-bold flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                      학생 포털에서 숨기기 (임시 비노출)
                    </span>
                    <span className="text-[11px] text-amber-700 block mt-0.5">
                      체크하면 학생 일정표에서 보이지 않으며, 관리자 모드에서만 확인 및 복원할 수 있습니다.
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded text-xs font-bold text-white bg-[#1A3B6B] hover:bg-blue-900 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{editingEvent ? '수정 내용 저장' : '일정 등록'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
