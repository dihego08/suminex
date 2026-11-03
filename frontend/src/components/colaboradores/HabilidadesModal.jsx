import { useState, useEffect } from 'react';
import api from '../../services/api';
import { XMarkIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const EMPTY = {
  elemento: '',
  habilidad: '',
  tipo: ''
};

export default function HabilidadesModal({ colaborador, onClose }) {
  const [habilidades, setHabilidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(EMPTY);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (colaborador) {
      fetchHabilidades();
    }
  }, [colaborador]);

  const fetchHabilidades = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/sig/colaboradores/${colaborador.id}/habilidades`);
      setHabilidades(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (h) => {
    setFormData(h);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar habilidad?')) return;
    try {
      await api.delete(`/sig/colaboradores/${colaborador.id}/habilidades/${id}`);
      fetchHabilidades();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/sig/colaboradores/${colaborador.id}/habilidades/${formData.id}`, formData);
      } else {
        await api.post(`/sig/colaboradores/${colaborador.id}/habilidades`, formData);
      }
      setFormData(EMPTY);
      setIsEditing(false);
      fetchHabilidades();
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Habilidades</h2>
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
            <h3 className="font-bold text-gray-700 mb-4">{isEditing ? 'Editar Habilidad' : 'Nueva Habilidad'}</h3>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className={labelClasses}>Elemento</label>
                <input type="text" className={inputClasses} value={formData.elemento || ''} onChange={e => setFormData({...formData, elemento: e.target.value})} placeholder="Ej. Liderazgo, Software..." />
              </div>
              <div>
                <label className={labelClasses}>Habilidad *</label>
                <textarea required className={inputClasses} rows="3" value={formData.habilidad || ''} onChange={e => setFormData({...formData, habilidad: e.target.value})}></textarea>
              </div>
              <div>
                <label className={labelClasses}>Tipo</label>
                <input type="text" className={inputClasses} value={formData.tipo || ''} onChange={e => setFormData({...formData, tipo: e.target.value})} placeholder="Ej. Blanda, Técnica..." />
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
            ) : habilidades.length === 0 ? (
              <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">No hay habilidades registradas.</div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-1/4">Elemento</th>
                      <th className="px-4 py-3 font-semibold">Descripción / Habilidad</th>
                      <th className="px-4 py-3 font-semibold w-1/4">Tipo</th>
                      <th className="px-4 py-3 font-semibold text-center w-20">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {habilidades.map(h => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">{h.elemento}</td>
                        <td className="px-4 py-3 font-medium whitespace-pre-wrap">{h.habilidad}</td>
                        <td className="px-4 py-3">{h.tipo}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(h)} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded-md">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(h.id)} className="text-red-600 hover:text-red-800 p-1 bg-red-50 rounded-md">
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
