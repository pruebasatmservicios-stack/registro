import React from 'react';
import { ErrorTecnico, TecnicoAcceso } from '../types/registro';
import { formatearRut } from '../utils/rut';
import { formatearNombrePersona } from '../utils/validaciones';
import { CampoTexto } from './CampoTexto';

interface TecnicosInputProps {
  tecnicos: TecnicoAcceso[];
  errores?: ErrorTecnico[];
  errorGeneral?: string;
  onChangeTecnico: (index: number, campo: keyof TecnicoAcceso, valor: string) => void;
  onBlurTecnico: (index: number, campo: keyof TecnicoAcceso) => void;
  onAgregarTecnico: () => void;
  onEliminarTecnico: (index: number) => void;
}

const MAX_TECNICOS = 25;
const MIN_TECNICOS = 1;

export const TecnicosInput: React.FC<TecnicosInputProps> = ({
  tecnicos,
  errores = [],
  errorGeneral,
  onChangeTecnico,
  onBlurTecnico,
  onAgregarTecnico,
  onEliminarTecnico,
}) => {
  const puedeAgregar = tecnicos.length < MAX_TECNICOS;
  const puedeEliminar = tecnicos.length > MIN_TECNICOS;

  return (
    <fieldset className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-bold tracking-wide text-[#191919] uppercase">
          TÉCNICOS ({tecnicos.length}) <span className="text-santander-500" aria-hidden="true">*</span>
        </legend>
        <span className="rounded-full bg-santander-50 px-2.5 py-0.5 text-xs font-bold text-santander-600 ring-1 ring-santander-200">
          {tecnicos.length} {tecnicos.length === 1 ? 'técnico' : 'técnicos'}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {tecnicos.map((tecnico, index) => {
          const errorTec = errores[index] || {};

          return (
            <div
              key={index}
              className="flex flex-col gap-3.5 rounded-xl border border-neutral-200 border-l-4 border-l-santander-500 bg-neutral-50/70 p-3.5 sm:p-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2">
                <span className="inline-flex items-center gap-2 text-xs font-extrabold tracking-wide text-[#191919] uppercase">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-santander-500 text-[11px] font-bold text-white">
                    {index + 1}
                  </span>
                  Técnico #{index + 1}
                </span>

                {puedeEliminar && (
                  <button
                    type="button"
                    onClick={() => onEliminarTecnico(index)}
                    aria-label={`Eliminar técnico #${index + 1}`}
                    className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 transition-colors hover:border-santander-300 hover:bg-santander-50 hover:text-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
                  >
                    <svg
                      className="h-4 w-4"
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
                    <span>Quitar</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <CampoTexto
                  id={`nombre-${index}`}
                  name={`nombre-${index}`}
                  etiqueta="NOMBRE"
                  value={tecnico.nombre}
                  onChange={(e) =>
                    onChangeTecnico(index, 'nombre', formatearNombrePersona(e.target.value, true))
                  }
                  onBlur={() => onBlurTecnico(index, 'nombre')}
                  error={errorTec.nombre}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  placeholder="Ej: Juan Andrés"
                />

                <CampoTexto
                  id={`apellido-${index}`}
                  name={`apellido-${index}`}
                  etiqueta="APELLIDO"
                  value={tecnico.apellido}
                  onChange={(e) =>
                    onChangeTecnico(
                      index,
                      'apellido',
                      formatearNombrePersona(e.target.value, true)
                    )
                  }
                  onBlur={() => onBlurTecnico(index, 'apellido')}
                  error={errorTec.apellido}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  placeholder="Ej: Pérez Muñoz"
                />
              </div>

              <CampoTexto
                id={`rut-${index}`}
                name={`rut-${index}`}
                etiqueta="RUT"
                value={tecnico.rut}
                onChange={(e) => onChangeTecnico(index, 'rut', formatearRut(e.target.value))}
                onBlur={() => onBlurTecnico(index, 'rut')}
                error={errorTec.rut}
                maxLength={12}
                autoCapitalize="characters"
                autoComplete="off"
                placeholder="12.345.678-0"
                ayuda="Se formatea automáticamente con puntos y guion (ej: 12.345.678-0)."
              />
            </div>
          );
        })}
      </div>

      {errorGeneral && (
        <p role="alert" className="text-sm font-medium text-santander-600">
          {errorGeneral}
        </p>
      )}

      <button
        type="button"
        onClick={onAgregarTecnico}
        disabled={!puedeAgregar}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-santander-300 bg-santander-50/40 px-4 py-2.5 text-sm font-bold text-santander-600 transition-colors hover:border-santander-500 hover:bg-santander-50 focus:outline-none focus:ring-2 focus:ring-santander-500 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
      >
        <span>+ Agregar otro técnico</span>
        {!puedeAgregar && <span className="text-xs font-normal">(Máximo {MAX_TECNICOS})</span>}
      </button>
    </fieldset>
  );
};
