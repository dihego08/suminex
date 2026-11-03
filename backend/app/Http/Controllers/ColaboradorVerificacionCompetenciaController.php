<?php

namespace App\Http\Controllers;

use App\Models\VerificacionCompetencia;
use Illuminate\Http\Request;

class ColaboradorVerificacionCompetenciaController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(VerificacionCompetencia::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_inicio' => 'nullable|date',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/verificacion_competencias'), $filename);
            $data['archivo'] = $filename;
        }
        
        $competencia = VerificacionCompetencia::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $competencia]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_inicio' => 'nullable|date',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $competencia = VerificacionCompetencia::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/verificacion_competencias'), $filename);
            $data['archivo'] = $filename;
            
            if ($competencia->archivo && file_exists(public_path('uploads/colaboradores/verificacion_competencias/' . $competencia->archivo))) {
                unlink(public_path('uploads/colaboradores/verificacion_competencias/' . $competencia->archivo));
            }
        }
        
        $competencia->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $competencia]);
    }

    public function destroy($colaborador_id, $id)
    {
        $competencia = VerificacionCompetencia::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($competencia->archivo && file_exists(public_path('uploads/colaboradores/verificacion_competencias/' . $competencia->archivo))) {
            unlink(public_path('uploads/colaboradores/verificacion_competencias/' . $competencia->archivo));
        }
        
        $competencia->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
