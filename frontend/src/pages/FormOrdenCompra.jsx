import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Save, Search, Trash2, Plus, ClipboardList } from 'lucide-react';
import { API_URL } from '../config';
import { fechaLocal } from '../utils/fecha';
import { TIPOS_COMPRA } from '../utils/tiposCompra';

const inputCls = 'w-full border border-gray-300 rounded-xl p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none';
const labelCls = 'block text-xs font-semibold text-gray-600 uppercase mb-1';
const cellCls = 'w-full border border-gray-200 rounded-lg p-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white';

const itemVacio = () => ({ id_producto: null, codigo: '', descripcion: '', cantidad: '1', unidad: 'UND', proveedor: '', fecha_compra: '', precio_unitario: '' });

const FormOrdenCompra = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState('');
  const [estado, setEstado] = useState('PENDIENTE');
  const [head, setHead] = useState({
    tipo_compra: 'SUMINISTROS',
    fecha_emision: fechaLocal(),
    solicitante: '',
    area: '',
    fecha_requerida: '',
    lugar_entrega: '',
    observaciones: '',
  });
  const [items, setItems] = useState([]);
  const [productos, setProductos] = useState([]);
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [saving, setSaving] = useState(false);
  const searchRef = useRef(null);

  const esCatalogo = head.tipo_compra === 'CATALOGO';

  useEffect(() => {
    axios.get(`${API_URL}/productos`).then(r => setProductos(r.data || [])).catch(() => {});

    if (isEditing) {
      axios.get(`${API_URL}/ordenes-compra/${id}`).then(r => {
        const o = r.data;
        setCodigo(o.codigo);
        setEstado(o.estado);
        setHead({
          tipo_compra: o.tipo_compra,
          fecha_emision: o.fecha_emision,
          solicitante: o.solicitante || '',
          area: o.area || '',
          fecha_requerida: o.fecha_requerida || '',
          lugar_entrega: o.lugar_entrega || '',
          observaciones: o.observaciones || '',
        });
        setItems((o.detalles || []).map(d => ({
          id_producto: d.id_producto,
          codigo: d.producto?.codigo || '',
          descripcion: d.descripcion,
          cantidad: String(parseFloat(d.cantidad)),
          unidad: d.unidad || 'UND',
          proveedor: d.proveedor || '',
          fecha_compra: d.fecha_compra || '',
          precio_unitario: d.precio_unitario !== null ? String(parseFloat(d.precio_unitario)) : '',
        })));
      }).catch(() => {
        alert('No se encontró la orden de compra');
        navigate('/ordenes-compra');
      });
    } else {
      axios.get(`${API_URL}/ordenes-compra/siguiente`).then(r => setCodigo(r.data.codigo)).catch(() => {});
      setItems([itemVacio()]);
    }

    const cerrar = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [id]);

  const set = (field, value) => setHead(h => ({ ...h, [field]: value }));

  const cambiarTipo = (nuevo) => {
    if (nuevo === head.tipo_compra) return;
    const conDatos = items.some(i => i.descripcion.trim() || i.id_producto);
    if (conDatos && !window.confirm('Al cambiar el tipo de compra se quitarán los ítems. ¿Continuar?')) return;
    set('tipo_compra', nuevo);
    setItems(nuevo === 'CATALOGO' ? [] : [itemVacio()]);
  };

  const resultados = search.trim().length < 2 ? [] : productos.filter(p =>
    (p.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(search.toLowerCase())
  ).slice(0, 15);

  const agregarProducto = (p) => {
    setItems(prev => [...prev, {
      ...itemVacio(),
      id_producto: p.id,
      codigo: p.codigo || '',
      descripcion: p.nombre,
      unidad: p.unidad_medida || 'UND',
    }]);
    setSearch('');
    setShowResults(false);
  };

  const actualizarItem = (index, field, value) => setItems(prev => prev.map((i, idx) => idx === index ? { ...i, [field]: value } : i));
  const quitarItem = (index) => setItems(prev => prev.filter((_, idx) => idx !== index));

  const totalItem = (i) => (i.precio_unitario === '' ? null : (parseFloat(i.cantidad) || 0) * (parseFloat(i.precio_unitario) || 0));
  const total = items.reduce((acc, i) => acc + (totalItem(i) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validos = items.filter(i => i.id_producto || i.descripcion.trim());
    if (validos.length === 0) return alert('Agregue al menos un ítem.');
    if (validos.some(i => !(parseFloat(i.cantidad) > 0))) return alert('Todas las cantidades deben ser mayores a 0.');

    const payload = {
      ...head,
      detalles: validos.map(i => ({
        id_producto: i.id_producto,
        descripcion: i.descripcion.trim().toUpperCase(),
        cantidad: parseFloat(i.cantidad),
        unidad: (i.unidad || 'UND').toUpperCase(),
        proveedor: i.proveedor,
        fecha_compra: i.fecha_compra || null,
        precio_unitario: i.precio_unitario === '' ? null : parseFloat(i.precio_unitario),
      })),
    };

    try {
      setSaving(true);
      const res = isEditing
        ? await axios.put(`${API_URL}/ordenes-compra/${id}`, payload)
        : await axios.post(`${API_URL}/ordenes-compra`, payload);
      window.open(`${API_URL}/ordenes-compra/${res.data.id}/pdf`, '_blank');
      navigate('/ordenes-compra');
    } catch (error) {
      const data = error.response?.data;
      const detalle = data?.errors
        ? Object.values(data.errors).flat().join('\n')
        : (data?.message || data?.error || error.message);
      alert('Error al guardar la orden de compra:\n' + detalle);
    } finally {
      setSaving(false);
    }
  };

  const anulada = estado === 'ANULADA';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Encabezado */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link to="/ordenes-compra" className="p-2 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="text-blue-600" /> {isEditing ? 'Editar Orden de Compra' : 'Nueva Orden de Compra'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Proveedor, fecha de compra y precio pueden completarse después, al realizar la compra.
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400 uppercase font-semibold">Orden N°</div>
          <div className="text-lg font-bold text-gray-800 font-mono">{codigo || '—'}</div>
        </div>
      </div>

      {anulada && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">Esta orden está anulada y no se puede modificar.</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tipo de compra */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-3">
          <span className="text-xs font-semibold text-gray-600 uppercase">Tipo de compra *</span>
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            {TIPOS_COMPRA.map(t => (
              <button
                type="button"
                key={t.value}
                disabled={isEditing}
                onClick={() => cambiarTipo(t.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed ${head.tipo_compra === t.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datos de la orden */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Fecha de emisión *</label>
            <input type="date" required className={inputCls} value={head.fecha_emision} onChange={e => set('fecha_emision', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Solicitante *</label>
            <input required className={inputCls} value={head.solicitante} onChange={e => set('solicitante', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>Área</label>
            <input className={inputCls} value={head.area} onChange={e => set('area', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className={labelCls}>Fecha requerida de entrega</label>
            <input type="date" className={inputCls} value={head.fecha_requerida} onChange={e => set('fecha_requerida', e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Lugar de entrega</label>
            <input className={inputCls} value={head.lugar_entrega} onChange={e => set('lugar_entrega', e.target.value.toUpperCase())} />
          </div>
        </div>

        {/* Ítems */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          {esCatalogo ? (
            <div className="relative" ref={searchRef}>
              <label className={labelCls}>Agregar producto del catálogo</label>
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
                    <button type="button" key={p.id} onClick={() => agregarProducto(p)} className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-50 last:border-0 text-sm">
                      <span className="font-mono text-gray-500">[{p.codigo || 'S/C'}]</span> {p.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setItems(prev => [...prev, itemVacio()])} className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium">
              <Plus size={16} /> Agregar ítem
            </button>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase border-b">
                  <th className="p-2 text-center w-10">Ít.</th>
                  <th className="p-2 text-left">Descripción *</th>
                  <th className="p-2 text-center w-24">Cantidad *</th>
                  <th className="p-2 text-center w-20">Und</th>
                  <th className="p-2 text-left w-52">Proveedor / Lugar de compra</th>
                  <th className="p-2 text-center w-36">Fecha de compra</th>
                  <th className="p-2 text-right w-28">Precio Unit. (S/)</th>
                  <th className="p-2 text-right w-24">Total (S/)</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr><td colSpan="9" className="p-8 text-center text-gray-400">{esCatalogo ? 'Busque y agregue productos del catálogo.' : 'Agregue los ítems de la orden.'}</td></tr>
                ) : items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-2">
                      {esCatalogo ? (
                        <span className="text-gray-800"><span className="font-mono text-xs text-gray-500">[{it.codigo || 'S/C'}]</span> {it.descripcion}</span>
                      ) : (
                        <input className={cellCls} placeholder={head.tipo_compra === 'AGASAJOS' ? 'Ej. Gaseosa 3L' : 'Ej. Saca grapas'} value={it.descripcion} onChange={e => actualizarItem(idx, 'descripcion', e.target.value)} />
                      )}
                    </td>
                    <td className="p-2"><input type="number" min="0" step="any" className={`${cellCls} text-center`} value={it.cantidad} onChange={e => actualizarItem(idx, 'cantidad', e.target.value)} /></td>
                    <td className="p-2"><input className={`${cellCls} text-center`} value={it.unidad} onChange={e => actualizarItem(idx, 'unidad', e.target.value)} /></td>
                    <td className="p-2"><input className={cellCls} value={it.proveedor} onChange={e => actualizarItem(idx, 'proveedor', e.target.value)} /></td>
                    <td className="p-2"><input type="date" className={cellCls} value={it.fecha_compra} onChange={e => actualizarItem(idx, 'fecha_compra', e.target.value)} /></td>
                    <td className="p-2"><input type="number" min="0" step="0.01" className={`${cellCls} text-right`} value={it.precio_unitario} onChange={e => actualizarItem(idx, 'precio_unitario', e.target.value)} /></td>
                    <td className="p-2 text-right font-mono text-gray-800">{totalItem(it) === null ? '—' : totalItem(it).toFixed(2)}</td>
                    <td className="p-2 text-center">
                      <button type="button" onClick={() => quitarItem(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Quitar"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {items.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan="7" className="p-2 text-right text-gray-700">TOTAL S/:</td>
                    <td className="p-2 text-right font-mono text-gray-900">{total.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <p className="text-xs text-gray-500">La orden pasa a <b>Atendida</b> automáticamente cuando todos los ítems tienen precio.</p>
        </div>

        {/* Observaciones y Guardar */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className={labelCls}>Observaciones</label>
            <textarea rows={3} className={inputCls} value={head.observaciones} onChange={e => set('observaciones', e.target.value)} />
          </div>
          <button
            type="submit"
            disabled={saving || anulada}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-bold shadow-md bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} /> {saving ? 'Guardando...' : (isEditing ? 'Guardar cambios' : 'Guardar Orden de Compra')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormOrdenCompra;
