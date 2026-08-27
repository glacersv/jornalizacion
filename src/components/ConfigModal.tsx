import React, { useState } from 'react';
import { X, Save, RotateCcw, Building2, User, Calendar, GraduationCap, Clock } from 'lucide-react';
import { InstitutionalHeader } from '../types';
import { defaultHeaderData } from '../data/jornalizacionData';

interface ConfigModalProps {
  headerData: InstitutionalHeader;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newData: InstitutionalHeader) => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({
  headerData,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<InstitutionalHeader>({ ...headerData });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData({ ...defaultHeaderData });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden">
        
        <div className="p-4 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">
              Configuración de Encabezado y Jornalización
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              Institución Educativa
            </label>
            <input
              type="text"
              value={formData.institucion}
              onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              Nombre del Docente
            </label>
            <input
              type="text"
              value={formData.docente}
              onChange={(e) => setFormData({ ...formData, docente: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                Grado y Especialidad
              </label>
              <input
                type="text"
                value={formData.gradoSeccion}
                onChange={(e) => setFormData({ ...formData, gradoSeccion: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Año Escolar Lectivo
              </label>
              <input
                type="text"
                value={formData.anoLectivo}
                onChange={(e) => setFormData({ ...formData, anoLectivo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              Horas Semanales por Módulo Técnico
            </label>
            <input
              type="number"
              value={formData.horasSemanalesModulo}
              onChange={(e) => setFormData({ ...formData, horasSemanalesModulo: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 text-sm"
              min={1}
              max={40}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nota Evaluativa Institucional
            </label>
            <textarea
              value={formData.notaEvaluativa}
              onChange={(e) => setFormData({ ...formData, notaEvaluativa: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs text-slate-700"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Valores
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
