import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { Plus, Trash2, Search, ArrowLeft, Check, XCircle, Edit2, X } from 'lucide-react';

// ─── moved OUTSIDE to prevent remount on every render ────────────────────────
function Field({ label, children }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  );
}

function UbigeoSelects({ prefix, value, onChange }) {
  const [departamentos, setDepartamentos] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  useEffect(() => {
    axios.get(`${SERVER_URL}/api/guias/departamentos`).then(r => setDepartamentos(r.data)).catch(() => { });
  }, []);

  const handleDpto = async (e) => {
    const v = e.target.value;
    onChange({ departamento: v, provincia: '', distrito: '' });
    setProvincias([]);
    setDistritos([]);
    if (v) {
      const r = await axios.get(`${SERVER_URL}/api/guias/provincias`, { params: { departamento: v } });
      setProvincias(r.data);
    }
  };

  const handleProv = async (e) => {
    const v = e.target.value;
    onChange({ ...value, provincia: v, distrito: '' });
    setDistritos([]);
    if (v) {
      const r = await axios.get(`${SERVER_URL}/api/guias/distritos`, { params: { provincia: v } });
      setDistritos(r.data);
    }
  };

  const sel = 'w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white';
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Departamento</label>
        <select className={sel} value={value?.departamento || ''} onChange={handleDpto}>
          <option value="">-- Departamento --</option>
          {departamentos.map(d => <option key={d.codigo} value={d.codigo}>{d.departamento}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Provincia</label>
        <select className={sel} value={value?.provincia || ''} onChange={handleProv}>
          <option value="">-- Provincia --</option>
          {provincias.map(p => <option key={p.codigo} value={p.codigo}>{p.provincia}</option>)}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Distrito</label>
        <select className={sel} value={value?.distrito || ''} onChange={e => onChange({ ...value, distrito: e.target.value })}>
          <option value="">-- Distrito --</option>
          {distritos.map(d => <option key={d.codigo} value={d.codigo}>{d.distrito}</option>)}
        </select>
      </div>
    </div>
  );
}

function RucSearch({ label, value, onChange, onFound }) {
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const doSearch = async () => {
    if (!value || value.length < 8) return;
    setSearching(true);
    setResult(null);
    setError('');
    try {
      const param = value.length > 8 ? 'ruc' : 'dni';
      const r = await fetch(`https://dbusinessaqp.com/api_ruc/api.php?${param}=${value}`);
      const obj = await r.json();
      if (obj.error) {
        setError(obj.error);
      } else {
        setResult(obj);
        if (onFound) onFound(obj);
      }
    } catch {
      setError('Error al consultar');
    } finally {
      setSearching(false);
    }
  };

  const sel = 'flex-1 p-2.5 border border-gray-300 rounded-l-lg text-sm focus:border-blue-500 outline-none bg-white';
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</label>
      <div className="flex">
        <input
          className={sel}
          value={value}
          placeholder="RUC (11 dígitos) o DNI (8 dígitos)"
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), doSearch())}
        />
        <button
          type="button"
          onClick={doSearch}
          disabled={searching}
          className="px-3 py-2 bg-gray-800 text-white rounded-r-lg hover:bg-gray-700 transition-colors border border-l-0 border-gray-800 disabled:opacity-60"
        >
          <Search size={16} />
        </button>
      </div>
      {searching && <p className="text-xs text-amber-600 font-bold">Buscando...</p>}
      {result && <p className="text-xs text-green-700 font-bold bg-green-50 px-2 py-1 rounded">{value} — {result.nombre}</p>}
      {error && <p className="text-xs text-red-600 font-bold bg-red-50 px-2 py-1 rounded">{value} — {error}</p>}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];

