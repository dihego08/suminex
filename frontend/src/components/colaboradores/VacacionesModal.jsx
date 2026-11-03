import { useState, useEffect } from 'react';
import api from '../../services/api';
import { handleDocumentClick } from '../../utils/image';
import { XMarkIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, DocumentIcon } from '@heroicons/react/24/outline';

const EMPTY = {
  periodo: '',
  fecha_salida: '',
  fecha_retorno: '',
  dias: '',
  observaciones: '',
  archivo: null
};

export default function VacacionesModal({ colaborador, onClose }) {
  const [vacaciones, setVacaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (colaborador) {
      fetchVacaciones();
    }
  }, [colaborador]);

  const fetchVacaciones = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sig/colaboradores/${colaborador.id}/vacaciones`);
      setVacaciones(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (v) => {
    setFormData({ ...v, archivo: null });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar registro de vacaciones?')) return;
    try {
      await api.delete(`/sig/colaboradores/${colaborador.id}/vacaciones/${id}`);
      fetchVacaciones();
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
        await api.post(`/sig/colaboradores/${colaborador.id}/vacaciones/${formData.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/sig/colaboradores/${colaborador.id}/vacaciones`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setFormData(EMPTY);
      setIsEditing(false);
      fetchVacaciones();
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
            <h2 className="text-lg font-bold text-gray-900">Vacaciones</h2>
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
            <h3 className="font-bold text-gray-700 mb-4">{isEditing ? 'Editar Vacaciones' : 'Nuevas Vacaciones'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClasses}>Periodo</label>
                <input type="text" className={inputClasses} value={formData.periodo || ''} onChange={e => setFormData({...formData, periodo: e.target.value})} placeholder="Ej. 2024-2025" />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelClasses}>Fecha Salida</label>
                  <input type="date" className={inputClasses} value={formData.fecha_salida || ''} onChange={e => setFormData({...formData, fecha_salida: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Fecha Retorno</label>
                  <input type="date" className={inputClasses} value={formData.fecha_retorno || ''} onChange={e => setFormData({...formData, fecha_retorno: e.target.value})} />
                </div>
              </div>
              <div>
                <label className={labelClasses}>Días Gozados</label>
                <input type="number" className={inputClasses} value={formData.dias || ''} onChange={e => setFormData({...formData, dias: e.target.value})} />
              </div>
              <div>
                <label className={labelClasses}>Observaciones</label>
                <textarea className={inputClasses} rows="3" value={formData.observaciones || ''} onChange={e => setFormData({...formData, observaciones: e.target.value})}></textarea>
              </div>
              
              <div>
                <label className={labelClasses}>Documento (Sustento)</label>
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
            ) : vacaciones.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay vacaciones registradas.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Periodo</th>
                      <th className="px-4 py-3 font-semibold">F. Salida</th>
                      <th className="px-4 py-3 font-semibold">F. Retorno</th>
                      <th className="px-4 py-3 font-semibold">Días</th>
                      <th className="px-4 py-3 font-semibold text-center">Documento</th>
                      <th className="px-4 py-3 font-semibold text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {vacaciones.map(v => (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{v.periodo}</td>
                        <td className="px-4 py-3">{v.fecha_salida}</td>
                        <td className="px-4 py-3">{v.fecha_retorno}</td>
                        <td className="px-4 py-3">{v.dias}</td>
                        <td className="px-4 py-3 text-center">
                          {v.archivo ? (
                            <a href="#" onClick={(e) => handleDocumentClick(e, v.archivo, 'vacaciones')} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded-md">
                              <DocumentArrowDownIcon className="w-4 h-4" /> Ver
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1"><DocumentIcon className="w-4 h-4"/> N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit({...v, archivo_actual: v.archivo})} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-md">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(v.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md">
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
