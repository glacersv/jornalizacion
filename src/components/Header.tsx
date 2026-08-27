import React from 'react';
import {
  Menu,
  FileSpreadsheet,
  Download,
  Copy,
  Printer,
  Check,
  Settings,
  UploadCloud,
  UserCheck,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { InstitutionalHeader } from '../types';
import { AppView } from './Sidebar';

interface HeaderProps {
  headerData: InstitutionalHeader;
  onToggleSidebar: () => void;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onPrint: () => void;
  onExportWord: () => void;
  onCopyMarkdown: () => void;
  copied: boolean;
  onOpenConfig: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  headerData,
  onToggleSidebar,
  activeView,
  setActiveView,
  onPrint,
  onExportWord,
  onCopyMarkdown,
  copied,
  onOpenConfig,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left: Hamburger button & Institution title */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              id="btn-hamburger-menu"
              onClick={onToggleSidebar}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-blue-600 text-white border border-slate-700 hover:border-blue-500 flex items-center gap-2 transition-all shadow-xs group"
              title="Abrir menú de opciones (Jornalización, Subir Documento, Docente y Grado)"
            >
              <Menu className="w-5 h-5 text-blue-400 group-hover:text-white transition-colors" />
              <span className="text-xs font-bold hidden sm:inline">Menú</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded border border-blue-400/30 truncate max-w-[150px] sm:max-w-[240px]">
                  {headerData.institucion}
                </span>
                <span className="text-xs text-slate-400 hidden md:inline">Año {headerData.anoLectivo}</span>
              </div>
              <h1 className="text-xs sm:text-sm md:text-base font-bold text-slate-100 tracking-tight truncate">
                {headerData.tituloDocumento} · <span className="text-blue-400 font-medium">{headerData.gradoSeccion}</span>
              </h1>
            </div>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* Quick view switch pills for larger screens */}
            <div className="hidden lg:inline-flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs">
              <button
                onClick={() => setActiveView('subir-documento')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  activeView === 'subir-documento'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Subir Doc.</span>
              </button>

              <button
                onClick={() => setActiveView('asignacion')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  activeView === 'asignacion'
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Docente & Grado</span>
              </button>

              <button
                onClick={() => setActiveView('jornalizacion')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  activeView === 'jornalizacion'
                    ? 'bg-indigo-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Tablas</span>
              </button>

              <button
                onClick={() => setActiveView('planificacion-didactica')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  activeView === 'planificacion-didactica'
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Planificación</span>
              </button>

              <button
                onClick={() => setActiveView('impresion')}
                className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 font-medium ${
                  activeView === 'impresion'
                    ? 'bg-amber-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Impresión</span>
              </button>
            </div>

            {/* Word Export Button */}
            <button
              id="btn-header-export-word"
              onClick={onExportWord}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Descargar archivo en formato Word (.doc / .docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Word .doc</span>
            </button>

            {/* Copy Markdown / Docs */}
            <button
              id="btn-copy-markdown"
              onClick={onCopyMarkdown}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Copiar texto Markdown para Word o Google Docs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-100" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            {/* Print / PDF */}
            <button
              id="btn-print-doc"
              onClick={onPrint}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Imprimir o guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Imprimir</span>
            </button>

            {/* Quick config */}
            <button
              id="btn-config-settings"
              onClick={onOpenConfig}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Configuración rápida"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
