import React, { useState, useRef } from 'react';
import {
  BookOpen,
  FileText,
  Download,
  Printer,
  Edit3,
  CheckCircle2,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  GraduationCap,
  Award,
  ChevronRight,
  School,
  FileSpreadsheet,
  Check,
  Copy,
  Info,
} from 'lucide-react';
import { ModuleDescriptor, InstitutionalHeader, DidacticPlan, DidacticEvaluationActivity } from '../types';
import {
  getDefaultDidacticPlan,
  getGranular6StagesPlan,
  getModuleStagesAccionCompleta,
  formatModuleDateRange,
  exportDidacticPlanToWord,
  ETAPAS_ACCION_COMPLETA,
} from '../utils/didacticPlanHelper';

interface PlanificacionDidacticaViewProps {
  currentGrade: '10' | '11' | '12';
  headerData: InstitutionalHeader;
  modules: ModuleDescriptor[];
  onSelectGrade: (grade: '10' | '11' | '12') => void;
  onUpdateModulePlan?: (moduleCode: string, updatedPlan: DidacticPlan) => void;
  onGoToGuion?: (moduleCode: string) => void;
}

export const PlanificacionDidacticaView: React.FC<PlanificacionDidacticaViewProps> = ({
  currentGrade,
  headerData,
  modules,
  onSelectGrade,
  onUpdateModulePlan,
  onGoToGuion,
}) => {
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>(
    modules[0]?.codigo || ''
  );
  const [viewMode, setViewMode] = useState<'document' | 'all-modules'>('document');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeCoverTab, setActiveCoverTab] = useState<'matrix' | 'cover' | 'separator'>('matrix');
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [showStagesGuide, setShowStagesGuide] = useState(false);
  const [internalWeightPreset, setInternalWeightPreset] = useState<'standard' | 'execution_heavy'>('standard');

  const printContainerRef = useRef<HTMLDivElement>(null);

  // Current active module
  const currentModule =
    modules.find((m) => m.codigo === selectedModuleCode) || modules[0] || ({} as ModuleDescriptor);

  // Dynamic 6 stages adapted specifically for currentModule
  const currentModuleStages = getModuleStagesAccionCompleta(currentModule, internalWeightPreset);

  const fase1Stages = currentModuleStages.filter((s) => s.faseId === 'FASE_I');
  const fase2Stages = currentModuleStages.filter((s) => s.faseId === 'FASE_II');
  const fase3Stages = currentModuleStages.filter((s) => s.faseId === 'FASE_III');

  const fase1Hours = fase1Stages.reduce((sum, s) => sum + s.horasEstimadas, 0);
  const fase2Hours = fase2Stages.reduce((sum, s) => sum + s.horasEstimadas, 0);
  const fase3Hours = fase3Stages.reduce((sum, s) => sum + s.horasEstimadas, 0);

  const fase1TimePct = fase1Stages.reduce((sum, s) => sum + s.tiempoPorcentajeNum, 0);
  const fase2TimePct = fase2Stages.reduce((sum, s) => sum + s.tiempoPorcentajeNum, 0);
  const fase3TimePct = fase3Stages.reduce((sum, s) => sum + s.tiempoPorcentajeNum, 0);

  const currentPlan = getDefaultDidacticPlan(currentModule, headerData.anoLectivo);
  const dateRange = formatModuleDateRange(currentModule, headerData.anoLectivo);

  // Editable state buffer
  const [editablePlan, setEditablePlan] = useState<DidacticPlan>({ ...currentPlan });

  // Update buffer when module changes
  React.useEffect(() => {
    if (currentModule && currentModule.codigo) {
      setEditablePlan({ ...getDefaultDidacticPlan(currentModule, headerData.anoLectivo) });
    }
  }, [selectedModuleCode, currentModule, headerData.anoLectivo]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = (mod: ModuleDescriptor) => {
    exportDidacticPlanToWord(headerData, mod);
  };

  const handleExportAllWord = () => {
    modules.forEach((mod, idx) => {
      setTimeout(() => {
        exportDidacticPlanToWord(headerData, mod);
      }, idx * 400);
    });
  };

  const handleSaveEdit = () => {
    if (onUpdateModulePlan && currentModule.codigo) {
      onUpdateModulePlan(currentModule.codigo, editablePlan);
    }
    setIsEditing(false);
  };

  // Load 6 Granular Stages preset with module-specific hours and dual percentages
  const handleLoadGranular6Stages = () => {
    const granularActs = getGranular6StagesPlan(currentModule, headerData.anoLectivo, internalWeightPreset);
    setEditablePlan({
      ...editablePlan,
      actividades: granularActs,
    });
  };

  // Load Standard 3-Phase preset
  const handleLoadStandard3Phases = () => {
    const standardPlan = getDefaultDidacticPlan({ ...currentModule, planDidactico: undefined }, headerData.anoLectivo);
    setEditablePlan({
      ...editablePlan,
      actividades: standardPlan.actividades,
    });
  };

  const handleCopyText = () => {
    const text = `
COLEGIO SALESIANO SAN JOSÉ
PLANIFICACIÓN DIDÁCTICA - ${headerData.gradoSeccion} - AÑO ${headerData.anoLectivo}

MÓDULO: ${currentModule.codigo} - ${currentModule.nombre}
DOCENTE: ${headerData.docente}
DURACIÓN: ${currentModule.duracionHoras} HORAS (${currentModule.semanas} SEMANAS)
FECHAS DE EJECUCIÓN: ${dateRange}

COMPETENCIAS DE LA UNIDAD:
${editablePlan.competenciasUnidad || currentModule.competenciaGeneral}

CONTENIDOS CONCEPTUALES (Saber Conocer):
${editablePlan.conceptuales.map((c) => `- ${c}`).join('\n')}

CONTENIDOS PROCEDIMENTALES (Saber Hacer):
${editablePlan.procedimentales.map((p) => `- ${p}`).join('\n')}

CONTENIDOS ACTITUDINALES (Saber Ser):
${editablePlan.actitudinales.map((a) => `- ${a}`).join('\n')}

ACTIVIDADES DE EVALUACIÓN (POR ETAPAS Y FASES):
${editablePlan.actividades
  .map(
    (a) =>
      `${a.no}. ${a.etapa ? `[${a.etapa}] ` : ''}${a.actividad} [${a.ponderacion}] - Evidencia: ${a.evidencia || 'N/A'} - Fecha: ${a.fecha || dateRange}`
  )
  .join('\n')}

RECURSOS: ${editablePlan.recursos}
TIC: ${editablePlan.tic}

BIBLIOGRAFÍA:
${editablePlan.bibliografia.join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleAddActivity = () => {
    const nextNo = editablePlan.actividades.length + 1;
    setEditablePlan({
      ...editablePlan,
      actividades: [
        ...editablePlan.actividades,
        {
          no: nextNo,
          etapa: 'Etapa 4: Ejecutar',
          fase: 'Fase II: Ejecución y Producción Técnica',
          actividad: 'Desarrollo práctico y producción de la pieza gráfica...',
          evidencia: 'Artes finales y bocetería digital.',
          ponderacion: 'FEP (25%)',
          fecha: dateRange,
        },
      ],
    });
  };

  const handleRemoveActivity = (index: number) => {
    const updated = editablePlan.actividades.filter((_, idx) => idx !== index);
    // Renumber
    const renumbered = updated.map((act, i) => ({ ...act, no: i + 1 }));
    setEditablePlan({
      ...editablePlan,
      actividades: renumbered,
    });
  };

  return (
    <div className="space-y-6 pb-20 print:p-0 print:space-y-0">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-md">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Planificación Didáctica Oficial
                </h1>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                  CSSJ / MINED
                </span>
                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  {currentGrade === '10' ? '1° Año' : currentGrade === '11' ? '2° Año' : '3° Año'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Estructura de planificación por competencias orientada a la acción con saberes
                conceptuales, procedimentales, actitudinales, <strong>actividades de evaluación desglosadas por las 6 etapas de la acción completa</strong> y fechas
                sincronizadas con la Jornalización Anual.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStagesGuide(!showStagesGuide)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>{showStagesGuide ? 'Ocultar Guía de Etapas' : 'Guía de Etapas y Fases'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer ${
                isEditing
                  ? 'bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Guardar Cambios' : 'Editar Plan'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copiar texto estructurado"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Texto</span>
                </>
              )}
            </button>

            {onGoToGuion && (
              <button
                type="button"
                onClick={() => onGoToGuion(currentModule.codigo)}
                className="px-3.5 py-2 rounded-xl text-xs font-black bg-indigo-700 hover:bg-indigo-800 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                title="Abrir el subcronograma y formato oficial de Guión de Clases para este módulo"
              >
                <FileText className="w-3.5 h-3.5 text-sky-300" />
                <span>Guión de Clases 2026</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleExportWord(currentModule)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar en Word (.doc)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        </div>

        {/* PEDAGOGICAL STAGES ACCORDION / GUIDE */}
        {showStagesGuide && (
          <div className="mt-5 p-5 bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-50 border border-indigo-200 rounded-2xl shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">
                    Metodología por Proyectos · Las 6 Etapas de la Acción Completa y Fases de Evaluación (MINED/CSSJ)
                  </h3>
                  <p className="text-[11px] font-semibold text-indigo-700 mt-0.5">
                    Módulo Activo: <span className="font-bold">[{currentModule.codigo}] {currentModule.nombre}</span> · <span className="font-black text-slate-800">{currentModule.duracionHoras} Horas</span> ({currentModule.semanas} Semanas)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Weight Preset Toggle */}
                <div className="flex items-center bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs text-[11px]">
                  <button
                    type="button"
                    onClick={() => setInternalWeightPreset('standard')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      internalWeightPreset === 'standard'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ponderación interna estándar: Fase I (40%/60%), Fase II (30%/70%), Fase III (40%/60%)"
                  >
                    Ponderación Estándar
                  </button>
                  <button
                    type="button"
                    onClick={() => setInternalWeightPreset('execution_heavy')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      internalWeightPreset === 'execution_heavy'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Ponderación interna alta ejecución: Fase I (35%/65%), Fase II (30%/70%), Fase III (35%/65%)"
                  >
                    Alta Ejecución (35%/65%)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLoadGranular6Stages}
                  className="px-3 py-1.5 rounded-lg text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Cargar las 6 etapas contextualizadas con horas y ponderaciones a la tabla de actividades"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Aplicar 6 Etapas a Plan</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed mb-4 bg-white/80 p-3 rounded-xl border border-indigo-100">
              <p>
                En el modelo curricular por competencias del MINED, cada proyecto articula <strong>dos dimensiones complementarias</strong> que se adaptan automáticamente a las <strong>{currentModule.duracionHoras} Horas</strong> de este módulo:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"></span>
                  <div>
                    <strong className="text-slate-800">1. Distribución de Tiempo Lectivo (100% Horas):</strong> Repartidas en las 6 etapas según su exigencia operativa (Informarse 10%, Planificar 10%, Decidir 10%, Ejecutar 40%, Controlar 15%, Valorar 15%).
                  </div>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0"></span>
                  <div>
                    <strong className="text-slate-800">2. Ponderación Evaluativa Oficial (100% de la Nota):</strong> Cada Fase representa el 100% de su propio bloque evaluativo (FPP 25%, FEP 50%, FVP 25%) y sus etapas internas se reparten dicho porcentaje proporcionalmente.
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
              {/* Fase 1 */}
              <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-blue-100">
                    <div>
                      <span className="font-black text-blue-900 text-sm">FASE I: FPP (25%)</span>
                      <div className="text-[10px] text-blue-700 font-semibold">Diagnóstico e Investigación</div>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded block">
                        {fase1TimePct}% Tiempo ({fase1Hours}h)
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">100% de Fase I</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fase1Stages.map((st) => (
                      <div key={st.id} className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/80">
                        <div className="font-bold text-blue-950 flex items-center justify-between gap-1 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                              {st.id}
                            </span>
                            {st.nombreCorto}
                          </span>
                          <span className="text-[10px] font-extrabold text-blue-700 bg-white px-1.5 py-0.5 rounded border border-blue-200">
                            {st.tiempo} ({st.horasEstimadas}h)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded mb-1.5">
                          <span>Pond. Interna: {st.ponderacionInternaFaseTexto}</span>
                          <span className="text-indigo-900 font-black">→ {st.ponderacionGlobalModuloTexto}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{st.descripcion}</p>
                        <div className="mt-1.5 pt-1 border-t border-blue-100 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Evidencia:</span> {st.evidenciasSugeridas}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-blue-100 flex items-center justify-between text-[10px] text-blue-800 font-bold">
                  <span>Suma Interna Fase I: 100%</span>
                  <span>Suma Nota Global: 25% FPP</span>
                </div>
              </div>

              {/* Fase 2 */}
              <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-100">
                    <div>
                      <span className="font-black text-emerald-900 text-sm">FASE II: FEP (50%)</span>
                      <div className="text-[10px] text-emerald-700 font-semibold">Ejecución y Producción Técnica</div>
                    </div>
                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded block">
                        {fase2TimePct}% Tiempo ({fase2Hours}h)
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">100% de Fase II</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fase2Stages.map((st) => (
                      <div key={st.id} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80">
                        <div className="font-bold text-emerald-950 flex items-center justify-between gap-1 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                              {st.id}
                            </span>
                            {st.nombreCorto}
                          </span>
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                            {st.tiempo} ({st.horasEstimadas}h)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded mb-1.5">
                          <span>Pond. Interna: {st.ponderacionInternaFaseTexto}</span>
                          <span className="text-emerald-950 font-black">→ {st.ponderacionGlobalModuloTexto}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{st.descripcion}</p>
                        <div className="mt-1.5 pt-1 border-t border-emerald-100 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Evidencia:</span> {st.evidenciasSugeridas}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-emerald-100 flex items-center justify-between text-[10px] text-emerald-800 font-bold">
                  <span>Suma Interna Fase II: 100%</span>
                  <span>Suma Nota Global: 50% FEP</span>
                </div>
              </div>

              {/* Fase 3 */}
              <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-100">
                    <div>
                      <span className="font-black text-amber-900 text-sm">FASE III: FVP (25%)</span>
                      <div className="text-[10px] text-amber-700 font-semibold">Control de Calidad y Cierre</div>
                    </div>
                    <div className="text-right">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded block">
                        {fase3TimePct}% Tiempo ({fase3Hours}h)
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold">100% de Fase III</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {fase3Stages.map((st) => (
                      <div key={st.id} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100/80">
                        <div className="font-bold text-amber-950 flex items-center justify-between gap-1 mb-1">
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                              {st.id}
                            </span>
                            {st.nombreCorto}
                          </span>
                          <span className="text-[10px] font-extrabold text-amber-700 bg-white px-1.5 py-0.5 rounded border border-amber-200">
                            {st.tiempo} ({st.horasEstimadas}h)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded mb-1.5">
                          <span>Pond. Interna: {st.ponderacionInternaFaseTexto}</span>
                          <span className="text-amber-950 font-black">→ {st.ponderacionGlobalModuloTexto}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-snug">{st.descripcion}</p>
                        <div className="mt-1.5 pt-1 border-t border-amber-100 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Evidencia:</span> {st.evidenciasSugeridas}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-100 flex items-center justify-between text-[10px] text-amber-800 font-bold">
                  <span>Suma Interna Fase III: 100%</span>
                  <span>Suma Nota Global: 25% FVP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grade Tabs & View Mode Selector */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Nivel:
            </span>
            {(['10', '11', '12'] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  onSelectGrade(g);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentGrade === g
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {g === '10' ? '1° Año Técnico' : g === '11' ? '2° Año Técnico' : '3° Año Técnico'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveCoverTab('matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCoverTab === 'matrix'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Matriz de Planificación
            </button>
            <button
              type="button"
              onClick={() => setActiveCoverTab('cover')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCoverTab === 'cover'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portada Oficial
            </button>
            <button
              type="button"
              onClick={() => setActiveCoverTab('separator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeCoverTab === 'separator'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Separador de Módulo
            </button>
          </div>
        </div>

        {/* Modules Carousel / Badges Selector */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Seleccionar Módulo ({modules.length} módulos disponibles):</span>
            <button
              type="button"
              onClick={handleExportAllWord}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Descargar Todos los Módulos (.doc)
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {modules.map((m) => {
              const isSelected = m.codigo === currentModule.codigo;
              return (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() => setSelectedModuleCode(m.codigo)}
                  className={`px-3 py-2 rounded-xl text-left border shrink-0 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-blue-700'
                      }`}
                    >
                      {m.codigo}
                    </span>
                    <span className="text-[11px] font-bold truncate max-w-[170px]">{m.nombre}</span>
                  </div>
                  <div
                    className={`text-[10px] mt-1 flex items-center justify-between gap-2 ${
                      isSelected ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    <span>{m.duracionHoras}h</span>
                    <span>
                      {m.diaInicio} {m.mesInicio?.slice(0, 3)} - {m.diaFin} {m.mesFin?.slice(0, 3)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* DOCUMENT PREVIEW CONTAINER */}
      <div
        ref={printContainerRef}
        className="bg-white rounded-2xl border border-slate-300 shadow-lg p-6 md:p-10 max-w-5xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0"
      >
        {/* TAB 1: COVER PAGE (PORTADA OFICIAL) */}
        {activeCoverTab === 'cover' && (
          <div className="min-h-[700px] border border-slate-300 rounded-xl p-12 flex flex-col justify-between items-center text-center bg-gradient-to-b from-white to-slate-50/50 shadow-inner relative overflow-hidden">
            {/* Header logos bar */}
            <div className="w-full flex items-center justify-between pb-8 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-xl font-bold shadow-md">
                  DB
                </div>
                <div className="text-left">
                  <div className="text-xs font-extrabold text-slate-900 tracking-wider">SALESIANOS</div>
                  <div className="text-[10px] text-slate-500 font-semibold">DON BOSCO</div>
                </div>
              </div>

              <div className="text-center font-serif">
                <h2 className="text-2xl font-black text-slate-900 tracking-wide">
                  {headerData.institucion}
                </h2>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                  EDUCAMOS EVANGELIZANDO Y EVANGELIZAMOS DUCANDO
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-xs font-extrabold text-blue-900">AD ASTRA</div>
                  <div className="text-[10px] text-slate-500 font-semibold">SAN JOSÉ</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold text-xs shadow-md border-2 border-amber-400">
                  CSSJ
                </div>
              </div>
            </div>

            {/* Central Title */}
            <div className="my-16 space-y-6">
              <span className="inline-block px-4 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-extrabold uppercase tracking-widest border border-blue-200">
                Documento Curricular Oficial
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-blue-950 font-serif tracking-tight leading-tight">
                Planificación Didáctica
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-amber-500 mx-auto rounded-full"></div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                {headerData.gradoSeccion}
              </h3>
              <p className="text-sm font-semibold text-slate-500 max-w-md mx-auto">
                Bachillerato Técnico Vocacional en Diseño Gráfico bajo el enfoque de formación por
                competencias orientada a la acción.
              </p>
            </div>

            {/* Footer Institutional & Docente */}
            <div className="w-full pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-700">
              <div className="text-left">
                <span className="text-slate-400 uppercase text-[10px] block">Docente Responsable:</span>
                <span className="text-slate-900 text-sm font-black">{headerData.docente}</span>
              </div>
              <div className="text-center">
                <span className="text-slate-400 uppercase text-[10px] block">Especialidad Técnica:</span>
                <span className="text-blue-800 text-xs font-bold">Diseño Gráfico Vocacional</span>
              </div>
              <div className="px-4 py-1.5 rounded-lg bg-blue-900 text-white font-mono font-bold text-xs tracking-wider">
                CSSJ – {headerData.anoLectivo}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SEPARATOR PAGE (SEPARADOR DE MÓDULO) */}
        {activeCoverTab === 'separator' && (
          <div className="min-h-[700px] border border-slate-300 rounded-xl p-12 flex flex-col justify-between items-center text-center bg-gradient-to-b from-white to-blue-50/30 shadow-inner relative overflow-hidden">
            {/* Header */}
            <div className="w-full flex items-center justify-between pb-8 border-b border-slate-200">
              <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-xl font-bold">
                DB
              </div>
              <h2 className="text-2xl font-black text-slate-900 font-serif tracking-wide">
                {headerData.institucion}
              </h2>
              <div className="w-12 h-12 rounded-xl bg-blue-800 text-white flex items-center justify-center font-bold text-xs border-2 border-amber-400">
                CSSJ
              </div>
            </div>

            {/* Module Separator Title */}
            <div className="my-16 space-y-5 max-w-2xl">
              <div className="inline-block px-3 py-1 rounded-lg bg-blue-600 text-white font-mono text-sm font-black tracking-wider shadow-xs">
                MÓDULO: {currentModule.codigo}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-blue-950 font-serif leading-snug">
                {currentModule.nombre}
              </h1>
              <div className="flex items-center justify-center gap-4 text-xs font-bold text-slate-600 pt-2">
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  {currentModule.duracionHoras} Horas ({currentModule.semanas} Semanas)
                </span>
                <span className="flex items-center gap-1 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {dateRange}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="w-full pt-8 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="text-left">
                <span className="text-slate-400 uppercase text-[10px] block">Docente:</span>
                <span className="text-slate-900 text-sm font-black">{headerData.docente}</span>
              </div>
              <div className="px-4 py-1.5 rounded-lg bg-blue-900 text-white font-mono font-bold text-xs tracking-wider">
                CSSJ – {headerData.anoLectivo}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATRIZ DE PLANIFICACIÓN DIDÁCTICA (Fiel al formato oficial) */}
        {activeCoverTab === 'matrix' && (
          <div className="space-y-4">
            {/* Top Table Brand */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-serif text-sm font-bold">
                  DB
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-serif font-black text-slate-900 tracking-tight">
                    {headerData.institucion}
                  </h2>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase">
                    Planificación Didáctica por Competencias
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono font-bold">
                  CSSJ – {headerData.anoLectivo}
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-800 text-white flex items-center justify-center font-bold text-[11px] border border-amber-400">
                  CSSJ
                </div>
              </div>
            </div>

            {/* TABLE: DATOS GENERALES */}
            <div className="border border-slate-400 rounded-lg overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-400 py-1 px-3 text-center text-xs font-black uppercase text-slate-800 tracking-wider">
                DATOS GENERALES
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-400 border-b border-slate-400">
                <div className="p-2.5 space-y-1">
                  <span className="font-bold text-slate-900 block">Nombre del Centro Educativo:</span>
                  <span className="text-slate-700">{headerData.institucion}</span>
                </div>
                <div className="p-2.5 space-y-1">
                  <span className="font-bold text-slate-900 block">Competencias de la Asignatura:</span>
                  <span className="text-slate-700">
                    Desarrollo Técnico, Humano, Emprendedor y Académico Aplicado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-400 border-b border-slate-400 bg-slate-50/50">
                <div className="p-2.5">
                  <span className="font-bold text-slate-900 block">Docente:</span>
                  <span className="text-slate-800 font-semibold">{headerData.docente}</span>
                </div>
                <div className="p-2.5">
                  <span className="font-bold text-slate-900 block">Módulo:</span>
                  <span className="text-blue-800 font-bold font-mono">{currentModule.codigo}</span>
                </div>
                <div className="p-2.5">
                  <span className="font-bold text-slate-900 block">Grado:</span>
                  <span className="text-slate-800 font-semibold">{headerData.gradoSeccion}</span>
                </div>
                <div className="p-2.5">
                  <span className="font-bold text-slate-900 block">Tiempo / Trimestre:</span>
                  <span className="text-slate-800 font-semibold">
                    {currentModule.duracionHoras} hrs ({currentModule.semanas} sem)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 text-xs divide-y md:divide-y-0 md:divide-x divide-slate-400 border-b border-slate-400">
                <div className="p-2.5">
                  <span className="font-bold text-slate-900 block">Número y nombre de la Unidad:</span>
                  <span className="text-slate-800 font-medium">
                    {currentModule.codigo} {currentModule.nombre}
                  </span>
                </div>
                <div className="p-2.5 bg-emerald-50/40">
                  <span className="font-bold text-emerald-950 block">Fechas de Ejecución (Jornalización):</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="text-emerald-900 font-mono font-bold text-xs">{dateRange}</span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 text-xs bg-slate-50/30">
                <span className="font-bold text-slate-900 block mb-1">Competencias de la unidad:</span>
                {isEditing ? (
                  <textarea
                    value={editablePlan.competenciasUnidad || ''}
                    onChange={(e) =>
                      setEditablePlan({ ...editablePlan, competenciasUnidad: e.target.value })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    rows={2}
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed">
                    {editablePlan.competenciasUnidad ||
                      currentModule.competenciaGeneral ||
                      'Consolidar los conocimientos del proceso de aprendizaje con enfoque por competencias orientada a la acción y la identificación con el área de especialidad.'}
                  </p>
                )}
              </div>
            </div>

            {/* TABLE: SABERES (CONCEPTUALES, PROCEDIMENTALES, ACTITUDINALES) */}
            <div className="border border-slate-400 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-400">
                {/* Saber Conocer */}
                <div className="flex flex-col">
                  <div className="bg-emerald-100/80 border-b border-slate-400 p-2 text-center">
                    <div className="text-xs font-black text-emerald-950 uppercase">
                      CONTENIDOS CONCEPTUALES
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">(Saber Conocer)</div>
                  </div>
                  <div className="p-3 text-xs flex-1 bg-white space-y-2">
                    {isEditing ? (
                      <textarea
                        value={editablePlan.conceptuales.join('\n')}
                        onChange={(e) =>
                          setEditablePlan({
                            ...editablePlan,
                            conceptuales: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        rows={6}
                        placeholder="Un contenido conceptual por línea..."
                      />
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                        {editablePlan.conceptuales.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Saber Hacer */}
                <div className="flex flex-col">
                  <div className="bg-emerald-100/80 border-b border-slate-400 p-2 text-center">
                    <div className="text-xs font-black text-emerald-950 uppercase">
                      CONTENIDOS PROCEDIMENTALES
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">(Saber Hacer)</div>
                  </div>
                  <div className="p-3 text-xs flex-1 bg-white space-y-2">
                    {isEditing ? (
                      <textarea
                        value={editablePlan.procedimentales.join('\n')}
                        onChange={(e) =>
                          setEditablePlan({
                            ...editablePlan,
                            procedimentales: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        rows={6}
                        placeholder="Un contenido procedimental por línea..."
                      />
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                        {editablePlan.procedimentales.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {/* Saber Ser */}
                <div className="flex flex-col">
                  <div className="bg-emerald-100/80 border-b border-slate-400 p-2 text-center">
                    <div className="text-xs font-black text-emerald-950 uppercase">
                      CONTENIDOS ACTITUDINALES
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">(Saber Ser)</div>
                  </div>
                  <div className="p-3 text-xs flex-1 bg-white space-y-2">
                    {isEditing ? (
                      <textarea
                        value={editablePlan.actitudinales.join('\n')}
                        onChange={(e) =>
                          setEditablePlan({
                            ...editablePlan,
                            actitudinales: e.target.value.split('\n').filter(Boolean),
                          })
                        }
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                        rows={6}
                        placeholder="Un contenido actitudinal por línea..."
                      />
                    ) : (
                      <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                        {editablePlan.actitudinales.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* TABLE: METODOLOGÍA E INDICADORES DE LOGRO */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400">
                <div className="p-3 space-y-1.5 bg-slate-50/40">
                  <span className="font-black text-slate-900 block uppercase tracking-wider text-[11px]">
                    Metodología:
                  </span>
                  {isEditing ? (
                    <textarea
                      value={editablePlan.metodologia || ''}
                      onChange={(e) =>
                        setEditablePlan({ ...editablePlan, metodologia: e.target.value })
                      }
                      className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed">
                      {editablePlan.metodologia ||
                        'El facilitador debe orientar al grupo de estudiantes durante todas las etapas del módulo, para lograr el desarrollo de las competencias, mediante un proyecto para superar: de acuerdo a la especialidad de Diseño Gráfico, siguiendo las seis etapas de la acción completa.'}
                    </p>
                  )}
                </div>

                <div className="p-3 space-y-1.5 bg-slate-50/40">
                  <span className="font-black text-slate-900 block uppercase tracking-wider text-[11px]">
                    Indicadores de logro:
                  </span>
                  {isEditing ? (
                    <textarea
                      value={editablePlan.indicadoresTexto || ''}
                      onChange={(e) =>
                        setEditablePlan({ ...editablePlan, indicadoresTexto: e.target.value })
                      }
                      className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      rows={4}
                    />
                  ) : (
                    <div className="text-slate-700 leading-relaxed">
                      <p className="font-semibold text-blue-900">
                        • {currentModule.totalIndicadores} Indicadores descritos en el PLAN DE ESTUDIO DEL
                        BACHILLERATO TÉCNICO VOCACIONAL EN DISEÑO GRÁFICO Edición: 2015
                      </p>
                      <div className="mt-2 text-[11px] text-slate-500 grid grid-cols-2 gap-1 bg-white p-2 rounded border border-slate-200">
                        <span>Desarrollo Técnico: <strong>{currentModule.desarrolloTecnico}</strong></span>
                        <span>Humano-Social: <strong>{currentModule.desarrolloHumanoSocial}</strong></span>
                        <span>Emprendedor: <strong>{currentModule.desarrolloEmprendedor}</strong></span>
                        <span>Académico Aplicado: <strong>{currentModule.desarrolloAcademicoAplicado}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* TABLE: ACTIVIDADES DE EVALUACIÓN CON ETAPAS DE ACCIÓN COMPLETA */}
            <div className="border border-slate-400 rounded-lg overflow-hidden">
              <div className="bg-slate-100 border-b border-slate-400 py-2 px-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    ACTIVIDADES DE EVALUACIÓN (6 ETAPAS DE LA ACCIÓN COMPLETA Y FASES)
                  </span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                    {editablePlan.actividades.length} Actividades
                  </span>
                </div>

                {/* Quick Preset Buttons in Edit Mode */}
                {isEditing && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleLoadGranular6Stages}
                      className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold transition-all cursor-pointer"
                      title="Cargar desglose completo de 6 etapas de la acción completa"
                    >
                      Cargar 6 Etapas Individuales
                    </button>
                    <button
                      type="button"
                      onClick={handleLoadStandard3Phases}
                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold transition-all cursor-pointer"
                      title="Cargar formato estándar de 3 fases"
                    >
                      Cargar 3 Fases (FPP/FEP/FVP)
                    </button>
                    <button
                      type="button"
                      onClick={handleAddActivity}
                      className="px-2.5 py-1 rounded bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Nueva Actividad</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-200/80 border-b border-slate-400 font-bold text-slate-800">
                      <th className="p-2 border-r border-slate-400 text-center w-12">NO.</th>
                      <th className="p-2 border-r border-slate-400">
                        ACTIVIDADES DE EVALUACIÓN Y EVIDENCIAS
                      </th>
                      <th className="p-2 border-r border-slate-400 text-center w-36">PONDERACIÓN</th>
                      <th className="p-2 text-center w-48">FECHA DE REALIZACIÓN</th>
                      {isEditing && <th className="p-2 text-center w-12">ACCIÓN</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-400">
                    {editablePlan.actividades.map((act, index) => {
                      const isFPP =
                        act.ponderacion?.includes('FPP') ||
                        act.etapa?.includes('Informar') ||
                        act.etapa?.includes('Planificar');
                      const isFEP =
                        act.ponderacion?.includes('FEP') ||
                        act.etapa?.includes('Decidir') ||
                        act.etapa?.includes('Ejecutar');
                      const isFVP =
                        act.ponderacion?.includes('FVP') ||
                        act.etapa?.includes('Controlar') ||
                        act.etapa?.includes('Valorar');

                      const badgeColor = isFPP
                        ? 'bg-blue-100 text-blue-800 border-blue-200'
                        : isFEP
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-200';

                      return (
                        <tr key={index} className="hover:bg-slate-50/50">
                          <td className="p-2.5 border-r border-slate-400 text-center font-bold text-slate-800 align-top">
                            {act.no}
                          </td>
                          <td className="p-2.5 border-r border-slate-400 text-slate-700 space-y-1.5">
                            {isEditing ? (
                              <div className="space-y-2">
                                {/* Stage Selector */}
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                                    Etapa / Fase:
                                  </label>
                                  <select
                                    value={act.etapa || ''}
                                    onChange={(e) => {
                                      const newActs = [...editablePlan.actividades];
                                      const selectedStage = e.target.value;
                                      newActs[index].etapa = selectedStage;
                                      // Auto-suggest ponderation, time & evidence if blank from dynamic currentModuleStages
                                      const found = currentModuleStages.find(
                                        (s) => s.etapa === selectedStage || selectedStage.startsWith(s.etapa)
                                      );
                                      if (found) {
                                        newActs[index].fase = found.faseNombre;
                                        newActs[index].ponderacion = found.ponderacionSugerida;
                                        newActs[index].tiempo = `${found.tiempo} (${found.horasEstimadas}h)`;
                                        if (!newActs[index].evidencia) {
                                          newActs[index].evidencia = found.evidenciasSugeridas;
                                        }
                                      } else if (selectedStage.includes('Etapas 1 y 2')) {
                                        newActs[index].fase = 'Fase I: Formativa Procesual (FPP)';
                                        newActs[index].ponderacion = 'FPP (25%)';
                                        newActs[index].tiempo = `${fase1TimePct}% tiempo (${fase1Hours}h)`;
                                      } else if (selectedStage.includes('Etapas 3 y 4')) {
                                        newActs[index].fase = 'Fase II: Formativa de Ejecución de Proyecto (FEP)';
                                        newActs[index].ponderacion = 'FEP (50%)';
                                        newActs[index].tiempo = `${fase2TimePct}% tiempo (${fase2Hours}h)`;
                                      } else if (selectedStage.includes('Etapas 5 y 6')) {
                                        newActs[index].fase = 'Fase III: Formativa de Valoración y Control (FVP)';
                                        newActs[index].ponderacion = 'FVP (25%)';
                                        newActs[index].tiempo = `${fase3TimePct}% tiempo (${fase3Hours}h)`;
                                      }
                                      setEditablePlan({ ...editablePlan, actividades: newActs });
                                    }}
                                    className="text-xs p-1 border border-slate-300 rounded bg-white font-medium text-slate-800 focus:ring-1 focus:ring-blue-500"
                                  >
                                    <option value="">-- Seleccionar Etapa / Fase Específica --</option>
                                    {currentModuleStages.map((st) => (
                                      <option key={st.id} value={`${st.etapa} (${st.tiempo} · ${st.horasEstimadas}h | ${st.ponderacionInternaFaseTexto})`}>
                                        {st.nombreCorto} ({st.tiempo} · {st.horasEstimadas}h) - {st.ponderacionInternaFaseTexto} → {st.ponderacionGlobalModuloTexto}
                                      </option>
                                    ))}
                                    <option disabled>──────────────</option>
                                    <option value={`Etapas 1 y 2: Informarse y Planificar (${fase1TimePct}% tiempo · ${fase1Hours}h) [FPP 25%]`}>
                                      Fase I Agrupada: Etapas 1 y 2 ({fase1TimePct}% tiempo · {fase1Hours}h) [FPP 25%]
                                    </option>
                                    <option value={`Etapas 3 y 4: Decidir y Ejecutar (${fase2TimePct}% tiempo · ${fase2Hours}h) [FEP 50%]`}>
                                      Fase II Agrupada: Etapas 3 y 4 ({fase2TimePct}% tiempo · ${fase2Hours}h) [FEP 50%]
                                    </option>
                                    <option value={`Etapas 5 y 6: Controlar y Valorar (${fase3TimePct}% tiempo · ${fase3Hours}h) [FVP 25%]`}>
                                      Fase III Agrupada: Etapas 5 y 6 ({fase3TimePct}% tiempo · ${fase3Hours}h) [FVP 25%]
                                    </option>
                                  </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                      % Tiempo de la Etapa:
                                    </label>
                                    <input
                                      type="text"
                                      value={act.tiempo || ''}
                                      onChange={(e) => {
                                        const newActs = [...editablePlan.actividades];
                                        newActs[index].tiempo = e.target.value;
                                        setEditablePlan({ ...editablePlan, actividades: newActs });
                                      }}
                                      className="w-full text-xs p-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 font-mono"
                                      placeholder="Ej: 10% tiempo"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                      Fase Evaluativa:
                                    </label>
                                    <input
                                      type="text"
                                      value={act.fase || ''}
                                      onChange={(e) => {
                                        const newActs = [...editablePlan.actividades];
                                        newActs[index].fase = e.target.value;
                                        setEditablePlan({ ...editablePlan, actividades: newActs });
                                      }}
                                      className="w-full text-xs p-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 text-[11px]"
                                      placeholder="Ej: Fase I: FPP (25%)"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                    Descripción de la Actividad:
                                  </label>
                                  <textarea
                                    value={act.actividad}
                                    onChange={(e) => {
                                      const newActs = [...editablePlan.actividades];
                                      newActs[index].actividad = e.target.value;
                                      setEditablePlan({ ...editablePlan, actividades: newActs });
                                    }}
                                    className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                    rows={2}
                                    placeholder="Describe la actividad de aprendizaje y evaluación..."
                                  />
                                </div>

                                <div>
                                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                                    Evidencia esperada / Producto entregable:
                                  </label>
                                  <input
                                    type="text"
                                    value={act.evidencia || ''}
                                    onChange={(e) => {
                                      const newActs = [...editablePlan.actividades];
                                      newActs[index].evidencia = e.target.value;
                                      setEditablePlan({ ...editablePlan, actividades: newActs });
                                    }}
                                    className="w-full text-xs p-1 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                    placeholder="Ej: Briefing, lámina de bocetos, arte final en Illustrator, rúbrica..."
                                  />
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                  {act.etapa && (
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold border ${badgeColor}`}
                                    >
                                      {act.etapa}
                                    </span>
                                  )}
                                  {act.tiempo && (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 font-mono">
                                      ⏱️ {act.tiempo}
                                    </span>
                                  )}
                                </div>
                                <p className="leading-snug text-slate-800">{act.actividad}</p>
                                {act.evidencia && (
                                  <div className="mt-1.5 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200">
                                    <strong className="text-slate-700">Evidencia esperada:</strong>{' '}
                                    {act.evidencia}
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td className="p-2.5 border-r border-slate-400 text-center font-bold text-blue-900 bg-slate-50/30 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={act.ponderacion}
                                onChange={(e) => {
                                  const newActs = [...editablePlan.actividades];
                                  newActs[index].ponderacion = e.target.value;
                                  setEditablePlan({ ...editablePlan, actividades: newActs });
                                }}
                                className="w-full text-xs p-1 text-center font-bold border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                                placeholder="FPP (25%)"
                              />
                            ) : (
                              <span className="font-mono">{act.ponderacion}</span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-emerald-800 bg-emerald-50/30 align-top">
                            {isEditing ? (
                              <input
                                type="text"
                                value={act.fecha || dateRange}
                                onChange={(e) => {
                                  const newActs = [...editablePlan.actividades];
                                  newActs[index].fecha = e.target.value;
                                  setEditablePlan({ ...editablePlan, actividades: newActs });
                                }}
                                className="w-full text-xs p-1 text-center font-mono font-bold border border-slate-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            ) : (
                              <span>{act.fecha || dateRange}</span>
                            )}
                          </td>
                          {isEditing && (
                            <td className="p-2 text-center align-top">
                              <button
                                type="button"
                                onClick={() => handleRemoveActivity(index)}
                                className="p-1 rounded hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                                title="Eliminar actividad"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100/90 border-t-2 border-slate-400 font-bold text-slate-800 text-[11px]">
                      <td colSpan={2} className="p-2 border-r border-slate-400">
                        <div className="flex items-center justify-between">
                          <span className="uppercase text-slate-900 font-black">
                            Total Metodología por Proyectos (6 Etapas de Acción Completa):
                          </span>
                          <span className="bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                            100% de Tiempo Cubierto
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-400 text-center font-mono font-black text-blue-900 bg-blue-50/50">
                        100%
                      </td>
                      <td className="p-2 text-center font-bold text-slate-600 text-[10px]" colSpan={isEditing ? 2 : 1}>
                        FPP (25%) + FEP (50%) + FVP (25%)
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* TABLE: RECURSOS Y TIC */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-400">
                <div className="p-3 space-y-1 bg-slate-50/30">
                  <span className="font-bold text-slate-900 block">Recursos Materiales:</span>
                  {isEditing ? (
                    <textarea
                      value={editablePlan.recursos}
                      onChange={(e) =>
                        setEditablePlan({ ...editablePlan, recursos: e.target.value })
                      }
                      className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : (
                    <p className="text-slate-700">{editablePlan.recursos}</p>
                  )}
                </div>

                <div className="p-3 space-y-1 bg-slate-50/30">
                  <span className="font-bold text-slate-900 block">TIC (Tecnologías de la Información):</span>
                  {isEditing ? (
                    <textarea
                      value={editablePlan.tic}
                      onChange={(e) => setEditablePlan({ ...editablePlan, tic: e.target.value })}
                      className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                      rows={2}
                    />
                  ) : (
                    <p className="text-slate-700">{editablePlan.tic}</p>
                  )}
                </div>
              </div>
            </div>

            {/* TABLE: BIBLIOGRAFÍA O EGRAFÍA */}
            <div className="border border-slate-400 rounded-lg overflow-hidden text-xs">
              <div className="bg-slate-100 border-b border-slate-400 py-1 px-3 text-center font-black uppercase text-slate-800 tracking-wider">
                BIBLIOGRAFÍA O EGRAFÍA
              </div>
              <div className="p-3 bg-white">
                {isEditing ? (
                  <textarea
                    value={editablePlan.bibliografia.join('\n')}
                    onChange={(e) =>
                      setEditablePlan({
                        ...editablePlan,
                        bibliografia: e.target.value.split('\n').filter(Boolean),
                      })
                    }
                    className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500"
                    rows={4}
                    placeholder="Una referencia bibliográfica por línea..."
                  />
                ) : (
                  <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                    {editablePlan.bibliografia.map((bib, idx) => (
                      <li key={idx} className="leading-snug">
                        {bib}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Save Buttons in Edit Mode */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditablePlan({ ...currentPlan });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-300 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Cambios del Módulo</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
