import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Building2,
  Calendar,
  GraduationCap,
  Clock,
  FileText,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Layers,
  Save,
  Check,
} from 'lucide-react';
import { InstitutionalHeader, ModuleDescriptor } from '../types';

interface DocenteGradoViewProps {
  headerData: InstitutionalHeader;
  currentGrade: '10' | '11' | '12';
  onSelectGrade: (grade: '10' | '11' | '12') => void;
  onUpdateHeader: (newHeader: InstitutionalHeader) => void;
  onGoToJornalizacion: () => void;
  modules: ModuleDescriptor[];
}

export const DocenteGradoView: React.FC<DocenteGradoViewProps> = ({
  headerData,
  currentGrade,
  onSelectGrade,
  onUpdateHeader,
  onGoToJornalizacion,
  modules,
}) => {
  const [formData, setFormData] = useState<InstitutionalHeader>({ ...headerData });
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync formData whenever headerData or currentGrade changes externally
  useEffect(() => {
    setFormData({ ...headerData });
  }, [headerData, currentGrade]);

  const gradeCards = [
    {
      id: '10' as const,
      name: '1° Año de Bachillerato',
      shortName: '10° Grado',
      specialty: 'Diseño Gráfico Vocacional',
      totalHoras: '720 Horas Anuales',
      horasSem: '18 hrs / sem',
      modulesCount: '9 Módulos Oficiales',
      description: 'Fundamentos de diseño, dibujo vectorial, retoque digital de imagen y tipografía aplicada.',
      color: 'blue',
      border: currentGrade === '10' ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30' : 'border-slate-200 bg-white hover:border-blue-300',
      badge: 'BTVDG1',
    },
    {
      id: '11' as const,
      name: '2° Año de Bachillerato',
      shortName: '11° Grado',
      specialty: 'Diseño Gráfico Vocacional',
      totalHoras: '720 Horas Anuales',
      horasSem: '18 hrs / sem',
      modulesCount: '9 Módulos Oficiales',
      description: 'Diseño editorial, identidad visual corporativa, empaques, señalética e ilustración digital avanzada.',
      color: 'indigo',
      border: currentGrade === '11' ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/30' : 'border-slate-200 bg-white hover:border-indigo-300',
      badge: 'BTVDG2',
    },
    {
      id: '12' as const,
      name: '3° Año de Bachillerato',
      shortName: '12° Grado',
      specialty: 'Diseño Gráfico Vocacional',
      totalHoras: '1,200 Horas Anuales',
      horasSem: '30 hrs / sem',
      modulesCount: '9 Módulos Oficiales',
      description: 'Multimedia, animación, modelado 3D, diseño web, desarrollo de marcas y proyectos de emprendimiento.',
      color: 'purple',
      border: currentGrade === '12' ? 'border-purple-600 bg-purple-50/70 ring-2 ring-purple-500/30' : 'border-slate-200 bg-white hover:border-purple-300',
      badge: 'BTVDG3',
    },
  ];

  const handleGradeChange = (gradeId: '10' | '11' | '12') => {
    onSelectGrade(gradeId);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHeader(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Asignación y Datos Institucionales</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Docente, Institución y Selección de Grado
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Personalice los datos de su centro educativo, docente responsable y seleccione el nivel de Bachillerato Técnico Vocacional para sincronizar la carga horaria y los descriptores curriculares.
          </p>
        </div>

        <button
          onClick={onGoToJornalizacion}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shrink-0"
        >
          <span>Ir a Ver Tablas</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1 font-bold">
            ¡Datos institucionales y de asignación docente guardados correctamente!
          </div>
        </div>
      )}

      {/* Section 1: Interactive Grade Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span>1. Seleccionar Año de Bachillerato (Nivel de Estudio)</span>
          </h2>
          <span className="text-xs text-slate-500">
            * Elige el grado para cargar automáticamente los módulos oficiales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gradeCards.map((g) => {
            const isSelected = currentGrade === g.id;

            return (
              <div
                key={g.id}
                onClick={() => handleGradeChange(g.id)}
                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer shadow-xs relative flex flex-col justify-between ${g.border}`}
              >
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white">
                      {g.shortName}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {g.badge}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 mb-1">
                    {g.name}
                  </h3>

                  <p className="text-xs text-slate-600 mb-4 line-clamp-2">
                    {g.description}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-200/80 text-xs">
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Módulos:</span>
                    <strong className="text-slate-900">{g.modulesCount}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Carga Anual:</span>
                    <strong className="text-blue-700">{g.totalHoras}</strong>
                  </div>
                  <div className="flex items-center justify-between text-slate-700">
                    <span>Intensidad:</span>
                    <strong className="text-indigo-700">{g.horasSem}</strong>
                  </div>
                </div>

                <div className="mt-4">
                  <span
                    className={`w-full py-1.5 rounded-lg text-xs font-bold text-center block transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ Grado Seleccionado' : 'Seleccionar Este Grado'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Form for Teacher and Institution */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>2. Datos del Docente e Institución Educativa</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Esta información encabezará todos los documentos oficiales, tablas de jornalización y exportaciones en Word.
            </p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-5 text-sm">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Institution */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Institución Educativa
              </label>
              <input
                type="text"
                value={formData.institucion}
                onChange={(e) => setFormData({ ...formData, institucion: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
                placeholder="Ej. Instituto Nacional 'San Francisco'"
                required
              />
            </div>

            {/* Teacher Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Nombre del Docente Responsable
              </label>
              <input
                type="text"
                value={formData.docente}
                onChange={(e) => setFormData({ ...formData, docente: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
                placeholder="Ej. Lic. / Prof. Nombre del Docente"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Grade & Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Grado / Sección
              </label>
              <input
                type="text"
                value={formData.gradoSeccion}
                onChange={(e) => setFormData({ ...formData, gradoSeccion: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
                required
              />
            </div>

            {/* School Year */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Año Escolar Lectivo
              </label>
              <input
                type="text"
                value={formData.anoLectivo}
                onChange={(e) => setFormData({ ...formData, anoLectivo: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
                required
              />
            </div>

            {/* Weekly Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Horas Semanales
              </label>
              <input
                type="number"
                value={formData.horasSemanalesModulo}
                onChange={(e) => setFormData({ ...formData, horasSemanalesModulo: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
                min={1}
                max={40}
                required
              />
            </div>
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              Título Oficial del Documento
            </label>
            <input
              type="text"
              value={formData.tituloDocumento}
              onChange={(e) => setFormData({ ...formData, tituloDocumento: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 bg-slate-50 focus:bg-white transition-all text-sm"
              required
            />
          </div>

          {/* Institutional Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Disposición o Nota Evaluativa Institucional
            </label>
            <textarea
              rows={3}
              value={formData.notaEvaluativa}
              onChange={(e) => setFormData({ ...formData, notaEvaluativa: e.target.value })}
              className="w-full p-3 text-xs font-medium text-red-700 bg-red-50/40 border border-red-200 rounded-xl focus:bg-white focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-hidden leading-relaxed"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Esta nota se colocará al final de la Tabla 4 y en el reporte Word para constancia de acreditación.
            </p>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              * Los cambios se aplican inmediatamente a todas las tablas del sistema.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos de Asignación</span>
              </button>

              <button
                type="button"
                onClick={onGoToJornalizacion}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Ver Jornalización</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </form>
      </div>

    </div>
  );
};
