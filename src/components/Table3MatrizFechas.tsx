import React from 'react';
import { ModuleDescriptor } from '../types';
import { Calendar, Edit3 } from 'lucide-react';

interface Table3Props {
  modules: ModuleDescriptor[];
  isEditMode?: boolean;
  onUpdateModules?: (newModules: ModuleDescriptor[]) => void;
  onSelectModule?: (mod: ModuleDescriptor) => void;
}

const MONTH_KEYS = [
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
];

export const Table3MatrizFechas: React.FC<Table3Props> = ({
  modules,
  isEditMode = false,
  onUpdateModules,
  onSelectModule,
}) => {
  const handleDateChange = (
    index: number,
    field: 'diaInicio' | 'mesInicio' | 'diaFin' | 'mesFin' | 'fechaInicio' | 'fechaFin',
    val: any
  ) => {
    if (!onUpdateModules) return;
    const updated = [...modules];
    const item = { ...updated[index], [field]: val };

    if (field === 'diaInicio' || field === 'mesInicio') {
      item.fechaInicio = `${item.diaInicio} de ${item.mesInicio}`;
    }
    if (field === 'diaFin' || field === 'mesFin') {
      item.fechaFin = `${item.diaFin} de ${item.mesFin}`;
    }

    updated[index] = item;
    onUpdateModules(updated);
  };

  return (
    <div id="section-tabla-3" className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-8">
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs">
            3
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span>DESARROLLO MÓDULOS · MATRIZ DE FECHAS (INICIO / FIN)</span>
              {isEditMode && (
                <span className="text-[11px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                  Edición de Fechas y Cronograma
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">
              Secuenciación correlativa de módulos técnicos en semanas lectivas efectivas
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-center border-collapse text-xs">
          <thead>
            {/* Super header with Month names */}
            <tr className="bg-slate-100 text-slate-800 border-b border-slate-200 font-bold">
              <th rowSpan={2} className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 bg-slate-200/60 min-w-[95px]">
                MÓDULOS
              </th>
              {MONTH_KEYS.map((m) => (
                <th key={m} colSpan={2} className="py-2 px-1 border-r border-slate-200 uppercase tracking-wide text-[11px]">
                  {m}
                </th>
              ))}
            </tr>
            {/* Sub header INI / FIN */}
            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[10px] font-semibold">
              {MONTH_KEYS.map((m) => (
                <React.Fragment key={m}>
                  <th className="py-1 px-1 border-r border-slate-200 w-8 bg-slate-100/50">INI</th>
                  <th className="py-1 px-1 border-r border-slate-200 w-8 bg-slate-100/50">FIN</th>
                </React.Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {modules.map((m, idx) => {
              const startIdx = MONTH_KEYS.indexOf(m.mesInicio?.toLowerCase());
              const endIdx = MONTH_KEYS.indexOf(m.mesFin?.toLowerCase());

              return (
                <tr
                  key={m.codigo}
                  onClick={() => onSelectModule && onSelectModule(m)}
                  className={`border-b border-slate-200 transition-colors cursor-pointer ${
                    idx % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <td className="py-2.5 px-3 text-left font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap flex items-center justify-between">
                    <span>{m.codigo}</span>
                    {isEditMode && <Edit3 className="w-3 h-3 text-slate-400" />}
                  </td>

                  {MONTH_KEYS.map((mes, mesIdx) => {
                    const isStartMonth = m.mesInicio?.toLowerCase() === mes;
                    const isEndMonth = m.mesFin?.toLowerCase() === mes;
                    const isBetween = startIdx !== -1 && endIdx !== -1 && mesIdx >= startIdx && mesIdx <= endIdx;

                    return (
                      <React.Fragment key={mes}>
                        {/* INI cell */}
                        <td
                          className={`py-2 px-1 border-r border-slate-200 font-bold transition-all ${
                            isStartMonth
                              ? 'bg-blue-600 text-white shadow-inner'
                              : isBetween && !isStartMonth
                              ? 'bg-sky-50 text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {isStartMonth ? (
                            isEditMode ? (
                              <input
                                type="number"
                                value={m.diaInicio}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleDateChange(idx, 'diaInicio', Number(e.target.value))}
                                className="w-8 text-center text-xs py-0.5 bg-blue-700 text-white rounded font-bold"
                              />
                            ) : (
                              m.diaInicio
                            )
                          ) : (
                            ''
                          )}
                        </td>

                        {/* FIN cell */}
                        <td
                          className={`py-2 px-1 border-r border-slate-200 font-bold transition-all ${
                            isEndMonth
                              ? 'bg-emerald-600 text-white shadow-inner'
                              : isBetween && !isEndMonth
                              ? 'bg-sky-50 text-slate-300'
                              : 'text-slate-400'
                          }`}
                        >
                          {isEndMonth ? (
                            isEditMode ? (
                              <input
                                type="number"
                                value={m.diaFin}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleDateChange(idx, 'diaFin', Number(e.target.value))}
                                className="w-8 text-center text-xs py-0.5 bg-emerald-700 text-white rounded font-bold"
                              />
                            ) : (
                              m.diaFin
                            )
                          ) : (
                            ''
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Module quick legend with start/end details */}
      <div className="bg-slate-50/70 border-t border-slate-200 p-4">
        <div className="text-xs font-semibold text-slate-700 mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <span>Resumen de Fechas Reales de Ejecución Curricular:</span>
          </div>
          <span className="text-[11px] text-slate-500">
            Azul: Fecha de Inicio · Verde: Fecha de Fin
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {modules.map((m, idx) => (
            <div
              key={m.codigo}
              onClick={() => onSelectModule && onSelectModule(m)}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer text-xs"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></span>
                <span className="font-bold text-slate-800">{m.codigo}</span>
                <span className="text-slate-500 truncate max-w-[120px]" title={m.nombre}>
                  {m.nombre}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 font-medium whitespace-nowrap shrink-0 pl-1">
                {isEditMode ? (
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={m.fechaInicio}
                      onChange={(e) => handleDateChange(idx, 'fechaInicio', e.target.value)}
                      className="w-20 px-1 py-0.5 text-[10px] border border-slate-300 rounded font-semibold text-blue-800"
                    />
                    <span>→</span>
                    <input
                      type="text"
                      value={m.fechaFin}
                      onChange={(e) => handleDateChange(idx, 'fechaFin', e.target.value)}
                      className="w-20 px-1 py-0.5 text-[10px] border border-slate-300 rounded font-semibold text-emerald-800"
                    />
                  </div>
                ) : (
                  <>
                    <span className="text-blue-800 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{m.fechaInicio}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-800 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{m.fechaFin}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
