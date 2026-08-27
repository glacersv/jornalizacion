import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { Sidebar, AppView } from './components/Sidebar';
import { UploadDocumentView } from './components/UploadDocumentView';
import { DocenteGradoView } from './components/DocenteGradoView';
import { GradeSelector } from './components/GradeSelector';
import { PlanificacionDidacticaView } from './components/PlanificacionDidacticaView';
import { GuionDeClaseView } from './components/GuionDeClaseView';
import { Table1SemanasLaborales } from './components/Table1SemanasLaborales';
import { Table2CargaHoraria } from './components/Table2CargaHoraria';
import { Table3MatrizFechas } from './components/Table3MatrizFechas';
import { Table4NominaModulos } from './components/Table4NominaModulos';
import { PrintDocumentArea } from './components/PrintDocumentArea';
import { ModuleDescriptorViewer } from './components/ModuleDescriptorViewer';
import { AcademicCalendarTimeline } from './components/AcademicCalendarTimeline';
import { InstitutionalCalendarPage } from './components/InstitutionalCalendarPage';
import { recalculateModuleDatesFromCalendar } from './utils/fileImportParsers';
import { MarkdownOutputModal } from './components/MarkdownOutputModal';
import { ConfigModal } from './components/ConfigModal';
import { ModuleEditModal } from './components/ModuleEditModal';
import { DataImportExportModal } from './components/DataImportExportModal';
import {
  defaultHeaderData,
  monthsData2026,
  modulesData1stYear,
  modulesData2ndYear,
  modulesData3rdYear,
  academicPeriods2026,
} from './data/jornalizacionData';
import { generateJornalizacionMarkdown } from './utils/markdownGenerator';
import { exportToWordDocument } from './utils/documentExporter';
import { InstitutionalHeader, ModuleDescriptor, MonthStats } from './types';
import {
  Check,
  Copy,
  Download,
  FileText,
  Printer,
  Sparkles,
  Calendar,
  Layers,
  GraduationCap,
  Info,
  Edit2,
  Plus,
  Menu,
  UploadCloud,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';

export default function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<AppView>('jornalizacion');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Current grade level: '10' = 1° Año, '11' = 2° Año, '12' = 3° Año
  const [currentGrade, setCurrentGrade] = useState<'10' | '11' | '12'>('11');

  // Multi-grade datasets in state to preserve edits per grade
  const [gradeDatasets, setGradeDatasets] = useState<Record<'10' | '11' | '12', {
    headerData: InstitutionalHeader;
    months: MonthStats[];
    modules: ModuleDescriptor[];
  }>>({
    '10': {
      headerData: {
        ...defaultHeaderData,
        gradoSeccion: '1° Año Tec. Voc. Diseño Gráfico',
        horasSemanalesModulo: 18,
        anoNivel: '10',
      },
      months: JSON.parse(JSON.stringify(monthsData2026)),
      modules: JSON.parse(JSON.stringify(modulesData1stYear)),
    },
    '11': {
      headerData: {
        ...defaultHeaderData,
        gradoSeccion: '2° Año Tec. Voc. Diseño Gráfico',
        horasSemanalesModulo: 18,
        anoNivel: '11',
      },
      months: JSON.parse(JSON.stringify(monthsData2026)),
      modules: JSON.parse(JSON.stringify(modulesData2ndYear)),
    },
    '12': {
      headerData: {
        ...defaultHeaderData,
        gradoSeccion: '3° Año Tec. Voc. Diseño Gráfico',
        horasSemanalesModulo: 30,
        anoNivel: '12',
      },
      months: JSON.parse(JSON.stringify(monthsData2026)),
      modules: JSON.parse(JSON.stringify(modulesData3rdYear)),
    },
  });

  // Current active data derived from grade
  const currentDataset = gradeDatasets[currentGrade];
  const headerData = currentDataset.headerData;
  const months = currentDataset.months;
  const modules = currentDataset.modules;

  // Edit Mode state for Tables
  const [isEditMode, setIsEditMode] = useState(false);

  // Modals
  const [selectedModuleForEdit, setSelectedModuleForEdit] = useState<ModuleDescriptor | null>(null);
  const [isModuleEditModalOpen, setIsModuleEditModalOpen] = useState(false);

  const [selectedGuionModuleCode, setSelectedGuionModuleCode] = useState<string | undefined>(undefined);

  const [selectedModuleDetail, setSelectedModuleDetail] = useState<ModuleDescriptor | null>(null);
  const [isDescriptorModalOpen, setIsDescriptorModalOpen] = useState(false);

  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Markdown content
  const markdownContent = useMemo(() => {
    return generateJornalizacionMarkdown(headerData, months, modules);
  }, [headerData, months, modules]);

  // Handler: Change Grade
  const handleSelectGrade = (grade: '10' | '11' | '12') => {
    setCurrentGrade(grade);
  };

  // Handler: Update Header (keeps institutional info synced across all grades while preserving grade-specific titles and hours)
  const handleUpdateHeader = (newHeader: InstitutionalHeader) => {
    const targetGrade = (newHeader.anoNivel as '10' | '11' | '12') || currentGrade;
    setGradeDatasets((prev) => {
      const next = { ...prev };
      (['10', '11', '12'] as const).forEach((g) => {
        next[g] = {
          ...next[g],
          headerData: {
            ...next[g].headerData,
            institucion: newHeader.institucion,
            docente: newHeader.docente,
            anoLectivo: newHeader.anoLectivo,
            tituloDocumento: newHeader.tituloDocumento,
            notaEvaluativa: newHeader.notaEvaluativa,
            ...(g === targetGrade
              ? {
                  gradoSeccion: newHeader.gradoSeccion,
                  horasSemanalesModulo: newHeader.horasSemanalesModulo,
                  anoNivel: targetGrade,
                }
              : {}),
          },
        };
      });
      return next;
    });
  };

  // Handler: Update Months (syncs across all grades since dates are general for whole institution)
  const handleUpdateMonths = (newMonths: MonthStats[]) => {
    setGradeDatasets((prev) => {
      const next = { ...prev };
      (['10', '11', '12'] as const).forEach((g) => {
        const recalculatedMods = recalculateModuleDatesFromCalendar(
          next[g].modules,
          newMonths,
          academicPeriods2026
        );
        next[g] = {
          ...next[g],
          months: newMonths,
          modules: recalculatedMods,
        };
      });
      return next;
    });
  };

  // Handler: Recalculate Jornalizacion according to institutional calendar
  const handleRecalculateJornalizacion = () => {
    setGradeDatasets((prev) => {
      const next = { ...prev };
      (['10', '11', '12'] as const).forEach((g) => {
        const recalculatedMods = recalculateModuleDatesFromCalendar(
          next[g].modules,
          next[g].months,
          academicPeriods2026
        );
        next[g] = {
          ...next[g],
          modules: recalculatedMods,
        };
      });
      return next;
    });
  };

  // Handler: Update Modules
  const handleUpdateModules = (newModules: ModuleDescriptor[]) => {
    setGradeDatasets((prev) => ({
      ...prev,
      [currentGrade]: {
        ...prev[currentGrade],
        modules: newModules,
      },
    }));
  };

  // Handler: Update Evaluation Note
  const handleUpdateNota = (newNota: string) => {
    handleUpdateHeader({
      ...headerData,
      notaEvaluativa: newNota,
    });
  };

  // Handler: Save Specific Module from Modal
  const handleSaveModuleModal = (updated: ModuleDescriptor) => {
    const idx = modules.findIndex((m) => m.codigo === updated.codigo);
    if (idx !== -1) {
      const updatedList = [...modules];
      updatedList[idx] = updated;
      handleUpdateModules(updatedList);
    } else {
      handleUpdateModules([...modules, updated]);
    }
  };

  // Handler: Delete Module
  const handleDeleteModule = (code: string) => {
    const filtered = modules.filter((m) => m.codigo !== code);
    handleUpdateModules(filtered);
  };

  // Handler: Update module didactic plan
  const handleUpdateModulePlan = (moduleCode: string, updatedPlan: any) => {
    const updated = modules.map((m) =>
      m.codigo === moduleCode ? { ...m, planDidactico: updatedPlan } : m
    );
    handleUpdateModules(updated);
  };

  // Handler: Add New Module
  const handleAddNewModule = () => {
    const newCode = `BTVDG${currentGrade === '10' ? '1' : currentGrade === '11' ? '2' : '3'}.${modules.length + 1}`;
    const newMod: ModuleDescriptor = {
      codigo: newCode,
      nombre: 'Nuevo Módulo Curricular',
      duracionHoras: headerData.horasSemanalesModulo * 4,
      semanas: 4,
      horasSemanales: headerData.horasSemanalesModulo,
      desarrolloTecnico: 6,
      desarrolloEmprendedor: 6,
      desarrolloHumanoSocial: 6,
      desarrolloAcademicoAplicado: 6,
      totalIndicadores: 24,
      horasPorUnidad: { u1: headerData.horasSemanalesModulo * 4 },
      totalHoras: headerData.horasSemanalesModulo * 4,
      fechaInicio: '01 de septiembre',
      fechaFin: '25 de septiembre',
      mesInicio: 'septiembre',
      diaInicio: 1,
      mesFin: 'septiembre',
      diaFin: 25,
      competenciaGeneral: 'Descripción de la competencia general del módulo.',
      objetivoModulo: 'Objetivo de aprendizaje del módulo.',
    };
    setSelectedModuleForEdit(newMod);
    setIsModuleEditModalOpen(true);
  };

  // Handler: Reset to Defaults
  const handleResetToDefaults = () => {
    const defaultMods =
      currentGrade === '10'
        ? modulesData1stYear
        : currentGrade === '11'
        ? modulesData2ndYear
        : modulesData3rdYear;

    const defaultGradeName =
      currentGrade === '10'
        ? '1° Año Tec. Voc. Diseño Gráfico'
        : currentGrade === '11'
        ? '2° Año Tec. Voc. Diseño Gráfico'
        : '3° Año Tec. Voc. Diseño Gráfico';

    const defaultHours = currentGrade === '12' ? 30 : 18;

    setGradeDatasets((prev) => ({
      ...prev,
      [currentGrade]: {
        headerData: {
          ...defaultHeaderData,
          gradoSeccion: defaultGradeName,
          horasSemanalesModulo: defaultHours,
          anoNivel: currentGrade,
        },
        months: JSON.parse(JSON.stringify(monthsData2026)),
        modules: JSON.parse(JSON.stringify(defaultMods)),
      },
    }));
  };

  // Handler: Import JSON
  const handleImportData = (data: {
    headerData?: InstitutionalHeader;
    months?: MonthStats[];
    modules?: ModuleDescriptor[];
  }) => {
    setGradeDatasets((prev) => ({
      ...prev,
      [currentGrade]: {
        headerData: data.headerData || prev[currentGrade].headerData,
        months: data.months || prev[currentGrade].months,
        modules: data.modules || prev[currentGrade].modules,
      },
    }));
  };

  // Copy Markdown
  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Print
  const handlePrint = () => {
    setActiveView('impresion');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  // Export Word
  const handleExportWord = () => {
    exportToWordDocument(headerData, months, modules);
  };

  // Select module to view descriptor
  const handleOpenModuleDetail = (mod: ModuleDescriptor) => {
    if (isEditMode) {
      setSelectedModuleForEdit(mod);
      setIsModuleEditModalOpen(true);
    } else {
      setSelectedModuleDetail(mod);
      setIsDescriptorModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Lateral Menu (Sidebar with Hamburger) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeView={activeView}
        setActiveView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }}
        headerData={headerData}
        currentGrade={currentGrade}
        onSelectGrade={handleSelectGrade}
        totalModulesCount={modules.length}
      />

      {/* Top Header with Hamburger Button */}
      <Header
        headerData={headerData}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeView={activeView}
        setActiveView={setActiveView}
        onPrint={handlePrint}
        onExportWord={handleExportWord}
        onCopyMarkdown={handleCopyMarkdown}
        copied={copied}
        onOpenConfig={() => setIsConfigModalOpen(true)}
      />

      {/* Quick Navigation Indicator Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="inline-flex items-center gap-1.5 font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>Menú Principal</span>
            </button>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-slate-700">
              {activeView === 'subir-documento' && 'Subir / Cargar Documento'}
              {activeView === 'asignacion' && 'Docente y Selección de Grado'}
              {activeView === 'jornalizacion' && 'Jornalización Anual (4 Tablas Oficiales)'}
              {activeView === 'impresion' && 'Área de Impresión y Descarga Word'}
              {activeView === 'descriptores' && 'Descriptores Curriculares MINED'}
              {activeView === 'calendario' && 'Calendario Escolar'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium hidden sm:inline">Nivel Activo:</span>
            <span className="px-2 py-0.5 rounded font-bold bg-slate-900 text-white text-[11px]">
              {currentGrade === '10' ? '1° Año (10°)' : currentGrade === '11' ? '2° Año (11°)' : '3° Año (12°)'}
            </span>
            <span className="text-slate-500 font-medium hidden md:inline">
              · {modules.length} Módulos ({headerData.horasSemanalesModulo * 40} hrs)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* VIEW 1: Subir Documento / Importar & Exportar */}
        {activeView === 'subir-documento' && (
          <UploadDocumentView
            headerData={headerData}
            months={months}
            modules={modules}
            onImportData={handleImportData}
            onResetToDefaults={handleResetToDefaults}
            onGoToJornalizacion={() => setActiveView('jornalizacion')}
            onGoToCalendario={() => setActiveView('calendario')}
          />
        )}

        {/* VIEW 2: Asignación de Docente, Institución y Grado */}
        {activeView === 'asignacion' && (
          <DocenteGradoView
            headerData={headerData}
            currentGrade={currentGrade}
            onSelectGrade={handleSelectGrade}
            onUpdateHeader={handleUpdateHeader}
            onGoToJornalizacion={() => setActiveView('jornalizacion')}
            modules={modules}
          />
        )}

        {/* VIEW 3: Jornalización Curricular (Tablas Modulares) */}
        {activeView === 'jornalizacion' && (
          <div className="space-y-6">
            
            {/* Grade Selector & Edit Mode Toggle */}
            <div className="no-print">
              <GradeSelector
                currentGrade={currentGrade}
                onSelectGrade={handleSelectGrade}
                isEditMode={isEditMode}
                onToggleEditMode={() => setIsEditMode(!isEditMode)}
              />
            </div>

            {/* Institutional Dates Link Banner */}
            <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-teal-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">
                    Calendario Institucional General Activo
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Las semanas y fechas de inicio/fin de cada módulo se calculan a partir del calendario general institucional.
                  </h3>
                  <p className="text-xs text-slate-300">
                    40 Semanas Lectivas · 182 Días Hábiles · 4 Bimestres Oficiales {headerData.anoLectivo}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleRecalculateJornalizacion}
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Recalcular Fechas</span>
                </button>
                <button
                  onClick={() => setActiveView('calendario')}
                  className="px-3 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ver / Editar Calendario</span>
                </button>
              </div>
            </div>

            {/* Document Header Summary Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 no-print">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="text-center sm:text-left">
                  <div className="text-xs font-black uppercase tracking-widest text-blue-700">
                    {headerData.institucion}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                    {headerData.tituloDocumento}
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Planificación Curricular Anual por Competencias · Formato Oficial MINED El Salvador
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <button
                    onClick={() => setActiveView('asignacion')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Cambiar Docente / Grado</span>
                  </button>

                  <button
                    onClick={() => setActiveView('subir-documento')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-200"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Subir / Cargar Doc.</span>
                  </button>

                  <button
                    id="btn-export-word-banner"
                    onClick={handleExportWord}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar Word</span>
                  </button>
                </div>
              </div>

              {/* Quick Teacher Metas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Docente Responsable:</span>
                  <strong className="text-slate-900 text-sm font-bold">{headerData.docente}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Grado y Especialidad:</span>
                  <strong className="text-slate-900 text-sm font-bold">{headerData.gradoSeccion}</strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-slate-500 font-medium block">Año Escolar / Carga Semanal:</span>
                  <strong className="text-slate-900 text-sm font-bold">
                    {headerData.anoLectivo} &nbsp;|&nbsp; {headerData.horasSemanalesModulo}h / semana
                  </strong>
                </div>
              </div>
            </div>

            {/* Table 2: Carga Horaria y Competencias */}
            <Table2CargaHoraria
              modules={modules}
              isEditMode={isEditMode}
              onUpdateModules={handleUpdateModules}
              onSelectModule={handleOpenModuleDetail}
            />

            {/* Table 3: Matriz de Fechas */}
            <Table3MatrizFechas
              modules={modules}
              isEditMode={isEditMode}
              onUpdateModules={handleUpdateModules}
              onSelectModule={handleOpenModuleDetail}
            />

            {/* Table 4: Nómina de Módulos & Nota Evaluativa */}
            <Table4NominaModulos
              modules={modules}
              notaEvaluativa={headerData.notaEvaluativa}
              isEditMode={isEditMode}
              onUpdateModules={handleUpdateModules}
              onUpdateNota={handleUpdateNota}
              onSelectModule={handleOpenModuleDetail}
              onAddNewModule={handleAddNewModule}
            />
          </div>
        )}

        {/* VIEW: Planificación Didáctica Oficial */}
        {activeView === 'planificacion-didactica' && (
          <PlanificacionDidacticaView
            currentGrade={currentGrade}
            headerData={headerData}
            modules={modules}
            onSelectGrade={handleSelectGrade}
            onUpdateModulePlan={handleUpdateModulePlan}
            onGoToGuion={(code) => {
              setSelectedGuionModuleCode(code);
              setActiveView('guion-clase');
            }}
          />
        )}

        {/* VIEW: Guión de Clases 2026 (Subcronograma por Módulo) */}
        {activeView === 'guion-clase' && (
          <GuionDeClaseView
            modules={modules}
            selectedModuleCode={selectedGuionModuleCode}
            onSelectModuleCode={(code) => setSelectedGuionModuleCode(code)}
            headerData={headerData}
            anoLectivo={headerData.anoLectivo}
          />
        )}

        {/* VIEW 4: Área de Impresión & Exportación */}
        {activeView === 'impresion' && (
          <PrintDocumentArea
            headerData={headerData}
            months={months}
            modules={modules}
            onCopyMarkdown={handleCopyMarkdown}
            copied={copied}
          />
        )}

        {/* VIEW 5: Descriptores MINED Viewer */}
        {activeView === 'descriptores' && (
          <div className="no-print">
            <ModuleDescriptorViewer
              modules={modules}
              selectedModule={selectedModuleDetail}
              onSelectModule={(mod) => setSelectedModuleDetail(mod)}
            />
          </div>
        )}

        {/* VIEW 6: Fechas y Calendario General Institucional (Página Única) */}
        {activeView === 'calendario' && (
          <div className="no-print">
            <InstitutionalCalendarPage
              months={months}
              periods={academicPeriods2026}
              headerData={headerData}
              onUpdateMonths={handleUpdateMonths}
              onRecalculateJornalizacion={handleRecalculateJornalizacion}
              onGoToJornalizacion={() => setActiveView('jornalizacion')}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print">
        <p>
          © {headerData.anoLectivo} {headerData.institucion} · Bachillerato Técnico Vocacional en Diseño Gráfico · Enfoque por Competencias Orientadas a la Acción
        </p>
      </footer>

      {/* Markdown Modal */}
      <MarkdownOutputModal
        markdownText={markdownContent}
        isOpen={isMarkdownModalOpen}
        onClose={() => setIsMarkdownModalOpen(false)}
      />

      {/* Institutional Config Modal */}
      <ConfigModal
        headerData={headerData}
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        onSave={(newData) => handleUpdateHeader(newData)}
      />

      {/* Module Edit Modal */}
      <ModuleEditModal
        module={selectedModuleForEdit}
        isOpen={isModuleEditModalOpen}
        onClose={() => setIsModuleEditModalOpen(false)}
        onSave={handleSaveModuleModal}
        onDelete={handleDeleteModule}
      />

      {/* Data Import / Export Modal */}
      <DataImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        headerData={headerData}
        months={months}
        modules={modules}
        onImportData={handleImportData}
        onResetToDefaults={handleResetToDefaults}
      />

      {/* Descriptor Fullscreen Modal */}
      {isDescriptorModalOpen && selectedModuleDetail && (
        <ModuleDescriptorViewer
          modules={modules}
          selectedModule={selectedModuleDetail}
          onSelectModule={(m) => setSelectedModuleDetail(m)}
          onClose={() => setIsDescriptorModalOpen(false)}
          isModal={true}
        />
      )}
    </div>
  );
}
