import React, { useState } from 'react';
import { ModuleDescriptor } from '../types';
import { BookOpen, CheckCircle, Clock, Award, Layers, Target, HelpCircle, FileCheck, X, Sparkles } from 'lucide-react';
import { getModuleStagesAccionCompleta } from '../utils/didacticPlanHelper';

interface DescriptorViewerProps {
  modules: ModuleDescriptor[];
  selectedModule: ModuleDescriptor | null;
  onSelectModule: (mod: ModuleDescriptor) => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const ModuleDescriptorViewer: React.FC<DescriptorViewerProps> = ({
  modules,
  selectedModule,
  onSelectModule,
  onClose,
  isModal = false,
}) => {
  const current = selectedModule || modules[0];
  const stages = getModuleStagesAccionCompleta(current);

  const content = (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className="bg-slate-900 text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
              Descriptor MINED · {current.codigo}
            </span>
            <span className="text-xs text-slate-400">{current.duracionHoras} Horas ({current.semanas} {current.semanas === 1 ? 'semana' : 'semanas'})</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {current.nombre}
          </h2>
        </div>
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors self-end sm:self-center"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Module quick selector tabs */}
      <div className="bg-slate-100/80 border-b border-slate-200 p-2 flex gap-1.5 overflow-x-auto">
        {modules.map((m) => (
          <button
            key={m.codigo}
            onClick={() => onSelectModule(m)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              m.codigo === current.codigo
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-white text-slate-700 hover:bg-slate-200/70 border border-slate-200'
            }`}
          >
            <span>{m.codigo}</span>
            <span className="text-[11px] opacity-75">({m.duracionHoras}h)</span>
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        
        {/* General Aspects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Campo:</span>
            <strong className="text-slate-800 text-sm font-semibold">{current.campo || 'Industrial'}</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Especialidad:</span>
            <strong className="text-slate-800 text-sm font-semibold">{current.especialidad || 'Diseño Gráfico'}</strong>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 font-medium block">Prerrequisito:</span>
            <strong className="text-slate-800 text-sm font-semibold">{current.prerrequisito || 'Primer año de Bachillerato'}</strong>
          </div>
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <span className="text-blue-600 font-medium block">Fechas 2026:</span>
            <strong className="text-blue-900 text-sm font-semibold">{current.fechaInicio} – {current.fechaFin}</strong>
          </div>
        </div>

        {/* Competencia & Objetivo */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Competencia General</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed font-medium">
              {current.competenciaGeneral}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
            <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Target className="w-4 h-4 text-teal-600" />
              <span>Objetivo del Módulo</span>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">
              {current.objetivoModulo}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-1.5">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Situación Problemática Real</span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {current.situacionProblematica}
            </p>
          </div>
        </div>

        {/* Competencias 4 Ejes Breakdown */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Desglose de Indicadores por Ejes de Competencia</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="text-xs font-bold text-blue-900 mb-1">DESARROLLO TÉCNICO</div>
              <div className="text-2xl font-black text-blue-700">{current.desarrolloTecnico}</div>
              <p className="text-[11px] text-slate-500 mt-1">Saber hacer técnico y dominio procedimental</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="text-xs font-bold text-emerald-900 mb-1">DESARROLLO EMPRENDEDOR</div>
              <div className="text-2xl font-black text-emerald-700">{current.desarrolloEmprendedor}</div>
              <p className="text-[11px] text-slate-500 mt-1">Iniciativa de negocio y solución de retos</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="text-xs font-bold text-purple-900 mb-1">HUMANO SOCIAL</div>
              <div className="text-2xl font-black text-purple-700">{current.desarrolloHumanoSocial}</div>
              <p className="text-[11px] text-slate-500 mt-1">Valores, trabajo cooperativo y ética</p>
            </div>
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60">
              <div className="text-xs font-bold text-amber-900 mb-1">ACADÉMICO APLICADO</div>
              <div className="text-2xl font-black text-amber-700">{current.desarrolloAcademicoAplicado}</div>
              <p className="text-[11px] text-slate-500 mt-1">Saberes científicos, lingüísticos y lógico-matemáticos</p>
            </div>
          </div>
        </div>

        {/* Criterios de Evaluación */}
        {current.criteriosEvaluacion && current.criteriosEvaluacion.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Criterios de Evaluación Criterial (Nivel Mínimo 4)</span>
            </h3>
            <ul className="space-y-2 bg-slate-50/80 p-4 rounded-xl border border-slate-200 text-xs text-slate-700">
              {current.criteriosEvaluacion.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Las 6 Etapas de la Acción Completa info box */}
        <div className="p-4 rounded-xl bg-slate-900 text-white">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Metodología por Proyectos · Las 6 Etapas de la Acción Completa (MINED)</span>
            </div>
            <span className="text-[10px] font-bold text-blue-300 bg-blue-950/80 px-2.5 py-0.5 rounded-full border border-blue-800">
              Total: {current.duracionHoras} Horas · 100% Ponderación
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
            {stages.map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-lg bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between text-left"
              >
                <div>
                  <div className="text-blue-300 font-bold text-[11px] leading-tight mb-1">
                    {st.nombreCorto}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>{st.tiempo}</span>
                    <span className="font-semibold text-slate-300">{st.horasEstimadas}h</span>
                  </div>
                </div>
                <div className="pt-1.5 border-t border-slate-700/60 mt-1">
                  <div className="text-[9px] font-bold text-emerald-400">
                    {st.ponderacionInternaFaseTexto}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {st.ponderacionGlobalModuloTexto}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
        <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};
