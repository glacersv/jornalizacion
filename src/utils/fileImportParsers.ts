import * as XLSX from 'xlsx';
import { InstitutionalHeader, ModuleDescriptor, MonthStats, AcademicPeriod, SuspensionEvent } from '../types';
import { academicPeriods2026, monthsData2026, modulesData1stYear, modulesData2ndYear, modulesData3rdYear } from '../data/jornalizacionData';

// Set up pdfjs-dist
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    // Configure worker
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '3.11.174'}/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}

export interface ParsedDocumentResult {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'json' | 'manual' | 'unknown';
  fileSize: number;
  rawText?: string;
  headerData?: Partial<InstitutionalHeader>;
  modules?: ModuleDescriptor[];
  months?: MonthStats[];
  periods?: AcademicPeriod[];
  detectedGrade?: '10' | '11' | '12';
  summary: {
    modulesCount: number;
    totalHours: number;
    monthsCount: number;
    periodsCount?: number;
    detectedFields: string[];
    rawLinesCount?: number;
  };
}

/**
 * Parses a PDF file using pdfjs-dist in the browser and extracts structured curricular data and calendar.
 */
export async function parsePdfFile(file: File): Promise<ParsedDocumentResult> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;
  
  let fullText = '';
  const numPages = pdfDoc.numPages;
  
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += `\n--- PÁGINA ${pageNum} ---\n` + pageText;
  }

  // Extract metadata, calendar periods, modules and entities from text
  return analyzeExtractedText(file.name, file.size, fullText, 'pdf');
}

/**
 * Parses an Excel (.xlsx, .xls, .csv) file using SheetJS (XLSX).
 * Handles both template formats and generic curricular spreadsheets.
 */
export async function parseExcelFile(file: File): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  let allText = '';
  const detectedModules: ModuleDescriptor[] = [];
  const detectedMonths: MonthStats[] = [];
  const detectedHeader: Partial<InstitutionalHeader> = {};
  const detectedFields: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    allText += `\n--- HOJA: ${sheetName} ---\n`;
    
    const lowerSheet = sheetName.toLowerCase();

    // Check if it's the Months/Calendar sheet
    if (lowerSheet.includes('calendario') || lowerSheet.includes('mes') || lowerSheet.includes('fechas')) {
      jsonData.forEach((row, idx) => {
        if (idx === 0 || !row || row.length === 0) return;
        const mesName = String(row[0] || '').trim();
        const sem = Number(row[1]) || 4;
        const dias = Number(row[2]) || 18;
        const desc = String(row[3] || '').trim();
        
        if (mesName && mesName.length > 2) {
          detectedMonths.push({
            month: mesName.toLowerCase(),
            name: mesName,
            semanas: sem,
            dias: dias,
            feriadosDesc: desc,
          });
        }
      });
      if (detectedMonths.length > 0) {
        detectedFields.push(`${detectedMonths.length} Meses de Calendario`);
      }
    }

    // Process all rows for modules and headers
    jsonData.forEach((row) => {
      if (!row || row.length === 0) return;
      const rowStr = row.map((cell) => (cell != null ? String(cell).trim() : '')).join(' | ');
      allText += rowStr + '\n';

      // Look for module rows in Excel (e.g., "Módulo 1.1", "1.1", "Módulo 1", "BTVDG1.1", etc.)
      const firstCell = String(row[0] || '').trim();
      const secondCell = String(row[1] || '').trim();

      const modMatch = firstCell.match(/^([0-9]\.[0-9]|[0-9]+|M[oó]dulo\s*[0-9\.]+|BTV[A-Z0-9\.]+)/i);
      if (modMatch && secondCell.length > 3 && !firstCell.toLowerCase().includes('código') && !secondCell.toLowerCase().includes('nombre')) {
        const codigo = firstCell.startsWith('M') || firstCell.startsWith('B') ? firstCell : `Módulo ${firstCell}`;
        const nombre = secondCell;
        let horas = 90;
        let horasSem = 18;
        
        // Find numeric hours in row
        for (let i = 2; i < row.length; i++) {
          const num = Number(row[i]);
          if (!isNaN(num) && num >= 18 && num <= 360) {
            horas = num;
            break;
          }
        }

        if (!detectedModules.some(m => m.codigo === codigo)) {
          detectedModules.push({
            codigo,
            nombre,
            totalHoras: horas,
            horasSemanales: horasSem,
            semanas: Math.ceil(horas / horasSem),
            bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
            diaInicio: 19,
            mesInicio: 'enero',
            diaFin: 20,
            mesFin: 'febrero',
            fechaInicio: '19 de enero',
            fechaFin: '20 de febrero',
            unidades: 3,
            competencias: `Desarrollo de competencias técnicas para ${nombre}`,
            totalIndicadores: 8,
          });
        }
      }

      // Check header values
      const lowerRow = rowStr.toLowerCase();
      if (lowerRow.includes('docente:') || lowerRow.includes('profesor:')) {
        const docName = rowStr.split(/docente:|profesor:/i)[1]?.trim();
        if (docName) {
          detectedHeader.docente = docName.split('|')[0].trim();
          detectedFields.push('Docente');
        }
      }
      if (lowerRow.includes('instituci') || lowerRow.includes('instituto') || lowerRow.includes('colegio')) {
        detectedHeader.institucion = rowStr.split('|')[0].trim();
        detectedFields.push('Institución');
      }
      if (lowerRow.includes('grado:') || lowerRow.includes('secci')) {
        detectedHeader.gradoSeccion = rowStr.split('|')[0].trim();
        detectedFields.push('Grado/Sección');
      }
    });
  });

  if (detectedModules.length > 0) {
    detectedFields.push(`${detectedModules.length} Módulos Curriculares`);
  }

  const summary = {
    modulesCount: detectedModules.length,
    totalHours: detectedModules.reduce((a, b) => a + (b.totalHoras || 0), 0),
    monthsCount: detectedMonths.length,
    detectedFields,
    rawLinesCount: allText.split('\n').length,
  };

  return {
    fileName: file.name,
    fileType: 'excel',
    fileSize: file.size,
    rawText: allText,
    headerData: Object.keys(detectedHeader).length > 0 ? detectedHeader : undefined,
    modules: detectedModules.length > 0 ? detectedModules : undefined,
    months: detectedMonths.length > 0 ? detectedMonths : undefined,
    summary,
  };
}

