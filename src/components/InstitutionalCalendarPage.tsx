import React, { useState } from 'react';
import { MonthStats, AcademicPeriod, InstitutionalHeader } from '../types';
import { Table1SemanasLaborales } from './Table1SemanasLaborales';
import { SuspensionesManager } from './SuspensionesManager';
import {
  academicPeriods2026,
  recuperacionExtraordinaria2026,
  modulesData1stYear,
  modulesData2ndYear,
  modulesData3rdYear,
} from '../data/jornalizacionData';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Bookmark,
  CalendarDays,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Edit2,
  FileSpreadsheet,
  Layers,
  GraduationCap,
  FileCheck2,
  HelpCircle,
  ChevronRight,
  Info,
  CalendarRange,
  BookOpen,
  Users,
} from 'lucide-react';

interface InstitutionalCalendarPageProps {
  months: MonthStats[];
  periods: AcademicPeriod[];
  headerData: InstitutionalHeader;
  onUpdateMonths: (newMonths: MonthStats[]) => void;
  onUpdatePeriods?: (newPeriods: AcademicPeriod[]) => void;
  onRecalculateJornalizacion?: () => void;
  onGoToJornalizacion?: () => void;
}

type CalendarSectionPart = 'todas' | 'parte1_semanas' | 'parte2_bimestres' | 'parte3_pausas' | 'parte4_per' | 'parte5_malla';

