<?php

namespace App\Http\Controllers;

use App\Models\Biblioteca;
use App\Models\ContenidoBiblioteca;
use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function index(Request $request)
    {
        $id_padre = $request->query('id_padre');
        
        $folders = Biblioteca::where(function($q) use ($id_padre) {
            if ($id_padre) {
                $q->where('id_padre', $id_padre);
            } else {
                $q->whereNull('id_padre')->orWhere('id_padre', 0)->orWhere('id_padre', '');
            }
        })->get();
        
        $files = [];
        if ($id_padre) {
            $files = ContenidoBiblioteca::where('id_carpeta', $id_padre)->get();
        }

        // Breadcrumbs
        $breadcrumbs = [];
        if ($id_padre) {
            $curr = Biblioteca::find($id_padre);
            while ($curr) {
                array_unshift($breadcrumbs, ['id' => $curr->id, 'name' => $curr->nombre_carpeta]);
                $curr = Biblioteca::find($curr->id_padre);
            }
        }

        return response()->json([
            'folders' => $folders,
            'files' => $files,
            'breadcrumbs' => $breadcrumbs
        ]);
    }

    public function search(Request $request)
    {
        $q = $request->query('q');
        if (!$q) return response()->json([]);
        
        $files = ContenidoBiblioteca::where('archivo', 'like', "%$q%")->orderBy('id', 'desc')->get();
        return response()->json($files);
    }

    public function createFolder(Request $request)
    {
        $folder = Biblioteca::create($request->all());
        return response()->json($folder, 201);
    }

    public function uploadFile(Request $request)
    {
        $request->validate([
            'file' => 'required|file',
            'id_carpeta' => 'required'
        ]);

        $file = $request->file('file');
        $name = $this->quitarTildes($file->getClientOriginalName());
        
        // Los archivos de la biblioteca se guardan en public/uploads/biblioteca
        // We'll use public_path to ensure accessibility
        $path = public_path('uploads/biblioteca');
        if (!file_exists($path)) {
            mkdir($path, 0777, true);
        }
        
        $file->move($path, $name);

        $doc = ContenidoBiblioteca::create([
            'archivo' => $name,
            'id_carpeta' => $request->id_carpeta,
            'fecha_creacion' => now()
        ]);

        return response()->json($doc, 201);
    }

    public function deleteFolder($id)
    {
        Biblioteca::destroy($id);
        return response()->json(null, 204);
    }

    public function deleteFile($id)
    {
        $file = ContenidoBiblioteca::findOrFail($id);
        $path = public_path('uploads/biblioteca/' . $file->archivo);
        if (file_exists($path)) {
            unlink($path);
        }
        $file->delete();
        return response()->json(null, 204);
    }

    private function quitarTildes($cadena)
    {
        $acentos = array(
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U',
            'ñ' => 'n', 'Ñ' => 'N'
        );
        return strtr($cadena, $acentos);
    }
}
