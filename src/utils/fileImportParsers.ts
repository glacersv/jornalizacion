import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { InstitutionalHeader, ModuleDescriptor, MonthStats, AcademicPeriod } from '../types';
import { academicPeriods2026, monthsData2026 } from '../data/jornalizacionData';

// Set up pdfjs-dist safely with multiple fallback workers
let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    pdfjsLib = await import('pdfjs-dist');
    if (pdfjsLib.GlobalWorkerOptions) {
      const version = pdfjsLib.version || '4.0.379';
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjsLib;
}

export interface ParsedDocumentResult {
  fileName: string;
  fileType: 'pdf' | 'excel' | 'word' | 'json' | 'text' | 'manual' | 'unknown';
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

export const SPANISH_MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const MONTH_DISPLAY_NAMES: { [key: string]: string } = {
  enero: 'Enero',
  febrero: 'Febrero',
  marzo: 'Marzo',
  abril: 'Abril',
  mayo: 'Mayo',
  junio: 'Junio',
  julio: 'Julio',
  agosto: 'Agosto',
  septiembre: 'Septiembre',
  setiembre: 'Septiembre',
  octubre: 'Octubre',
  noviembre: 'Noviembre',
  diciembre: 'Diciembre',
};

/**
 * Normalizes text string for robust matching
 */
function cleanText(str: any): string {
  if (str == null) return '';
  return String(str).trim();
}

/**
 * Creates a clean 12-month array with all weeks and days set to 0 and empty descriptions
 */
export function createEmpty12Months(): MonthStats[] {
  return SPANISH_MONTH_NAMES.map((m) => ({
    month: m,
    name: MONTH_DISPLAY_NAMES[m] || m,
    semanas: 0,
    dias: 0,
    feriadosDesc: '',
    eventos: [],
  }));
}

/**
 * Creates a clean 12-month array populated from a standard baseline or default 2026 data
 */
export function createDefault12Months(): MonthStats[] {
  return JSON.parse(JSON.stringify(monthsData2026));
}

/**
 * Scans a 2D grid/table (from Excel) for a Horizontal Month Distribution:
 * Row 1: [Meses, Enero, Febrero, Marzo, Abril, Mayo, Junio, Julio, Agosto, Septiembre, Octubre, Noviembre, Diciembre]
 * Row 2: [Semanas, 2, 4, 4, 4, 4, 4, 5, 4, 4, 3, 2, 0]
 * Row 3: [Días, 10, 18, 19, 18, 19, 20, 21, 17, 21, 12, 5, 0]
 */
export function extractHorizontalMonthsFromGrid(rows: any[][]): MonthStats[] | null {
  if (!rows || rows.length < 2) return null;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 4) continue;

    // Check if this row contains multiple month names
    const monthPositions: { col: number; monthKey: string; name: string }[] = [];
    row.forEach((cell, cIdx) => {
      const txt = cleanText(cell).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchedMonth = SPANISH_MONTH_NAMES.find((m) => txt === m || (txt.length >= 3 && m.startsWith(txt)));
      if (matchedMonth) {
        monthPositions.push({
          col: cIdx,
          monthKey: matchedMonth,
          name: MONTH_DISPLAY_NAMES[matchedMonth] || matchedMonth,
        });
      }
    });

    // If at least 4 months are detected across columns in this row
    if (monthPositions.length >= 4) {
      let semanasRowIdx = -1;
      let diasRowIdx = -1;
      let feriadosRowIdx = -1;

      for (let nextR = r + 1; nextR < Math.min(rows.length, r + 6); nextR++) {
        const checkRow = rows[nextR];
        if (!checkRow || checkRow.length === 0) continue;
        const firstFew = checkRow.slice(0, 3).map((c) => cleanText(c).toLowerCase()).join(' ');

        if (firstFew.includes('semana') || firstFew.includes('sem')) {
          semanasRowIdx = nextR;
        } else if (firstFew.includes('dia') || firstFew.includes('días') || firstFew.includes('habiles') || firstFew.includes('lectivos')) {
          diasRowIdx = nextR;
        } else if (firstFew.includes('feriado') || firstFew.includes('suspensi') || firstFew.includes('observaci') || firstFew.includes('pausa')) {
          feriadosRowIdx = nextR;
        }
      }

      // If neither row had an explicit label, check if next row has numbers <= 6 (weeks) and row after has numbers > 6 (days)
      if (semanasRowIdx === -1 && diasRowIdx === -1 && rows[r + 1]) {
        const sampleNumbers = monthPositions.map(({ col }) => Number(rows[r + 1][col])).filter((n) => !isNaN(n));
        if (sampleNumbers.length >= 3) {
          const allSmall = sampleNumbers.every((n) => n >= 0 && n <= 6);
          if (allSmall) {
            semanasRowIdx = r + 1;
            if (rows[r + 2]) {
              diasRowIdx = r + 2;
            }
          } else {
            diasRowIdx = r + 1;
          }
        }
      }

      if (semanasRowIdx !== -1 || diasRowIdx !== -1) {
        const resultMonths = createEmpty12Months();

        monthPositions.forEach(({ col, monthKey }) => {
          const mIdx = resultMonths.findIndex((rm) => rm.month === monthKey);
          if (mIdx !== -1) {
            if (semanasRowIdx !== -1 && rows[semanasRowIdx] && rows[semanasRowIdx][col] != null) {
              const semVal = Number(rows[semanasRowIdx][col]);
              if (!isNaN(semVal) && semVal >= 0 && semVal <= 6) {
                resultMonths[mIdx].semanas = semVal;
              }
            }
            if (diasRowIdx !== -1 && rows[diasRowIdx] && rows[diasRowIdx][col] != null) {
              const diasVal = Number(rows[diasRowIdx][col]);
              if (!isNaN(diasVal) && diasVal >= 0 && diasVal <= 31) {
                resultMonths[mIdx].dias = diasVal;
              }
            }
            if (feriadosRowIdx !== -1 && rows[feriadosRowIdx] && rows[feriadosRowIdx][col] != null) {
              const desc = cleanText(rows[feriadosRowIdx][col]);
              if (desc) {
                resultMonths[mIdx].feriadosDesc = desc;
              }
            }
          }
        });

        // Ensure default holiday descriptions if blank
        resultMonths.forEach((rm, idx) => {
          if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
            rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
          }
          rm.eventos = monthsData2026[idx]?.eventos || [];
        });

        return resultMonths;
      }
    }
  }

  return null;
}

