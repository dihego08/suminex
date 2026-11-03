<?php

namespace App\Http\Controllers;

use App\Models\Vacacion;
use Illuminate\Http\Request;

class ColaboradorVacacionController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Vacacion::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_salida' => 'nullable|date',
            'fecha_retorno' => 'nullable|date',
            'dias' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/vacaciones'), $filename);
            $data['archivo'] = $filename;
        }
        
        $vacacion = Vacacion::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $vacacion]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_salida' => 'nullable|date',
            'fecha_retorno' => 'nullable|date',
            'dias' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $vacacion = Vacacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/vacaciones'), $filename);
            $data['archivo'] = $filename;
            
            if ($vacacion->archivo && file_exists(public_path('uploads/colaboradores/vacaciones/' . $vacacion->archivo))) {
                unlink(public_path('uploads/colaboradores/vacaciones/' . $vacacion->archivo));
            }
        }
        
        $vacacion->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $vacacion]);
    }

    public function destroy($colaborador_id, $id)
    {
        $vacacion = Vacacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($vacacion->archivo && file_exists(public_path('uploads/colaboradores/vacaciones/' . $vacacion->archivo))) {
            unlink(public_path('uploads/colaboradores/vacaciones/' . $vacacion->archivo));
        }
        
        $vacacion->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
