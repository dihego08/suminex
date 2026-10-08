import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Users, ShoppingCart, FileText, LayoutDashboard, Truck, ClipboardList, Settings, LogOut } from 'lucide-react';
import axios from 'axios';
import { SERVER_URL } from '../config';

const IconMap = {
  LayoutDashboard: <LayoutDashboard size={20} />,
  Package: <Package size={20} />,
  Users: <Users size={20} />,
  FileText: <FileText size={20} />,
  ClipboardList: <ClipboardList size={20} />,
  ShoppingCart: <ShoppingCart size={20} />,
  Truck: <Truck size={20} />,
  Settings: <Settings size={20} />
};

const MenuItem = ({ item, level = 0 }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const isGroup = item.children && item.children.length > 0;
  const isActive = location.pathname === item.path || (isGroup && item.children.some(c => location.pathname === c.path));

  React.useEffect(() => {
    if (isActive && isGroup) setIsOpen(true);
  }, [isActive, isGroup]);

  if (isGroup) {
    return (
      <li className="mb-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
            isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
          style={{ paddingLeft: `${level * 1 + 1}rem` }}
        >
          <div className="flex items-center gap-3">
            <i className={`${item.icon?.startsWith('fa-') ? 'fa ' : ''}${item.icon} w-5 text-center`}></i>
            <span className="font-medium text-sm tracking-wide uppercase">{item.name}</span>
          </div>
          <i className={`fa ${isOpen ? 'fa-angle-up' : 'fa-angle-down'}`}></i>
        </button>
        {isOpen && (
          <ul className="mt-2 space-y-1">
            {item.children.map(child => (
              <MenuItem key={child.id} item={child} level={level + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (!item.path) return null; // En caso un grupo este vacio

  return (
    <li className="mb-1">
      <Link
        to={item.path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
          location.pathname === item.path
            ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
        style={{ paddingLeft: `${level * 1 + 1}rem` }}
      >
        <i className={`${item.icon?.startsWith('fa-') ? 'fa ' : ''}${item.icon} w-5 text-center`}></i>
        <span className="font-medium">{item.name}</span>
      </Link>
    </li>
  );
};

const Layout = ({ children, onLogout, user }) => {
  const location = useLocation();
  const [menuItems, setMenuItems] = React.useState([]);

  React.useEffect(() => {
    const fetchMenu = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${SERVER_URL}/api/menu/navigation`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Build Tree
        const map = {};
        const tree = [];
        res.data.forEach(item => {
          map[item.id] = { ...item, children: [] };
        });
        res.data.forEach(item => {
          if (item.parent_id !== 0 && map[item.parent_id]) {
            map[item.parent_id].children.push(map[item.id]);
          } else {
            tree.push(map[item.id]);
          }
        });
        setMenuItems(tree);

      } catch (e) {
        console.error("Error loading menu", e);
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
          if (onLogout) onLogout();
        }
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 font-sans print:h-auto print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl print:hidden overflow-y-auto">
        <div className="p-6 flex items-center justify-center">
          <img src="/logo-4.png" alt="Suminex ERP" className="h-12 object-contain filter brightness-0 invert" />
        </div>
        <nav className="flex-1 mt-6">
          <ul className="px-4">
            {menuItems.map((item) => (
              <MenuItem key={item.id} item={item} />
            ))}
          </ul>
        </nav>
        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto print:overflow-visible">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between print:hidden">
          <h1 className="text-xl font-semibold text-gray-700 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
          </h1>
          <div className="flex items-center gap-4">
            <span className="font-medium text-gray-600">{user?.name}</span>
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border-2 border-brand-500">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
