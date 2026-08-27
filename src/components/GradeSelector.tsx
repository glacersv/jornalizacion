import React from 'react';
import { GraduationCap, Clock, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface GradeSelectorProps {
  currentGrade: '10' | '11' | '12';
  onSelectGrade: (grade: '10' | '11' | '12') => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
}

export const GradeSelector: React.FC<GradeSelectorProps> = ({
  currentGrade,
  onSelectGrade,
  isEditMode,
  onToggleEditMode,
}) => {
  const grades = [
    {
      id: '10' as const,
      label: '1° Año Técnico',
      gradeNum: '10° Grado',
      desc: 'Fundamentos y Técnicas Básicas de Diseño',
      hours: '720 hrs (18h/sem)',
      modulesCount: 9,
      badge: 'BTVDG 1',
    },
    {
      id: '11' as const,
      label: '2° Año Técnico',
      gradeNum: '11° Grado',
      desc: 'Especialización, Medios y Editorial',
      hours: '720 hrs (18h/sem)',
      modulesCount: 9,
      badge: 'BTVDG 2',
    },
    {
      id: '12' as const,
      label: '3° Año Técnico',
      gradeNum: '12° Grado',
      desc: 'Producción Multimedia, Web y Emprendimiento',
      hours: '1,200 hrs (30h/sem)',
      modulesCount: 9,
      badge: 'BTVDG 3',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <GraduationCap className="w-5 h-5" />
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Seleccione el Año de Estudio / Nivel Académico</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                {currentGrade === '10' ? '1° Año Activo' : currentGrade === '11' ? '2° Año Activo' : '3° Año Activo'}
              </span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Haga clic en cualquiera de los 3 años de estudio para cargar automáticamente los módulos oficiales, carga horaria y matriz de fechas correspondientes.
          </p>
        </div>

        {/* Edit mode toggle switch */}
        <div className="flex items-center gap-3">
          <button
            id="btn-toggle-edit-mode"
            type="button"
            onClick={onToggleEditMode}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border shadow-xs cursor-pointer ${
              isEditMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 ring-2 ring-amber-300'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isEditMode ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
            <span>{isEditMode ? 'Modo Edición Activado' : 'Activar Modo Edición Directa'}</span>
          </button>
        </div>
      </div>

      {/* Grade Option Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-4">
        {grades.map((g) => {
          const isSelected = currentGrade === g.id;
          return (
            <button
              key={g.id}
              id={`btn-select-grade-${g.id}`}
              type="button"
              onClick={() => onSelectGrade(g.id)}
              className={`text-left p-4 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/80 scale-[1.01]'
                  : 'bg-slate-50/80 hover:bg-blue-50/50 text-slate-800 border-slate-200 hover:border-blue-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Activo</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isSelected
                        ? 'bg-blue-500/40 text-blue-200 border border-blue-400/30'
                        : 'bg-slate-200 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-800'
                    }`}
                  >
                    {g.gradeNum}
                  </span>
                  <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                    {g.badge}
                  </span>
                </div>

                <div className="text-sm font-bold mt-1">{g.label}</div>
                <div className={`text-xs mt-0.5 line-clamp-2 ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                  {g.desc}
                </div>
              </div>

              <div className={`mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] ${
                isSelected ? 'border-slate-800 text-slate-300' : 'border-slate-200/70 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5">
                  <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span className={isSelected ? 'text-blue-300 font-semibold' : 'text-slate-700 font-medium'}>
                    {g.hours}
                  </span>
                </div>
                <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                  {g.modulesCount} Módulos
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
