import { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BriefcaseIcon,
  MapPinIcon,
  UsersIcon,
  AcademicCapIcon,
  StarIcon,
  CheckBadgeIcon,
  PrinterIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

export default function PerfilPuestosView() {
  const [puestos, setPuestos] = useState([]);
  const [selectedPuestoId, setSelectedPuestoId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    id_puesto: '',
    puesto: null,
    area: null,
    reporta_a: '',
    supervisa_a: '',
    interactua_con: '',
    reemplazado_por: '',
    objetivo: '',
    funciones: '',
    responsabilidades: '',
    equipo_utilizado: '',
    lugar_trabajo: '',
    requerimientos_fisicos: '',
    formacion_basica: '',
    formacion_basica_optima: '',
    conocimientos_especificos: '',
    experiencia_requerida: '',
    experiencia_requerida_optima: '',
    idioma: '',
    competencia_especifica: '',
    competencia_cardinal: '',
    elaborado_por: '',
    aprobado_por: '',
    fecha_aprobacion: ''
  });

  useEffect(() => {
    fetchPuestos();
  }, []);

  const fetchPuestos = async () => {
    try {
      const r = await api.get('/sig/puestos');
      setPuestos(r.data || []);
    } catch (e) { console.error(e); }
  };

  const handlePuestoChange = async (id) => {
    setSelectedPuestoId(id);
    if (!id || id === '0') {
      resetForm();
      return;
    }
    setLoading(true);
    try {
      const r = await api.get(`/sig/perfil/${id}`);
      const data = r.data;
      const puestoObj = data.puesto || (data.exists ? data.puesto : null);
      
      setFormData({
        id_puesto: id,
        puesto: data.puesto,
        area: data.puesto?.area,
        reporta_a: data.reporta_a || '',
        supervisa_a: data.supervisa_a || '',
        interactua_con: data.interactua_con || '',
        reemplazado_por: data.reemplazado_por || '',
        objetivo: data.objetivo || '',
        funciones: data.funciones || '',
        responsabilidades: data.responsabilidades || '',
        equipo_utilizado: data.equipo_utilizado || '',
        lugar_trabajo: data.lugar_trabajo || '',
        requerimientos_fisicos: data.requerimientos_fisicos || '',
        formacion_basica: data.formacion_basica || '',
        formacion_basica_optima: data.formacion_basica_optima || '',
        conocimientos_especificos: data.conocimientos_especificos || '',
        experiencia_requerida: data.experiencia_requerida || '',
        experiencia_requerida_optima: data.experiencia_requerida_optima || '',
        idioma: data.idioma || '',
        competencia_especifica: data.competencia_especifica || '',
        competencia_cardinal: data.competencia_cardinal || '',
        elaborado_por: data.elaborado_por || '',
        aprobado_por: data.aprobado_por || '',
        fecha_aprobacion: data.fecha_aprobacion || ''
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setFormData({
      id_puesto: '', puesto: '', area: '', reporta_a: '', supervisa_a: '', interactua_con: '', reemplazado_por: '',
      objetivo: '', funciones: '', responsabilidades: '', equipo_utilizado: '', lugar_trabajo: '', requerimientos_fisicos: '',
      formacion_basica: '', formacion_basica_optima: '', conocimientos_especificos: '', experiencia_requerida: '', experiencia_requerida_optima: '',
      idioma: '', competencia_especifica: '', competencia_cardinal: '', elaborado_por: '', aprobado_por: '', fecha_aprobacion: ''
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPuestoId) return;
    setSaving(true);
    try {
      await api.post('/sig/perfil', formData);
      alert('Perfil guardado con éxito');
    } catch (e) {
      alert('Error al guardar el perfil');
    } finally { setSaving(false); }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Perfil de Puesto</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de perfiles y descriptivos de puestos (SIG)</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-2 max-w-md">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Seleccionar Puesto para Gestionar</label>
          <select 
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium outline-none focus:border-blue-500 transition-all cursor-pointer"
            value={selectedPuestoId}
            onChange={(e) => handlePuestoChange(e.target.value)}
          >
            <option value="0">-- Seleccione un puesto --</option>
            {puestos.map(p => (
              <option key={p.id} value={p.id}>{p.puesto} - {p.area?.area}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {selectedPuestoId && !loading && (
        <form onSubmit={handleSave} className="space-y-6 animate-in slide-in-from-bottom-2 duration-400">
          {/* I. IDENTIFICACIÓN */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <BriefcaseIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">I. Identificación del Puesto</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Título del Puesto</label>
                <input readOnly type="text" className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 outline-none" value={formData.puesto?.puesto || ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Área</label>
                <input readOnly type="text" className="w-full p-2 bg-gray-100 border border-gray-200 rounded-md text-sm text-gray-600 outline-none" value={formData.area?.area || ''} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Reporta a</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.reporta_a} onChange={e => setFormData({ ...formData, reporta_a: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Reemplazado por</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.reemplazado_por} onChange={e => setFormData({ ...formData, reemplazado_por: e.target.value })} />
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Supervisa a</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[100px]">
                  <ReactQuill theme="snow" value={formData.supervisa_a} onChange={val => setFormData({ ...formData, supervisa_a: val })} />
                </div>
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Interactúa con</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[100px]">
                  <ReactQuill theme="snow" value={formData.interactua_con} onChange={val => setFormData({ ...formData, interactua_con: val })} />
                </div>
              </div>
            </div>
          </div>

          {/* II. CONTENIDO */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <MapPinIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">II. Contenido</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Objetivo del Puesto</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.objetivo} onChange={e => setFormData({ ...formData, objetivo: e.target.value })} />
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Funciones</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[150px]">
                  <ReactQuill theme="snow" value={formData.funciones} onChange={val => setFormData({ ...formData, funciones: val })} />
                </div>
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Responsabilidades</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[150px]">
                  <ReactQuill theme="snow" value={formData.responsabilidades} onChange={val => setFormData({ ...formData, responsabilidades: val })} />
                </div>
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Equipo Utilizado</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[100px]">
                  <ReactQuill theme="snow" value={formData.equipo_utilizado} onChange={val => setFormData({ ...formData, equipo_utilizado: val })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Lugar de Trabajo</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.lugar_trabajo} onChange={e => setFormData({ ...formData, lugar_trabajo: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Requerimientos Físicos</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.requerimientos_fisicos} onChange={e => setFormData({ ...formData, requerimientos_fisicos: e.target.value })} />
              </div>
            </div>
          </div>

          {/* III. CONOCIMIENTOS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <AcademicCapIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">III. Conocimientos Requeridos</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase block">Educación Básica</label>
                <div className="grid grid-cols-1 gap-2">
                  <input type="text" placeholder="Requerido" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.formacion_basica} onChange={e => setFormData({ ...formData, formacion_basica: e.target.value })} />
                  <input type="text" placeholder="Óptimo" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.formacion_basica_optima} onChange={e => setFormData({ ...formData, formacion_basica_optima: e.target.value })} />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-gray-500 uppercase block">Experiencia o Formación</label>
                <div className="grid grid-cols-1 gap-2">
                  <input type="text" placeholder="Requerido" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.experiencia_requerida} onChange={e => setFormData({ ...formData, experiencia_requerida: e.target.value })} />
                  <input type="text" placeholder="Óptimo" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.experiencia_requerida_optima} onChange={e => setFormData({ ...formData, experiencia_requerida_optima: e.target.value })} />
                </div>
              </div>
              <div className="col-span-full space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Conocimientos Específicos</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[100px]">
                  <ReactQuill theme="snow" value={formData.conocimientos_especificos} onChange={val => setFormData({ ...formData, conocimientos_especificos: val })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Idioma</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.idioma} onChange={e => setFormData({ ...formData, idioma: e.target.value })} />
              </div>
            </div>
          </div>

          {/* IV & V. COMPETENCIAS */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <StarIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">IV & V. Competencias</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">IV. Competencia Específica del Puesto</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[120px]">
                  <ReactQuill theme="snow" value={formData.competencia_especifica} onChange={val => setFormData({ ...formData, competencia_especifica: val })} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">V. Competencias Cardinales</label>
                <div className="border border-gray-300 rounded-md overflow-hidden bg-white min-h-[120px]">
                  <ReactQuill theme="snow" value={formData.competencia_cardinal} onChange={val => setFormData({ ...formData, competencia_cardinal: val })} />
                </div>
              </div>
            </div>
          </div>

          {/* VALIDACIÓN */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
              <CheckBadgeIcon className="h-5 w-5 text-gray-500" />
              <h3 className="font-bold text-gray-800">Validación</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Elaborado por</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.elaborado_por} onChange={e => setFormData({ ...formData, elaborado_por: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Aprobado por</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.aprobado_por} onChange={e => setFormData({ ...formData, aprobado_por: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Fecha Aprobación</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 outline-none" value={formData.fecha_aprobacion} onChange={e => setFormData({ ...formData, fecha_aprobacion: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button 
              type="button"
              className="px-6 py-2.5 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm shadow-sm"
              onClick={() => window.open(`${api.defaults.baseURL}/sig/perfil/${selectedPuestoId}/pdf`, '_blank')}
            >
              <PrinterIcon className="h-4 w-4" />
              Exportar PDF
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-all disabled:opacity-50 text-sm shadow-sm"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
