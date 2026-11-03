<?php

namespace App\Http\Controllers;

use App\Models\Familiar;
use Illuminate\Http\Request;

class ColaboradorFamiliarController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Familiar::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $data = $request->validate([
            'dni' => 'required|string|max:20',
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'fecha_nacimiento' => 'nullable|date',
            'lugar_nacimiento' => 'nullable|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'parentesco' => 'required|string|max:50',
        ]);
        
        $data['id_colaborador'] = $colaborador_id;
        
        $familiar = Familiar::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $familiar]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $data = $request->validate([
            'dni' => 'required|string|max:20',
            'nombre' => 'required|string|max:100',
            'apellidos' => 'required|string|max:100',
            'fecha_nacimiento' => 'nullable|date',
            'lugar_nacimiento' => 'nullable|string|max:150',
            'telefono' => 'nullable|string|max:20',
            'parentesco' => 'required|string|max:50',
        ]);
        
        $familiar = Familiar::where('id_colaborador', $colaborador_id)->findOrFail($id);
        $familiar->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $familiar]);
    }

    public function destroy($colaborador_id, $id)
    {
        $familiar = Familiar::where('id_colaborador', $colaborador_id)->findOrFail($id);
        $familiar->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
