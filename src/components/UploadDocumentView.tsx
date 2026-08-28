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
  Eye,
  FileCode,
  Calendar,
  Loader2,
  Trash2,
  Plus,
  Edit3,
  SlidersHorizontal,
  Clock,
  BookOpen,
  Check,
  Clipboard,
  Eraser,
  RefreshCw,
  FileCheck2,
  FolderOpen,
  CalendarDays,
  Award,
} from 'lucide-react';
import { InstitutionalHeader, ModuleDescriptor, MonthStats, AcademicPeriod } from '../types';
import {
  parsePdfFile,
  parseWordFile,
  parseTextFile,
  parseExcelFile,
  parseJsonContent,
  analyzeExtractedText,
  ParsedDocumentResult,
  generateExcelTemplateWorkbook,
  recalculateModuleDatesFromCalendar,
  createEmpty12Months,
  SPANISH_MONTH_NAMES,
} from '../utils/fileImportParsers';
import { academicPeriods2026, monthsData2026, modulesData1stYear, modulesData2ndYear, modulesData3rdYear } from '../data/jornalizacionData';
import saveAs from 'file-saver';
import * as XLSX from 'xlsx';

interface UploadDocumentViewProps {
  headerData: InstitutionalHeader;
  months: MonthStats[];
  modules: ModuleDescriptor[];
  currentGrade?: '10' | '11' | '12';
  onSelectGrade?: (grade: '10' | '11' | '12') => void;
  onImportData: (data: {
    headerData?: InstitutionalHeader;
    months?: MonthStats[];
    modules?: ModuleDescriptor[];
    targetGrade?: '10' | '11' | '12';
  }) => void;
  onResetToDefaults: () => void;
  onRestoreOfficialModules?: () => void;
  onClearData: (allGrades?: boolean) => void;
  onClearDates?: (allGrades?: boolean) => void;
  onClearCalendar?: () => void;
  onRecalculateDates?: () => void;
  onGoToJornalizacion: () => void;
  onGoToCalendario: () => void;
}

