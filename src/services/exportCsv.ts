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
 * Formatea una fecha ISO en formato legible para Chile (DD/MM/YYYY HH:mm:ss).
 */
export function formatearFechaHoraLegible(isoString: string): string {
  try {
    const fecha = new Date(isoString);
    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(fecha);
  } catch {
    return isoString;
  }
}

/**
 * Genera y descarga un archivo CSV codificado en UTF-8 con BOM (\uFEFF) y separador punto y coma (;),
 * garantizando compatibilidad directa con Microsoft Excel para tildes y ñ.
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
      'ID Visita',
      'Fecha y Hora (ISO)',
      'Fecha y Hora Local',
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
      const fechaLocal = formatearFechaHoraLegible(reg.fechaHora);
      const patentesTexto = reg.patentes.join('-');

      return reg.tecnicos.map((tec, index) => [
        escaparCeldaCsv(reg.id),
        escaparCeldaCsv(reg.fechaHora),
        escaparCeldaCsv(fechaLocal),
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
      'ID Visita',
      'Fecha y Hora (ISO)',
      'Fecha y Hora Local',
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
        escaparCeldaCsv(reg.id),
        escaparCeldaCsv(reg.fechaHora),
        escaparCeldaCsv(formatearFechaHoraLegible(reg.fechaHora)),
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
  const fechaArchivo = new Date().toISOString().slice(0, 10);

  enlace.href = url;
  enlace.setAttribute('download', `registros_atm_${fechaArchivo}.csv`);
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
