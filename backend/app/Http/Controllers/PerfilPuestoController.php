<?php

namespace App\Http\Controllers;

use App\Models\PerfilPuesto;
use App\Models\Puesto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PerfilPuestoController extends Controller
{
    public function getPuestos()
    {
        $puestos = Puesto::with('area')->get();
        return response()->json($puestos);
    }

    public function show($id)
    {
        $perfil = PerfilPuesto::where('id_puesto', $id)
            ->with(['puesto.area'])
            ->first();

        if (!$perfil) {
            $puesto = Puesto::with('area')->find($id);
            return response()->json([
                'puesto' => $puesto,
                'exists' => false
            ]);
        }

        $perfil->exists = true;
        return response()->json($perfil);
    }

    public function store(Request $request)
    {
        $idPuesto = $request->input('id_puesto');
        $fillable = (new PerfilPuesto())->getFillable();
        $data = $request->only($fillable);

        $perfil = PerfilPuesto::updateOrCreate(
            ['id_puesto' => $idPuesto],
            $data
        );

        return response()->json([
            'Result' => 'OK',
            'Message' => 'Perfil guardado correctamente',
            'Record' => $perfil
        ]);
    }
}