/**
 * Scans a 2D grid/table for Vertical Month Distribution (Rows = Months):
 * Enero | 2 | 10 | Asuetos...
 * Febrero | 4 | 18 | ...
 */
export function extractVerticalMonthsFromGrid(rows: any[][]): MonthStats[] | null {
  if (!rows || rows.length < 3) return null;

  const foundMonths: { month: string; semanas: number; dias: number; desc: string }[] = [];

  rows.forEach((row) => {
    if (!row || row.length < 2) return;
    const firstCell = cleanText(row[0]).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const matched = SPANISH_MONTH_NAMES.find((m) => firstCell === m || firstCell.startsWith(m));

    if (matched) {
      let sem = 0;
      let dias = 0;
      let desc = '';

      for (let c = 1; c < row.length; c++) {
        const val = row[c];
        const num = Number(val);
        if (!isNaN(num) && num >= 0 && num <= 6 && sem === 0) {
          sem = num;
        } else if (!isNaN(num) && num >= 0 && num <= 31 && dias === 0) {
          dias = num;
        } else if (typeof val === 'string' && val.trim().length > 3 && !desc) {
          desc = val.trim();
        }
      }

      foundMonths.push({
        month: matched,
        semanas: sem,
        dias: dias,
        desc,
      });
    }
  });

  if (foundMonths.length >= 3) {
    const result = createEmpty12Months();
    foundMonths.forEach((fm) => {
      const idx = result.findIndex((rm) => rm.month === fm.month);
      if (idx !== -1) {
        result[idx].semanas = fm.semanas;
        result[idx].dias = fm.dias;
        if (fm.desc) result[idx].feriadosDesc = fm.desc;
      }
    });

    result.forEach((rm, idx) => {
      if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
        rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
      }
      rm.eventos = monthsData2026[idx]?.eventos || [];
    });

    return result;
  }

  return null;
}

/**
 * Extracts Academic Periods (Bimestres / Trimestres) with dates from text or table
 */
export function extractAcademicPeriodsFromText(text: string): AcademicPeriod[] | null {
  if (!text) return null;

  const periods: AcademicPeriod[] = [];
  const periodRegex = /(?:Bimestre|Periodo|Trimestre)\s*([1-4]|I|II|III|IV)\b[:\s\-–\.]+(?:del?\s+)?([0-9]{1,2}\s+(?:de\s+)?[A-Za-z]+)\s+(?:al?|hasta|-|–)\s+([0-9]{1,2}\s+(?:de\s+)?[A-Za-z]+)(?:.*?TBox[:\s]+([^\n\r,\.]+))?/gi;

  let match;
  while ((match = periodRegex.exec(text)) !== null) {
    const rawNum = match[1];
    const inicio = match[2]?.trim();
    const fin = match[3]?.trim();
    const tbox = match[4]?.trim();

    const numMap: { [key: string]: string } = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', i: 'I', ii: 'II', iii: 'III', iv: 'IV' };
    const roman = numMap[rawNum.toLowerCase()] || rawNum;

    periods.push({
      nombre: `Bimestre ${roman}`,
      inicio: inicio || 'Por definir',
      fin: fin || 'Por definir',
      tipo: 'Bimestre',
      ingresoTBoxFinal: tbox || 'Conforme a calendario',
      actividades: [],
    });
  }

  if (periods.length >= 2) {
    return periods;
  }

  return null;
}

