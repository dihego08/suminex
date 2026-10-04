import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config';

const VentaPrint = () => {
  const { id } = useParams();
  const [venta, setVenta] = useState(null);

  useEffect(() => {
    const fetchVenta = async () => {
      try {
        const res = await axios.get(`${API_URL}/ventas/${id}`);
        setVenta(res.data);
        setTimeout(() => {
          window.print();
        }, 500);
      } catch (error) {
        console.error("Error fetching venta:", error);
      }
    };
    fetchVenta();
  }, [id]);

  if (!venta) return <div className="p-10 text-center">Cargando comprobante...</div>;

  const getDocName = () => {
    return venta.tipo_documento === '01' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA';
  };

  return (
    <div className="bg-white p-8 max-w-[21cm] mx-auto text-sm text-gray-800 font-sans" style={{ minHeight: '29.7cm' }}>
      
      {/* HEADER TIPO PDF LEGADO */}
      <div className="flex justify-between items-start mb-6">
        <div className="w-[60%] flex gap-4">
          <div>
            <img src="/logo-4.png" alt="Logo" className="w-[180px] object-contain mb-2" />
          </div>
          <div className="text-[11px] leading-snug">
            <p><strong>Dirección: </strong>JR. MANTARO 100 SEMI RURAL PACHACUTEC ZON FRENTE A LA INTERSECCION AREQUIPA-AREQUIPA-CERRO COLORADO</p>
            <p><strong>Celular.: </strong>929288621 / 973411490</p>
            <p><strong>Correo : </strong>suminexsac@gmail.com</p>
          </div>
        </div>

        <div className="w-[35%] border border-gray-800 rounded-lg p-2 text-center">
          <p className="font-bold text-[18px] tracking-wide mb-1 uppercase">{getDocName()}</p>
          <p className="font-bold text-[14px]">R.U.C.: 20615095932</p>
          <p className="text-[14px] mt-1">Nro. {venta.serie} - {venta.correlativo}</p>
          <p className="text-[12px] mt-1">Nro. R.I. Emisor: 212321</p>
          {venta.guia && (
             <p className="text-[12px] mt-1"><strong>Guía de Remisión:</strong><br/>{venta.guia}</p>
          )}
        </div>
      </div>

      {/* CLIENT INFO TIPO PDF LEGADO */}
      <div className="border border-gray-800 rounded-lg p-3 mb-4 text-[11px] grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1"><strong>Razón Social: </strong> {venta.cliente?.razon_social}</p>
          <p className="mb-1"><strong>Fecha Emisión: </strong> {venta.fecha_emision}</p>
          <p className="mb-1"><strong>Tipo Moneda: </strong> SOLES</p>
        </div>
        <div>
          <p className="mb-1"><strong>RUC: </strong> {venta.cliente?.ruc}</p>
          <p className="mb-1"><strong>Dirección: </strong> {venta.cliente?.direccion}</p>
        </div>
      </div>

      {/* ITEMS TIPO PDF LEGADO */}
      <table className="w-full mb-6 border border-gray-300 text-[11px] text-center">
        <thead>
          <tr className="border-b border-gray-800 font-bold bg-gray-50">
            <th className="p-2 border-r border-gray-300 w-24">Cantidad</th>
            <th className="p-2 border-r border-gray-300 text-left">Descripción</th>
            <th className="p-2 border-r border-gray-300 w-28">Valor Unitario</th>
            <th className="p-2 w-28">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          {venta.detalles?.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-200">
              <td className="p-2 border-r border-gray-300">{item.cantidad} {item.unidad_medida || 'UND'}</td>
              <td className="p-2 border-r border-gray-300 text-left">
                {item.producto?.nombre}
                {item.descripcion_personalizada && <span> - {item.descripcion_personalizada}</span>}
              </td>
              <td className="p-2 border-r border-gray-300">S/ {parseFloat(item.precio_unitario).toFixed(2)}</td>
              <td className="p-2">S/ {parseFloat(item.total).toFixed(2)}</td>
            </tr>
          ))}
          {venta.descuento > 0 && (
            <tr className="border-b border-gray-200">
              <td className="p-2 border-r border-gray-300"></td>
              <td className="p-2 border-r border-gray-300 text-left font-semibold uppercase">{venta.desc_descuento || 'DESCUENTO'}</td>
              <td className="p-2 border-r border-gray-300">S/ -{parseFloat(venta.descuento).toFixed(2)}</td>
              <td className="p-2">S/ -{parseFloat(venta.descuento).toFixed(2)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* TOTALS & INFO TIPO PDF LEGADO */}
      <div className="flex justify-between items-start text-[11px]">
        <div className="w-[65%]">
            <p className="font-bold text-sm mb-4">Son: {(parseFloat(venta.total)).toFixed(2)} SOLES</p>
            
            <p className="border-b border-gray-800 font-bold pb-1 mb-2">Información Adicional</p>
            <table className="w-[80%]">
              <tbody>
                <tr>
                  <td className="py-1 font-bold">Tipo de Transacción: </td>
                  <td className="py-1 border-b border-gray-300">{venta.forma_pago?.nombre || 'Contado'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Condición de Pago: </td>
                  <td className="py-1 border-b border-gray-300">{venta.estado_pago?.nombre || 'Pagado'}</td>
                </tr>
                <tr>
                  <td className="py-1 font-bold">Fecha de Vencimiento: </td>
                  <td className="py-1 border-b border-gray-300">{venta.fecha_vencimiento}</td>
                </tr>
              </tbody>
            </table>
        </div>

        <div className="w-[30%]">
          <table className="w-full mb-4">
            <tbody>
              {venta.descuento > 0 && (
                <tr>
                  <td className="py-1 text-right font-bold pr-4">Descuento: </td>
                  <td className="py-1 border-b border-gray-300 w-24">S/ {parseFloat(venta.descuento).toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 text-right font-bold pr-4">Subtotal: </td>
                <td className="py-1 border-b border-gray-300 w-24">S/ {parseFloat(venta.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold pr-4">I.G.V.: </td>
                <td className="py-1 border-b border-gray-300 w-24">S/ {parseFloat(venta.igv).toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1 text-right font-bold pr-4">Total: </td>
                <td className="py-1 border-b border-gray-300 w-24">S/ {parseFloat(venta.total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CRONOGRAMA DE PAGOS (SI ES CRÉDITO) */}
      {venta.forma_pago?.nombre === 'Credito' && venta.cuotas?.length > 0 && (
        <div className="border border-gray-800 rounded-lg p-3 mt-6 text-[11px]">
          <p className="font-bold mb-2 uppercase border-b border-gray-800 pb-1">Información del Crédito</p>
          <table className="w-full text-center">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-50">
                <th className="py-1 border-r border-gray-300 w-1/3">Número de Cuota</th>
                <th className="py-1 border-r border-gray-300 w-1/3">Fecha Vencimiento</th>
                <th className="py-1 w-1/3">Monto</th>
              </tr>
            </thead>
            <tbody>
              {venta.cuotas.map((cuota, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-1 border-r border-gray-300">Cuota {index + 1}</td>
                  <td className="py-1 border-r border-gray-300">{cuota.fecha_pago}</td>
                  <td className="py-1">S/ {parseFloat(cuota.monto).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DATOS BANCARIOS */}
      <div className="border border-gray-800 rounded-lg p-3 mt-6 text-[11px]">
        <p className="font-bold mb-2">DATOS BANCARIOS (M.N. SOLES):</p>
        <p><strong>CTA. CTE BANCO DE CREDITO DEL PERÚ: </strong> 2157415302056  /  C.C.I.: 00221500741530205620</p>
        <p><strong>CTA. CTE BANCO INTERBANK: </strong> 300-3008153316  /  C.C.I: 003-300-003008153316-15</p>
      </div>
      
      <style>
        {`
          @media print {
            body { background: white; margin: 0; padding: 0; }
            .mx-auto { margin: 0; max-width: none; }
            aside, header { display: none !important; }
            main { margin: 0 !important; padding: 0 !important; width: 100% !important; overflow: visible !important; }
            /* Esconder botones y otras cosas en el futuro si hiciera falta */
          }
        `}
      </style>
    </div>
  );
};

export default VentaPrint;
