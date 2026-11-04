/**
 * Normaliza la entrada del campo de patentes mientras se escribe:
 * convierte a mayúsculas, permite letras, números y guion (-) para separar varias patentes
 * (ej: BCDF12-AB1234). Convierte espacios, comas o barras en guion.
 */
export function normalizarEntradaPatentes(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[\s,/]+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .slice(0, 34); // Hasta 5 patentes de 6 caracteres + 4 guiones
}

/**
 * Normaliza una patente individual: mayúsculas, sin espacios ni guiones.
 */
export function normalizarPatente(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[\s\-·.]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

/**
 * Extrae todas las patentes individuales desde un arreglo de entradas (que pueden contener guiones, ej: "BCDF12-AB1234").
 */
export function extraerPatentesIndividuales(entradas: string[]): string[] {
  return entradas
    .flatMap((entrada) =>
      entrada
        .toUpperCase()
        .split('-')
        .map((segmento) => normalizarPatente(segmento))
    )
    .filter(Boolean);
}

/**
 * Formatos chilenos aceptados:
 * - Actual autos/camionetas: 4 letras + 2 números (ej: BCDF12)
 * - Antiguo autos/camionetas: 2 letras + 4 números (ej: AB1234)
 * - Motos: 3 letras + 2 números (ej: ABC12)
 */
const REGEX_PATENTE_ACTUAL = /^[A-Z]{4}\d{2}$/;
const REGEX_PATENTE_ANTIGUA = /^[A-Z]{2}\d{4}$/;
const REGEX_PATENTE_MOTO = /^[A-Z]{3}\d{2}$/;

export function validarPatenteIndividual(valor: string): { valido: boolean; mensaje?: string } {
  const limpia = normalizarPatente(valor);

  if (!limpia) {
    return { valido: false, mensaje: 'La patente es obligatoria.' };
  }

  const esValida =
    REGEX_PATENTE_ACTUAL.test(limpia) ||
    REGEX_PATENTE_ANTIGUA.test(limpia) ||
    REGEX_PATENTE_MOTO.test(limpia);

  if (!esValida) {
    return {
      valido: false,
      mensaje: `La patente "${limpia}" no tiene formato válido. Use 4 letras + 2 números (BCDF12), 2 letras + 4 números (AB1234) o moto 3 letras + 2 números (ABC12).`,
    };
  }

  return { valido: true };
}

/**
 * Valida la lista de entradas de patentes.
 * Soporta tanto múltiples patentes separadas por guion en un mismo campo (ej: BCDF12-AB1234)
 * como múltiples campos dinámicos (total entre 1 y 5 patentes sin repetidas).
 */
export function validarListaPatentes(patentes: string[]): {
  valido: boolean;
  erroresPorIndice: (string | undefined)[];
  errorGeneral?: string;
} {
  if (!patentes || patentes.length < 1) {
    return {
      valido: false,
      erroresPorIndice: [],
      errorGeneral: 'Debe registrar al menos 1 patente.',
    };
  }

  const erroresPorIndice: (string | undefined)[] = new Array(patentes.length).fill(undefined);
  const vistas = new Map<string, number>();
  let totalPatentesContadas = 0;

  patentes.forEach((raw, idx) => {
    const entradaLimpia = raw.trim().toUpperCase().replace(/-+$/, '');

    if (!entradaLimpia) {
      erroresPorIndice[idx] = 'Ingrese al menos una patente (ej: BCDF12 o BCDF12-AB1234).';
      return;
    }

    const segmentos = entradaLimpia.split('-').map((s) => normalizarPatente(s));

    if (segmentos.some((s) => !s)) {
      erroresPorIndice[idx] = 'Formato inválido: revise los guiones ingresados.';
      return;
    }

    for (const seg of segmentos) {
      totalPatentesContadas++;
      const resultado = validarPatenteIndividual(seg);
      if (!resultado.valido) {
        erroresPorIndice[idx] = resultado.mensaje;
        return;
      }

      if (vistas.has(seg)) {
        const primerIdx = vistas.get(seg)!;
        erroresPorIndice[idx] = `La patente ${seg} está repetida en este registro.`;
        if (!erroresPorIndice[primerIdx]) {
          erroresPorIndice[primerIdx] = `La patente ${seg} está repetida en este registro.`;
        }
      } else {
        vistas.set(seg, idx);
      }
    }
  });

  let errorGeneral: string | undefined;
  if (totalPatentesContadas > 5) {
    errorGeneral = `Se permite un máximo de 5 patentes por registro (actualmente hay ${totalPatentesContadas}).`;
  }

  const hayErrores = Boolean(errorGeneral) || erroresPorIndice.some((e) => Boolean(e));

  return {
    valido: !hayErrores,
    erroresPorIndice,
    errorGeneral,
  };
}