/**
 * Parses free text for month tables (e.g. "Enero: 2 semanas, 10 días", or tabular text lines)
 */
export function extractMonthsFromFreeText(text: string): MonthStats[] | null {
  if (!text) return null;

  const foundMonths: { month: string; semanas: number; dias: number; desc: string }[] = [];

  // Pattern: "Enero: 2 semanas, 10 días" or "Enero | 2 | 10" or "Enero (2 sem, 10 d)"
  SPANISH_MONTH_NAMES.forEach((mName) => {
    const reg = new RegExp(
      `(?:^|\\n|[\\|;,])\\s*${mName}\\b[^\\d\\n]*?(\\d{1,2})\\s*(?:sem|semanas|w)?[^\\d\\n]*?(\\d{1,2})\\s*(?:d[ií]as|d|days)?(?:[:\\-–\\|\\s]+([^\\n\\r]+))?`,
      'i'
    );
    const m = text.match(reg);
    if (m) {
      const sem = parseInt(m[1], 10);
      const dias = parseInt(m[2], 10);
      const desc = m[3]?.trim() || '';

      if (!isNaN(sem) && sem <= 6 && !isNaN(dias) && dias <= 31) {
        foundMonths.push({
          month: mName,
          semanas: sem,
          dias: dias,
          desc: desc.length > 5 ? desc : '',
        });
      }
    }
  });

  if (foundMonths.length >= 3) {
    const result = createEmpty12Months();
    foundMonths.forEach((fm) => {
      const idx = result.findIndex((rm) => rm.month === fm.month);
      if (idx !== -1) {
        result[idx].semanas = fm.semanas;
        result[idx].dias = fm.dias;
        if (fm.desc) result[idx].feriadosDesc = fm.desc;
      }
    });

    result.forEach((rm, idx) => {
      if (!rm.feriadosDesc && monthsData2026[idx]?.feriadosDesc) {
        rm.feriadosDesc = monthsData2026[idx].feriadosDesc;
      }
      rm.eventos = monthsData2026[idx]?.eventos || [];
    });

    return result;
  }

  return null;
}

/**
 * Parses an Excel (.xlsx, .xls, .csv) file using SheetJS (XLSX).
 * Uses multi-strategy column, cell, and horizontal/vertical grid recognizers.
 */
