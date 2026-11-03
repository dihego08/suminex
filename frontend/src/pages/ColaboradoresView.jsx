import { useState, useEffect } from 'react';
import api from '../services/api';
import { getColaboradorFotoUrl, handleColaboradorFotoError, handleDocumentClick } from '../utils/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  CameraIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline';
import FamiliaresModal from '../components/colaboradores/FamiliaresModal';
import FormacionModal from '../components/colaboradores/FormacionModal';
import ExperienciaLaboralModal from '../components/colaboradores/ExperienciaLaboralModal';
import HabilidadesModal from '../components/colaboradores/HabilidadesModal';
import CapacitacionesModal from '../components/colaboradores/CapacitacionesModal';
import VacacionesModal from '../components/colaboradores/VacacionesModal';
import ContratosModal from '../components/colaboradores/ContratosModal';
import ExamenesMedicosModal from '../components/colaboradores/ExamenesMedicosModal';
import RecomendacionesSstModal from '../components/colaboradores/RecomendacionesSstModal';
import VerificacionCompetenciasModal from '../components/colaboradores/VerificacionCompetenciasModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EMPTY = {
  id: '',
  dni: '',
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  foto: '',
  fecha_nacimiento: '',
  lugar_nacimiento: '',
  id_estado_civil: '',
  celular: '',
  correo: '',
  brevette: '',
  direccion: '',
  telefono_emergencia: '',
  id_sistema_pension: '',
  id_entidad_pension: '',
  codigo: '',
  asegurado: false,
  proceso: '',
  sueldo: '',
  genero: 'M',
  estado_laboral: '1',
  fecha_ingreso: '',
  fecha_salida: '',
  id_cargo: '',
  linea: '1',
  estado: true,
  contrato: '',
  sst: '',
  archivo: '',
  competencias: '',
  dni_archivo: ''
};