export const UploadDocumentView: React.FC<UploadDocumentViewProps> = ({
  headerData,
  months,
  modules,
  currentGrade = '11',
  onSelectGrade,
  onImportData,
  onResetToDefaults,
  onRestoreOfficialModules,
  onClearData,
  onClearDates,
  onClearCalendar,
  onRecalculateDates,
  onGoToJornalizacion,
  onGoToCalendario,
}) => {
  // Method selection tab: 'metodo1_lector' | 'metodo2_plantilla' | 'metodo3_formulario'
  const [activeMethod, setActiveMethod] = useState<'metodo1_lector' | 'metodo2_plantilla' | 'metodo3_formulario'>('metodo1_lector');

  // Input source in Method 1: 'archivo' | 'pegar_texto' | 'json'
  const [method1Source, setMethod1Source] = useState<'archivo' | 'pegar_texto' | 'json'>('archivo');

  // Drag & Drop and Processing State
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [rawPastedText, setRawPastedText] = useState('');
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parsed and Editable Preview State
  const [parsedResult, setParsedResult] = useState<ParsedDocumentResult | null>(null);
  const [editableModules, setEditableModules] = useState<ModuleDescriptor[]>([]);
  const [editableMonths, setEditableMonths] = useState<MonthStats[]>(JSON.parse(JSON.stringify(months)));
  const [editablePeriods, setEditablePeriods] = useState<AcademicPeriod[]>(JSON.parse(JSON.stringify(academicPeriods2026)));
  const [editableHeader, setEditableHeader] = useState<Partial<InstitutionalHeader>>({});
  const [activePreviewTab, setActivePreviewTab] = useState<'modulos' | 'calendario' | 'periodos' | 'encabezado'>('modulos');
  
  // Clear modal confirmation state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearScope, setClearScope] = useState<'current' | 'all' | 'dates_current' | 'dates_all' | 'calendar_zero'>('current');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const previewTotalSemanas = editableMonths.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const previewTotalDias = editableMonths.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  // Synchronize editable states when parsedResult updates
  const updateParsedResult = (result: ParsedDocumentResult) => {
    setParsedResult(result);

    const monthsToUse = (result.months && result.months.length > 0)
      ? JSON.parse(JSON.stringify(result.months))
      : JSON.parse(JSON.stringify(months));
    setEditableMonths(monthsToUse);

    const periodsToUse = (result.periods && result.periods.length > 0)
      ? JSON.parse(JSON.stringify(result.periods))
      : JSON.parse(JSON.stringify(academicPeriods2026));
    setEditablePeriods(periodsToUse);

    if (result.headerData) {
      setEditableHeader(JSON.parse(JSON.stringify(result.headerData)));
    } else {
      setEditableHeader({});
    }

    if (result.modules && result.modules.length > 0) {
      setEditableModules(JSON.parse(JSON.stringify(result.modules)));
      setActivePreviewTab('modulos');
    } else {
      // If the document is a calendar/asuetos file without module list,
      // KEEP existing modules and recalculate their dates to the new calendar!
      const existingToKeep = modules.length > 0
        ? modules
        : (currentGrade === '10' ? modulesData1stYear : currentGrade === '12' ? modulesData3rdYear : modulesData2ndYear);
      const syncedWithNewCalendar = recalculateModuleDatesFromCalendar(existingToKeep, monthsToUse, periodsToUse);
      setEditableModules(syncedWithNewCalendar);
      setActivePreviewTab('calendario');
    }
  };

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setParsedResult(null);
    setEditableModules([]);
    setIsLoading(true);
    const fileNameLower = file.name.toLowerCase();

    try {
      if (fileNameLower.endsWith('.pdf')) {
        setLoadingText('Leyendo y analizando documento PDF con extractor inteligente...');
        const result = await parsePdfFile(file);
        updateParsedResult(result);
        setSuccessMsg(`¡PDF "${file.name}" leído exitosamente! Se identificaron ${result.summary.modulesCount} módulos y ${result.summary.monthsCount} meses de calendario.`);
      } else if (
        fileNameLower.endsWith('.docx') ||
        fileNameLower.endsWith('.doc')
      ) {
        setLoadingText('Extrayendo texto, tablas y calendario de documento Word...');
        const result = await parseWordFile(file);
        updateParsedResult(result);
        setSuccessMsg(`¡Documento Word "${file.name}" procesado con éxito! (${result.summary.modulesCount} módulos encontrados).`);
      } else if (
        fileNameLower.endsWith('.xlsx') ||
        fileNameLower.endsWith('.xls') ||
        fileNameLower.endsWith('.csv')
      ) {
        setLoadingText('Analizando hojas de cálculo Excel, extrayendo calendario de meses, semanas y módulos...');
        const result = await parseExcelFile(file);
        updateParsedResult(result);
        setSuccessMsg(`¡Archivo Excel "${file.name}" analizado con éxito! (${result.summary.modulesCount} módulos y 12 meses de calendario).`);
      } else if (
        fileNameLower.endsWith('.txt') ||
        fileNameLower.endsWith('.md') ||
        fileNameLower.endsWith('.rtf')
      ) {
        setLoadingText('Analizando texto, semanas y estructura curricular...');
        const result = await parseTextFile(file);
        updateParsedResult(result);
        setSuccessMsg(`¡Archivo de texto "${file.name}" analizado con éxito!`);
      } else if (fileNameLower.endsWith('.json')) {
        setLoadingText('Leyendo archivo de respaldo JSON...');
        const text = await file.text();
        const result = parseJsonContent(text, file.name, file.size);
        updateParsedResult(result);
        setSuccessMsg(`¡Archivo JSON "${file.name}" validado correctamente!`);
      } else {
        setErrorMsg('Formato no soportado. Suba un archivo Excel (.xlsx/.xls/.csv), Word (.docx/.doc), PDF (.pdf), Texto (.txt) o JSON (.json).');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMsg(`Error al procesar el archivo: ${err?.message || 'Verifique que el archivo no esté dañado ni protegido.'}`);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  const handleProcessPastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMsg('Por favor pegue algún texto o tabla en el área de texto.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);
    setLoadingText('Analizando contenido de texto pegado...');

    try {
      const result = analyzeExtractedText(
        'texto-portapapeles.txt',
        rawPastedText.length,
        rawPastedText,
        'text'
      );
      updateParsedResult(result);
      if (result.summary.modulesCount > 0) {
        setSuccessMsg(`¡Se detectaron ${result.summary.modulesCount} módulos curriculares en el texto pegado!`);
      } else {
        setSuccessMsg('Texto analizado. Puede verificar las tablas de módulos o calendario abajo.');
      }
    } catch (err: any) {
      setErrorMsg(`Error al analizar el texto: ${err?.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyParsedData = () => {
    if (!parsedResult && editableModules.length === 0 && editableMonths.length === 0) return;

    const newHeader: InstitutionalHeader = {
      ...headerData,
      ...(editableHeader || {}),
    };

    // Sanitize any accidentally long texts in header
    if (newHeader.institucion && (newHeader.institucion.length > 60 || /calendario|asamblea|distribuci|periodo|evaluaci/i.test(newHeader.institucion))) {
      newHeader.institucion = 'Colegio Salesiano San José - Santa Ana';
    }
    if (newHeader.gradoSeccion && (newHeader.gradoSeccion.length > 50 || /calendario|asamblea|distribuci|periodo|evaluaci|padres|salones/i.test(newHeader.gradoSeccion))) {
      newHeader.gradoSeccion = currentGrade === '10' ? '1° Año Tec. Voc. Diseño Gráfico' : currentGrade === '12' ? '3° Año Tec. Voc. Diseño Gráfico' : '2° Año Tec. Voc. Diseño Gráfico';
    }

    const modsToCalculate = editableModules.length > 0
      ? editableModules
      : (modules.length > 0 ? modules : (currentGrade === '10' ? modulesData1stYear : currentGrade === '12' ? modulesData3rdYear : modulesData2ndYear));

    const finalModules = recalculateModuleDatesFromCalendar(
      modsToCalculate,
      editableMonths,
      editablePeriods
    );

    onImportData({
      headerData: newHeader,
      modules: finalModules,
      months: editableMonths,
      targetGrade: parsedResult?.detectedGrade,
    });

    setSuccessMsg(`¡Se sincronizaron exitosamente ${finalModules.length} módulos y el Calendario Anual (${previewTotalSemanas} sem, ${previewTotalDias} días) con el sistema!`);
  };

  const handleClearConfirmed = () => {
    if (clearScope === 'calendar_zero') {
      if (onClearCalendar) {
        onClearCalendar();
      } else {
        onImportData({
          months: createEmpty12Months(),
        });
      }
      setShowClearConfirm(false);
      setSuccessMsg('¡Se ha vaciado el Calendario Anual a 0 Semanas y 0 Días para todos los meses! Listo para recibir nuevas fechas.');
      return;
    }

    if (clearScope === 'dates_current' || clearScope === 'dates_all') {
      if (onClearDates) {
        onClearDates(clearScope === 'dates_all');
      }
      setShowClearConfirm(false);
      setSuccessMsg(
        clearScope === 'dates_all'
          ? '¡Se han limpiado las fechas de inicio, fin y bimestres de todos los grados! Los módulos y horas se mantienen intactos.'
          : `¡Se han limpiado las fechas de los módulos de ${headerData.gradoSeccion}! Puede asignar nuevas fechas o recalcularlas automáticamente.`
      );
      return;
    }

    onClearData(clearScope === 'all');
    setParsedResult(null);
    setEditableModules([]);
    setShowClearConfirm(false);
    setSuccessMsg(
      clearScope === 'all'
        ? '¡Se han limpiado todos los datos de 1°, 2° y 3° Año! El sistema está en blanco listo para recibir sus archivos.'
        : `¡Se han limpiado los módulos de ${headerData.gradoSeccion}! El espacio está listo para cargar nuevos módulos.`
    );
  };

  const handleLoadOfficialPreset = () => {
    onImportData({
      headerData: {
        ...headerData,
        institucion: 'Colegio Salesiano San José - Santa Ana',
        anoLectivo: '2026',
      },
      months: JSON.parse(JSON.stringify(monthsData2026)),
      modules: JSON.parse(
        JSON.stringify(
          currentGrade === '10'
            ? modulesData1stYear
            : currentGrade === '12'
            ? modulesData3rdYear
            : modulesData2ndYear
        )
      ),
    });
    setSuccessMsg('¡Calendario Oficial y Jornalización 2026 del Colegio Salesiano San José cargados al 100%!');
  };

  const handleApplyPastedJson = () => {
    if (!jsonText.trim()) {
      setErrorMsg('Por favor pegue el contenido JSON en el área de texto.');
      return;
    }
    try {
      const result = parseJsonContent(jsonText, 'texto-pegado.json');
      updateParsedResult(result);
      setSuccessMsg('¡Texto JSON procesado correctamente!');
    } catch (err) {
      setErrorMsg('Error de sintaxis en el JSON proporcionado. Verifique llaves y comillas.');
    }
  };

  const handleDownloadExcelTemplate = () => {
    const wb = generateExcelTemplateWorkbook(headerData, months, modules);
    XLSX.writeFile(
      wb,
      `Plantilla_Oficial_Jornalizacion_${headerData.gradoSeccion.replace(/[^a-zA-Z0-9]/g, '_')}_2026.xlsx`
    );
    setSuccessMsg('Plantilla Excel descargada con 3 hojas: Periodos/Evaluaciones, Calendario/Días y Módulos.');
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

  // Editable Module Handlers
  const handleUpdateEditableModule = (index: number, field: keyof ModuleDescriptor, value: any) => {
    const next = [...editableModules];
    const item = { ...next[index], [field]: value };
    if (field === 'totalHoras') {
      const hrs = Number(value) || 90;
      item.totalHoras = hrs;
      item.semanas = Math.ceil(hrs / (item.horasSemanales || 18));
    }
    next[index] = item;
    setEditableModules(next);
  };

  const handleAddEditableModule = () => {
    const num = editableModules.length + 1;
    const newMod: ModuleDescriptor = {
      codigo: `Módulo ${num}`,
      nombre: `Nuevo Módulo ${num}`,
      totalHoras: 90,
      duracionHoras: 90,
      horasSemanales: 18,
      semanas: 5,
      desarrolloTecnico: 2,
      desarrolloEmprendedor: 2,
      desarrolloHumanoSocial: 2,
      desarrolloAcademicoAplicado: 2,
      totalIndicadores: 8,
      horasPorUnidad: { u1: 90, u2: 0, u3: 0, u4: 0 },
      bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
      diaInicio: 19,
      mesInicio: 'enero',
      diaFin: 20,
      mesFin: 'febrero',
      fechaInicio: '19 de enero',
      fechaFin: '20 de febrero',
      unidades: 3,
      competencias: `Competencias técnicas y pedagógicas para Nuevo Módulo ${num}`,
    };
    setEditableModules([...editableModules, newMod]);
  };

  const handleDeleteEditableModule = (index: number) => {
    const next = editableModules.filter((_, i) => i !== index);
    setEditableModules(next);
  };

  // Editable Month Handlers
  const handleUpdateEditableMonth = (index: number, field: 'semanas' | 'dias' | 'feriadosDesc', val: any) => {
    const next = [...editableMonths];
    if (field === 'semanas' || field === 'dias') {
      next[index] = { ...next[index], [field]: Math.max(0, Number(val) || 0) };
    } else {
      next[index] = { ...next[index], [field]: String(val) };
    }
    setEditableMonths(next);
  };

  // Wizard Step Module Add
  const handleWizardAddModule = () => {
    if (!newModuleName.trim()) return;
    const code =
      newModuleCode.trim() ||
      `BTVDG${wizardHeader.anoNivel === '10' ? '1' : wizardHeader.anoNivel === '12' ? '3' : '2'}.${wizardModules.length + 1}`;
    const hrs = Number(newModuleHours) || 90;
    const hrsSem = wizardHeader.horasSemanalesModulo || 18;
    const sem = Math.ceil(hrs / hrsSem);

    const newMod: ModuleDescriptor = {
      codigo: code,
      nombre: newModuleName.trim(),
      totalHoras: hrs,
      duracionHoras: hrs,
      horasSemanales: hrsSem,
      semanas: sem,
      desarrolloTecnico: 2,
      desarrolloEmprendedor: 2,
      desarrolloHumanoSocial: 2,
      desarrolloAcademicoAplicado: 2,
      totalIndicadores: 8,
      horasPorUnidad: { u1: hrs, u2: 0, u3: 0, u4: 0 },
      bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
      diaInicio: 19,
      mesInicio: 'enero',
      diaFin: 20,
      mesFin: 'febrero',
      fechaInicio: '19 de enero',
      fechaFin: '20 de febrero',
      unidades: 3,
      competencias: `Competencias técnicas para ${newModuleName.trim()}`,
    };

    const updated = [...wizardModules, newMod];
    const recalculated = recalculateModuleDatesFromCalendar(updated, wizardMonths, academicPeriods2026);
    setWizardModules(recalculated);
    setNewModuleName('');
    setNewModuleCode('');
  };

  const handleWizardRemoveModule = (code: string) => {
    const updated = wizardModules.filter((m) => m.codigo !== code);
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
    <div className="space-y-6 w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      
      {/* Title & Introduction */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Módulo Universal de Importación y Limpieza</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Cargar y Sincronizar Calendario y Módulos
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Suba sus archivos locales de <strong>Excel (.xlsx), Word (.docx) o PDF</strong>. El lector inteligente extrae los 12 meses de calendario, semanas, días hábiles, descansos y los módulos con sus horas.
          </p>
        </div>

        <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
          <button
            onClick={onGoToJornalizacion}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <span>Ver Jornalización</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onGoToCalendario}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 transition-all"
          >
            <Calendar className="w-4 h-4 text-teal-400" />
            <span>Ver Calendario</span>
          </button>
        </div>
      </div>

      {/* CALENDAR RESET CARD: Vaciar Calendario */}
      <div className="bg-white rounded-2xl border border-purple-200/80 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Vaciar Calendario Anual (12 Meses)
              </h2>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold">
                {totalSemanas} sem · {totalDias} días
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Pone todas las semanas y días a 0 para que pueda cargar un calendario nuevo con sus fechas y asuetos desde su archivo Excel, Word o PDF.
            </p>
          </div>
        </div>

        <button
          id="btn-limpiar-calendario-cero"
          onClick={() => {
            setClearScope('calendar_zero');
            setShowClearConfirm(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm shrink-0"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Vaciar Calendario</span>
        </button>
      </div>

      {/* MODAL: Confirmation for Clearing Calendar */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto bg-purple-100 text-purple-600">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">
                ¿Vaciar Calendario Anual a 0 Semanas y 0 Días?
              </h3>
              <p className="text-xs text-slate-600">
                Todos los 12 meses quedarán en 0 semanas y 0 días lectivos. Podrá cargar las nuevas fechas y asuetos directamente desde su archivo local.
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-[11px] text-purple-900">
              💡 <strong>Nota:</strong> Los módulos curriculares y sus horas no se borrarán; solo se vacían los días y semanas del calendario anual.
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearConfirmed}
                className="py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-all bg-purple-600 hover:bg-purple-500"
              >
                Confirmar y Vaciar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Alerts */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Ocurrió un error</h4>
            <p className="mt-0.5">{errorMsg}</p>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-sm">Operación Exitosa</h4>
            <p className="mt-0.5">{successMsg}</p>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 text-xs font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Main Method Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => setActiveMethod('metodo1_lector')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3.5 ${
            activeMethod === 'metodo1_lector'
              ? 'bg-white border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white/80 border-slate-200 hover:bg-white text-slate-600'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeMethod === 'metodo1_lector' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700">Método 1</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded-full">Recomendado</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-0.5">Lector Inteligente</h3>
            <p className="text-xs text-slate-500 mt-0.5">Excel, Word o PDF con calendario y módulos</p>
          </div>
        </button>

        <button
          onClick={() => setActiveMethod('metodo2_plantilla')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3.5 ${
            activeMethod === 'metodo2_plantilla'
              ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white/80 border-slate-200 hover:bg-white text-slate-600'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeMethod === 'metodo2_plantilla' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-700">Método 2</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-0.5">Plantilla Excel Oficial</h3>
            <p className="text-xs text-slate-500 mt-0.5">Descargue la plantilla de 3 hojas y súbala</p>
          </div>
        </button>

        <button
          onClick={() => setActiveMethod('metodo3_formulario')}
          className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex items-start gap-3.5 ${
            activeMethod === 'metodo3_formulario'
              ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
              : 'bg-white/80 border-slate-200 hover:bg-white text-slate-600'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${activeMethod === 'metodo3_formulario' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700">Método 3</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-0.5">Asistente Paso a Paso</h3>
            <p className="text-xs text-slate-500 mt-0.5">Formulario guiado para configurar fechas y módulos</p>
          </div>
        </button>
      </div>

      {/* METHOD 1: SMART READER (FILES, CLIPBOARD OR JSON) */}
      {activeMethod === 'metodo1_lector' && (
        <div className="space-y-6 w-full">
          <div className="space-y-6 w-full">
            
            {/* Sub-tab selectors for Method 1 */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-xl w-fit">
              <button
                onClick={() => setMethod1Source('archivo')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method1Source === 'archivo' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Subir Archivo Local</span>
              </button>

              <button
                onClick={() => setMethod1Source('pegar_texto')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method1Source === 'pegar_texto' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-3.5 h-3.5" />
                <span>Pegar Texto o Tabla</span>
              </button>

              <button
                onClick={() => setMethod1Source('json')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  method1Source === 'json' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON / Respaldo</span>
              </button>
            </div>

            {/* Sub-Tab 1: File Drag & Drop */}
            {method1Source === 'archivo' && (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all bg-white relative overflow-hidden ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.docx,.doc,.pdf,.txt,.json"
                  className="hidden"
                  onChange={handleFileInputChange}
                />

                <div className="flex flex-col items-center justify-center">
                  {isLoading ? (
                    <div className="space-y-3 py-6">
                      <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                      <p className="text-xs font-bold text-slate-700">{loadingText}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-inner">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-base font-black text-slate-900 mb-1">
                        Arrastre y suelte su archivo aquí o haga clic para buscar
                      </h3>
                      <p className="text-xs text-slate-500 max-w-xl mb-4 leading-relaxed">
                        Detecta automáticamente hojas de <strong>Calendario Anual (12 Meses, Semanas y Días)</strong>, <strong>Bimestres</strong> y <strong>Módulos Curriculares</strong> desde Excel, Word o PDF.
                      </p>

                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                          Excel (.xlsx, .xls)
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-bold">
                          Word (.docx, .doc)
                        </span>
                        <span className="px-2.5 py-1 rounded-md bg-red-50 text-red-800 border border-red-200 text-[11px] font-bold">
                          PDF (.pdf)
                        </span>
                      </div>

                      <span className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all">
                        <UploadCloud className="w-4 h-4" />
                        <span>Seleccionar Archivo de su Computadora</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Sub-Tab 2: Paste Copied Text or Table */}
            {method1Source === 'pegar_texto' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Clipboard className="w-4 h-4 text-blue-600" />
                    <span>Pegar Texto o Tabla Copiada</span>
                  </h3>
                  <span className="text-xs text-slate-500">Word, PDF, Web o Excel</span>
                </div>
                <textarea
                  rows={6}
                  value={rawPastedText}
                  onChange={(e) => setRawPastedText(e.target.value)}
                  placeholder={`Ejemplo de texto o tabla copiada:\n\nDocente: Lic. Mario Gómez\nInstitución: Colegio Salesiano San José\nGrado: 2° Año Diseño Gráfico\n\nEnero: 2 semanas, 10 días\nFebrero: 4 semanas, 18 días\n\nMódulo 1: Elaboración de bocetos y prototipos (90 horas)\nMódulo 2: Edición digital de imágenes y vectores (90 horas)\nMódulo 3: Maquetación y diseño editorial (90 horas)\nMódulo 4: Proyecto integrador de identidad visual (90 horas)`}
                  className="w-full p-3 font-sans text-xs text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-hidden resize-y"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-500">
                    {rawPastedText.length} caracteres escritos
                  </span>
                  <button
                    onClick={handleProcessPastedText}
                    disabled={!rawPastedText.trim() || isLoading}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-xs"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Analizar y Extraer Módulos y Calendario</span>
                  </button>
                </div>
              </div>
            )}

            {/* Sub-Tab 3: Paste JSON */}
            {method1Source === 'json' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Pegar Respaldo JSON Completo</span>
                </h3>
                <textarea
                  rows={6}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder='{ "headerData": { ... }, "modules": [ ... ], "months": [ ... ] }'
                  className="w-full p-3 font-mono text-xs text-slate-800 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-hidden resize-y"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleApplyPastedJson}
                    disabled={!jsonText.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                  >
                    <span>Analizar JSON</span>
                  </button>
                </div>
              </div>
            )}

            {/* INTERACTIVE EDITABLE PREVIEW OF RECOGNIZED DATA */}
            {(parsedResult || editableModules.length > 0) && (
              <div className="bg-white rounded-2xl border-2 border-blue-500/80 p-5 sm:p-7 shadow-lg space-y-5 animate-in fade-in w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-sm uppercase shadow-xs">
                      {parsedResult?.fileType || 'DATA'}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>{parsedResult?.fileName || 'Datos Reconocidos'}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold uppercase">
                          {editableModules.length} Módulos · {editableMonths.length} Meses
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {editableModules.reduce((a, b) => a + (Number(b.totalHoras) || 0), 0)} Horas Totales · {previewTotalSemanas} Semanas · {previewTotalDias} Días Hábiles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setParsedResult(null);
                        setEditableModules([]);
                      }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs transition-all"
                      title="Descartar vista previa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      id="btn-aplicar-datos-reconocidos"
                      onClick={handleApplyParsedData}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aplicar Todo al Sistema</span>
                    </button>
                  </div>
                </div>

                {/* Preview Tabs: Modules, Calendar, Periods, Header */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                  <button
                    onClick={() => setActivePreviewTab('modulos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activePreviewTab === 'modulos'
                        ? 'bg-blue-100 text-blue-800 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Módulos Curriculares ({editableModules.length})</span>
                  </button>

                  <button
                    onClick={() => setActivePreviewTab('calendario')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activePreviewTab === 'calendario'
                        ? 'bg-purple-100 text-purple-800 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Calendario Anual ({previewTotalSemanas} sem · {previewTotalDias} días)</span>
                  </button>

                  <button
                    onClick={() => setActivePreviewTab('periodos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      activePreviewTab === 'periodos'
                        ? 'bg-teal-100 text-teal-800 shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Bimestres y Fechas TBox</span>
                  </button>
                </div>

                {/* TAB 1: EDITABLE MODULES TABLE */}
                {activePreviewTab === 'modulos' && (
                  <div className="space-y-3">
                    {parsedResult && (!parsedResult.modules || parsedResult.modules.length === 0) && (
                      <div className="p-3.5 bg-blue-50/90 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <span className="font-bold block">Documento de Calendario Escolar Reconocido</span>
                          <p className="text-[11px] text-blue-800 leading-relaxed">
                            Se detectaron las <strong>{previewTotalSemanas} semanas</strong> y <strong>{previewTotalDias} días hábiles</strong> del año escolar. Se mantienen los <strong>{editableModules.length} módulos curriculares oficiales</strong> de este grado y sus fechas probables de inicio y fin han sido adaptadas automáticamente a este calendario.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Módulos Curriculares ({editableModules.length}):
                      </span>
                      <div className="flex items-center gap-2">
                        {onRestoreOfficialModules && (
                          <button
                            onClick={onRestoreOfficialModules}
                            className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 border border-indigo-200 transition-colors"
                            title="Restaurar los 27 módulos oficiales de Bachillerato en Diseño Gráfico"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurar 27 Módulos MINED</span>
                          </button>
                        )}
                        <button
                          onClick={handleAddEditableModule}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 border border-blue-200 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Fila</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {editableModules.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-1 w-full">
                            <input
                              type="text"
                              value={m.codigo}
                              onChange={(e) => handleUpdateEditableModule(idx, 'codigo', e.target.value)}
                              className="w-28 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-700 text-xs"
                              placeholder="Código"
                            />
                            <input
                              type="text"
                              value={m.nombre}
                              onChange={(e) => handleUpdateEditableModule(idx, 'nombre', e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 text-xs"
                              placeholder="Nombre del Módulo"
                            />
                          </div>
                          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={m.totalHoras}
                                onChange={(e) => handleUpdateEditableModule(idx, 'totalHoras', Number(e.target.value))}
                                className="w-20 px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 text-xs text-right"
                              />
                              <span className="text-slate-500 font-bold">hrs</span>
                            </div>
                            <span className="text-slate-600 font-medium whitespace-nowrap">({m.semanas} sem)</span>
                            <button
                              onClick={() => handleDeleteEditableModule(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 2: EDITABLE ANNUAL CALENDAR MONTHS (SEMANAS Y DÍAS) */}
                {activePreviewTab === 'calendario' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Semanas y Días Hábiles por Mes (12 Meses):
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200">
                          Total: {previewTotalSemanas} Semanas
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          Total: {previewTotalDias} Días Hábiles
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5">
                      {editableMonths.map((m, idx) => (
                        <div key={m.month} className="p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-xs space-y-2 hover:border-purple-300 hover:bg-purple-50/20 transition-all shadow-2xs">
                          <div className="font-bold text-slate-900 capitalize flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                            <span className="text-xs">{m.name}</span>
                            <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Semanas:</label>
                              <input
                                type="number"
                                min={0}
                                max={6}
                                value={m.semanas}
                                onChange={(e) => handleUpdateEditableMonth(idx, 'semanas', e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-700 text-xs text-center focus:ring-2 focus:ring-blue-400 outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Días:</label>
                              <input
                                type="number"
                                min={0}
                                max={31}
                                value={m.dias}
                                onChange={(e) => handleUpdateEditableMonth(idx, 'dias', e.target.value)}
                                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-emerald-700 text-xs text-center focus:ring-2 focus:ring-emerald-400 outline-hidden"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* TAB 3: ACADEMIC PERIODS / BIMESTRES */}
                {activePreviewTab === 'periodos' && (
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Períodos Académicos / Bimestres y Cierre TBox:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                      {editablePeriods.map((p, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-700">{p.nombre}</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">10 Semanas</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Fechas:</strong> {p.inicio} al {p.fin}
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <strong>Subida Notas TBox:</strong> {p.ingresoTBoxFinal || 'Conforme a calendario'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-emerald-900 text-center sm:text-left">
                    ✓ Todo listo. Al hacer clic en "Aplicar Todo al Sistema", las fechas de inicio, fin y semanas se calcularán automáticamente con el calendario.
                  </span>
                  <button
                    onClick={handleApplyParsedData}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shrink-0 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aplicar Todo Ahora</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Bottom Status Info and Downloads Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Estado Actual en Memoria</span>
                <span className={`w-2.5 h-2.5 rounded-full ${modules.length > 0 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Grado Activo:</span>
                  <strong className="text-slate-900 font-bold block truncate">{headerData.gradoSeccion}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Semanas:</span>
                  <strong className="text-blue-700 font-bold block">{totalSemanas} Semanas</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Días Hábiles:</span>
                  <strong className="text-emerald-700 font-bold block">{totalDias} Días</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <span className="text-slate-500 block text-[11px]">Módulos:</span>
                  <strong className={`font-bold block ${modules.length > 0 ? 'text-indigo-700' : 'text-amber-700'}`}>
                    {modules.length} Módulos ({totalHoras}h)
                  </strong>
                </div>
              </div>

              {modules.length === 0 && onRestoreOfficialModules && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in">
                  <span className="font-semibold">⚠️ 0 Módulos en memoria. Puede restaurar la malla curricular oficial completa de Diseño Gráfico.</span>
                  <button
                    onClick={onRestoreOfficialModules}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cargar 27 Módulos Oficiales</span>
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Descargar y Respaldar
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadJsonBackup}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Descargar Copia JSON</span>
                </button>
                <button
                  onClick={handleDownloadExcelTemplate}
                  className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                  <span>Descargar Excel Completo</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* METHOD 2: PLANTILLAS OFICIALES EXCEL / CSV */}
      {activeMethod === 'metodo2_plantilla' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-800">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <h3 className="text-base font-black text-slate-900">
                  Plantilla Oficial de Jornalización y Calendario 2026
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Descargue la plantilla de Excel preconfigurada con las 3 hojas oficiales del MINED y Colegio Salesiano San José:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <strong className="text-indigo-700 block mb-1">Hoja 1: Periodos y Evaluaciones</strong>
                    <span>4 Bimestres, fechas de inicio y fin, semanas y fechas límites para notas en TBox.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <strong className="text-blue-700 block mb-1">Hoja 2: Calendario y Días Hábiles</strong>
                    <span>Distribución de los 12 meses con semanas laborales, días lectivos y asuetos.</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <strong className="text-emerald-700 block mb-1">Hoja 3: Módulos Curriculares</strong>
                    <span>Códigos, nombres, horas totales, horas semanales y competencias formativas.</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={handleDownloadExcelTemplate}
                className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Plantilla Oficial Excel (.xlsx)</span>
              </button>

              <button
                onClick={() => {
                  setActiveMethod('metodo1_lector');
                  setMethod1Source('archivo');
                }}
                className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all"
              >
                <span>Subir Plantilla Diligenciada</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* METHOD 3: INTERACTIVE WIZARD FORM */}
      {activeMethod === 'metodo3_formulario' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-600">Paso {wizardStep} de 3</span>
              <h3 className="text-base font-black text-slate-900">
                {wizardStep === 1 && '1. Datos de Institución y Grado'}
                {wizardStep === 2 && '2. Calendario de Semanas y Días Hábiles'}
                {wizardStep === 3 && '3. Lista de Módulos Curriculares y Horas'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {wizardStep > 1 && (
                <button
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Anterior
                </button>
              )}
              {wizardStep < 3 ? (
                <button
                  onClick={() => setWizardStep((prev) => (prev + 1) as any)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1"
                >
                  <span>Siguiente</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleWizardApplyAll}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-md"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guardar y Aplicar Todo</span>
                </button>
              )}
            </div>
          </div>

          {/* STEP 1: Institutional Header */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nombre de la Institución:</label>
                <input
                  type="text"
                  value={wizardHeader.institucion}
                  onChange={(e) => setWizardHeader({ ...wizardHeader, institucion: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Docente Responsable:</label>
                <input
                  type="text"
                  value={wizardHeader.docente}
                  onChange={(e) => setWizardHeader({ ...wizardHeader, docente: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Grado y Sección:</label>
                <input
                  type="text"
                  value={wizardHeader.gradoSeccion}
                  onChange={(e) => setWizardHeader({ ...wizardHeader, gradoSeccion: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Año Lectivo:</label>
                <input
                  type="text"
                  value={wizardHeader.anoLectivo}
                  onChange={(e) => setWizardHeader({ ...wizardHeader, anoLectivo: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Calendar Months */}
          {wizardStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Ajuste de Semanas y Días por Mes:</span>
                <span className="text-blue-700 font-bold">
                  Total: {wizardMonths.reduce((a, b) => a + (Number(b.semanas) || 0), 0)} Semanas · {wizardMonths.reduce((a, b) => a + (Number(b.dias) || 0), 0)} Días
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                {wizardMonths.map((m, idx) => (
                  <div key={m.month} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="font-bold text-slate-900 capitalize">{m.name}</div>
                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Sem:</span>
                        <input
                          type="number"
                          value={m.semanas}
                          onChange={(e) => {
                            const next = [...wizardMonths];
                            next[idx].semanas = Number(e.target.value) || 0;
                            setWizardMonths(next);
                          }}
                          className="w-full p-1 bg-white border border-slate-300 rounded text-center font-bold text-blue-700"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-semibold">Días:</span>
                        <input
                          type="number"
                          value={m.dias}
                          onChange={(e) => {
                            const next = [...wizardMonths];
                            next[idx].dias = Number(e.target.value) || 0;
                            setWizardMonths(next);
                          }}
                          className="w-full p-1 bg-white border border-slate-300 rounded text-center font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Modules List */}
          {wizardStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase">Agregar Módulo Curricular</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                  <input
                    type="text"
                    value={newModuleCode}
                    onChange={(e) => setNewModuleCode(e.target.value)}
                    placeholder="Código (ej. BTVDG2.1)"
                    className="p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={newModuleName}
                    onChange={(e) => setNewModuleName(e.target.value)}
                    placeholder="Nombre del Módulo"
                    className="sm:col-span-2 p-2 bg-white border border-slate-300 rounded-lg"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={newModuleHours}
                      onChange={(e) => setNewModuleHours(Number(e.target.value))}
                      placeholder="Horas"
                      className="w-20 p-2 bg-white border border-slate-300 rounded-lg text-center"
                    />
                    <button
                      onClick={handleWizardAddModule}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">
                  Módulos Registrados ({wizardModules.length}):
                </h4>
                {wizardModules.map((m, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-blue-700">{m.codigo}</span>
                      <span className="font-semibold text-slate-800">{m.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-slate-700">{m.totalHoras} hrs</span>
                      <span className="text-slate-500">({m.semanas} sem)</span>
                      <button
                        onClick={() => handleWizardRemoveModule(m.codigo)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
