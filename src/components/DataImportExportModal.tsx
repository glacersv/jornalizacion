import React, { useState } from 'react';
import { InstitutionalHeader, MonthStats, ModuleDescriptor } from '../types';
import { X, Upload, Download, RotateCcw, Check, AlertCircle, FileJson } from 'lucide-react';
import saveAs from 'file-saver';

interface DataImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  headerData: InstitutionalHeader;
  months: MonthStats[];
  modules: ModuleDescriptor[];
  onImportData: (data: {
    headerData?: InstitutionalHeader;
    months?: MonthStats[];
    modules?: ModuleDescriptor[];
  }) => void;
  onResetToDefaults: () => void;
}

export const DataImportExportModal: React.FC<DataImportExportModalProps> = ({
  isOpen,
  onClose,
  headerData,
  months,
  modules,
  onImportData,
  onResetToDefaults,
}) => {
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJSON = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      headerData,
      months,
      modules,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const fileName = `Jornalizacion_Backup_${headerData.gradoSeccion.replace(/[^a-zA-Z0-9]/g, '_')}_${headerData.anoLectivo}.json`;
    saveAs(blob, fileName);
    setSuccessMsg('Archivo JSON descargado exitosamente.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.headerData || parsed.modules || parsed.months) {
          onImportData(parsed);
          setSuccessMsg('Planificación importada con éxito desde el archivo.');
          setTimeout(() => {
            setSuccessMsg(null);
            onClose();
          }, 1500);
        } else {
          setErrorMsg('El archivo JSON no contiene una estructura válida de jornalización.');
        }
      } catch (err) {
        setErrorMsg('Error al parsear el archivo JSON. Verifique la sintaxis.');
      }
    };
    reader.readAsText(file);
  };

  const handleApplyTextJSON = () => {
    setErrorMsg(null);
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed.headerData || parsed.modules || parsed.months) {
        onImportData(parsed);
        setSuccessMsg('Datos aplicados correctamente.');
        setTimeout(() => {
          setSuccessMsg(null);
          onClose();
        }, 1500);
      } else {
        setErrorMsg('Formato de datos no reconocido.');
      }
    } catch (err) {
      setErrorMsg('Error de sintaxis en el JSON proporcionado.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-blue-600/30 text-blue-400">
              <FileJson className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Importar / Exportar Datos de Jornalización
              </h3>
              <p className="text-xs text-slate-400">
                Guarde copias de seguridad de su planificación o cargue archivos externos
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs sm:text-sm">
          
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Export Backup */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-blue-600" />
              <span>1. Descargar Copia de Seguridad Completa (JSON)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Descarga un archivo con toda la configuración, horas, módulos y fechas actuales para reutilizarlo o respaldarlo.
            </p>
            <button
              onClick={handleExportJSON}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Archivo JSON</span>
            </button>
          </div>

          {/* Section 2: Upload File */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>2. Cargar Archivo de Planificación (JSON)</span>
            </h4>
            <p className="text-xs text-slate-500 mb-3">
              Seleccione un archivo previamente guardado para restaurar todos los datos en la aplicación.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-xs">
              <Upload className="w-4 h-4" />
              <span>Seleccionar Archivo JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Section 3: Reset to defaults */}
          <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200">
            <h4 className="font-bold text-amber-950 mb-1 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>3. Restaurar Valores Oficiales de MINED</span>
            </h4>
            <p className="text-xs text-slate-600 mb-3">
              ¿Desea restablecer los módulos, competencias y calendario a la versión oficial de MINED para este grado?
            </p>
            <button
              onClick={() => {
                if (confirm('¿Restablecer todos los datos del grado actual a los valores oficiales de MINED?')) {
                  onResetToDefaults();
                  setSuccessMsg('Valores oficiales restablecidos correctamente.');
                  setTimeout(() => {
                    setSuccessMsg(null);
                    onClose();
                  }, 1500);
                }
              }}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restablecer a Valores Oficiales</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-200"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