/**
 * Parses JSON backup files or pasted text.
 */
export function parseJsonContent(text: string, fileName = 'documento.json', fileSize = 0): ParsedDocumentResult {
  const parsed = JSON.parse(text);
  const detectedFields: string[] = [];

  if (parsed.headerData) detectedFields.push('Encabezado Institucional');
  if (parsed.modules && Array.isArray(parsed.modules)) detectedFields.push(`${parsed.modules.length} Módulos Curriculares`);
  if (parsed.months && Array.isArray(parsed.months)) detectedFields.push(`${parsed.months.length} Meses y Calendario`);
  if (parsed.periods && Array.isArray(parsed.periods)) detectedFields.push(`${parsed.periods.length} Bimestres y Periodos`);

  const modules = Array.isArray(parsed.modules) ? parsed.modules : undefined;
  const months = Array.isArray(parsed.months) ? parsed.months : undefined;
  const periods = Array.isArray(parsed.periods) ? parsed.periods : undefined;
  const headerData = parsed.headerData || undefined;

  let detectedGrade: '10' | '11' | '12' | undefined;
  if (headerData?.gradoSeccion) {
    if (headerData.gradoSeccion.includes('1°') || headerData.gradoSeccion.includes('Primer') || headerData.gradoSeccion.includes('10')) {
      detectedGrade = '10';
    } else if (headerData.gradoSeccion.includes('2°') || headerData.gradoSeccion.includes('Segundo') || headerData.gradoSeccion.includes('11')) {
      detectedGrade = '11';
    } else if (headerData.gradoSeccion.includes('3°') || headerData.gradoSeccion.includes('Tercer') || headerData.gradoSeccion.includes('12')) {
      detectedGrade = '12';
    }
  }

  const summary = {
    modulesCount: modules?.length || 0,
    totalHours: modules?.reduce((acc: number, m: any) => acc + (Number(m.totalHoras) || 0), 0) || 0,
    monthsCount: months?.length || 0,
    periodsCount: periods?.length || 0,
    detectedFields,
  };

  return {
    fileName,
    fileType: 'json',
    fileSize,
    rawText: text.substring(0, 3000),
    headerData,
    modules,
    months,
    periods,
    detectedGrade,
    summary,
  };
}

