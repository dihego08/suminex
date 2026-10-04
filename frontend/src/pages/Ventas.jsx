import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, FileText, Plus, Edit, Trash2, Download, Filter, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { API_URL, SERVER_URL } from '../config';

const Ventas = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [estadoSunat, setEstadoSunat] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Anulación
  const [modalAnularOpen, setModalAnularOpen] = useState(false);
  const [ventaAAnular, setVentaAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('01');

  const motivos = [
    { cod: '01', desc: 'Anulación de la operación' },
    { cod: '02', desc: 'Anulación por error en el RUC' },
    { cod: '03', desc: 'Corrección por error en la descripción' },
    { cod: '04', desc: 'Descuento global' },
    { cod: '05', desc: 'Descuento por ítem' },
    { cod: '06', desc: 'Devolución total' },
    { cod: '07', desc: 'Devolución por ítem' },
    { cod: '08', desc: 'Bonificación' },
    { cod: '09', desc: 'Disminución en el valor' }
  ];

  useEffect(() => {
    fetchVentaes(currentPage);
  }, [currentPage]);

  const fetchVentaes = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        search: searchTerm,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
        estado_sunat: estadoSunat
      });
      const response = await axios.get(`${API_URL}/ventas?${params.toString()}`);
      setVentas(response.data.data);
      setCurrentPage(response.data.current_page);
      setLastPage(response.data.last_page);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      setLoading(false);
    }
  };

  const handleFilter = (e) => {
    e?.preventDefault();
    if (currentPage === 1) {
      fetchVentaes(1);
    } else {
      setCurrentPage(1); // Esto disparará el useEffect
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFechaDesde('');
    setFechaHasta('');
    setEstadoSunat('');
    if (currentPage === 1) {
      setTimeout(() => fetchVentaes(1), 0);
    } else {
      setCurrentPage(1);
    }
  };

  const eliminarVenta = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta venta?")) return;
    try {
      await axios.delete(`${API_URL}/ventas/${id}`);
      fetchVentaes(currentPage);
    } catch (error) {
      alert("Error al eliminar la venta");
    }
  };

  const enviarSunat = async (id) => {
    if (!window.confirm("¿Estás seguro de enviar esta factura/boleta a SUNAT?")) return;
    try {
      const res = await axios.post(`${API_URL}/ventas/${id}/enviar-sunat`);
      if (res.data.success) {
        alert("Enviado a SUNAT correctamente");
        fetchVentaes(currentPage);
      }
    } catch (error) {
      alert(error.response?.data?.msg || "Error al enviar a SUNAT");
      fetchVentaes(currentPage);
    }
  };

  const abrirModalAnular = (venta) => {
    setVentaAAnular(venta);
    setMotivoAnulacion('01');
    setModalAnularOpen(true);
  };

  const procesarAnulacion = async () => {
    const descMotivo = motivos.find(m => m.cod === motivoAnulacion)?.desc;
    try {
      const res = await axios.post(`${API_URL}/ventas/${ventaAAnular.id}/anular`, {
        cod_motivo: motivoAnulacion,
        motivo: descMotivo
      });
      if (res.data.success) {
        alert(res.data.msg);
        setModalAnularOpen(false);
        fetchVentaes(currentPage);
      }
    } catch (error) {
      alert(error.response?.data?.msg || "Error al anular en SUNAT");
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ventas</h1>
          <p className="text-sm text-gray-500">Gestiona tus comprobantes electrónicos</p>
        </div>
        <Link to="/ventas/nueva" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/30">
          <Plus size={20} />
          Nueva Factura/Boleta
        </Link>
      </div>

      {/* Sección de Filtros */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleFilter} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Buscar (Serie, RUC, Cliente)</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Ej. F001-123"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Estado SUNAT</label>
            <select
              value={estadoSunat}
              onChange={(e) => setEstadoSunat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="1">Enviado</option>
              <option value="0">No Enviado</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Filter size={16} /> Filtrar
            </button>
            <button type="button" onClick={clearFilters} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando ventas...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Comprobante</th>
                  <th className="p-4 font-semibold">Fecha Emisión</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">Total</th>
                  <th className="p-4 font-semibold text-center">Estado SUNAT</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">No hay ventas registradas que coincidan con los filtros</td>
                  </tr>
                ) : (
                  ventas.map((venta) => (
                    <tr key={venta.id} className={`hover:bg-gray-50/50 transition-colors ${venta.estado === 'Anulada' ? 'opacity-60' : ''}`}>
                      <td className="p-4 font-medium text-gray-900">
                        {venta.serie}-{venta.correlativo}
                        {venta.estado === 'Anulada' && <span className="ml-2 text-xs text-red-500 font-bold">(ANULADA)</span>}
                        {venta.correlativo_nc && <div className="text-[10px] text-gray-500 font-bold mt-1">NC: {venta.correlativo_nc}</div>}
                      </td>
                      <td className="p-4 text-gray-600">{venta.fecha_emision}</td>
                      <td className="p-4 text-gray-800">{venta.cliente?.razon_social || 'Cliente no encontrado'}</td>
                      <td className="p-4 font-semibold text-gray-900">S/ {venta.total}</td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${venta.envio_sunat ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {venta.envio_sunat ? 'Enviado' : 'No Enviado'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-2 flex-wrap">
                          {venta.envio_sunat !== 1 && venta.estado !== 'Anulada' && (
                            <Link to={`/ventas/editar/${venta.id}`} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar Venta">
                              <Edit size={18} />
                            </Link>
                          )}
                          {venta.envio_sunat === 1 ? (
                            <div className="flex gap-1">
                              <a href={`${SERVER_URL}/api/ventas/${venta.id}/xml`} target="_blank" rel="noreferrer" className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center" title="Descargar XML">
                                <span className="text-[10px] font-bold mr-1">XML</span> <Download size={14} />
                              </a>
                              {venta.cdr_path && (
                                <a href={`${SERVER_URL}/api/ventas/${venta.id}/cdr`} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center" title="Descargar CDR (ZIP)">
                                  <span className="text-[10px] font-bold mr-1">CDR</span> <Download size={14} />
                                </a>
                              )}
                            </div>
                          ) : (
                            <button onClick={() => enviarSunat(venta.id)} className="p-2 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors font-bold text-xs flex items-center" title="Enviar a SUNAT">
                              <FileText size={14} className="mr-1" /> SUNAT
                            </button>
                          )}
                          <a href={`${SERVER_URL}/api/ventas/${venta.id}/pdf`} target="_blank" rel="noreferrer" className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors" title="Descargar PDF">
                            <FileText size={18} />
                          </a>
                          {venta.envio_sunat === 1 && venta.estado !== 'Anulada' && (
                            <button onClick={() => abrirModalAnular(venta)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors flex items-center" title="Anular (Nota de Crédito)">
                              <XCircle size={18} />
                            </button>
                          )}
                          {venta.estado === 'Anulada' && (
                            <a href={`${SERVER_URL}/api/ventas/${venta.id}/pdf_nc`} target="_blank" rel="noreferrer" className="bg-red-600 hover:bg-red-700 transition-colors text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center h-full" title={`Descargar Nota de Crédito: ${venta.correlativo_nc}`}>
                              NC
                            </a>
                          )}
                          {venta.envio_sunat !== 1 && venta.estado !== 'Anulada' && (
                            <button onClick={() => eliminarVenta(venta.id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar Venta">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Controles de Paginación */}
            {lastPage > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  Página <span className="font-semibold text-gray-900">{currentPage}</span> de <span className="font-semibold text-gray-900">{lastPage}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                    disabled={currentPage === lastPage}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Anulación */}
      {modalAnularOpen && ventaAAnular && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-red-50 flex justify-between items-center">
              <h3 className="font-bold text-red-600 flex items-center gap-2">
                <XCircle size={20} />
                Anular Comprobante
              </h3>
              <button onClick={() => setModalAnularOpen(false)} className="text-gray-400 hover:text-gray-600">
                &times;
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Se anulará el comprobante <strong>{ventaAAnular.serie}-{ventaAAnular.correlativo}</strong> generando una Nota de Crédito en SUNAT. Esta acción no se puede deshacer.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo de Anulación</label>
                <select
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {motivos.map(m => (
                    <option key={m.cod} value={m.cod}>{m.cod} - {m.desc}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setModalAnularOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={procesarAnulacion}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-md shadow-red-500/30"
              >
                Sí, Anular y generar NC
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Ventas;
