export interface TecnicoAcceso {
  nombre: string;
  apellido: string;
  rut: string;
}

export interface ErrorTecnico {
  nombre?: string;
  apellido?: string;
  rut?: string;
}

export interface RegistroAcceso {
  id: string;
  fechaHora: string; // ISO 8601
  numeroAtm: string;
  nombreLocal: string;
  empresa: string;
  tecnicos: TecnicoAcceso[];
  patentes: string[];
  // Campos heredados opcionales para compatibilidad con registros previos
  nombre?: string;
  apellido?: string;
  rut?: string;
}

export type NuevoRegistroAcceso = {
  numeroAtm: string;
  nombreLocal: string;
  empresa: string;
  tecnicos: TecnicoAcceso[];
  patentes: string[];
};

export interface ErroresFormulario {
  numeroAtm?: string;
  nombreLocal?: string;
  empresa?: string;
  tecnicos?: ErrorTecnico[];
  tecnicosGeneral?: string;
  patentes?: (string | undefined)[];
  patentesGeneral?: string;
}
