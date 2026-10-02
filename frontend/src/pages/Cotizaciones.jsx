import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, FileText, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8080/suminex/backend/public/api';

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCotizaciones();
  }, []);

  const fetchCotizaciones = async () => {
    try {
      const response = await axios.get(`${API_URL}/cotizaciones`);
      setCotizaciones(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cotizaciones:', error);
      setLoading(false);
    }
  };

  const filtered = cotizaciones.filter(c => 
    c.numero.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.cliente && c.cliente.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <Link to="/cotizaciones/nueva" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/30">
          <Plus size={20} />
          Nueva Cotización
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando cotizaciones...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Número</th>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No hay cotizaciones registradas</td>
                  </tr>
                ) : (
                  filtered.map((cot) => (
                    <tr key={cot.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{cot.numero}</td>
                      <td className="p-4 text-gray-600">{cot.fecha}</td>
                      <td className="p-4 text-gray-800">{cot.cliente ? cot.cliente.razon_social : 'Cliente no encontrado'}</td>
                      <td className="p-4 font-semibold text-gray-900">S/ {cot.total}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cot.estado === 'Aprobada' ? 'bg-green-100 text-green-800' :
                          cot.estado === 'Rechazada' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cot.estado}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          <Link to={`/cotizaciones/${cot.id}/imprimir`} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Ver / Imprimir">
                            <Printer size={18} />
                          </Link>
                        </div>
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

export default Cotizaciones;
