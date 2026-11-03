<?php

namespace App\Http\Controllers;

use App\Models\Puesto;
use Illuminate\Http\Request;

class PuestoController extends Controller
{
    public function index()
    {
        return response()->json(Puesto::with('area')->get());
    }

    public function store(Request $request)
    {
        $id = $request->input('id');
        $puesto = Puesto::updateOrCreate(
            ['id' => $id],
            [
                'id_area' => $request->input('id_area'),
                'puesto' => $request->input('puesto')
            ]
        );

        return response()->json([
            'Result' => 'OK',
            'Message' => 'Puesto guardado correctamente',
            'Record' => $puesto
        ]);
    }

    public function show($id)
    {
        return response()->json(Puesto::with('area')->find($id));
    }

    public function destroy($id)
    {
        $puesto = Puesto::find($id);
        if ($puesto) {
            $puesto->delete();
            return response()->json(['Result' => 'OK', 'Message' => 'Puesto eliminado']);
        }
        return response()->json(['Result' => 'ERROR', 'Message' => 'Puesto no encontrado'], 404);
    }
}
