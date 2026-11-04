import { NuevoRegistroAcceso, RegistroAcceso, TecnicoAcceso } from '../types/registro';
import { extraerPatentesIndividuales } from '../utils/patente';
import { formatearRut } from '../utils/rut';
import { formatearNombrePersona, normalizarNumeroAtm } from '../utils/validaciones';

const STORAGE_KEY_REGISTROS = 'atm_acceso_registros_v1';
const STORAGE_KEY_EMPRESAS = 'atm_acceso_empresas_historico_v1';

function generarIdUnico(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `reg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function normalizarRegistroGuardado(reg: RegistroAcceso): RegistroAcceso {
  let tecnicos: TecnicoAcceso[] = [];
  if (Array.isArray(reg.tecnicos) && reg.tecnicos.length > 0) {
    tecnicos = reg.tecnicos;
  } else if (reg.nombre || reg.apellido || reg.rut) {
    tecnicos = [
      {
        nombre: reg.nombre || '',
        apellido: reg.apellido || '',
        rut: reg.rut || '',
      },
    ];
  }

  return {
    ...reg,
    tecnicos,
    patentes: Array.isArray(reg.patentes) ? reg.patentes : [],
  };
}

/**
 * Capa de almacenamiento aislada.
 * Actualmente persiste en localStorage, pero mantiene una interfaz clara
 * para migrar fácilmente a Supabase o una API REST en el futuro.
 */
export const storageService = {
  obtenerRegistros(): RegistroAcceso[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REGISTROS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RegistroAcceso[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(normalizarRegistroGuardado)
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    } catch (error) {
      console.error('Error al leer registros desde localStorage:', error);
      return [];
    }
  },

  guardarRegistro(datos: NuevoRegistroAcceso): RegistroAcceso {
    const actuales = this.obtenerRegistros();

    const tecnicosNormalizados: TecnicoAcceso[] = datos.tecnicos.map((t) => ({
      nombre: formatearNombrePersona(t.nombre, false),
      apellido: formatearNombrePersona(t.apellido, false),
      rut: formatearRut(t.rut),
    }));

    const nuevoRegistro: RegistroAcceso = {
      id: generarIdUnico(),
      fechaHora: new Date().toISOString(),
      numeroAtm: normalizarNumeroAtm(datos.numeroAtm).replace(/-+$/, ''),
      nombreLocal: datos.nombreLocal.trim(),
      empresa: datos.empresa.trim(),
      tecnicos: tecnicosNormalizados,
      patentes: extraerPatentesIndividuales(datos.patentes),
    };

    const actualizados = [nuevoRegistro, ...actuales];
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(actualizados));

    this.registrarEmpresaSugerida(nuevoRegistro.empresa);

    return nuevoRegistro;
  },

  eliminarRegistro(id: string): RegistroAcceso[] {
    const actuales = this.obtenerRegistros();
    const filtrados = actuales.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(filtrados));
    return filtrados;
  },

  registrarEmpresaSugerida(empresa: string): void {
    const limpia = empresa.trim();
    if (!limpia) return;
    try {
      const actuales = this.obtenerEmpresasHistoricas();
      const existe = actuales.some(
        (e) => e.toLocaleLowerCase('es-CL') === limpia.toLocaleLowerCase('es-CL')
      );
      if (!existe) {
        const nuevas = [...actuales, limpia].sort((a, b) => a.localeCompare(b, 'es-CL'));
        localStorage.setItem(STORAGE_KEY_EMPRESAS, JSON.stringify(nuevas));
      }
    } catch (error) {
      console.error('Error al guardar sugerencia de empresa:', error);
    }
  },

  obtenerEmpresasHistoricas(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EMPRESAS);
      const historicas: string[] = raw ? JSON.parse(raw) : [];
      const desdeRegistros = this.obtenerRegistros().map((r) => r.empresa.trim());

      const mapaUnico = new Map<string, string>();
      [...historicas, ...desdeRegistros].forEach((emp) => {
        if (emp) {
          const clave = emp.toLocaleLowerCase('es-CL');
          if (!mapaUnico.has(clave)) {
            mapaUnico.set(clave, emp);
          }
        }
      });

      return Array.from(mapaUnico.values()).sort((a, b) => a.localeCompare(b, 'es-CL'));
    } catch {
      return [];
    }
  },
};
