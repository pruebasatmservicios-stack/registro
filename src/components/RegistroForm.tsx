import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ErroresFormulario,
  ErrorTecnico,
  NuevoRegistroAcceso,
  RegistroAcceso,
  TecnicoAcceso,
} from '../types/registro';
import { validarListaPatentes } from '../utils/patente';
import {
  formatearNombrePersona,
  normalizarNumeroAtm,
  validarEmpresa,
  validarFormularioCompleto,
  validarListaTecnicos,
  validarNombreLocal,
  validarNumeroAtm,
} from '../utils/validaciones';
import { CampoTexto } from './CampoTexto';
import { PatentesInput } from './PatentesInput';
import { TecnicosInput } from './TecnicosInput';

interface RegistroFormProps {
  empresasSugeridas: string[];
  registroEnEdicion?: RegistroAcceso | null;
  plantillaDuplicada?: { registro: RegistroAcceso; timestamp: number } | null;
  onGuardar: (datos: NuevoRegistroAcceso) => Promise<void> | void;
  onActualizar?: (id: string, datos: NuevoRegistroAcceso) => Promise<void> | void;
  onCancelarModoEspecial?: () => void;
}

const crearTecnicoVacio = (): TecnicoAcceso => ({
  nombre: '',
  apellido: '',
  rut: '',
});

const crearEstadoInicial = (): NuevoRegistroAcceso => ({
  numeroAtm: '',
  nombreLocal: '',
  empresa: '',
  tecnicos: [crearTecnicoVacio()],
  patentes: [''],
});

type TecnicoTocado = {
  nombre?: boolean;
  apellido?: boolean;
  rut?: boolean;
};

type CampoTocado = {
  numeroAtm?: boolean;
  nombreLocal?: boolean;
  empresa?: boolean;
  tecnicos?: TecnicoTocado[];
  patentes?: boolean[];
};

