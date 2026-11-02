import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, FileText, Ban, PackagePlus, PackageMinus, ClipboardList } from 'lucide-react';
import { API_URL } from '../config';

const FILTROS = [
  { value: '', label: 'Todas' },
  { value: 'INGRESO', label: 'Ingresos' },
  { value: 'SALIDA', label: 'Salidas' },
];

const NotasAlmacen = () => {
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tipo, setTipo] = useState('');
  const [search, setSearch] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchNotas();
  }, [tipo, page]);

  const fetchNotas = async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API_URL}/notas-almacen`, { params: { tipo, search, desde, hasta, page } });
      setNotas(r.data.data || []);
      setLastPage(r.data.last_page || 1);
    } catch (e) {
      console.error(e);
      setNotas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = (e) => {
    e.preventDefault();
    setPage(1);
    fetchNotas();
  };

  const handleAnular = async (nota) => {
    const efecto = nota.tipo === 'INGRESO' ? 'retirará del stock lo que ingresó' : 'devolverá al stock lo que salió';
    if (!window.confirm(`¿Anular la nota ${nota.codigo}?\nEsto ${efecto} y quitará sus movimientos del kardex.`)) return;
    try {
      const r = await axios.post(`${API_URL}/notas-almacen/${nota.id}/anular`);
      alert(r.data.message || 'Nota anulada.');
      fetchNotas();
    } catch (e) {
      alert(e.response?.data?.message || e.response?.data?.error || 'No se pudo anular la nota.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-blue-600" /> Notas de Almacén
          </h1>
          <p className="text-sm text-gray-500">Notas de ingreso y salida: son las que mueven el stock y el kardex.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/notas-almacen/nueva/ingreso" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
            <PackagePlus size={18} /> Nota de Ingreso
          </Link>
          <Link to="/notas-almacen/nueva/salida" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
            <PackageMinus size={18} /> Nota de Salida
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleFiltrar} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex rounded-xl border border-gray-200 overflow-hidden shrink-0">
          {FILTROS.map(f => (
            <button
              type="button"
              key={f.value}
              onClick={() => { setTipo(f.value); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tipo === f.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="N° de nota, motivo, persona, destino, doc. referencia..."
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
                <th className="py-3 px-4">N° Nota</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Almacén</th>
                <th className="py-3 px-4">Destino / Procedencia</th>
                <th className="py-3 px-4 text-center">Ítems</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-400">Cargando notas...</td></tr>
              ) : notas.length === 0 ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-400">No hay notas registradas.</td></tr>
              ) : notas.map(n => (
                <tr key={n.id} className={`hover:bg-gray-50/50 ${n.estado == 0 ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4 font-mono font-bold text-gray-800">{n.codigo}</td>
                  <td className="py-3 px-4 text-gray-600">{n.fecha}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${n.tipo === 'INGRESO' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {n.tipo === 'INGRESO' ? 'Ingreso' : 'Salida'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{n.motivo}</td>
                  <td className="py-3 px-4 text-gray-600">{n.almacen?.name || '-'}</td>
                  <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={n.area || ''}>{n.area || '-'}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{n.detalles_count}</td>
                  <td className="py-3 px-4 text-center">
                    {n.estado == 0
                      ? <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">Anulada</span>
                      : <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Registrada</span>}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <a href={`${API_URL}/notas-almacen/${n.id}/pdf`} target="_blank" rel="noreferrer" className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Ver PDF">
                        <FileText size={16} />
                      </a>
                      {n.estado == 1 && (
                        <button onClick={() => handleAnular(n)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Anular">
                          <Ban size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

export default NotasAlmacen;
