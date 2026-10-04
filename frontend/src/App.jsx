import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Cotizaciones from './pages/Cotizaciones';
import NuevaCotizacion from './pages/NuevaCotizacion';
import CotizacionPrint from './pages/CotizacionPrint';
import OrdenesPedido from './pages/OrdenesPedido';
import NuevaOrden from './pages/NuevaOrden';
import Ventas from './pages/Ventas';
import NuevaVenta from './pages/NuevaVenta';
import VentaPrint from './pages/VentaPrint';
import Login from './pages/Login';
import Permissions from './pages/Permissions';
import PreciosCliente from './pages/PreciosCliente';

function App() {
  const [token, setToken] = React.useState(localStorage.getItem('token'));
  const [user, setUser] = React.useState(JSON.parse(localStorage.getItem('user')) || null);

  const handleLogin = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout} user={user}>
        <Routes>
          <Route path="/" element={<h1 className="text-2xl font-bold text-gray-800">Dashboard Principal</h1>} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/editar/:id" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/:id/imprimir" element={<CotizacionPrint />} />
          <Route path="/ordenes" element={<OrdenesPedido />} />
          <Route path="/ordenes/nueva" element={<NuevaOrden />} />
          <Route path="/ordenes/editar/:id" element={<NuevaOrden />} />
          <Route path="/ventas" element={<Ventas />} />
          <Route path="/ventas/nueva" element={<NuevaVenta />} />
          <Route path="/ventas/editar/:id" element={<NuevaVenta />} />
          <Route path="/ventas/:id/imprimir" element={<VentaPrint />} />
          <Route path="/permissions" element={<Permissions />} />
          <Route path="/precios-cliente" element={<PreciosCliente />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
