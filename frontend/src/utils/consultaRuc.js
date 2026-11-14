const API_CONSULTA = 'https://dbusinessaqp.com/api_ruc/api.php';

/**
 * Consulta un RUC (11 dígitos) o DNI (8 dígitos) y devuelve datos normalizados:
 * { documento, tipo, nombre, direccion }
 * Lanza Error con un mensaje legible si el documento no es válido o no se encuentra.
 */
export async function consultarDocumento(valor) {
  const doc = String(valor || '').trim();
  if (!/^\d{8}$|^\d{11}$/.test(doc)) {
    throw new Error('Ingrese un DNI (8 dígitos) o un RUC (11 dígitos).');
  }
  const param = doc.length === 11 ? 'ruc' : 'dni';

  let obj;
  try {
    const r = await fetch(`${API_CONSULTA}?${param}=${doc}`);
    obj = await r.json();
  } catch {
    throw new Error('No se pudo conectar con el servicio de consulta. Intente nuevamente.');
  }

  if (!obj || obj.error || !obj.nombre) {
    throw new Error((obj && obj.error) || 'Documento no encontrado.');
  }

  const partes = [obj.direccion, obj.distrito, obj.provincia, obj.departamento]
    .map(p => (p || '').toString().trim())
    .filter(Boolean);

  return {
    documento: doc,
    tipo: doc.length === 11 ? 'RUC' : 'DNI',
    nombre: String(obj.nombre).trim(),
    direccion: partes.join(' - '),
  };
}
