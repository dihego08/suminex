import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2, Search, Edit2, User, Package, Save, X } from 'lucide-react';
import { API_URL } from '../config';

const PreciosCliente = () => {
  const [precios, setPrecios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchClienteTerm, setSearchClienteTerm] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [searchProductoTerm, setSearchProductoTerm] = useState('');
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  
  const [formData, setFormData] = useState({
    id_cliente: '',
    id_producto: '',
    unidad_medida: '',
    precio_personalizado: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resPrecios, resClientes, resProductos] = await Promise.all([
        axios.get(`${API_URL}/precios-cliente`),
        axios.get(`${API_URL}/clientes`),
        axios.get(`${API_URL}/productos`)
      ]);
      setPrecios(resPrecios.data);
      setClientes(resClientes.data);
      setProductos(resProductos.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (precio) => {
    setEditingId(precio.id);
    setFormData({
      id_cliente: precio.id_cliente,
      id_producto: precio.id_producto,
      unidad_medida: precio.unidad_medida || '',
      precio_personalizado: precio.precio_personalizado
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Seguro que deseas eliminar este precio personalizado?")) {
      await axios.delete(`${API_URL}/precios-cliente/${id}`);
      fetchData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/precios-cliente/${editingId}`, formData);
      } else {
        await axios.post(`${API_URL}/precios-cliente`, formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ id_cliente: '', id_producto: '', unidad_medida: '', precio_personalizado: '' });
      fetchData();
    } catch (e) {
      alert("Error al guardar");
    }
  };

  const filteredPrecios = precios.filter(p => 
    p.cliente?.razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.producto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.producto?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Listas de Precios por Cliente</h1>
          <p className="text-gray-500 mt-1">Gestiona precios especiales de productos para cada cliente</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setFormData({id_cliente: '', id_producto: '', unidad_medida: '', precio_personalizado: ''}); setSearchClienteTerm(''); setSearchProductoTerm(''); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30"
        >
          <Plus size={20} /> Nuevo Precio Especial
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por cliente o producto..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-xl pl-10 p-2.5 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Cód. Producto</th>
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Unidad</th>
                <th className="p-4 font-semibold">Precio Base Original</th>
                <th className="p-4 font-semibold text-blue-600">Precio Especial</th>
                <th className="p-4 font-semibold w-24 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPrecios.map(precio => (
                <tr key={precio.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-gray-400"/> {precio.cliente?.razon_social}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{precio.producto?.codigo}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package size={16} className="text-gray-400"/> {precio.producto?.nombre}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{precio.unidad_medida || precio.producto?.unidad_medida || 'UND'}</td>
                  <td className="p-4 text-gray-500">S/ {precio.producto?.precio_base}</td>
                  <td className="p-4 font-bold text-blue-600">S/ {precio.precio_personalizado}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(precio)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                      <button onClick={() => handleDelete(precio.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPrecios.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No se encontraron precios personalizados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'Editar Precio Especial' : 'Nuevo Precio Especial'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Buscador de Cliente */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                {editingId ? (
                  <input type="text" disabled value={clientes.find(c => c.id === formData.id_cliente)?.razon_social || ''} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none text-gray-500" />
                ) : (
                  <>
                    <input 
                      type="text"
                      placeholder="Buscar por RUC o Razón Social..."
                      value={searchClienteTerm || (formData.id_cliente ? clientes.find(c => c.id === formData.id_cliente)?.razon_social : '')}
                      onFocus={() => setShowClienteDropdown(true)}
                      onChange={(e) => {
                        setSearchClienteTerm(e.target.value);
                        setFormData({ ...formData, id_cliente: '' });
                        setShowClienteDropdown(true);
                      }}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {showClienteDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {clientes.filter(c => c.razon_social.toLowerCase().includes((searchClienteTerm || '').toLowerCase()) || c.ruc.includes(searchClienteTerm || '')).map(c => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setFormData({ ...formData, id_cliente: c.id });
                              setSearchClienteTerm(c.razon_social);
                              setShowClienteDropdown(false);
                            }}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-gray-800">{c.razon_social}</div>
                            <div className="text-sm text-gray-500">RUC: {c.ruc}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Buscador de Producto */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                {editingId ? (
                  <input type="text" disabled value={productos.find(p => p.id === formData.id_producto)?.nombre || ''} className="w-full border border-gray-300 rounded-xl p-3 bg-gray-50 outline-none text-gray-500" />
                ) : (
                  <>
                    <input 
                      type="text"
                      placeholder="Buscar por Código o Nombre..."
                      value={searchProductoTerm || (formData.id_producto ? productos.find(p => p.id === formData.id_producto)?.nombre : '')}
                      onFocus={() => setShowProductoDropdown(true)}
                      onChange={(e) => {
                        setSearchProductoTerm(e.target.value);
                        setFormData({ ...formData, id_producto: '', precio_personalizado: '' });
                        setShowProductoDropdown(true);
                      }}
                      className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {showProductoDropdown && (
                      <div className="absolute z-40 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {productos.filter(p => (p.nombre.toLowerCase().includes((searchProductoTerm || '').toLowerCase())) || (p.codigo.toLowerCase().includes((searchProductoTerm || '').toLowerCase()))).map(p => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setFormData({ ...formData, id_producto: p.id, unidad_medida: p.unidad_medida || 'UND', precio_personalizado: p.precio_base });
                              setSearchProductoTerm(p.nombre);
                              setShowProductoDropdown(false);
                            }}
                            className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                          >
                            <div className="font-medium text-gray-800">{p.nombre}</div>
                            <div className="text-sm text-gray-500">Código: {p.codigo} | Precio Base: S/ {p.precio_base}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de Medida</label>
                <select 
                  required
                  value={formData.unidad_medida}
                  onChange={(e) => setFormData({...formData, unidad_medida: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={!formData.id_producto || editingId !== null}
                >
                  {formData.id_producto && (
                    <>
                      <option value={productos.find(x => String(x.id) === String(formData.id_producto))?.unidad_medida || 'UND'}>
                        {productos.find(x => String(x.id) === String(formData.id_producto))?.unidad_medida || 'UND'} (Base)
                      </option>
                      {productos.find(x => String(x.id) === String(formData.id_producto))?.unidades_secundarias?.map(u => (
                        <option key={u.id} value={u.unidad_medida}>{u.unidad_medida}</option>
                      ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio Especial (S/)</label>
                <input 
                  type="number" step="0.01" required
                  value={formData.precio_personalizado}
                  onChange={(e) => setFormData({...formData, precio_personalizado: e.target.value})}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20 flex items-center gap-2">
                  <Save size={18} /> Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreciosCliente;
