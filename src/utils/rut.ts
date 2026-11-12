/**
 * Limpia el RUT dejando solo números y la letra K en mayúscula,
 * y elimina ceros a la izquierda del cuerpo (ej: "09.123.456-0" -> "91234560")
 * para evitar que se trunque el dígito verificador final.
 */
export function limpiarRut(valor: string): string {
  const sinFormato = valor.replace(/[^0-9kK]/g, '').toUpperCase();
  if (sinFormato.length <= 1) return sinFormato;
  const cuerpoSinCerosIniciales = sinFormato.slice(0, -1).replace(/^0+/, '');
  const dv = sinFormato.slice(-1);
  return `${cuerpoSinCerosIniciales}${dv}`;
}

/**
 * Formatea un RUT chileno en tiempo real con puntos y guion (ej: 12.345.678-5).
 */
export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor).slice(0, 9);
  if (limpio.length === 0) return '';
  if (limpio.length === 1) return limpio;

  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);

  const cuerpoConPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoConPuntos}-${dv}`;
}

/**
 * Calcula el dígito verificador de un cuerpo numérico de RUT usando módulo 11.
 */
export function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

/**
 * Valida que un RUT tenga formato chileno válido (6 a 8 dígitos en el cuerpo + dígito verificador 0-9 o K),
 * permitiendo guardar cualquier dígito verificador indicado en las nóminas (incluyendo -0).
 */
export function validarRut(rut: string): { valido: boolean; mensaje?: string } {
  const limpio = limpiarRut(rut);

  if (!limpio) {
    return { valido: false, mensaje: 'El RUT es obligatorio.' };
  }

  if (limpio.length < 7 || limpio.length > 9) {
    return {
      valido: false,
      mensaje: 'El RUT debe tener entre 6 y 8 dígitos más el dígito verificador (ej: 12.345.678-0).',
    };
  }

  const cuerpo = limpio.slice(0, -1);
  const dvIngresado = limpio.slice(-1);

  if (!/^\d+$/.test(cuerpo)) {
    return { valido: false, mensaje: 'El cuerpo del RUT solo puede contener números.' };
  }

  if (!/^[0-9K]$/.test(dvIngresado)) {
    return { valido: false, mensaje: 'El dígito verificador debe ser un número del 0 al 9 o la letra K.' };
  }

  if (/^(\d)\1+$/.test(cuerpo)) {
    return { valido: false, mensaje: 'El RUT ingresado no es válido.' };
  }

  return { valido: true };
}
