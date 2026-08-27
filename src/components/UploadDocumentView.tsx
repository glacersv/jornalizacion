import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  FileSpreadsheet,
  FileJson,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Layers,
  Eye,
  FileCode,
  Calendar,
  GraduationCap,
  Loader2,
  Trash2,
  Plus,
  Edit3,
  SlidersHorizontal,
  Clock,
  BookOpen,
  CalendarDays,
  Check,
  FileCheck2,
  Info,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { InstitutionalHeader, ModuleDescriptor, MonthStats, AcademicPeriod, SuspensionEvent } from '../types';
import {
  parsePdfFile,
  parseExcelFile,
  parseJsonContent,
  ParsedDocumentResult,
  generateExcelTemplateWorkbook,
  recalculateModuleDatesFromCalendar,
} from '../utils/fileImportParsers';
import { academicPeriods2026, monthsData2026, modulesData1stYear, modulesData2ndYear, modulesData3rdYear } from '../data/jornalizacionData';
import saveAs from 'file-saver';
import * as XLSX from 'xlsx';

interface UploadDocumentViewProps {
  headerData: InstitutionalHeader;
  months: MonthStats[];
  modules: ModuleDescriptor[];
  onImportData: (data: {
    headerData?: InstitutionalHeader;
    months?: MonthStats[];
    modules?: ModuleDescriptor[];
    targetGrade?: '10' | '11' | '12';
  }) => void;
  onResetToDefaults: () => void;
  onGoToJornalizacion: () => void;
  onGoToCalendario: () => void;
}

