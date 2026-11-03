<?php

namespace App\Http\Controllers;

use App\Models\Area;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index()
    {
        return response()->json(Area::all());
    }

    public function store(Request $request)
    {
        $id = $request->input('id');
        $area = Area::updateOrCreate(
            ['id' => $id],
            ['area' => $request->input('area')]
        );

        return response()->json([
            'Result' => 'OK',
            'Message' => 'Área guardada correctamente',
            'Record' => $area
        ]);
    }

    public function show($id)
    {
        return response()->json(Area::find($id));
    }

    public function destroy($id)
    {
        $area = Area::find($id);
        if ($area) {
            $area->delete();
            return response()->json(['Result' => 'OK', 'Message' => 'Área eliminada']);
        }
        return response()->json(['Result' => 'ERROR', 'Message' => 'Área no encontrada'], 404);
    }
}
