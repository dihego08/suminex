import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Briefcase, X } from 'lucide-react';
import api from '../services/api';

const emptyForm = { cargo: '', id_referencia: '' };

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm';
const labelClass = 'block text-xs font-semibold text-gray-700 uppercase mb-1';

const mensajeError = (err, porDefecto) => {
  const data = err.response?.data;
  return data?.errors ? Object.values(data.errors).flat().join('\n') : (data?.error || data?.message || porDefecto);
};

const Cargos = () => {
  const [cargos, setCargos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCargos();
    api.get('/cargos/clientes').then(res => setClientes(res.data || [])).catch(() => {});
  }, []);

  const fetchCargos = async () => {
    try {
      setLoading(true);
      setErrorCarga('');
      const res = await api.get('/cargos');
      setCargos(res.data || []);
    } catch (err) {
      setErrorCarga(mensajeError(err, 'No se pudieron cargar los cargos.'));
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (cargo = null) => {
    setEditingId(cargo ? cargo.id : null);
    setFormData(cargo ? { cargo: cargo.cargo || '', id_referencia: cargo.id_referencia || '' } : emptyForm);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/cargos/${editingId}`, formData);
      } else {
        await api.post('/cargos', formData);
      }
      setModalOpen(false);
      fetchCargos();
    } catch (err) {
      alert('Error al guardar el cargo:\n' + mensajeError(err, err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const eliminar = async (cargo) => {
    if (!window.confirm(`¿Eliminar el cargo "${cargo.cargo}"?`)) return;
    try {
      await api.delete(`/cargos/${cargo.id}`);
      fetchCargos();
    } catch (err) {
      alert(mensajeError(err, 'No se pudo eliminar el cargo.'));
    }
  };

  const termino = searchTerm.toLowerCase();
  const filtrados = cargos.filter(c =>
    (c.cargo || '').toLowerCase().includes(termino) || (c.cliente || '').toLowerCase().includes(termino)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase className="text-brand-600" /> Cargos
          </h1>
          <p className="text-sm text-gray-500">Cargos que se asignan a los usuarios del sistema</p>
        </div>
        <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
          <Plus size={18} /> Nuevo Cargo
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por cargo o cliente de referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Cliente de referencia</th>
                <th className="py-3 px-4 text-center">Usuarios activos</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-400">Cargando cargos...</td></tr>
              ) : errorCarga ? (
                <tr><td colSpan="4" className="py-8 text-center text-red-600">{errorCarga}</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="4" className="py-8 text-center text-gray-400">No se encontraron cargos.</td></tr>
              ) : filtrados.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{c.cargo}</td>
                  <td className="py-3 px-4 text-gray-500">{c.cliente || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">{c.usuarios_count}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirModal(c)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-600 transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => eliminar(c)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar Cargo' : 'Nuevo Cargo'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Cargo *</label>
                <input required maxLength={50} className={inputClass} value={formData.cargo} onChange={e => setFormData({ ...formData, cargo: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Cliente de referencia</label>
                <select className={`${inputClass} bg-white`} value={formData.id_referencia} onChange={e => setFormData({ ...formData, id_referencia: e.target.value })}>
                  <option value="">Ninguno</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
                  {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar Cargo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cargos;