export const InstitutionalCalendarPage: React.FC<InstitutionalCalendarPageProps> = ({
  months,
  periods = academicPeriods2026,
  headerData,
  onUpdateMonths,
  onUpdatePeriods,
  onRecalculateJornalizacion,
  onGoToJornalizacion,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activePart, setActivePart] = useState<CalendarSectionPart>('todas');
  const [selectedBimestreIdx, setSelectedBimestreIdx] = useState<number | null>(null);

  const totalSemanas = months.reduce((a, b) => a + (Number(b.semanas) || 0), 0);
  const totalDias = months.reduce((a, b) => a + (Number(b.dias) || 0), 0);

  const effectivePeriods = periods && periods.length > 0 ? periods : academicPeriods2026;

  const handleSync = () => {
    if (onRecalculateJornalizacion) {
      onRecalculateJornalizacion();
      setSyncNotice('¡Fechas, semanas y días sincronizados con la Jornalización Curricular!');
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* Master Institutional Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>SALESIANO SAN JOSÉ · CALENDARIO ACADÉMICO {headerData.anoLectivo}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Estructura Oficial por Partes y Cronograma Detallado
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
                Configuración oficial de <strong>{headerData.institucion}</strong> · Educación Media (Distribución por Períodos Bimestrales). 
                Consulte y audite cada sección del documento institucional: semanas laborales, fechas de corte de notas, ingresos a TBox, pausas pedagógicas y periodo extraordinario.
              </p>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
              <button
                onClick={handleSync}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sincronizar Fechas</span>
              </button>
              {onGoToJornalizacion && (
                <button
                  onClick={onGoToJornalizacion}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Ver Jornalización</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 1er Asamblea General de Padres de Familia (Official Document Callout) */}
          <div className="p-4 rounded-2xl bg-blue-900/60 border border-blue-400/40 backdrop-blur-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-300 block">
                  Evento Institucional de Apertura {headerData.anoLectivo}
                </span>
                <strong className="text-sm text-white font-bold block">
                  1ª Asamblea General de Padres de Familia
                </strong>
                <span className="text-slate-300 text-xs">
                  Lunes 19 de enero de 2026 · <strong>4:30 p.m.</strong> · Área techada / Salones de clase
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                Convocatoria Oficial
              </span>
            </div>
          </div>

          {/* Quick Institutional Stats Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Semanas Lectivas:</span>
              <strong className="text-base text-blue-400 font-extrabold">{totalSemanas} Semanas</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Días Hábiles Lectivos:</span>
              <strong className="text-base text-emerald-400 font-extrabold">{totalDias} Días</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Períodos Académicos:</span>
              <strong className="text-base text-indigo-400 font-extrabold">{effectivePeriods.length} Bimestres (10 sem)</strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Carga Técnica Anual:</span>
              <strong className="text-base text-amber-400 font-extrabold">720 Horas (18h/sem)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Success Alert */}
      {syncNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-sm shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{syncNotice}</span>
          </div>
          {onGoToJornalizacion && (
            <button
              onClick={onGoToJornalizacion}
              className="text-xs font-bold text-emerald-800 underline hover:text-emerald-950"
            >
              Ir a las tablas &rarr;
            </button>
          )}
        </div>
      )}

      {/* SECTION SELECTOR (LECTURA Y REVISIÓN POR PARTES) */}
      <div className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Navegación del Documento por Partes</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Haga clic en una parte para enfocar su detalle o ver todas juntas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <button
            onClick={() => setActivePart('todas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'todas'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Ver Todo Completo</span>
            <span className="text-[10px] opacity-75 font-normal">Vista Integral</span>
          </button>

          <button
            onClick={() => setActivePart('parte1_semanas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'parte1_semanas'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Parte 1: Semanas y Días</span>
            <span className="text-[10px] opacity-75 font-normal">Mes a Mes</span>
          </button>

          <button
            onClick={() => setActivePart('parte2_bimestres')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'parte2_bimestres'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Parte 2: Bimestres & TBox</span>
            <span className="text-[10px] opacity-75 font-normal">Evaluaciones (35/35/30)</span>
          </button>

          <button
            onClick={() => setActivePart('parte3_pausas')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'parte3_pausas'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Parte 3: Pausas & Fiestas</span>
            <span className="text-[10px] opacity-75 font-normal">Descansos y Asuetos</span>
          </button>

          <button
            onClick={() => setActivePart('parte4_per')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'parte4_per'
                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Parte 4: P.E.R. & Cierre</span>
            <span className="text-[10px] opacity-75 font-normal">Recuperación y Graduación</span>
          </button>

          <button
            onClick={() => setActivePart('parte5_malla')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 border ${
              activePart === 'parte5_malla'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Parte 5: Malla Técnica</span>
            <span className="text-[10px] opacity-75 font-normal">1°, 2° y 3° Año</span>
          </button>
        </div>
      </div>

      {/* PARTE 1: TABLA 1 SEMANAS LABORALES Y DÍAS LECTIVOS */}
      {(activePart === 'todas' || activePart === 'parte1_semanas') && (
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold uppercase mb-1">
                Parte 1 del Documento
              </div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Semanas Laborales, Días Lectivos y Feriados por Mes</span>
              </h2>
              <p className="text-xs text-slate-500">
                Detalle mes a mes de las 40 semanas lectivas (182 días) oficiales del calendario 2026
              </p>
            </div>
            
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isEditMode
                  ? 'bg-amber-100 border-amber-300 text-amber-800'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditMode ? 'Finalizar Edición' : 'Editar Valores'}</span>
            </button>
          </div>

          <Table1SemanasLaborales
            months={months}
            anoLectivo={headerData.anoLectivo}
            isEditMode={isEditMode}
            onUpdateMonths={onUpdateMonths}
          />
        </section>
      )}

      {/* PARTE 2: PERÍODOS ACADÉMICOS, BIMESTRES Y FECHAS TBOX DETALLADAS */}
      {(activePart === 'todas' || activePart === 'parte2_bimestres') && (
        <section className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold uppercase mb-1">
              Parte 2 del Documento
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Los 4 Períodos Académicos (Bimestres) y Cronograma de TBox {headerData.anoLectivo}
            </h2>
            <p className="text-xs text-slate-500">
              Desglose detallado de actividades sumativas (35%), formativas (35%), pruebas objetivas (30%), fechas de aplicación y límites de ingreso a TBox.
            </p>
          </div>

          {/* Cards Overview of 4 Bimestres */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {effectivePeriods.map((p, idx) => {
              const isSelected = selectedBimestreIdx === idx;
              const periodKey = p.nombre || `period-${idx}`;
              const fechaIni = p.inicio || (p as any).fechaInicio || '';
              const fechaFinVal = p.fin || (p as any).fechaFin || '';

              return (
                <div
                  key={periodKey}
                  onClick={() => setSelectedBimestreIdx(isSelected ? null : idx)}
                  className={`rounded-2xl border p-4 shadow-xs transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        B{idx + 1}
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs">{p.nombre}</h3>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                      10 sem
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rango:</span>
                      <strong className="text-slate-800">{fechaIni} – {fechaFinVal}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Temarios:</span>
                      <span className="font-medium text-slate-700">{p.entregaTemarios || '---'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Boletas:</span>
                      <strong className="text-emerald-700 font-bold">{p.entregaBoletas || '---'}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recuperación:</span>
                      <span className="text-amber-800 font-medium">{p.recuperacionOrdinaria || '---'}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-indigo-600 font-bold flex items-center justify-between">
                    <span>{isSelected ? 'Ocultar tabla de detalle' : 'Ver detalle de actividades'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Complete Detailed Evaluation Table for Each Bimestre */}
          <div className="space-y-6">
            {effectivePeriods.map((p, pIdx) => {
              if (selectedBimestreIdx !== null && selectedBimestreIdx !== pIdx) return null;

              return (
                <div key={pIdx} className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                  <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                        {pIdx + 1}
                      </span>
                      <h3 className="font-bold text-sm text-slate-100">{p.nombre}</h3>
                      <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                        {p.inicio} al {p.fin}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-3">
                      <span>Entrega de Boletas: <strong className="text-emerald-400">{p.entregaBoletas || 'Por definir'}</strong></span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold">
                          <th className="p-3 w-10 text-center">#</th>
                          <th className="p-3">Actividades / Evento Evaluativo</th>
                          <th className="p-3 w-32 font-semibold text-slate-800">Fecha inicio</th>
                          <th className="p-3 w-32 font-semibold text-slate-800">Fecha Cierre</th>
                          <th className="p-3 w-36 font-semibold text-indigo-900">Ingreso a TBox</th>
                          <th className="p-3 w-28 text-center">Ponderación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {p.actividades.map((act, aIdx) => {
                          const isPO = act.porcentaje === '30%' || act.tipo === 'objetiva';
                          const isFormativa = act.porcentaje === '35%' || act.tipo === 'formativa';
                          const isBoletas = act.tipo === 'boletas';

                          // Extract clean start and close dates
                          let fechaIniClean = act.fechaInicio || '';
                          let fechaFinClean = act.fechaCierre || '';

                          if (!fechaIniClean && act.fechas) {
                            if (act.fechas.includes('–')) {
                              const parts = act.fechas.split('–');
                              fechaIniClean = parts[0]?.trim() || '';
                              fechaFinClean = parts[1]?.trim() || '';
                            } else {
                              fechaIniClean = act.fechas;
                              fechaFinClean = act.fechas;
                            }
                          }

                          return (
                            <tr
                              key={aIdx}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                isPO ? 'bg-amber-50/40 font-medium' : isFormativa ? 'bg-blue-50/30' : isBoletas ? 'bg-emerald-50/40' : ''
                              }`}
                            >
                              <td className="p-3 text-center text-slate-400 font-mono">{aIdx + 1}</td>
                              <td className="p-3">
                                <span className="font-semibold text-slate-900">{act.nombre}</span>
                              </td>
                              <td className="p-3 text-slate-800 font-medium whitespace-nowrap">
                                {fechaIniClean || '---'}
                              </td>
                              <td className="p-3 text-slate-800 font-medium whitespace-nowrap">
                                {fechaFinClean || '---'}
                              </td>
                              <td className="p-3 whitespace-nowrap">
                                {act.ingresoTBox && act.ingresoTBox !== '------------' ? (
                                  <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                                    {act.ingresoTBox}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono">------------</span>
                                )}
                              </td>
                              <td className="p-3 text-center whitespace-nowrap">
                                {act.porcentaje ? (
                                  <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                                    isPO ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'
                                  }`}>
                                    {act.porcentaje}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-mono text-[11px]">Formativo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* PARTE 3: PAUSAS PEDAGÓGICAS, DESCANSOS Y ASUETOS INSTITUCIONALES */}
      {(activePart === 'todas' || activePart === 'parte3_pausas') && (
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold uppercase mb-1">
              Parte 3 del Documento
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Pausas Pedagógicas, Descansos Compensatorios y Asuetos 2026
            </h2>
            <p className="text-xs text-slate-500">
              Registro completo de pausas pedagógicas (#1, #2 y #3), EDEPA, Fiestón de San José, Semana Santa, Vacaciones Agostinas y feriados.
            </p>
          </div>

          <SuspensionesManager
            months={months}
            isEditMode={isEditMode}
            onUpdateMonths={onUpdateMonths}
          />
        </section>
      )}

      {/* PARTE 4: PERIODO EXTRAORDINARIO DE RECUPERACIÓN (P.E.R.) Y GRADUACIONES */}
      {(activePart === 'todas' || activePart === 'parte4_per') && (
        <section className="space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold uppercase mb-1">
              Parte 4 del Documento
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {recuperacionExtraordinaria2026.nombre}
            </h2>
            <p className="text-xs text-slate-500">
              Ponderación oficial: <strong>40% Guía de Estudio + 60% Prueba Final (Temario)</strong> · Artículos 89° y 90° de la Ley General de Educación.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* PER Events Table (2 Cols) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-purple-900 text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                <span>Cronograma del Proceso de Recuperación P.E.R.</span>
                <span className="text-[11px] text-purple-200">Noviembre 2026</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                {recuperacionExtraordinaria2026.eventos.map((ev, eIdx) => (
                  <div key={eIdx} className="p-3.5 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">{ev.detalle}</span>
                      <span className="text-slate-500 text-[11px]">Modalidad: {ev.tbox}</span>
                    </div>
                    <span className="font-bold text-purple-800 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 text-xs shrink-0 self-start sm:self-center">
                      {ev.fecha}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Graduations & Closings Box (1 Col) */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-4">
              <div className="flex items-center gap-2 text-purple-800 text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-4 h-4" />
                <span>Graduaciones y Clausuras 2026</span>
              </div>

              <div className="space-y-2.5">
                {recuperacionExtraordinaria2026.graduaciones.map((grad, gIdx) => (
                  <div key={gIdx} className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <span className="text-slate-500 text-[11px] block">{grad.nivel}</span>
                    <strong className="text-slate-900 text-xs font-bold block mt-0.5">{grad.fecha}</strong>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] space-y-1">
                <span className="font-bold block">Nota Importante MINEDUCYT:</span>
                <p>Las pruebas extraordinarias aplican a estudiantes que obtuvieron promedio inferior a 6.0 en el registro general.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PARTE 5: MALLA TÉCNICA CURRICULAR (1°, 2° Y 3° AÑO) */}
      {(activePart === 'todas' || activePart === 'parte5_malla') && (
        <section className="space-y-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="border-b border-slate-100 pb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold uppercase mb-1">
              Parte 5 del Documento
            </div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Malla Curricular Técnica Modular de Educación Media (18h/semana)
            </h2>
            <p className="text-xs text-slate-500">
              Resumen de los módulos técnicos para 1° Año (8 módulos), 2° Año (8 módulos) y 3° Año (8 módulos) distribuidos en 40 semanas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Year */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 uppercase">1° Año de Bachillerato</h4>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                  {modulesData1stYear.length} Módulos
                </span>
              </div>
              <div className="space-y-1.5 text-xs max-h-52 overflow-y-auto pr-1">
                {modulesData1stYear.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-100 flex justify-between">
                    <span className="font-medium text-slate-800 truncate mr-2">{m.codigo}: {m.nombre}</span>
                    <strong className="text-slate-600 shrink-0">{m.totalHoras}h</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* 2nd Year */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 uppercase">2° Año de Bachillerato</h4>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  {modulesData2ndYear.length} Módulos
                </span>
              </div>
              <div className="space-y-1.5 text-xs max-h-52 overflow-y-auto pr-1">
                {modulesData2ndYear.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-100 flex justify-between">
                    <span className="font-medium text-slate-800 truncate mr-2">{m.codigo}: {m.nombre}</span>
                    <strong className="text-slate-600 shrink-0">{m.totalHoras}h</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* 3rd Year */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 uppercase">3° Año de Bachillerato</h4>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                  {modulesData3rdYear.length} Módulos
                </span>
              </div>
              <div className="space-y-1.5 text-xs max-h-52 overflow-y-auto pr-1">
                {modulesData3rdYear.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white border border-slate-100 flex justify-between">
                    <span className="font-medium text-slate-800 truncate mr-2">{m.codigo}: {m.nombre}</span>
                    <strong className="text-slate-600 shrink-0">{m.totalHoras}h</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Floating Action Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">
              ¿Listo para ver las matrices y tablas de Jornalización?
            </h4>
            <p className="text-xs text-slate-400">
              Las fechas y semanas configuradas aquí se reflejarán de inmediato en las matrices de 1°, 2° y 3° año.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleSync}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
          >
            Sincronizar Fechas
          </button>
          {onGoToJornalizacion && (
            <button
              onClick={onGoToJornalizacion}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <span>Ir a Tablas de Jornalización</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
