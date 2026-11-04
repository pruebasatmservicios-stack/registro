import React, { useMemo, useState } from 'react';
import {
  exportarRegistrosACsv,
  formatearFechaHoraLegible,
  ModoExportacionCsv,
} from '../services/exportCsv';
import { RegistroAcceso } from '../types/registro';

interface RegistrosListProps {
  registros: RegistroAcceso[];
  onEliminar: (id: string) => void;
}

/**
 * Convierte un objeto Date a string YYYY-MM-DD en hora local para inputs type="date".
 */
function obtenerFechaInputLocal(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export const RegistrosList: React.FC<RegistrosListProps> = ({ registros, onEliminar }) => {
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [modoCsv, setModoCsv] = useState<ModoExportacionCsv>('filas_por_tecnico');
  const [registroAEliminar, setRegistroAEliminar] = useState<RegistroAcceso | null>(null);

  const registrosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase('es-CL');

    let timestampDesde: number | null = null;
    if (fechaDesde) {
      const [anio, mes, dia] = fechaDesde.split('-').map(Number);
      timestampDesde = new Date(anio, mes - 1, dia, 0, 0, 0, 0).getTime();
    }

    let timestampHasta: number | null = null;
    if (fechaHasta) {
      const [anio, mes, dia] = fechaHasta.split('-').map(Number);
      timestampHasta = new Date(anio, mes - 1, dia, 23, 59, 59, 999).getTime();
    }

    return registros.filter((reg) => {
      const tsRegistro = new Date(reg.fechaHora).getTime();

      if (timestampDesde !== null && tsRegistro < timestampDesde) {
        return false;
      }
      if (timestampHasta !== null && tsRegistro > timestampHasta) {
        return false;
      }

      if (!termino) return true;

      const fechaLegible = formatearFechaHoraLegible(reg.fechaHora).toLocaleLowerCase('es-CL');
      const camposTecnicos = reg.tecnicos.flatMap((t) => [
        t.nombre,
        t.apellido,
        `${t.nombre} ${t.apellido}`,
        t.rut,
        t.rut.replace(/[.-]/g, ''),
      ]);

      const campos = [
        reg.numeroAtm,
        reg.nombreLocal,
        reg.empresa,
        fechaLegible,
        ...camposTecnicos,
        ...reg.patentes,
      ];

      return campos.some((campo) => campo.toLocaleLowerCase('es-CL').includes(termino));
    });
  }, [registros, busqueda, fechaDesde, fechaHasta]);

  const confirmarEliminacion = () => {
    if (!registroAEliminar) return;
    onEliminar(registroAEliminar.id);
    setRegistroAEliminar(null);
  };

  const aplicarRangoHoy = () => {
    const hoy = obtenerFechaInputLocal(new Date());
    setFechaDesde(hoy);
    setFechaHasta(hoy);
  };

  const aplicarUltimos7Dias = () => {
    const hoy = new Date();
    const hace7 = new Date();
    hace7.setDate(hoy.getDate() - 6);
    setFechaDesde(obtenerFechaInputLocal(hace7));
    setFechaHasta(obtenerFechaInputLocal(hoy));
  };

  const aplicarEsteMes = () => {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    setFechaDesde(obtenerFechaInputLocal(inicioMes));
    setFechaHasta(obtenerFechaInputLocal(hoy));
  };

  const limpiarFechas = () => {
    setFechaDesde('');
    setFechaHasta('');
  };

  const hayFiltroActivo = Boolean(busqueda || fechaDesde || fechaHasta);

  return (
    <section
      aria-labelledby="titulo-registros"
      className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6"
    >
      {/* Cabecera y botón exportar */}
      <div className="flex flex-col gap-3 border-b border-neutral-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 id="titulo-registros" className="text-lg font-extrabold text-[#191919]">
              Registros Guardados
            </h2>
            <span className="rounded-full bg-santander-50 px-2.5 py-0.5 text-xs font-extrabold text-santander-600 ring-1 ring-santander-200">
              {registrosFiltrados.length}
              {hayFiltroActivo ? ` / ${registros.length}` : ''}
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Ordenados del más reciente al más antiguo
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <label
              htmlFor="modo-exportacion-csv"
              className="text-xs font-bold text-neutral-600 whitespace-nowrap"
            >
              Formato Excel:
            </label>
            <select
              id="modo-exportacion-csv"
              value={modoCsv}
              onChange={(e) => setModoCsv(e.target.value as ModoExportacionCsv)}
              className="min-h-[44px] flex-1 rounded-xl border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs font-semibold text-[#191919] focus:border-santander-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-santander-500/25"
            >
              <option value="filas_por_tecnico">
                1 fila por técnico (Nombre, Apellido y RUT separados)
              </option>
              <option value="columnas_por_tecnico">
                Columnas separadas (Técnico 1, Técnico 2...)
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => exportarRegistrosACsv(registrosFiltrados, modoCsv)}
            disabled={registrosFiltrados.length === 0}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-[#191919] px-5 py-2.5 text-sm font-bold text-white shadow-xs transition-colors hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-santander-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            <svg
              className="h-5 w-5 shrink-0 text-santander-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <span>Exportar CSV ({registrosFiltrados.length})</span>
          </button>
        </div>
      </div>

      {/* Buscador y Filtro por Rango de Fechas */}
      <div className="mt-4 flex flex-col gap-3">
        {/* Buscador de texto */}
        <div>
          <label htmlFor="buscador-registros" className="sr-only">
            Buscar por N° ATM, RUT, nombre, local, empresa o patente
          </label>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              id="buscador-registros"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por N° ATM, RUT, técnico, empresa, local o patente..."
              className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-neutral-50/70 pl-11 pr-10 py-2.5 text-base text-[#191919] placeholder:text-neutral-400 transition-colors focus:border-santander-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-santander-500/25"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-500 hover:bg-neutral-200 hover:text-[#191919]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Rango de fechas */}
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="fecha-desde"
                className="text-xs font-bold tracking-wide text-neutral-700 uppercase"
              >
                Fecha desde
              </label>
              <input
                id="fecha-desde"
                type="date"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-[#191919] transition-colors focus:border-santander-500 focus:outline-none focus:ring-2 focus:ring-santander-500/25"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="fecha-hasta"
                className="text-xs font-bold tracking-wide text-neutral-700 uppercase"
              >
                Fecha hasta
              </label>
              <input
                id="fecha-hasta"
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-medium text-[#191919] transition-colors focus:border-santander-500 focus:outline-none focus:ring-2 focus:ring-santander-500/25"
              />
            </div>
          </div>

          {/* Accesos rápidos de fecha */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-neutral-500 mr-1">Rápido:</span>
              <button
                type="button"
                onClick={aplicarRangoHoy}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-santander-400 hover:bg-santander-50 hover:text-santander-600"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={aplicarUltimos7Dias}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-santander-400 hover:bg-santander-50 hover:text-santander-600"
              >
                Últimos 7 días
              </button>
              <button
                type="button"
                onClick={aplicarEsteMes}
                className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-santander-400 hover:bg-santander-50 hover:text-santander-600"
              >
                Este mes
              </button>
            </div>

            {(fechaDesde || fechaHasta) && (
              <button
                type="button"
                onClick={limpiarFechas}
                className="rounded-full bg-santander-50 px-3 py-1 text-xs font-bold text-santander-600 ring-1 ring-santander-200 transition-colors hover:bg-santander-100"
              >
                ✕ Limpiar fechas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Estado vacío */}
      {registrosFiltrados.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 px-4 py-10 text-center">
          <p className="text-base font-bold text-neutral-700">
            {registros.length === 0
              ? 'Aún no hay registros guardados'
              : 'No se encontraron coincidencias'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {registros.length === 0
              ? 'Complete el formulario superior para registrar la primera visita técnica.'
              : 'No hay registros que coincidan con los filtros o el rango de fechas seleccionado.'}
          </p>
          {hayFiltroActivo && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                limpiarFechas();
              }}
              className="mt-3 rounded-full border border-santander-500 bg-white px-4 py-1.5 text-xs font-bold text-santander-500 hover:bg-santander-50"
            >
              Ver todos los registros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Vista Móvil: Tarjetas (< md) */}
          <div className="mt-4 flex flex-col gap-3 md:hidden">
            {registrosFiltrados.map((reg) => (
              <article
                key={reg.id}
                className="flex flex-col gap-2.5 rounded-xl border border-neutral-200 border-l-4 border-l-santander-500 bg-neutral-50/60 p-3.5 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2 border-b border-neutral-200/80 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-santander-500 px-2.5 py-1 font-mono text-sm font-bold text-white">
                        ATM {reg.numeroAtm}
                      </span>
                      <span className="rounded-md bg-neutral-200/80 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                        {reg.empresa}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-medium text-neutral-500">
                      {formatearFechaHoraLegible(reg.fechaHora)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setRegistroAEliminar(reg)}
                    aria-label={`Eliminar registro de ATM ${reg.numeroAtm}`}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-700 transition-colors hover:border-santander-300 hover:bg-santander-50 hover:text-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="text-sm">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">Local: </span>
                  <span className="font-semibold text-[#191919]">{reg.nombreLocal}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">
                    Técnicos ({reg.tecnicos.length}):
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {reg.tecnicos.map((tec, idx) => (
                      <div
                        key={`${tec.rut}-${idx}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-neutral-200/80 bg-white px-2.5 py-1.5 text-sm"
                      >
                        <span className="font-semibold text-[#191919]">
                          {tec.nombre} {tec.apellido}
                        </span>
                        <span className="font-mono text-xs font-semibold text-neutral-600">
                          {tec.rut}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-neutral-500 uppercase">
                    Patentes:
                  </span>
                  {reg.patentes.map((pat) => (
                    <span
                      key={pat}
                      className="rounded-md border border-neutral-300 bg-white px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-[#191919]"
                    >
                      {pat}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {/* Vista Escritorio: Tabla (>= md) */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b-2 border-santander-500 bg-neutral-50 text-xs font-bold tracking-wider text-[#191919] uppercase">
                  <th className="py-3 pl-3 pr-2">Fecha y Hora</th>
                  <th className="px-2 py-3">N° ATM</th>
                  <th className="px-2 py-3">Local</th>
                  <th className="px-2 py-3">Empresa</th>
                  <th className="px-2 py-3">Técnicos (Nombre y RUT)</th>
                  <th className="px-2 py-3">Patentes</th>
                  <th className="py-3 pl-2 pr-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {registrosFiltrados.map((reg) => (
                  <tr key={reg.id} className="transition-colors hover:bg-santander-50/30">
                    <td className="whitespace-nowrap py-3.5 pl-3 pr-2 text-xs text-neutral-600 align-top">
                      {formatearFechaHoraLegible(reg.fechaHora)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3.5 align-top">
                      <span className="rounded-md bg-santander-500 px-2 py-1 font-mono text-xs font-bold text-white">
                        {reg.numeroAtm}
                      </span>
                    </td>
                    <td className="px-2 py-3.5 font-medium text-[#191919] align-top">
                      {reg.nombreLocal}
                    </td>
                    <td className="px-2 py-3.5 text-neutral-700 align-top">{reg.empresa}</td>
                    <td className="px-2 py-3.5 align-top">
                      <div className="flex flex-col gap-1.5">
                        {reg.tecnicos.map((tec, idx) => (
                          <div
                            key={`${tec.rut}-${idx}`}
                            className="flex flex-wrap items-center gap-2 text-xs"
                          >
                            <span className="font-semibold text-[#191919]">
                              {tec.nombre} {tec.apellido}
                            </span>
                            <span className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-neutral-700">
                              {tec.rut}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-2 py-3.5 align-top">
                      <div className="flex flex-wrap gap-1">
                        {reg.patentes.map((pat) => (
                          <span
                            key={pat}
                            className="rounded border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 font-mono text-xs font-bold text-[#191919]"
                          >
                            {pat}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3.5 pl-2 pr-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setRegistroAEliminar(reg)}
                        aria-label={`Eliminar registro de ATM ${reg.numeroAtm}`}
                        className="inline-flex min-h-[38px] items-center gap-1 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:border-santander-300 hover:bg-santander-50 hover:text-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
                      >
                        <span>Eliminar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de confirmación para eliminar registro */}
      {registroAEliminar && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmar-eliminar"
          aria-describedby="desc-confirmar-eliminar"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border-t-4 border-t-santander-500 bg-white p-5 shadow-xl">
            <h3 id="titulo-confirmar-eliminar" className="text-lg font-extrabold text-[#191919]">
              ¿Eliminar este registro?
            </h3>
            <p id="desc-confirmar-eliminar" className="mt-2 text-sm text-neutral-600">
              Se eliminará permanentemente el registro del ATM{' '}
              <span className="font-mono font-bold text-[#191919]">
                {registroAEliminar.numeroAtm}
              </span>{' '}
              ({registroAEliminar.tecnicos.map((t) => `${t.nombre} ${t.apellido}`).join(', ')}).
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                type="button"
                onClick={confirmarEliminacion}
                className="min-h-[48px] flex-1 rounded-full bg-santander-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
              >
                Sí, eliminar
              </button>
              <button
                type="button"
                onClick={() => setRegistroAEliminar(null)}
                className="min-h-[48px] flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