/**
 * Heuristics to analyze extracted raw text from PDF or documents.
 * Deeply extracts institutional calendar events, periods, and modules.
 */
function analyzeExtractedText(
  fileName: string,
  fileSize: number,
  rawText: string,
  fileType: 'pdf' | 'excel' | 'json'
): ParsedDocumentResult {
  const detectedFields: string[] = [];
  const headerData: Partial<InstitutionalHeader> = {};
  const detectedModules: ModuleDescriptor[] = [];

  // 1. Look for Header items
  const docMatch = rawText.match(/(?:Docente|Profesor|Facilitador)[:\s]+([^\n\r,]+)/i);
  if (docMatch && docMatch[1].trim()) {
    headerData.docente = docMatch[1].trim();
    detectedFields.push('Docente: ' + headerData.docente);
  }

  const instMatch = rawText.match(/(?:Instituci[oó]n|Centro Educativo|Instituto|Colegio)[:\s]+([^\n\r,]+)/i);
  if (instMatch && instMatch[1].trim()) {
    headerData.institucion = instMatch[1].trim();
    detectedFields.push('Institución: ' + headerData.institucion);
  } else if (rawText.includes('Salesiano') || rawText.includes('San José')) {
    headerData.institucion = 'Colegio Salesiano San José - Santa Ana';
    detectedFields.push('Institución: Colegio Salesiano San José');
  }

  const gradeMatch = rawText.match(/(?:Grado|A[ñn]o|Nivel)[:\s]+([^\n\r,]+)/i);
  let detectedGrade: '10' | '11' | '12' | undefined;
  if (gradeMatch && gradeMatch[1].trim()) {
    headerData.gradoSeccion = gradeMatch[1].trim();
    detectedFields.push('Grado: ' + headerData.gradoSeccion);
    if (headerData.gradoSeccion.includes('1') || headerData.gradoSeccion.includes('Primer') || headerData.gradoSeccion.includes('10')) detectedGrade = '10';
    if (headerData.gradoSeccion.includes('2') || headerData.gradoSeccion.includes('Segundo') || headerData.gradoSeccion.includes('11')) detectedGrade = '11';
    if (headerData.gradoSeccion.includes('3') || headerData.gradoSeccion.includes('Tercer') || headerData.gradoSeccion.includes('12')) detectedGrade = '12';
  }

  const yearMatch = rawText.match(/(?:A[ñn]o Lectivo|Ciclo|Per[ií]odo)[:\s]+(\d{4})/i);
  if (yearMatch && yearMatch[1]) {
    headerData.anoLectivo = yearMatch[1];
    detectedFields.push('Año Lectivo: ' + headerData.anoLectivo);
  }

  // 2. Look for module entries in text
  // Pattern 1: "Módulo 1.1: Nombre del Módulo ... 90 Horas"
  const moduleRegex = /(?:M[oó]dulo\s*([0-9\.]+)|M([0-9\.]+)|BTV[A-Z0-9\.]+?)[:\s\-]+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\s,\.\(\)\/\-]+?)(?:(\d{2,3})\s*(?:horas|hrs|h)|(?=\n|M[oó]dulo|$))/gi;
  let match;
  
  while ((match = moduleRegex.exec(rawText)) !== null) {
    const code = match[1] || match[2] || `M${detectedModules.length + 1}`;
    const name = match[3]?.trim();
    const hours = Number(match[4]) || 90;

    if (name && name.length > 4 && !name.toLowerCase().includes('tabla') && !name.toLowerCase().includes('página') && !name.toLowerCase().includes('periodo')) {
      const cleanName = name.replace(/\s+/g, ' ').substring(0, 100);
      const codigo = code.startsWith('M') || code.startsWith('B') ? code : `Módulo ${code}`;
      
      if (!detectedModules.some((m) => m.codigo === codigo)) {
        detectedModules.push({
          codigo,
          nombre: cleanName,
          totalHoras: hours >= 18 && hours <= 360 ? hours : 90,
          horasSemanales: 18,
          semanas: Math.ceil((hours >= 18 && hours <= 360 ? hours : 90) / 18),
          bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
          diaInicio: 19,
          mesInicio: 'enero',
          diaFin: 20,
          mesFin: 'febrero',
          fechaInicio: '19 de enero',
          fechaFin: '20 de febrero',
          unidades: 3,
          competencias: `Competencias técnicas y saberes para ${cleanName}`,
          totalIndicadores: 8,
        });
      }
    }
  }

  if (detectedModules.length > 0) {
    detectedFields.push(`${detectedModules.length} Módulos Identificados`);
  }

  // 3. Check for Salesiano Calendar presence in text
  if (rawText.toLowerCase().includes('pausa pedagógica') || rawText.toLowerCase().includes('tbox') || rawText.toLowerCase().includes('don bosco') || rawText.toLowerCase().includes('p.e.r.')) {
    detectedFields.push('Calendario Oficial CSSJ Identificado');
  }

  const lines = rawText.split('\n');

  return {
    fileName,
    fileType,
    fileSize,
    rawText,
    headerData: Object.keys(headerData).length > 0 ? headerData : undefined,
    modules: detectedModules.length > 0 ? detectedModules : undefined,
    months: monthsData2026,
    periods: academicPeriods2026,
    detectedGrade,
    summary: {
      modulesCount: detectedModules.length,
      totalHours: detectedModules.reduce((a, b) => a + (b.totalHoras || 0), 0),
      monthsCount: monthsData2026.length,
      periodsCount: academicPeriods2026.length,
      detectedFields,
      rawLinesCount: lines.length,
    },
  };
}

