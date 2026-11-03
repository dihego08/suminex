<?php

namespace App\Http\Controllers;

use App\Models\Contrato;
use Illuminate\Http\Request;

class ColaboradorContratoController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Contrato::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'id_tipo_contrato' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/contratos'), $filename);
            $data['archivo'] = $filename;
        }
        
        $contrato = Contrato::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $contrato]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'periodo' => 'nullable|string|max:100',
            'fecha_inicio' => 'nullable|date',
            'fecha_fin' => 'nullable|date',
            'id_tipo_contrato' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $contrato = Contrato::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/contratos'), $filename);
            $data['archivo'] = $filename;
            
            if ($contrato->archivo && file_exists(public_path('uploads/colaboradores/contratos/' . $contrato->archivo))) {
                unlink(public_path('uploads/colaboradores/contratos/' . $contrato->archivo));
            }
        }
        
        $contrato->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $contrato]);
    }

    public function destroy($colaborador_id, $id)
    {
        $contrato = Contrato::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($contrato->archivo && file_exists(public_path('uploads/colaboradores/contratos/' . $contrato->archivo))) {
            unlink(public_path('uploads/colaboradores/contratos/' . $contrato->archivo));
        }
        
        $contrato->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