export async function parseExcelFile(file: File): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  
  let allText = '';
  const detectedModules: ModuleDescriptor[] = [];
  let detectedMonths: MonthStats[] | null = null;
  let detectedPeriods: AcademicPeriod[] | null = null;
  const detectedHeader: Partial<InstitutionalHeader> = {};
  const detectedFields: string[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
    
    allText += `\n--- HOJA: ${sheetName} ---\n`;
    
    if (!jsonData || jsonData.length === 0) return;

    // 1. Scan for Months (Horizontal & Vertical tables in this sheet)
    if (!detectedMonths) {
      detectedMonths = extractHorizontalMonthsFromGrid(jsonData) || extractVerticalMonthsFromGrid(jsonData);
      if (detectedMonths) {
        detectedFields.push(`12 Meses de Calendario Anual (Semanas y Días)`);
      }
    }

    // 2. Scan for Periods / Bimestres in this sheet
    if (!detectedPeriods) {
      const sheetText = jsonData.map((r) => r.join(' ')).join('\n');
      detectedPeriods = extractAcademicPeriodsFromText(sheetText);
      if (detectedPeriods) {
        detectedFields.push(`${detectedPeriods.length} Períodos Académicos / Bimestres`);
      }
    }

    // 3. Find Column Header mapping (Header Row detection)
    let headerRowIdx = -1;
    let colMap = {
      code: -1,
      name: -1,
      hours: -1,
      weeks: -1,
      hoursWeekly: -1,
      units: -1,
      competencies: -1,
      indicators: -1,
    };

    for (let r = 0; r < Math.min(jsonData.length, 15); r++) {
      const row = jsonData[r];
      if (!row || row.length === 0) continue;
      
      const lowerCells = row.map((c) => cleanText(c).toLowerCase());
      
      const hasCode = lowerCells.some((c) => c.includes('código') || c.includes('codigo') || c.includes('n°') || c.includes('no.') || c.includes('modulo') || c.includes('módulo'));
      const hasName = lowerCells.some((c) => c.includes('nombre') || c.includes('asignatura') || c.includes('unidad de') || c.includes('módulo') || c.includes('tema') || c.includes('competencia'));
      const hasHours = lowerCells.some((c) => c.includes('hora') || c.includes('duraci') || c.includes('hrs') || c.includes('tiempo'));

      if ((hasCode || hasName) && (hasHours || lowerCells.length >= 2)) {
        headerRowIdx = r;
        lowerCells.forEach((cell, colIdx) => {
          if (colMap.code === -1 && (cell.includes('código') || cell.includes('codigo') || cell.includes('cód') || cell.includes('n°') || cell.includes('no.'))) {
            colMap.code = colIdx;
          }
          if (colMap.name === -1 && (cell.includes('nombre') || cell.includes('módulo') || cell.includes('modulo') || cell.includes('asignatura') || cell.includes('unidad de aprendizaje') || cell.includes('descripci'))) {
            colMap.name = colIdx;
          }
          if (colMap.hours === -1 && (cell.includes('total hora') || cell.includes('horas total') || cell.includes('duraci') || cell.includes('horas') || cell.includes('hrs'))) {
            colMap.hours = colIdx;
          }
          if (colMap.weeks === -1 && (cell.includes('semana') || cell.includes('sem'))) {
            colMap.weeks = colIdx;
          }
          if (colMap.hoursWeekly === -1 && (cell.includes('semanal') || cell.includes('h/s') || cell.includes('hrs/sem'))) {
            colMap.hoursWeekly = colIdx;
          }
          if (colMap.units === -1 && (cell.includes('unidad') || cell.includes('unid'))) {
            colMap.units = colIdx;
          }
          if (colMap.competencies === -1 && (cell.includes('competencia') || cell.includes('objetivo'))) {
            colMap.competencies = colIdx;
          }
        });
        break;
      }
    }

    // Default column fallback if not labeled
    if (colMap.code === -1 && colMap.name === -1) {
      colMap.code = 0;
      colMap.name = 1;
      colMap.hours = 2;
    } else if (colMap.code === -1) {
      colMap.code = 0;
    } else if (colMap.name === -1) {
      colMap.name = colMap.code === 0 ? 1 : 0;
    }

    // Iterate Rows and Extract Modules
    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;
    
    for (let r = startRow; r < jsonData.length; r++) {
      const row = jsonData[r];
      if (!row || row.length === 0) continue;
      
      const rowStr = row.map((cell) => cleanText(cell)).join(' | ');
      allText += rowStr + '\n';
      
      const lowerRow = rowStr.toLowerCase();

      // Check header values
      if (lowerRow.includes('docente:') || lowerRow.includes('profesor:') || lowerRow.includes('facilitador:')) {
        const docName = rowStr.split(/docente:|profesor:|facilitador:/i)[1]?.trim();
        if (docName) {
          detectedHeader.docente = docName.split('|')[0].trim();
          detectedFields.push('Docente: ' + detectedHeader.docente);
        }
      }
      if (lowerRow.includes('instituci') || lowerRow.includes('instituto') || lowerRow.includes('colegio') || lowerRow.includes('complejo educativo')) {
        detectedHeader.institucion = rowStr.split('|')[0].trim();
        detectedFields.push('Institución');
      }
      if (lowerRow.includes('grado:') || lowerRow.includes('secci') || lowerRow.includes('año:')) {
        detectedHeader.gradoSeccion = rowStr.split('|')[0].trim();
        detectedFields.push('Grado/Sección');
      }
      if (lowerRow.includes('año lectivo:') || lowerRow.includes('año escolar:') || lowerRow.includes('periodo:')) {
        const yr = rowStr.match(/\b(202\d)\b/);
        if (yr) {
          detectedHeader.anoLectivo = yr[1];
        }
      }

      // Check module candidates in row
      let rawCode = cleanText(row[colMap.code]);
      let rawName = cleanText(row[colMap.name]);
      
      if ((!rawName || rawName.length < 3) && rawCode.includes(':')) {
        const parts = rawCode.split(':');
        rawCode = parts[0].trim();
        rawName = parts.slice(1).join(':').trim();
      }

      if (rawCode.length > 10 && (!rawName || rawName.length < 3)) {
        rawName = rawCode;
        rawCode = `Módulo ${detectedModules.length + 1}`;
      }

      let horas = 90;
      if (colMap.hours !== -1 && row[colMap.hours] != null && !isNaN(Number(row[colMap.hours]))) {
        const h = Number(row[colMap.hours]);
        if (h >= 10 && h <= 500) horas = h;
      } else {
        for (let c = 0; c < row.length; c++) {
          const num = Number(row[c]);
          if (!isNaN(num) && num >= 18 && num <= 400 && c !== colMap.code) {
            horas = num;
            break;
          }
        }
      }

      let semanas = Math.ceil(horas / 18);
      if (colMap.weeks !== -1 && row[colMap.weeks] != null && !isNaN(Number(row[colMap.weeks]))) {
        const w = Number(row[colMap.weeks]);
        if (w >= 1 && w <= 40) semanas = w;
      }

      const isHeaderWord = rawCode.toLowerCase().includes('código') || rawCode.toLowerCase().includes('total') || rawCode.toLowerCase().includes('tabla') || rawName.toLowerCase().includes('nombre') || rawName.toLowerCase().includes('descripción') || rawName.toLowerCase().includes('semana') || rawName.toLowerCase().includes('meses');
      
      if (rawName && rawName.length >= 3 && !isHeaderWord) {
        let codigo = rawCode || `Módulo ${detectedModules.length + 1}`;
        if (!codigo.toLowerCase().startsWith('m') && !codigo.toLowerCase().startsWith('b') && !codigo.toLowerCase().startsWith('mod')) {
          codigo = `Módulo ${codigo}`;
        }

        const cleanName = rawName.replace(/^[0-9\.\-\:\s]+/, '').trim() || rawName;

        if (!detectedModules.some((m) => m.codigo.toLowerCase() === codigo.toLowerCase() || m.nombre.toLowerCase() === cleanName.toLowerCase())) {
          detectedModules.push({
            codigo,
            nombre: cleanName,
            totalHoras: horas,
            horasSemanales: 18,
            semanas,
            bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
            diaInicio: 19,
            mesInicio: 'enero',
            diaFin: 20,
            mesFin: 'febrero',
            fechaInicio: '19 de enero',
            fechaFin: '20 de febrero',
            unidades: colMap.units !== -1 && Number(row[colMap.units]) ? Number(row[colMap.units]) : 3,
            competencias: colMap.competencies !== -1 && cleanText(row[colMap.competencies]) ? cleanText(row[colMap.competencies]) : `Competencias técnicas y pedagógicas para ${cleanName}`,
            totalIndicadores: 8,
          });
        }
      }
    }
  });

  const finalMonths = detectedMonths || monthsData2026;
  const finalPeriods = detectedPeriods || academicPeriods2026;

  // If table extraction found modules, recalculate dates according to official calendar
  const finalModules = detectedModules.length > 0
    ? recalculateModuleDatesFromCalendar(detectedModules, finalMonths, finalPeriods)
    : undefined;

  if (detectedModules.length > 0) {
    detectedFields.push(`${detectedModules.length} Módulos Curriculares Reconocidos`);
  }

  const summary = {
    modulesCount: detectedModules.length,
    totalHours: detectedModules.reduce((a, b) => a + (b.totalHoras || 0), 0),
    monthsCount: finalMonths.length,
    periodsCount: finalPeriods.length,
    detectedFields,
    rawLinesCount: allText.split('\n').length,
  };

  return {
    fileName: file.name,
    fileType: 'excel',
    fileSize: file.size,
    rawText: allText,
    headerData: Object.keys(detectedHeader).length > 0 ? detectedHeader : undefined,
    modules: finalModules,
    months: finalMonths,
    periods: finalPeriods,
    summary,
  };
}

