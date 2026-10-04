import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit, Trash2, Truck, Phone, Mail, MapPin, X } from 'lucide-react';
import { SERVER_URL } from '../config';

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState(null);
  const [formData, setFormData] = useState({
    razon_social: '',
    ruc: '',
    direccion: '',
    telefono: '',
    email: '',
    estado: 1
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProveedores();
  }, [searchTerm, currentPage]);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_URL}/api/proveedores`, {
        params: {
          search: searchTerm,
          page: currentPage,
          per_page: 15
        }
      });
      setProveedores(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error('Error al cargar proveedores:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prov = null) => {
    if (prov) {
      setEditingProveedor(prov);
      setFormData({
        razon_social: prov.razon_social || '',
        ruc: prov.ruc || '',
        direccion: prov.direccion || '',
        telefono: prov.telefono || '',
        email: prov.email || '',
        estado: prov.estado ?? 1
      });
    } else {
      setEditingProveedor(null);
      setFormData({
        razon_social: '',
        ruc: '',
        direccion: '',
        telefono: '',
        email: '',
        estado: 1
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.razon_social || !formData.ruc) {
      alert('RUC y Razón Social son obligatorios');
      return;
    }

    try {
      setSubmitting(true);
      if (editingProveedor) {
        await axios.put(`${SERVER_URL}/api/proveedores/${editingProveedor.id}`, formData);
      } else {
        await axios.post(`${SERVER_URL}/api/proveedores`, formData);
      }
      setModalOpen(false);
      fetchProveedores();
    } catch (err) {
      console.error('Error al guardar proveedor:', err);
      alert('Error al guardar proveedor: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este proveedor?')) return;
    try {
      await axios.delete(`${SERVER_URL}/api/proveedores/${id}`);
      fetchProveedores();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se pudo eliminar el proveedor.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="text-brand-600" /> Directorio de Proveedores
          </h1>
          <p className="text-sm text-gray-500">Gestión de proveedores para compras y abastecimiento</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all"
        >
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por RUC o Razón Social..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">RUC</th>
                <th className="py-3 px-4">Razón Social</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    Cargando proveedores...
                  </td>
                </tr>
              ) : proveedores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-400">
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedores.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-gray-700">{p.ruc}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{p.razon_social}</td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate" title={p.direccion}>
                      {p.direccion ? (
                        <span className="flex items-center gap-1.5 text-xs text-gray-600">
                          <MapPin size={13} className="text-gray-400 shrink-0" /> {p.direccion}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 space-y-0.5 text-xs">
                      {p.telefono && (
                        <div className="flex items-center gap-1">
                          <Phone size={12} className="text-gray-400" /> {p.telefono}
                        </div>
                      )}
                      {p.email && (
                        <div className="flex items-center gap-1 text-gray-500">
                          <Mail size={12} className="text-gray-400" /> {p.email}
                        </div>
                      )}
                      {!p.telefono && !p.email && <span className="text-gray-400">-</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                          p.estado === 1
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                      >
                        {p.estado === 1 ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(p)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-600 transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">
                {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">RUC *</label>
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={formData.ruc}
                    onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    placeholder="Ej. 20601234567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                    placeholder="Ej. 987654321"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  value={formData.razon_social}
                  onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  placeholder="Nombre de la empresa proveedora"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Dirección</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  placeholder="Av. / Calle, Distrito, Ciudad"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm"
                  placeholder="contacto@proveedor.com"
                />
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
                  {submitting ? 'Guardando...' : editingProveedor ? 'Actualizar' : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Proveedores;
