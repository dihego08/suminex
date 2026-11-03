import { useState, useEffect } from 'react';
import api from '../../services/api';
import { handleDocumentClick } from '../../utils/image';
import { XMarkIcon, PencilIcon, TrashIcon, DocumentArrowDownIcon, DocumentIcon } from '@heroicons/react/24/outline';

const EMPTY = {
  empresa: '',
  cargo: '',
  responsabilidades: '',
  fecha_ingreso: '',
  fecha_termino: '',
  tiempo_servicio: '',
  motivo_cese: '',
  archivo: null
};

export default function ExperienciaLaboralModal({ colaborador, onClose }) {
  const [experiencias, setExperiencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (colaborador) {
      fetchExperiencias();
    }
  }, [colaborador]);

  const fetchExperiencias = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sig/colaboradores/${colaborador.id}/experiencia`);
      setExperiencias(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ex) => {
    setFormData({ ...ex, archivo: null });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar experiencia laboral?')) return;
    try {
      await api.delete(`/sig/colaboradores/${colaborador.id}/experiencia/${id}`);
      fetchExperiencias();
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
        // Use POST with id because of multipart form data in PHP
        await api.post(`/sig/colaboradores/${colaborador.id}/experiencia/${formData.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post(`/sig/colaboradores/${colaborador.id}/experiencia`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setFormData(EMPTY);
      setIsEditing(false);
      fetchExperiencias();
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
            <h2 className="text-lg font-bold text-gray-900">Experiencia Laboral</h2>
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
            <h3 className="font-bold text-gray-700 mb-4">{isEditing ? 'Editar Experiencia' : 'Nueva Experiencia'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClasses}>Empresa *</label>
                <input required type="text" className={inputClasses} value={formData.empresa} onChange={e => setFormData({...formData, empresa: e.target.value})} />
              </div>
              <div>
                <label className={labelClasses}>Cargo *</label>
                <input required type="text" className={inputClasses} value={formData.cargo} onChange={e => setFormData({...formData, cargo: e.target.value})} />
              </div>
              <div>
                <label className={labelClasses}>Responsabilidades</label>
                <textarea className={inputClasses} rows="2" value={formData.responsabilidades || ''} onChange={e => setFormData({...formData, responsabilidades: e.target.value})}></textarea>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelClasses}>Fec. Ingreso</label>
                  <input type="date" className={inputClasses} value={formData.fecha_ingreso || ''} onChange={e => setFormData({...formData, fecha_ingreso: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Fec. Término</label>
                  <input type="date" className={inputClasses} value={formData.fecha_termino || ''} onChange={e => setFormData({...formData, fecha_termino: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className={labelClasses}>Tiempo Serv.</label>
                  <input type="text" className={inputClasses} value={formData.tiempo_servicio || ''} onChange={e => setFormData({...formData, tiempo_servicio: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className={labelClasses}>Motivo Cese</label>
                  <input type="text" className={inputClasses} value={formData.motivo_cese || ''} onChange={e => setFormData({...formData, motivo_cese: e.target.value})} />
                </div>
              </div>
              
              <div>
                <label className={labelClasses}>Certificado (PDF, Imagen)</label>
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
            ) : experiencias.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay experiencia laboral registrada.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Empresa</th>
                      <th className="px-4 py-3 font-semibold">Cargo</th>
                      <th className="px-4 py-3 font-semibold">Ingreso</th>
                      <th className="px-4 py-3 font-semibold">Término</th>
                      <th className="px-4 py-3 font-semibold text-center">Certificado</th>
                      <th className="px-4 py-3 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {experiencias.map(ex => (
                      <tr key={ex.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{ex.empresa}</td>
                        <td className="px-4 py-3">{ex.cargo}</td>
                        <td className="px-4 py-3">{ex.fecha_ingreso || '-'}</td>
                        <td className="px-4 py-3">{ex.fecha_termino || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          {ex.archivo ? (
                            <a href="#" onClick={(e) => handleDocumentClick(e, ex.archivo, 'experiencia')} className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded-md">
                              <DocumentArrowDownIcon className="w-4 h-4" /> Ver
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400 inline-flex items-center gap-1"><DocumentIcon className="w-4 h-4"/> N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit({...ex, archivo_actual: ex.archivo})} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-md">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(ex.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md">
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
