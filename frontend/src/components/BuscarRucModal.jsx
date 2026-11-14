import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, CheckCircle2, AlertCircle, Building2, MapPin } from 'lucide-react';
import { consultarDocumento } from '../utils/consultaRuc';

/**
 * Modal para buscar un RUC/DNI y confirmar los datos antes de usarlos.
 * Props:
 *  - open, onClose
 *  - onConfirm(datos)  -> datos = { documento, tipo, nombre, direccion }
 *  - existente(documento) -> opcional; devuelve el registro ya existente (o undefined) para avisar al usuario
 *  - confirmLabel -> texto del botón de confirmación
 */
export default function BuscarRucModal({ open, onClose, onConfirm, existente, confirmLabel = 'Usar estos datos' }) {
  const [valor, setValor] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValor('');
      setResultado(null);
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const buscar = async () => {
    setBuscando(true);
    setResultado(null);
    setError('');
    try {
      setResultado(await consultarDocumento(valor));
    } catch (e) {
      setError(e.message);
    } finally {
      setBuscando(false);
    }
  };

  const yaExiste = resultado && existente ? existente(resultado.documento) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onMouseDown={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onMouseDown={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Search size={18} className="text-blue-500" /> Buscar por RUC / DNI
          </h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de documento</label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                maxLength={11}
                value={valor}
                onChange={e => setValor(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), buscar())}
                placeholder="RUC (11 dígitos) o DNI (8 dígitos)"
                className="flex-1 border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={buscar}
                disabled={buscando || (valor.length !== 8 && valor.length !== 11)}
                className="px-4 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {buscando ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Buscar
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl p-3">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}

          {resultado && (
            <div className="border border-green-200 bg-green-50/60 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-green-700 uppercase">
                <CheckCircle2 size={14} /> {resultado.tipo} {resultado.documento}
              </div>
              <div className="flex items-start gap-2 text-sm font-semibold text-gray-800">
                <Building2 size={16} className="mt-0.5 text-gray-400 shrink-0" /> {resultado.nombre}
              </div>
              {resultado.direccion && (
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="mt-0.5 text-gray-400 shrink-0" /> {resultado.direccion}
                </div>
              )}
              {yaExiste && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                  Ya está registrado como <b>{yaExiste.razon_social}</b>; se seleccionará el existente.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">
            Cancelar
          </button>
          <button
            type="button"
            disabled={!resultado}
            onClick={() => onConfirm(resultado)}
            className="px-4 py-2 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
