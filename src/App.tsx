import React, { useCallback, useEffect, useState } from 'react';
import { RegistroForm } from './components/RegistroForm';
import { RegistrosList } from './components/RegistrosList';
import { storageService } from './services/storage';
import { NuevoRegistroAcceso, RegistroAcceso } from './types/registro';

export const App: React.FC = () => {
  const [registros, setRegistros] = useState<RegistroAcceso[]>(() =>
    storageService.obtenerRegistrosLocales()
  );
  const [empresasSugeridas, setEmpresasSugeridas] = useState<string[]>(() =>
    storageService.obtenerEmpresasHistoricas()
  );
  const [cargando, setCargando] = useState<boolean>(true);
  const [errorConexion, setErrorConexion] = useState<string | null>(null);

  const cargarDesdeSupabase = useCallback(async () => {
    setCargando(true);
    setErrorConexion(null);
    try {
      const datos = await storageService.obtenerRegistros();
      setRegistros(datos);
      setEmpresasSugeridas(storageService.obtenerEmpresasHistoricas());
    } catch (err) {
      setErrorConexion(err instanceof Error ? err.message : 'Error de sincronización');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDesdeSupabase();
  }, [cargarDesdeSupabase]);

  const handleGuardarRegistro = async (datos: NuevoRegistroAcceso) => {
    setErrorConexion(null);
    try {
      const nuevo = await storageService.guardarRegistro(datos);
      setRegistros((prev) => [nuevo, ...prev]);
      setEmpresasSugeridas(storageService.obtenerEmpresasHistoricas());
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar en Supabase';
      setErrorConexion(msg);
      throw err;
    }
  };

  const handleEliminarRegistro = async (id: string) => {
    setErrorConexion(null);
    try {
      const actualizados = await storageService.eliminarRegistro(id);
      setRegistros(actualizados);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al eliminar en Supabase';
      setErrorConexion(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-[#191919] flex flex-col">
      {/* Encabezado Principal - Estilo Banco Santander */}
      <header className="sticky top-0 z-30 border-b border-santander-700 bg-santander-500 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white font-mono text-sm font-black tracking-tight text-santander-500 shadow-xs"
              aria-hidden="true"
            >
              ATM
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-extrabold tracking-tight sm:text-xl">
                  Registro de Acceso ATM
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold text-white">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      cargando ? 'animate-pulse bg-amber-300' : 'bg-emerald-300'
                    }`}
                  />
                  Supabase
                </span>
              </div>
              <p className="text-xs font-medium text-white/90">
                Servicio Técnico &bull; Red de Cajeros Automáticos
              </p>
            </div>
          </div>

          <a
            href="#seccion-registros"
            className="flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-bold text-white ring-1 ring-white/35 transition-colors hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <span>Registros</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-extrabold text-santander-500">
              {registros.length}
            </span>
          </a>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-3 py-5 sm:px-6 sm:py-8">
        {errorConexion && (
          <div
            role="alert"
            className="rounded-xl border border-santander-300 bg-santander-50 px-4 py-3 text-sm font-medium text-santander-700"
          >
            {errorConexion}
          </div>
        )}

        <RegistroForm
          empresasSugeridas={empresasSugeridas}
          onGuardar={handleGuardarRegistro}
        />

        <div id="seccion-registros" className="scroll-mt-20">
          <RegistrosList
            registros={registros}
            onEliminar={handleEliminarRegistro}
          />
        </div>
      </main>

      {/* Pie de página */}
      <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-500">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-1 px-4 sm:flex-row">
          <span className="font-bold text-santander-500">Registro de Acceso ATM</span>
          <span>Sincronizado en tiempo real con base de datos Supabase</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
