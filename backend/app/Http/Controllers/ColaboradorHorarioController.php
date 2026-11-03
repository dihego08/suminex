<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ColaboradorHorario;
use Carbon\Carbon;

class ColaboradorHorarioController extends Controller
{
    public function index()
    {
        return response()->json(['message' => 'Hola desde ColaboradorHorarioController']);
    }
    public function lista()
    {
        return response()->json(ColaboradorHorario::with(['colaborador', 'horario'])->get());
    }

    public function insertar(Request $request)
    {
        $id = ColaboradorHorario::create([
            'id_colaborador' => $request->input('id_colaborador'),
            'id_horario' => $request->input('id_horario'),
            'fecha_inicio' => $request->input('fecha_inicio'),
            'fecha_fin' => $request->input('fecha_fin'),
            'estado' => $request->input('estado'),
            'id_usuario_creacion' => $request->input('id_usuario_creacion'),
            'fecha_creacion' => Carbon::now(),
        ]);
        return response()->json([
            'status' => 'success',
            'message' => 'ColaboradorHorario creado correctamente',
            'id' => $id
        ], 200);
    }

    public function editar($id)
    {
        return response()->json(ColaboradorHorario::find($id));
    }
    public function eliminar($id)
    {
        $colaboradorHorario = ColaboradorHorario::find($id);

        if (!$colaboradorHorario) {
            return response()->json([
                'status' => 'error',
                'message' => 'ColaboradorHorario no encontrada o no se pudo eliminar'
            ], 404);
        }

        $colaboradorHorario->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'ColaboradorHorario eliminado correctamente'
        ], 200);
    }
    public function editarEstado(Request $request, $id)
    {
        $colaboradorHorario = ColaboradorHorario::find($id);

        if (!$colaboradorHorario) {
            return response()->json([
                'status' => 'error',
                'message' => 'ColaboradorHorario no encontrada o no se pudo editar'
            ], 404);
        }
        $colaboradorHorario->update([
            'estado' => $request->input('estado'),
        ]);
        return response()->json([
            'status' => 'success',
            'message' => 'ColaboradorHorario actualizado correctamente',
            'id' => $id
        ], 200);
    }
    public function actualizar(Request $request, $id)
    {
        ColaboradorHorario::where('id', $id)
            ->update([
                'id_colaborador' => $request->input('id_colaborador'),
                'id_horario' => $request->input('id_horario'),
                'fecha_inicio' => date("Y-m-d", strtotime($request->input('fecha_inicio'))),
                'fecha_fin' => date("Y-m-d", strtotime($request->input('fecha_fin'))),
                'estado' => $request->input('estado'),
                'id_usuario_modificacion' => $request->input('id_usuario_modificacion'),
                'fecha_modificacion' => Carbon::now(),
            ]);
        return response()->json([
            'status' => 'success',
            'message' => 'ColaboradorHorario actualizada correctamente',
            'id' => $id
        ], 200);
    }
}
