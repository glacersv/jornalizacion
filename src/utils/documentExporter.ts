import { InstitutionalHeader, MonthStats, ModuleDescriptor } from '../types';
import saveAs from 'file-saver';

/**
 * Generates an official HTML Document format that MS Word and Google Docs open with full layout styling,
 * table borders, color shading, and print typography.
 */
export function exportToWordDocument(
  header: InstitutionalHeader,
  months: MonthStats[],
  modules: ModuleDescriptor[]
) {
  const totalWeeks = months.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);
  const totalDays = months.reduce((acc, m) => acc + (Number(m.dias) || 0), 0);

  const totalTec = modules.reduce((acc, m) => acc + (Number(m.desarrolloTecnico) || 0), 0);
  const totalEmp = modules.reduce((acc, m) => acc + (Number(m.desarrolloEmprendedor) || 0), 0);
  const totalHum = modules.reduce((acc, m) => acc + (Number(m.desarrolloHumanoSocial) || 0), 0);
  const totalAcad = modules.reduce((acc, m) => acc + (Number(m.desarrolloAcademicoAplicado) || 0), 0);
  const grandTotalIndicadores = modules.reduce((acc, m) => acc + (Number(m.totalIndicadores) || 0), 0);
  const grandTotalHoras = modules.reduce((acc, m) => acc + (Number(m.duracionHoras) || 0), 0);
  const grandTotalSemanas = modules.reduce((acc, m) => acc + (Number(m.semanas) || 0), 0);

  const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${header.tituloDocumento} - ${header.gradoSeccion}</title>
