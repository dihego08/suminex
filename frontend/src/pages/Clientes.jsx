import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, User, X } from 'lucide-react';

import { API_URL } from '../config';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el Modal
  const emptyForm = {
    ruc: '', razon_social: '', direccion: '', telefono: '', email: '',
    tipo_pago: 0, banco: 'BCP', nro_cuenta: '', whatsapp: '', tiene_credito: false, limite_credito: ''
  };
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get(`${API_URL}/clientes`);
      setClientes(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching clientes:', error);
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (cliente) => {
    setEditingId(cliente.id);
    setFormData({
      ruc: cliente.ruc || '',
      razon_social: cliente.razon_social || '',
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      email: cliente.email || '',
      tipo_pago: Number(cliente.tipo_pago) || 0,
      banco: cliente.banco || 'BCP',
      nro_cuenta: cliente.nro_cuenta || '',
      whatsapp: cliente.whatsapp || '',
      tiene_credito: cliente.tiene_credito == 1,
      limite_credito: cliente.limite_credito ?? ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/clientes/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/clientes`, formData);
      }
      closeModal();
      setFormData(emptyForm);
      fetchClientes(); // Recargar la lista
    } catch (error) {
      const data = error.response?.data;
      const detalle = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : (data?.error || data?.message || error.message);
      alert(`Error al ${editingId ? 'actualizar' : 'crear'} el cliente:\n` + detalle);
    }
  };

  const handleDelete = async (cliente) => {
    if (!window.confirm(`¿Seguro que deseas eliminar al cliente "${cliente.razon_social}"?`)) return;
    try {
      await axios.delete(`${API_URL}/clientes/${cliente.id}`);
      fetchClientes();
    } catch (error) {
      alert("Error al eliminar el cliente: " + (error.response?.data?.error || error.response?.data?.message || error.message));
    }
  };

  const filteredClientes =clientes.filter(c =>
    c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ruc.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por RUC o Razón Social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/30"
        >
          <Plus size={20} />
          Nuevo Cliente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando clientes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">RUC</th>
                  <th className="p-4 font-semibold">Razón Social</th>
                  <th className="p-4 font-semibold">Dirección</th>
                  <th className="p-4 font-semibold">Contacto</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredClientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  filteredClientes.map((cliente) => (
                    <tr key={cliente.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{cliente.ruc}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <User size={16} />
                          </div>
                          <span className="font-medium text-gray-800">{cliente.razon_social}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 text-sm">{cliente.direccion || 'No especificada'}</td>
                      <td className="p-4 text-gray-600 text-sm">
                        {cliente.telefono && <div>{cliente.telefono}</div>}
                        {cliente.email && <div>{cliente.email}</div>}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cliente.estado ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                          {cliente.estado ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => handleEdit(cliente)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(cliente)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 size={18} />
                          </button>
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

      {/* Modal de Nuevo / Editar Cliente */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
                  <input type="text" required value={formData.ruc} onChange={(e) => setFormData({ ...formData, ruc: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                  <input type="text" required value={formData.razon_social} onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <input type="text" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                    <input type="text" value={formData.whatsapp} onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
                    <select value={formData.tipo_pago} onChange={(e) => setFormData({ ...formData, tipo_pago: Number(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value={0}>Efectivo</option>
                      <option value={1}>Bancarizado</option>
                    </select>
                  </div>
                  
                  {formData.tipo_pago === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                      <select value={formData.banco} onChange={(e) => setFormData({ ...formData, banco: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                        <option value="BCP">BCP</option>
                        <option value="INTERBANK">INTERBANK</option>
                        <option value="SCOTIABANK">SCOTIABANK</option>
                        <option value="BBVA_CONTINENTAL">BBVA CONTINENTAL</option>
                        <option value="BANCO_DE_CREDITO">BANCO DE CREDITO</option>
                        <option value="MiBanco">MiBanco</option>
                      </select>
                    </div>
                  )}
                </div>

                {formData.tipo_pago === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nro de Cuenta</label>
                    <input type="text" value={formData.nro_cuenta} onChange={(e) => setFormData({ ...formData, nro_cuenta: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="tiene_credito" checked={formData.tiene_credito} onChange={(e) => setFormData({ ...formData, tiene_credito: e.target.checked })} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  <label htmlFor="tiene_credito" className="text-sm font-medium text-gray-700">Activar Crédito</label>
                </div>

                {formData.tiene_credito && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Límite de Crédito</label>
                    <input type="number" step="0.01" value={formData.limite_credito} onChange={(e) => setFormData({ ...formData, limite_credito: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30">
                  {editingId ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
