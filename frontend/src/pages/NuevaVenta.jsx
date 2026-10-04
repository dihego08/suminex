import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search, Package, User, Calendar, Receipt, FileText } from 'lucide-react';

import { API_URL, SERVER_URL } from '../config';

const NuevaVenta = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    id_cliente: '',
    tipo_documento: '01',
    serie: 'F001',
    correlativo: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date().toISOString().split('T')[0],
    terminos_condiciones: '',
    descuento: 0,
    desc_descuento: '',
    incluye_igv: false,
    id_forma_pago: 1, // 1=Contado, etc (ajustar segun maestras)
    id_estado_pago: 1,
    id_estado_entrega: 1
  });

  const [detalles, setDetalles] = useState([]);
  const [cuotas, setCuotas] = useState([]);

  useEffect(() => {
    fetchInitData();
    if (isEditing) {
      fetchVenta();
    }
  }, [id]);

  useEffect(() => {
    if (!isEditing && formData.serie) {
      fetchCorrelativo(formData.serie);
    }
  }, [formData.serie, isEditing]);

  const fetchCorrelativo = async (serie) => {
    try {
      const res = await axios.get(`${API_URL}/ventas/correlativo/${serie}`);
      setFormData(prev => ({ ...prev, correlativo: res.data.correlativo }));
    } catch (e) {
      console.log('Error fetching correlativo:', e);
    }
  };

  const [ordenes, setOrdenes] = useState([]);
  const [searchOrdenTerm, setSearchOrdenTerm] = useState('');
  const [showOrdenDropdown, setShowOrdenDropdown] = useState(false);
  const ordenDropdownRef = useRef(null);

  const fetchInitData = async () => {
    const resCli = await axios.get(`${API_URL}/clientes`);
    setClientes(resCli.data);
    const resProd = await axios.get(`${API_URL}/productos`);
    setProductos(resProd.data);
    const resOrd = await axios.get(`${API_URL}/ordenes`);
    setOrdenes(resOrd.data);
  };

  const selectOrden = (orden) => {
    // Si la orden no tiene cliente directo, saca el de su cotización
    const idCliente = orden.id_cliente || orden.cotizacion?.id_cliente;
    const clientFound = clientes.find(c => c.id === idCliente) || orden.cliente || orden.cotizacion?.cliente;
    
    setFormData(prev => ({
      ...prev,
      id_cliente: idCliente,
      id_orden_pedido: orden.id
    }));

    if (clientFound) {
      setSearchTerm(`${clientFound.ruc} - ${clientFound.razon_social}`);
    }

    setDetalles(orden.detalles.map(d => ({
      id_producto: d.id_producto,
      nombre: d.producto?.nombre,
      codigo: d.producto?.codigo,
      cantidad: d.cantidad,
      precio: d.precio_unitario,
      nota: d.descripcion_personalizada || ''
    })));

    setSearchOrdenTerm(orden.numero || `OP-${String(orden.id).padStart(5, '0')}`);
    setShowOrdenDropdown(false);
  };

  const buscarRuc = async () => {
    const ruc = prompt("Ingrese el RUC a buscar:");
    if (!ruc || ruc.length < 8) return;
    try {
      const res = await axios.get(`https://dbusinessaqp.com/api_ruc/api.php?ruc=${ruc}`);
      if (res.data && res.data.nombre) {
        // Crear cliente
        const payload = {
          tipo_documento: ruc.length === 11 ? 'RUC' : 'DNI',
          ruc: ruc,
          razon_social: res.data.nombre,
          direccion: res.data.direccion || '',
          telefono: '',
          email: ''
        };
        const createRes = await axios.post(`${API_URL}/clientes`, payload);
        const newClient = createRes.data;
        setClientes([...clientes, newClient]);
        selectClient(newClient);
        alert(`Cliente ${newClient.razon_social} agregado y seleccionado.`);
      } else {
        alert("RUC no encontrado o error en la API externa.");
      }
    } catch (e) {
      alert("Error al consultar el RUC.");
      console.error(e);
    }
  };

  const fetchVenta = async () => {
    try {
      const res = await axios.get(`${API_URL}/ventas/${id}`);
      const v = res.data;
      setFormData({
        id_cliente: v.id_cliente,
        tipo_documento: v.tipo_documento,
        serie: v.serie,
        correlativo: v.correlativo,
        fecha_emision: v.fecha_emision,
        fecha_vencimiento: v.fecha_vencimiento || v.fecha_emision,
        terminos_condiciones: v.terminos_condiciones || '',
        descuento: v.descuento || 0,
        desc_descuento: v.desc_descuento || '',
        incluye_igv: v.incluye_igv == 1,
        id_forma_pago: v.id_forma_pago || 1,
        id_estado_pago: v.id_estado_pago || 1,
        id_estado_entrega: v.id_estado_entrega || 1
      });
      // Set client text
      const clientFound = clientes.find(c => c.id === v.id_cliente) || v.cliente;
      if (clientFound) {
        setSearchTerm(`${clientFound.ruc} - ${clientFound.razon_social}`);
      }

      setDetalles(v.detalles.map(d => ({
        id_producto: d.id_producto,
        nombre: d.producto?.nombre,
        codigo: d.producto?.codigo,
        cantidad: d.cantidad,
        precio: d.precio_unitario,
        nota: d.descripcion_personalizada || ''
      })));

      setCuotas(v.cuotas?.map(c => ({
        monto: parseFloat(c.monto),
        fecha_pago: c.fecha_pago
      })) || []);
    } catch (e) {
      console.log(e);
    }
  };

  const selectClient = (client) => {
    setFormData({ ...formData, id_cliente: client.id });
    setSearchTerm(`${client.ruc} - ${client.razon_social}`);
    setShowDropdown(false);
  };

  const agregarDetalle = () => {
    setDetalles([...detalles, { id_producto: '', nombre: '', codigo: '', cantidad: 1, precio: 0, nota: '' }]);
  };

  const actualizarDetalle = (index, field, value) => {
    const newDet = [...detalles];
    newDet[index][field] = value;
    if (field === 'id_producto') {
      const prod = productos.find(p => String(p.id) === String(value));
      if (prod) {
        let finalPrice = prod.precio_base || prod.precio_venta || 0;
        const baseUnit = prod.unidad_medida || 'UND';
        
        // Historial de precios por cliente
        if (formData.id_cliente && prod.precios_clientes) {
          const precioEspecial = prod.precios_clientes.find(pc => pc.id_cliente === formData.id_cliente && (pc.unidad_medida === baseUnit || !pc.unidad_medida));
          if (precioEspecial) {
            finalPrice = precioEspecial.precio_personalizado;
          }
        }
        
        newDet[index].precio = finalPrice;
        newDet[index].nombre = prod.nombre;
        newDet[index].codigo = prod.codigo;
      }
    }
    setDetalles(newDet);
  };

  const eliminarDetalle = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const agregarCuota = () => {
    setCuotas([...cuotas, { monto: '', fecha_pago: '' }]);
  };

  const actualizarCuota = (index, field, value) => {
    const newCuotas = [...cuotas];
    newCuotas[index][field] = value;
    setCuotas(newCuotas);
  };

  const eliminarCuota = (index) => {
    setCuotas(cuotas.filter((_, i) => i !== index));
  };

  // Cálculos
  const rawSubtotal = detalles.reduce((acc, d) => acc + (d.cantidad * d.precio), 0);
  const baseSubtotal = formData.incluye_igv ? rawSubtotal / 1.18 : rawSubtotal;
  
  const descAmount = parseFloat(formData.descuento) || 0;
  const subtotalNeto = Math.max(0, baseSubtotal - descAmount);
  
  const igv = subtotalNeto * 0.18;
  const total = subtotalNeto + igv;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id_cliente) {
      alert("Por favor seleccione un cliente de la lista.");
      return;
    }
    if (detalles.length === 0) {
      alert("Agregue al menos un producto.");
      return;
    }

    try {
      const detallesFormateados = detalles.map(d => ({
        id_producto: d.id_producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio,
        total: d.cantidad * d.precio,
        descripcion_personalizada: d.nota
      }));

      const payload = {
        ...formData,
        subtotal: subtotalNeto.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
        detalles: detallesFormateados,
        cuotas: formData.id_forma_pago === 2 ? cuotas : []
      };

      if (isEditing) {
        await axios.put(`${API_URL}/ventas/${id}`, payload);
      } else {
        await axios.post(`${API_URL}/ventas`, payload);
      }

      navigate('/ventas');
    } catch (error) {
      alert("Error al guardar la venta");
      console.error(error);
    }
  };

  // Helper classes for inputs
  const inputClassName = "w-full border border-gray-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm";
  const tableInputClassName = "w-full border border-gray-200 rounded-lg p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all";

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link to="/ventas" className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {isEditing ? 'Editar Factura/Boleta' : 'Generar Nueva Venta (SUNAT)'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Complete los detalles para emitir su comprobante electrónico</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Receipt className="text-blue-500" size={20} /> Datos del Comprobante
          </h2>

          <div className="mb-6 relative" ref={ordenDropdownRef}>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Search size={16} className="text-gray-400" /> Cargar desde Orden de Pedido / OC
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText size={18} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Escribe el número de Orden o busca por nombre de cliente..."
                value={searchOrdenTerm}
                onFocus={() => setShowOrdenDropdown(true)}
                onChange={(e) => {
                  setSearchOrdenTerm(e.target.value);
                  setShowOrdenDropdown(true);
                }}
                className={`${inputClassName} pl-10 border-blue-200 bg-blue-50/30`}
              />
            </div>
            {showOrdenDropdown && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {ordenes.filter(o => 
                    (o.numero || `OP-${String(o.id).padStart(5, '0')}`).toLowerCase().includes(searchOrdenTerm.toLowerCase()) || 
                    (o.cliente?.razon_social || '').toLowerCase().includes(searchOrdenTerm.toLowerCase()) ||
                    (o.cotizacion?.cliente?.razon_social || '').toLowerCase().includes(searchOrdenTerm.toLowerCase())
                ).map(o => (
                  <div
                    key={o.id}
                    onClick={() => selectOrden(o)}
                    className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                  >
                    <div className="font-medium text-gray-800 text-sm">
                        {o.numero || `OP-${String(o.id).padStart(5, '0')}`}
                    </div>
                    <div className="text-xs text-gray-500">
                        Cliente: {o.cliente?.razon_social || o.cotizacion?.cliente?.razon_social || 'N/A'} - Total: S/ {o.total || '0.00'}
                    </div>
                  </div>
                ))}
                {ordenes.length === 0 && (
                  <div className="p-3 text-sm text-gray-500 text-center">No hay órdenes disponibles</div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative col-span-2" ref={dropdownRef}>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <User size={16} className="text-gray-400" /> Cliente
                <button type="button" onClick={buscarRuc} className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                  + Buscar RUC
                </button>
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
                    setFormData({ ...formData, id_cliente: '' });
                    setShowDropdown(true);
                  }}
                  className={`${inputClassName} pl-10`}
                />
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                  {clientes.filter(c => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) || c.ruc.includes(searchTerm)).map(c => (
                    <div
                      key={c.id}
                      onClick={() => selectClient(c)}
                      className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="font-medium text-gray-800">{c.razon_social}</div>
                      <div className="text-sm text-gray-500">RUC: {c.ruc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <FileText size={16} className="text-gray-400" /> Tipo Comprobante
              </label>
              <select
                value={formData.tipo_documento}
                onChange={(e) => {
                  const tipo = e.target.value;
                  const serieDef = tipo === '01' ? 'F001' : 'B001';
                  setFormData({ ...formData, tipo_documento: tipo, serie: serieDef });
                }}
                className={inputClassName}
              >
                <option value="01">Factura</option>
                <option value="03">Boleta</option>
              </select>
            </div>

            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Serie
                </label>
                <input type="text" value={formData.serie} onChange={(e) => setFormData({ ...formData, serie: e.target.value })} className={inputClassName} />
              </div>
              <div className="w-1/2">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  Correlativo
                </label>
                <input type="number" required value={formData.correlativo} onChange={(e) => setFormData({ ...formData, correlativo: e.target.value })} className={inputClassName} />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" /> Fecha Emisión
              </label>
              <input
                type="date" required
                value={formData.fecha_emision}
                onChange={(e) => setFormData({ ...formData, fecha_emision: e.target.value })}
                className={inputClassName}
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} className="text-gray-400" /> Vencimiento
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

        {/* Detalles de la Venta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Package className="text-blue-500" size={20} /> Productos
            </h2>
            <button
              type="button"
              onClick={agregarDetalle}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm shadow-blue-500/30"
            >
              <Plus size={16} /> Añadir Fila
            </button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-100 text-gray-500 text-sm">
                  <th className="p-4 font-semibold w-1/3">Producto</th>
                  <th className="p-4 font-semibold w-1/4">Descripción Personalizada (opcional)</th>
                  <th className="p-4 font-semibold w-24">Cant.</th>
                  <th className="p-4 font-semibold w-32">Precio Unit.</th>
                  <th className="p-4 font-semibold w-32">Subtotal</th>
                  <th className="p-4 font-semibold w-16 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detalles.map((d, index) => (
                  <tr key={index} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="p-4">
                      <select
                        value={d.id_producto}
                        onChange={(e) => actualizarDetalle(index, 'id_producto', e.target.value)}
                        className={tableInputClassName}
                      >
                        <option value="">Seleccione producto...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.codigo} - {p.nombre}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      <input
                        type="text"
                        placeholder="Nota o detalle extra..."
                        value={d.nota}
                        onChange={(e) => actualizarDetalle(index, 'nota', e.target.value)}
                        className={tableInputClassName}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number" min="1" step="any"
                        value={d.cantidad}
                        onChange={(e) => actualizarDetalle(index, 'cantidad', parseFloat(e.target.value))}
                        className={tableInputClassName}
                      />
                    </td>
                    <td className="p-4">
                      <input
                        type="number" step="0.01"
                        value={d.precio}
                        onChange={(e) => actualizarDetalle(index, 'precio', parseFloat(e.target.value))}
                        className={tableInputClassName}
                      />
                    </td>
                    <td className="p-4 font-semibold text-gray-800">
                      S/ {(d.cantidad * d.precio).toFixed(2)}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => eliminarDetalle(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {detalles.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-12 text-center text-gray-400 text-sm">
                      No hay productos agregados. Haga clic en "Añadir Fila" para comenzar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resumen */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-full md:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Forma de Pago</label>
              <select value={formData.id_forma_pago} onChange={(e) => setFormData({ ...formData, id_forma_pago: parseInt(e.target.value) })} className={inputClassName}>
                <option value={1}>Contado</option>
                <option value={2}>Crédito</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado Pago</label>
              <select value={formData.id_estado_pago} onChange={(e) => setFormData({ ...formData, id_estado_pago: parseInt(e.target.value) })} className={inputClassName}>
                <option value={1}>Pendiente</option>
                <option value={2}>Pagado</option>
                <option value={3}>A Cuenta</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado Entrega</label>
              <select value={formData.id_estado_entrega} onChange={(e) => setFormData({ ...formData, id_estado_entrega: parseInt(e.target.value) })} className={inputClassName}>
                <option value={1}>Pendiente</option>
                <option value={2}>Entregado</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-8">
                <input type="checkbox" id="incluye_igv" checked={formData.incluye_igv} onChange={(e) => setFormData({ ...formData, incluye_igv: e.target.checked })} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"/>
                <label htmlFor="incluye_igv" className="text-sm font-medium text-gray-700">Precios incluyen IGV</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descuento Global (S/)</label>
              <input type="number" step="0.01" min="0" value={formData.descuento} onChange={(e) => setFormData({ ...formData, descuento: e.target.value })} className={inputClassName} placeholder="0.00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Detalle del Descuento</label>
              <input type="text" value={formData.desc_descuento} onChange={(e) => setFormData({ ...formData, desc_descuento: e.target.value })} className={inputClassName} placeholder="Razón del descuento (Opcional)" />
            </div>
            
            {formData.id_forma_pago === 2 && (
              <div className="col-span-1 md:col-span-2 mt-4 p-4 border border-blue-200 bg-blue-50 rounded-xl">
                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <Calendar size={16} /> Cronograma de Cuotas (Crédito)
                </h3>
                {cuotas.map((cuota, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <input type="number" step="0.01" placeholder="Monto S/" value={cuota.monto} onChange={(e) => actualizarCuota(index, 'monto', e.target.value)} className={inputClassName} required />
                    </div>
                    <div className="flex-1">
                      <input type="date" value={cuota.fecha_pago} onChange={(e) => actualizarCuota(index, 'fecha_pago', e.target.value)} className={inputClassName} required />
                    </div>
                    <button type="button" onClick={() => eliminarCuota(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={18} /></button>
                  </div>
                ))}
                <button type="button" onClick={agregarCuota} className="mt-2 text-sm text-blue-600 font-medium hover:underline">+ Añadir Cuota</button>
              </div>
            )}
          </div>
          <div className="w-full md:w-80 space-y-3 bg-gray-50 p-5 rounded-xl border border-gray-100">
            <div className="flex justify-between text-gray-600 text-sm font-medium">
              <span>Op. Gravadas:</span>
              <span>S/ {subtotalNeto.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm font-medium">
              <span>IGV (18%):</span>
              <span>S/ {igv.toFixed(2)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between text-lg font-bold text-gray-900">
              <span>Total:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-green-500/30 flex items-center gap-2"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaVenta;
