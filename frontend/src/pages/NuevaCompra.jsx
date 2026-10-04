import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart, Plus, Trash2, ArrowLeft, Save, Search, AlertCircle, Building2, Package } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { SERVER_URL } from '../config';

const NuevaCompra = () => {
  const navigate = useNavigate();

  // Data Sources
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form Header State
  const [idProveedor, setIdProveedor] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('1'); // 1: Factura, 2: Boleta, etc.
  const [serie, setSerie] = useState('');
  const [numeracion, setNumeracion] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState(new Date().toISOString().substring(0, 10));
  const [incluyeIgv, setIncluyeIgv] = useState(true);

  // Item to add state
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [itemCantidad, setItemCantidad] = useState(1);
  const [itemPrecio, setItemPrecio] = useState(0);

  // Items List
  const [items, setItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingInitial(true);
      const [resProv, resProd] = await Promise.all([
        axios.get(`${SERVER_URL}/api/proveedores?all=true`),
        axios.get(`${SERVER_URL}/api/productos`)
      ]);
      setProveedores(resProv.data || []);
      setProductos(resProd.data || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoadingInitial(false);
    }
  };

  const handleSelectProducto = (id) => {
    setSelectedProductoId(id);
    const prod = productos.find(p => String(p.id) === String(id));
    if (prod) {
      setItemPrecio(prod.precio_compra ? Number(prod.precio_compra) : 0);
      setSearchTerm(`[${prod.codigo || 'S/C'}] ${prod.nombre}`);
      setIsDropdownOpen(false);
    }
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!selectedProductoId) {
      alert('Por favor selecciona un producto');
      return;
    }
    const cant = parseFloat(itemCantidad);
    const prec = parseFloat(itemPrecio);

    if (isNaN(cant) || cant <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (isNaN(prec) || prec < 0) {
      alert('El precio no puede ser negativo');
      return;
    }

    const prod = productos.find(p => String(p.id) === String(selectedProductoId));
    if (!prod) return;

    // Check if already in items
    const existingIndex = items.findIndex(i => i.id_producto === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].cantidad += cant;
      updated[existingIndex].precio = prec;
      updated[existingIndex].total = updated[existingIndex].cantidad * prec;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          id_producto: prod.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          unidad: prod.unidad_medida || 'NIU',
          cantidad: cant,
          precio: prec,
          total: cant * prec
        }
      ]);
    }

    // Reset item inputs
    setSelectedProductoId('');
    setSearchTerm('');
    setItemCantidad(1);
    setItemPrecio(0);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Totales
  const totalItems = items.reduce((acc, it) => acc + it.total, 0);
  const igv = incluyeIgv ? totalItems * 0.18 : 0;
  const gravado = totalItems;
  const totalPagar = totalItems + igv;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idProveedor) {
      alert('Por favor selecciona el proveedor de la compra.');
      return;
    }
    if (!serie.trim() || !numeracion.trim()) {
      alert('Debes ingresar la Serie y el Número de la factura/comprobante de compra.');
      return;
    }
    if (items.length === 0) {
      alert('Debes agregar al menos un producto a la compra.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id_proveedor: idProveedor,
        tipo_documento: tipoDocumento,
        serie: serie.trim(),
        numeracion: numeracion.trim(),
        fecha_creacion: fechaCreacion,
        gravado: Number(gravado.toFixed(2)),
        igv: Number(igv.toFixed(2)),
        total: Number(totalPagar.toFixed(2)),
        detalles: items.map(it => ({
          id_producto: it.id_producto,
          cantidad: it.cantidad,
          precio: it.precio,
          unidad: it.unidad
        }))
      };

      await axios.post(`${SERVER_URL}/api/compras`, payload);
      alert('¡Compra registrada exitosamente! El stock de los productos ha sido actualizado e ingresado al Kardex.');
      navigate('/compras');

    } catch (err) {
      console.error('Error al guardar compra:', err);
      alert('Error al registrar compra: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProductos = productos.filter(p => {
    const term = searchTerm.toLowerCase();
    return (p.nombre && p.nombre.toLowerCase().includes(term)) || 
           (p.codigo && p.codigo.toLowerCase().includes(term));
  }).slice(0, 50);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/compras"
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Registrar Compra / Ingreso a Almacén</h1>
            <p className="text-sm text-gray-500">Ingresa los comprobantes de tus proveedores para actualizar el inventario</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Datos del Comprobante y Proveedor */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
            <Building2 size={16} className="text-brand-600" /> Datos del Comprobante y Proveedor
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Proveedor *
              </label>
              <select
                required
                value={idProveedor}
                onChange={(e) => setIdProveedor(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
              >
                <option value="">-- Seleccionar Proveedor --</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.razon_social} (RUC: {p.ruc})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Tipo Comprobante *
              </label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
              >
                <option value="1">Factura de Compra</option>
                <option value="2">Boleta de Compra</option>
                <option value="3">Guía de Remisión</option>
                <option value="4">Nota de Venta / Recibo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Fecha Emisión *
              </label>
              <input
                type="date"
                required
                value={fechaCreacion}
                onChange={(e) => setFechaCreacion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Serie Comprobante *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. F001"
                value={serie}
                onChange={(e) => setSerie(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Número / Correlativo *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 000123"
                value={numeracion}
                onChange={(e) => setNumeracion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm font-mono"
              />
            </div>

            <div className="md:col-span-2 flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={incluyeIgv}
                  onChange={(e) => setIncluyeIgv(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Calcular 18% IGV en la compra</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Agregar Productos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
            <Package size={16} className="text-brand-600" /> Agregar Productos al Inventario
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-6 relative">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Buscar Producto *
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por Nombre o SKU..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedProductoId('');
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm"
                />
                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                    {filteredProductos.length > 0 ? (
                      filteredProductos.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProducto(p.id)}
                          className="px-3 py-2 hover:bg-brand-50 cursor-pointer text-sm border-b last:border-0 border-gray-100"
                        >
                          <div className="font-medium text-gray-900">[{p.codigo || 'S/C'}] {p.nombre}</div>
                          <div className="text-xs text-gray-500">Stock actual: {p.stock ?? 0} {p.unidad_medida || 'UND'}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">No se encontraron productos</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                value={itemCantidad}
                onChange={(e) => setItemCantidad(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm text-right font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Precio Compra (S/.) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemPrecio}
                onChange={(e) => setItemPrecio(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-brand-500 focus:bg-white outline-none text-sm text-right font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all"
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-gray-100 rounded-xl overflow-hidden mt-4">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Producto</th>
                  <th className="py-2.5 px-3 text-center">Unidad</th>
                  <th className="py-2.5 px-3 text-right">Cantidad</th>
                  <th className="py-2.5 px-3 text-right">Precio Unit. (S/.)</th>
                  <th className="py-2.5 px-3 text-right">Total (S/.)</th>
                  <th className="py-2.5 px-3 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-400">
                      No has agregado ningún producto todavía.
                    </td>
                  </tr>
                ) : (
                  items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-mono text-xs text-gray-500">{it.codigo || '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-gray-900">{it.nombre}</td>
                      <td className="py-2.5 px-3 text-center text-xs text-gray-600">{it.unidad}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                        +{Number(it.cantidad).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-gray-700">
                        S/ {Number(it.precio).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                        S/ {Number(it.total).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar ítem"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Resumen y Guardar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Los productos ingresados incrementarán automáticamente el inventario actual.</p>
            <p>• Se registrará la entrada formal con costo en el Kardex.</p>
          </div>

          <div className="flex flex-col md:flex-row items-end md:items-center gap-6 w-full md:w-auto">
            <div className="text-right space-y-1">
              <div className="text-xs text-gray-500">
                Subtotal: <span className="font-mono font-medium">S/ {gravado.toFixed(2)}</span>
              </div>
              {incluyeIgv && (
                <div className="text-xs text-gray-500">
                  IGV (18%): <span className="font-mono font-medium">S/ {igv.toFixed(2)}</span>
                </div>
              )}
              <div className="text-lg font-bold text-gray-900">
                Total a Pagar: <span className="font-mono text-brand-600">S/ {totalPagar.toFixed(2)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || items.length === 0}
              className="w-full md:w-auto flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              <Save size={18} />
              {submitting ? 'Procesando...' : 'Guardar Compra e Ingresar Stock'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default NuevaCompra;
