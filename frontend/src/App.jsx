import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Layout from './components/Layout';
import Productos from './pages/Productos';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<h1 className="text-2xl font-bold text-gray-800">Dashboard Principal</h1>} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/clientes" element={<h1 className="text-2xl font-bold text-gray-800">Maestro de Clientes</h1>} />
          {/* Aquí añadiremos Cotizaciones, Órdenes, Ventas, etc. */}
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
