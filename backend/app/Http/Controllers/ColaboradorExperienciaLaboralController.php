<?php

namespace App\Http\Controllers;

use App\Models\ExperienciaLaboral;
use Illuminate\Http\Request;

class ColaboradorExperienciaLaboralController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(ExperienciaLaboral::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'empresa' => 'required|string|max:150',
            'cargo' => 'required|string|max:150',
            'responsabilidades' => 'nullable|string',
            'fecha_ingreso' => 'nullable|date',
            'fecha_termino' => 'nullable|date',
            'tiempo_servicio' => 'nullable|string|max:50',
            'motivo_cese' => 'nullable|string|max:200',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/experiencia'), $filename);
            $data['archivo'] = $filename;
        }
        
        $experiencia = ExperienciaLaboral::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $experiencia]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'empresa' => 'required|string|max:150',
            'cargo' => 'required|string|max:150',
            'responsabilidades' => 'nullable|string',
            'fecha_ingreso' => 'nullable|date',
            'fecha_termino' => 'nullable|date',
            'tiempo_servicio' => 'nullable|string|max:50',
            'motivo_cese' => 'nullable|string|max:200',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $experiencia = ExperienciaLaboral::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/experiencia'), $filename);
            $data['archivo'] = $filename;
            
            if ($experiencia->archivo && file_exists(public_path('uploads/colaboradores/experiencia/' . $experiencia->archivo))) {
                unlink(public_path('uploads/colaboradores/experiencia/' . $experiencia->archivo));
            }
        }
        
        $experiencia->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $experiencia]);
    }

    public function destroy($colaborador_id, $id)
    {
        $experiencia = ExperienciaLaboral::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($experiencia->archivo && file_exists(public_path('uploads/colaboradores/experiencia/' . $experiencia->archivo))) {
            unlink(public_path('uploads/colaboradores/experiencia/' . $experiencia->archivo));
        }
        
        $experiencia->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