<style>
  @page {
    size: 8.5in 11in;
    margin: 0.75in 0.75in 0.75in 0.75in;
    mso-header-margin: 0.5in;
    mso-footer-margin: 0.5in;
  }
  body {
    font-family: 'Calibri', 'Arial', sans-serif;
    font-size: 10.5pt;
    line-height: 1.3;
    color: #1e293b;
  }
  h1 {
    font-size: 15pt;
    font-weight: bold;
    text-align: center;
    color: #0f172a;
    margin: 0 0 4px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  h2 {
    font-size: 11.5pt;
    font-weight: bold;
    color: #0369a1;
    margin: 16px 0 6px 0;
    border-bottom: 2px solid #0284c7;
    padding-bottom: 3px;
    text-transform: uppercase;
  }
  .sub-header {
    text-align: center;
    font-size: 10pt;
    color: #475569;
    margin-bottom: 14px;
    font-weight: 600;
  }
  .info-box {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .info-box td {
    padding: 5px 8px;
    font-size: 10pt;
    border: 1px solid #cbd5e1;
  }
  .info-label {
    background-color: #f1f5f9;
    font-weight: bold;
    color: #334155;
    width: 25%;
  }
  .info-val {
    background-color: #ffffff;
    color: #0f172a;
    width: 75%;
  }
  table.data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 14px;
    font-size: 9.5pt;
  }
  table.data-table th, table.data-table td {
    border: 1px solid #94a3b8;
    padding: 5px 6px;
    text-align: center;
    vertical-align: middle;
  }
  table.data-table th {
    background-color: #0284c7;
    color: #ffffff;
    font-weight: bold;
    font-size: 9pt;
    text-transform: uppercase;
  }
  table.data-table th.sub-th {
    background-color: #38bdf8;
    color: #0f172a;
  }
  table.data-table tr.total-row td {
    background-color: #e0f2fe;
    font-weight: bold;
    color: #0369a1;
  }
  .text-left {
    text-align: left !important;
  }
  .bold {
    font-weight: bold;
  }
  .nota-box {
    background-color: #fefce8;
    border: 1px solid #fef08a;
    border-left: 4px solid #ca8a04;
    padding: 8px 12px;
    font-size: 8.5pt;
    color: #854d0e;
    margin-top: 14px;
    margin-bottom: 24px;
  }
  .signatures {
    width: 100%;
    margin-top: 40px;
    border-collapse: collapse;
  }
  .signatures td {
    width: 50%;
    text-align: center;
    padding: 20px;
    vertical-align: top;
  }
  .signature-line {
    border-top: 1px solid #000000;
    width: 80%;
    margin: 40px auto 6px auto;
  }
  .holidays-list {
    margin-top: 8px;
    margin-bottom: 16px;
    font-size: 9pt;
  }
  .holidays-list p {
    margin: 3px 0;
  }
</style>
</head>
<body>

  <!-- ENCABEZADO INSTITUCIONAL -->
  <h1>${header.institucion}</h1>
  <div class="sub-header">${header.tituloDocumento} · MINED EL SALVADOR</div>

  <table class="info-box">
    <tr>
      <td class="info-label">Docente Responsable:</td>
      <td class="info-val"><strong>${header.docente}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Grado y Especialidad:</td>
      <td class="info-val"><strong>${header.gradoSeccion}</strong></td>
    </tr>
    <tr>
      <td class="info-label">Año Escolar Lectivo:</td>
      <td class="info-val">${header.anoLectivo} &nbsp;|&nbsp; <strong>Carga Semanal Especialidad:</strong> ${header.horasSemanalesModulo} Horas / Semana</td>
    </tr>
  </table>

  <!-- 1. SEMANAS LABORALES Y DÍAS LECTIVOS -->
  <h2>1. Semanas Laborales y Días Lectivos - ${header.anoLectivo}</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 16%;">Meses</th>
        ${months.map((m) => `<th>${m.name}</th>`).join('')}
        <th style="background-color: #0369a1;">Total</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="bold text-left" style="background-color: #f8fafc;">Semanas</td>
        ${months.map((m) => `<td>${m.semanas}</td>`).join('')}
        <td class="bold" style="background-color: #e0f2fe; color: #0369a1;">${totalWeeks}</td>
      </tr>
      <tr>
        <td class="bold text-left" style="background-color: #f8fafc;">Días Lectivos</td>
        ${months.map((m) => `<td>${m.dias}</td>`).join('')}
        <td class="bold" style="background-color: #e0f2fe; color: #0369a1;">${totalDays}</td>
      </tr>
    </tbody>
  </table>

  <!-- DÍAS CONMEMORATIVOS Y SUSPENSIONES -->
  <div class="holidays-list">
    <strong style="color: #0369a1;">Detalle de descansos, pausas pedagógicas y actividades institucionales:</strong>
    ${months
      .filter((m) => m.feriadosDesc)
      .map((m) => `<p><strong>${m.name}:</strong> ${m.feriadosDesc}</p>`)
      .join('')}
  </div>

  <!-- 2. MATRIZ DE COMPETENCIAS -->
  <h2>2. Matriz de Competencias e Indicadores de Logro</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th rowspan="2" style="width: 10%;">Cód. Módulo</th>
        <th rowspan="2" style="width: 25%;">Nombre del Módulo Técnico</th>
        <th rowspan="2" style="width: 7%;">Horas Tot.</th>
        <th rowspan="2" style="width: 6%;">Sem.</th>
        <th colspan="4" class="sub-th" style="background-color: #0284c7;">Desglose de Competencias (Indicadores)</th>
        <th rowspan="2" style="width: 7%;">Total Ind.</th>
        <th colspan="2" class="sub-th" style="background-color: #0284c7;">Dosificación Horas</th>
      </tr>
      <tr>
        <th style="background-color: #38bdf8; font-size: 8pt;">Técnicas</th>
        <th style="background-color: #38bdf8; font-size: 8pt;">Emprend.</th>
        <th style="background-color: #38bdf8; font-size: 8pt;">Hum-Soc.</th>
        <th style="background-color: #38bdf8; font-size: 8pt;">Acad. Apl.</th>
        <th style="background-color: #38bdf8; font-size: 8pt;">Unidad 1</th>
        <th style="background-color: #38bdf8; font-size: 8pt;">Total H.</th>
      </tr>
    </thead>
    <tbody>
      ${modules
        .map(
          (m) => `
        <tr>
          <td class="bold" style="background-color: #f8fafc;">${m.codigo}</td>
          <td class="text-left">${m.nombre}</td>
          <td class="bold">${m.duracionHoras}h</td>
          <td>${m.semanas}</td>
          <td>${m.desarrolloTecnico}</td>
          <td>${m.desarrolloEmprendedor}</td>
          <td>${m.desarrolloHumanoSocial}</td>
          <td>${m.desarrolloAcademicoAplicado}</td>
          <td class="bold" style="background-color: #f1f5f9;">${m.totalIndicadores}</td>
          <td>${m.horasPorUnidad.u1}h</td>
          <td class="bold">${m.totalHoras}h</td>
        </tr>
      `
        )
        .join('')}
      <tr class="total-row">
        <td colspan="2" class="text-left bold">TOTALES GENERALES</td>
        <td>${grandTotalHoras}h</td>
        <td>${grandTotalSemanas}</td>
        <td>${totalTec}</td>
        <td>${totalEmp}</td>
        <td>${totalHum}</td>
        <td>${totalAcad}</td>
        <td>${grandTotalIndicadores}</td>
        <td>${grandTotalHoras}h</td>
        <td>${grandTotalHoras}h</td>
      </tr>
    </tbody>
  </table>

  <!-- 3. TEMPORIZACIÓN DE MÓDULOS -->
  <h2>3. Temporización y Cronograma de Ejecución de Módulos</h2>
  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 12%;">Código</th>
        <th style="width: 32%;">Nombre del Módulo</th>
        <th style="width: 8%;">Semanas</th>
        <th style="width: 8%;">Horas</th>
        <th style="width: 20%;">Fecha de Inicio</th>
        <th style="width: 20%;">Fecha de Finalización</th>
      </tr>
    </thead>
    <tbody>
      ${modules
        .map(
          (m) => `
        <tr>
          <td class="bold" style="background-color: #f8fafc;">${m.codigo}</td>
          <td class="text-left">${m.nombre}</td>
          <td class="bold">${m.semanas} sem</td>
          <td>${m.duracionHoras}h</td>
          <td>${m.fechaInicio}</td>
          <td>${m.fechaFin}</td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>

  <!-- NOTA EVALUATIVA -->
  <div class="nota-box">
    <strong>DISPOSICIÓN EVALUATIVA:</strong><br>
    ${header.notaEvaluativa}
  </div>

  <!-- FIRMAS -->
  <table class="signatures">
    <tr>
      <td>
        <div class="signature-line"></div>
        <strong>${header.docente}</strong><br>
        Docente de Especialidad Técnica
      </td>
      <td>
        <div class="signature-line"></div>
        <strong>Coordinación Académica / Dirección</strong><br>
        Colegio Salesiano San José
      </td>
    </tr>
  </table>

</body>
</html>
`;

  const blob = new Blob(['\ufeff' + htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  const fileName = `Jornalizacion_${header.gradoSeccion.replace(/[^a-zA-Z0-9]/g, '_')}_${header.anoLectivo}.doc`;
  saveAs(blob, fileName);
}
