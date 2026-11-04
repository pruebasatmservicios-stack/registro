import { NuevoRegistroAcceso, RegistroAcceso, TecnicoAcceso } from '../types/registro';
import { extraerPatentesIndividuales } from '../utils/patente';
import { formatearRut } from '../utils/rut';
import { formatearNombrePersona, normalizarNumeroAtm } from '../utils/validaciones';
import { supabase } from './supabaseClient';

const STORAGE_KEY_REGISTROS = 'atm_acceso_registros_v1';
const STORAGE_KEY_EMPRESAS = 'atm_acceso_empresas_historico_v1';
const TABLA_SUPABASE = 'registros_acceso_atm';

interface FilaRegistroSupabase {
  id: string;
  fecha_hora: string;
  numero_atm: string;
  nombre_local: string;
  empresa: string;
  tecnicos: TecnicoAcceso[];
  patentes: string[];
}

function generarIdUnico(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function mapearFilaARegistro(fila: FilaRegistroSupabase): RegistroAcceso {
  return {
    id: fila.id,
    fechaHora: fila.fecha_hora,
    numeroAtm: fila.numero_atm,
    nombreLocal: fila.nombre_local,
    empresa: fila.empresa,
    tecnicos: Array.isArray(fila.tecnicos) ? fila.tecnicos : [],
    patentes: Array.isArray(fila.patentes) ? fila.patentes : [],
  };
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
 * Capa de almacenamiento conectada a Supabase (tabla `public.registros_acceso_atm`)
 * con respaldo automático en localStorage para funcionamiento rápido y en terreno.
 */
export const storageService = {
  obtenerRegistrosLocales(): RegistroAcceso[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REGISTROS);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RegistroAcceso[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map(normalizarRegistroGuardado)
        .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
    } catch {
      return [];
    }
  },

  guardarCacheLocal(registros: RegistroAcceso[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_REGISTROS, JSON.stringify(registros));
    } catch (error) {
      console.error('Error al actualizar caché local:', error);
    }
  },

  async obtenerRegistros(): Promise<RegistroAcceso[]> {
    const { data, error } = await supabase
      .from(TABLA_SUPABASE)
      .select('id, fecha_hora, numero_atm, nombre_local, empresa, tecnicos, patentes')
      .order('fecha_hora', { ascending: false });

    if (error) {
      console.error('Error al obtener registros desde Supabase, usando caché local:', error.message);
      return this.obtenerRegistrosLocales();
    }

    const remotos = (data as FilaRegistroSupabase[]).map(mapearFilaARegistro);
    this.guardarCacheLocal(remotos);
    remotos.forEach((r) => this.registrarEmpresaSugerida(r.empresa));
    return remotos;
  },

  async guardarRegistro(datos: NuevoRegistroAcceso): Promise<RegistroAcceso> {
    const tecnicosNormalizados: TecnicoAcceso[] = datos.tecnicos.map((t) => ({
      nombre: formatearNombrePersona(t.nombre, false),
      apellido: formatearNombrePersona(t.apellido, false),
      rut: formatearRut(t.rut),
    }));

    const filaNueva: FilaRegistroSupabase = {
      id: generarIdUnico(),
      fecha_hora: new Date().toISOString(),
      numero_atm: normalizarNumeroAtm(datos.numeroAtm).replace(/-+$/, ''),
      nombre_local: datos.nombreLocal.trim(),
      empresa: datos.empresa.trim(),
      tecnicos: tecnicosNormalizados,
      patentes: extraerPatentesIndividuales(datos.patentes),
    };

    const { data, error } = await supabase
      .from(TABLA_SUPABASE)
      .insert([filaNueva])
      .select('id, fecha_hora, numero_atm, nombre_local, empresa, tecnicos, patentes')
      .single();

    if (error) {
      throw new Error(`No se pudo guardar en Supabase: ${error.message}`);
    }

    const guardado = mapearFilaARegistro(data as FilaRegistroSupabase);
    const actuales = this.obtenerRegistrosLocales();
    this.guardarCacheLocal([guardado, ...actuales]);
    this.registrarEmpresaSugerida(guardado.empresa);

    return guardado;
  },

  async eliminarRegistro(id: string): Promise<RegistroAcceso[]> {
    const { error } = await supabase.from(TABLA_SUPABASE).delete().eq('id', id);

    if (error) {
      throw new Error(`No se pudo eliminar en Supabase: ${error.message}`);
    }

    const filtrados = this.obtenerRegistrosLocales().filter((r) => r.id !== id);
    this.guardarCacheLocal(filtrados);
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
      const desdeRegistros = this.obtenerRegistrosLocales().map((r) => r.empresa.trim());

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
