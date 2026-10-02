import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Productos from './pages/Productos';
import Clientes from './pages/Clientes';
import Cotizaciones from './pages/Cotizaciones';
import NuevaCotizacion from './pages/NuevaCotizacion';
import CotizacionPrint from './pages/CotizacionPrint';
import OrdenesPedido from './pages/OrdenesPedido';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1 className="text-2xl font-bold text-gray-800">Dashboard Principal</h1>} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/cotizaciones" element={<Cotizaciones />} />
          <Route path="/cotizaciones/nueva" element={<NuevaCotizacion />} />
          <Route path="/cotizaciones/:id/imprimir" element={<CotizacionPrint />} />
          <Route path="/ordenes" element={<OrdenesPedido />} />
          {/* Aquí añadiremos Cotizaciones, Órdenes, Ventas, etc. */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
