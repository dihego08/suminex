import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft, Receipt, Calendar, User, FileText, Image as ImageIcon, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

import { API_URL } from '../config';

const NuevaOrden = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);

  const [formData, setFormData] = useState({
    id_cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days later
    terminos_condiciones: 'Condiciones Generales:\n- Validez de la oferta: 15 días.\n- Tiempo de entrega: Previa coordinación.\n- Forma de pago: Al contado.'
  });

  // Client Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Use state to track multiple active dropdowns is tricky, better to track index
  const [activeProductDropdown, setActiveProductDropdown] = useState(null);

  const [detalles, setDetalles] = useState([
    { id_producto: '', nota: '', cantidad: 1, unidad_medida: 'UND', precio_unitario: 0, total: 0, imagen: null, nombre: '', busqueda: '' }
  ]);

  useEffect(() => {
    // Cargar Catálogos
    axios.get(`${API_URL}/clientes`).then(res => setClientes(res.data));
    axios.get(`${API_URL}/productos`).then(res => setProductos(res.data));

    if (isEditing) {
      axios.get(`${API_URL}/ordenes/${id}`).then(res => {
        const cot = res.data;
        setFormData({
          id_cliente: cot.id_cliente,
          fecha: cot.fecha,
          fecha_vencimiento: cot.fecha_vencimiento,
          terminos_condiciones: cot.terminos_condiciones || ''
        });
        
        if (cot.cliente) {
          setSearchTerm(`${cot.cliente.razon_social} (RUC: ${cot.cliente.ruc})`);
        }

        if (cot.detalles && cot.detalles.length > 0) {
          setDetalles(cot.detalles.map(d => ({
            id_producto: d.id_producto,
            nota: d.descripcion_personalizada || '',
            cantidad: d.cantidad,
            unidad_medida: d.producto?.unidad_medida || 'UND',
            precio_unitario: d.precio_unitario,
            total: d.total,
            imagen: d.producto?.imagen || null,
            nombre: d.producto?.nombre || '',
            busqueda: d.producto ? `${d.producto.codigo} - ${d.producto.nombre}` : ''
          })));
        }
      });
    }

    // Close dropdowns on outside click
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      
      // A simple way to close product dropdown if clicking outside
      if (!event.target.closest('.product-search-container')) {
        setActiveProductDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [id, isEditing]);

  const handleDetalleChange = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;

    if (field === 'cantidad' || field === 'precio_unitario') {
      newDetalles[index].total = newDetalles[index].cantidad * newDetalles[index].precio_unitario;
    }

    setDetalles(newDetalles);
  };

  const selectProduct = (index, prod) => {
    let finalPrice = prod.precio_base;
    const baseUnit = prod.unidad_medida || 'UND';
    
    // Historial de precios por cliente
    if (formData.id_cliente && prod.precios_clientes) {
      const precioEspecial = prod.precios_clientes.find(pc => pc.id_cliente === formData.id_cliente && (pc.unidad_medida === baseUnit || !pc.unidad_medida));
      if (precioEspecial) {
        finalPrice = precioEspecial.precio_personalizado;
      }
    }

    const newDetalles = [...detalles];
    newDetalles[index].id_producto = prod.id;
    newDetalles[index].nota = ''; 
    newDetalles[index].nombre = prod.nombre;
    newDetalles[index].precio_unitario = finalPrice;
    newDetalles[index].unidad_medida = baseUnit;
    newDetalles[index].unidades_secundarias = prod.unidades_secundarias || [];
    newDetalles[index].imagen = prod.imagen;
    newDetalles[index].busqueda = `${prod.codigo} - ${prod.nombre}`;
    newDetalles[index].total = finalPrice * newDetalles[index].cantidad;
    
    setDetalles(newDetalles);
    setActiveProductDropdown(null);
  };

  const addRow = () => {
    setDetalles([...detalles, { id_producto: '', nota: '', cantidad: 1, unidad_medida: 'UND', precio_unitario: 0, total: 0, imagen: null, nombre: '', busqueda: '' }]);
  };

  const removeRow = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const selectClient = (client) => {
    setFormData({ ...formData, id_cliente: client.id });
    setSearchTerm(`${client.razon_social} (RUC: ${client.ruc})`);
    setShowDropdown(false);
  };

  const filteredClients = clientes.filter(c => 
    c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.ruc.includes(searchTerm)
  );

  const subtotal = detalles.reduce((acc, curr) => acc + curr.total, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente) {
      alert("Por favor seleccione un cliente de la lista.");
      return;
    }

    const missingProduct = detalles.find(d => !d.id_producto);
    if (missingProduct) {
      alert("Por favor seleccione un producto válido en todos los ítems.");
      return;
    }

    try {
      const detallesFormateados = detalles.map(d => ({
        ...d,
        descripcion_personalizada: d.nota
      }));

      const payload = {
        ...formData,
        base_imponible: subtotal.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
        detalles: detallesFormateados
      };

      if (isEditing) {
        await axios.put(`${API_URL}/ordenes/${id}`, payload);
      } else {
        await axios.post(`${API_URL}/ordenes`, payload);
      }
      
      navigate('/ordenes');
    } catch (error) {
      alert("Error al guardar la orden de pedido");
      console.error(error);
    }
  };

  // Helper classes for inputs
  const inputClassName = "w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm";
  const tableInputClassName = "w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link to="/ordenes" className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {isEditing ? 'Editar Orden de Pedido' : 'Crear Nueva Orden de Pedido'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete los detalles para generar un nuevo presupuesto</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Encabezado de la Orden de Pedido */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Receipt className="text-blue-500" size={20} /> Detalles Generales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative" ref={dropdownRef}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-gray-400" /> Cliente
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar por RUC o Razón Social..."
                  value={searchTerm}
                  onFocus={() => setShowDropdown(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setFormData({...formData, id_cliente: ''}); // Reset ID if user types freely
                    setShowDropdown(true);
                  }}
                  className={`${inputClassName} pl-10`}
                />
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => selectClient(c)}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                      >
                        <div className="font-medium text-gray-800">{c.razon_social}</div>
                        <div className="text-sm text-gray-500">RUC: {c.ruc}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No se encontraron clientes</div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" /> Fecha Emisión
              </label>
              <input
                type="date" required
                value={formData.fecha}
                onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" /> Fecha Vencimiento
              </label>
              <input
                type="date" required
                value={formData.fecha_vencimiento}
                onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Detalles de los Items */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="text-blue-500" size={20} /> Ítems de Orden de Pedido
            </h2>
            <button 
              type="button" 
              onClick={addRow} 
              className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
            >
              <Plus size={18} /> Añadir Ítem
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto pb-32"> {/* Extra padding bottom for dropdowns */}
              <table className="w-full text-left whitespace-nowrap min-w-[1000px]">
                <thead className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                  <tr>
                    <th className="p-4 font-semibold w-16 text-center">Img</th>
                    <th className="p-4 font-semibold w-[350px]">Producto</th>
                    <th className="p-4 font-semibold">Nota</th>
                    <th className="p-4 font-semibold w-20">Unidad</th>
                    <th className="p-4 font-semibold w-24">Cant.</th>
                    <th className="p-4 font-semibold w-32">Costo/Precio</th>
                    <th className="p-4 font-semibold w-32">Total</th>
                    <th className="p-4 font-semibold w-16 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {detalles.map((det, index) => {
                    const filteredProducts = productos.filter(p => 
                      p.nombre?.toLowerCase().includes((det.busqueda || '').toLowerCase()) || 
                      p.codigo?.toLowerCase().includes((det.busqueda || '').toLowerCase())
                    );

                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-3 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200 mx-auto">
                            {det.imagen ? (
                              <img src={det.imagen} alt="Producto" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-gray-400" />
                            )}
                          </div>
                        </td>
                        <td className="p-3 relative product-search-container">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                              <Search size={14} className="text-gray-400" />
                            </div>
                            <input
                              type="text"
                              placeholder="Buscar producto..."
                              value={det.busqueda}
                              onFocus={() => setActiveProductDropdown(index)}
                              onChange={(e) => {
                                handleDetalleChange(index, 'busqueda', e.target.value);
                                handleDetalleChange(index, 'id_producto', ''); // Clear ID to force selection
                                setActiveProductDropdown(index);
                              }}
                              className={`${tableInputClassName} pl-8`}
                            />
                          </div>
                          {activeProductDropdown === index && (
                            <div className="absolute z-50 w-[400px] mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.slice(0, 50).map(p => (
                                  <div 
                                    key={p.id} 
                                    onClick={() => selectProduct(index, p)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors flex gap-3 items-center"
                                  >
                                    {p.imagen ? (
                                      <img src={p.imagen} alt={p.nombre} className="w-10 h-10 rounded-md object-cover bg-gray-100" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-md bg-gray-100 flex justify-center items-center"><ImageIcon size={16} className="text-gray-400"/></div>
                                    )}
                                    <div>
                                      <div className="font-medium text-gray-800 text-sm whitespace-normal break-words">{p.nombre}</div>
                                      <div className="text-xs text-gray-500">Cód: {p.codigo} | S/ {p.precio_base}</div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-4 text-center text-gray-500 text-sm">No se encontraron productos</div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="text" 
                            value={det.nota}
                            onChange={(e) => handleDetalleChange(index, 'nota', e.target.value)}
                            placeholder="Nota (Ej. Color rojo)"
                            className={tableInputClassName}
                          />
                        </td>
                        <td className="p-3">
                          {det.unidades_secundarias && det.unidades_secundarias.length > 0 ? (
                            <select 
                              className={tableInputClassName}
                              value={det.unidad_medida}
                              onChange={(e) => {
                                const selected = e.target.value;
                                const prod = productos.find(p => p.id === det.id_producto);
                                const baseUnit = prod?.unidad_medida || 'UND';
                                let newPrice = det.precio_unitario;
                                
                                if (selected === baseUnit) {
                                  newPrice = prod.precio_base;
                                  if (formData.id_cliente && prod.precios_clientes) {
                                    const precioEspecial = prod.precios_clientes.find(pc => pc.id_cliente === formData.id_cliente && (pc.unidad_medida === baseUnit || !pc.unidad_medida));
                                    if (precioEspecial) newPrice = precioEspecial.precio_personalizado;
                                  }
                                } else {
                                  let hasSpecialUnitPrice = false;
                                  if (formData.id_cliente && prod.precios_clientes) {
                                    const precioEspecial = prod.precios_clientes.find(pc => pc.id_cliente === formData.id_cliente && pc.unidad_medida === selected);
                                    if (precioEspecial) {
                                      newPrice = precioEspecial.precio_personalizado;
                                      hasSpecialUnitPrice = true;
                                    }
                                  }

                                  if (!hasSpecialUnitPrice) {
                                    const obj = det.unidades_secundarias.find(u => u.unidad_medida === selected);
                                    if (obj && obj.precio) {
                                       newPrice = obj.precio;
                                    } else if (obj && obj.factor_conversion) {
                                       let basePrice = prod.precio_base;
                                       if (formData.id_cliente && prod.precios_clientes) {
                                         const precioEspecial = prod.precios_clientes.find(pc => pc.id_cliente === formData.id_cliente && (pc.unidad_medida === baseUnit || !pc.unidad_medida));
                                         if (precioEspecial) basePrice = precioEspecial.precio_personalizado;
                                       }
                                       newPrice = basePrice * obj.factor_conversion;
                                    }
                                  }
                                }
                                
                                handleDetalleChange(index, 'unidad_medida', selected);
                                handleDetalleChange(index, 'precio_unitario', newPrice);
                              }}
                            >
                              <option value={productos.find(p => p.id === det.id_producto)?.unidad_medida || 'UND'}>
                                {productos.find(p => p.id === det.id_producto)?.unidad_medida || 'UND'}
                              </option>
                              {det.unidades_secundarias.map(u => (
                                <option key={u.id} value={u.unidad_medida}>{u.unidad_medida}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="text-sm font-medium text-gray-600 px-2 py-2 bg-gray-100 rounded-lg text-center border border-transparent">
                              {det.unidad_medida || 'UND'}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <input
                            type="number" required min="1"
                            value={det.cantidad}
                            onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value))}
                            className={tableInputClassName}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number" required step="0.01"
                            value={det.precio_unitario}
                            onChange={(e) => handleDetalleChange(index, 'precio_unitario', parseFloat(e.target.value))}
                            className={tableInputClassName}
                          />
                        </td>
                        <td className="p-3 font-medium text-gray-700">
                          S/ {det.total.toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {detalles.length > 1 ? (
                            <button 
                              type="button" 
                              onClick={() => removeRow(index)} 
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar ítem"
                            >
                              <Trash2 size={18} />
                            </button>
                          ) : (
                            <div className="w-[34px] h-[34px] inline-block"></div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {detalles.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-gray-500">
                        No hay ítems en la orden de pedido. Haga clic en "Añadir Ítem" para comenzar.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Resumen y Guardar */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="w-full md:w-1/2">
             <label className="block text-sm font-medium text-gray-700 mb-2">
                Texto Predeterminado (Editable)
             </label>
             <textarea 
               rows="4"
               value={formData.terminos_condiciones}
               onChange={(e) => setFormData({...formData, terminos_condiciones: e.target.value})}
               className="w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm resize-y"
             ></textarea>
          </div>

          <div className="w-full md:w-80 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4 pb-2 border-b">Resumen</h3>
            <div className="flex justify-between mb-3 text-sm text-gray-600">
              <span>Base Imponible:</span>
              <span className="font-medium">S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm text-gray-600">
              <span>IGV (18%):</span>
              <span className="font-medium">S/ {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-xl text-gray-900 border-t pt-4">
              <span>TOTAL:</span>
              <span className="text-blue-600">S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button 
            type="submit" 
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 w-full md:w-auto"
          >
            <Save size={20} /> {isEditing ? 'Actualizar Orden de Pedido' : 'Guardar Orden de Pedido'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaOrden;

