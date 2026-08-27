import React from 'react';
import { AcademicPeriod, MonthStats } from '../types';
import { SuspensionesManager } from './SuspensionesManager';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Bookmark } from 'lucide-react';

interface TimelineProps {
  periods: AcademicPeriod[];
  months: MonthStats[];
  onUpdateMonths?: (newMonths: MonthStats[]) => void;
}

export const AcademicCalendarTimeline: React.FC<TimelineProps> = ({ periods, months, onUpdateMonths }) => {
  return (
    <div className="space-y-6">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-blue-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4" />
            <span>Año Lectivo 2026</span>
          </div>
          <div className="text-xl font-extrabold text-slate-800">19 Ene – 16 Oct</div>
          <p className="text-xs text-slate-500 mt-1">40 semanas académicas oficiales</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Carga Horaria Modular</span>
          </div>
          <div className="text-xl font-extrabold text-slate-800">18 HC / Semana</div>
          <p className="text-xs text-slate-500 mt-1">720 Horas clase anuales técnicas</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-amber-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            <span>Periodos Vacacionales</span>
          </div>
          <div className="text-sm font-bold text-slate-800">Semana Santa & Fiestas Agostinas</div>
          <p className="text-xs text-slate-500 mt-0.5">30 mar-05 abr · 04-08 ago</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 text-purple-600 mb-1 text-xs font-bold uppercase tracking-wider">
            <Bookmark className="w-4 h-4" />
            <span>P.E.R. & Graduación</span>
          </div>
          <div className="text-sm font-bold text-slate-800">03-06 Nov / 02 Dic</div>
          <p className="text-xs text-slate-500 mt-0.5">Recuperación extraordinaria y clausura</p>
        </div>
      </div>

      {/* 4 Periods of Academic Year 2026 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5">
          <h2 className="text-base font-bold text-slate-800">
            DISTRIBUCIÓN DE PERIODOS Y BIMESTRES ACADÉMICOS · EDUCACIÓN MEDIA 2026
          </h2>
          <p className="text-xs text-slate-500">
            Cronograma institucional de pruebas diagnósticas, actividades sumativas (35%), pruebas objetivas (30%) y entrega de boletas
          </p>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {periods.map((period, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 hover:border-blue-300 hover:bg-white transition-all shadow-xs"
            >
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  {period.nombre}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {period.inicio} – {period.fin}
                </span>
              </div>

              <div className="space-y-2">
                {period.actividades.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-medium text-slate-700">{act.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {act.porcentaje && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                          {act.porcentaje}
                        </span>
                      )}
                      <span className="text-slate-500 font-mono text-[11px]">{act.fechas}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Detalle de Descansos y Suspensiones */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <SuspensionesManager
          months={months}
          isEditMode={true}
          onUpdateMonths={onUpdateMonths}
        />
      </div>

    </div>
  );
};
