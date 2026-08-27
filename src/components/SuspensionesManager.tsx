import React, { useState, useMemo } from 'react';
import { MonthStats, SuspensionEvent, SuspensionCategory } from '../types';
import {
  SUSPENSION_CATEGORIES,
  MONTH_NAMES_ORDER,
  getCurrentMonthKey,
  formatMonthFeriadosDesc,
  ensureMonthEvents,
} from '../utils/suspensionesHelper';
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Coffee,
  Sun,
  Building2,
  AlertCircle,
  FileCheck,
  Check,
  X,
  Grid,
  Sliders,
  Sparkles,
  CalendarDays,
  CalendarRange,
  Clock,
  RotateCcw,
  MousePointerClick,
  Info,
} from 'lucide-react';

interface SuspensionesManagerProps {
  months: MonthStats[];
  isEditMode?: boolean;
  onUpdateMonths?: (newMonths: MonthStats[]) => void;
}

type ViewMode = 'current' | 'slide' | 'all';

export const SuspensionesManager: React.FC<SuspensionesManagerProps> = ({
  months,
  isEditMode = false,
  onUpdateMonths,
}) => {
  // Ensure all months have structured eventos
  const safeMonths = useMemo(() => ensureMonthEvents(months), [months]);

  // Current real-world month
  const autoCurrentMonthKey = useMemo(() => getCurrentMonthKey(), []);

  // View state: 'current' (Mes en curso), 'slide' (Slide por mes), 'all' (Todos los meses)
  const [viewMode, setViewMode] = useState<ViewMode>('slide');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(autoCurrentMonthKey);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal / Form state for Add/Edit
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formMonthKey, setFormMonthKey] = useState<string>(autoCurrentMonthKey);
  const [formDia, setFormDia] = useState('');
  const [formActividad, setFormActividad] = useState('');
  const [formTipo, setFormTipo] = useState<SuspensionCategory>('pausa');

  // Calendar Day / Range Picker State in Modal
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');
  const [rangeStartDay, setRangeStartDay] = useState<number | null>(null);
  const [rangeEndDay, setRangeEndDay] = useState<number | null>(null);

  // Month abbreviations
  const MONTH_ABBR_MAP: Record<string, string> = {
    enero: 'ene',
    febrero: 'feb',
    marzo: 'mar',
    abril: 'abr',
    mayo: 'may',
    junio: 'jun',
    julio: 'jul',
    agosto: 'ago',
    septiembre: 'sep',
    octubre: 'oct',
    noviembre: 'nov',
    diciembre: 'dic',
  };

  // Helper to parse day/range numbers from text like "23 feb", "01-05 abr", "30-31 mar"
  const parseDaysFromText = (diaText: string) => {
    if (!diaText) return { start: null, end: null };
    const rangeMatch = diaText.match(/(\d{1,2})\s*[-–alALa]+\s*(\d{1,2})/);
    if (rangeMatch) {
      const s = parseInt(rangeMatch[1], 10);
      const e = parseInt(rangeMatch[2], 10);
      return { start: s, end: e };
    }
    const singleMatch = diaText.match(/(\d{1,2})/);
    if (singleMatch) {
      const s = parseInt(singleMatch[1], 10);
      return { start: s, end: s };
    }
    return { start: null, end: null };
  };

  // Compute calendar grid data for the currently selected form month (2026)
  const modalCalendarData = useMemo(() => {
    const monthMeta = MONTH_NAMES_ORDER.find((m) => m.key === formMonthKey) || MONTH_NAMES_ORDER[0];
    const monthIdx = monthMeta.index; // 0 = Jan, 1 = Feb, etc.
    const year = 2026;

    const firstDate = new Date(year, monthIdx, 1);
    // getDay: 0 = Sunday, 1 = Monday...
    let startingWeekday = firstDate.getDay() - 1;
    if (startingWeekday === -1) startingWeekday = 6; // Monday is 0, Sunday is 6

    const totalDays = new Date(year, monthIdx + 1, 0).getDate();

    // Map existing events in this month to day numbers for dots
    const currentMonthEvents = safeMonths.find((m) => m.month === formMonthKey)?.eventos || [];
    const daysWithEvents: Record<number, SuspensionEvent[]> = {};

    currentMonthEvents.forEach((ev) => {
      if (editingEventId && ev.id === editingEventId) return; // ignore current editing event
      const parsed = parseDaysFromText(ev.dia);
      if (parsed.start) {
        const start = parsed.start;
        const end = parsed.end || parsed.start;
        for (let d = start; d <= end; d++) {
          if (!daysWithEvents[d]) daysWithEvents[d] = [];
          daysWithEvents[d].push(ev);
        }
      }
    });

    return {
      monthName: monthMeta.name,
      monthIdx,
      startingWeekday,
      totalDays,
      daysWithEvents,
      year,
      abbr: MONTH_ABBR_MAP[formMonthKey] || formMonthKey.slice(0, 3),
    };
  }, [formMonthKey, safeMonths, editingEventId]);

  // Calendar Day Click Handler
  const handleCalendarDayClick = (dayNum: number) => {
    const abbr = modalCalendarData.abbr;

    if (calendarMode === 'single') {
      setRangeStartDay(dayNum);
      setRangeEndDay(dayNum);
      const formatted = `${dayNum < 10 ? '0' + dayNum : dayNum} ${abbr}`;
      setFormDia(formatted);
    } else {
      // Range Mode
      if (rangeStartDay === null || (rangeStartDay !== null && rangeEndDay !== null)) {
        // Start a new range
        setRangeStartDay(dayNum);
        setRangeEndDay(null);
        const formatted = `${dayNum < 10 ? '0' + dayNum : dayNum} ${abbr}`;
        setFormDia(formatted);
      } else {
        // Complete the range
        const start = Math.min(rangeStartDay, dayNum);
        const end = Math.max(rangeStartDay, dayNum);
        setRangeStartDay(start);
        setRangeEndDay(end);
        const formatted =
          start === end
            ? `${start < 10 ? '0' + start : start} ${abbr}`
            : `${start < 10 ? '0' + start : start}-${end < 10 ? '0' + end : end} ${abbr}`;
        setFormDia(formatted);
      }
    }
  };

  // Active month index for slider
  const currentMonthIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === selectedMonthKey);
  const activeMonthIndex = currentMonthIdx >= 0 ? currentMonthIdx : 0;
  const activeMonthData = safeMonths.find((m) => m.month === selectedMonthKey) || safeMonths[0];

  // Global counts
  const totalEventsCount = useMemo(() => {
    return safeMonths.reduce((acc, m) => acc + (m.eventos?.length || 0), 0);
  }, [safeMonths]);

  const countsByCategory = useMemo(() => {
    const counts: Record<SuspensionCategory, number> = {
      pausa: 0,
      feriado: 0,
      institucional: 0,
      suspension: 0,
      evaluacion: 0,
    };
    safeMonths.forEach((m) => {
      m.eventos?.forEach((e) => {
        if (counts[e.tipo] !== undefined) {
          counts[e.tipo]++;
        }
      });
    });
    return counts;
  }, [safeMonths]);

  // Navigation handlers
  const handlePrevMonth = () => {
    const prevIdx = (activeMonthIndex - 1 + MONTH_NAMES_ORDER.length) % MONTH_NAMES_ORDER.length;
    setSelectedMonthKey(MONTH_NAMES_ORDER[prevIdx].key);
  };

  const handleNextMonth = () => {
    const nextIdx = (activeMonthIndex + 1) % MONTH_NAMES_ORDER.length;
    setSelectedMonthKey(MONTH_NAMES_ORDER[nextIdx].key);
  };

  // Open Form to Add
  const handleOpenAddModal = (monthKey?: string) => {
    const targetMonth = monthKey || selectedMonthKey || 'enero';
    setEditingEventId(null);
    setFormMonthKey(targetMonth);
    setFormDia('');
    setFormActividad('');
    setFormTipo('pausa');
    setRangeStartDay(null);
    setRangeEndDay(null);
    setCalendarMode('single');
    setIsFormOpen(true);
  };

  // Open Form to Edit
  const handleOpenEditModal = (event: SuspensionEvent) => {
    setEditingEventId(event.id);
    setFormMonthKey(event.mes);
    setFormDia(event.dia);
    setFormActividad(event.actividad);
    setFormTipo(event.tipo);

    const parsed = parseDaysFromText(event.dia);
    if (parsed.start && parsed.end && parsed.start !== parsed.end) {
      setCalendarMode('range');
      setRangeStartDay(parsed.start);
      setRangeEndDay(parsed.end);
    } else if (parsed.start) {
      setCalendarMode('single');
      setRangeStartDay(parsed.start);
      setRangeEndDay(parsed.start);
    } else {
      setCalendarMode('single');
      setRangeStartDay(null);
      setRangeEndDay(null);
    }

    setIsFormOpen(true);
  };

  // Save Add/Edit Event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDia.trim() || !formActividad.trim()) return;

    const newMonths = safeMonths.map((m) => {
      let updatedEventos = [...(m.eventos || [])];

      if (editingEventId) {
        // If editing, remove from original month and add to target month
        updatedEventos = updatedEventos.filter((ev) => ev.id !== editingEventId);
      }

      if (m.month === formMonthKey) {
        const newEv: SuspensionEvent = {
          id: editingEventId || `ev-${formMonthKey}-${Date.now()}`,
          dia: formDia.trim(),
          mes: formMonthKey,
          actividad: formActividad.trim(),
          tipo: formTipo,
        };
        updatedEventos.push(newEv);
      }

      return {
        ...m,
        eventos: updatedEventos,
        feriadosDesc: formatMonthFeriadosDesc(updatedEventos),
      };
    });

    if (onUpdateMonths) {
      onUpdateMonths(newMonths);
    }

    setIsFormOpen(false);
    setSelectedMonthKey(formMonthKey);
  };

  // Delete Event
  const handleDeleteEvent = (eventId: string, monthKey: string) => {
    const newMonths = safeMonths.map((m) => {
      if (m.month !== monthKey) return m;
      const updatedEventos = (m.eventos || []).filter((e) => e.id !== eventId);
      return {
        ...m,
        eventos: updatedEventos,
        feriadosDesc: formatMonthFeriadosDesc(updatedEventos),
      };
    });

    if (onUpdateMonths) {
      onUpdateMonths(newMonths);
    }
  };

  // Helper icon renderer
  const renderCategoryIcon = (tipo: SuspensionCategory) => {
    switch (tipo) {
      case 'pausa':
        return <Coffee className="w-3.5 h-3.5 text-indigo-700" />;
      case 'feriado':
        return <Sun className="w-3.5 h-3.5 text-amber-700" />;
      case 'institucional':
        return <Building2 className="w-3.5 h-3.5 text-emerald-700" />;
      case 'suspension':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-700" />;
      case 'evaluacion':
        return <FileCheck className="w-3.5 h-3.5 text-blue-700" />;
      default:
        return <Calendar className="w-3.5 h-3.5 text-slate-700" />;
    }
  };

  return (
    <div id="detalle-descansos-pausas-section" className="bg-slate-50/70 border-t border-slate-200 p-4 text-xs text-slate-700">
      
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1 rounded-lg bg-blue-100 text-blue-800">
              <CalendarDays className="w-4 h-4" />
            </span>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight">
              Detalle de Descansos, Pausas Pedagógicas y Suspensiones Institucionales
            </h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-900 rounded-full font-bold text-[10px] border border-blue-200">
              {totalEventsCount} actividades registradas
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Gestione de forma estructurada cada descanso, día festivo, suspensión o pausa pedagógica mes a mes.
          </p>
        </div>

        {/* Action Controls & View Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Switcher Pills */}
          <div className="bg-slate-200/80 p-1 rounded-xl flex items-center gap-1 border border-slate-300">
            <button
              type="button"
              onClick={() => {
                setViewMode('current');
                setSelectedMonthKey(autoCurrentMonthKey);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'current'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Mes en Curso</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('slide')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'slide'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-blue-600" />
              <span>Por Mes (Slide)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5 text-blue-600" />
              <span>Todos los Meses</span>
            </button>
          </div>

          {/* Add Event Button */}
          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Agregar Día / Actividad</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap mb-4">
        <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3 text-slate-400" />
          Filtrar:
        </span>
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all ${
            categoryFilter === 'all'
              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
          }`}
        >
          Todos ({totalEventsCount})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('pausa')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
            categoryFilter === 'pausa'
              ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
              : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
          }`}
        >
          <Coffee className="w-3 h-3" />
          Pausas Pedagógicas ({countsByCategory.pausa})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('feriado')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
            categoryFilter === 'feriado'
              ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
              : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
          }`}
        >
          <Sun className="w-3 h-3" />
          Feriados / Asuetos ({countsByCategory.feriado})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('institucional')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
            categoryFilter === 'institucional'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
              : 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Building2 className="w-3 h-3" />
          Institucionales ({countsByCategory.institucional})
        </button>
        <button
          type="button"
          onClick={() => setCategoryFilter('evaluacion')}
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 ${
            categoryFilter === 'evaluacion'
              ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
              : 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <FileCheck className="w-3 h-3" />
          Evaluaciones ({countsByCategory.evaluacion})
        </button>
      </div>

      {/* VIEW MODE 1 & 2: SLIDE / MES EN CURSO */}
      {(viewMode === 'slide' || viewMode === 'current') && (
        <div className="space-y-3">
          {/* Month Selector Tabs / Slider Bar */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1.5 scrollbar-thin">
            {MONTH_NAMES_ORDER.map((m) => {
              const mData = safeMonths.find((item) => item.month === m.key);
              const eventCount = mData?.eventos?.length || 0;
              const isSelected = selectedMonthKey === m.key;
              const isRealCurrent = autoCurrentMonthKey === m.key;

              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => {
                    setSelectedMonthKey(m.key);
                    if (viewMode === 'current' && m.key !== autoCurrentMonthKey) {
                      setViewMode('slide');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : isRealCurrent
                      ? 'bg-blue-50/80 text-blue-800 border-blue-300 hover:bg-blue-100'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span>{m.name}</span>
                  {eventCount > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {eventCount}
                    </span>
                  )}
                  {isRealCurrent && (
                    <span
                      className={`text-[9px] font-black uppercase px-1 rounded ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Month Slide Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 transition-all">
            {/* Slide Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Mes anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-extrabold text-slate-900 capitalize">
                      {activeMonthData.name} 2026
                    </h4>
                    {selectedMonthKey === autoCurrentMonthKey && (
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        Mes en Curso
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span>
                      <strong>{activeMonthData.semanas}</strong> semanas laborales
                    </span>
                    <span>•</span>
                    <span>
                      <strong>{activeMonthData.dias}</strong> días lectivos
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  title="Mes siguiente"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAddModal(selectedMonthKey)}
                  className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar en {activeMonthData.name}</span>
                </button>
              </div>
            </div>

            {/* Event List in Active Month */}
            {(() => {
              const events = (activeMonthData.eventos || []).filter(
                (ev) => categoryFilter === 'all' || ev.tipo === categoryFilter
              );

              if (events.length === 0) {
                return (
                  <div className="py-8 text-center bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-600 font-bold text-xs">
                      No hay actividades registradas en {activeMonthData.name} con los filtros actuales.
                    </p>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Haga clic en agregar para registrar un descanso, asueto o pausa pedagógica.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleOpenAddModal(selectedMonthKey)}
                      className="mt-3 px-3 py-1 bg-white border border-slate-300 hover:border-blue-500 text-blue-700 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Registrar en {activeMonthData.name}
                    </button>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {events.map((ev) => {
                    const catMeta = SUSPENSION_CATEGORIES[ev.tipo] || SUSPENSION_CATEGORIES.institucional;
                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-xl border transition-all relative group flex flex-col justify-between ${catMeta.cardBg} ${catMeta.badgeBorder}`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-300 shadow-2xs">
                              📅 {ev.dia}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${catMeta.badgeBg} ${catMeta.badgeText} ${catMeta.badgeBorder}`}
                            >
                              {renderCategoryIcon(ev.tipo)}
                              {catMeta.shortLabel}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 leading-snug">
                            {ev.actividad}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-1 mt-2.5 pt-1.5 border-t border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(ev)}
                            className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-white transition-colors"
                            title="Editar actividad"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id, ev.mes)}
                            className="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-white transition-colors"
                            title="Eliminar actividad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: ALL MONTHS GRID */}
      {viewMode === 'all' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {safeMonths.map((m) => {
            const isCurrent = autoCurrentMonthKey === m.month;
            const events = (m.eventos || []).filter(
              (ev) => categoryFilter === 'all' || ev.tipo === categoryFilter
            );

            return (
              <div
                key={m.month}
                className={`p-3.5 rounded-2xl border bg-white shadow-2xs transition-all flex flex-col justify-between ${
                  isCurrent ? 'ring-2 ring-blue-500 border-blue-300' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-xs capitalize">
                        {m.name}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          Actual
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">
                      {m.dias} días • {events.length} act.
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {events.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-1">Sin actividades</p>
                    ) : (
                      events.map((ev) => {
                        const catMeta = SUSPENSION_CATEGORIES[ev.tipo] || SUSPENSION_CATEGORIES.institucional;
                        return (
                          <div
                            key={ev.id}
                            className={`p-1.5 rounded-lg border text-[11px] flex items-start justify-between gap-1.5 ${catMeta.cardBg} ${catMeta.badgeBorder}`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="font-mono font-bold text-slate-900 bg-white px-1 py-0.2 rounded border border-slate-300 text-[10px]">
                                  {ev.dia}
                                </span>
                                <span
                                  className={`text-[9px] font-extrabold px-1 rounded ${catMeta.badgeBg} ${catMeta.badgeText}`}
                                >
                                  {catMeta.shortLabel}
                                </span>
                              </div>
                              <p className="text-slate-800 font-medium truncate">{ev.actividad}</p>
                            </div>
                            <div className="flex items-center shrink-0">
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(ev)}
                                className="p-0.5 text-slate-400 hover:text-blue-700"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteEvent(ev.id, ev.mes)}
                                className="p-0.5 text-slate-400 hover:text-rose-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenAddModal(m.month)}
                    className="text-[10px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT EVENT MODAL WITH VISUAL CALENDAR PICKER */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full my-auto overflow-hidden animate-in fade-in zoom-in-95 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    {editingEventId ? 'Editar Actividad o Descanso' : 'Registrar Día y Actividad'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Seleccione el día o rango directamente en el calendario interactivo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEvent} className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
              
              {/* VISUAL INTERACTIVE CALENDAR PICKER */}
              <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
                {/* Calendar Header: Month Switcher & Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white border border-slate-300 rounded-lg p-0.5 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === formMonthKey);
                          const prevIdx = (currentIdx - 1 + MONTH_NAMES_ORDER.length) % MONTH_NAMES_ORDER.length;
                          setFormMonthKey(MONTH_NAMES_ORDER[prevIdx].key);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-700"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <select
                        value={formMonthKey}
                        onChange={(e) => setFormMonthKey(e.target.value)}
                        className="px-2 py-1 text-xs font-extrabold text-slate-900 bg-transparent border-0 focus:ring-0 cursor-pointer"
                      >
                        {MONTH_NAMES_ORDER.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.name} 2026
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = MONTH_NAMES_ORDER.findIndex((m) => m.key === formMonthKey);
                          const nextIdx = (currentIdx + 1) % MONTH_NAMES_ORDER.length;
                          setFormMonthKey(MONTH_NAMES_ORDER[nextIdx].key);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-700"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode Toggle: Single Day vs Date Range */}
                  <div className="flex items-center bg-slate-200/80 p-1 rounded-lg self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarMode('single');
                        if (rangeStartDay) {
                          setRangeEndDay(rangeStartDay);
                          setFormDia(`${rangeStartDay < 10 ? '0' + rangeStartDay : rangeStartDay} ${modalCalendarData.abbr}`);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        calendarMode === 'single'
                          ? 'bg-white text-blue-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>Día Único</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMode('range')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                        calendarMode === 'range'
                          ? 'bg-white text-blue-800 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarRange className="w-3.5 h-3.5" />
                      <span>Rango de Días</span>
                    </button>
                  </div>
                </div>

                {/* Calendar Grid Header (Weekdays) */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-500 mb-1">
                  <div title="Lunes">LUN</div>
                  <div title="Martes">MAR</div>
                  <div title="Miércoles">MIÉ</div>
                  <div title="Jueves">JUE</div>
                  <div title="Viernes">VIE</div>
                  <div className="text-amber-600" title="Sábado">SÁB</div>
                  <div className="text-amber-600" title="Domingo">DOM</div>
                </div>

                {/* Calendar Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty Offset Days */}
                  {Array.from({ length: modalCalendarData.startingWeekday }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8 sm:h-9 rounded-lg bg-transparent" />
                  ))}

                  {/* Month Day Cells */}
                  {Array.from({ length: modalCalendarData.totalDays }).map((_, i) => {
                    const dayNum = i + 1;
                    const dayWeekdayIdx = (modalCalendarData.startingWeekday + i) % 7;
                    const isWeekend = dayWeekdayIdx === 5 || dayWeekdayIdx === 6;

                    // Range status
                    const isStart = rangeStartDay === dayNum;
                    const isEnd = rangeEndDay === dayNum;
                    const isInRange =
                      rangeStartDay !== null &&
                      rangeEndDay !== null &&
                      dayNum >= Math.min(rangeStartDay, rangeEndDay) &&
                      dayNum <= Math.max(rangeStartDay, rangeEndDay);

                    const isSingleSelected = calendarMode === 'single' && isStart;
                    const hasEvents = modalCalendarData.daysWithEvents[dayNum]?.length > 0;
                    const eventTitles = modalCalendarData.daysWithEvents[dayNum]?.map((e) => e.actividad).join(' · ');

                    return (
                      <button
                        key={`day-${dayNum}`}
                        type="button"
                        onClick={() => handleCalendarDayClick(dayNum)}
                        title={eventTitles ? `Día ${dayNum}: ${eventTitles}` : `Seleccionar día ${dayNum}`}
                        className={`h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-bold border ${
                          isSingleSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400/50 scale-105 z-10'
                            : isStart
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300 z-10'
                            : isEnd
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-300 z-10'
                            : isInRange
                            ? 'bg-blue-100 text-blue-900 border-blue-200 font-extrabold'
                            : isWeekend
                            ? 'bg-slate-100/60 text-slate-400 border-slate-200/50 hover:bg-slate-200/70 hover:text-slate-700'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="leading-none">{dayNum}</span>
                        {/* Event Dot Indicator */}
                        {hasEvents && !isSingleSelected && !isStart && !isEnd && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute bottom-1"></span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Live Selection Summary Banner */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <span className="font-bold text-blue-700">Selección:</span>
                    {rangeStartDay ? (
                      <span className="font-semibold bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                        {rangeStartDay === rangeEndDay || !rangeEndDay
                          ? `${rangeStartDay} de ${modalCalendarData.monthName} 2026`
                          : `Del ${Math.min(rangeStartDay, rangeEndDay)} al ${Math.max(
                              rangeStartDay,
                              rangeEndDay
                            )} de ${modalCalendarData.monthName} (${
                              Math.abs(rangeEndDay - rangeStartDay) + 1
                            } días)`}
                      </span>
                    ) : (
                      <span className="text-slate-500 italic">
                        {calendarMode === 'single'
                          ? '👆 Haz clic en un día del calendario'
                          : '👆 Haz clic en el día de inicio y luego en el día de cierre'}
                      </span>
                    )}
                  </div>

                  {rangeStartDay && (
                    <button
                      type="button"
                      onClick={() => {
                        setRangeStartDay(null);
                        setRangeEndDay(null);
                        setFormDia('');
                      }}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-bold self-start sm:self-auto"
                    >
                      Limpiar selección
                    </button>
                  )}
                </div>
              </div>

              {/* Day / Date Input & Manual Text Override */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                    Texto en la Jornalización (Día o Rango):
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Sincronizado con el calendario</span>
                </div>
                <input
                  type="text"
                  value={formDia}
                  onChange={(e) => {
                    setFormDia(e.target.value);
                    const parsed = parseDaysFromText(e.target.value);
                    if (parsed.start) {
                      setRangeStartDay(parsed.start);
                      setRangeEndDay(parsed.end || parsed.start);
                    }
                  }}
                  placeholder="Ej: 23 feb, 19 mar, 01-05 abr, 30-31 mar"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 text-xs bg-white"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`${modalCalendarData.abbr}`);
                      setRangeStartDay(1);
                      setRangeEndDay(modalCalendarData.totalDays);
                    }}
                    className="text-[10px] text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md border border-blue-200 font-medium"
                  >
                    Todo el mes ({modalCalendarData.abbr})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`15 ${modalCalendarData.abbr}`);
                      setRangeStartDay(15);
                      setRangeEndDay(15);
                    }}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    Día 15
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormDia(`01-15 ${modalCalendarData.abbr}`);
                      setRangeStartDay(1);
                      setRangeEndDay(15);
                    }}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-medium"
                  >
                    1ª Quincena (01-15)
                  </button>
                </div>
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Categoría / Tipo de Suspensión:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {(Object.keys(SUSPENSION_CATEGORIES) as SuspensionCategory[]).map((catKey) => {
                    const meta = SUSPENSION_CATEGORIES[catKey];
                    const isSelected = formTipo === catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setFormTipo(catKey)}
                        className={`p-2 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? `${meta.cardBg} ${meta.badgeBorder} ring-2 ring-blue-500 font-extrabold shadow-2xs`
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        {renderCategoryIcon(catKey)}
                        <span className="truncate text-[11px]">{meta.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Activity / Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Descripción de la Actividad / Motivo:
                </label>
                <textarea
                  rows={2}
                  value={formActividad}
                  onChange={(e) => setFormActividad(e.target.value)}
                  placeholder="Ej: Pausa Pedagógica #1 - Formación y Evaluación Curricular"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 text-xs"
                  required
                />
              </div>

              {/* Quick Suggestions */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Plantillas Rápidas:
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('pausa');
                      setFormActividad('Pausa Pedagógica - Jornada de Formación y Evaluación Docente');
                    }}
                    className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md hover:bg-indigo-100 font-medium"
                  >
                    🧘 Pausa Pedagógica
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('feriado');
                      setFormActividad('Asueto Nacional Oficial');
                    }}
                    className="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md hover:bg-amber-100 font-medium"
                  >
                    🏖️ Asueto Nacional
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('institucional');
                      setFormActividad('Fiesta y Celebración Salesiana Institucional');
                    }}
                    className="text-[10px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md hover:bg-emerald-100 font-medium"
                  >
                    🏫 Fiesta Salesiana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormTipo('evaluacion');
                      setFormActividad('Cierre Evaluativo Bimestral y Registro TBox');
                    }}
                    className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded-md hover:bg-blue-100 font-medium"
                  >
                    📝 Cierre de Bimestre
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingEventId ? 'Actualizar Actividad' : 'Guardar en Jornalización'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
