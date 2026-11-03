import { useState, useEffect } from 'react';
import api from '../services/api';
import { openBibliotecaFile } from '../utils/image';
import {
  FolderIcon,
  DocumentIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  ChevronRightIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  XMarkIcon,
  FolderPlusIcon
} from '@heroicons/react/24/outline';

export default function DocumentsView() {
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (search.length > 2) {
      handleSearch();
    } else {
      setSearchResults(null);
      fetchContent();
    }
  }, [currentFolderId, search]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/library?id_padre=${currentFolderId || ''}`);
      setFolders(r.data.folders);
      setFiles(r.data.files);
      setBreadcrumbs(r.data.breadcrumbs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSearch = async () => {
    try {
      const r = await api.get(`/library/search?q=${search}`);
      setSearchResults(r.data);
    } catch (e) { console.error(e); }
  };

  const createFolder = async (e) => {
    e.preventDefault();
    try {
      await api.post('/library/folders', {
        nombre_carpeta: newFolderName,
        id_padre: currentFolderId
      });
      setNewFolderName('');
      setShowFolderModal(false);
      fetchContent();
    } catch (e) { alert('Error al crear carpeta'); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !currentFolderId) {
      if (!currentFolderId) alert('Por favor, selecciona una carpeta para subir el archivo.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('id_carpeta', currentFolderId);

    try {
      await api.post('/library/files', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchContent();
    } catch (e) { alert('Error al subir archivo'); }
    finally { setUploading(false); }
  };

  const deleteItem = async (type, id) => {
    if (!window.confirm('¿Desea eliminar este elemento?')) return;
    try {
      if (type === 'folder') await api.delete(`/library/folders/${id}`);
      else await api.delete(`/library/files/${id}`);
      fetchContent();
    } catch (e) { alert('Error al eliminar'); }
  };

  const openFile = (filename) => openBibliotecaFile(filename);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-700 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Gestión Documentaria
          </h1>
          <p className="text-sm text-gray-500">Biblioteca virtual y archivos del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar archivos..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none w-64 shadow-sm"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowFolderModal(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all bg-white shadow-sm flex items-center gap-2 text-sm font-bold">
            <FolderPlusIcon className="h-5 w-5 text-amber-500" />
            Carpeta
          </button>
          <label className={`p-2 text-white hover:bg-gray-700 rounded-lg bg-gray-800 transition-all shadow-sm cursor-pointer flex items-center gap-2 text-sm font-bold ${!currentFolderId && 'opacity-50 cursor-not-allowed'}`}>
            <ArrowUpTrayIcon className="h-5 w-5" />
            Subir Archivo
            <input type="file" className="hidden" disabled={!currentFolderId || uploading} onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <button onClick={() => setCurrentFolderId(null)} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
          <HomeIcon className="h-4 w-4" />
          Raíz
        </button>
        {breadcrumbs.map(bc => (
          <div key={bc.id} className="flex items-center gap-2">
            <ChevronRightIcon className="h-4 w-4 text-gray-300" />
            <button onClick={() => setCurrentFolderId(bc.id)} className="hover:text-blue-600 transition-colors">
              {bc.name}
            </button>
          </div>
        ))}
      </nav>

      {/* Explorer Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-12 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="col-span-6 md:col-span-8">Nombre</div>
          <div className="col-span-3 md:col-span-2">Fecha</div>
          <div className="col-span-3 md:col-span-2 text-center">Acciones</div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400 font-bold text-xs uppercase">Cargando biblioteca...</p>
            </div>
          ) : searchResults ? (
            <div className="divide-y divide-gray-100">
              <div className="px-6 py-2 bg-blue-50/50 text-[10px] font-bold text-blue-600 uppercase">Resultados de búsqueda: {searchResults.length} encontrados</div>
              {searchResults.map(file => (
                <FileRow key={file.id} item={file} onOpen={() => openFile(file.archivo)} onDelete={() => deleteItem('file', file.id)} />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {folders.length === 0 && files.length === 0 && (
                <div className="flex flex-col items-center justify-center p-20 opacity-30">
                  <FolderIcon className="h-20 w-20 text-gray-300" />
                  <p className="text-sm font-bold text-gray-500 uppercase">Esta carpeta está vacía</p>
                </div>
              )}
              {folders.map(folder => (
                <FolderRow key={folder.id} item={folder} onOpen={() => setCurrentFolderId(folder.id)} onDelete={() => deleteItem('folder', folder.id)} />
              ))}
              {files.map(file => (
                <FileRow key={file.id} item={file} onOpen={() => openFile(file.archivo)} onDelete={() => deleteItem('file', file.id)} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Nueva Carpeta */}
      {showFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900">Crear Nueva Carpeta</h3>
              <button onClick={() => setShowFolderModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={createFolder} className="p-6">
              <label className="block text-xs font-black text-gray-400 uppercase mb-2">Nombre de la Carpeta</label>
              <input
                required
                autoFocus
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                placeholder="Ej: Facturas 2024"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-gray-500 font-bold text-sm">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md">Crear Carpeta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-8 right-8 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right duration-300 border border-gray-700">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Subiendo Archivo</p>
            <p className="text-[10px] text-gray-400">Por favor espere...</p>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderRow({ item, onOpen, onDelete }) {
  return (
    <div onDoubleClick={onOpen} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-amber-50/30 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-amber-400">
      <div className="col-span-6 md:col-span-8 flex items-center gap-3">
        <FolderIcon className="h-8 w-8 text-amber-500 fill-amber-100/50" />
        <div>
          <p className="text-sm font-bold text-gray-800">{item.nombre_carpeta}</p>
          <p className="text-[10px] text-gray-400 font-medium">Directorio Virtual</p>
        </div>
      </div>
      <div className="col-span-3 md:col-span-2 text-xs text-gray-400 font-medium italic">Carpeta</div>
      <div className="col-span-3 md:col-span-2 flex justify-center gap-2">
        <button onClick={onOpen} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <PlusIcon className="h-5 w-5" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function FileRow({ item, onOpen, onDelete }) {
  return (
    <div onDoubleClick={onOpen} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-blue-50/30 transition-colors group cursor-pointer border-l-4 border-transparent hover:border-blue-400">
      <div className="col-span-6 md:col-span-8 flex items-center gap-3">
        <DocumentIcon className="h-8 w-8 text-blue-500 fill-blue-50/50" />
        <div>
          <p className="text-sm font-bold text-gray-800">{item.archivo}</p>
          <p className="text-[10px] text-gray-400 font-medium">Documento de Sistema</p>
        </div>
      </div>
      <div className="col-span-3 md:col-span-2 text-xs text-gray-500 font-mono">{item.fecha_creacion?.split(' ')[0] || 'Desconocida'}</div>
      <div className="col-span-3 md:col-span-2 flex justify-center gap-2">
        <button onClick={onOpen} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <ArrowUpTrayIcon className="h-5 w-5 rotate-180" />
        </button>
        <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