export const RegistroForm: React.FC<RegistroFormProps> = ({
  empresasSugeridas,
  registroEnEdicion,
  plantillaDuplicada,
  onGuardar,
  onActualizar,
  onCancelarModoEspecial,
}) => {
  const [datos, setDatos] = useState<NuevoRegistroAcceso>(crearEstadoInicial);
  const [tocados, setTocados] = useState<CampoTocado>({});
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mostrarConfirmacionLimpiar, setMostrarConfirmacionLimpiar] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const primerCampoRef = useRef<HTMLInputElement>(null);

  // Cargar datos cuando se selecciona "Modificar" un registro existente
  useEffect(() => {
    if (!registroEnEdicion) return;
    setDatos({
      numeroAtm: registroEnEdicion.numeroAtm,
      nombreLocal: registroEnEdicion.nombreLocal,
      empresa: registroEnEdicion.empresa,
      tecnicos:
        registroEnEdicion.tecnicos.length > 0
          ? registroEnEdicion.tecnicos.map((t) => ({ ...t }))
          : [crearTecnicoVacio()],
      patentes:
        registroEnEdicion.patentes.length > 0
          ? [...registroEnEdicion.patentes]
          : [''],
    });
    setTocados({});
    setErrores({});
    setMensajeExito(null);
    setTimeout(() => {
      primerCampoRef.current?.focus();
    }, 50);
  }, [registroEnEdicion]);

  // Cargar datos cuando se selecciona "Duplicar" un registro para otro punto/ATM
  useEffect(() => {
    if (!plantillaDuplicada) return;
    const { registro } = plantillaDuplicada;
    setDatos({
      numeroAtm: registro.numeroAtm,
      nombreLocal: registro.nombreLocal,
      empresa: registro.empresa,
      tecnicos:
        registro.tecnicos.length > 0
          ? registro.tecnicos.map((t) => ({ ...t }))
          : [crearTecnicoVacio()],
      patentes:
        registro.patentes.length > 0
          ? [...registro.patentes]
          : [''],
    });
    setTocados({});
    setErrores({});
    setMensajeExito(null);
    setTimeout(() => {
      primerCampoRef.current?.focus();
      primerCampoRef.current?.select();
    }, 50);
  }, [plantillaDuplicada]);

  const validacionGlobal = useMemo(() => validarFormularioCompleto(datos), [datos]);

  const tieneErroresVisibles = useMemo(() => {
    return Boolean(
      errores.numeroAtm ||
        errores.nombreLocal ||
        errores.empresa ||
        errores.tecnicosGeneral ||
        (errores.tecnicos &&
          errores.tecnicos.some((t) => Boolean(t?.nombre || t?.apellido || t?.rut))) ||
        errores.patentesGeneral ||
        (errores.patentes && errores.patentes.some(Boolean))
    );
  }, [errores]);

  const botonGuardarDeshabilitado =
    !validacionGlobal.esValido || tieneErroresVisibles || guardando;

  const ocultarExitoSiExiste = () => {
    if (mensajeExito) setMensajeExito(null);
  };

  // --- Handlers de campos simples ---

  const handleChangeNumeroAtm = (e: React.ChangeEvent<HTMLInputElement>) => {
    ocultarExitoSiExiste();
    const valor = normalizarNumeroAtm(e.target.value);
    setDatos((prev) => ({ ...prev, numeroAtm: valor }));
    if (tocados.numeroAtm) {
      setErrores((prev) => ({ ...prev, numeroAtm: validarNumeroAtm(valor) }));
    }
  };

  const handleBlurNumeroAtm = () => {
    const limpio = datos.numeroAtm.replace(/-+$/, '');
    setDatos((prev) => ({ ...prev, numeroAtm: limpio }));
    setTocados((prev) => ({ ...prev, numeroAtm: true }));
    setErrores((prev) => ({ ...prev, numeroAtm: validarNumeroAtm(limpio) }));
  };

  const handleChangeNombreLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    ocultarExitoSiExiste();
    const valor = e.target.value.slice(0, 80);
    setDatos((prev) => ({ ...prev, nombreLocal: valor }));
    if (tocados.nombreLocal) {
      setErrores((prev) => ({ ...prev, nombreLocal: validarNombreLocal(valor) }));
    }
  };

  const handleBlurNombreLocal = () => {
    const limpio = datos.nombreLocal.trim();
    setDatos((prev) => ({ ...prev, nombreLocal: limpio }));
    setTocados((prev) => ({ ...prev, nombreLocal: true }));
    setErrores((prev) => ({ ...prev, nombreLocal: validarNombreLocal(limpio) }));
  };

  const handleChangeEmpresa = (e: React.ChangeEvent<HTMLInputElement>) => {
    ocultarExitoSiExiste();
    const valor = e.target.value;
    setDatos((prev) => ({ ...prev, empresa: valor }));
    if (tocados.empresa) {
      setErrores((prev) => ({ ...prev, empresa: validarEmpresa(valor) }));
    }
  };

  const handleBlurEmpresa = () => {
    const limpio = datos.empresa.trim();
    setDatos((prev) => ({ ...prev, empresa: limpio }));
    setTocados((prev) => ({ ...prev, empresa: true }));
    setErrores((prev) => ({ ...prev, empresa: validarEmpresa(limpio) }));
  };

  // --- Handlers de Técnicos ---

  const actualizarErroresTecnicos = (
    nuevosTecnicos: TecnicoAcceso[],
    nuevosTocadosTecnicos: TecnicoTocado[]
  ) => {
    const resultado = validarListaTecnicos(nuevosTecnicos);
    const erroresFiltrados: ErrorTecnico[] = resultado.erroresPorIndice.map((err, idx) => {
      const toc = nuevosTocadosTecnicos[idx] || {};
      return {
        nombre: toc.nombre ? err.nombre : undefined,
        apellido: toc.apellido ? err.apellido : undefined,
        rut: toc.rut ? err.rut : undefined,
      };
    });

    setErrores((prev) => ({
      ...prev,
      tecnicos: erroresFiltrados,
      tecnicosGeneral: resultado.errorGeneral,
    }));
  };

  const handleChangeTecnico = (
    index: number,
    campo: keyof TecnicoAcceso,
    valor: string
  ) => {
    ocultarExitoSiExiste();
    const nuevosTecnicos = datos.tecnicos.map((t, i) =>
      i === index ? { ...t, [campo]: valor } : t
    );
    setDatos((prev) => ({ ...prev, tecnicos: nuevosTecnicos }));

    const tocadosActuales: TecnicoTocado[] =
      tocados.tecnicos || nuevosTecnicos.map((): TecnicoTocado => ({}));
    if (tocadosActuales.some((t) => t.nombre || t.apellido || t.rut)) {
      actualizarErroresTecnicos(nuevosTecnicos, tocadosActuales);
    }
  };

  const handleBlurTecnico = (index: number, campo: keyof TecnicoAcceso) => {
    let nuevosTecnicos = datos.tecnicos;
    if (campo === 'nombre' || campo === 'apellido') {
      const limpio = formatearNombrePersona(datos.tecnicos[index][campo], false);
      nuevosTecnicos = datos.tecnicos.map((t, i) =>
        i === index ? { ...t, [campo]: limpio } : t
      );
      setDatos((prev) => ({ ...prev, tecnicos: nuevosTecnicos }));
    }

    const tocadosActuales = [...(tocados.tecnicos || nuevosTecnicos.map(() => ({})))];
    tocadosActuales[index] = { ...tocadosActuales[index], [campo]: true };
    setTocados((prev) => ({ ...prev, tecnicos: tocadosActuales }));
    actualizarErroresTecnicos(nuevosTecnicos, tocadosActuales);
  };

  const handleAgregarTecnico = () => {
    if (datos.tecnicos.length >= 25) return;
    ocultarExitoSiExiste();
    const nuevosTecnicos = [...datos.tecnicos, crearTecnicoVacio()];
    const nuevosTocados = [...(tocados.tecnicos || datos.tecnicos.map(() => ({}))), {}];
    setDatos((prev) => ({ ...prev, tecnicos: nuevosTecnicos }));
    setTocados((prev) => ({ ...prev, tecnicos: nuevosTocados }));
    actualizarErroresTecnicos(nuevosTecnicos, nuevosTocados);
  };

  const handleEliminarTecnico = (index: number) => {
    if (datos.tecnicos.length <= 1) return;
    ocultarExitoSiExiste();
    const nuevosTecnicos = datos.tecnicos.filter((_, i) => i !== index);
    const nuevosTocados = (tocados.tecnicos || datos.tecnicos.map(() => ({}))).filter(
      (_, i) => i !== index
    );
    setDatos((prev) => ({ ...prev, tecnicos: nuevosTecnicos }));
    setTocados((prev) => ({ ...prev, tecnicos: nuevosTocados }));
    actualizarErroresTecnicos(nuevosTecnicos, nuevosTocados);
  };

  // --- Handlers de Patentes ---

  const actualizarErroresPatentes = (
    nuevasPatentes: string[],
    nuevosTocadosPatentes: boolean[]
  ) => {
    const resultado = validarListaPatentes(nuevasPatentes);
    const erroresFiltrados = resultado.erroresPorIndice.map((err, idx) =>
      nuevosTocadosPatentes[idx] ? err : undefined
    );
    setErrores((prev) => ({
      ...prev,
      patentes: erroresFiltrados,
      patentesGeneral: resultado.errorGeneral,
    }));
  };

  const handleChangePatente = (index: number, valor: string) => {
    ocultarExitoSiExiste();
    const nuevasPatentes = datos.patentes.map((p, i) => (i === index ? valor : p));
    setDatos((prev) => ({ ...prev, patentes: nuevasPatentes }));

    const tocadosActuales = tocados.patentes || nuevasPatentes.map(() => false);
    if (tocadosActuales.some(Boolean)) {
      actualizarErroresPatentes(nuevasPatentes, tocadosActuales);
    }
  };

  const handleBlurPatente = (index: number) => {
    const limpias = datos.patentes.map((p, i) =>
      i === index ? p.replace(/-+$/, '') : p
    );
    setDatos((prev) => ({ ...prev, patentes: limpias }));

    const tocadosActuales = [...(tocados.patentes || limpias.map(() => false))];
    tocadosActuales[index] = true;
    setTocados((prev) => ({ ...prev, patentes: tocadosActuales }));
    actualizarErroresPatentes(limpias, tocadosActuales);
  };

  const handleAgregarPatente = () => {
    if (datos.patentes.length >= 5) return;
    ocultarExitoSiExiste();
    const nuevasPatentes = [...datos.patentes, ''];
    const nuevosTocados = [...(tocados.patentes || datos.patentes.map(() => false)), false];
    setDatos((prev) => ({ ...prev, patentes: nuevasPatentes }));
    setTocados((prev) => ({ ...prev, patentes: nuevosTocados }));
    actualizarErroresPatentes(nuevasPatentes, nuevosTocados);
  };

  const handleEliminarPatente = (index: number) => {
    if (datos.patentes.length <= 1) return;
    ocultarExitoSiExiste();
    const nuevasPatentes = datos.patentes.filter((_, i) => i !== index);
    const nuevosTocados = (tocados.patentes || datos.patentes.map(() => false)).filter(
      (_, i) => i !== index
    );
    setDatos((prev) => ({ ...prev, patentes: nuevasPatentes }));
    setTocados((prev) => ({ ...prev, patentes: nuevosTocados }));
    actualizarErroresPatentes(nuevasPatentes, nuevosTocados);
  };

  // --- Envío y Limpieza ---

  const reiniciarFormulario = () => {
    setDatos(crearEstadoInicial());
    setTocados({});
    setErrores({});
    setMostrarConfirmacionLimpiar(false);
    onCancelarModoEspecial?.();
    setTimeout(() => {
      primerCampoRef.current?.focus();
    }, 30);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const resultado = validarFormularioCompleto(datos);

    if (!resultado.esValido) {
      setTocados({
        numeroAtm: true,
        nombreLocal: true,
        empresa: true,
        tecnicos: datos.tecnicos.map(() => ({
          nombre: true,
          apellido: true,
          rut: true,
        })),
        patentes: datos.patentes.map(() => true),
      });
      setErrores(resultado.errores);
      return;
    }

    setGuardando(true);
    try {
      if (registroEnEdicion && onActualizar) {
        await onActualizar(registroEnEdicion.id, datos);
        reiniciarFormulario();
        setMensajeExito('Registro modificado y actualizado exitosamente en Supabase.');
      } else {
        await onGuardar(datos);
        reiniciarFormulario();
        setMensajeExito('Registro de acceso guardado exitosamente en Supabase.');
      }
    } catch {
      // El error se muestra en la alerta superior de App.tsx
    } finally {
      setGuardando(false);
    }
  };

  const formularioTieneDatos =
    Boolean(datos.numeroAtm) ||
    Boolean(datos.nombreLocal) ||
    Boolean(datos.empresa) ||
    datos.tecnicos.some((t) => Boolean(t.nombre || t.apellido || t.rut)) ||
    datos.tecnicos.length > 1 ||
    datos.patentes.some((p) => Boolean(p)) ||
    datos.patentes.length > 1;

  return (
    <section
      aria-labelledby="titulo-formulario"
      className="rounded-2xl border border-neutral-200 border-t-4 border-t-santander-500 bg-white p-4 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3.5">
        <div>
          <h2 id="titulo-formulario" className="text-lg font-extrabold text-[#191919]">
            {registroEnEdicion
              ? `Modificar Registro (ATM ${registroEnEdicion.numeroAtm})`
              : plantillaDuplicada
              ? 'Nuevo Registro desde Plantilla Duplicada'
              : 'Nuevo Registro de Visita'}
          </h2>
          <p className="text-xs text-neutral-500">
            Todos los campos marcados con <span className="font-bold text-santander-500">*</span> son obligatorios
          </p>
        </div>

        {(registroEnEdicion || plantillaDuplicada) && (
          <button
            type="button"
            onClick={reiniciarFormulario}
            className="rounded-full border border-neutral-300 bg-neutral-100 px-3.5 py-1.5 text-xs font-bold text-neutral-700 transition-colors hover:bg-neutral-200"
          >
            ✕ Cancelar {registroEnEdicion ? 'edición' : 'duplicado'}
          </button>
        )}
      </div>

      {/* Aviso de Modo Edición */}
      {registroEnEdicion && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          <span>
            Estás <strong>modificando</strong> el registro del ATM{' '}
            <strong className="font-mono">{registroEnEdicion.numeroAtm}</strong> (
            {registroEnEdicion.nombreLocal}). Al guardar se actualizará este registro.
          </span>
        </div>
      )}

      {/* Aviso de Modo Duplicar para otro punto */}
      {!registroEnEdicion && plantillaDuplicada && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-900">
          <span>
            Lista de técnicos, patentes y empresa cargada desde{' '}
            <strong className="font-mono">ATM {plantillaDuplicada.registro.numeroAtm}</strong>.
            Cambia el <strong>N° ATM</strong> o <strong>Nombre Local</strong> para el nuevo punto y presiona{' '}
            <strong>Guardar registro</strong>.
          </span>
        </div>
      )}

      {mensajeExito && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <div className="flex items-center gap-2.5">
            <svg
              className="h-5 w-5 shrink-0 text-emerald-600"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                clipRule="evenodd"
              />
            </svg>
            <span>{mensajeExito}</span>
          </div>
          <button
            type="button"
            onClick={() => setMensajeExito(null)}
            aria-label="Cerrar notificación"
            className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* 1. N° ATM */}
        <CampoTexto
          ref={primerCampoRef}
          id="numeroAtm"
          name="numeroAtm"
          etiqueta="N° ATM"
          value={datos.numeroAtm}
          onChange={handleChangeNumeroAtm}
          onBlur={handleBlurNumeroAtm}
          error={errores.numeroAtm}
          maxLength={60}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="Ej: 1745 o 1745-2113"
          ayuda="Puede ingresar uno o varios N° ATM separados por guion (ej: 1745-2113)."
        />

        {/* 2. NOMBRE LOCAL */}
        <CampoTexto
          id="nombreLocal"
          name="nombreLocal"
          etiqueta="NOMBRE LOCAL"
          value={datos.nombreLocal}
          onChange={handleChangeNombreLocal}
          onBlur={handleBlurNombreLocal}
          error={errores.nombreLocal}
          maxLength={80}
          autoCapitalize="words"
          placeholder="Ej: Sucursal Banco Santander Providencia"
          ayuda={`${datos.nombreLocal.trim().length}/80 caracteres (mín. 2).`}
        />

        {/* 3. EMPRESA */}
        <CampoTexto
          id="empresa"
          name="empresa"
          etiqueta="EMPRESA"
          value={datos.empresa}
          onChange={handleChangeEmpresa}
          onBlur={handleBlurEmpresa}
          error={errores.empresa}
          sugerencias={empresasSugeridas}
          autoCapitalize="words"
          placeholder="Ej: NCR, Diebold Nixdorf, Brinks..."
          ayuda={
            empresasSugeridas.length > 0
              ? 'Puede elegir una empresa sugerida o escribir una nueva.'
              : 'Mínimo 2 caracteres. Se recordará para futuros registros.'
          }
        />

        {/* 4, 5 y 6. LISTA DINÁMICA DE TÉCNICOS (NOMBRE, APELLIDO, RUT) */}
        <div className="pt-1">
          <TecnicosInput
            tecnicos={datos.tecnicos}
            errores={errores.tecnicos}
            errorGeneral={errores.tecnicosGeneral}
            onChangeTecnico={handleChangeTecnico}
            onBlurTecnico={handleBlurTecnico}
            onAgregarTecnico={handleAgregarTecnico}
            onEliminarTecnico={handleEliminarTecnico}
          />
        </div>

        {/* 7. PATENTES */}
        <div className="pt-1">
          <PatentesInput
            patentes={datos.patentes}
            errores={errores.patentes}
            errorGeneral={errores.patentesGeneral}
            onChangePatente={handleChangePatente}
            onBlurPatente={handleBlurPatente}
            onAgregarPatente={handleAgregarPatente}
            onEliminarPatente={handleEliminarPatente}
          />
        </div>

        {/* Botones de Acción */}
        <div className="mt-3 flex flex-col gap-3 border-t border-neutral-100 pt-4 sm:flex-row-reverse">
          <button
            type="submit"
            disabled={botonGuardarDeshabilitado}
            className="flex min-h-[50px] flex-1 items-center justify-center gap-2 rounded-full bg-santander-500 px-6 py-3 text-base font-bold text-white shadow-sm transition-all hover:bg-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500 focus:ring-offset-2 active:bg-santander-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400 disabled:shadow-none"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              {guardando
                ? 'Guardando...'
                : registroEnEdicion
                ? 'Guardar cambios'
                : 'Guardar registro'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (!formularioTieneDatos && !tieneErroresVisibles) {
                reiniciarFormulario();
              } else {
                setMostrarConfirmacionLimpiar(true);
              }
            }}
            className="flex min-h-[50px] items-center justify-center gap-2 rounded-full border-2 border-santander-500 bg-white px-6 py-3 text-base font-bold text-santander-500 transition-colors hover:bg-santander-50 focus:outline-none focus:ring-2 focus:ring-santander-500"
          >
            <span>Limpiar</span>
          </button>
        </div>
      </form>

      {/* Modal de confirmación para limpiar formulario */}
      {mostrarConfirmacionLimpiar && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmar-limpiar"
          aria-describedby="desc-confirmar-limpiar"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border-t-4 border-t-santander-500 bg-white p-5 shadow-xl">
            <h3 id="titulo-confirmar-limpiar" className="text-lg font-extrabold text-[#191919]">
              ¿Limpiar el formulario?
            </h3>
            <p id="desc-confirmar-limpiar" className="mt-2 text-sm text-neutral-600">
              Se borrarán todos los datos ingresados actualmente en el formulario. Esta acción no se puede deshacer.
            </p>
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row-reverse">
              <button
                type="button"
                onClick={reiniciarFormulario}
                className="min-h-[48px] flex-1 rounded-full bg-santander-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-santander-600 focus:outline-none focus:ring-2 focus:ring-santander-500"
              >
                Sí, limpiar todo
              </button>
              <button
                type="button"
                onClick={() => setMostrarConfirmacionLimpiar(false)}
                className="min-h-[48px] flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