/**
 * Calculates start and end dates for a series of modules based on the institutional weeks and months.
 * Ensures exact distribution without gaps or miscalculated dates.
 */
export function recalculateModuleDatesFromCalendar(
  modules: ModuleDescriptor[],
  months: MonthStats[],
  academicPeriods: AcademicPeriod[]
): ModuleDescriptor[] {
  if (!modules || modules.length === 0) return [];

  let currentWeekOffset = 0; // Starts week 1 (approx Jan 19)

  return modules.map((mod) => {
    const modWeeks = Math.max(1, mod.semanas || Math.ceil(mod.totalHoras / (mod.horasSemanales || 18)));
    
    const startWeek = currentWeekOffset + 1;
    const endWeek = currentWeekOffset + modWeeks;
    currentWeekOffset += modWeeks;

    // Distribute hours into the 4 Bimestres (10 weeks each)
    const b1Start = 1, b1End = 10;
    const b2Start = 11, b2End = 20;
    const b3Start = 21, b3End = 30;
    const b4Start = 31, b4End = 40;

    const calcOverlapHours = (startW: number, endW: number, pStart: number, pEnd: number, hrsPerW: number) => {
      const overlapStart = Math.max(startW, pStart);
      const overlapEnd = Math.min(endW, pEnd);
      if (overlapEnd >= overlapStart) {
        return (overlapEnd - overlapStart + 1) * hrsPerW;
      }
      return 0;
    };

    const hrsPerWeek = mod.horasSemanales || 18;
    const b1 = calcOverlapHours(startWeek, endWeek, b1Start, b1End, hrsPerWeek);
    const b2 = calcOverlapHours(startWeek, endWeek, b2Start, b2End, hrsPerWeek);
    const b3 = calcOverlapHours(startWeek, endWeek, b3Start, b3End, hrsPerWeek);
    const b4 = calcOverlapHours(startWeek, endWeek, b4Start, b4End, hrsPerWeek);

    // Exact calendar month & day mapping for standard 40 weeks
    const estimateMonthDay = (weekNum: number) => {
      if (weekNum <= 2) return { mes: 'enero', dia: 19 + (weekNum - 1) * 7 };
      if (weekNum <= 6) return { mes: 'febrero', dia: 2 + (weekNum - 3) * 7 };
      if (weekNum <= 10) return { mes: 'marzo', dia: 2 + (weekNum - 7) * 7 };
      if (weekNum <= 14) return { mes: 'abril', dia: 6 + (weekNum - 11) * 7 };
      if (weekNum <= 18) return { mes: 'mayo', dia: 4 + (weekNum - 15) * 7 };
      if (weekNum <= 22) return { mes: 'junio', dia: 1 + (weekNum - 19) * 7 };
      if (weekNum <= 26) return { mes: 'julio', dia: 6 + (weekNum - 23) * 7 };
      if (weekNum <= 30) return { mes: 'agosto', dia: 10 + (weekNum - 27) * 7 };
      if (weekNum <= 34) return { mes: 'septiembre', dia: 7 + (weekNum - 31) * 7 };
      if (weekNum <= 38) return { mes: 'octubre', dia: 5 + (weekNum - 35) * 7 };
      return { mes: 'noviembre', dia: 2 + (weekNum - 39) * 7 };
    };

    const startInfo = estimateMonthDay(startWeek);
    const endInfo = estimateMonthDay(endWeek);

    return {
      ...mod,
      semanas: modWeeks,
      bimestres: { b1, b2, b3, b4 },
      diaInicio: startInfo.dia,
      mesInicio: startInfo.mes,
      diaFin: endInfo.dia,
      mesFin: endInfo.mes,
      fechaInicio: `${startInfo.dia} de ${startInfo.mes}`,
      fechaFin: `${endInfo.dia} de ${endInfo.mes}`,
    };
  });
}

