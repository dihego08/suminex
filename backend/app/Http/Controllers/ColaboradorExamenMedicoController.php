<?php

namespace App\Http\Controllers;

use App\Models\ExamenMedico;
use Illuminate\Http\Request;

class ColaboradorExamenMedicoController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(ExamenMedico::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha' => 'nullable|date',
            'id_tipo_examen' => 'nullable|integer',
            'id_aptitud' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/examenes_medicos'), $filename);
            $data['archivo'] = $filename;
        }
        
        $examen = ExamenMedico::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $examen]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha' => 'nullable|date',
            'id_tipo_examen' => 'nullable|integer',
            'id_aptitud' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $examen = ExamenMedico::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/examenes_medicos'), $filename);
            $data['archivo'] = $filename;
            
            if ($examen->archivo && file_exists(public_path('uploads/colaboradores/examenes_medicos/' . $examen->archivo))) {
                unlink(public_path('uploads/colaboradores/examenes_medicos/' . $examen->archivo));
            }
        }
        
        $examen->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $examen]);
    }

    public function destroy($colaborador_id, $id)
    {
        $examen = ExamenMedico::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($examen->archivo && file_exists(public_path('uploads/colaboradores/examenes_medicos/' . $examen->archivo))) {
            unlink(public_path('uploads/colaboradores/examenes_medicos/' . $examen->archivo));
        }
        
        $examen->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
