<?php

namespace App\Http\Controllers;

use App\Models\RecomendacionSst;
use Illuminate\Http\Request;

class ColaboradorRecomendacionSstController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(RecomendacionSst::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'fecha_recomendacion' => 'nullable|date',
            'fecha_capacitacion' => 'nullable|date',
            'tipo_recomendacion' => 'nullable|string|max:150',
            'referencia_recomendacion' => 'nullable|string|max:200',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/recomendaciones_sst'), $filename);
            $data['archivo'] = $filename;
        }
        
        $sst = RecomendacionSst::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $sst]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'fecha_recomendacion' => 'nullable|date',
            'fecha_capacitacion' => 'nullable|date',
            'tipo_recomendacion' => 'nullable|string|max:150',
            'referencia_recomendacion' => 'nullable|string|max:200',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $sst = RecomendacionSst::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/recomendaciones_sst'), $filename);
            $data['archivo'] = $filename;
            
            if ($sst->archivo && file_exists(public_path('uploads/colaboradores/recomendaciones_sst/' . $sst->archivo))) {
                unlink(public_path('uploads/colaboradores/recomendaciones_sst/' . $sst->archivo));
            }
        }
        
        $sst->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $sst]);
    }

    public function destroy($colaborador_id, $id)
    {
        $sst = RecomendacionSst::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($sst->archivo && file_exists(public_path('uploads/colaboradores/recomendaciones_sst/' . $sst->archivo))) {
            unlink(public_path('uploads/colaboradores/recomendaciones_sst/' . $sst->archivo));
        }
        
        $sst->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
