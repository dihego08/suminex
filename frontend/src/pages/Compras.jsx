import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Filter, Eye, Trash2, ShoppingBag, Calendar, FileText, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVER_URL } from '../config';

const Compras = () => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Modal Detalle
  const [selectedCompra, setSelectedCompra] = useState(null);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);

  useEffect(() => {
    fetchCompras();
  }, [searchTerm, fechaDesde, fechaHasta, currentPage]);

  const fetchCompras = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/compras`, {
        params: {
          search: searchTerm,
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          page: currentPage,
          per_page: 15
        }
      });
      setCompras(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error('Error al cargar compras:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = (compra) => {
    setSelectedCompra(compra);
    setModalDetalleOpen(true);
  };

  const handleEliminarCompra = async (id) => {
    if (!window.confirm('¿Seguro que deseas anular esta compra? Esto revertirá el stock de los productos ingresados.')) {
      return;
    }
    try {
      await axios.delete(`${SERVER_URL}/api/compras/${id}`);
      alert('Compra anulada y stock revertido.');
      fetchCompras();
    } catch (err) {
      console.error('Error al anular compra:', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-brand-600" /> Registro de Compras
          </h1>
          <p className="text-sm text-gray-500">Historial de compras a proveedores e ingresos a inventario</p>
        </div>
        <Link
          to="/compras/nueva"
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Registrar Nueva Compra
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por comprobante o proveedor..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span className="text-xs font-medium text-gray-500">Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => {
              setFechaDesde(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => {
              setFechaHasta(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
          />
        </div>

        {(searchTerm || fechaDesde || fechaHasta) && (
          <button
            onClick={() => {
              setSearchTerm('');
              setFechaDesde('');
              setFechaHasta('');
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Fecha Emisión</th>
                <th className="py-3 px-4 text-right">Gravado</th>
                <th className="py-3 px-4 text-right">IGV</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    Cargando compras...
                  </td>
                </tr>
              ) : compras.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No se encontraron registros de compras.
                  </td>
                </tr>
              ) : (
                compras.map((c) => {
                  const numItems = c.detalles ? c.detalles.length : 0;
                  const nombreProv = c.proveedorRel?.razon_social || c.proveedor || 'Sin Proveedor';
                  const rucProv = c.proveedorRel?.ruc || '';
                  const comprobanteStr = `${c.serie || ''}-${c.numeracion || ''}`;

                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-gray-900 flex items-center gap-1.5">
                          <FileText size={15} className="text-gray-400" />
                          {comprobanteStr !== '-' ? comprobanteStr : `ID #${c.id}`}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-800">{nombreProv}</div>
                        {rucProv && <div className="text-xs text-gray-400 font-mono">RUC: {rucProv}</div>}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">
                        {c.fecha_creacion ? c.fecha_creacion.substring(0, 10) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600 text-xs">
                        S/ {Number(c.gravado || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-gray-600 text-xs">
                        S/ {Number(c.igv || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900">
                        S/ {Number(c.total || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          {numItems} {numItems === 1 ? 'ítem' : 'ítems'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleVerDetalle(c)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-600 transition-colors"
                            title="Ver Detalle de Compra"
                          >
                            <Eye size={17} />
                          </button>
                          <button
                            onClick={() => handleEliminarCompra(c.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                            title="Anular Compra"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {lastPage > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Página {currentPage} de {lastPage}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => c - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === lastPage}
                onClick={() => setCurrentPage(c => c + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalle de Compra */}
      {modalDetalleOpen && selectedCompra && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">
                  Detalle de Compra: {selectedCompra.serie}-{selectedCompra.numeracion}
                </h3>
                <p className="text-xs text-gray-500">
                  Proveedor: {selectedCompra.proveedorRel?.razon_social || selectedCompra.proveedor || 'Sin Proveedor'}
                </p>
              </div>
              <button
                onClick={() => setModalDetalleOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-4 bg-gray-50 p-3 rounded-xl text-xs text-gray-600">
                <div>
                  <span className="font-semibold block text-gray-700">Fecha de Emisión:</span>
                  {selectedCompra.fecha_creacion ? selectedCompra.fecha_creacion.substring(0, 10) : '-'}
                </div>
                <div>
                  <span className="font-semibold block text-gray-700">Subtotal / Gravado:</span>
                  S/ {Number(selectedCompra.gravado || 0).toFixed(2)}
                </div>
                <div>
                  <span className="font-semibold block text-gray-700">Total Compra:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    S/ {Number(selectedCompra.total || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <h4 className="font-semibold text-gray-700 text-sm">Productos Ingresados al Inventario:</h4>

              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-right">Cantidad</th>
                      <th className="py-2.5 px-3 text-right">Precio Compra</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedCompra.detalles && selectedCompra.detalles.length > 0 ? (
                      selectedCompra.detalles.map((det) => (
                        <tr key={det.id} className="hover:bg-gray-50/50">
                          <td className="py-2 px-3 font-medium text-gray-800">
                            {det.producto?.nombre || `Producto ID #${det.id_insumo}`}
                            {det.producto?.codigo && (
                              <span className="text-gray-400 block text-[11px] font-mono">
                                SKU: {det.producto.codigo}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center text-gray-600">{det.unidad || 'NIU'}</td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                            +{Number(det.cantidad).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-gray-700">
                            S/ {Number(det.precio).toFixed(2)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                            S/ {Number(det.total).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-gray-400">
                          Sin ítems detallados registrados
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalDetalleOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compras;
