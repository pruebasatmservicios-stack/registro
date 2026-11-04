import { RegistroAcceso } from '../types/registro';

export type ModoExportacionCsv = 'filas_por_tecnico' | 'columnas_por_tecnico';

/**
 * Escapa un valor para celda CSV usando punto y coma como separador.
 */
function escaparCeldaCsv(valor: string): string {
  const limpio = (valor ?? '').replace(/\r?\n|\r/g, ' ');
  if (limpio.includes(';') || limpio.includes('"') || limpio.includes(',')) {
    return `"${limpio.replace(/"/g, '""')}"`;
  }
  return limpio;
}

/**
 * Formatea una fecha ISO estrictamente como DD/MM/AAAA (ej: 04/11/2026).
 */
export function formatearFechaDDMMAAAA(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    if (Number.isNaN(fecha.getTime())) return isoString;
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
  } catch {
    return isoString;
  }
}

/**
 * Formatea la hora de una fecha ISO como HH:mm:ss (ej: 14:35:10).
 */
export function formatearHoraHHMMSS(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    if (Number.isNaN(fecha.getTime())) return '';
    const horas = String(fecha.getHours()).padStart(2, '0');
    const minutos = String(fecha.getMinutes()).padStart(2, '0');
    const segundos = String(fecha.getSeconds()).padStart(2, '0');
    return `${horas}:${minutos}:${segundos}`;
  } catch {
    return '';
  }
}

/**
 * Formatea una fecha ISO en formato legible DD/MM/AAAA HH:mm:ss para mostrar en pantalla.
 */
export function formatearFechaHoraLegible(isoString: string): string {
  const fecha = formatearFechaDDMMAAAA(isoString);
  const hora = formatearHoraHHMMSS(isoString);
  return hora ? `${fecha} ${hora}` : fecha;
}

/**
 * Genera y descarga un archivo CSV codificado en UTF-8 con BOM (\uFEFF) y separador punto y coma (;),
 * garantizando compatibilidad directa con Microsoft Excel para tildes, ñ y fechas DD/MM/AAAA.
 */
export function exportarRegistrosACsv(
  registros: RegistroAcceso[],
  modo: ModoExportacionCsv = 'filas_por_tecnico'
): void {
  if (registros.length === 0) return;

  let encabezados: string[] = [];
  let filas: string[][] = [];

  if (modo === 'filas_por_tecnico') {
    encabezados = [
      'Fecha',
      'Hora',
      'N° ATM',
      'Nombre Local',
      'Empresa',
      'N° Técnico',
      'Nombre',
      'Apellido',
      'RUT',
      'Patentes',
    ];

    filas = registros.flatMap((reg) => {
      const fechaDDMMAAAA = formatearFechaDDMMAAAA(reg.fechaHora);
      const horaHHMMSS = formatearHoraHHMMSS(reg.fechaHora);
      const patentesTexto = reg.patentes.join('-');

      return reg.tecnicos.map((tec, index) => [
        escaparCeldaCsv(fechaDDMMAAAA),
        escaparCeldaCsv(horaHHMMSS),
        escaparCeldaCsv(reg.numeroAtm),
        escaparCeldaCsv(reg.nombreLocal),
        escaparCeldaCsv(reg.empresa),
        escaparCeldaCsv(String(index + 1)),
        escaparCeldaCsv(tec.nombre),
        escaparCeldaCsv(tec.apellido),
        escaparCeldaCsv(tec.rut),
        escaparCeldaCsv(patentesTexto),
      ]);
    });
  } else {
    const maxTecnicos = Math.max(1, ...registros.map((r) => r.tecnicos.length));
    const maxPatentes = Math.max(1, ...registros.map((r) => r.patentes.length));

    const columnasTecnicos: string[] = [];
    for (let i = 1; i <= maxTecnicos; i++) {
      columnasTecnicos.push(`Nombre Técnico ${i}`, `Apellido Técnico ${i}`, `RUT Técnico ${i}`);
    }

    const columnasPatentes: string[] = [];
    for (let j = 1; j <= maxPatentes; j++) {
      columnasPatentes.push(`Patente ${j}`);
    }

    encabezados = [
      'Fecha',
      'Hora',
      'N° ATM',
      'Nombre Local',
      'Empresa',
      ...columnasTecnicos,
      ...columnasPatentes,
    ];

    filas = registros.map((reg) => {
      const celdasTecnicos: string[] = [];
      for (let i = 0; i < maxTecnicos; i++) {
        const tec = reg.tecnicos[i];
        celdasTecnicos.push(
          escaparCeldaCsv(tec ? tec.nombre : ''),
          escaparCeldaCsv(tec ? tec.apellido : ''),
          escaparCeldaCsv(tec ? tec.rut : '')
        );
      }

      const celdasPatentes: string[] = [];
      for (let j = 0; j < maxPatentes; j++) {
        celdasPatentes.push(escaparCeldaCsv(reg.patentes[j] ?? ''));
      }

      return [
        escaparCeldaCsv(formatearFechaDDMMAAAA(reg.fechaHora)),
        escaparCeldaCsv(formatearHoraHHMMSS(reg.fechaHora)),
        escaparCeldaCsv(reg.numeroAtm),
        escaparCeldaCsv(reg.nombreLocal),
        escaparCeldaCsv(reg.empresa),
        ...celdasTecnicos,
        ...celdasPatentes,
      ];
    });
  }

  const contenidoCsv = [
    encabezados.map(escaparCeldaCsv).join(';'),
    ...filas.map((fila) => fila.join(';')),
  ].join('\r\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + contenidoCsv], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  const hoy = new Date();
  const fechaArchivo = `${String(hoy.getDate()).padStart(2, '0')}-${String(
    hoy.getMonth() + 1
  ).padStart(2, '0')}-${hoy.getFullYear()}`;

  enlace.href = url;
  enlace.setAttribute('download', `registros_atm_${fechaArchivo}.csv`);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
