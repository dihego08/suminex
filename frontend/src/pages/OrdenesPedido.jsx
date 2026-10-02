import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText } from 'lucide-react';

const API_URL = 'http://localhost:8080/suminex/backend/public/api';

const OrdenesPedido = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrdenes();
  }, []);

  const fetchOrdenes = async () => {
    try {
      const response = await axios.get(`${API_URL}/ordenes`);
      setOrdenes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ordenes:', error);
      setLoading(false);
    }
  };

  const filtered = ordenes.filter(o => 
    o.cotizacion?.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.cotizacion?.cliente && o.cotizacion.cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por cotización o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando órdenes de pedido...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">ID Orden</th>
                  <th className="p-4 font-semibold">Fecha Aprobación</th>
                  <th className="p-4 font-semibold">Ref. Cotización</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Monto</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No hay órdenes de pedido</td>
                  </tr>
                ) : (
                  filtered.map((orden) => (
                    <tr key={orden.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">OP-{String(orden.id).padStart(5, '0')}</td>
                      <td className="p-4 text-gray-600">{orden.fecha}</td>
                      <td className="p-4 text-gray-600 font-medium">{orden.cotizacion?.numero}</td>
                      <td className="p-4 text-gray-800">{orden.cotizacion?.cliente ? orden.cotizacion.cliente.razon_social : 'Cliente no encontrado'}</td>
                      <td className="p-4 font-semibold text-gray-900">S/ {orden.cotizacion?.total}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          orden.estado === 'Facturada' ? 'bg-blue-100 text-blue-800' :
                          orden.estado === 'Anulada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {orden.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenesPedido;
