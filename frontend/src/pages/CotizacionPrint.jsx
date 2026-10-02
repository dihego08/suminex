import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Printer, ArrowLeft } from 'lucide-react';

const API_URL = 'http://localhost:8080/suminex/backend/public/api';

const CotizacionPrint = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/cotizaciones/${id}`)
      .then(res => {
        setCotizacion(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-10 text-center">Cargando formato...</div>;
  if (!cotizacion) return <div className="p-10 text-center">Cotización no encontrada</div>;

  return (
    <div className="bg-gray-100 min-h-screen py-8 print:bg-white print:py-0 print:m-0">
      {/* Botones de acción (No se imprimen) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between print:hidden">
        <button onClick={() => navigate('/cotizaciones')} className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-all">
          <ArrowLeft size={18} /> Volver
        </button>
        <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md shadow-blue-500/30">
          <Printer size={18} /> Imprimir / Exportar a PDF
        </button>
      </div>

      {/* Hoja A4 */}
      <div className="max-w-4xl mx-auto bg-white p-12 shadow-xl print:shadow-none print:p-0 print:max-w-none text-gray-800 font-sans" style={{ minHeight: '297mm' }}>
        
        {/* Encabezado */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#344054] tracking-wide mb-1">CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.</h1>
            <p className="text-sm text-gray-600 mb-0.5">RUC: 20615095932</p>
            <p className="text-sm text-gray-600">suminexsac@gmail.com</p>
          </div>
          <div className="w-48 text-right flex flex-col items-end">
             {/* Logo Placeholder (Puedes cambiar el SRC por tu imagen real) */}
             <div className="text-[#1c4c82] font-black text-3xl italic tracking-tighter flex items-center mb-1">
                <span className="bg-[#1c4c82] text-white p-1 px-2 rounded mr-1">S</span>
                SUMINEX
             </div>
             <p className="text-[9px] font-bold tracking-widest text-[#1c4c82] uppercase">Logistica y Abastecimiento</p>
          </div>
        </div>

        {/* Datos de Cotización */}
        <div className="flex justify-between mb-8">
          <div className="w-1/2 space-y-1">
            <div className="flex"><span className="font-bold w-40">Cotización Ref:</span> <span className="text-gray-700">{cotizacion.numero}</span></div>
            <div className="flex"><span className="font-bold w-40">Fecha Emisión:</span> <span className="text-gray-700">{cotizacion.fecha}</span></div>
            <div className="flex"><span className="font-bold w-40">Fecha Vencimiento:</span> <span className="text-gray-700">{cotizacion.fecha_vencimiento}</span></div>
          </div>
        </div>

        {/* Datos del Cliente */}
        <div className="mb-8 space-y-1">
          <div className="font-bold">Cliente:</div>
          <div className="text-gray-700 uppercase">{cotizacion.cliente?.razon_social}</div>
          <div className="flex mt-2"><span className="font-bold w-24">RUC:</span> <span className="text-gray-700">{cotizacion.cliente?.ruc}</span></div>
          <div className="flex"><span className="font-bold w-24">Teléfono:</span> <span className="text-gray-700">{cotizacion.cliente?.telefono || 'No especificado'}</span></div>
        </div>

        {/* Tabla de Productos */}
        <table className="w-full text-left mb-6 border-collapse">
          <thead>
            <tr className="bg-[#3b4b6b] text-white">
              <th className="p-2 border border-[#3b4b6b] text-center w-12 text-sm font-semibold">ITE</th>
              <th className="p-2 border border-[#3b4b6b] text-sm font-semibold">Descripción</th>
              <th className="p-2 border border-[#3b4b6b] text-center w-24 text-sm font-semibold">Cantidad</th>
              <th className="p-2 border border-[#3b4b6b] text-center w-20 text-sm font-semibold">Und</th>
              <th className="p-2 border border-[#3b4b6b] text-right w-32 text-sm font-semibold">Precio Unit.</th>
              <th className="p-2 border border-[#3b4b6b] text-right w-32 text-sm font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {cotizacion.detalles.map((det, index) => (
              <tr key={det.id}>
                <td className="p-2 border border-gray-400 text-center text-sm">{index + 1}</td>
                <td className="p-2 border border-gray-400 text-sm">{det.descripcion_personalizada || det.producto?.descripcion}</td>
                <td className="p-2 border border-gray-400 text-center text-sm">{det.cantidad}</td>
                <td className="p-2 border border-gray-400 text-center text-sm">{det.producto?.unidad_medida || 'UND'}</td>
                <td className="p-2 border border-gray-400 text-right text-sm">{parseFloat(det.precio_unitario).toFixed(2)}</td>
                <td className="p-2 border border-gray-400 text-right text-sm">{parseFloat(det.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Sección de Totales y Notas */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-1/2 text-sm text-gray-700 pr-8">
            <p className="font-bold mb-1 text-gray-900">Nota:</p>
            <p className="mb-2">La cotización es válida por 7 días. La fecha de ejecución del servicio se coordinará según disponibilidad.</p>
            <p>Contacto: 929 288 621 / 973 411 490 / 920 870 534</p>
          </div>
          <div className="w-1/2 flex flex-col items-end">
             <div className="w-full flex justify-between mb-1"><span className="font-bold">TOTAL (incl. IGV):</span> <span>{parseFloat(cotizacion.total).toFixed(2)}</span></div>
             <div className="w-full flex justify-between mb-1"><span className="font-bold">Base Imponible:</span> <span>{parseFloat(cotizacion.base_imponible).toFixed(2)}</span></div>
             <div className="w-full flex justify-between mb-2"><span className="font-bold">IGV (18%):</span> <span>{parseFloat(cotizacion.igv).toFixed(2)}</span></div>
             
             <div className="w-full bg-[#3b4b6b] text-white p-2 flex justify-between items-center font-bold">
               <span>TOTAL:</span>
               <span>{parseFloat(cotizacion.total).toFixed(2)}</span>
             </div>
          </div>
        </div>

        {/* Cuentas Bancarias */}
        <div className="w-full">
          <div className="bg-[#3b4b6b] text-white p-1 text-center font-bold text-sm tracking-widest uppercase mb-4">
            Datos Bancarios para Depósito / Transferencia
          </div>

          <div className="mb-6">
            <div className="bg-[#e4e7ed] p-2 font-bold text-[#3b4b6b] mb-2">INTERBANK</div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-bold">Cuenta Corriente Soles:</span> <span>300-3008153316</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-bold">Cuenta Interbancaria (CCI) Soles:</span> <span>003-300-003008153316-15</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-bold">Cuenta Corriente Dólares:</span> <span>300-3008153323</span></div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-bold">Cuenta Interbancaria (CCI) Dólares:</span> <span>003-300-003008153323-11</span></div>
          </div>

          <div>
            <div className="bg-[#1c3c74] text-white p-2 font-bold italic mb-2">BCP</div>
            <div className="flex justify-between mb-1 text-sm"><span className="font-bold">Cuenta Corriente Soles:</span> <span>2157415302056</span></div>
            <div className="flex justify-between text-sm"><span className="font-bold">Cuenta Interbancaria (CCI):</span> <span>00221500741530205620</span></div>
          </div>
        </div>

      </div>

      {/* Regla CSS para ocultar el Layout y menús al imprimir */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { background: white; }
          aside, header { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
        }
      `}</style>
    </div>
  );
};

export default CotizacionPrint;
