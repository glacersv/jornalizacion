import React, { useState, useEffect } from 'react';
import { ModuleDescriptor } from '../types';
import { X, Save, Sparkles, BookOpen, Clock, Calendar, CheckCircle, Trash2 } from 'lucide-react';

interface ModuleEditModalProps {
  module: ModuleDescriptor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedModule: ModuleDescriptor) => void;
  onDelete?: (code: string) => void;
}

export const ModuleEditModal: React.FC<ModuleEditModalProps> = ({
  module,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<ModuleDescriptor | null>(null);

  useEffect(() => {
    if (module) {
      setFormData({ ...module });
    }
  }, [module]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof ModuleDescriptor, value: any) => {
    setFormData((prev) => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };

      // Auto compute total indicators if any competency changes
      if (
        [
          'desarrolloTecnico',
          'desarrolloEmprendedor',
          'desarrolloHumanoSocial',
          'desarrolloAcademicoAplicado',
        ].includes(field as string)
      ) {
        const tec = Number(field === 'desarrolloTecnico' ? value : updated.desarrolloTecnico) || 0;
        const emp = Number(field === 'desarrolloEmprendedor' ? value : updated.desarrolloEmprendedor) || 0;
        const hum = Number(field === 'desarrolloHumanoSocial' ? value : updated.desarrolloHumanoSocial) || 0;
        const acad = Number(field === 'desarrolloAcademicoAplicado' ? value : updated.desarrolloAcademicoAplicado) || 0;
        updated.totalIndicadores = tec + emp + hum + acad;
      }

      // Auto update total hours
      if (field === 'duracionHoras') {
        updated.totalHoras = Number(value) || 0;
        updated.horasPorUnidad = { ...(updated.horasPorUnidad || { u1: Number(value) || 0 }), u1: Number(value) || 0 };
      }

      return updated;
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Editar Módulo Curricular: <span className="text-blue-400">{formData.codigo}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Ajuste competencias, horas, fechas de inicio/fin y datos descriptores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 max-h-[80vh] overflow-y-auto space-y-5 text-xs sm:text-sm">
          
          {/* Row 1: Code and Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código del Módulo:</label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Nombre Oficial del Módulo:</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden"
                required
              />
            </div>
          </div>

          {/* Row 2: Duration, Weeks, Weekly hours */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Duración (Horas):</label>
              <input
                type="number"
                value={formData.duracionHoras}
                onChange={(e) => handleChange('duracionHoras', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Semanas:</label>
              <input
                type="number"
                value={formData.semanas}
                onChange={(e) => handleChange('semanas', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Horas / Semana:</label>
              <input
                type="number"
                value={formData.horasSemanales}
                onChange={(e) => handleChange('horasSemanales', Number(e.target.value))}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1 text-xs">Total Indicadores:</label>
              <div className="px-2.5 py-1.5 rounded-lg bg-slate-200/80 border border-slate-300 font-bold text-blue-800 text-center">
                {formData.totalIndicadores}
              </div>
            </div>
          </div>

          {/* Row 3: Competency Breakdown */}
          <div>
            <label className="block font-bold text-slate-900 mb-2">Desglose de Competencias (Número de Indicadores):</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
              <div>
                <label className="block font-semibold text-indigo-950 mb-1 text-xs">Técnico:</label>
                <input
                  type="number"
                  value={formData.desarrolloTecnico}
                  onChange={(e) => handleChange('desarrolloTecnico', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-950 mb-1 text-xs">Emprendedor:</label>
                <input
                  type="number"
                  value={formData.desarrolloEmprendedor}
                  onChange={(e) => handleChange('desarrolloEmprendedor', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-950 mb-1 text-xs">Humano Social:</label>
                <input
                  type="number"
                  value={formData.desarrolloHumanoSocial}
                  onChange={(e) => handleChange('desarrolloHumanoSocial', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-indigo-950 mb-1 text-xs">Académico Aplicado:</label>
                <input
                  type="number"
                  value={formData.desarrolloAcademicoAplicado}
                  onChange={(e) => handleChange('desarrolloAcademicoAplicado', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-hidden bg-white"
                />
              </div>
            </div>
          </div>

          {/* Row 4: Dates & Scheduling */}
          <div>
            <label className="block font-bold text-slate-900 mb-2">Cronograma y Temporización (Inicio y Finalización):</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/40 p-3.5 rounded-xl border border-teal-100">
              <div className="space-y-2">
                <span className="font-semibold text-teal-900 text-xs block">Fecha de Inicio:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Día"
                    value={formData.diaInicio}
                    onChange={(e) => handleChange('diaInicio', Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white font-semibold"
                  />
                  <select
                    value={formData.mesInicio}
                    onChange={(e) => handleChange('mesInicio', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white capitalize font-semibold"
                  >
                    {['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre'].map((m) => (
                      <option key={m} value={m} className="capitalize">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Texto visible (ej: 19 de enero)"
                  value={formData.fechaInicio}
                  onChange={(e) => handleChange('fechaInicio', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white text-xs"
                />
              </div>

              <div className="space-y-2">
                <span className="font-semibold text-teal-900 text-xs block">Fecha de Finalización:</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Día"
                    value={formData.diaFin}
                    onChange={(e) => handleChange('diaFin', Number(e.target.value))}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white font-semibold"
                  />
                  <select
                    value={formData.mesFin}
                    onChange={(e) => handleChange('mesFin', e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white capitalize font-semibold"
                  >
                    {['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre'].map((m) => (
                      <option key={m} value={m} className="capitalize">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="Texto visible (ej: 23 de enero)"
                  value={formData.fechaFin}
                  onChange={(e) => handleChange('fechaFin', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-teal-200 bg-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Descriptor texts */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Competencia General:</label>
              <textarea
                rows={2}
                value={formData.competenciaGeneral || ''}
                onChange={(e) => handleChange('competenciaGeneral', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Objetivo del Módulo:</label>
              <textarea
                rows={2}
                value={formData.objetivoModulo || ''}
                onChange={(e) => handleChange('objetivoModulo', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`¿Está seguro de eliminar el módulo ${formData.codigo}?`)) {
                    onDelete(formData.codigo);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 border border-red-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Módulo</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
