import { InstitutionalHeader, MonthStats, ModuleDescriptor } from '../types';

export function generateJornalizacionMarkdown(
  header: InstitutionalHeader,
  months: MonthStats[],
  modules: ModuleDescriptor[]
): string {
  const totalSemanas = months.reduce((acc, m) => acc + m.semanas, 0);
  const totalDias = months.reduce((acc, m) => acc + m.dias, 0);
  const totalHorasAnuales = modules.reduce((acc, m) => acc + m.totalHoras, 0);

  // Month names for Table 1 and Table 3
  const monthCols = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre'];

  // Table 1 rows
  const t1Meses = monthCols.map((m) => m).join(' | ');
  const t1Semanas = monthCols.map((m) => {
    const found = months.find((item) => item.month === m);
    return found ? found.semanas : 0;
  }).join(' | ');
  const t1Dias = monthCols.map((m) => {
    const found = months.find((item) => item.month === m);
    return found ? found.dias : 0;
  }).join(' | ');

  // Table 2 rows
  const t2Rows = modules.map((m) => {
    return `| ${m.codigo} | ${m.desarrolloTecnico} | ${m.desarrolloEmprendedor} | ${m.desarrolloHumanoSocial} | ${m.desarrolloAcademicoAplicado} | ${m.totalIndicadores} | ${m.horasSemanales} | ${m.totalHoras} | ${m.horasPorUnidad.u1} | | | | ${m.totalHoras} |`;
  }).join('\n');

  // Table 3 headers & rows (INI / FIN for each month)
  const t3HeaderMonths = monthCols.map((m) => ` ${m.toUpperCase()} `).join(' | ');
  const t3HeaderSub = monthCols.map(() => ' INI | FIN ').join('|');
  const t3Separator = monthCols.map(() => ' :---: | :---: ').join('|');

  const t3Rows = modules.map((m) => {
    const cols = monthCols.map((mes) => {
      let iniVal = ' ';
      let finVal = ' ';

      if (m.mesInicio === mes) {
        iniVal = m.diaInicio.toString();
      }
      if (m.mesFin === mes) {
        finVal = m.diaFin.toString();
      }
      return `${iniVal.padEnd(3)} | ${finVal.padEnd(3)}`;
    }).join(' | ');

    return `| ${m.codigo.padEnd(10)} | ${cols} |`;
  }).join('\n');

  // Table 4 rows
  const t4Rows = modules.map((m) => {
    return `| ${m.codigo} | ${m.nombre} |`;
  }).join('\n');

  return `# ${header.institucion.toUpperCase()}

## ${header.tituloDocumento}

**Docente:** ${header.docente}  
**Grado y sección:** ${header.gradoSeccion}  
**Año escolar lectivo:** ${header.anoLectivo}  

---

### TABLA 1: DISTRIBUCIÓN DE SEMANAS LABORALES Y DÍAS LECTIVOS - ${header.anoLectivo}

| Meses | ${t1Meses} | Total |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Semanas** | ${t1Semanas} | **${totalSemanas}** |
| **Días** | ${t1Dias} | **${totalDias}** |

---

### TABLA 2: CARGA HORARIA DE MÓDULOS Y DESGLOSE DE COMPETENCIAS

| Módulos | DESARROLLO TÉCNICO | DESARROLLO EMPRENDEDOR | DESARROLLO HUMANO SOCIAL | DESARROLLO ACADÉMICO APLICADO | Total de Indicadores | Horas semanales | Horas anuales | Horas clase por unidad: 1 | Horas clase por unidad: 2 | Horas clase por unidad: 3 | Horas clase por unidad: 4 | Total Horas |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
${t2Rows}
| **TOTAL** | | | | | | | **${totalHorasAnuales}** | | | | | **${totalHorasAnuales}** |

---

### TABLA 3: MATRIZ DE PROGRAMACIÓN Y DESARROLLO DE MÓDULOS (FECHAS DE INICIO Y FIN POR MES)

| MÓDULOS | ${t3HeaderMonths} |
| :--- | ${monthCols.map(() => ' colspan="2" style="text-align:center;" | ').join('')}
| | ${t3HeaderSub} |
| :--- | ${t3Separator} |
${t3Rows}

---

### TABLA 4: CÓDIGOS Y NOMBRES OFICIALES DE MÓDULOS (APÉNDICE)

| CÓDIGO | NOMBRE DEL MÓDULO |
| :--- | :--- |
${t4Rows}

> **${header.notaEvaluativa}**

---
*Documento generado con base en los Descriptores de Módulo oficiales del MINED y el Calendario Académico Institucional ${header.anoLectivo}.*
`;
}
