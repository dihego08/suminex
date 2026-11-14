import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../config';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const COLORES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#a855f7'];

const money = (n) => 'S/. ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Redondea el máximo hacia arriba a un valor "bonito" para el eje Y
const niceMax = (max) => {
  if (max <= 0) return 1000;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / pow) * pow;
};

export default function Dashboard() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [anios, setAnios] = useState([]);
  const [meses, setMeses] = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios.get(`${SERVER_URL}/api/dashboard/ventas-por-mes`, { params: { anio } })
      .then(r => {
        setMeses(r.data.meses || Array(12).fill(0));
        setAnios(r.data.anios || []);
      })
      .catch(() => setMeses(Array(12).fill(0)))
      .finally(() => setLoading(false));
  }, [anio]);

  const opcionesAnio = Array.from(new Set([...anios, anio])).sort((a, b) => b - a);
  const total = meses.reduce((a, b) => a + b, 0);
  const max = niceMax(Math.max(...meses));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => max * f);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Principal</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Total de ventas por mes</h2>
            <p className="text-sm text-gray-500">Total {anio}: <span className="font-bold text-gray-800">{money(total)}</span> (excluye anuladas)</p>
          </div>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className="p-2 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:border-blue-500"
          >
            {opcionesAnio.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        <div className={`flex ${loading ? 'opacity-50' : ''}`}>
          {/* Eje Y */}
          <div className="relative w-20 h-72 shrink-0 text-[11px] text-gray-500">
            {ticks.map((t, i) => (
              <span key={i} className="absolute right-2 -translate-y-1/2" style={{ bottom: `${(i / 4) * 100}%` }}>
                {money(t).replace('.00', '')}
              </span>
            ))}
          </div>

          {/* Área del gráfico */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            <div className="min-w-[560px]">
              <div className="relative h-72 border-l border-b border-gray-300">
                {ticks.map((_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-gray-100" style={{ bottom: `${(i / 4) * 100}%` }} />
                ))}
                <div className="absolute inset-0 flex items-end">
                  {meses.map((v, i) => (
                    <div
                      key={i}
                      className="relative flex-1 h-full flex items-end justify-center"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover(null)}
                    >
                      <div
                        className="w-3/5 rounded-t transition-all"
                        style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? 2 : 0, background: COLORES[i], opacity: hover === null || hover === i ? 1 : 0.55 }}
                      />
                      {hover === i && (
                        <div
                          className="absolute z-10 bg-gray-800 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg whitespace-nowrap pointer-events-none"
                          style={{ bottom: `calc(${(v / max) * 100}% + 8px)` }}
                        >
                          <div className="font-bold">{MESES[i]}</div>
                          <div>{money(v)}</div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex">
                {MESES.map(m => (
                  <div key={m} className="flex-1 text-center text-[11px] text-gray-500 pt-1.5 truncate">{m}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
