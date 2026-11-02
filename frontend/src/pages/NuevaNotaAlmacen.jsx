import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Search, Trash2, PackagePlus, PackageMinus, AlertTriangle } from 'lucide-react';
import { API_URL } from '../config';
import { fechaLocal } from '../utils/fecha';

// Etiquetas según el tipo de nota (mismo formato que el PDF)
const CONFIG = {
  ingreso: {
    tipo: 'INGRESO',
    titulo: 'Nueva Nota de Ingreso',
    lblAlmacen: 'Almacén de destino',
    lblArea: 'Procedencia',
    phArea: 'Proveedor, obra, almacén de origen...',
    lblPersona: 'Recibido de',
    Icono: PackagePlus,
    color: 'emerald',
  },
  salida: {
    tipo: 'SALIDA',
    titulo: 'Nueva Nota de Salida',
    lblAlmacen: 'Almacén de origen',
    lblArea: 'Destino / Área',
    phArea: 'Cliente, obra, área interna...',
    lblPersona: 'Entregado a',
    Icono: PackageMinus,
    color: 'red',
  },
};

const inputCls = 'w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const labelCls = 'block text-xs font-semibold text-gray-600 uppercase mb-1';

const NuevaNotaAlmacen = () => {
  const { tipo: tipoParam } = useParams();
  const cfg = CONFIG[tipoParam] || CONFIG.salida;
  const esSalida = cfg.tipo === 'SALIDA';
  const navigate = useNavigate();

  const [formInfo, setFormInfo] = useState({ almacenes: [], motivos: {}, siguiente: {} });
  const [productos, setProductos] = useState([]);
  const [head, setHead] = useState({
    fecha: fechaLocal(),
    id_almacen: '',
    doc_referencia: '',
    area: '',
    persona: '',
    motivo: '',
    detalle_motivo: '',
    observaciones: '',
  });
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/notas-almacen/form-data`).then(r => {
      setFormInfo(r.data);
      const principal = r.data.almacenes.find(a => a.is_principal == 1) || r.data.almacenes[0];
      setHead(h => ({ ...h, id_almacen: principal ? principal.id : '', motivo: '' }));
    });
    axios.get(`${API_URL}/productos`).then(r => setProductos(r.data || []));

    const cerrar = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [tipoParam]);

  const set = (field, value) => setHead(h => ({ ...h, [field]: value }));

  const resultados = search.trim().length < 2 ? [] : productos.filter(p =>
    (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15);

  const agregarProducto = (p) => {
    setItems(prev => {
      const existe = prev.findIndex(i => i.id_producto === p.id);
      if (existe !== -1) {
        // Si ya está en la lista, suma 1 a la cantidad en vez de duplicar la fila
        return prev.map((i, idx) => idx === existe ? { ...i, cantidad: String((parseFloat(i.cantidad) || 0) + 1) } : i);
      }
      return [...prev, {
        id_producto: p.id,
        codigo: p.codigo || '',
        nombre: p.nombre,
        stock: parseFloat(p.stock) || 0,
        cantidad: '1',
        unidad: p.unidad_medida || 'UND',
        observacion: '',
      }];
    });
    setSearch('');
    setShowResults(false);
  };

  const actualizarItem = (index, field, value) => {
    setItems(prev => prev.map((i, idx) => idx === index ? { ...i, [field]: value } : i));
  };

  const quitarItem = (index) => setItems(prev => prev.filter((_, idx) => idx !== index));

  const excedeStock = (item) => esSalida && (parseFloat(item.cantidad) || 0) > item.stock;
  const hayExcesos = items.some(excedeStock);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!head.id_almacen) return alert('Seleccione el almacén.');
    if (!head.motivo) return alert('Seleccione el motivo.');
    if (items.length === 0) return alert('Agregue al menos un producto.');
    if (items.some(i => !(parseFloat(i.cantidad) > 0))) return alert('Todas las cantidades deben ser mayores a 0.');
    if (hayExcesos) return alert('Hay productos con cantidad mayor al stock disponible.');

    try {
      setSaving(true);
      const res = await axios.post(`${API_URL}/notas-almacen`, {
        ...head,
        tipo: cfg.tipo,
        detalles: items.map(i => ({
          id_producto: i.id_producto,
          cantidad: parseFloat(i.cantidad),
          unidad: i.unidad,
          observacion: i.observacion,
        })),
      });
      window.open(`${API_URL}/notas-almacen/${res.data.id}/pdf`, '_blank');
      navigate('/notas-almacen');
    } catch (error) {
      const data = error.response?.data;
      const detalle = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : (data?.message || data?.error || error.message);
      alert('Error al guardar la nota:\n' + detalle);
    } finally {
      setSaving(false);
    }
  };

  const { Icono } = cfg;
  const motivos = formInfo.motivos[cfg.tipo] || [];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link to="/notas-almacen" className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Icono className={esSalida ? 'text-red-500' : 'text-emerald-500'} /> {cfg.titulo}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {esSalida ? 'Descuenta stock y registra la salida en el kardex.' : 'Suma stock y registra el ingreso en el kardex.'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase font-semibold">N° de nota</div>
          <div className="text-lg font-bold text-gray-800 font-mono">{formInfo.siguiente[cfg.tipo] || '—'}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos de la nota */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Fecha *</label>
            <input type="date" required className={inputCls} value={head.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{cfg.lblAlmacen} *</label>
            <select required className={inputCls} value={head.id_almacen} onChange={e => set('id_almacen', e.target.value)}>
              <option value="">Seleccione...</option>
              {formInfo.almacenes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>{cfg.lblArea}</label>
            <input className={inputCls} placeholder={cfg.phArea} value={head.area} onChange={e => set('area', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Doc. referencia</label>
            <input className={inputCls} placeholder="Factura, guía, orden de compra..." value={head.doc_referencia} onChange={e => set('doc_referencia', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>{cfg.lblPersona}</label>
            <input className={inputCls} placeholder="Nombre de la persona" value={head.persona} onChange={e => set('persona', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Motivo *</label>
            <select required className={inputCls} value={head.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="">Seleccione...</option>
              {motivos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Detalle del motivo</label>
            <input className={inputCls} value={head.detalle_motivo} onChange={e => set('detalle_motivo', e.target.value)} />
          </div>
        </div>

        {/* Productos */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="relative" ref={searchRef}>
            <label className={labelCls}>Agregar producto</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className={`${inputCls} pl-10`}
                placeholder="Buscar por código o nombre (mínimo 2 letras)..."
                value={search}
                onFocus={() => setShowResults(true)}
                onChange={e => { setSearch(e.target.value); setShowResults(true); }}
              />
            </div>
            {showResults && resultados.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {resultados.map(p => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => agregarProducto(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 flex justify-between items-center gap-4"
                  >
                    <span className="text-sm text-gray-800"><span className="font-mono text-gray-500">[{p.codigo || 'S/C'}]</span> {p.nombre}</span>
                    <span className="text-xs text-gray-500 shrink-0">Stock: {parseFloat(p.stock) || 0} {p.unidad_medida || 'UND'}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                  <th className="p-3 text-center w-12">Ít.</th>
                  <th className="p-3 text-left w-28">Código</th>
                  <th className="p-3 text-left">Descripción</th>
                  {esSalida && <th className="p-3 text-right w-24">Stock</th>}
                  <th className="p-3 text-center w-28">Cantidad</th>
                  <th className="p-3 text-center w-24">Und</th>
                  <th className="p-3 text-left w-56">Observación</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr><td colSpan={esSalida ? 8 : 7} className="p-8 text-center text-gray-400">Busque y agregue los productos de la nota.</td></tr>
                ) : items.map((it, idx) => (
                  <tr key={it.id_producto} className={excedeStock(it) ? 'bg-red-50' : ''}>
                    <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-2 font-mono text-xs text-gray-600">{it.codigo}</td>
                    <td className="p-2 text-gray-800">{it.nombre}</td>
                    {esSalida && <td className="p-2 text-right text-gray-500">{it.stock}</td>}
                    <td className="p-2">
                      <input
                        type="number" min="0" step="any" required
                        className={`w-full border rounded-lg p-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500 ${excedeStock(it) ? 'border-red-400' : 'border-gray-300'}`}
                        value={it.cantidad}
                        onChange={e => actualizarItem(idx, 'cantidad', e.target.value)}
                      />
                    </td>
                    <td className="p-2">
                      <input className="w-full border border-gray-300 rounded-lg p-1.5 text-center text-sm outline-none focus:ring-2 focus:ring-blue-500" value={it.unidad} onChange={e => actualizarItem(idx, 'unidad', e.target.value)} />
                    </td>
                    <td className="p-2">
                      <input className="w-full border border-gray-300 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" value={it.observacion} onChange={e => actualizarItem(idx, 'observacion', e.target.value)} />
                    </td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => quitarItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Quitar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hayExcesos && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle size={18} /> Hay productos con cantidad mayor al stock disponible (filas en rojo).
            </div>
          )}
        </div>

        {/* Observaciones y Guardar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className={labelCls}>Observaciones</label>
            <textarea rows={3} className={inputCls} value={head.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={saving || hayExcesos}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-md transition-colors disabled:opacity-50 ${esSalida ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            <Save size={18} /> {saving ? 'Guardando...' : `Guardar ${esSalida ? 'Nota de Salida' : 'Nota de Ingreso'}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaNotaAlmacen;
