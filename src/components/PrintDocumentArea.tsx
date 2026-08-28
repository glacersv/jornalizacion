import React from 'react';
import { InstitutionalHeader, MonthStats, ModuleDescriptor } from '../types';
import {
  Printer,
  Download,
  FileText,
  Copy,
  Check,
  Building2,
  Calendar,
  User,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';
import { exportToWordDocument } from '../utils/documentExporter';

interface PrintDocumentAreaProps {
  headerData: InstitutionalHeader;
  months: MonthStats[];
  modules: ModuleDescriptor[];
  onCopyMarkdown: () => void;
  copied: boolean;
}

export const PrintDocumentArea: React.FC<PrintDocumentAreaProps> = ({
  headerData,
  months,
  modules,
  onCopyMarkdown,
  copied,
}) => {
  const totalWeeks = months.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const totalDays = months.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  const totalTec = modules.reduce((acc, m) => acc + (Number(m.desarrolloTecnico) || 0), 0);
  const totalEmp = modules.reduce((acc, m) => acc + (Number(m.desarrolloEmprendedor) || 0), 0);
  const totalHum = modules.reduce((acc, m) => acc + (Number(m.desarrolloHumanoSocial) || 0), 0);
  const totalAcad = modules.reduce((acc, m) => acc + (Number(m.desarrolloAcademicoAplicado) || 0), 0);
  const grandTotalIndicadores = modules.reduce((acc, m) => acc + (Number(m.totalIndicadores) || 0), 0);
  const grandTotalHoras = modules.reduce((acc, m) => acc + (Number(m.duracionHoras) || 0), 0);
  const grandTotalSemanas = modules.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    exportToWordDocument(headerData, months, modules);
  };

  return (
    <div className="space-y-6">
      {/* Control Banner (Hidden in Print) */}
      <div className="no-print bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold text-xs uppercase tracking-wider border border-blue-400/30">
              Área de Impresión y Exportación
            </span>
            <span className="text-xs text-slate-400">Documento Oficial MINED</span>
          </div>
          <h2 className="text-lg font-bold text-slate-100 mt-1">
            Vista Previa de Impresión y Generador de Documentos
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Genera tu archivo Word (.doc/docx) editable o imprime directamente en PDF con el membrete institucional.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="btn-export-word-doc"
            onClick={handleExportWord}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Word (.doc / .docx)</span>
          </button>

          <button
            id="btn-print-pdf-doc"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            id="btn-copy-markdown-print-area"
            onClick={onCopyMarkdown}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-100" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet (Standard Letter / A4 style) */}
      <div
        id="printable-document-sheet"
        className="bg-white rounded-xl shadow-md border border-slate-300 print:border-none print:shadow-none p-6 sm:p-10 max-w-5xl mx-auto text-slate-900 font-sans"
      >
        {/* Institutional Header with Logos & Title */}
        <div className="border-b-2 border-slate-800 pb-5 mb-6 text-center">
          <div className="text-xs font-extrabold uppercase tracking-widest text-slate-600 mb-1">
            REPÚBLICA DE EL SALVADOR · MINISTERIO DE EDUCACIÓN, CIENCIA Y TECNOLOGÍA
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
            {headerData.institucion}
          </h1>
          <div className="text-sm font-bold text-blue-700 mt-1 uppercase tracking-wide">
            {headerData.tituloDocumento} · PLANIFICACIÓN DIDÁCTICA POR COMPETENCIAS
          </div>
        </div>

        {/* Metadata Grid Table */}
        <table className="w-full border-collapse border border-slate-400 mb-6 text-xs sm:text-sm">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="w-1/3 bg-slate-100 p-2.5 font-bold text-slate-700 border-r border-slate-300">
                Docente Responsable:
              </td>
              <td className="w-2/3 p-2.5 font-semibold text-slate-900">
                {headerData.docente}
              </td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2.5 font-bold text-slate-700 border-r border-slate-300">
                Grado y Especialidad:
              </td>
              <td className="p-2.5 font-semibold text-slate-900">
                {headerData.gradoSeccion}
              </td>
            </tr>
            <tr>
              <td className="bg-slate-100 p-2.5 font-bold text-slate-700 border-r border-slate-300">
                Año Escolar / Carga Semanal:
              </td>
              <td className="p-2.5 font-semibold text-slate-900">
                Año Lectivo {headerData.anoLectivo} &nbsp;|&nbsp; {headerData.horasSemanalesModulo} Horas Semanales
              </td>
            </tr>
          </tbody>
        </table>

        {/* 1. Semanas Laborales y Días Lectivos */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider bg-blue-50/80 p-2 rounded border-l-4 border-blue-600 mb-3">
            1. Semanas Laborales y Días Lectivos - {headerData.anoLectivo}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-center text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400">
                  <th className="p-2 border-r border-slate-400 text-left w-24">Meses</th>
                  {months.map((m) => (
                    <th key={m.month} className="p-2 border-r border-slate-400 capitalize font-bold">
                      {m.name}
                    </th>
                  ))}
                  <th className="p-2 bg-blue-100 text-blue-950 font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300">
                  <td className="p-2 font-bold text-left bg-slate-50 border-r border-slate-400">
                    Semanas
                  </td>
                  {months.map((m) => (
                    <td key={m.month} className="p-2 border-r border-slate-300 font-medium">
                      {m.semanas}
                    </td>
                  ))}
                  <td className="p-2 font-bold bg-blue-50 text-blue-900">{totalWeeks}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-left bg-slate-50 border-r border-slate-400">
                    Días
                  </td>
                  {months.map((m) => (
                    <td key={m.month} className="p-2 border-r border-slate-300 font-medium">
                      {m.dias}
                    </td>
                  ))}
                  <td className="p-2 font-bold bg-blue-50 text-blue-900">{totalDays}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Holidays and breaks detail */}
          <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700">
            <strong className="text-slate-900 block mb-1.5 font-bold">
              Detalle de actividades, descansos y pausas pedagógicas institucionales:
            </strong>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
              {months.map((m) => (
                <div key={m.month} className="flex gap-1.5">
                  <strong className="text-slate-800 shrink-0">{m.name}:</strong>
                  <span className="text-slate-600">{m.feriadosDesc || 'Sin suspensiones.'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Matriz de Carga Horaria y Competencias */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider bg-blue-50/80 p-2 rounded border-l-4 border-blue-600 mb-3">
            2. Carga Horaria de Módulos y Desglose de Competencias
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-400 text-center text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th rowSpan={2} className="p-2 border-r border-slate-400 text-left w-24">
                    Módulos
                  </th>
                  <th colSpan={4} className="p-1.5 border-r border-slate-400 bg-slate-200">
                    Competencias por Módulo
                  </th>
                  <th rowSpan={2} className="p-1.5 border-r border-slate-400 w-16">
                    Total Ind.
                  </th>
                  <th rowSpan={2} className="p-1.5 border-r border-slate-400 w-14">
                    Horas Sem.
                  </th>
                  <th rowSpan={2} className="p-1.5 border-r border-slate-400 w-14">
                    Horas Anuales
                  </th>
                  <th colSpan={4} className="p-1.5 border-r border-slate-400 bg-slate-200">
                    Horas Clase por Unidad
                  </th>
                  <th rowSpan={2} className="p-1.5 bg-blue-100 text-blue-950 font-bold w-14">
                    Total
                  </th>
                </tr>
                <tr className="bg-slate-50 text-[10px] font-semibold border-b border-slate-400">
                  <th className="p-1 border-r border-slate-300">Técnico</th>
                  <th className="p-1 border-r border-slate-300">Emprend.</th>
                  <th className="p-1 border-r border-slate-300">Hum-Soc.</th>
                  <th className="p-1 border-r border-slate-400">Acad-Apl.</th>
                  <th className="p-1 border-r border-slate-300 w-8">U1</th>
                  <th className="p-1 border-r border-slate-300 w-8">U2</th>
                  <th className="p-1 border-r border-slate-300 w-8">U3</th>
                  <th className="p-1 border-r border-slate-400 w-8">U4</th>
                </tr>
              </thead>
              <tbody>
                {modules.map((m) => (
                  <tr key={m.codigo} className="border-b border-slate-300">
                    <td className="p-1.5 text-left font-bold text-slate-900 border-r border-slate-400">
                      {m.codigo}
                    </td>
                    <td className="p-1.5 border-r border-slate-300">{m.desarrolloTecnico ?? 0}</td>
                    <td className="p-1.5 border-r border-slate-300">{m.desarrolloEmprendedor ?? 0}</td>
                    <td className="p-1.5 border-r border-slate-300">{m.desarrolloHumanoSocial ?? 0}</td>
                    <td className="p-1.5 border-r border-slate-400">{m.desarrolloAcademicoAplicado ?? 0}</td>
                    <td className="p-1.5 font-bold border-r border-slate-400 bg-slate-50">
                      {m.totalIndicadores ?? 0}
                    </td>
                    <td className="p-1.5 border-r border-slate-400">{m.horasSemanales ?? 18}</td>
                    <td className="p-1.5 font-semibold border-r border-slate-400">{m.duracionHoras ?? m.totalHoras ?? 0}</td>
                    <td className="p-1.5 border-r border-slate-300">{m.horasPorUnidad?.u1 ?? m.duracionHoras ?? m.totalHoras ?? 0}</td>
                    <td className="p-1.5 border-r border-slate-300">{m.horasPorUnidad?.u2 || '-'}</td>
                    <td className="p-1.5 border-r border-slate-300">{m.horasPorUnidad?.u3 || '-'}</td>
                    <td className="p-1.5 border-r border-slate-400">{m.horasPorUnidad?.u4 || '-'}</td>
                    <td className="p-1.5 font-bold bg-blue-50/50">{m.totalHoras ?? 0}</td>
                  </tr>
                ))}
                <tr className="bg-slate-100 font-bold border-t-2 border-slate-400 text-slate-900">
                  <td className="p-2 text-left border-r border-slate-400">TOTAL</td>
                  <td className="p-1.5 border-r border-slate-300">{totalTec}</td>
                  <td className="p-1.5 border-r border-slate-300">{totalEmp}</td>
                  <td className="p-1.5 border-r border-slate-300">{totalHum}</td>
                  <td className="p-1.5 border-r border-slate-400">{totalAcad}</td>
                  <td className="p-1.5 border-r border-slate-400 bg-slate-200">{grandTotalIndicadores}</td>
                  <td className="p-1.5 border-r border-slate-400">{headerData.horasSemanalesModulo} avg</td>
                  <td className="p-1.5 border-r border-slate-400">{grandTotalHoras}</td>
                  <td colSpan={4} className="p-1.5 border-r border-slate-400 text-slate-600 text-[10px]">
                    Secuencial
                  </td>
                  <td className="p-1.5 bg-blue-100 text-blue-950 font-bold">{grandTotalHoras}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Temporización de Módulos (Cronograma Inicio / Fin) */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wider bg-blue-50/80 p-2 rounded border-l-4 border-blue-600 mb-3">
            3. Temporización y Cronograma de Ejecución
          </h2>

          <table className="w-full border-collapse border border-slate-400 text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                <th className="p-2 border-r border-slate-400 w-24 text-left">Código</th>
                <th className="p-2 border-r border-slate-400 text-left">Nombre Oficial del Módulo</th>
                <th className="p-2 border-r border-slate-400 w-20 text-center">Semanas</th>
                <th className="p-2 border-r border-slate-400 w-20 text-center">Horas</th>
                <th className="p-2 border-r border-slate-400 w-32 text-center">Fecha Inicio</th>
                <th className="p-2 text-center w-32">Fecha Finalización</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.codigo} className="border-b border-slate-300">
                  <td className="p-2 font-bold text-slate-900 border-r border-slate-400">{m.codigo}</td>
                  <td className="p-2 font-medium text-slate-800 border-r border-slate-400">{m.nombre}</td>
                  <td className="p-2 text-center font-semibold border-r border-slate-400">{m.semanas} sem</td>
                  <td className="p-2 text-center font-semibold border-r border-slate-400">{m.duracionHoras}h</td>
                  <td className="p-2 text-center font-bold text-blue-800 border-r border-slate-400">{m.fechaInicio}</td>
                  <td className="p-2 text-center font-bold text-blue-800">{m.fechaFin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Disposición Evaluativa */}
        <div className="mb-10 p-3.5 bg-amber-50 rounded border border-amber-300 text-xs">
          <strong className="text-amber-950 font-bold uppercase tracking-wider block mb-1">
            4. Disposición y Nota Evaluativa Institucional:
          </strong>
          <p className="text-red-700 font-bold leading-relaxed">{headerData.notaEvaluativa}</p>
        </div>

        {/* Institutional Signatures */}
        <div className="pt-8 border-t border-slate-300 grid grid-cols-2 gap-10 text-center text-xs">
          <div>
            <div className="w-56 mx-auto border-t border-slate-900 pt-1.5 mb-1"></div>
            <strong className="text-slate-900 font-bold text-sm block">{headerData.docente}</strong>
            <span className="text-slate-600">Docente Responsable de Especialidad</span>
          </div>

          <div>
            <div className="w-56 mx-auto border-t border-slate-900 pt-1.5 mb-1"></div>
            <strong className="text-slate-900 font-bold text-sm block">Coordinación Académica / Dirección</strong>
            <span className="text-slate-600">{headerData.institucion}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
