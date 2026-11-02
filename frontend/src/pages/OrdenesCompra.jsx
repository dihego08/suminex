import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, Ban, Plus, Edit, ClipboardList } from 'lucide-react';
import { API_URL } from '../config';
import { TIPOS_COMPRA, tipoCompraInfo } from '../utils/tiposCompra';

const ESTADOS = {
  PENDIENTE: { label: 'Pendiente', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  ATENDIDA: { label: 'Atendida', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANULADA: { label: 'Anulada', cls: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const OrdenesCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipoCompra, setTipoCompra] = useState('');
  const [estado, setEstado] = useState('');
  const [search, setSearch] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchOrdenes();
  }, [tipoCompra, estado, page]);

  const fetchOrdenes = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API_URL}/ordenes-compra`, { params: { tipo_compra: tipoCompra, estado, search, desde, hasta, page } });
      setOrdenes(r.data.data || []);
      setLastPage(r.data.last_page || 1);
    } catch (e) {
      console.error(e);
      setOrdenes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrdenes();
  };

  const handleAnular = async (o) => {
    if (!window.confirm(`¿Anular la orden de compra ${o.codigo}?`)) return;
    try {
      const r = await axios.post(`${API_URL}/ordenes-compra/${o.id}/anular`);
      alert(r.data.message || 'Orden anulada.');
      fetchOrdenes();
    } catch (e) {
      alert(e.response?.data?.error || 'No se pudo anular la orden.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-blue-600" /> Órdenes de Compra
          </h1>
          <p className="text-sm text-gray-500">Solicitudes de compra de catálogo, suministros y agasajos.</p>
        </div>
        <Link to="/ordenes-compra/nueva" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
          <Plus size={18} /> Nueva Orden de Compra
        </Link>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFiltrar} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center flex-wrap">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
          {[{ value: '', corto: 'Todas' }, ...TIPOS_COMPRA].map(t => (
            <button
              type="button"
              key={t.value}
              onClick={() => { setTipoCompra(t.value); setPage(1); }}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${tipoCompra === t.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {t.corto}
            </button>
          ))}
        </div>
        <select value={estado} onChange={e => { setEstado(e.target.value); setPage(1); }} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="relative flex-1 min-w-[220px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="N° de orden, solicitante, área, lugar de entrega..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" value={desde} onChange={e => setDesde(e.target.value)} title="Desde" />
        <input type="date" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" value={hasta} onChange={e => setHasta(e.target.value)} title="Hasta" />
        <button type="submit" className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium">Filtrar</button>
      </form>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Orden N°</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Solicitante</th>
                <th className="py-3 px-4">Área</th>
                <th className="py-3 px-4">Entrega requerida</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="10" className="py-8 text-center text-gray-400">Cargando órdenes...</td></tr>
              ) : ordenes.length === 0 ? (
                <tr><td colSpan="10" className="py-8 text-center text-gray-400">No hay órdenes de compra registradas.</td></tr>
              ) : ordenes.map(o => {
                const tipo = tipoCompraInfo(o.tipo_compra);
                const est = ESTADOS[o.estado] || ESTADOS.PENDIENTE;
                return (
                  <tr key={o.id} className={`hover:bg-gray-50/50 ${o.estado === 'ANULADA' ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 font-mono font-bold text-gray-800">{o.codigo}</td>
                    <td className="py-3 px-4 text-gray-600">{o.fecha_emision}</td>
                    <td className="py-3 px-4"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${tipo.badge}`}>{tipo.corto}</span></td>
                    <td className="py-3 px-4 text-gray-800">{o.solicitante}</td>
                    <td className="py-3 px-4 text-gray-600">{o.area || '-'}</td>
                    <td className="py-3 px-4 text-gray-600">{o.fecha_requerida || '-'}</td>
                    <td className="py-3 px-4 text-center text-gray-600">{o.detalles_count}</td>
                    <td className="py-3 px-4 text-right font-mono text-gray-800">S/ {Number(o.total || 0).toFixed(2)}</td>
                    <td className="py-3 px-4 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${est.cls}`}>{est.label}</span></td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <a href={`${API_URL}/ordenes-compra/${o.id}/pdf`} target="_blank" rel="noreferrer" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Ver PDF">
                          <FileText size={16} />
                        </a>
                        {o.estado !== 'ANULADA' && (
                          <>
                            <Link to={`/ordenes-compra/editar/${o.id}`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar / completar compra">
                              <Edit size={16} />
                            </Link>
                            <button onClick={() => handleAnular(o)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Anular">
                              <Ban size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {lastPage > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
            <span>Página {page} de {lastPage}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Anterior</button>
              <button disabled={page === lastPage} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdenesCompra;
