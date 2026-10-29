// Fecha local (YYYY-MM-DD) del navegador.
// No usar new Date().toISOString(): devuelve la fecha en UTC y en Perú (UTC-5),
// a partir de las 7 p.m., ya marca el día siguiente.
export const fechaLocal = (diasAdelante = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + diasAdelante);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};