export default function ColaboradoresView() {
  const [colaboradores, setColaboradores] = useState([]);
  const [metadata, setMetadata] = useState({ areas: [], puestos: [], estado_civil: [], sistema_pensiones: [], afps: [] });
  const [loading, setLoading] = useState(true);

  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState('personal');
  const [fotoPreview, setFotoPreview] = useState(null);

  // Filters
  const [filterMonth, setFilterMonth] = useState('0');
  const [filterLine, setFilterLine] = useState('0');

  // Search Modal
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchDni, setSearchDni] = useState('');
  const [searchNombre, setSearchNombre] = useState('');
  const [searchApellido, setSearchApellido] = useState('');

  // Modals
  const [showFamiliares, setShowFamiliares] = useState(false);
  const [showFormacion, setShowFormacion] = useState(false);
  const [showExperiencia, setShowExperiencia] = useState(false);
  const [showHabilidades, setShowHabilidades] = useState(false);
  const [showCapacitaciones, setShowCapacitaciones] = useState(false);
  const [showVacaciones, setShowVacaciones] = useState(false);
  const [showContratos, setShowContratos] = useState(false);
  const [showExamenes, setShowExamenes] = useState(false);
  const [showSst, setShowSst] = useState(false);
  const [showCompetencias, setShowCompetencias] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchColaboradores();
  }, []);

  const fetchMetadata = async () => {
    try {
      const r = await api.get('/sig/colaboradores/metadata');
      setMetadata(r.data);
    } catch (e) { console.error(e); }
  };

  const fetchColaboradores = async (idToFocus = null) => {
    setLoading(true);
    try {
      const r = await api.get('/sig/colaboradores', {
        params: { mes_cumpleanos: filterMonth, linea: filterLine }
      });
      const data = r.data;
      setColaboradores(data);
      setIsAdding(false);

      if (data.length > 0) {
        if (idToFocus) {
          const idx = data.findIndex(c => c.id === idToFocus);
          if (idx !== -1) {
            loadRecord(idx, data);
            return;
          }
        }
        loadRecord(0, data);
      } else {
        setCurrentIndex(-1);
        setFormData(EMPTY);
        setFotoPreview(null);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadRecord = (index, list = colaboradores) => {
    if (index >= 0 && index < list.length) {
      setCurrentIndex(index);
      setIsAdding(false);
      const c = list[index];
      // Los campos nulos de la base se pasan a '' para que los inputs sigan siendo controlados
      const sinNulos = Object.fromEntries(Object.entries(c).map(([k, v]) => [k, v === null ? '' : v]));
      setFormData({
        ...EMPTY,
        ...sinNulos,
        asegurado: !!c.asegurado,
        estado: !!c.estado
      });
      setFotoPreview(getColaboradorFotoUrl(c.foto));
    }
  };

  const handleNext = () => {
    if (isAdding) return setIsAdding(false);
    if (currentIndex < colaboradores.length - 1) {
      loadRecord(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (isAdding) return setIsAdding(false);
    if (currentIndex > 0) {
      loadRecord(currentIndex - 1);
    }
  };

  const handleSearchClick = () => {
    setShowSearchModal(true);
    setSearchDni('');
    setSearchNombre('');
    setSearchApellido('');
  };

  const executeSearch = async () => {
    try {
      const r = await api.get('/sig/colaboradores', {
        params: { search: `${searchDni} ${searchNombre} ${searchApellido}`.trim() }
      });
      if (r.data.length > 0) {
        setColaboradores(r.data);
        loadRecord(0, r.data);
        setShowSearchModal(false);
      } else {
        alert('No se encontraron registros');
      }
    } catch (e) { console.error(e); }
  };

  const startAdding = () => {
    setIsAdding(true);
    setFormData(EMPTY);
    setFotoPreview(null);
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(f => ({ ...f, foto: file }));
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleDniArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(f => ({ ...f, dni_archivo: file }));
    }
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'id' && !formData.id) return;
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });

      const r = await api.post('/sig/colaboradores', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Registro guardado');
      const savedId = formData.id || r.data?.id;
      fetchColaboradores(savedId);
    } catch (err) {
      alert(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const deleteRecord = async () => {
    if (!formData.id) return;
    if (!window.confirm('¿Eliminar este colaborador?')) return;
    try {
      await api.delete(`/sig/colaboradores/${formData.id}`);
      fetchColaboradores();
    } catch (e) {
      alert('Error al eliminar');
    }
  };

  const MESES = [
    { v: '0', n: '-- TODOS LOS MESES --' },
    { v: '1', n: 'Enero' }, { v: '2', n: 'Febrero' }, { v: '3', n: 'Marzo' },
    { v: '4', n: 'Abril' }, { v: '5', n: 'Mayo' }, { v: '6', n: 'Junio' },
    { v: '7', n: 'Julio' }, { v: '8', n: 'Agosto' }, { v: '9', n: 'Septiembre' },
    { v: '10', n: 'Octubre' }, { v: '11', n: 'Noviembre' }, { v: '12', n: 'Diciembre' }
  ];

  const LINEAS = [
    { v: '0', n: '-- TODAS LAS LÍNEAS --' },
    { v: '1', n: 'Línea 1' }, { v: '2', n: 'Línea 2' }, { v: '3', n: 'Línea 3' },
    { v: '4', n: 'Línea 4' }, { v: '5', n: 'Línea 5' }, { v: '6', n: 'Línea 6' },
    { v: '7', n: 'Línea 7' }, { v: '8', n: 'Línea 8' }, { v: '9', n: 'Línea 9' },
    { v: '10', n: 'Inactivo' }
  ];

  const inputClasses = "w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none bg-white transition-colors";
  const labelClasses = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1";
  const horizontalLabelClasses = "w-1/3 text-right pr-4 text-xs font-bold text-gray-500 uppercase tracking-wider";

  const filtered = colaboradores.filter(o => {
    let mes = true;
    let linea = true;
    if (filterMonth > 0) {
      mes = parseInt(o.fecha_nacimiento?.split("-")[1]) == filterMonth;
    }
    if (filterLine > 0) {
      linea = o.linea == filterLine;
    }
    return mes && linea;
  });
  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.text("Cumpleaños Colaboradores", 14, 15);

    const tableColumn = ["#", "Área", "Colaborador", "Cumpleaños", "Línea"];
    const tableRows = [];
    let i = 1;
    filtered.forEach(colaborador => {
      const rowData = [
        i,
        colaborador.area?.area,
        colaborador.nombres + " " + colaborador.apellido_paterno + " " + colaborador.apellido_materno,
        colaborador.fecha_nacimiento,
        "Línea " + (colaborador.linea == null || colaborador.linea == "null" ? "--" : colaborador.linea),
      ];
      tableRows.push(rowData);
      i++;
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [31, 41, 55] }
    });

    doc.save("Cumpleaños_export.pdf");
  };
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Datos del Personal</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de datos maestros de trabajadores (SIG)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center">
          <h4 className="font-bold text-gray-800 text-lg flex-1">Colaboradores</h4>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
            <select
              className="p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 min-w-[150px]"
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
            >
              {MESES.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
            </select>
            <select
              className="p-2.5 border border-gray-300 rounded-lg text-sm bg-gray-50 outline-none focus:border-blue-500 min-w-[150px]"
              value={filterLine}
              onChange={e => setFilterLine(e.target.value)}
            >
              {LINEAS.map(l => <option key={l.v} value={l.v}>{l.n}</option>)}
            </select>
            <button
              onClick={exportToPDF}
              className="bg-gray-800 text-white px-5 py-2.5 rounded-lg hover:bg-gray-700 shadow-sm font-medium transition-colors text-sm whitespace-nowrap flex items-center gap-2"
            >
              <i className="glyphicon glyphicon-gift"></i> Descargar Cumpleaños
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col lg:flex-row gap-8">
          {/* Main Form Area */}
          <div className="flex-1">
            <ul className="flex border-b border-gray-200 mb-6">
              <li className="mr-2">
                <button
                  className={`inline-block px-6 py-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'personal' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('personal')}
                >
                  DATOS PERSONALES
                </button>
              </li>
              <li className="mr-2">
                <button
                  className={`inline-block px-6 py-3 border-b-2 font-bold text-sm transition-colors ${activeTab === 'laboral' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
                  onClick={() => setActiveTab('laboral')}
                >
                  DATOS LABORALES
                </button>
              </li>
            </ul>

            {activeTab === 'personal' && (
              <div className="animate-in slide-in-from-left-2 duration-300">
                <h3 className="text-center font-bold text-gray-800 text-xl mb-6 tracking-tight">CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.</h3>
                <h4 className="font-bold text-gray-700 mb-6 border-b pb-2">A. IDENTIFICACIÓN DEL COLABORADOR</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>DNI:</div>
                      <div className="w-2/3">
                        <div className="flex gap-2">
                          <input type="text" className={inputClasses} value={formData.dni} onChange={e => setFormData({ ...formData, dni: e.target.value })} placeholder="DNI" />
                          <label className="flex-shrink-0 cursor-pointer flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors border border-gray-300">
                            <DocumentArrowUpIcon className="w-4 h-4" />
                            <span>Adjuntar</span>
                            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleDniArchivoChange} />
                          </label>
                        </div>
                        {formData.dni_archivo && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-sm text-gray-500 truncate max-w-xs">
                              {formData.dni_archivo instanceof File ? formData.dni_archivo.name : formData.dni_archivo}
                            </span>
                            {!(formData.dni_archivo instanceof File) && (
                              <button
                                onClick={(e) => handleDocumentClick(e, formData.dni_archivo, 'doc-colaboradores')}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                                type="button"
                              >
                                <MagnifyingGlassIcon className="w-4 h-4" />
                                Ver
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Nombres:</div>
                      <div className="w-2/3">
                        <input type="text" className={inputClasses} value={formData.nombres} onChange={e => setFormData({ ...formData, nombres: e.target.value })} placeholder="Nombres" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Apellido Paterno:</div>
                      <div className="w-2/3">
                        <input type="text" className={inputClasses} value={formData.apellido_paterno} onChange={e => setFormData({ ...formData, apellido_paterno: e.target.value })} placeholder="Apellido Paterno" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Apellido Materno:</div>
                      <div className="w-2/3">
                        <input type="text" className={inputClasses} value={formData.apellido_materno} onChange={e => setFormData({ ...formData, apellido_materno: e.target.value })} placeholder="Apellido Materno" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column (Photo) */}
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="w-40 h-40 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200 overflow-hidden shadow-sm">
                      {fotoPreview ? (
                        <img src={fotoPreview} className="w-full h-full object-cover" alt="Foto" onError={(e) => { if (typeof formData.foto === 'string') { handleColaboradorFotoError(e, formData.foto); } }} />
                      ) : (
                        <CameraIcon className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <label className="cursor-pointer text-xs font-bold text-blue-600 hover:underline tracking-wider uppercase">
                      Cargar foto
                      <input type="file" className="hidden" accept="image/*" onChange={handleFotoChange} />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6 pt-6 border-t border-gray-100">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Puesto:</div>
                      <div className="w-2/3">
                        <select className={inputClasses} value={formData.id_cargo} onChange={e => setFormData({ ...formData, id_cargo: e.target.value })}>
                          <option value="0">SELECCIONA...</option>
                          {metadata.puestos.map(p => <option key={p.id} value={p.id}>{p.puesto}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Línea:</div>
                      <div className="w-2/3">
                        <select className={inputClasses} value={formData.linea} onChange={e => setFormData({ ...formData, linea: e.target.value })}>
                          {LINEAS.map(l => l.v !== '0' && <option key={l.v} value={l.v}>{l.n}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>


                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Certificado Médico:</div>
                      <div className="w-2/3">
                        <a target='_blank' className='font-medium text-blue-600 underline hover:no-underline' href="#" onClick={(e) => handleDocumentClick(e, formData.archivo, 'examenes_medicos')}>{formData.archivo}</a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Contrato:</div>
                      <div className="w-2/3">
                        <a target='_blank' className='font-medium text-blue-600 underline hover:no-underline' href="#" onClick={(e) => handleDocumentClick(e, formData.contrato, 'contratos')}>{formData.contrato}</a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Recomendaciones SST:</div>
                      <div className="w-2/3">
                        <a target='_blank' className='font-medium text-blue-600 underline hover:no-underline' href="#" onClick={(e) => handleDocumentClick(e, formData.sst, 'recomendaciones_sst')}>{formData.sst}</a>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className={horizontalLabelClasses}>Lista Verificación de Competencias:</div>
                      <div className="w-2/3">
                        <a target='_blank' className='font-medium text-blue-600 underline hover:no-underline' href="#" onClick={(e) => handleDocumentClick(e, formData.competencias, 'verificacion_competencias')}>{formData.competencias}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'laboral' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-right-2 duration-300">
                {/* Col 1 */}
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Celular</label>
                    <input type="text" className={inputClasses} value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Fec. Nacimiento</label>
                    <input type="date" className={inputClasses} value={formData.fecha_nacimiento} onChange={e => setFormData({ ...formData, fecha_nacimiento: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Lugar de Nacimiento</label>
                    <input type="text" className={inputClasses} value={formData.lugar_nacimiento} onChange={e => setFormData({ ...formData, lugar_nacimiento: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Estado Civil</label>
                    <select className={inputClasses} value={formData.id_estado_civil} onChange={e => setFormData({ ...formData, id_estado_civil: e.target.value })}>
                      <option value="">SELECCIONA...</option>
                      {metadata.estado_civil.map(ec => <option key={ec.id} value={ec.id}>{ec.estado_civil}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Brevette</label>
                    <input type="text" className={inputClasses} value={formData.brevette} onChange={e => setFormData({ ...formData, brevette: e.target.value })} />
                  </div>
                </div>

                {/* Col 2 */}
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Área</label>
                    <select className={inputClasses} value={formData.proceso} onChange={e => setFormData({ ...formData, proceso: e.target.value })}>
                      <option value="">SELECCIONA...</option>
                      {metadata.areas.map(a => <option key={a.id} value={a.id}>{a.area}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Teléf. de Emergencia</label>
                    <input type="text" className={inputClasses} value={formData.telefono_emergencia} onChange={e => setFormData({ ...formData, telefono_emergencia: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Sueldo</label>
                    <input type="text" className={inputClasses} value={formData.sueldo} onChange={e => setFormData({ ...formData, sueldo: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Sist. de Pensiones</label>
                    <select className={inputClasses} value={formData.id_sistema_pension} onChange={e => setFormData({ ...formData, id_sistema_pension: e.target.value, id_entidad_pension: '' })}>
                      <option value="">SELECCIONA...</option>
                      {metadata.sistema_pensiones.map(sp => <option key={sp.id} value={sp.id}>{sp.sistema_pension}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Entidad de Pensiones</label>
                    <select className={inputClasses} value={formData.id_entidad_pension} onChange={e => setFormData({ ...formData, id_entidad_pension: e.target.value })}>
                      <option value="">SELECCIONA...</option>
                      {metadata.afps.filter(a => String(a.id_sistema_pensiones) === String(formData.id_sistema_pension)).map(afp => <option key={afp.id} value={afp.id}>{afp.afp}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Código</label>
                    <input type="text" className={inputClasses} value={formData.codigo} onChange={e => setFormData({ ...formData, codigo: e.target.value })} />
                  </div>
                </div>

                {/* Col 3 */}
                <div className="space-y-4">
                  <div>
                    <label className={labelClasses}>Género</label>
                    <select className={inputClasses} value={formData.genero} onChange={e => setFormData({ ...formData, genero: e.target.value })}>
                      <option value="M">Masculino</option>
                      <option value="F">Femenino</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Estado Laboral</label>
                    <select className={inputClasses} value={formData.estado_laboral} onChange={e => setFormData({ ...formData, estado_laboral: e.target.value })}>
                      <option value="1">Contratado</option>
                      <option value="2">Labora s/Contrato</option>
                      <option value="3">Practicante</option>
                      <option value="4">Contrato Vencido</option>
                      <option value="5">Renuncia</option>
                      <option value="6">Despido</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses}>Fecha Ingreso</label>
                    <input type="date" className={inputClasses} value={formData.fecha_ingreso} onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClasses}>Fecha Salida</label>
                    <input type="date" className={inputClasses} value={formData.fecha_salida} onChange={e => setFormData({ ...formData, fecha_salida: e.target.value })} />
                  </div>
                  <div className="flex gap-6 pt-4 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={formData.asegurado} onChange={e => setFormData({ ...formData, asegurado: e.target.checked })} />
                      <span className="text-sm font-bold text-gray-700">Asegurado</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.checked })} />
                      <span className="text-sm font-bold text-gray-700">Activo</span>
                    </label>
                  </div>
                  <div>
                    <label className={labelClasses}>Correo</label>
                    <input type="email" className={inputClasses} value={formData.correo} onChange={e => setFormData({ ...formData, correo: e.target.value })} />
                  </div>
                </div>

                <div className="md:col-span-3 mt-2">
                  <label className={labelClasses}>Dirección</label>
                  <input type="text" className={inputClasses} value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons (Right Sidebar) */}
          <div className="w-full lg:w-64 flex flex-col gap-3 shrink-0">
            <button onClick={handleSearchClick} className="w-full bg-gray-800 text-white font-medium py-2.5 rounded-lg hover:bg-gray-700 transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
              <MagnifyingGlassIcon className="w-4 h-4" /> Buscar Registro
            </button>
            <div className="flex justify-between gap-3 my-1">
              <button onClick={handlePrev} className="flex-1 bg-gray-100 text-gray-700 font-medium border border-gray-200 p-2.5 rounded-lg hover:bg-gray-200 transition-colors flex justify-center items-center shadow-sm">
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button onClick={handleNext} className="flex-1 bg-gray-100 text-gray-700 font-medium border border-gray-200 p-2.5 rounded-lg hover:bg-gray-200 transition-colors flex justify-center items-center shadow-sm">
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <button onClick={saveRecord} disabled={saving} className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm disabled:opacity-60">
              {saving ? 'Guardando...' : 'Guardar Registro'}
            </button>
            <button onClick={startAdding} className="w-full bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm">
              Agregar Registro
            </button>
            <button onClick={deleteRecord} className="w-full bg-red-500 text-white font-medium py-2.5 rounded-lg hover:bg-red-600 transition-colors shadow-sm text-sm">
              Eliminar Registro
            </button>
            <button className="w-full bg-amber-500 text-white font-medium py-2.5 rounded-lg hover:bg-amber-600 transition-colors shadow-sm text-sm">
              Imprimir Registro
            </button>

            <div className="text-center text-sm font-bold text-gray-400 mt-2">
              {colaboradores.length > 0 ? (isAdding ? `Nuevo de ${colaboradores.length}` : `${currentIndex + 1} / ${colaboradores.length}`) : '0 / 0'}
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-wrap gap-3 justify-center md:justify-start rounded-b-xl">
          <button disabled={!formData.id || isAdding} onClick={() => setShowFamiliares(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Familiares</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowFormacion(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Formación Académica</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowExperiencia(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Experiencia Laboral</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowHabilidades(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Habilidades</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowCapacitaciones(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Capacitaciones</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowVacaciones(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Vacaciones</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowExamenes(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Certificado Medico</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowContratos(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Contrato</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowSst(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Recomendaciones SST</button>
          <button disabled={!formData.id || isAdding} onClick={() => setShowCompetencias(true)} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer">Verificación Competencias</button>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">Buscar Colaborador</h2>
              <button onClick={() => setShowSearchModal(false)} className="text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-200 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelClasses}>Dni:</label>
                <input type="text" className={inputClasses} value={searchDni} onChange={e => setSearchDni(e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>Nombre:</label>
                <input type="text" className={inputClasses} value={searchNombre} onChange={e => setSearchNombre(e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>Apellido:</label>
                <input type="text" className={inputClasses} value={searchApellido} onChange={e => setSearchApellido(e.target.value)} />
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowSearchModal(false)} className="bg-white border border-gray-300 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm hover:bg-gray-100 transition-colors shadow-sm">
                Cancelar
              </button>
              <button onClick={executeSearch} className="bg-blue-600 text-white font-medium px-6 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors shadow-sm">
                Buscar
              </button>
            </div>
          </div>
        </div>
      )}

      {showFamiliares && formData.id && (
        <FamiliaresModal colaborador={formData} onClose={() => setShowFamiliares(false)} />
      )}

      {showFormacion && formData.id && (
        <FormacionModal colaborador={formData} onClose={() => setShowFormacion(false)} />
      )}

      {showExperiencia && formData.id && (
        <ExperienciaLaboralModal colaborador={formData} onClose={() => setShowExperiencia(false)} />
      )}

      {showHabilidades && formData.id && (
        <HabilidadesModal colaborador={formData} onClose={() => setShowHabilidades(false)} />
      )}

      {showCapacitaciones && formData.id && (
        <CapacitacionesModal colaborador={formData} onClose={() => setShowCapacitaciones(false)} />
      )}

      {showVacaciones && formData.id && (
        <VacacionesModal colaborador={formData} onClose={() => setShowVacaciones(false)} />
      )}

      {showContratos && formData.id && (
        <ContratosModal colaborador={formData} onClose={() => setShowContratos(false)} />
      )}

      {showExamenes && formData.id && (
        <ExamenesMedicosModal colaborador={formData} onClose={() => setShowExamenes(false)} />
      )}

      {showSst && formData.id && (
        <RecomendacionesSstModal colaborador={formData} onClose={() => setShowSst(false)} />
      )}

      {showCompetencias && formData.id && (
        <VerificacionCompetenciasModal colaborador={formData} onClose={() => setShowCompetencias(false)} />
      )}
    </div>
  );
}
