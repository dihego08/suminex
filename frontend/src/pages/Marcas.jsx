import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Tag, X, Image as ImageIcon } from 'lucide-react';
import { API_URL, SERVER_URL } from '../config';

const emptyForm = { name: '', description: '', image: null };

const Marcas = () => {
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMarca, setEditingMarca] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/marcas`);
      setMarcas(res.data || []);
    } catch (err) {
      console.error('Error al cargar marcas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (marca = null) => {
    if (marca) {
      setEditingMarca(marca);
      setFormData({ name: marca.name || '', description: marca.description || '', image: null });
    } else {
      setEditingMarca(null);
      setFormData(emptyForm);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('El nombre de la marca es obligatorio');
      return;
    }

    const form = new FormData();
    form.append('name', formData.name.trim());
    form.append('description', formData.description || '');
    if (formData.image) form.append('image', formData.image);

    try {
      setSubmitting(true);
      if (editingMarca) {
        form.append('_method', 'PUT');
        await axios.post(`${API_URL}/marcas/${editingMarca.id}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_URL}/marcas`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setModalOpen(false);
      fetchMarcas();
    } catch (err) {
      console.error('Error al guardar marca:', err);
      const errores = err.response?.data?.errors;
      const detalle = errores
        ? Object.values(errores).flat().join('\n')
        : (err.response?.data?.error || err.response?.data?.message || err.message);
      alert('Error al guardar la marca:\n' + detalle);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (marca) => {
    if (!window.confirm(`¿Seguro que deseas eliminar la marca "${marca.name}"?`)) return;
    try {
      await axios.delete(`${API_URL}/marcas/${marca.id}`);
      fetchMarcas();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert(err.response?.data?.error || 'No se pudo eliminar la marca.');
    }
  };

  const filtered = marcas.filter(m =>
    (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-brand-600" /> Marcas
          </h1>
          <p className="text-sm text-gray-500">Gestión de marcas para el catálogo de productos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Nueva Marca
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-16">Imagen</th>
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Descripción</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    Cargando marcas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-400">
                    No se encontraron marcas registradas.
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                        {m.image ? (
                          <img src={`${SERVER_URL}/images/brands/${m.image}`} alt={m.name} className="w-full h-full object-contain" />
                        ) : (
                          <ImageIcon size={16} className="text-gray-300" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900">{m.name}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-md truncate" title={m.description || ''}>
                      {m.description || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                        {m.productos_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(m)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-600 transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingMarca ? 'Editar Marca' : 'Nueva Marca'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  placeholder="Ej. 3M"
                />
                {editingMarca && editingMarca.productos_count > 0 && formData.name.trim() !== editingMarca.name && (
                  <p className="text-xs text-amber-600 mt-1">
                    Se actualizará la marca en {editingMarca.productos_count} producto(s).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Imagen / Logo</label>
                <div className="flex items-center gap-3">
                  {editingMarca?.image && !formData.image && (
                    <img
                      src={`${SERVER_URL}/images/brands/${editingMarca.image}`}
                      alt={editingMarca.name}
                      className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, image: e.target.files[0] || null })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando...' : editingMarca ? 'Actualizar' : 'Guardar Marca'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marcas;
