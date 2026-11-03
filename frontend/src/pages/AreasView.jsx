import { useState, useEffect } from 'react';
import api from '../services/api';
import { PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const EMPTY = { area: '' };

export default function AreasView() {
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAreas(); }, []);

  const fetchAreas = async () => {
    try {
      const r = await api.get('/sig/areas');
      setAreas(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditingId(null); setFormData(EMPTY); setShowModal(true); };
  const openEdit = (a) => { setEditingId(a.id); setFormData({ area: a.area || '' }); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingId(null); setFormData(EMPTY); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/sig/areas', { ...formData, id: editingId });
      closeModal(); fetchAreas();
    } catch (err) { alert(err.response?.data?.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta área?')) return;
    try {
      await api.delete(`/sig/areas/${id}`);
      fetchAreas();
    } catch (e) { alert('Error al eliminar'); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Áreas</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de áreas de la organización</p>
        </div>
        <button onClick={openCreate} className="bg-gray-800 text-white px-5 py-2.5 rounded-md hover:bg-gray-700 shadow-sm font-medium transition-colors flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Nueva Área
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 font-bold">ID</th>
              <th className="px-6 py-4 font-bold">Nombre del Área</th>
              <th className="px-6 py-4 font-bold text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">Cargando áreas...</td></tr>}
            {!loading && areas.length === 0 && <tr><td colSpan="3" className="px-6 py-10 text-center text-gray-400">No hay áreas registradas.</td></tr>}
            {areas.map(a => (
              <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-500 font-mono">#{a.id}</td>
                <td className="px-6 py-4 font-bold text-gray-800">{a.area}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => openEdit(a)} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Editar">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(a.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Área' : 'Nueva Área'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Área *</label>
                <input
                  required
                  type="text"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:border-blue-500 outline-none text-sm font-medium"
                  value={formData.area}
                  onChange={e => setFormData({ area: e.target.value })}
                  placeholder="Ej: Administración, Producción..."
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button type="button" onClick={closeModal} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm disabled:opacity-60 transition-all shadow-lg shadow-blue-500/20">
                  {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
