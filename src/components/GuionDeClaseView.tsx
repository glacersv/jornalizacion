import React, { useState, useMemo, useRef } from 'react';
import {
  ModuleDescriptor,
  InstitutionalHeader,
  GuionDeClase,
  GuionEvaluacionRow,
} from '../types';
import {
  generateModuleGuiones,
  exportGuionesToWord,
} from '../utils/guionDeClaseHelper';
import {
  FileText,
  Download,
  Printer,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Layers,
  Clock,
  Calendar,
  Plus,
  Trash2,
  Edit3,
  Eye,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  GraduationCap,
  Save,
  Copy,
  Info,
} from 'lucide-react';

interface GuionDeClaseViewProps {
  modules: ModuleDescriptor[];
  selectedModuleCode?: string;
  onSelectModuleCode?: (code: string) => void;
  headerData: InstitutionalHeader;
  anoLectivo: string;
}

export const GuionDeClaseView: React.FC<GuionDeClaseViewProps> = ({
  modules,
  selectedModuleCode,
  onSelectModuleCode,
  headerData,
  anoLectivo,
}) => {
  // Active module
  const currentModule =
    modules.find((m) => m.codigo === selectedModuleCode) || modules[0] || ({} as ModuleDescriptor);

  // Local storage / state of guiones keyed by module code
  const [guionesByModule, setGuionesByModule] = useState<Record<string, GuionDeClase[]>>({});
  const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'timeline' | 'preview'>('interactive');

  const printAreaRef = useRef<HTMLDivElement>(null);

  // Get or initialize guiones for current module
  const currentGuiones = useMemo(() => {
    if (guionesByModule[currentModule.codigo]) {
      return guionesByModule[currentModule.codigo];
    }
    const generated = generateModuleGuiones(currentModule, headerData, anoLectivo);
    return generated;
  }, [guionesByModule, currentModule, headerData, anoLectivo]);

  // Safe active guion
  const safeSessionIndex = Math.min(Math.max(0, activeSessionIndex), Math.max(0, currentGuiones.length - 1));
  const activeGuion = currentGuiones[safeSessionIndex] || currentGuiones[0];

  // Handler to update a field in the active guion
  const handleUpdateActiveGuion = (updates: Partial<GuionDeClase>) => {
    const updatedList = [...currentGuiones];
    updatedList[safeSessionIndex] = {
      ...updatedList[safeSessionIndex],
      ...updates,
    };
    setGuionesByModule((prev) => ({
      ...prev,
      [currentModule.codigo]: updatedList,
    }));
  };

  // Handler to reset all guiones for current module to generated defaults
  const handleResetToDefaults = () => {
    if (window.confirm('¿Deseas restablecer todos los guiones de este módulo a los valores pedagógicos sugeridos por el MINED?')) {
      const generated = generateModuleGuiones(currentModule, headerData, anoLectivo);
      setGuionesByModule((prev) => ({
        ...prev,
        [currentModule.codigo]: generated,
      }));
      setActiveSessionIndex(0);
      setIsEditing(false);
    }
  };

  // Add evaluation row
  const handleAddEvalRow = () => {
    const currentRows = activeGuion.actividadesEvaluacion || [];
    const newRow: GuionEvaluacionRow = {
      no: currentRows.length + 1,
      actividad: 'Actividad de evaluación formativa/sumativa',
      ponderacion: '10%',
      fechaRealizacion: activeGuion.fecha,
    };
    handleUpdateActiveGuion({
      actividadesEvaluacion: [...currentRows, newRow],
    });
  };

  // Remove evaluation row
  const handleRemoveEvalRow = (idx: number) => {
    const currentRows = activeGuion.actividadesEvaluacion || [];
    if (currentRows.length <= 1) return;
    const updated = currentRows.filter((_, i) => i !== idx).map((r, i) => ({ ...r, no: i + 1 }));
    handleUpdateActiveGuion({ actividadesEvaluacion: updated });
  };

  // Update evaluation row
  const handleUpdateEvalRow = (idx: number, field: keyof GuionEvaluacionRow, value: any) => {
    const currentRows = [...(activeGuion.actividadesEvaluacion || [])];
    currentRows[idx] = { ...currentRows[idx], [field]: value };
    handleUpdateActiveGuion({ actividadesEvaluacion: currentRows });
  };

  // Direct print
  const handlePrint = () => {
    window.print();
  };

  // Export to Word
  const handleExportWordSingle = () => {
    exportGuionesToWord([activeGuion], headerData, currentModule, 'single');
  };

  const handleExportWordAll = () => {
    exportGuionesToWord(currentGuiones, headerData, currentModule, 'all');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Module Selection & Sub-chronogram Meta */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600/80 text-white text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md tracking-wider border border-blue-400/30">
                Formato Oficial 2026
              </span>
              <span className="text-blue-300 text-xs font-semibold">
                Colegio Salesiano San José · Santa Ana
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-400" />
              <span>Guión de Clases 2026 (Subcronograma por Módulo)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Secuencia estructurada de sesiones de clase alineada a las <strong>6 Etapas de la Acción Completa</strong>, fases evaluativas (FPP, FEP, FVP) e indicadores de logro del MINED.
            </p>
          </div>

          {/* Module Selector dropdown */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10">
              <label htmlFor="guion-module-select" className="text-[10px] uppercase font-bold text-blue-200 block px-2 pt-1">
                Seleccionar Módulo Técnico
              </label>
              <select
                id="guion-module-select"
                value={currentModule.codigo}
                onChange={(e) => {
                  if (onSelectModuleCode) {
                    onSelectModuleCode(e.target.value);
                  }
                  setActiveSessionIndex(0);
                }}
                className="bg-transparent text-white font-bold text-sm px-2 py-1 focus:outline-hidden cursor-pointer"
              >
                {modules.map((m) => (
                  <option key={m.codigo} value={m.codigo} className="bg-slate-900 text-white">
                    [{m.codigo}] {m.nombre} ({m.duracionHoras}h)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sub-chronogram Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Módulo</div>
            <div className="font-bold text-blue-300 truncate">[{currentModule.codigo}] {currentModule.nombre}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Duración Total</div>
            <div className="font-bold text-emerald-300">{currentModule.duracionHoras} Horas ({currentModule.semanas} Semanas)</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Período Calendario</div>
            <div className="font-bold text-amber-300">
              {currentModule.diaInicio} {currentModule.mesInicio} - {currentModule.diaFin} {currentModule.mesFin}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Sesiones / Guiones</div>
            <div className="font-bold text-purple-300">{currentGuiones.length} Guiones Pedagógicos</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Docente Asignado</div>
            <div className="font-bold text-slate-200 truncate">{headerData.docente}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <div className="text-[10px] text-slate-400 font-medium">Grado y Sección</div>
            <div className="font-bold text-slate-200 truncate">{headerData.gradoSeccion}</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-cronograma Timeline Buttons */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">
              Subcronograma de Sesiones de Clase ({currentGuiones.length} Guiones · 6 Etapas de Acción Completa)
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isEditing
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Modo Edición Activado' : 'Editar Guión'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restablecer todos los guiones a los valores por defecto del MINED"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>

            <button
              type="button"
              onClick={handleExportWordSingle}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-700 hover:bg-blue-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar guión seleccionado a Microsoft Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (Sesión Actual)</span>
            </button>

            <button
              type="button"
              onClick={handleExportWordAll}
              className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Exportar todos los guiones del módulo a un solo archivo Word"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Word (Todos los {currentGuiones.length} Guiones)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* Session cards pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {currentGuiones.map((g, idx) => {
            const isSelected = idx === safeSessionIndex;
            const stageNum = g.etapaNumero || idx + 1;
            let badgeBg = 'bg-blue-100 text-blue-800 border-blue-200';
            if (stageNum === 3 || stageNum === 4) {
              badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-200';
            } else if (stageNum === 5 || stageNum === 6) {
              badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
            }

            return (
              <button
                key={g.id || idx}
                type="button"
                onClick={() => setActiveSessionIndex(idx)}
                className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase">
                      Sesión {idx + 1}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badgeBg}`}>
                      {g.tiempo.split(' ')[0]} {g.tiempo.split(' ')[1] || 'h'}
                    </span>
                  </div>
                  <div className="text-xs font-black text-slate-800 line-clamp-1">
                    {g.etapaAccionCompleta || `Etapa ${stageNum}`}
                  </div>
                </div>

                <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                  <span className="font-semibold text-blue-700">{g.faseEvaluacion?.split(':')[0] || 'Fase'}</span>
                  <span>Ver Guión →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Guion de Clase Official Layout Display & Editor */}
      <div
        ref={printAreaRef}
        id="printable-guion-area"
        className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 font-sans print:p-0 print:border-none print:shadow-none"
      >
        {/* INSTITUTIONAL HEADER */}
        <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4 mb-4">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-blue-900 uppercase tracking-tight font-serif">
              Guion de clase {anoLectivo}
            </h2>
            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
              Módulo [{activeGuion.moduloCodigo}]: <span className="text-slate-900 font-bold">{activeGuion.moduloNombre}</span>
              &nbsp;·&nbsp;
              <span className="text-blue-700 font-bold">{activeGuion.etapaAccionCompleta}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-sm font-black text-slate-900 uppercase tracking-wider">
              COLEGIO SALESIANO
            </div>
            <div className="text-xl font-black text-blue-600 uppercase tracking-wide">
              SAN JOSÉ
            </div>
            <div className="text-[10px] text-slate-500 font-semibold">
              Santa Ana, El Salvador
            </div>
          </div>
        </div>

        {/* GENERAL INFO FORM / TABLE */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-5 text-xs sm:text-sm">
          {/* Row 1: Docente */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200 bg-slate-50/70">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Docente :
            </div>
            <div className="p-2 sm:p-3 sm:col-span-5 font-semibold text-slate-900 flex items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.docente}
                  onChange={(e) => handleUpdateActiveGuion({ docente: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-sm font-semibold"
                />
              ) : (
                activeGuion.docente
              )}
            </div>
          </div>

          {/* Row 2: Grado y sección, Trimestre, Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Grado y sección:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-2 border-r border-slate-200 flex items-center font-medium">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.gradoSeccion}
                  onChange={(e) => handleUpdateActiveGuion({ gradoSeccion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.gradoSeccion
              )}
            </div>

            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Trimestre:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-1 border-r border-slate-200 flex items-center font-medium">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.trimestre}
                  onChange={(e) => handleUpdateActiveGuion({ trimestre: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.trimestre
              )}
            </div>

            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Fecha:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-1 flex items-center font-semibold text-slate-800 text-xs">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.fecha}
                  onChange={(e) => handleUpdateActiveGuion({ fecha: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.fecha
              )}
            </div>
          </div>

          {/* Row 3: Unidad */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200 bg-slate-50/40">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Unidad :
            </div>
            <div className="p-2 sm:p-3 sm:col-span-5 font-semibold text-slate-900 flex items-center">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.unidad}
                  onChange={(e) => handleUpdateActiveGuion({ unidad: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                />
              ) : (
                activeGuion.unidad
              )}
            </div>
          </div>

          {/* Row 4: Contenido y Tiempo */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Contenido :
            </div>
            <div className="p-2 sm:p-3 sm:col-span-3 border-r border-slate-200 flex items-center font-medium">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.contenido}
                  onChange={(e) => handleUpdateActiveGuion({ contenido: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.contenido
              )}
            </div>

            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-center">
              Tiempo:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-1 flex items-center font-bold text-blue-800">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.tiempo}
                  onChange={(e) => handleUpdateActiveGuion({ tiempo: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                />
              ) : (
                activeGuion.tiempo
              )}
            </div>
          </div>

          {/* Row 5: Objetivo de la clase */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-start">
              Objetivo de la clase:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-5 text-slate-800 leading-relaxed">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.objetivoClase}
                  onChange={(e) => handleUpdateActiveGuion({ objetivoClase: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.objetivoClase
              )}
            </div>
          </div>

          {/* Row 6: Indicador de logro */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200 bg-sky-50/40">
            <div className="p-2 sm:p-3 font-bold text-sky-900 bg-sky-100/70 sm:col-span-1 border-r border-slate-200 flex items-start">
              Indicador de logro:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-5 font-semibold text-sky-950 leading-relaxed">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.indicadorLogro}
                  onChange={(e) => handleUpdateActiveGuion({ indicadorLogro: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold"
                />
              ) : (
                activeGuion.indicadorLogro
              )}
            </div>
          </div>

          {/* Row 7: Competencias específicas */}
          <div className="grid grid-cols-1 sm:grid-cols-6">
            <div className="p-2 sm:p-3 font-bold text-slate-700 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-start">
              Competencias específicas:
            </div>
            <div className="p-2 sm:p-3 sm:col-span-5 text-slate-800 leading-relaxed">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.competenciasEspecificas}
                  onChange={(e) => handleUpdateActiveGuion({ competenciasEspecificas: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                />
              ) : (
                activeGuion.competenciasEspecificas
              )}
            </div>
          </div>
        </div>

        {/* EJE TRANSVERSAL BOX */}
        <div className="border border-slate-300 rounded-xl p-3 sm:p-4 mb-5 bg-slate-50 border-l-4 border-l-blue-600 text-xs sm:text-sm">
          <span className="font-bold text-slate-900">
            Eje transversal (si aplica) trabajarlo con una estrategia dinámica que active a los estudiantes, tomando en cuenta que se intenta dar a conocer algo nuevo en su proceso de aprendizaje:
          </span>
          <div className="mt-1.5 text-slate-700 leading-relaxed">
            {isEditing ? (
              <textarea
                rows={2}
                value={activeGuion.ejeTransversal}
                onChange={(e) => handleUpdateActiveGuion({ ejeTransversal: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            ) : (
              activeGuion.ejeTransversal
            )}
          </div>
        </div>

        {/* 2-COLUMN TABLE: SITUACIONES DE APRENDIZAJE VS EVALUACIÓN */}
        <div className="border border-slate-300 rounded-xl overflow-hidden mb-5 text-xs sm:text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 bg-blue-900 text-white font-black uppercase text-center border-b border-slate-300">
            <div className="p-3 border-b md:border-b-0 md:border-r border-blue-800 tracking-wider">
              SITUACIONES DE APRENDIZAJE
            </div>
            <div className="p-3 tracking-wider">
              EVALUACIÓN
              <span className="block text-[10px] font-normal lowercase opacity-90">
                (diagnóstica, formativa o sumativas)
              </span>
            </div>
          </div>

          {/* INICIO */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
            <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 bg-white">
              <div className="font-black text-blue-900 text-sm mb-1.5 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                Inicio
              </div>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activeGuion.inicioSituacion}
                  onChange={(e) => handleUpdateActiveGuion({ inicioSituacion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">{activeGuion.inicioSituacion}</p>
              )}
            </div>

            <div className="p-4 bg-slate-50/70">
              <div className="font-bold text-sky-800 text-xs mb-1.5 uppercase flex items-center justify-between">
                <span>Estrategia Diagnóstica (Sin valor numérico)</span>
                <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">Diagnóstica</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activeGuion.inicioEvaluacion}
                  onChange={(e) => handleUpdateActiveGuion({ inicioEvaluacion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed text-xs">{activeGuion.inicioEvaluacion}</p>
              )}
            </div>
          </div>

          {/* DESARROLLO */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
            <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 bg-white">
              <div className="font-black text-blue-900 text-sm mb-1.5 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                Desarrollo
              </div>
              {isEditing ? (
                <textarea
                  rows={5}
                  value={activeGuion.desarrolloSituacion}
                  onChange={(e) => handleUpdateActiveGuion({ desarrolloSituacion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">{activeGuion.desarrolloSituacion}</p>
              )}
            </div>

            <div className="p-4 bg-slate-50/70">
              <div className="font-bold text-emerald-800 text-xs mb-1.5 uppercase flex items-center justify-between">
                <span>Evaluación Formativa (Comprensión e interpretación)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Formativa</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={5}
                  value={activeGuion.desarrolloEvaluacion}
                  onChange={(e) => handleUpdateActiveGuion({ desarrolloEvaluacion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed text-xs">{activeGuion.desarrolloEvaluacion}</p>
              )}
            </div>
          </div>

          {/* CIERRE */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b border-slate-200">
            <div className="p-4 border-b md:border-b-0 md:border-r border-slate-200 bg-white">
              <div className="font-black text-blue-900 text-sm mb-1.5 uppercase flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                Cierre/ finalización
              </div>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activeGuion.cierreSituacion}
                  onChange={(e) => handleUpdateActiveGuion({ cierreSituacion: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-800 leading-relaxed whitespace-pre-line">{activeGuion.cierreSituacion}</p>
              )}
            </div>

            <div className="p-4 bg-slate-50/70">
              <div className="font-bold text-amber-800 text-xs mb-1.5 uppercase flex items-center justify-between">
                <span>Sumativa (% en cuadro de actividades / análisis)</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">Sumativa</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={activeGuion.cierreEvaluacion}
                  onChange={(e) => handleUpdateActiveGuion({ cierreEvaluacion: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-2 text-xs leading-relaxed"
                />
              ) : (
                <p className="text-slate-600 leading-relaxed text-xs">{activeGuion.cierreEvaluacion}</p>
              )}
            </div>
          </div>

          {/* ADAPTACIONES CURRICULARES */}
          <div className="grid grid-cols-1 md:grid-cols-6 bg-slate-100/70">
            <div className="p-3 font-bold text-slate-800 md:col-span-2 border-b md:border-b-0 md:border-r border-slate-200 flex items-center">
              Adaptaciones curriculares
            </div>
            <div className="p-3 md:col-span-4 text-xs text-slate-700 bg-white leading-relaxed">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.adaptacionesCurriculares}
                  onChange={(e) => handleUpdateActiveGuion({ adaptacionesCurriculares: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                />
              ) : (
                activeGuion.adaptacionesCurriculares
              )}
            </div>
          </div>
        </div>

        {/* ACTIVIDADES DE EVALUACIÓN TABLE */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs sm:text-sm font-black text-blue-900 uppercase tracking-wide">
              Actividades de Evaluación
            </h3>
            {isEditing && (
              <button
                type="button"
                onClick={handleAddEvalRow}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Actividad</span>
              </button>
            )}
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs sm:text-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                  <th className="p-2.5 w-12 text-center border-r border-slate-200">N°</th>
                  <th className="p-2.5 border-r border-slate-200">Actividad de evaluación</th>
                  <th className="p-2.5 w-36 text-center border-r border-slate-200">Ponderación</th>
                  <th className="p-2.5 w-44 text-center">Fecha de realización</th>
                  {isEditing && <th className="p-2.5 w-10 text-center"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activeGuion.actividadesEvaluacion?.map((act, aIdx) => (
                  <tr key={aIdx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-50/50">
                      {act.no || aIdx + 1}
                    </td>
                    <td className="p-2.5 border-r border-slate-200 text-slate-900 font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={act.actividad}
                          onChange={(e) => handleUpdateEvalRow(aIdx, 'actividad', e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        act.actividad
                      )}
                    </td>
                    <td className="p-2.5 text-center font-bold text-blue-800 border-r border-slate-200">
                      {isEditing ? (
                        <input
                          type="text"
                          value={act.ponderacion}
                          onChange={(e) => handleUpdateEvalRow(aIdx, 'ponderacion', e.target.value)}
                          className="w-full text-center bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold"
                        />
                      ) : (
                        act.ponderacion
                      )}
                    </td>
                    <td className="p-2.5 text-center text-slate-700 font-medium">
                      {isEditing ? (
                        <input
                          type="text"
                          value={act.fechaRealizacion}
                          onChange={(e) => handleUpdateEvalRow(aIdx, 'fechaRealizacion', e.target.value)}
                          className="w-full text-center bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                        />
                      ) : (
                        act.fechaRealizacion
                      )}
                    </td>
                    {isEditing && (
                      <td className="p-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveEvalRow(aIdx)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                          title="Eliminar fila"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER METADATA: TAREA, BIBLIOGRAFIA, RECURSOS, TICS */}
        <div className="border border-slate-300 rounded-xl overflow-hidden text-xs sm:text-sm">
          {/* TAREA */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2.5 font-bold text-slate-800 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-start">
              Tarea:
            </div>
            <div className="p-2.5 sm:col-span-5 text-slate-800 font-medium">
              {isEditing ? (
                <textarea
                  rows={2}
                  value={activeGuion.tarea}
                  onChange={(e) => handleUpdateActiveGuion({ tarea: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                />
              ) : (
                activeGuion.tarea || 'Ninguna asignada.'
              )}
            </div>
          </div>

          {/* BIBLIOGRAFIA */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2.5 font-bold text-slate-800 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-start">
              Bibliografía:
            </div>
            <div className="p-2.5 sm:col-span-5 text-slate-700 text-xs leading-relaxed">
              <span className="block text-[10px] text-slate-500 italic mb-1">
                En este apartado deberán colocar las referencias bibliográficas de los materiales utilizados para la clase, de ser posible haciendo uso de normas APA séptima edición.
              </span>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={activeGuion.bibliografia}
                  onChange={(e) => handleUpdateActiveGuion({ bibliografia: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                />
              ) : (
                <p className="whitespace-pre-line">{activeGuion.bibliografia}</p>
              )}
            </div>
          </div>

          {/* RECURSOS DE CLASE */}
          <div className="grid grid-cols-1 sm:grid-cols-6 border-b border-slate-200">
            <div className="p-2.5 font-bold text-slate-800 bg-slate-100 sm:col-span-1 border-r border-slate-200 flex items-start">
              Recursos de clase:
            </div>
            <div className="p-2.5 sm:col-span-5 text-slate-800 font-medium">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.recursosClase}
                  onChange={(e) => handleUpdateActiveGuion({ recursosClase: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs"
                />
              ) : (
                activeGuion.recursosClase
              )}
            </div>
          </div>

          {/* TICS */}
          <div className="grid grid-cols-1 sm:grid-cols-6 bg-blue-50/30">
            <div className="p-2.5 font-bold text-blue-900 bg-blue-100/60 sm:col-span-1 border-r border-slate-200 flex items-start">
              Tics:
            </div>
            <div className="p-2.5 sm:col-span-5 text-blue-900 font-bold">
              {isEditing ? (
                <input
                  type="text"
                  value={activeGuion.tics}
                  onChange={(e) => handleUpdateActiveGuion({ tics: e.target.value })}
                  className="w-full bg-white border border-slate-300 rounded p-1.5 text-xs font-semibold"
                />
              ) : (
                activeGuion.tics
              )}
            </div>
          </div>
        </div>

        {/* Footer info in view mode */}
        <div className="mt-4 text-center text-[10px] text-slate-400 font-medium print:hidden">
          Página {safeSessionIndex + 1} de {currentGuiones.length} · Guión Pedagógico Oficial Colegio Salesiano San José 2026
        </div>
      </div>
    </div>
  );
};
