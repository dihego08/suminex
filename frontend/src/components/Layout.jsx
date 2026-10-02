import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Package, Users, ShoppingCart, FileText, LayoutDashboard, Truck, ClipboardList } from 'lucide-react';

const Layout = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/productos', icon: <Package size={20} />, label: 'Productos' },
    { path: '/clientes', icon: <Users size={20} />, label: 'Clientes' },
    { path: '/cotizaciones', icon: <FileText size={20} />, label: 'Cotizaciones' },
    { path: '/ordenes', icon: <ClipboardList size={20} />, label: 'Órdenes de Pedido' },
    { path: '/ventas', icon: <ShoppingCart size={20} />, label: 'Ventas' },
    { path: '/guias', icon: <Truck size={20} />, label: 'Guías de Remisión' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-brand-500 tracking-wider">SUMINEX ERP</h2>
        </div>
        <nav className="flex-1 mt-6">
          <ul className="space-y-2 px-4">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    location.pathname === item.path
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/30'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-700 capitalize">
            {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1)}
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold border-2 border-brand-500">
              U
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
