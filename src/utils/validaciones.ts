import {
  ErroresFormulario,
  ErrorTecnico,
  NuevoRegistroAcceso,
  TecnicoAcceso,
} from '../types/registro';
import { validarListaPatentes } from './patente';
import { limpiarRut, validarRut } from './rut';

/**
 * Normaliza N° ATM: permite varios ATMs separados por guion (ej: 1745-2113),
 * alfanumérico en mayúsculas automáticas, máx. 60 caracteres.
 */
export function normalizarNumeroAtm(valor: string): string {
  return valor
    .toUpperCase()
    .replace(/[\s,/]+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-/g, '')
    .slice(0, 60);
}

/**
 * Capitaliza automáticamente cada palabra (respetando tildes y ñ) y filtra caracteres inválidos.
 */
export function formatearNombrePersona(valor: string, preservarEspacioFinal = true): string {
  const soloLetrasYEspacios = valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '');
  const sinEspaciosDobles = soloLetrasYEspacios.replace(/\s+/g, ' ');
  const limpio = preservarEspacioFinal ? sinEspaciosDobles.replace(/^\s+/, '') : sinEspaciosDobles.trim();

  return limpio
    .split(' ')
    .map((palabra) => {
      if (!palabra) return '';
      return palabra.charAt(0).toLocaleUpperCase('es-CL') + palabra.slice(1).toLocaleLowerCase('es-CL');
    })
    .join(' ');
}

export function validarNumeroAtm(valor: string): string | undefined {
  const limpio = valor.trim().replace(/-+$/, '');
  if (!limpio) {
    return 'El N° ATM es obligatorio.';
  }
  if (limpio.length > 60) {
    return 'El campo N° ATM no puede superar los 60 caracteres.';
  }

  const segmentos = limpio.split('-');
  for (const seg of segmentos) {
    if (!seg || !/^[A-Z0-9]+$/.test(seg)) {
      return 'Formato inválido. Ingrese uno o varios N° ATM separados por guion (ej: 1745 o 1745-2113).';
    }
    if (seg.length > 20) {
      return `El N° ATM "${seg}" supera los 20 caracteres permitidos.`;
    }
  }

  const unicos = new Set(segmentos);
  if (unicos.size !== segmentos.length) {
    return 'Hay números de ATM repetidos en el mismo campo.';
  }

  return undefined;
}

export function validarNombreLocal(valor: string): string | undefined {
  const limpio = valor.trim();
  if (!limpio) {
    return 'El nombre del local es obligatorio.';
  }
  if (limpio.length < 2) {
    return 'El nombre del local debe tener al menos 2 caracteres.';
  }
  if (limpio.length > 80) {
    return 'El nombre del local no puede superar los 80 caracteres.';
  }
  return undefined;
}

export function validarEmpresa(valor: string): string | undefined {
  const limpio = valor.trim();
  if (!limpio) {
    return 'La empresa es obligatoria.';
  }
  if (limpio.length < 2) {
    return 'El nombre de la empresa debe tener al menos 2 caracteres.';
  }
  return undefined;
}

const REGEX_SOLO_LETRAS_ESPACIOS = /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+(?:\s+[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ]+)*$/;

export function validarNombrePersona(valor: string, etiqueta: 'nombre' | 'apellido'): string | undefined {
  const limpio = valor.trim();
  if (!limpio) {
    return `El ${etiqueta} es obligatorio.`;
  }
  if (limpio.length < 2) {
    return `El ${etiqueta} debe tener al menos 2 caracteres.`;
  }
  if (!REGEX_SOLO_LETRAS_ESPACIOS.test(limpio)) {
    return `El ${etiqueta} solo puede contener letras, tildes, ñ y espacios.`;
  }
  return undefined;
}

export function validarListaTecnicos(tecnicos: TecnicoAcceso[]): {
  valido: boolean;
  erroresPorIndice: ErrorTecnico[];
  errorGeneral?: string;
} {
  if (!tecnicos || tecnicos.length < 1) {
    return {
      valido: false,
      erroresPorIndice: [],
      errorGeneral: 'Debe registrar al menos 1 técnico.',
    };
  }

  const erroresPorIndice: ErrorTecnico[] = tecnicos.map(() => ({}));
  const rutsVistos = new Map<string, number>();

  tecnicos.forEach((tec, idx) => {
    const errNombre = validarNombrePersona(tec.nombre, 'nombre');
    if (errNombre) erroresPorIndice[idx].nombre = errNombre;

    const errApellido = validarNombrePersona(tec.apellido, 'apellido');
    if (errApellido) erroresPorIndice[idx].apellido = errApellido;

    const resRut = validarRut(tec.rut);
    if (!resRut.valido) {
      erroresPorIndice[idx].rut = resRut.mensaje;
    } else {
      const rutNormalizado = limpiarRut(tec.rut);
      if (rutsVistos.has(rutNormalizado)) {
        const primerIdx = rutsVistos.get(rutNormalizado)!;
        const msgRepetido = `El RUT ${tec.rut} está repetido en este registro.`;
        erroresPorIndice[idx].rut = msgRepetido;
        if (!erroresPorIndice[primerIdx].rut) {
          erroresPorIndice[primerIdx].rut = msgRepetido;
        }
      } else {
        rutsVistos.set(rutNormalizado, idx);
      }
    }
  });

  const hayErrores = erroresPorIndice.some(
    (err) => Boolean(err.nombre || err.apellido || err.rut)
  );

  return {
    valido: !hayErrores,
    erroresPorIndice,
  };
}

export function validarFormularioCompleto(datos: NuevoRegistroAcceso): {
  esValido: boolean;
  errores: ErroresFormulario;
} {
  const errores: ErroresFormulario = {};

  const errorAtm = validarNumeroAtm(datos.numeroAtm);
  if (errorAtm) errores.numeroAtm = errorAtm;

  const errorLocal = validarNombreLocal(datos.nombreLocal);
  if (errorLocal) errores.nombreLocal = errorLocal;

  const errorEmpresa = validarEmpresa(datos.empresa);
  if (errorEmpresa) errores.empresa = errorEmpresa;

  const resultadoTecnicos = validarListaTecnicos(datos.tecnicos);
  if (!resultadoTecnicos.valido) {
    errores.tecnicos = resultadoTecnicos.erroresPorIndice;
    if (resultadoTecnicos.errorGeneral) {
      errores.tecnicosGeneral = resultadoTecnicos.errorGeneral;
    }
  }

  const resultadoPatentes = validarListaPatentes(datos.patentes);
  if (!resultadoPatentes.valido) {
    errores.patentes = resultadoPatentes.erroresPorIndice;
    if (resultadoPatentes.errorGeneral) {
      errores.patentesGeneral = resultadoPatentes.errorGeneral;
    }
  }

  const esValido =
    !errores.numeroAtm &&
    !errores.nombreLocal &&
    !errores.empresa &&
    !errores.tecnicosGeneral &&
    (!errores.tecnicos ||
      errores.tecnicos.every((t) => !t.nombre && !t.apellido && !t.rut)) &&
    !errores.patentesGeneral &&
    (!errores.patentes || errores.patentes.every((e) => !e));

  return { esValido, errores };
}
