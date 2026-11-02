import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft } from 'lucide-react';

import { API_URL } from '../config';

// Configuración por tipo de documento (cotización / orden de pedido)
const TIPOS = {
  cotizacion: {
    endpoint: 'cotizaciones',
    volver: '/cotizaciones',
    titulo: 'COTIZACIÓN',
    noEncontrado: 'Cotización no encontrada',
    nota: 'La cotización es válida por 7 días. La fecha de ejecución del servicio se coordinará según disponibilidad.',
    datos: (doc) => [
      ['Cotización Ref:', doc.numero],
      ['Fecha Emisión:', doc.fecha],
      ['Fecha Vencimiento:', doc.fecha_vencimiento],
    ],
  },
  orden: {
    endpoint: 'ordenes',
    volver: '/ordenes',
    titulo: 'ORDEN DE PEDIDO',
    noEncontrado: 'Orden de pedido no encontrada',
    nota: 'La fecha de entrega se coordinará según disponibilidad.',
    datos: (doc) => [
      ['N° de Orden:', doc.numero || `OP-${String(doc.id).padStart(5, '0')}`],
      ['Fecha:', doc.fecha],
      ['Cotización Ref:', doc.cotizacion?.numero || '—'],
    ],
  },
};

const DocumentoComercialPrint = ({ tipo, id }) => {
  const config = TIPOS[tipo];
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/${config.endpoint}/${id}`)
      .then(res => {
        setDoc(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, config.endpoint]);

  if (loading) return <div className="p-10 text-center">Cargando formato...</div>;
  if (!doc) return <div className="p-10 text-center">{config.noEncontrado}</div>;

  // Una orden creada desde una cotización puede no tener el cliente directo
  const cliente = doc.cliente || doc.cotizacion?.cliente;
  const detalles = doc.detalles || [];

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0 print:m-0">
      {/* Botones de acción (No se imprimen) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between print:hidden">
        <button onClick={() => navigate(config.volver)} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
          <ArrowLeft size={18} /> Volver
        </button>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md shadow-blue-500/30">
          <Printer size={18} /> Imprimir / Exportar a PDF
        </button>
      </div>

      {/* Formato compacto: texto pequeño y poco relleno para que entren más ítems por hoja */}
      <div className="documento-hoja max-w-4xl mx-auto bg-white p-10 shadow-xl print:shadow-none print:p-0 print:max-w-none text-gray-800 font-sans text-[11px] leading-snug">

        {/* Encabezado */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-sm font-bold text-[#344054] tracking-wide mb-0.5">CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.</h1>
            <p className="text-gray-600">RUC: 20615095932 · suminexsac@gmail.com</p>
            <p className="text-gray-600">Contacto: 929 288 621 / 973 411 490 / 920 870 534</p>
            <p className="mt-1 text-xs font-bold text-[#3b4b6b] tracking-wider">{config.titulo}</p>
          </div>
          <img src="/logo-4.png" alt="Logo" className="w-[120px] object-contain" />
        </div>

        {/* Datos del documento (izquierda) y del Cliente (derecha) */}
        <div className="flex justify-between gap-6 mb-4 border border-gray-300 rounded p-2">
          <div className="w-1/2 space-y-0.5">
            {config.datos(doc).map(([label, valor]) => (
              <div key={label} className="flex"><span className="font-bold w-28 shrink-0">{label}</span> <span className="text-gray-700">{valor}</span></div>
            ))}
          </div>
          <div className="w-1/2 space-y-0.5">
            <div className="flex"><span className="font-bold w-16 shrink-0">Cliente:</span> <span className="text-gray-700 uppercase">{cliente?.razon_social}</span></div>
            <div className="flex"><span className="font-bold w-16 shrink-0">RUC:</span> <span className="text-gray-700">{cliente?.ruc}</span></div>
            <div className="flex"><span className="font-bold w-16 shrink-0">Teléfono:</span> <span className="text-gray-700">{cliente?.telefono || 'No especificado'}</span></div>
          </div>
        </div>

        {/* Tabla de Productos (el encabezado se repite en cada hoja al imprimir) */}
        <table className="w-full text-left mb-3 border-collapse">
          <thead>
            <tr className="bg-[#3b4b6b] text-white">
              <th className="px-1.5 py-1 border border-[#3b4b6b] text-center w-8 font-semibold">ÍT.</th>
              <th className="px-1.5 py-1 border border-[#3b4b6b] font-semibold">Descripción</th>
              <th className="px-1.5 py-1 border border-[#3b4b6b] text-center w-14 font-semibold">Cant.</th>
              <th className="px-1.5 py-1 border border-[#3b4b6b] text-center w-12 font-semibold">Und</th>
              <th className="px-1.5 py-1 border border-[#3b4b6b] text-right w-20 font-semibold">Precio Unit.</th>
              <th className="px-1.5 py-1 border border-[#3b4b6b] text-right w-20 font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {detalles.map((det, index) => (
              <tr key={det.id ?? index}>
                <td className="px-1.5 py-0.5 border border-gray-300 text-center">{index + 1}</td>
                <td className="px-1.5 py-0.5 border border-gray-300">{[det.producto?.nombre, det.descripcion_personalizada].filter(Boolean).join(' ')}</td>
                <td className="px-1.5 py-0.5 border border-gray-300 text-center">{det.cantidad}</td>
                <td className="px-1.5 py-0.5 border border-gray-300 text-center">{det.producto?.unidad_medida || 'UND'}</td>
                <td className="px-1.5 py-0.5 border border-gray-300 text-right">{(parseFloat(det.precio_unitario) || 0).toFixed(2)}</td>
                <td className="px-1.5 py-0.5 border border-gray-300 text-right">{(parseFloat(det.total) || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Notas, Totales y Datos Bancarios: se mantienen juntos en la misma hoja */}
        <div className="documento-cierre">
          <div className="flex justify-between items-start gap-6 mb-3">
            <div className="w-1/2 text-gray-700">
              <p className="font-bold text-gray-900">Nota:</p>
              <p>{config.nota}</p>
            </div>
            <div className="w-5/12">
              <div className="flex justify-between"><span className="font-bold">Base Imponible:</span> <span>{(parseFloat(doc.base_imponible) || 0).toFixed(2)}</span></div>
              <div className="flex justify-between mb-1"><span className="font-bold">{doc.aplica_igv == 0 ? 'IGV (no aplica):' : 'IGV (18%):'}</span> <span>{(parseFloat(doc.igv) || 0).toFixed(2)}</span></div>
              <div className="bg-[#3b4b6b] text-white px-2 py-1 flex justify-between items-center font-bold text-xs">
                <span>{doc.aplica_igv == 0 ? 'TOTAL (sin IGV):' : 'TOTAL (incl. IGV):'}</span>
                <span>S/ {(parseFloat(doc.total) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Cuentas Bancarias (en dos columnas para ocupar menos espacio) */}
          <div className="border border-gray-300">
            <div className="bg-[#3b4b6b] text-white px-2 py-0.5 text-center font-bold tracking-wider uppercase">
              Datos Bancarios para Depósito / Transferencia
            </div>
            <div className="flex">
              <div className="w-1/2 p-2 border-r border-gray-300">
                <div className="font-bold text-[#3b4b6b] mb-0.5">INTERBANK</div>
                <div className="flex justify-between"><span className="font-semibold">Cta. Cte. Soles:</span> <span>300-3008153316</span></div>
                <div className="flex justify-between"><span className="font-semibold">CCI Soles:</span> <span>003-300-003008153316-15</span></div>
                <div className="flex justify-between"><span className="font-semibold">Cta. Cte. Dólares:</span> <span>300-3008153323</span></div>
                <div className="flex justify-between"><span className="font-semibold">CCI Dólares:</span> <span>003-300-003008153323-11</span></div>
              </div>
              <div className="w-1/2 p-2">
                <div className="font-bold text-[#1c3c74] mb-0.5">BCP</div>
                <div className="flex justify-between"><span className="font-semibold">Cta. Cte. Soles:</span> <span>2157415302056</span></div>
                <div className="flex justify-between"><span className="font-semibold">CCI:</span> <span>00221500741530205620</span></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Regla CSS para ocultar el Layout y menús al imprimir */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0.8cm; }
          body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          aside, header { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          .documento-hoja thead { display: table-header-group; }
          .documento-hoja tr { break-inside: avoid; }
          .documento-cierre { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default DocumentoComercialPrint;
