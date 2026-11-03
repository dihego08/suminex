<?php

namespace App\Http\Controllers;

use App\Models\Habilidad;
use Illuminate\Http\Request;

class ColaboradorHabilidadController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Habilidad::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $data = $request->validate([
            'elemento' => 'nullable|string|max:100',
            'habilidad' => 'required|string',
            'tipo' => 'nullable|string|max:50',
        ]);
        
        $data['id_colaborador'] = $colaborador_id;
        
        $habilidad = Habilidad::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $habilidad]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $data = $request->validate([
            'elemento' => 'nullable|string|max:100',
            'habilidad' => 'required|string',
            'tipo' => 'nullable|string|max:50',
        ]);
        
        $habilidad = Habilidad::where('id_colaborador', $colaborador_id)->findOrFail($id);
        $habilidad->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $habilidad]);
    }

    public function destroy($colaborador_id, $id)
    {
        $habilidad = Habilidad::where('id_colaborador', $colaborador_id)->findOrFail($id);
        $habilidad->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
