import React from 'react';
import {
  UploadCloud,
  UserCheck,
  FileSpreadsheet,
  Printer,
  BookOpen,
  Calendar,
  X,
  GraduationCap,
  Sparkles,
  Download,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Menu,
  FileText,
} from 'lucide-react';
import { InstitutionalHeader } from '../types';

export type AppView =
  | 'subir-documento'
  | 'asignacion'
  | 'jornalizacion'
  | 'planificacion-didactica'
  | 'guion-clase'
  | 'impresion'
  | 'descriptores'
  | 'calendario';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  headerData: InstitutionalHeader;
  currentGrade: '10' | '11' | '12';
  onSelectGrade: (grade: '10' | '11' | '12') => void;
  totalModulesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  setActiveView,
  headerData,
  currentGrade,
  onSelectGrade,
  totalModulesCount,
}) => {
  const menuItems = [
    {
      id: 'subir-documento' as AppView,
      title: 'Subir Documento (PDF, Excel, JSON)',
      subtitle: 'Lector inteligente y extractor curricular',
      icon: UploadCloud,
      badge: 'PDF / Excel',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'calendario' as AppView,
      title: 'Fechas y Calendario Institucional',
      subtitle: 'Semanas, bimestres y descansos generales',
      icon: Calendar,
      badge: 'General 2026',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      activeColor: 'bg-teal-600 text-white',
    },
    {
      id: 'jornalizacion' as AppView,
      title: 'Jornalización Curricular (Tablas)',
      subtitle: 'Carga horaria, matriz de fechas y módulos',
      icon: FileSpreadsheet,
      badge: `${totalModulesCount} Módulos`,
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      activeColor: 'bg-indigo-600 text-white',
    },
    {
      id: 'planificacion-didactica' as AppView,
      title: 'Planificación Didáctica',
      subtitle: 'Saberes, Actividades y Evaluación',
      icon: GraduationCap,
      badge: 'MINED',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      activeColor: 'bg-emerald-600 text-white',
    },
    {
      id: 'guion-clase' as AppView,
      title: 'Guión de Clases 2026',
      subtitle: 'Subcronograma de sesiones por módulo',
      icon: FileText,
      badge: 'CSSJ 2026',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      activeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'asignacion' as AppView,
      title: 'Docente y Selección de Grado',
      subtitle: 'Asignar docente, institución y año escolar',
      icon: UserCheck,
      badge: `${currentGrade}° Año`,
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      activeColor: 'bg-blue-600 text-white',
    },
    {
      id: 'impresion' as AppView,
      title: 'Área de Impresión y Word',
      subtitle: 'Exportar .DOCX membretado y vista PDF',
      icon: Printer,
      badge: 'Oficial',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      activeColor: 'bg-amber-600 text-white',
    },
    {
      id: 'descriptores' as AppView,
      title: 'Descriptores Curriculares',
      subtitle: 'Competencias MINED y contenidos',
      icon: BookOpen,
      badge: 'MINED',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      activeColor: 'bg-purple-600 text-white',
    },
  ];

  const handleNavClick = (viewId: AppView) => {
    setActiveView(viewId);
    // On small mobile screens, auto-close sidebar on item selection
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop for mobile / overlay mode */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 transition-opacity duration-300 no-print ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 left-0 bottom-0 w-80 sm:w-84 bg-slate-900 text-slate-100 border-r border-slate-800 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black shadow-inner shadow-blue-400/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-400 tracking-wider uppercase flex items-center gap-1.5">
                <span>MINED · SIGES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <h2 className="text-sm font-bold text-slate-100 leading-tight">
                Jornalización Académica
              </h2>
            </div>
          </div>

          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grade Quick Selector in Sidebar */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              Año de Bachillerato:
            </span>
            <span className="text-blue-400 font-semibold">{currentGrade}° Año Activo</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectGrade('10')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                currentGrade === '10'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              1° (10°)
            </button>
            <button
              onClick={() => onSelectGrade('11')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                currentGrade === '11'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              2° (11°)
            </button>
            <button
              onClick={() => onSelectGrade('12')}
              className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                currentGrade === '12'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              3° (12°)
            </button>
          </div>
        </div>

        {/* Navigation Menu List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
            Módulos del Sistema
          </div>

          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group ${
                  isActive
                    ? `${item.activeColor} shadow-md`
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white shadow-inner'
                        : 'bg-slate-800 text-slate-400 group-hover:text-blue-400 group-hover:bg-slate-700/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold leading-tight truncate">
                      {item.title}
                    </div>
                    <div
                      className={`text-[11px] truncate ${
                        isActive ? 'text-white/80' : 'text-slate-400'
                      }`}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-white/25 text-white border-white/30'
                        : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      isActive
                        ? 'text-white translate-x-0.5'
                        : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info Box in Sidebar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              Doc
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-slate-400">Docente asignado:</div>
              <div className="font-bold text-slate-200 truncate" title={headerData.docente}>
                {headerData.docente}
              </div>
              <div className="text-[10px] text-blue-400 truncate mt-0.5">
                {headerData.gradoSeccion}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
