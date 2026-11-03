import { API_URL, SERVER_URL, LEGACY_URL } from '../config';

// Archivos de colaboradores y de la biblioteca. Siguen la convención del sistema
// (igual que productos y marcas): imágenes en /images/<tipo> y documentos en /uploads/<tipo>.
// Los archivos antiguos pueden seguir en el sistema anterior (core/app/view/<carpeta> y BIBLIOTECA/).

// Carpeta lógica -> ruta en la API
const RUTAS_API = {
  'img-colaboradores': 'images/colaboradores',
  'doc-colaboradores': 'uploads/colaboradores/dni',
  biblioteca: 'uploads/biblioteca',
};

// Carpeta lógica -> ruta en el sistema anterior
const RUTAS_LEGACY = {
  'img-colaboradores': 'core/app/view/img-colaboradores',
  'doc-colaboradores': 'core/app/view/dni',
  formacion: 'core/app/view/formacion',
  experiencia: 'core/app/view/experiencia',
  vacaciones: 'core/app/view/vacaciones',
  capacitaciones: 'core/app/view/capacitaciones',
  examenes_medicos: 'core/app/view/certificado_medico',
  contratos: 'core/app/view/contratos',
  recomendaciones_sst: 'core/app/view/sst',
  verificacion_competencias: 'core/app/view/competencias',
  biblioteca: 'BIBLIOTECA',
};

const urlApi = (carpeta, archivo) =>
  `${SERVER_URL}/${RUTAS_API[carpeta] || `uploads/colaboradores/${carpeta}`}/${encodeURIComponent(archivo)}`;

const urlLegacy = (carpeta, archivo) => (LEGACY_URL && RUTAS_LEGACY[carpeta]
  ? `${LEGACY_URL.replace(/\/$/, '')}/${RUTAS_LEGACY[carpeta]}/${encodeURIComponent(archivo)}`
  : '');

// Abre el archivo desde la API y, si ahí no existe, desde el sistema anterior
async function abrirArchivo(carpeta, archivo) {
  if (!archivo) return;
  const nuevo = urlApi(carpeta, archivo);
  const legacy = urlLegacy(carpeta, archivo);
  if (!legacy) {
    window.open(nuevo, '_blank');
    return;
  }
  try {
    const r = await fetch(`${API_URL}/documento-existe/${carpeta}/${encodeURIComponent(archivo)}`);
    const data = await r.json();
    window.open(data.exists ? nuevo : legacy, '_blank');
  } catch {
    window.open(nuevo, '_blank');
  }
}

export function getColaboradorFotoUrl(filename) {
  if (!filename) return '';
  return urlApi('img-colaboradores', filename);
}

// Si la foto no está en la API, intenta una vez con el sistema anterior
export function handleColaboradorFotoError(e, filename) {
  const legacy = urlLegacy('img-colaboradores', filename);
  e.target.onerror = null;
  if (legacy && e.target.src !== legacy) {
    e.target.src = legacy;
  }
}

export function getDocumentUrl(filename, folder) {
  if (!filename) return '';
  return urlApi(folder, filename);
}

export async function handleDocumentClick(e, filename, folder) {
  e.preventDefault();
  await abrirArchivo(folder, filename);
}

// Archivos de la Biblioteca (menú Documentos)
export function openBibliotecaFile(filename) {
  return abrirArchivo('biblioteca', filename);
}