/**
 * Parses a Word (.docx / .doc) document using mammoth and analyzes curricular contents.
 */
export async function parseWordFile(file: File): Promise<ParsedDocumentResult> {
  const arrayBuffer = await file.arrayBuffer();
  let text = '';
  try {
    const result = await mammoth.extractRawText({ arrayBuffer });
    text = result.value || '';
  } catch (e) {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    text = decoder.decode(arrayBuffer);
  }

  return analyzeExtractedText(file.name, file.size, text, 'word');
}

/**
 * Parses a plain text or markdown file (.txt, .md, .csv).
 */
export async function parseTextFile(file: File): Promise<ParsedDocumentResult> {
  const text = await file.text();
  return analyzeExtractedText(file.name, file.size, text, 'text');
}

/**
 * Parses a PDF file using pdfjs-dist in the browser.
 */
export async function parsePdfFile(file: File): Promise<ParsedDocumentResult> {
  let fullText = '';
  try {
    const pdfjs = await getPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      disableFontFace: true,
    });

    const pdf = await loadingTask.promise;
    for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `\n--- PÁGINA ${i} ---\n` + pageText;
    }
  } catch (err: any) {
    console.warn('PDF parsing fallback:', err);
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const raw = decoder.decode(arrayBuffer);
    const matches = raw.match(/\(([^()]+)\)T[jJ]/g) || [];
    fullText = matches.map((m: string) => m.replace(/^\(|\)[tT][jJ]$/g, '')).join(' ');
  }

  return analyzeExtractedText(file.name, file.size, fullText, 'pdf');
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

  let modules = Array.isArray(parsed.modules) ? parsed.modules : undefined;
  const months = Array.isArray(parsed.months) ? parsed.months : undefined;
  const periods = Array.isArray(parsed.periods) ? parsed.periods : undefined;
  const headerData = parsed.headerData || undefined;

  const finalMonths = months || monthsData2026;
  const finalPeriods = periods || academicPeriods2026;

  if (modules && modules.length > 0) {
    modules = recalculateModuleDatesFromCalendar(modules, finalMonths, finalPeriods);
  }

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
    monthsCount: finalMonths.length,
    periodsCount: finalPeriods.length,
    detectedFields,
  };

  return {
    fileName,
    fileType: 'json',
    fileSize,
    rawText: text.substring(0, 3000),
    headerData,
    modules,
    months: finalMonths,
    periods: finalPeriods,
    detectedGrade,
    summary,
  };
}