export const UploadDocumentView: React.FC<UploadDocumentViewProps> = ({
  headerData,
  months,
  modules,
  onImportData,
  onResetToDefaults,
  onGoToJornalizacion,
  onGoToCalendario,
}) => {
  // Method selection tab: 'metodo1_lector' | 'metodo2_plantilla' | 'metodo3_formulario'
  const [activeMethod, setActiveMethod] = useState<'metodo1_lector' | 'metodo2_plantilla' | 'metodo3_formulario'>('metodo1_lector');

  // Drag & Drop State
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [parsedResult, setParsedResult] = useState<ParsedDocumentResult | null>(null);
  const [activePreviewTab, setActivePreviewTab] = useState<'modulos' | 'calendario' | 'periodos' | 'encabezado' | 'texto'>('modulos');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateInputRef = useRef<HTMLInputElement>(null);

  // Method 3: Interactive Wizard Form State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [wizardHeader, setWizardHeader] = useState<InstitutionalHeader>({ ...headerData });
  const [wizardMonths, setWizardMonths] = useState<MonthStats[]>(JSON.parse(JSON.stringify(months)));
  const [wizardModules, setWizardModules] = useState<ModuleDescriptor[]>(JSON.parse(JSON.stringify(modules)));
  const [newModuleCode, setNewModuleCode] = useState('');
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleHours, setNewModuleHours] = useState(90);

  // Stats calculation
  const totalHoras = modules.reduce((acc, m) => acc + (Number(m.totalHoras) || 0), 0);
  const totalSemanas = months.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const totalDias = months.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  // Wizard stats
  const wizardTotalHoras = wizardModules.reduce((acc, m) => acc + (Number(m.totalHoras) || 0), 0);
  const wizardTotalSemanas = wizardMonths.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const wizardTotalDias = wizardMonths.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setParsedResult(null);
    setIsLoading(true);
    const fileNameLower = file.name.toLowerCase();

    try {
      if (fileNameLower.endsWith('.pdf')) {
        setLoadingText('Leyendo y analizando documento PDF con lector inteligente...');
        const result = await parsePdfFile(file);
        setParsedResult(result);
        setSuccessMsg(`¡PDF "${file.name}" leído exitosamente! Se identificaron ${result.summary.modulesCount} módulos y la estructura institucional.`);
      } else if (
        fileNameLower.endsWith('.xlsx') ||
        fileNameLower.endsWith('.xls') ||
        fileNameLower.endsWith('.csv')
      ) {
        setLoadingText('Analizando hojas de cálculo Excel...');
        const result = await parseExcelFile(file);
        setParsedResult(result);
        setSuccessMsg(`¡Archivo Excel "${file.name}" analizado con éxito!`);
      } else if (fileNameLower.endsWith('.json')) {
        setLoadingText('Leyendo archivo de respaldo JSON...');
        const text = await file.text();
        const result = parseJsonContent(text, file.name, file.size);
        setParsedResult(result);
        setSuccessMsg(`¡Archivo JSON "${file.name}" validado correctamente!`);
      } else {
        setErrorMsg('Formato no soportado. Por favor suba un archivo PDF (.pdf), Excel (.xlsx/.xls/.csv) o JSON (.json).');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Error al procesar el archivo: ${err?.message || 'Verifique que el archivo no esté protegido.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleApplyParsedData = () => {
    if (!parsedResult) return;

    const newHeader: InstitutionalHeader = {
      ...headerData,
      ...(parsedResult.headerData || {}),
    };

    onImportData({
      headerData: newHeader,
      modules: parsedResult.modules && parsedResult.modules.length > 0 ? parsedResult.modules : undefined,
      months: parsedResult.months && parsedResult.months.length > 0 ? parsedResult.months : undefined,
      targetGrade: parsedResult.detectedGrade,
    });

    setSuccessMsg('¡Datos aplicados con éxito a la Jornalización Curricular y al Calendario!');
  };

  const handleLoadOfficialPreset = () => {
    onImportData({
      headerData: {
        ...headerData,
        institucion: 'Colegio Salesiano San José - Santa Ana',
        anoLectivo: '2026',
      },
      months: JSON.parse(JSON.stringify(monthsData2026)),
      modules: JSON.parse(JSON.stringify(headerData.anoNivel === '10' ? modulesData1stYear : headerData.anoNivel === '12' ? modulesData3rdYear : modulesData2ndYear)),
    });
    setSuccessMsg('¡Calendario Oficial y Jornalización 2026 del Colegio Salesiano San José cargados al 100% con exactitud de fechas, semanas y días!');
  };

  const handleApplyPastedJson = () => {
    if (!jsonText.trim()) {
      setErrorMsg('Por favor pegue el contenido JSON en el área de texto.');
      return;
    }
    try {
      const result = parseJsonContent(jsonText, 'texto-pegado.json');
      setParsedResult(result);
      setSuccessMsg('¡Texto JSON procesado correctamente!');
    } catch (err) {
      setErrorMsg('Error de sintaxis en el JSON proporcionado. Verifique llaves y comillas.');
    }
  };

  const handleDownloadExcelTemplate = () => {
    const wb = generateExcelTemplateWorkbook(headerData, months, modules);
    XLSX.writeFile(wb, `Plantilla_Oficial_Jornalizacion_${headerData.gradoSeccion.replace(/[^a-zA-Z0-9]/g, '_')}_2026.xlsx`);
    setSuccessMsg('Plantilla Excel descargada con 3 hojas: Periodos/Evaluaciones, Calendario/Días y Módulos.');
  };

  const handleDownloadCsvTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Codigo_Modulo,Nombre_Modulo,Total_Horas,Horas_Semanales,Semanas,Fecha_Inicio,Fecha_Fin,Competencias\n" +
      modules.map(m => `"${m.codigo}","${m.nombre}",${m.totalHoras},${m.horasSemanales},${m.semanas},"${m.fechaInicio}","${m.fechaFin}","${m.competencias || ''}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Plantilla_Modulos_${headerData.anoLectivo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg('Plantilla CSV de Módulos descargada.');
  };

  const handleDownloadJsonBackup = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      app: 'Colegio Salesiano San José - Jornalización 2026',
      headerData,
      months,
      modules,
      academicPeriods: academicPeriods2026,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    saveAs(blob, `Respaldo_Completo_Jornalizacion_${headerData.anoLectivo}.json`);
    setSuccessMsg('Respaldo JSON descargado con toda la estructura de fechas y módulos.');
  };

  // Wizard Step Module Add
  const handleWizardAddModule = () => {
    if (!newModuleName.trim()) return;
    const code = newModuleCode.trim() || `BTVDG${wizardHeader.anoNivel === '10' ? '1' : wizardHeader.anoNivel === '12' ? '3' : '2'}.${wizardModules.length + 1}`;
    const hrs = Number(newModuleHours) || 90;
    const hrsSem = wizardHeader.horasSemanalesModulo || 18;
    const sem = Math.ceil(hrs / hrsSem);

    const newMod: ModuleDescriptor = {
      codigo: code,
      nombre: newModuleName.trim(),
      totalHoras: hrs,
      horasSemanales: hrsSem,
      semanas: sem,
      bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
      diaInicio: 19,
      mesInicio: 'enero',
      diaFin: 20,
      mesFin: 'febrero',
      fechaInicio: '19 de enero',
      fechaFin: '20 de febrero',
      unidades: 3,
      competencias: `Competencias técnicas para ${newModuleName.trim()}`,
      totalIndicadores: 8,
    };

    const updated = [...wizardModules, newMod];
    const recalculated = recalculateModuleDatesFromCalendar(updated, wizardMonths, academicPeriods2026);
    setWizardModules(recalculated);
    setNewModuleName('');
    setNewModuleCode('');
  };

  const handleWizardRemoveModule = (code: string) => {
    const updated = wizardModules.filter(m => m.codigo !== code);
    const recalculated = recalculateModuleDatesFromCalendar(updated, wizardMonths, academicPeriods2026);
    setWizardModules(recalculated);
  };

  const handleWizardApplyAll = () => {
    const finalModules = recalculateModuleDatesFromCalendar(wizardModules, wizardMonths, academicPeriods2026);
    onImportData({
      headerData: wizardHeader,
      months: wizardMonths,
      modules: finalModules,
    });
    setSuccessMsg('¡Formulario aplicado exitosamente! Todas las fechas, semanas y días se han sincronizado.');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* Title & Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Centro de Carga y Sincronización de Datos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            3 Métodos para Cargar Calendario y Jornalización
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Elija la forma más cómoda y precisa para incorporar los datos al sistema: mediante el <strong>Lector Inteligente</strong>, llenando la <strong>Plantilla Oficial</strong> o utilizando el <strong>Formulario Asistente Paso a Paso</strong>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          <button
            onClick={onGoToCalendario}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Fechas Institucionales</span>
          </button>
          <button
            onClick={onGoToJornalizacion}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <span>Ver Jornalización</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3 Methods Tabs Selector */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-2">
        
        {/* Method 1 Tab */}
        <button
          onClick={() => setActiveMethod('metodo1_lector')}
          className={`p-4 rounded-xl text-left transition-all flex items-start gap-3 border ${
            activeMethod === 'metodo1_lector'
              ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-transparent hover:bg-slate-50'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
            activeMethod === 'metodo1_lector' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            1
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-700">Método 1</div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Lector Inteligente PDF / Excel</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Analiza documentos oficiales y carga en 1 clic</p>
          </div>
        </button>

        {/* Method 2 Tab */}
        <button
          onClick={() => setActiveMethod('metodo2_plantilla')}
          className={`p-4 rounded-xl text-left transition-all flex items-start gap-3 border ${
            activeMethod === 'metodo2_plantilla'
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-transparent hover:bg-slate-50'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
            activeMethod === 'metodo2_plantilla' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            2
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Método 2</div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Plantilla Excel / CSV</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Descargar formato estructurado, llenar y subir</p>
          </div>
        </button>

        {/* Method 3 Tab */}
        <button
          onClick={() => setActiveMethod('metodo3_formulario')}
          className={`p-4 rounded-xl text-left transition-all flex items-start gap-3 border ${
            activeMethod === 'metodo3_formulario'
              ? 'bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-transparent hover:bg-slate-50'
          }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
            activeMethod === 'metodo3_formulario' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
          }`}>
            3
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-700">Método 3</div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">Formulario / Asistente</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Llenado guiado paso a paso con cálculo automático</p>
          </div>
        </button>

      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3 text-sm shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Error de Procesamiento</div>
            <div className="text-xs text-red-700 mt-0.5">{errorMsg}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-sm shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Operación Exitosa</div>
            <div className="text-xs text-emerald-800 mt-0.5">{successMsg}</div>
          </div>
        </div>
      )}

      {/* METHOD 1: LECTOR INTELIGENTE PDF / EXCEL / JSON */}
      {activeMethod === 'metodo1_lector' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick 1-Click Official Institutional Preset */}
            <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
                    Opción Rápida Recomendada
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Cargar Calendario Oficial Colegio Salesiano San José 2026
                  </h3>
                  <p className="text-xs text-slate-300">
                    Inyecta al 100% todas las fechas de los 4 bimestres, ingresos a TBox, pausas pedagógicas, descansos y cálculo de 40 semanas y 182 días.
                  </p>
                </div>
              </div>

              <button
                onClick={handleLoadOfficialPreset}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shrink-0 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Cargar en 1 Clic</span>
              </button>
            </div>

            {/* Drop Zone Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/70 scale-[1.01]'
                  : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.json"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center p-6 space-y-3">
                  <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                  <p className="font-bold text-slate-800 text-sm">{loadingText}</p>
                  <p className="text-xs text-slate-500">Procesando y extrayendo estructura curricular...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shadow-xs font-bold text-xs">
                      PDF
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs font-bold text-xs">
                      XLSX
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs font-bold text-xs">
                      JSON
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Arrastre su documento PDF o Excel aquí, o haga clic para seleccionar
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mb-4 leading-relaxed">
                    El motor inteligente identificará automáticamente módulos, semanas, horas y periodos institucionales.
                  </p>

                  <span className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all">
                    <UploadCloud className="w-4 h-4" />
                    <span>Examinar Archivos en su Equipo</span>
                  </span>
                </>
              )}
            </div>

            {/* Parsed Preview Card */}
            {parsedResult && (
              <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-5 shadow-md space-y-4 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm uppercase">
                      {parsedResult.fileType}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{parsedResult.fileName}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase">
                          Estructura Identificada
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {parsedResult.summary.modulesCount} Módulos · {parsedResult.summary.totalHours} Horas · {parsedResult.summary.detectedFields.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setParsedResult(null)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs transition-all"
                      title="Descartar archivo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleApplyParsedData}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aplicar al Sistema</span>
                    </button>
                  </div>
                </div>

                {/* Preview Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => setActivePreviewTab('modulos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activePreviewTab === 'modulos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Módulos ({parsedResult.modules?.length || 0})
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('calendario')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activePreviewTab === 'calendario' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Calendario Institucional ({parsedResult.months?.length || months.length} Meses)
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('periodos')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activePreviewTab === 'periodos' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Bimestres y Evaluaciones
                  </button>
                  <button
                    onClick={() => setActivePreviewTab('encabezado')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activePreviewTab === 'encabezado' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Encabezado
                  </button>
                </div>

                {/* Tab Content */}
                {activePreviewTab === 'modulos' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {parsedResult.modules && parsedResult.modules.length > 0 ? (
                      parsedResult.modules.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">{m.codigo}</span>
                            <span className="font-semibold text-slate-800">{m.nombre}</span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="font-bold text-slate-700">{m.totalHoras} hrs</span>
                            <span className="text-slate-500">({m.semanas} sem)</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-xs">
                        No se detectaron módulos con formato estándar. Puede usar el Método 2 (Plantilla) o Método 3 (Formulario).
                      </div>
                    )}
                  </div>
                )}

                {activePreviewTab === 'calendario' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {(parsedResult.months || months).map((m, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                        <div>
                          <strong className="font-bold text-slate-900">{m.name}:</strong>
                          <span className="text-slate-600 ml-2">{m.feriadosDesc || 'Días hábiles regulares'}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold text-slate-700">
                          <span>{m.semanas} sem</span>
                          <span>·</span>
                          <span>{m.dias} días</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'periodos' && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {academicPeriods2026.map((p, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between font-bold text-slate-900">
                          <span>{p.nombre} ({p.inicio} – {p.fin})</span>
                          <span className="text-emerald-700">Boletas: {p.entregaBoletas || 'Por definir'}</span>
                        </div>
                        <div className="text-slate-600 text-[11px]">
                          {p.actividades.map((a) => a.nombre).join(' · ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activePreviewTab === 'encabezado' && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Docente:</span>
                      <strong className="text-slate-900 font-bold">{parsedResult.headerData?.docente || headerData.docente}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Institución:</span>
                      <strong className="text-slate-900 font-bold">{parsedResult.headerData?.institucion || headerData.institucion}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Grado:</span>
                      <strong className="text-slate-900 font-bold">{parsedResult.headerData?.gradoSeccion || headerData.gradoSeccion}</strong>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-slate-500 block">Año Lectivo:</span>
                      <strong className="text-slate-900 font-bold">{parsedResult.headerData?.anoLectivo || headerData.anoLectivo}</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Paste JSON box */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-600" />
                <span>O pegar contenido JSON de respaldo</span>
              </h3>
              <textarea
                rows={3}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{ "headerData": { ... }, "modules": [ ... ], "months": [ ... ] }'
                className="w-full p-3 font-mono text-xs text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden resize-y"
              />
              <div className="flex justify-end mt-3">
                <button
                  onClick={handleApplyPastedJson}
                  disabled={!jsonText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <span>Analizar Texto JSON</span>
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar Status Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Estado Actual en Memoria</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-500">Grado Activo:</span>
                  <strong className="text-slate-900 font-bold">{headerData.gradoSeccion}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-500">Semanas Totales:</span>
                  <strong className="text-blue-700 font-bold">{totalSemanas} Semanas Lectivas</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-500">Días Hábiles:</span>
                  <strong className="text-emerald-700 font-bold">{totalDias} Días</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between">
                  <span className="text-slate-500">Módulos Registrados:</span>
                  <strong className="text-indigo-700 font-bold">{modules.length} Módulos ({totalHoras}h)</strong>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Descargar y Respaldar
              </h4>
              <button
                onClick={handleDownloadJsonBackup}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Download className="w-4 h-4 text-blue-400" />
                <span>Descargar Copia JSON</span>
              </button>
              <button
                onClick={handleDownloadExcelTemplate}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                <span>Descargar Excel Completo</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* METHOD 2: PLANTILLAS OFICIALES EXCEL / CSV */}
      {activeMethod === 'metodo2_plantilla' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            
            <div className="border-b border-slate-100 pb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase mb-2">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Descarga y Carga de Plantilla Oficial</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Paso 1: Descargue la Plantilla Estructurada con el Formato Requerido
              </h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-3xl">
                La plantilla contiene 3 hojas preconfiguradas: <strong>Periodos y Evaluaciones</strong> (con fechas de corte y límites TBox), <strong>Calendario Mes a Mes</strong> (con semanas y días exactos) y <strong>Módulos Curriculares</strong>. Llénela o modifíquela y vuelva a subirla.
              </p>
            </div>

            {/* Download Buttons Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    XLSX
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Plantilla Excel Multi-Hoja</h4>
                  <p className="text-xs text-slate-600">
                    Incluye las 3 hojas con fórmulas, columnas de fechas, días, semanas y bimestres.
                  </p>
                </div>
                <button
                  onClick={handleDownloadExcelTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla Excel (.xlsx)</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-black text-xs">
                    CSV
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Plantilla CSV de Módulos</h4>
                  <p className="text-xs text-slate-600">
                    Formato ligero de texto separado por comas para lista de módulos y horas.
                  </p>
                </div>
                <button
                  onClick={handleDownloadCsvTemplate}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Módulos (.csv)</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                    JSON
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Respaldo Estructurado JSON</h4>
                  <p className="text-xs text-slate-600">
                    Estructura de datos completa y directa para importar sin conversiones.
                  </p>
                </div>
                <button
                  onClick={handleDownloadJsonBackup}
                  className="w-full py-2.5 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Descargar Plantilla JSON</span>
                </button>
              </div>

            </div>

            {/* Upload Filled Template Zone */}
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Paso 2: Suba su Plantilla Llena para Procesar
              </h2>
              <p className="text-xs text-slate-500">
                Arrastre el archivo Excel o CSV que acaba de modificar para que el sistema actualice los cálculos de semanas y días.
              </p>

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => templateInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-400 bg-emerald-50/30 hover:bg-emerald-50/60 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
              >
                <input
                  ref={templateInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <FileSpreadsheet className="w-10 h-10 text-emerald-600 mb-2" />
                <h3 className="text-sm font-bold text-slate-800">
                  Haga clic o arrastre aquí su archivo Excel (.xlsx) lleno
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Se importarán y recalcularán todas las 3 hojas automáticamente.
                </p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* METHOD 3: FORMULARIO INTERACTIVO / ASISTENTE WIZARD */}
      {activeMethod === 'metodo3_formulario' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Wizard Header Progress */}
          <div className="border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold uppercase">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Asistente de Configuración Curricular Paso a Paso</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">
                  Paso {wizardStep} de 4: {
                    wizardStep === 1 ? 'Datos Institucionales y Docente' :
                    wizardStep === 2 ? 'Calendario Mensual, Días Hábiles y Semanas' :
                    wizardStep === 3 ? 'Períodos Bimestrales y Fechas de Evaluación' :
                    wizardStep === 4 ? 'Módulos Curriculares y Distribución de Fechas' :
                    'Auditoría y Confirmación Final'
                  }
                </h2>
              </div>

              {/* Wizard Step Indicator Pills */}
              <div className="flex items-center gap-1.5 text-xs font-bold">
                {[1, 2, 3, 4].map((step) => (
                  <button
                    key={step}
                    onClick={() => setWizardStep(step as any)}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                      wizardStep === step
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : wizardStep > step
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {step}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Indicator Ribbon */}
            <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-500 block">Semanas Calculadas:</span>
                <strong className={`text-sm font-bold ${wizardTotalSemanas === 40 ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {wizardTotalSemanas} Semanas {wizardTotalSemanas === 40 ? '(Exacto 40 sem)' : ''}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Días Hábiles:</span>
                <strong className="text-sm font-bold text-indigo-700">
                  {wizardTotalDias} Días Lectivos
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Horas Totales:</span>
                <strong className="text-sm font-bold text-blue-700">
                  {wizardTotalHoras} Horas ({wizardModules.length} Módulos)
                </strong>
              </div>
            </div>
          </div>

          {/* STEP 1: Datos Institucionales */}
          {wizardStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de la Institución:</label>
                  <input
                    type="text"
                    value={wizardHeader.institucion}
                    onChange={(e) => setWizardHeader({ ...wizardHeader, institucion: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Docente Responsable:</label>
                  <input
                    type="text"
                    value={wizardHeader.docente}
                    onChange={(e) => setWizardHeader({ ...wizardHeader, docente: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grado y Sección:</label>
                  <input
                    type="text"
                    value={wizardHeader.gradoSeccion}
                    onChange={(e) => setWizardHeader({ ...wizardHeader, gradoSeccion: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Horas Semanales del Módulo:</label>
                  <input
                    type="number"
                    value={wizardHeader.horasSemanalesModulo}
                    onChange={(e) => setWizardHeader({ ...wizardHeader, horasSemanalesModulo: Number(e.target.value) || 18 })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Conteo de Semanas y Días por Mes */}
          {wizardStep === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Ajuste el número de semanas laborales y días lectivos de cada mes según el calendario escolar. El sistema calculará el total en tiempo real.
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Mes</th>
                      <th className="p-2.5 w-28">Semanas</th>
                      <th className="p-2.5 w-28">Días Hábiles</th>
                      <th className="p-2.5">Descansos, Pausas y Feriados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {wizardMonths.map((m, idx) => (
                      <tr key={m.month} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900 capitalize">{m.name}</td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min={0}
                            max={6}
                            value={m.semanas}
                            onChange={(e) => {
                              const copy = [...wizardMonths];
                              copy[idx].semanas = Number(e.target.value) || 0;
                              setWizardMonths(copy);
                            }}
                            className="w-20 p-1.5 border border-slate-300 rounded-lg text-center font-bold text-blue-700"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            min={0}
                            max={31}
                            value={m.dias}
                            onChange={(e) => {
                              const copy = [...wizardMonths];
                              copy[idx].dias = Number(e.target.value) || 0;
                              setWizardMonths(copy);
                            }}
                            className="w-20 p-1.5 border border-slate-300 rounded-lg text-center font-bold text-emerald-700"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={m.feriadosDesc}
                            onChange={(e) => {
                              const copy = [...wizardMonths];
                              copy[idx].feriadosDesc = e.target.value;
                              setWizardMonths(copy);
                            }}
                            className="w-full p-1.5 border border-slate-300 rounded-lg text-slate-700"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Bimestres y Evaluaciones */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Los 4 períodos bimestrales oficiales del año 2026 con sus respectivas fechas de corte, ingreso a TBox y entregas de boletas.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {academicPeriods2026.map((p, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900 border-b border-slate-200 pb-2">
                      <span className="text-indigo-700">{p.nombre}</span>
                      <span>{p.inicio} – {p.fin}</span>
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-slate-600">
                        <span>Entrega de Temarios:</span>
                        <strong className="text-slate-800">{p.entregaTemarios || '------------'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Recuperación Ordinaria:</span>
                        <strong className="text-slate-800">{p.recuperacionOrdinaria || '------------'}</strong>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Entrega de Boletas:</span>
                        <strong className="text-emerald-700">{p.entregaBoletas || '------------'}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Módulos Curriculares y Distribución */}
          {wizardStep === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
                <span>
                  Agregue o edite los módulos. El sistema calculará matemáticamente la fecha de inicio, fin y semanas sin dejar huecos ni saltarse días.
                </span>
              </div>

              {/* Add module row */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <input
                    type="text"
                    placeholder="Código (ej. BTVDG2.1)"
                    value={newModuleCode}
                    onChange={(e) => setNewModuleCode(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Nombre del Módulo Curricular"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Horas"
                    value={newModuleHours}
                    onChange={(e) => setNewModuleHours(Number(e.target.value) || 90)}
                    className="w-20 p-2 border border-slate-300 rounded-lg bg-white"
                  />
                  <button
                    onClick={handleWizardAddModule}
                    className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>

              {/* Modules list */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {wizardModules.map((m, idx) => (
                  <div key={m.codigo} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-slate-300">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                        {m.codigo}
                      </span>
                      <div>
                        <strong className="text-slate-900 block">{m.nombre}</strong>
                        <span className="text-slate-500 text-[11px]">
                          {m.fechaInicio} al {m.fechaFin} ({m.semanas} semanas)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                        {m.totalHoras} hrs
                      </span>
                      <button
                        onClick={() => handleWizardRemoveModule(m.codigo)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                        title="Eliminar módulo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {wizardStep > 1 ? (
              <button
                onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Paso Anterior</span>
              </button>
            ) : <div />}

            {wizardStep < 4 ? (
              <button
                onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span>Siguiente Paso</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleWizardApplyAll}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Auditar y Aplicar Todo a la Jornalización</span>
              </button>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
