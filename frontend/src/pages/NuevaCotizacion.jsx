import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = 'http://localhost:8080/suminex/backend/public/api';

const NuevaCotizacion = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  
  const [formData, setFormData] = useState({
    id_cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days later
  });

  const [detalles, setDetalles] = useState([
    { id_producto: '', descripcion_personalizada: '', cantidad: 1, precio_unitario: 0, total: 0 }
  ]);

  useEffect(() => {
    // Cargar Catálogos
    axios.get(`${API_URL}/clientes`).then(res => setClientes(res.data));
    axios.get(`${API_URL}/productos`).then(res => setProductos(res.data));
  }, []);

  const handleDetalleChange = (index, field, value) => {
    const newDetalles = [...detalles];
    newDetalles[index][field] = value;

    if (field === 'id_producto') {
      const prod = productos.find(p => p.id === parseInt(value));
      if (prod) {
        newDetalles[index].descripcion_personalizada = prod.descripcion;
        newDetalles[index].precio_unitario = prod.precio_base;
        newDetalles[index].total = prod.precio_base * newDetalles[index].cantidad;
      }
    }

    if (field === 'cantidad' || field === 'precio_unitario') {
      newDetalles[index].total = newDetalles[index].cantidad * newDetalles[index].precio_unitario;
    }

    setDetalles(newDetalles);
  };

  const addRow = () => {
    setDetalles([...detalles, { id_producto: '', descripcion_personalizada: '', cantidad: 1, precio_unitario: 0, total: 0 }]);
  };

  const removeRow = (index) => {
    setDetalles(detalles.filter((_, i) => i !== index));
  };

  const subtotal = detalles.reduce((acc, curr) => acc + curr.total, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        base_imponible: subtotal.toFixed(2),
        igv: igv.toFixed(2),
        total: total.toFixed(2),
        detalles
      };
      await axios.post(`${API_URL}/cotizaciones`, payload);
      navigate('/cotizaciones');
    } catch (error) {
      alert("Error al guardar la cotización");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cotizaciones" className="p-2 hover:bg-gray-200 rounded-full transition"><ArrowLeft size={24} /></Link>
        <h1 className="text-2xl font-bold text-gray-800">Crear Nueva Cotización</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
            <select 
              required
              value={formData.id_cliente}
              onChange={(e) => setFormData({...formData, id_cliente: e.target.value})}
              className="w-full border border-gray-300 rounded-xl p-2.5 bg-gray-50"
            >
              <option value="">Seleccione un cliente...</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social} (RUC: {c.ruc})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Emisión</label>
            <input 
              type="date" required 
              value={formData.fecha}
              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
              className="w-full border border-gray-300 rounded-xl p-2.5 bg-gray-50" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Vencimiento</label>
            <input 
              type="date" required 
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
              className="w-full border border-gray-300 rounded-xl p-2.5 bg-gray-50" 
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Ítems de Cotización</h3>
            <button type="button" onClick={addRow} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition">
              <Plus size={16} /> Añadir Ítem
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-white text-sm">
                <tr>
                  <th className="p-3 w-1/3">Producto</th>
                  <th className="p-3">Descripción (Editable)</th>
                  <th className="p-3 w-24">Cant.</th>
                  <th className="p-3 w-32">Precio Unit.</th>
                  <th className="p-3 w-32">Total</th>
                  <th className="p-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {detalles.map((det, index) => (
                  <tr key={index}>
                    <td className="p-3">
                      <select 
                        required
                        value={det.id_producto}
                        onChange={(e) => handleDetalleChange(index, 'id_producto', e.target.value)}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                      >
                        <option value="">Seleccione...</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>{p.codigo} - {p.descripcion}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <input 
                        type="text" required
                        value={det.descripcion_personalizada}
                        onChange={(e) => handleDetalleChange(index, 'descripcion_personalizada', e.target.value)}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" required min="1"
                        value={det.cantidad}
                        onChange={(e) => handleDetalleChange(index, 'cantidad', parseFloat(e.target.value))}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                      />
                    </td>
                    <td className="p-3">
                      <input 
                        type="number" required step="0.01"
                        value={det.precio_unitario}
                        onChange={(e) => handleDetalleChange(index, 'precio_unitario', parseFloat(e.target.value))}
                        className="w-full border-gray-300 rounded-lg p-2 text-sm bg-gray-50"
                      />
                    </td>
                    <td className="p-3 font-medium">S/ {det.total.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      {detalles.length > 1 && (
                        <button type="button" onClick={() => removeRow(index)} className="text-red-500 hover:text-red-700">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <span>Base Imponible:</span>
              <span>S/ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-3 text-sm text-gray-600">
              <span>IGV (18%):</span>
              <span>S/ {igv.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-gray-800 border-t pt-2">
              <span>TOTAL:</span>
              <span>S/ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/30">
            <Save size={20} /> Guardar Cotización
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevaCotizacion;
