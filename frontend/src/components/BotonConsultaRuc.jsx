import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { consultarDocumento } from '../utils/consultaRuc';

/**
 * Botón compacto para formularios de alta (cliente / proveedor): consulta el documento
 * escrito en el campo RUC y entrega los datos con onFound({ documento, tipo, nombre, direccion }).
 */
export default function BotonConsultaRuc({ valor, onFound, className = '' }) {
  const [buscando, setBuscando] = useState(false);

  const buscar = async () => {
    setBuscando(true);
    try {
      onFound(await consultarDocumento(valor));
    } catch (e) {
      alert(e.message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={buscar}
      disabled={buscando}
      title="Buscar datos por RUC / DNI"
      className={`px-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center gap-1.5 shrink-0 ${className}`}
    >
      {buscando ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
      Buscar
    </button>
  );
}
