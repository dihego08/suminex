import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';
import { Save } from 'lucide-react';

const Permissions = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [menus, setMenus] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMenus();
    } else {
      setMenus([]);
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${SERVER_URL}/api/permissions/users`, { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const fetchMenus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${SERVER_URL}/api/permissions/menus/${selectedUser}`, { headers: { Authorization: `Bearer ${token}` } });
      setMenus(res.data);
    } catch (e) {
      console.log(e);
    }
  };

  const handleToggle = (id) => {
    setMenus(menus.map(m => m.id === id ? { ...m, checked: !m.checked } : m));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const menuIds = menus.filter(m => m.checked).map(m => m.id);
      await axios.post(`${SERVER_URL}/api/permissions/save`, { idUsuario: selectedUser, menuIds }, { headers: { Authorization: `Bearer ${token}` } });
      alert('Permisos guardados correctamente');
    } catch (e) {
      alert('Error al guardar permisos');
    }
    setSaving(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Permisos de Menú</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <label className="block text-gray-700 font-semibold mb-2">Seleccionar Usuario</label>
        <select 
          className="w-full md:w-1/3 border border-gray-300 rounded-lg p-3"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">-- Seleccione un usuario --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name} ({u.username})</option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Menús Disponibles</h2>
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            {menus.filter(m => m.parent_id == 0).map(parent => (
              <div key={parent.id} className="mb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <input 
                    type="checkbox" 
                    id={`menu-${parent.id}`}
                    checked={parent.checked}
                    onChange={() => handleToggle(parent.id)}
                    className="w-5 h-5 text-brand-600 rounded"
                  />
                  <label htmlFor={`menu-${parent.id}`} className="cursor-pointer font-bold text-gray-900 uppercase tracking-tight">
                    <i className={`${parent.icon} mr-2`}></i> {parent.name}
                  </label>
                </div>
                <div className="pl-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {menus.filter(m => m.parent_id == parent.id).map(child => (
                    <div key={child.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`menu-${child.id}`}
                        checked={child.checked}
                        onChange={() => handleToggle(child.id)}
                        className="w-4 h-4 text-brand-500 rounded"
                      />
                      <label htmlFor={`menu-${child.id}`} className="cursor-pointer text-gray-700 text-sm">
                        <i className={`${child.icon} mr-1`}></i> {child.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            <Save size={20} />
            {saving ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Permissions;
