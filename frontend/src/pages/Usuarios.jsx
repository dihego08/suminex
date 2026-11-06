import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Edit, UserCog, X, Ban, CheckCircle } from 'lucide-react';
import api from '../services/api';

const emptyForm = { name: '', lastname: '', username: '', email: '', celular: '', kind: '', password: '', password_confirmation: '' };

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none text-sm';
const labelClass = 'block text-xs font-semibold text-gray-700 uppercase mb-1';

const mensajeError = (err, porDefecto) => {
  const data = err.response?.data;
  return data?.errors ? Object.values(data.errors).flat().join('\n') : (data?.error || data?.message || porDefecto);
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargos, setCargos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const usuarioActualId = (() => {
    try { return JSON.parse(localStorage.getItem('user'))?.id; } catch { return null; }
  })();

  useEffect(() => {
    fetchUsuarios();
    api.get('/usuarios/cargos').then(res => setCargos(res.data || [])).catch(() => {});
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      setErrorCarga('');
      const res = await api.get('/usuarios');
      setUsuarios(res.data || []);
    } catch (err) {
      setErrorCarga(mensajeError(err, 'No se pudieron cargar los usuarios.'));
    } finally {
      setLoading(false);
    }
  };

  const set = (campo, valor) => setFormData(f => ({ ...f, [campo]: valor }));

  const abrirModal = (usuario = null) => {
    setEditingId(usuario ? usuario.id : null);
    setFormData(usuario ? {
      ...emptyForm,
      name: usuario.name || '',
      lastname: usuario.lastname || '',
      username: usuario.username || '',
      email: usuario.email || '',
      celular: usuario.celular || '',
      kind: usuario.kind || '',
    } : emptyForm);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, formData);
      } else {
        await api.post('/usuarios', formData);
      }
      setModalOpen(false);
      fetchUsuarios();
    } catch (err) {
      alert('Error al guardar el usuario:\n' + mensajeError(err, err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const cambiarEstado = async (usuario) => {
    const activar = usuario.status != 1;
    const texto = activar
      ? `¿Activar al usuario "${usuario.username}"?`
      : `¿Desactivar al usuario "${usuario.username}"?\nNo podrá iniciar sesión y se cerrará su sesión actual.`;
    if (!window.confirm(texto)) return;
    try {
      await api.post(`/usuarios/${usuario.id}/estado`, { status: activar ? 1 : 0 });
      fetchUsuarios();
    } catch (err) {
      alert(mensajeError(err, 'No se pudo cambiar el estado del usuario.'));
    }
  };

  const termino = searchTerm.toLowerCase();
  const filtrados = usuarios.filter(u =>
    [u.name, u.lastname, u.username, u.email, u.cargo].some(v => (v || '').toLowerCase().includes(termino))
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <UserCog className="text-brand-600" /> Usuarios
          </h1>
          <p className="text-sm text-gray-500">
            Usuarios que pueden ingresar al sistema. Sus menús se asignan en <Link to="/permissions" className="text-blue-600 hover:underline">Accesos</Link>.
          </p>
        </div>
        <button onClick={() => abrirModal()} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl font-medium shadow-sm transition-all">
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, usuario, correo o cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-transparent outline-none text-gray-700 placeholder-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Usuario</th>
                <th className="py-3 px-4">Correo</th>
                <th className="py-3 px-4">Celular</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-400">Cargando usuarios...</td></tr>
              ) : errorCarga ? (
                <tr><td colSpan="7" className="py-8 text-center text-red-600">{errorCarga}</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-400">No se encontraron usuarios.</td></tr>
              ) : filtrados.map((u) => (
                <tr key={u.id} className={`hover:bg-gray-50/50 transition-colors ${u.status != 1 ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{`${u.name} ${u.lastname || ''}`.trim()}</td>
                  <td className="py-3 px-4 text-gray-700">{u.username}</td>
                  <td className="py-3 px-4 text-gray-500">{u.email || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{u.celular || '-'}</td>
                  <td className="py-3 px-4 text-gray-700">{u.cargo || '-'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border ${u.status == 1 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {u.status == 1 ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirModal(u)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-brand-600 transition-colors" title="Editar">
                        <Edit size={16} />
                      </button>
                      {u.id !== usuarioActualId && (
                        <button
                          onClick={() => cambiarEstado(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.status == 1 ? 'text-gray-400 hover:bg-red-50 hover:text-red-600' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}
                          title={u.status == 1 ? 'Desactivar' : 'Activar'}
                        >
                          {u.status == 1 ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-gray-100 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Nombres *</label>
                  <input required maxLength={50} className={inputClass} value={formData.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Apellidos</label>
                  <input maxLength={50} className={inputClass} value={formData.lastname} onChange={e => set('lastname', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Usuario *</label>
                  <input required maxLength={50} autoComplete="off" className={inputClass} value={formData.username} onChange={e => set('username', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Cargo *</label>
                  <select required className={`${inputClass} bg-white`} value={formData.kind} onChange={e => set('kind', e.target.value)}>
                    <option value="">Seleccione...</option>
                    {cargos.map(c => <option key={c.id} value={c.id}>{c.cargo}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Correo</label>
                  <input maxLength={255} className={inputClass} value={formData.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Celular</label>
                  <input maxLength={15} className={inputClass} value={formData.celular} onChange={e => set('celular', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Contraseña {editingId ? '' : '*'}</label>
                  <input type="password" required={!editingId} minLength={8} maxLength={72} autoComplete="new-password" className={inputClass} value={formData.password} onChange={e => set('password', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Repetir contraseña {editingId ? '' : '*'}</label>
                  <input type="password" required={!editingId || !!formData.password} autoComplete="new-password" className={inputClass} value={formData.password_confirmation} onChange={e => set('password_confirmation', e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                {editingId ? 'Deje la contraseña vacía para no cambiarla. ' : ''}Mínimo 8 caracteres.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors disabled:opacity-50">
                  {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuarios;
