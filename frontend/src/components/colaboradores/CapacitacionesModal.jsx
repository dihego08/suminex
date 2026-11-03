import { useState, useEffect } from 'react';
import api from '../../services/api';
import { handleDocumentClick } from '../../utils/image';
import { XMarkIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, DocumentIcon } from '@heroicons/react/24/outline';

const EMPTY = {
  curso: '',
  horas: '',
  fecha: '',
  capacitador: '',
  lugar: '',
  archivo: null
};

export default function CapacitacionesModal({ colaborador, onClose }) {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (colaborador) {
      fetchCapacitaciones();
    }
  }, [colaborador]);

  const fetchCapacitaciones = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sig/colaboradores/${colaborador.id}/capacitaciones`);
      setCapacitaciones(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c) => {
    setFormData({ ...c, archivo: null });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar capacitación?')) return;
    try {
      await api.delete(`/sig/colaboradores/${colaborador.id}/capacitaciones/${id}`);
      fetchCapacitaciones();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, archivo: e.target.files[0] });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    const payload = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'archivo' && key !== 'archivo_actual' && formData[key] !== null && formData[key] !== undefined) {
        payload.append(key, formData[key]);
      }
    });

    if (formData.archivo) {
      payload.append('archivo', formData.archivo);
    }

    try {
      if (isEditing) {
        await api.post(`/sig/colaboradores/${colaborador.id}/capacitaciones/${formData.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/sig/colaboradores/${colaborador.id}/capacitaciones`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setFormData(EMPTY);
      setIsEditing(false);
      fetchCapacitaciones();
    } catch (e) {
      alert(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setFormData(EMPTY);
    setIsEditing(false);
  };


  const inputClasses = "w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none";
  const labelClasses = "block text-xs font-bold text-gray-500 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Capacitaciones</h2>
            <p className="text-xs text-gray-500">Colaborador: {colaborador.nombres} {colaborador.apellido_paterno}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 flex flex-col lg:flex-row gap-6">
          
          {/* Form */}
          <div className="w-full lg:w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-100 shrink-0">
            <h3 className="font-bold text-gray-700 mb-4">{isEditing ? 'Editar Capacitación' : 'Nueva Capacitación'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClasses}>Curso / Tema *</label>
                <input required type="text" className={inputClasses} value={formData.curso} onChange={e => setFormData({...formData, curso: e.target.value})} />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelClasses}>Horas</label>
                  <input type="text" className={inputClasses} value={formData.horas || ''} onChange={e => setFormData({...formData, horas: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Fecha</label>
                  <input type="date" className={inputClasses} value={formData.fecha || ''} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Capacitador / Institución</label>
                <input type="text" className={inputClasses} value={formData.capacitador || ''} onChange={e => setFormData({...formData, capacitador: e.target.value})} />
              </div>
              <div>
                <label className={labelClasses}>Lugar</label>
                <input type="text" className={inputClasses} value={formData.lugar || ''} onChange={e => setFormData({...formData, lugar: e.target.value})} />
              </div>
              
              <div>
                <label className={labelClasses}>Certificado / Constancia</label>
                <input type="file" accept=".pdf,image/*" className={`${inputClasses} bg-white text-xs file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer`} onChange={handleFileChange} />
                {isEditing && formData.archivo_actual && !formData.archivo && (
                  <p className="text-xs text-amber-600 mt-1">Archivo actual: {formData.archivo_actual}</p>
                )}
              </div>

              <div className="pt-3 flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">
                  {saving ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Agregar')}
                </button>
                {isEditing && (
                  <button type="button" onClick={cancelEdit} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors">
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* List */}
          <div className="w-full lg:w-2/3">
            {loading ? (
              <div className="text-center py-10 text-gray-500">Cargando...</div>
            ) : capacitaciones.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay capacitaciones registradas.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Curso / Tema</th>
                      <th className="px-4 py-3 font-semibold">Horas</th>
                      <th className="px-4 py-3 font-semibold">Fecha</th>
                      <th className="px-4 py-3 font-semibold">Capacitador</th>
                      <th className="px-4 py-3 font-semibold text-center">Archivo</th>
                      <th className="px-4 py-3 font-semibold text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {capacitaciones.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{c.curso}</td>
                        <td className="px-4 py-3">{c.horas}</td>
                        <td className="px-4 py-3">{c.fecha}</td>
                        <td className="px-4 py-3">{c.capacitador}</td>
                        <td className="px-4 py-3 text-center">
                          {c.archivo ? (
                            <a href="#" onClick={(e) => handleDocumentClick(e, c.archivo, 'capacitaciones')} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded-md">
                              <DocumentArrowDownIcon className="w-4 h-4" /> Ver
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1"><DocumentIcon className="w-4 h-4"/> N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit({...c, archivo_actual: c.archivo})} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-md">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
