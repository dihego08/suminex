<?php

namespace App\Http\Controllers;

use App\Models\TipoContrato;
use Illuminate\Http\Request;

class TipoContratoController extends Controller
{
    public function index()
    {
        return response()->json(TipoContrato::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'tipo_contrato' => 'required|string|max:50',
        ]);

        $tipo = TipoContrato::create($validated);
        return response()->json($tipo, 201);
    }

    public function show($id)
    {
        return response()->json(TipoContrato::find($id));
    }

    public function update(Request $request, $id)
    {
        $cargo = TipoContrato::findOrFail($id);
        $validated = $request->validate([
            'tipo_contrato' => 'string|max:255'
        ]);

        $cargo->update($validated);
        return response()->json($cargo);
    }

    public function destroy($id)
    {
        $cargo = TipoContrato::findOrFail($id);
        $cargo->delete();
        return response()->json(null, 204);
    }
}