const MOTIVOS = [
  { value: '01', label: 'VTA | Venta' },
  { value: '02', label: 'CMP | Compra' },
  { value: '03', label: 'VET | Venta con entrega a terceros' },
  { value: '04', label: 'TEE | Traslado entre establecimientos' },
  { value: '05', label: 'CON | Consignación' },
  { value: '06', label: 'DEV | Devolución' },
  { value: '09', label: 'EXP | Exportación' },
  { value: '13', label: 'OTR | Otros' },
  { value: '17', label: 'TPT | Traslado para transformación' },
];

const TALLAS = ['2', '4', '6', '8', '10', '12', '14', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const INIT = {
  num_guia: '', fecha_emision: today, fecha_traslado: today,
  motivo_traslado: '01', descripcion_motivo: '',
  origen: 'CAL.BELEN MZA. B LOTE. 8 JERUSALEN - MARIANO MELGAR - AREQUIPA - AREQUIPA',
  ruc_destinatario: '', destino: '',
  ubigeo_origen: { departamento: '', provincia: '', distrito: '' },
  ubigeo_destino: { departamento: '', provincia: '', distrito: '' },
  ruc_transportista: '', ruc_conductor: '',
  placa: '', licencia: '',
  modalidad_trasnporte: '01', comentario: '',
};

function parseDescriptionAndTallas(desc, totalCant) {
  let baseName = desc || '';
  let tallasArray = Array(13).fill('');
  let manualCant = '';

  if (!desc) return { baseName: '', tallasArray, manualCant: String(totalCant || '1') };

  // Case 1: HTML Table
  if (desc.includes('<table')) {
    const parts = desc.split(/<table/i);
    baseName = parts[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    baseName = baseName.replace(/\s*TALLAS\s*$/i, '').trim();

    const tablePart = '<table' + parts[1];
    const rows = tablePart.match(/<tr[\s\S]*?<\/tr>/gi) || [];
    if (rows.length >= 2) {
      const getCells = (r) =>
        (r.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) || []).map((c) =>
          c.replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, '').trim()
        );
      const r1 = getCells(rows[0]);
      const r2 = getCells(rows[1]);
      const len = Math.max(r1.length, r2.length);
      let matchedAny = false;
      for (let i = 0; i < len; i++) {
        const t = (r1[i] || '').toUpperCase();
        const c = r2[i] || '';
        const idx = TALLAS.findIndex((x) => x.toUpperCase() === t);
        if (idx !== -1 && c) {
          tallasArray[idx] = c;
          matchedAny = true;
        } else if (!t && c) {
          manualCant = c;
        }
      }
      if (!matchedAny && !manualCant) manualCant = String(totalCant || '1');
    }
    return { baseName, tallasArray, manualCant };
  }

  // Case 2: Bracket format [M:2, L:3] or [2:5]
  const match = desc.match(/^(.*?)\[(.*?)\]\s*$/);
  if (match) {
    baseName = match[1].trim();
    const pairs = match[2].split(',');
    let matchedAny = false;
    pairs.forEach((p) => {
      const [t, c] = p.split(':').map((s) => s.trim());
      if (t) {
        const idx = TALLAS.findIndex((x) => x.toUpperCase() === t.toUpperCase());
        if (idx !== -1 && c) {
          tallasArray[idx] = c;
          matchedAny = true;
        } else if (idx !== -1 && !c) {
          tallasArray[idx] = '1';
          matchedAny = true;
        }
      }
    });
    if (!matchedAny) manualCant = String(totalCant || '1');
    return { baseName, tallasArray, manualCant };
  }

  // Case 3: Plain description
  return { baseName, tallasArray, manualCant: String(totalCant || '1') };
}

const str_pad = (num) => String(num).padStart(6, '0');

