// Tipos de compra. Solo CATALOGO usa el buscador de productos;
// SUMINISTROS y AGASAJOS se ingresan con descripción manual.
export const TIPOS_COMPRA = [
  { value: 'CATALOGO', label: 'Catálogo de productos', corto: 'Catálogo', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'SUMINISTROS', label: 'Suministros', corto: 'Suministros', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'AGASAJOS', label: 'Agasajos', corto: 'Agasajos', badge: 'bg-pink-50 text-pink-700 border-pink-200' },
];

export const tipoCompraInfo = (value) => TIPOS_COMPRA.find(t => t.value === value) || TIPOS_COMPRA[0];
