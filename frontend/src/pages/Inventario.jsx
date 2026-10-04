import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Boxes, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  PlusCircle, 
  MinusCircle, 
  X, 
  DollarSign, 
  Package, 
  Layers 
} from 'lucide-react';
import { SERVER_URL } from '../config';

const Inventario = () => {
  const [data, setData] = useState({
    stats: {
      total_productos: 0,
      valor_inventario: 0,
      bajo_stock: 0,
      sin_stock: 0
    },
    productos: {
      data: [],
      current_page: 1,
      last_page: 1
    }
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoStock, setEstadoStock] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Kardex Modal State
  const [modalKardexOpen, setModalKardexOpen] = useState(false);
  const [kardexLoading, setKardexLoading] = useState(false);
  const [kardexData, setKardexData] = useState({
    producto: null,
    kardex: [],
    saldo_actual: 0
  });

  // Ajuste Stock Modal State
  const [modalAjusteOpen, setModalAjusteOpen] = useState(false);
  const [ajusteForm, setAjusteForm] = useState({
    id_producto: '',
    tipo_movimiento: 'entrada',
    cantidad: 1,
    motivo: '',
    precio_unitario: 0
  });
  const [ajusteSubmitting, setAjusteSubmitting] = useState(false);
  const [allProductsForSelect, setAllProductsForSelect] = useState([]);

  useEffect(() => {
    fetchInventario();
  }, [searchTerm, estadoStock, currentPage]);

  const fetchInventario = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/inventario`, {
        params: {
          search: searchTerm,
          estado_stock: estadoStock,
          page: currentPage,
          per_page: 15
        }
      });
      setData(res.data);
    } catch (err) {
      console.error('Error al cargar inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenKardex = async (productoId) => {
    try {
      setModalKardexOpen(true);
      setKardexLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/inventario/${productoId}/kardex`);
      setKardexData(res.data);
    } catch (err) {
      console.error('Error al cargar Kardex:', err);
      alert('No se pudo cargar el historial de Kardex para este producto.');
      setModalKardexOpen(false);
    } finally {
      setKardexLoading(false);
    }
  };

  const handleOpenAjuste = async (prod = null) => {
    try {
      if (allProductsForSelect.length === 0) {
        const res = await axios.get(`${SERVER_URL}/api/productos`);
        setAllProductsForSelect(res.data || []);
      }
      setAjusteForm({
        id_producto: prod ? prod.id : '',
        tipo_movimiento: 'entrada',
        cantidad: 1,
        motivo: '',
        precio_unitario: prod ? (prod.precio_compra || 0) : 0
      });
      setModalAjusteOpen(true);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  const handleSubmitAjuste = async (e) => {
    e.preventDefault();
    if (!ajusteForm.id_producto) {
      alert('Selecciona un producto para el ajuste');
      return;
    }
    if (ajusteForm.cantidad <= 0) {
      alert('La cantidad debe ser mayor a cero');
      return;
    }
    if (!ajusteForm.motivo.trim()) {
      alert('Ingresa el motivo del ajuste');
      return;
    }

    try {
      setAjusteSubmitting(true);
      await axios.post(`${SERVER_URL}/api/inventario/ajuste`, ajusteForm);
      alert('¡Ajuste de inventario aplicado exitosamente!');
      setModalAjusteOpen(false);
      fetchInventario();
    } catch (err) {
      console.error('Error al aplicar ajuste:', err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setAjusteSubmitting(false);
    }
  };

  const productosList = data.productos?.data || [];
  const stats = data.stats || {};

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Layers className="text-brand-600" /> Control de Inventario y Kardex
          </h1>
          <p className="text-sm text-gray-500">
            Seguimiento de existencias físicas, movimientos valorizados y alertas de stock
          </p>
        </div>
        <button
          onClick={() => handleOpenAjuste()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <PlusCircle size={18} /> Ajuste Manual de Stock
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKUs */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Productos</span>
            <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total_productos || 0}</div>
            <span className="text-xs text-gray-500">Catálogo general</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>

        {/* Valor Total del Inventario */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Valorización Almacén</span>
            <div className="text-2xl font-bold text-gray-900 mt-1 font-mono">
              S/ {Number(stats.valor_inventario || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-emerald-600 font-medium">Stock * Costo compra</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>

        {/* Bajo Stock */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Por Agotarse</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{stats.bajo_stock || 0}</div>
            <span className="text-xs text-amber-700">Bajo stock mínimo</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>

        {/* Sin Stock */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Agotados (0 Stock)</span>
            <div className="text-2xl font-bold text-red-600 mt-1">{stats.sin_stock || 0}</div>
            <span className="text-xs text-red-700">Requieren compra</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle size={24} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[260px] flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200">
          <Search className="text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por código SKU, nombre o marca..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => { setEstadoStock(''); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              estadoStock === '' ? 'bg-white text-gray-900 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { setEstadoStock('con_stock'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              estadoStock === 'con_stock' ? 'bg-white text-emerald-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Con Stock
          </button>
          <button
            onClick={() => { setEstadoStock('bajo_stock'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              estadoStock === 'bajo_stock' ? 'bg-white text-amber-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Stock Bajo
          </button>
          <button
            onClick={() => { setEstadoStock('sin_stock'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              estadoStock === 'sin_stock' ? 'bg-white text-red-700 shadow-sm font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Agotados
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">SKU / Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4 text-center">Unidad</th>
                <th className="py-3 px-4 text-center">Stock Actual</th>
                <th className="py-3 px-4 text-center">Stock Mínimo</th>
                <th className="py-3 px-4 text-right">Costo Compra</th>
                <th className="py-3 px-4 text-right">Valorización</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    Cargando inventario...
                  </td>
                </tr>
              ) : productosList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-gray-400">
                    No se encontraron productos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                productosList.map((prod) => {
                  const stockNum = parseFloat(prod.stock || 0);
                  const stockMin = parseFloat(prod.stock_minimo || 0);
                  const costoCompra = parseFloat(prod.precio_compra || 0);
                  const totalVal = stockNum * costoCompra;

                  // Stock status badge
                  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                  let statusText = 'Normal';

                  if (stockNum <= 0) {
                    badgeColor = 'bg-red-50 text-red-700 border-red-200 font-bold';
                    statusText = 'Agotado';
                  } else if (stockNum <= stockMin) {
                    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                    statusText = 'Bajo Stock';
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-700 text-xs">
                        {prod.codigo || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{prod.nombre}</div>
                        {prod.marca && <div className="text-xs text-gray-400">Marca: {prod.marca}</div>}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-gray-500 font-mono">
                        {prod.unidad_medida || 'UND'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border ${badgeColor}`}
                          title={statusText}
                        >
                          {stockNum.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-xs text-gray-400">
                        {stockMin.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-gray-600">
                        S/ {costoCompra.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-gray-900 text-xs">
                        S/ {totalVal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAjuste(prod)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800 transition-colors"
                            title="Ajustar Stock"
                          >
                            <PlusCircle size={16} />
                          </button>
                          <button
                            onClick={() => handleOpenKardex(prod.id)}
                            className="flex items-center gap-1 bg-brand-50 hover:bg-brand-100 text-brand-700 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors"
                            title="Ver Historial de Kardex"
                          >
                            <History size={14} /> Kardex
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
        {data.productos?.last_page > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Página {currentPage} de {data.productos.last_page}</span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(c => c - 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={currentPage === data.productos.last_page}
                onClick={() => setCurrentPage(c => c + 1)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Kardex */}
      {modalKardexOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <History className="text-brand-600" size={20} /> Historial de Movimientos (Kardex)
                </h3>
                <p className="text-xs text-gray-500">
                  {kardexData.producto ? `${kardexData.producto.nombre} [${kardexData.producto.codigo || 'S/C'}]` : 'Cargando...'}
                </p>
              </div>
              <button
                onClick={() => setModalKardexOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Product summary card in modal */}
              {kardexData.producto && (
                <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl text-xs text-gray-600 border border-gray-100">
                  <div>
                    <span className="font-semibold block text-gray-500 uppercase">Stock Actual:</span>
                    <span className="text-xl font-bold font-mono text-gray-900">
                      {parseFloat(kardexData.saldo_actual || 0).toFixed(2)} {kardexData.producto.unidad_medida || 'UND'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-500 uppercase">Costo Promedio / Compra:</span>
                    <span className="text-xl font-bold font-mono text-gray-900">
                      S/ {Number(kardexData.producto.precio_compra || 0).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold block text-gray-500 uppercase">Total Valorizado:</span>
                    <span className="text-xl font-bold font-mono text-brand-600">
                      S/ {(parseFloat(kardexData.saldo_actual || 0) * Number(kardexData.producto.precio_compra || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Kardex Movements Table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-500 font-semibold uppercase sticky top-0 border-b border-gray-100">
                    <tr>
                      <th className="py-2.5 px-3">Fecha y Hora</th>
                      <th className="py-2.5 px-3">Tipo Operación</th>
                      <th className="py-2.5 px-3">Referencia</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-right text-emerald-700">Entradas (+)</th>
                      <th className="py-2.5 px-3 text-right text-red-700">Salidas (-)</th>
                      <th className="py-2.5 px-3 text-right font-bold text-gray-900">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {kardexLoading ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">
                          Cargando movimientos de Kardex...
                        </td>
                      </tr>
                    ) : kardexData.kardex?.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-gray-400">
                          Sin movimientos registrados para este producto.
                        </td>
                      </tr>
                    ) : (
                      kardexData.kardex?.map((it, idx) => {
                        const isEntrada = it.entrada > 0;
                        return (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2 px-3 font-mono text-gray-600">{it.fecha}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  it.tipo_id === 1
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : it.tipo_id === 2
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : it.tipo_id === 5
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {it.tipo}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono font-medium text-gray-700">{it.referencia}</td>
                            <td className="py-2 px-3 text-right font-mono text-gray-600">
                              S/ {Number(it.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                              {it.entrada > 0 ? `+${it.entrada.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-red-600">
                              {it.salida > 0 ? `-${it.salida.toFixed(2)}` : '-'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900 bg-gray-50/50">
                              {it.saldo.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setModalKardexOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajuste Manual */}
      {modalAjusteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Ajuste Manual de Inventario</h3>
              <button
                onClick={() => setModalAjusteOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmitAjuste} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Producto *
                </label>
                <select
                  required
                  value={ajusteForm.id_producto}
                  onChange={(e) => {
                    const prodId = e.target.value;
                    const prod = allProductsForSelect.find(p => String(p.id) === String(prodId));
                    setAjusteForm({
                      ...ajusteForm,
                      id_producto: prodId,
                      precio_unitario: prod ? (prod.precio_compra || 0) : 0
                    });
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
                >
                  <option value="">-- Seleccionar Producto --</option>
                  {allProductsForSelect.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.codigo || 'S/C'}] {p.nombre} (Stock actual: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Tipo de Movimiento *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAjusteForm({ ...ajusteForm, tipo_movimiento: 'entrada' })}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      ajusteForm.tipo_movimiento === 'entrada'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <PlusCircle size={16} /> Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAjusteForm({ ...ajusteForm, tipo_movimiento: 'salida' })}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      ajusteForm.tipo_movimiento === 'salida'
                        ? 'bg-red-50 border-red-500 text-red-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <MinusCircle size={16} /> Salida (-)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={ajusteForm.cantidad}
                    onChange={(e) => setAjusteForm({ ...ajusteForm, cantidad: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm text-right font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Costo Unit. (S/.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ajusteForm.precio_unitario}
                    onChange={(e) => setAjusteForm({ ...ajusteForm, precio_unitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm text-right font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Motivo / Justificación *
                </label>
                <textarea
                  required
                  rows={2}
                  value={ajusteForm.motivo}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, motivo: e.target.value })}
                  placeholder="Ej. Conteo físico de inventario, merma, devolución interna..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalAjusteOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ajusteSubmitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {ajusteSubmitting ? 'Aplicando...' : 'Aplicar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventario;
