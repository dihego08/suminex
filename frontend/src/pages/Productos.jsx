import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit, Trash2, Search, Package, X, FileText } from 'lucide-react';

import { API_URL, SERVER_URL } from '../config';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [codigosSunat, setCodigosSunat] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    descripcion: '',
    marca: '',
    unidad_medida: 'UND',
    stock: 0,
    precio_base: 0,
    tipo: 1,
    nombre: '',
    codigo_barras: '',
    presentacion: '',
    largo: '',
    ancho: '',
    alto: '',
    peso: '',
    stock_minimo: 10,
    precio_compra: 0,
    fecha_actualizacion: '',
    imagen: null,
    ficha_tecnica: null,
    unidades_secundarias: []
  });

  useEffect(() => {
    fetchProductos();
    fetchCodigosSunat();
    fetchMarcas();
  }, []);

  const fetchMarcas = async () => {
    try {
      const response = await axios.get(`${API_URL}/marcas`);
      setMarcas(response.data);
    } catch (error) {
      console.error('Error fetching marcas:', error);
    }
  };

  const fetchCodigosSunat = async () => {
    try {
      const response = await axios.get(`${API_URL}/codigos-sunat`);
      setCodigosSunat(response.data);
    } catch (error) {
      console.error('Error fetching codigos SUNAT:', error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get(`${API_URL}/productos`);
      setProductos(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching productos:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const form = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'unidades_secundarias') {
          form.append(key, JSON.stringify(formData[key]));
        } else if (formData[key] !== null && formData[key] !== '') {
          form.append(key, formData[key]);
        }
      });

      if (editingId) {
        form.append('_method', 'PUT');
        await axios.post(`${API_URL}/productos/${editingId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API_URL}/productos`, form, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setShowModal(false);
      setEditingId(null);
      setFormData({ codigo: '', descripcion: '', marca: '', unidad_medida: 'UND', stock: 0, precio_base: 0, tipo: 1, nombre: '', codigo_barras: '', presentacion: '', largo: '', ancho: '', alto: '', peso: '', stock_minimo: 10, precio_compra: 0, fecha_actualizacion: '', imagen: null, ficha_tecnica: null, unidades_secundarias: [] });
      fetchProductos(); // Recargar la lista
    } catch (error) {
      alert(`Error al ${editingId ? 'actualizar' : 'crear'} el producto: ` + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (producto) => {
    setFormData({
      codigo: producto.codigo || '',
      descripcion: producto.descripcion || '',
      marca: producto.marca || '',
      unidad_medida: producto.unidad_medida || 'UND',
      stock: producto.stock || 0,
      precio_base: producto.precio_base || 0,
      tipo: producto.tipo || 1,
      nombre: producto.nombre || '',
      codigo_barras: producto.codigo_barras || '',
      presentacion: producto.presentacion || '',
      largo: producto.largo || '',
      ancho: producto.ancho || '',
      alto: producto.alto || '',
      peso: producto.peso || '',
      stock_minimo: producto.stock_minimo || 10,
      precio_compra: producto.precio_compra || 0,
      fecha_actualizacion: producto.fecha_actualizacion || '',
      imagen: null,
      ficha_tecnica: null,
      unidades_secundarias: producto.unidades_secundarias || []
    });
    setEditingId(producto.id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      try {
        await axios.delete(`${API_URL}/productos/${id}`);
        fetchProductos();
      } catch (error) {
        alert("Error al eliminar el producto: " + (error.response?.data?.error || error.message));
      }
    }
  };

  const filteredProductos = productos.filter(p =>
    (p.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ codigo: '', descripcion: '', marca: '', unidad_medida: 'UND', stock: 0, precio_base: 0, tipo: 1, nombre: '', codigo_barras: '', presentacion: '', largo: '', ancho: '', alto: '', peso: '', stock_minimo: 10, precio_compra: 0, fecha_actualizacion: '', imagen: null, ficha_tecnica: null, unidades_secundarias: [] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-500/30"
        >
          <Plus size={20} />
          Nuevo Producto
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Cargando productos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold w-16">Imagen</th>
                  <th className="p-4 font-semibold">Código</th>
                  <th className="p-4 font-semibold">Nombre</th>
                  <th className="p-4 font-semibold">Descripción</th>
                  <th className="p-4 font-semibold text-center">Stock</th>
                  <th className="p-4 font-semibold text-right">Precio Base</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProductos.map((producto) => (
                    <tr key={producto.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        {producto.imagen ? (
                          <img 
                            src={`${SERVER_URL}/images/products/${producto.imagen}`} 
                            alt={producto.nombre}
                            className="w-10 h-10 object-cover rounded shadow-sm border border-gray-200 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setSelectedImage(producto.imagen)}
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded flex items-center justify-center text-gray-400">
                            <Package size={20} strokeWidth={1.5} />
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-gray-900">{producto.codigo}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium text-gray-800">{producto.nombre}</div>
                            {producto.marca && <div className="text-xs text-gray-500">{producto.marca}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">{producto.descripcion}</div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${producto.stock > 10 ? 'bg-green-100 text-green-800' :
                          producto.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {producto.stock} {producto.unidad_medida}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        S/ {producto.precio_base}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center gap-3">
                          {producto.ficha_tecnica && (
                            <a 
                              href={`${SERVER_URL}/${producto.ficha_tecnica}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Descargar Ficha Técnica"
                            >
                              <FileText size={18} />
                            </a>
                          )}
                          <button onClick={() => handleEdit(producto)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDelete(producto.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
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

      {/* Modal de Nuevo Producto */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">{editingId ? 'Editar Producto' : 'Registrar Nuevo Producto'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              <div className="space-y-4">
                {/* Archivos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
                    <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, imagen: e.target.files[0] })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ficha Técnica (PDF, Doc, etc)</label>
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={(e) => setFormData({ ...formData, ficha_tecnica: e.target.files[0] })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Primera Fila */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={formData.tipo} onChange={(e) => setFormData({ ...formData, tipo: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value={1}>Producto</option>
                      <option value={2}>Servicio</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Código/Modelo *</label>
                    <input type="text" required value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Barras</label>
                    <input type="text" value={formData.codigo_barras} onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                    <select value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      <option value="">Seleccione una marca</option>
                      {marcas.map((m) => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Segunda Fila */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                    <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <input type="text" value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Tercera Fila */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidad</label>
                    <select value={formData.unidad_medida} onChange={(e) => setFormData({ ...formData, unidad_medida: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      {codigosSunat.map((c, i) => (
                        <option key={i} value={c.codigo || c.id}>{c.codigo || c.id} - {c.unidad}</option>
                      ))}
                      {codigosSunat.length === 0 && <option value="UND">UND</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
                    <input type="text" value={formData.presentacion} onChange={(e) => setFormData({ ...formData, presentacion: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial</label>
                    <input type="number" required value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
                    <input type="number" value={formData.stock_minimo} onChange={(e) => setFormData({ ...formData, stock_minimo: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Cuarta Fila (Dimensiones y Fecha) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Largo</label>
                    <input type="text" value={formData.largo} onChange={(e) => setFormData({ ...formData, largo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ancho</label>
                    <input type="text" value={formData.ancho} onChange={(e) => setFormData({ ...formData, ancho: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alto</label>
                    <input type="text" value={formData.alto} onChange={(e) => setFormData({ ...formData, alto: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso</label>
                    <input type="text" value={formData.peso} onChange={(e) => setFormData({ ...formData, peso: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fec. Actualización</label>
                    <input type="date" value={formData.fecha_actualizacion} onChange={(e) => setFormData({ ...formData, fecha_actualizacion: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Quinta Fila (Precios) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra S/</label>
                    <input type="number" step="0.01" value={formData.precio_compra} onChange={(e) => setFormData({ ...formData, precio_compra: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta S/ *</label>
                    <input type="number" step="0.01" required value={formData.precio_base} onChange={(e) => setFormData({ ...formData, precio_base: parseFloat(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" />
                  </div>
                </div>

                {/* Sección Unidades Secundarias */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-gray-700 text-sm">Unidades Equivalentes</h4>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, unidades_secundarias: [...formData.unidades_secundarias, { unidad_medida: 'CJA', factor_conversion: 1, precio: '' }] })}
                      className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded flex items-center gap-1 font-medium transition"
                    >
                      <Plus size={14} /> Añadir Unidad
                    </button>
                  </div>

                  {formData.unidades_secundarias.length > 0 && (
                    <div className="space-y-2">
                      {formData.unidades_secundarias.map((unidad, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <select
                            required
                            value={unidad.unidad_medida}
                            onChange={(e) => {
                              const newU = [...formData.unidades_secundarias];
                              newU[index].unidad_medida = e.target.value;
                              setFormData({ ...formData, unidades_secundarias: newU });
                            }}
                            className="w-1/3 border border-gray-300 rounded p-2 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">Seleccionar...</option>
                            {codigosSunat.map((c, i) => (
                              <option key={i} value={c.codigo || c.id}>{c.codigo || c.id} - {c.unidad}</option>
                            ))}
                            {codigosSunat.length === 0 && <option value="CJA">CJA</option>}
                          </select>
                          <div className="flex items-center gap-1 w-1/3">
                            <span className="text-sm text-gray-500">=</span>
                            <input
                              type="number" step="0.01" placeholder="Cant. Base" required
                              value={unidad.factor_conversion}
                              onChange={(e) => {
                                const newU = [...formData.unidades_secundarias];
                                newU[index].factor_conversion = parseFloat(e.target.value);
                                setFormData({ ...formData, unidades_secundarias: newU });
                              }}
                              className="w-full border border-gray-300 rounded p-2 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <input
                            type="number" step="0.01" placeholder="Precio Especial (Opcional)"
                            value={unidad.precio}
                            onChange={(e) => {
                              const newU = [...formData.unidades_secundarias];
                              newU[index].precio = e.target.value ? parseFloat(e.target.value) : '';
                              setFormData({ ...formData, unidades_secundarias: newU });
                            }}
                            className="w-1/3 border border-gray-300 rounded p-2 text-sm bg-gray-50 outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newU = formData.unidades_secundarias.filter((_, i) => i !== index);
                              setFormData({ ...formData, unidades_secundarias: newU });
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/30">
                  {editingId ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img 
              src={`${SERVER_URL}/images/${selectedImage}`} 
              alt="Producto" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <X size={32} />
            </button>
            <img 
              src={`${SERVER_URL}/images/products/${selectedImage}`} 
              alt="Producto" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Productos;