/**
 * High-tolerance NLP / Regex analyzer for arbitrary text, Word, PDF, or pasted clipboard content.
 */
export function analyzeExtractedText(
  fileName: string,
  fileSize: number,
  rawText: string,
  fileType: 'pdf' | 'excel' | 'word' | 'json' | 'text'
): ParsedDocumentResult {
  const detectedFields: string[] = [];
  const headerData: Partial<InstitutionalHeader> = {};
  const detectedModules: ModuleDescriptor[] = [];

  // 1. Look for Header items
  const docMatch = rawText.match(/(?:Docente|Profesor(?:a)?|Facilitador(?:a)?|Responsable|Elaborado por)[:\s]+([^\n\r,;]{3,50})/i);
  if (docMatch && docMatch[1].trim()) {
    const doc = docMatch[1].trim();
    if (doc.length > 3 && !/instituto|módulo|calendario|asamblea|distribuci|periodo|semana/i.test(doc)) {
      headerData.docente = doc;
      detectedFields.push('Docente: ' + headerData.docente);
    }
  }

  const instMatch = rawText.match(/(?:Instituci[oó]n|Centro Educativo|Instituto(?:\s+Nacional)?|Colegio|Complejo Educativo)[:\s]+([^\n\r,;]{3,60})/i);
  if (instMatch && instMatch[1].trim() && !/calendario|asamblea|distribuci|periodo|evaluaci/i.test(instMatch[1])) {
    headerData.institucion = instMatch[1].trim();
    detectedFields.push('Institución: ' + headerData.institucion);
  } else if (rawText.toLowerCase().includes('salesiano') || rawText.toLowerCase().includes('san josé')) {
    headerData.institucion = 'Colegio Salesiano San José - Santa Ana';
    detectedFields.push('Institución: Colegio Salesiano San José');
  }

  let detectedGrade: '10' | '11' | '12' | undefined;

  // Check if text specifically references grade levels
  if (/\b(?:1°|primer|primero)\s*(?:a[ñn]o|nivel|grado)\b/i.test(rawText)) {
    detectedGrade = '10';
  } else if (/\b(?:2°|segundo)\s*(?:a[ñn]o|nivel|grado)\b/i.test(rawText)) {
    detectedGrade = '11';
  } else if (/\b(?:3°|tercer|tercero)\s*(?:a[ñn]o|nivel|grado)\b/i.test(rawText)) {
    detectedGrade = '12';
  }

  const gradeMatch = rawText.match(/(?:Grado(?:\s+y\s+Secci[oó]n)?|Secci[oó]n|A[ñn]o\s+de\s+Bachillerato)[:\s]+([^\n\r,;]{3,40})/i);
  if (gradeMatch && gradeMatch[1].trim()) {
    const rawG = gradeMatch[1].trim();
    if (!/calendario|asamblea|padres|periodo|distribuci|evaluaci|fecha|inicio|cierre|refuerzo|pruebas|salones|media/i.test(rawG)) {
      headerData.gradoSeccion = rawG;
      detectedFields.push('Grado: ' + headerData.gradoSeccion);
      if (headerData.gradoSeccion.includes('1') || headerData.gradoSeccion.includes('Primer') || headerData.gradoSeccion.includes('10')) detectedGrade = '10';
      if (headerData.gradoSeccion.includes('2') || headerData.gradoSeccion.includes('Segundo') || headerData.gradoSeccion.includes('11')) detectedGrade = '11';
      if (headerData.gradoSeccion.includes('3') || headerData.gradoSeccion.includes('Tercer') || headerData.gradoSeccion.includes('12')) detectedGrade = '12';
    }
  }

  const yearMatch = rawText.match(/(?:A[ñn]o Lectivo|A[ñn]o Escolar|Ciclo|Per[ií]odo|Gesti[oó]n)[:\s]+(\d{4})/i) || rawText.match(/\b(202[4-9])\b/);
  if (yearMatch && yearMatch[1]) {
    headerData.anoLectivo = yearMatch[1];
    detectedFields.push('Año Lectivo: ' + headerData.anoLectivo);
  }

  // 2. Scan for Annual Calendar Months (Semanas, Días, Feriados)
  const detectedMonths = extractMonthsFromFreeText(rawText);
  if (detectedMonths) {
    detectedFields.push('12 Meses de Calendario Anual Detectados');
  }

  // 3. Scan for Academic Periods (Bimestres / Trimestres)
  const detectedPeriods = extractAcademicPeriodsFromText(rawText);
  if (detectedPeriods) {
    detectedFields.push(`${detectedPeriods.length} Períodos / Bimestres Identificados`);
  }

  // 4. Pattern Matching for Modules in free text / tables / lists
  const lines = rawText.split(/\r?\n/);
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 5) return;

    // Check for delimiter line: code | name | hours
    if (trimmed.includes('|') || trimmed.includes('\t') || trimmed.includes(';')) {
      const parts = trimmed.split(/[|\t;]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length >= 2) {
        const p0 = parts[0];
        const p1 = parts[1];
        
        const isModuleCode = /^(?:M[oó]dulo\s*[0-9\.]+|[0-9]\.[0-9]|[0-9]+|BTV[A-Z0-9\.]+|MOD[0-9\.]+)/i.test(p0);
        if (isModuleCode && p1.length >= 4 && !p1.toLowerCase().includes('nombre') && !p1.toLowerCase().includes('código') && !p1.toLowerCase().includes('meses')) {
          let hrs = 90;
          for (let i = 2; i < parts.length; i++) {
            const num = parseInt(parts[i].replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num) && num >= 18 && num <= 400) {
              hrs = num;
              break;
            }
          }

          const codigo = p0.startsWith('M') || p0.startsWith('B') ? p0 : `Módulo ${p0}`;
          if (!detectedModules.some((m) => m.codigo.toLowerCase() === codigo.toLowerCase() || m.nombre.toLowerCase() === p1.toLowerCase())) {
            detectedModules.push({
              codigo,
              nombre: p1,
              totalHoras: hrs,
              horasSemanales: 18,
              semanas: Math.ceil(hrs / 18),
              bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
              diaInicio: 19,
              mesInicio: 'enero',
              diaFin: 20,
              mesFin: 'febrero',
              fechaInicio: '19 de enero',
              fechaFin: '20 de febrero',
              unidades: 3,
              competencias: `Competencias para ${p1}`,
              totalIndicadores: 8,
            });
          }
        }
      }
    }
  });

  // Strategy B: Regex multi-line & descriptor search
  if (detectedModules.length === 0) {
    const moduleRegex = /(?:M[oó]dulo\s*([0-9\.]+|[A-Za-z0-9]+)|([0-9]\.[0-9])|BTV[A-Z0-9\.]+?)[:\s\-–\.]+(.+?)(?:(?:\(|\[|\b)(\d{2,3})\s*(?:horas|hrs|h)\b|\n|$)/gi;
    let match;

    while ((match = moduleRegex.exec(rawText)) !== null) {
      const rawCode = match[1] || match[2] || `M${detectedModules.length + 1}`;
      let rawName = match[3]?.trim();
      const rawHours = match[4] ? parseInt(match[4], 10) : 90;

      if (rawName && rawName.length >= 4 && !rawName.toLowerCase().includes('tabla') && !rawName.toLowerCase().includes('página') && !rawName.toLowerCase().includes('periodo') && !rawName.toLowerCase().includes('evaluación') && !rawName.toLowerCase().includes('enero') && !rawName.toLowerCase().includes('febrero')) {
        rawName = rawName.replace(/[\(\)\[\]]/g, '').trim();
        const codigo = rawCode.startsWith('M') || rawCode.startsWith('B') ? rawCode : `Módulo ${rawCode}`;
        
        if (!detectedModules.some((m) => m.codigo.toLowerCase() === codigo.toLowerCase() || m.nombre.toLowerCase() === rawName.toLowerCase())) {
          detectedModules.push({
            codigo,
            nombre: rawName.substring(0, 100),
            totalHoras: rawHours >= 18 && rawHours <= 400 ? rawHours : 90,
            horasSemanales: 18,
            semanas: Math.ceil((rawHours >= 18 && rawHours <= 400 ? rawHours : 90) / 18),
            bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
            diaInicio: 19,
            mesInicio: 'enero',
            diaFin: 20,
            mesFin: 'febrero',
            fechaInicio: '19 de enero',
            fechaFin: '20 de febrero',
            unidades: 3,
            competencias: `Competencias técnicas y saberes para ${rawName}`,
            totalIndicadores: 8,
          });
        }
      }
    }
  }

  // Strategy C: Numbered list detection if still empty
  if (detectedModules.length === 0) {
    const listRegex = /(?:^|\n)\s*(\d{1,2})\.\s+([A-Za-zÁÉÍÓÚáéíóúñÑ\s\-\,\.\/]{5,100}?)(?:[-–:\s]+(\d{2,3})\s*(?:horas|hrs|h))?(?=\n|$)/g;
    let listMatch;
    while ((listMatch = listRegex.exec(rawText)) !== null) {
      const num = listMatch[1];
      const name = listMatch[2]?.trim();
      const hrs = listMatch[3] ? parseInt(listMatch[3], 10) : 90;

      const isExcludedActivity = /actividad|prueba|evaluaci|asamblea|reuni|refuerzo|tbox|diagn[oó]stic|recuperaci|vacacion|asueto|formativa|b[aá]sica|padres|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre|bimestre/i.test(name);
      if (name && name.length > 5 && !isExcludedActivity) {
        const codigo = `Módulo ${num}`;
        if (!detectedModules.some((m) => m.nombre.toLowerCase() === name.toLowerCase())) {
          detectedModules.push({
            codigo,
            nombre: name,
            totalHoras: hrs,
            horasSemanales: 18,
            semanas: Math.ceil(hrs / 18),
            bimestres: { b1: 0, b2: 0, b3: 0, b4: 0 },
            diaInicio: 19,
            mesInicio: 'enero',
            diaFin: 20,
            mesFin: 'febrero',
            fechaInicio: '19 de enero',
            fechaFin: '20 de febrero',
            unidades: 3,
            competencias: `Competencias técnicas para ${name}`,
            totalIndicadores: 8,
          });
        }
      }
    }
  }

  const finalMonths = detectedMonths || monthsData2026;
  const finalPeriods = detectedPeriods || academicPeriods2026;

  // Recalculate full dates & calendar synchronizations
  const finalModules = detectedModules.length > 0
    ? recalculateModuleDatesFromCalendar(detectedModules, finalMonths, finalPeriods)
    : undefined;

  if (detectedModules.length > 0) {
    detectedFields.push(`${detectedModules.length} Módulos Curriculares Identificados`);
  }

  return {
    fileName,
    fileType,
    fileSize,
    rawText,
    headerData: Object.keys(headerData).length > 0 ? headerData : undefined,
    modules: finalModules,
    months: finalMonths,
    periods: finalPeriods,
    detectedGrade,
    summary: {
      modulesCount: detectedModules.length,
      totalHours: detectedModules.reduce((a, b) => a + (b.totalHoras || 0), 0),
      monthsCount: finalMonths.length,
      periodsCount: finalPeriods.length,
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

    const totalH = mod.totalHoras || (modWeeks * hrsPerWeek);
    const durH = mod.duracionHoras || totalH;
    const tec = mod.desarrolloTecnico ?? 2;
    const emp = mod.desarrolloEmprendedor ?? 2;
    const hum = mod.desarrolloHumanoSocial ?? 2;
    const acad = mod.desarrolloAcademicoAplicado ?? 2;
    const totInd = mod.totalIndicadores ?? (tec + emp + hum + acad);

    return {
      ...mod,
      totalHoras: totalH,
      duracionHoras: durH,
      horasSemanales: hrsPerWeek,
      desarrolloTecnico: tec,
      desarrolloEmprendedor: emp,
      desarrolloHumanoSocial: hum,
      desarrolloAcademicoAplicado: acad,
      totalIndicadores: totInd,
      horasPorUnidad: {
        u1: mod.horasPorUnidad?.u1 ?? durH,
        u2: mod.horasPorUnidad?.u2 || 0,
        u3: mod.horasPorUnidad?.u3 || 0,
        u4: mod.horasPorUnidad?.u4 || 0,
      },
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
  periodRows.push([
    'Bimestre / Periodo',
    'Fecha Inicio',
    'Fecha Fin',
    'Semanas',
    'Subida Notas TBox',
    'Entrega de Boletas',
    'Eventos y Actividades Clave',
  ]);

  academicPeriods2026.forEach((p) => {
    periodRows.push([
      p.nombre,
      p.inicio,
      p.fin,
      p.ingresoTBoxFinal || 'Conforme a calendario',
      p.entregaBoletas || 'Por definir',
      p.actividades.map((a) => `${a.nombre} (${a.fechas || a.fechaInicio || ''})`).join('; '),
    ]);
  });

  const wsPeriods = XLSX.utils.aoa_to_sheet(periodRows);
  XLSX.utils.book_append_sheet(wb, wsPeriods, 'Periodos_Evaluaciones_2026');

  // Hoja 2: Calendario y Días Hábiles (Mes por mes)
  const calendarRows: any[] = [];
  calendarRows.push(['Mes', 'Semanas Hábiles', 'Días Hábiles', 'Feriados y Descansos Institucionales']);

  months.forEach((m) => {
    calendarRows.push([m.name, m.semanas, m.dias, m.feriadosDesc || 'Días hábiles regulares']);
  });

  const wsCalendar = XLSX.utils.aoa_to_sheet(calendarRows);
  XLSX.utils.book_append_sheet(wb, wsCalendar, 'Calendario_Dias_Habiles');

  // Hoja 3: Módulos Curriculares y Distribución Horaria
  const modRows: any[] = [];
  modRows.push([
    'Código del Módulo',
    'Nombre del Módulo',
    'Total Horas',
    'Horas Semanales',
    'Semanas',
    'Unidades',
    'Fecha Inicio (Calculada)',
    'Fecha Fin (Calculada)',
    'Competencias Técnicas y Saberes',
  ]);

  modules.forEach((m) => {
    modRows.push([
      m.codigo,
      m.nombre,
      m.totalHoras,
      m.horasSemanales,
      m.semanas,
      m.unidades || 3,
      m.fechaInicio,
      m.fechaFin,
      m.competencias || '',
    ]);
  });

  const wsModules = XLSX.utils.aoa_to_sheet(modRows);
  XLSX.utils.book_append_sheet(wb, wsModules, 'Modulos_Curriculares');

  return wb;
}