export default function NewGuiaView() {
  const navigate = useNavigate();
  const [head, setHead] = useState(INIT);
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const [searchNombre, setSearchNombre] = useState('');
  const [searchCodigo, setSearchCodigo] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selProd, setSelProd] = useState(null);
  const [unidadesSunat, setUnidadesSunat] = useState([]);
  const [tallas, setTallas] = useState(Array(13).fill(''));
  const [pesoBruto, setPesoBruto] = useState('');
  const [pesoNeto, setPesoNeto] = useState('');
  const [pedido, setPedido] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editItemData, setEditItemData] = useState({
    code: '',
    descripcion: '',
    unidad: '',
    tallas: Array(13).fill(''),
    manualCant: '',
    pedido: '',
    pesoNeto: '',
    pesoBruto: '',
  });

  const [searchVenta, setSearchVenta] = useState('');
  const [ventasResults, setVentasResults] = useState([]);
  const [searchingVenta, setSearchingVenta] = useState(false);


  useEffect(() => {
    axios.get(`${SERVER_URL}/api/codigos-sunat`).then(r => setUnidadesSunat(r.data)).catch(() => {});
    axios.get(`${SERVER_URL}/api/guias/next-num`).then(r => setHead(h => ({ ...h, num_guia: r.data.num_guia }))).catch(() => { });
  }, []);

  const set = useCallback((field, value) => setHead(h => ({ ...h, [field]: value })), []);

  const handleSearchVenta = async (e) => {
    if (e) e.preventDefault();
    if (!searchVenta) return;
    setSearchingVenta(true);
    try {
      const r = await axios.get(`${SERVER_URL}/api/ventas`, { params: { search: searchVenta } });
      setVentasResults(r.data.data || r.data); // handles paginated or array
    } catch { }
    finally { setSearchingVenta(false); }
  };

  const importarVenta = async (venta) => {
    try {
      const r = await axios.get(`${SERVER_URL}/api/ventas/${venta.id}`);
      const v = r.data;
      
      let dest = '';
      if (v.cliente) {
        set('ruc_destinatario', v.cliente.ruc || v.cliente.dni || '');
        dest = (v.cliente.direccion || '') + (v.cliente.distrito ? ' - ' + v.cliente.distrito : '') + (v.cliente.provincia ? ' - ' + v.cliente.provincia : '') + (v.cliente.departamento ? ' - ' + v.cliente.departamento : '');
        set('destino', dest);
      }

      if (v.detalles && v.detalles.length > 0) {
        const newItems = v.detalles.map(det => {
          return {
            id_producto: det.id_producto,
            descripcion_producto: det.descripcion_personalizada || (det.producto ? (det.producto.nombre || det.producto.name) : ''),
            cantidad: det.cantidad,
            unidad: 'NIU',
            pedido: `${v.serie}-${v.correlativo}`,
            t_neto: ((det.producto?.peso || det.producto?.weight || 0) * det.cantidad).toFixed(2),
            t_bruto: 0,
            code: det.producto?.codigo || det.producto?.code || '',
          };
        });
        setItems(newItems);
      }
      
      setVentasResults([]);
      setSearchVenta('');
      alert('Venta importada correctamente.');
    } catch (error) {
      alert('Error al importar detalles de la venta.');
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!searchNombre && !searchCodigo) return;
    setSearching(true);
    try {
      const r = await axios.get(`${SERVER_URL}/api/guias/search-products`, { params: { nombre: searchNombre, codigo: searchCodigo } });
      setSearchResults(r.data);
      setSelProd(null);
    } catch { }
    finally { setSearching(false); }
  };

  const selectProd = (p) => {
    setSelProd(p);
    setTallas(Array(13).fill(''));
    setPesoBruto('');
    setPesoNeto(p.weight);
    setPedido('');
    setEditDescripcion(p.name);
    setEditUnidad(p.unit || '');
  };

  const addItem = () => {
    if (!selProd) return;
    const cant = tallas.reduce((s, v) => s + (parseFloat(v) || 0), 0) || 1;
    const neto = (cant * (parseFloat(pesoNeto) || 0)).toFixed(2);
    const bruto = parseFloat(pesoBruto || 0).toFixed(2);
    const tallaStr = TALLAS.map((t, i) => tallas[i] ? `${t}:${tallas[i]}` : null).filter(Boolean).join(', ');
    setItems(p => [...p, {
      id_producto: selProd.id,
      descripcion_producto: editDescripcion + (tallaStr ? ` [${tallaStr}]` : ''),
      cantidad: cant,
      unidad: editUnidad,
      pedido,
      t_neto: neto,
      t_bruto: bruto,
      code: selProd.code,
    }]);
    setSelProd(null);
    setSearchResults([]);
    setSearchNombre('');
    setSearchCodigo('');
  };

  const startEditItem = (item, index) => {
    setEditingItemIndex(index);
    const { baseName, tallasArray, manualCant } = parseDescriptionAndTallas(
      item.descripcion_producto,
      item.cantidad
    );
    const totalT = tallasArray.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    const itemCant = parseFloat(item.cantidad) || 1;
    const unitNeto = item.t_neto && itemCant > 0 ? (parseFloat(item.t_neto) / itemCant).toFixed(3) : '';

    setEditItemData({
      id_producto: item.id_producto,
      code: item.code || '',
      descripcion: baseName,
      unidad: item.unidad || '',
      tallas: tallasArray,
      manualCant: totalT > 0 ? '' : (manualCant || String(item.cantidad || '1')),
      pedido: item.pedido || '',
      pesoNeto: unitNeto,
      pesoBruto: item.t_bruto ? String(item.t_bruto) : '',
    });
  };

  const cancelEditItem = () => {
    setEditingItemIndex(null);
    setEditItemData({
      id_producto: null,
      code: '',
      descripcion: '',
      unidad: '',
      tallas: Array(13).fill(''),
      manualCant: '',
      pedido: '',
      pesoNeto: '',
      pesoBruto: '',
    });
  };

  const saveEditedItem = () => {
    if (editingItemIndex === null || !editItemData) return;

    const tallasTotal = editItemData.tallas.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
    const hasTallas = tallasTotal > 0;
    const finalCant = hasTallas ? tallasTotal : (parseFloat(editItemData.manualCant) || 1);

    const tallaStr = TALLAS.map((t, i) =>
      editItemData.tallas[i] && parseFloat(editItemData.tallas[i]) > 0
        ? `${t}:${editItemData.tallas[i]}`
        : null
    ).filter(Boolean).join(', ');

    const baseDesc = (editItemData.descripcion || '').trim();
    const finalDescripcion = baseDesc + (tallaStr ? ` [${tallaStr}]` : '');

    const unitNeto = parseFloat(editItemData.pesoNeto) || 0;
    const calculatedNeto = (finalCant * unitNeto).toFixed(2);
    const calculatedBruto = parseFloat(editItemData.pesoBruto || 0).toFixed(2);

    setItems(prev => prev.map((item, idx) => {
      if (idx !== editingItemIndex) return item;
      return {
        ...item,
        descripcion_producto: finalDescripcion,
        cantidad: finalCant,
        unidad: editItemData.unidad,
        pedido: editItemData.pedido,
        t_neto: calculatedNeto,
        t_bruto: calculatedBruto,
      };
    }));

    cancelEditItem();
  };

  const totalBruto = items.reduce((s, i) => s + (parseFloat(i.t_bruto) || 0), 0).toFixed(2);
  const totalNeto = items.reduce((s, i) => s + (parseFloat(i.t_neto) || 0), 0).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!head.ruc_destinatario) return alert('Ingrese el RUC/DNI del destinatario');
    if (items.length === 0) return alert('Agregue al menos un producto');
    setSaving(true);
    try {
      const payload = {
        ...head,
        ubigeo: head.ubigeo_origen.distrito,
        ubigeo_destino: head.ubigeo_destino.distrito,
        total_bruto: totalBruto,
        total_neto: totalNeto,
        items,
      };
      const r = await axios.post(`${SERVER_URL}/api/guias`, payload);
      if (r.data.Result === 'OK') navigate('/guias');
      else alert(r.data.Message || 'Error al guardar');
    } catch (err) {
      alert(err.response?.data?.Message || 'Error al guardar');
    } finally { setSaving(false); }
  };

  const inp = 'w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white';

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/guias')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Guía de Remisión</h1>
          <p className="text-sm text-gray-500 mt-0.5">Complete los datos y agregue los productos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Importar Factura / Boleta */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Importar Factura / Boleta (Opcional)</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[200px] space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buscar por Serie-Correlativo o Cliente</label>
              <div className="flex">
                <input className="flex-1 p-2.5 border border-gray-300 rounded-l-lg text-sm focus:border-blue-500 outline-none bg-white" placeholder="Ej: F001-000001, B001, Juan..." value={searchVenta} onChange={e => setSearchVenta(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearchVenta())} />
                <button type="button" onClick={handleSearchVenta} disabled={searchingVenta} className="px-4 py-2.5 bg-gray-800 text-white rounded-r-lg hover:bg-gray-700 transition-colors border border-l-0 border-gray-800 disabled:opacity-60">
                  <Search size={16} />
                </button>
              </div>
            </div>
          </div>
          {ventasResults.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Documento</th>
                    <th className="px-4 py-3 text-left font-bold">Fecha</th>
                    <th className="px-4 py-3 text-left font-bold">Cliente</th>
                    <th className="px-4 py-3 text-center font-bold">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ventasResults.map(v => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{v.serie}-{str_pad(v.correlativo)}</td>
                      <td className="px-4 py-2.5 text-gray-500">{v.fecha_emision}</td>
                      <td className="px-4 py-2.5 text-gray-500">{v.cliente?.razon_social || v.cliente?.nombres}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button type="button" onClick={() => importarVenta(v)} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-bold transition-colors">
                          Importar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Datos Generales */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Datos Generales</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Núm. Guía *">
              <input required className={inp} value={head.num_guia} onChange={e => set('num_guia', e.target.value)} />
            </Field>
            <Field label="Fecha Emisión *">
              <input required type="date" className={inp} value={head.fecha_emision} onChange={e => set('fecha_emision', e.target.value)} />
            </Field>
            <Field label="Fecha Traslado *">
              <input required type="date" className={inp} value={head.fecha_traslado} onChange={e => set('fecha_traslado', e.target.value)} />
            </Field>
            <Field label="Modalidad">
              <select className={inp} value={head.modalidad_trasnporte} onChange={e => set('modalidad_trasnporte', e.target.value)}>
                <option value="01">Público</option>
                <option value="02">Privado</option>
              </select>
            </Field>
            <div className="col-span-2">
              <Field label="Motivo Traslado *">
                <select className={inp} value={head.motivo_traslado} onChange={e => set('motivo_traslado', e.target.value)}>
                  {MOTIVOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
            </div>
            {head.motivo_traslado === '13' && (
              <div className="col-span-2">
                <Field label="Descripción Motivo">
                  <input className={inp} value={head.descripcion_motivo} onChange={e => set('descripcion_motivo', e.target.value)} />
                </Field>
              </div>
            )}
          </div>
        </section>

        {/* Origen */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Origen</h2>
          <div className="space-y-4">
            <Field label="Dirección Origen *">
              <textarea required className={`${inp} resize-none`} rows={2} value={head.origen} onChange={e => set('origen', e.target.value)} />
            </Field>
            <UbigeoSelects prefix="origen" value={head.ubigeo_origen} onChange={v => set('ubigeo_origen', v)} />
          </div>
        </section>

        {/* Destino */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Destino</h2>
          <div className="space-y-4">
            <RucSearch
              label="RUC / DNI Destinatario *"
              value={head.ruc_destinatario}
              onChange={v => set('ruc_destinatario', v)}
              onFound={obj => set('destino', (obj.direccion || '') + (obj.distrito ? ' - ' + obj.distrito : '') + (obj.provincia ? ' - ' + obj.provincia : '') + (obj.departamento ? ' - ' + obj.departamento : ''))}
            />
            <Field label="Dirección Destino">
              <textarea className={`${inp} resize-none`} rows={2} value={head.destino} onChange={e => set('destino', e.target.value)} />
            </Field>
            <UbigeoSelects prefix="destino" value={head.ubigeo_destino} onChange={v => set('ubigeo_destino', v)} />
          </div>
        </section>

        {/* Transporte */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Datos de Transporte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RucSearch label="RUC / DNI Transportista" value={head.ruc_transportista} onChange={v => set('ruc_transportista', v)} />
            <RucSearch label="RUC / DNI Conductor" value={head.ruc_conductor} onChange={v => set('ruc_conductor', v)} />
            <Field label="Placa Vehículo">
              <input className={inp} placeholder="Ej: F5Z200" value={head.placa} onChange={e => set('placa', e.target.value)} />
            </Field>
            <Field label="N° Licencia">
              <input className={inp} value={head.licencia} onChange={e => set('licencia', e.target.value)} />
            </Field>
            <div className="col-span-1 md:col-span-2">
              <Field label="Comentario">
                <input className={inp} value={head.comentario} onChange={e => set('comentario', e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {/* Buscar Productos */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">Agregar Productos</h2>
          <div className="flex gap-3 flex-wrap items-end">
            <div className="flex-1 min-w-[180px] space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</label>
              <input className={inp} placeholder="Nombre del producto..." value={searchNombre} onChange={e => setSearchNombre(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())} />
            </div>
            <div className="flex-1 min-w-[120px] space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Código</label>
              <input className={inp} placeholder="Código..." value={searchCodigo} onChange={e => setSearchCodigo(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())} />
            </div>
            <button type="button" onClick={handleSearch} className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-700 text-sm font-bold flex items-center gap-2 transition-colors">
              <Search size={16} />
              {searching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase border-b text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold">Producto</th>
                    <th className="px-4 py-3 text-left font-bold">Código</th>
                    <th className="px-4 py-3 text-left font-bold">Unidad</th>
                    <th className="px-4 py-3 text-center font-bold">Sel.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {searchResults.map(p => (
                    <tr key={p.id} className={`cursor-pointer transition-colors ${selProd?.id === p.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`} onClick={() => selectProd(p)}>
                      <td className="px-4 py-2.5 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{p.code}</td>
                      <td className="px-4 py-2.5 text-gray-500">{p.unit}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button type="button" onClick={(e) => { e.stopPropagation(); selectProd(p); }} className="text-white bg-green-600 hover:bg-green-700 transition-colors rounded-md p-1.5 flex items-center justify-center mx-auto shadow-sm">
                          <Plus size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selProd && (
            <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Descripción del Producto</label>
                <input className="w-full p-2 border border-gray-300 rounded-lg text-sm font-bold text-blue-800 focus:border-blue-500 outline-none" value={editDescripcion} onChange={e => setEditDescripcion(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Unidad (SUNAT)</label>
                <select className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white" value={editUnidad} onChange={e => setEditUnidad(e.target.value)}>
                  <option value="">Unidades</option>
                  {unidadesSunat.map(u => (
                    <option key={u.id} value={u.codigo}>{u.unidad}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-600 uppercase">Cantidades por Talla</p>
                  <p className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    Total: {tallas.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0) || 0}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TALLAS.map((t, i) => (
                    <div key={t} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-gray-500">{t}</span>
                      <input type="number" min="0" className="w-14 p-1.5 border border-gray-300 rounded-lg text-xs text-center focus:border-blue-500 outline-none" value={tallas[i]} onChange={e => { const n = [...tallas]; n[i] = e.target.value; setTallas(n); }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Pedido</label>
                  <input className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none" value={pedido} onChange={e => setPedido(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">KG. Neto (c/u)</label>
                  <input type="number" step="0.001" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none" value={pesoNeto} onChange={e => setPesoNeto(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">KG. Bruto total</label>
                  <input type="number" step="0.001" className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none" value={pesoBruto} onChange={e => setPesoBruto(e.target.value)} />
                </div>
              </div>
              <button type="button" onClick={addItem} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-bold flex items-center gap-2 transition-colors">
                <Plus size={16} />Agregar a la Guía
              </button>
            </div>
          )}
        </section>

        {/* Items */}
        {items.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Contenido de la Guía</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-bold">Código</th>
                  <th className="px-4 py-3 text-left font-bold">Producto</th>
                  <th className="px-4 py-3 text-left font-bold">Pedido</th>
                  <th className="px-4 py-3 text-right font-bold">Cant.</th>
                  <th className="px-4 py-3 text-center font-bold">Unidad</th>
                  <th className="px-4 py-3 text-right font-bold">KG. Neto</th>
                  <th className="px-4 py-3 text-right font-bold">KG. Bruto</th>
                  <th className="px-4 py-3 text-center font-bold">Quitar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it, idx) => (
                  editingItemIndex === idx ? (
                    <tr key={idx} className="bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border-2 border-blue-400 shadow-sm">
                      <td colSpan="8" className="p-4 sm:p-5">
                        <div className="space-y-4">
                          {/* Header bar of the edit panel */}
                          <div className="flex items-center justify-between border-b border-blue-200 pb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                                <Edit2 size={16} />
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-black text-blue-950 uppercase tracking-wide">
                                    Editar Producto #{idx + 1}
                                  </h3>
                                  <span className="bg-blue-200/70 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded">
                                    {editItemData.code || it.code || 'Sin código'}
                                  </span>
                                </div>
                                <p className="text-xs text-blue-600 font-medium mt-0.5">
                                  Modifique la descripción, unidad, tallas y cantidades
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={cancelEditItem}
                              className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
                              title="Cerrar y cancelar edición"
                            >
                              <X size={20} />
                            </button>
                          </div>

                          {/* Description & Unit */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Descripción del Producto
                              </label>
                              <input
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-bold text-blue-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                                value={editItemData.descripcion}
                                onChange={e => setEditItemData(p => ({ ...p, descripcion: e.target.value }))}
                                placeholder="Nombre o descripción base del producto..."
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                Unidad (SUNAT)
                              </label>
                              <select
                                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm"
                                value={editItemData.unidad}
                                onChange={e => setEditItemData(p => ({ ...p, unidad: e.target.value }))}
                              >
                                <option value="">Seleccionar unidad...</option>
                                {unidadesSunat.map(u => (
                                  <option key={u.id} value={u.codigo}>{u.unidad} ({u.codigo})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Cantidades por Talla */}
                          <div className="p-3.5 bg-white rounded-xl border border-blue-200 shadow-sm space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
                                <p className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                  Cantidades por Talla
                                </p>
                              </div>
                              <span className="text-xs font-bold text-blue-800 bg-blue-100 border border-blue-200 px-3 py-1 rounded-full">
                                Total Tallas: {editItemData.tallas.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {TALLAS.map((t, i) => (
                                <div key={t} className="flex flex-col items-center gap-1 bg-gray-50 hover:bg-blue-50/50 p-1.5 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                                  <span className="text-[11px] font-black text-gray-600 uppercase">{t}</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    className="w-14 p-1.5 border border-gray-300 rounded-md text-xs font-bold text-center bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    value={editItemData.tallas[i]}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setEditItemData(prev => {
                                        const n = [...prev.tallas];
                                        n[i] = val;
                                        return { ...prev, tallas: n };
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Fallback for items without tallas */}
                            <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3">
                              <span className="text-xs text-gray-500 font-medium">
                                O cantidad directa (si el producto no utiliza tallas):
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="1"
                                className="w-24 p-1.5 border border-gray-300 rounded-md text-xs font-bold text-center bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                value={editItemData.manualCant}
                                onChange={e => setEditItemData(prev => ({ ...prev, manualCant: e.target.value }))}
                                disabled={editItemData.tallas.some(t => parseFloat(t) > 0)}
                              />
                              {editItemData.tallas.some(t => parseFloat(t) > 0) && (
                                <span className="text-[11px] text-gray-400 italic">
                                  (Deshabilitado: se está sumando la cantidad de las tallas)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Pedido, KG Neto, KG Bruto */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 uppercase">Pedido</label>
                              <input
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                placeholder="Ej: PED-001"
                                value={editItemData.pedido}
                                onChange={e => setEditItemData(prev => ({ ...prev, pedido: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 uppercase">KG. Neto (c/u)</label>
                              <input
                                type="number"
                                step="0.001"
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                placeholder="0.000"
                                value={editItemData.pesoNeto}
                                onChange={e => setEditItemData(prev => ({ ...prev, pesoNeto: e.target.value }))}
                              />
                              {(() => {
                                const tSum = editItemData.tallas.reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0) || (parseFloat(editItemData.manualCant) || 1);
                                const uNet = parseFloat(editItemData.pesoNeto) || 0;
                                return uNet > 0 ? (
                                  <p className="text-[11px] text-blue-700 font-medium">
                                    Total Neto calculado: <b>{(tSum * uNet).toFixed(2)} kg</b>
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-gray-600 uppercase">KG. Bruto total</label>
                              <input
                                type="number"
                                step="0.001"
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                                placeholder="0.000"
                                value={editItemData.pesoBruto}
                                onChange={e => setEditItemData(prev => ({ ...prev, pesoBruto: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-blue-200">
                            <button
                              type="button"
                              onClick={cancelEditItem}
                              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={saveEditedItem}
                              className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                            >
                              <Check size={16} />
                              Guardar Cambios del Producto
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600 text-xs font-mono">{it.code}</td>
                      <td className="px-4 py-3 text-gray-800 text-xs max-w-[280px]">
                        {it.descripcion_producto && it.descripcion_producto.includes('<') ? (
                          <div
                            className="prose prose-xs max-w-none [&_table]:border-collapse [&_table]:border [&_table_td]:border [&_table_td]:border-gray-300 [&_table_td]:p-1 [&_table_td]:text-center [&_table_td]:text-[10px] [&_table]:mt-1 [&_table]:bg-white rounded overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: it.descripcion_producto }}
                          />
                        ) : (
                          <span className="font-semibold">{it.descripcion_producto}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{it.pedido}</td>
                      <td className="px-4 py-3 text-right font-bold">{it.cantidad}</td>
                      <td className="px-4 py-3 text-center text-gray-600 text-xs">{it.unidad}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{it.t_neto}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{it.t_bruto}</td>
                      <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                        <button type="button" onClick={() => startEditItem(it, idx)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button type="button" onClick={() => setItems(p => p.filter((_, i) => i !== idx))} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
              <tfoot className="bg-gray-50 border-t">
                <tr>
                  <td colSpan="5" className="px-4 py-3 text-xs font-black text-gray-600 uppercase">Totales</td>
                  <td className="px-4 py-3 text-right font-black text-gray-900">{totalNeto}</td>
                  <td className="px-4 py-3 text-right font-black text-gray-900">{totalBruto}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </section>
        )}

        <div className="flex justify-end gap-3 pb-8">
          <button type="button" onClick={() => navigate('/guias')} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={saving || items.length === 0} className="px-10 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
            {saving ? 'Guardando...' : 'Guardar Guía de Remisión'}
          </button>
        </div>
      </form>
    </div>
  );
}
