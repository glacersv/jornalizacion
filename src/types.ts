export type SuspensionCategory = 'pausa' | 'feriado' | 'institucional' | 'suspension' | 'evaluacion';

export interface SuspensionEvent {
  id: string;
  dia: string; // e.g. "23 feb", "19 mar", "01-05 abr"
  mes: string; // e.g. "enero", "febrero", etc.
  actividad: string; // e.g. "Pausa Pedagógica #1", "San José / Sport Fest"
  tipo: SuspensionCategory;
  diasHabilesAfectados?: number;
}

export interface MonthStats {
  month: string;
  name: string;
  semanas: number;
  dias: number;
  feriadosDesc: string;
  eventos?: SuspensionEvent[];
}

export interface DidacticEvaluationActivity {
  no: number;
  etapa?: string; // e.g. 'Etapa 1: Informarse', 'Etapa 2: Planificar', 'Etapa 3: Decidir', 'Etapa 4: Ejecutar', 'Etapa 5: Controlar', 'Etapa 6: Valorar'
  tiempo?: string; // e.g. '10% tiempo', '25% tiempo', '20% tiempo'
  fase?: string;  // e.g. 'FPP (25%)', 'FEP (50%)', 'FVP (25%)'
  actividad: string;
  evidencia?: string;
  ponderacion: string; // e.g. 'FPP (10%)', 'FEP (35%)', 'FVP (25%)'
  fecha: string;
}

export interface DidacticPlan {
  trimestrePeriodo?: string;
  competenciasUnidad?: string;
  conceptuales: string[];
  procedimentales: string[];
  actitudinales: string[];
  metodologia?: string;
  indicadoresTexto?: string;
  actividades: DidacticEvaluationActivity[];
  recursos: string;
  tic: string;
  bibliografia: string[];
}

export interface ModuleDescriptor {
  codigo: string;
  nombre: string;
  duracionHoras?: number;
  semanas: number;
  horasSemanales: number;
  desarrolloTecnico?: number;
  desarrolloEmprendedor?: number;
  desarrolloHumanoSocial?: number;
  desarrolloAcademicoAplicado?: number;
  totalIndicadores?: number;
  horasPorUnidad?: {
    u1: number;
    u2?: number;
    u3?: number;
    u4?: number;
  };
  bimestres?: {
    b1: number;
    b2: number;
    b3: number;
    b4: number;
  };
  totalHoras: number;
  fechaInicio: string; // e.g. "19 de enero"
  fechaFin: string; // e.g. "23 de enero"
  mesInicio: string;
  diaInicio: number;
  mesFin: string;
  diaFin: number;
  campo?: string;
  especialidad?: string;
  prerrequisito?: string;
  competencias?: string;
  competenciaGeneral?: string;
  objetivoModulo?: string;
  situacionProblematica?: string;
  criteriosEvaluacion?: string[];
  unidades?: number;
  planDidactico?: DidacticPlan;
}

export interface InstitutionalHeader {
  institucion: string;
  tituloDocumento: string;
  docente: string;
  gradoSeccion: string;
  anoLectivo: string;
  horasSemanalesModulo: number;
  notaEvaluativa: string;
  anoNivel: '10' | '11' | '12'; // 10 = 1° Año, 11 = 2° Año, 12 = 3° Año
}

export interface AcademicPeriodActivity {
  nombre: string;
  fechas?: string;
  fechaInicio?: string;
  fechaCierre?: string;
  ingresoTBox?: string;
  porcentaje?: string;
  tipo?: 'formativa' | 'objetiva' | 'diagnostica' | 'refuerzo' | 'recuperacion' | 'boletas' | 'temario';
}

export interface AcademicPeriod {
  nombre: string;
  inicio: string;
  fin: string;
  tipo: 'Bimestre' | 'Trimestre';
  ingresoTBoxFinal?: string;
  entregaBoletas?: string;
  entregaTemarios?: string;
  recuperacionOrdinaria?: string;
  pruebaExtraordinaria?: string;
  actividades: AcademicPeriodActivity[];
}

export interface GuionEvaluacionRow {
  no: number;
  actividad: string;
  ponderacion: string; // e.g. "FPP (10%)", "FEP (35%)", "10%", etc.
  fechaRealizacion: string;
}

export interface GuionDeClase {
  id: string;
  sesionNumero: number;
  totalSesiones?: number;
  moduloCodigo: string;
  moduloNombre: string;
  docente: string;
  gradoSeccion: string;
  trimestre: string;
  fecha: string;
  unidad: string;
  contenido: string;
  tiempo: string;
  horas: number;
  etapaAccionCompleta?: string;
  etapaNumero?: number; // 1..6
  faseEvaluacion?: string;
  objetivoClase: string;
  indicadorLogro: string;
  competenciasEspecificas: string;
  ejeTransversal: string;
  // Situaciones de Aprendizaje vs Evaluación
  inicioSituacion: string;
  inicioEvaluacion: string;
  desarrolloSituacion: string;
  desarrolloEvaluacion: string;
  cierreSituacion: string;
  cierreEvaluacion: string;
  adaptacionesCurriculares: string;
  // Tabla de actividades de evaluación
  actividadesEvaluacion: GuionEvaluacionRow[];
  // Pie de Guion
  tarea: string;
  bibliografia: string;
  recursosClase: string;
  tics: string;
}

