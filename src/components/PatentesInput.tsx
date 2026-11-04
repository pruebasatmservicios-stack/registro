import React from 'react';
import {
  extraerPatentesIndividuales,
  normalizarEntradaPatentes,
} from '../utils/patente';

interface PatentesInputProps {
  patentes: string[];
  errores?: (string | undefined)[];
  errorGeneral?: string;
  onChangePatente: (index: number, valor: string) => void;
  onBlurPatente: (index: number) => void;
  onAgregarPatente: () => void;
  onEliminarPatente: (index: number) => void;
}

const MAX_PATENTES = 5;
const MIN_PATENTES = 1;

export const PatentesInput: React.FC<PatentesInputProps> = ({
  patentes,
  errores = [],
  errorGeneral,
  onChangePatente,
  onBlurPatente,
  onAgregarPatente,
  onEliminarPatente,
}) => {
  const totalPatentesDetectadas = Math.max(
    patentes.length,
    extraerPatentesIndividuales(patentes).length
  );
  const puedeAgregar = totalPatentesDetectadas < MAX_PATENTES && patentes.length < MAX_PATENTES;
  const puedeEliminar = patentes.length > MIN_PATENTES;

  return (
    <fieldset className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-sm font-bold tracking-wide text-[#191919] uppercase">
          PATENTES <span className="text-santander-500" aria-hidden="true">*</span>
        </legend>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200">
          {totalPatentesDetectadas} / {MAX_PATENTES}
        </span>
      </div>

      <p className="text-xs text-neutral-500">
        Puede ingresar varias separadas por guion (ej: <span className="font-mono font-semibold">BCDF12-AB1234</span>) o usar el botón inferior. Formatos: actual (BCDF12), antiguo (AB1234) o moto (ABC12).
      </p>

      <div className="flex flex-col gap-3">
        {patentes.map((patente, index) => {
          const inputId = `patente-${index}`;
          const errorId = `patente-error-${index}`;
          const error = errores[index];

          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <label htmlFor={inputId} className="sr-only">
                    Patente #{index + 1}
                  </label>
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 rounded bg-santander-50 px-1.5 py-0.5 text-xs font-bold text-santander-600"
                    aria-hidden="true"
                  >
                    #{index + 1}
                  </span>
                  <input
                    id={inputId}
                    type="text"
                    value={patente}
                    maxLength={34}
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Ej: BCDF12 o BCDF12-AB1234"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? errorId : undefined}
                    onChange={(e) =>
                      onChangePatente(index, normalizarEntradaPatentes(e.target.value))
                    }
                    onBlur={() => onBlurPatente(index)}
                    className={`min-h-[48px] w-full rounded-xl border pl-12 pr-3.5 py-2.5 font-mono text-base font-semibold tracking-wider text-[#191919] uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
                      error
                        ? 'border-santander-600 bg-santander-50/60 focus:border-santander-600 focus:ring-santander-500/30'
                        : 'border-neutral-300 bg-white hover:border-neutral-400 focus:border-santander-500 focus:ring-santander-500/25'
                    }`}
                  />
                </div>

                {puedeEliminar && (
                  <button
                    type="button"
                    onClick={() => onEliminarPatente(index)}
                    aria-label={`Eliminar patente #${index + 1}`}
                    title="Eliminar patente"
                    className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-700 transition-colors hover:border-santander-300 hover:bg-santander-50 hover:text-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
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
                )}
              </div>

              {error && (
                <p
                  id={errorId}
                  role="alert"
                  className="flex items-start gap-1.5 text-sm font-medium text-santander-600"
                >
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-santander-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </p>
              )}
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
        onClick={onAgregarPatente}
        disabled={!puedeAgregar}
        className="mt-1 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-santander-300 bg-santander-50/40 px-4 py-2.5 text-sm font-bold text-santander-600 transition-colors hover:border-santander-500 hover:bg-santander-50 focus:outline-none focus:ring-2 focus:ring-santander-500 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
      >
        <span>+ Agregar patente</span>
        {!puedeAgregar && <span className="text-xs font-normal">(Máximo 5 alcanzado)</span>}
      </button>
    </fieldset>
  );
};
