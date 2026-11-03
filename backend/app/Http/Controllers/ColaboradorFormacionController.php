<?php

namespace App\Http\Controllers;

use App\Models\Formacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ColaboradorFormacionController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Formacion::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'formacion' => 'required|string|max:255',
            'lugar' => 'nullable|string|max:255',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = [
            'formacion' => $request->formacion,
            'lugar' => $request->lugar,
            'id_colaborador' => $colaborador_id
        ];
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/formacion'), $filename);
            $data['archivo'] = $filename;
        }
        
        $formacion = Formacion::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $formacion]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'formacion' => 'required|string|max:255',
            'lugar' => 'nullable|string|max:255',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $formacion = Formacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = [
            'formacion' => $request->formacion,
            'lugar' => $request->lugar,
        ];
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/formacion'), $filename);
            $data['archivo'] = $filename;
            
            // Delete old file if exists
            if ($formacion->archivo && file_exists(public_path('uploads/colaboradores/formacion/' . $formacion->archivo))) {
                unlink(public_path('uploads/colaboradores/formacion/' . $formacion->archivo));
            }
        }
        
        $formacion->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $formacion]);
    }

    public function destroy($colaborador_id, $id)
    {
        $formacion = Formacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($formacion->archivo && file_exists(public_path('uploads/colaboradores/formacion/' . $formacion->archivo))) {
            unlink(public_path('uploads/colaboradores/formacion/' . $formacion->archivo));
        }
        
        $formacion->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
