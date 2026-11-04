import React, { forwardRef } from 'react';

export interface CampoTextoProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  etiqueta: string;
  error?: string;
  ayuda?: string;
  sugerencias?: string[];
  obligatorio?: boolean;
  accionDerechaEtiqueta?: React.ReactNode;
}

export const CampoTexto = forwardRef<HTMLInputElement, CampoTextoProps>(
  (
    {
      id,
      etiqueta,
      error,
      ayuda,
      sugerencias,
      obligatorio = true,
      accionDerechaEtiqueta,
      className = '',
      ...props
    },
    ref
  ) => {
    const listId = sugerencias && sugerencias.length > 0 ? `${id}-datalist` : undefined;
    const errorId = `${id}-error`;
    const ayudaId = `${id}-ayuda`;

    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor={id}
            className="text-sm font-bold tracking-wide text-[#191919] uppercase select-none"
          >
            {etiqueta}
            {obligatorio && (
              <span className="ml-1 text-santander-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
          {accionDerechaEtiqueta}
        </div>

        <input
          ref={ref}
          id={id}
          list={listId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : ayuda ? ayudaId : undefined}
          required={obligatorio}
          className={`min-h-[48px] w-full rounded-xl border px-3.5 py-2.5 text-base text-[#191919] placeholder:text-neutral-400 transition-colors focus:outline-none focus:ring-2 ${
            error
              ? 'border-santander-600 bg-santander-50/60 focus:border-santander-600 focus:ring-santander-500/30'
              : 'border-neutral-300 bg-white hover:border-neutral-400 focus:border-santander-500 focus:ring-santander-500/25'
          } ${className}`}
          {...props}
        />

        {listId && (
          <datalist id={listId}>
            {sugerencias!.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        )}

        {error ? (
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
        ) : ayuda ? (
          <p id={ayudaId} className="text-xs text-neutral-500">
            {ayuda}
          </p>
        ) : null}
      </div>
    );
  }
);

CampoTexto.displayName = 'CampoTexto';