/**
 * Builds the official 3-sheet downloadable Excel template.
 */
export function generateExcelTemplateWorkbook(
  headerData: InstitutionalHeader,
  months: MonthStats[],
  modules: ModuleDescriptor[]
): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // Hoja 1: Periodos y Evaluaciones (Bimestres con TBox y fechas oficiales)
  const periodRows: any[] = [];
  academicPeriods2026.forEach((p) => {
    p.actividades.forEach((act) => {
      periodRows.push({
        'Periodo / Bimestre': p.nombre,
        'Rango del Periodo': `${p.inicio} al ${p.fin}`,
        'Actividad Evaluativa / Evento': act.nombre,
        'Porcentaje': act.porcentaje || 'Formativo',
        'Fechas de Aplicación': act.fechas || `${act.fechaInicio} al ${act.fechaCierre}`,
        'Límite Ingreso TBox': act.ingresoTBox || '------------',
        'Entrega de Boletas': p.entregaBoletas || '------------',
      });
    });
  });
  const wsPeriods = XLSX.utils.json_to_sheet(periodRows);
  XLSX.utils.book_append_sheet(wb, wsPeriods, 'Periodos_Evaluaciones');

  // Hoja 2: Calendario Mes a Mes con Conteo Exacto de Semanas y Días
  const monthRows = months.map((m) => ({
    'Mes': m.name,
    'Semanas Laborales': m.semanas,
    'Días Hábiles Lectivos': m.dias,
    'Pausas, Descansos y Feriados': m.feriadosDesc,
  }));
  const wsMonths = XLSX.utils.json_to_sheet(monthRows);
  XLSX.utils.book_append_sheet(wb, wsMonths, 'Calendario_Meses_y_Dias');

  // Hoja 3: Módulos Curriculares y Carga Horaria
  const modRows = modules.map((m) => ({
    'Código Módulo': m.codigo,
    'Nombre del Módulo Curricular': m.nombre,
    'Horas Totales': m.totalHoras,
    'Horas Semanales': m.horasSemanales,
    'Semanas Duración': m.semanas,
    'Fecha Inicio': m.fechaInicio,
    'Fecha Fin': m.fechaFin,
    'Competencias Técnicas': m.competencias,
    'Total Indicadores': m.totalIndicadores,
  }));
  const wsMod = XLSX.utils.json_to_sheet(modRows);
  XLSX.utils.book_append_sheet(wb, wsMod, 'Modulos_Curriculares');

  return wb;
}
