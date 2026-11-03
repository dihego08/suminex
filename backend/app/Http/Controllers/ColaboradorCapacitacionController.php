<?php

namespace App\Http\Controllers;

use App\Models\Capacitacion;
use Illuminate\Http\Request;

class ColaboradorCapacitacionController extends Controller
{
    public function index($colaborador_id)
    {
        return response()->json(Capacitacion::where('id_colaborador', $colaborador_id)->get());
    }

    public function store(Request $request, $colaborador_id)
    {
        $request->validate([
            'curso' => 'required|string|max:200',
            'horas' => 'nullable|string|max:50',
            'fecha' => 'nullable|date',
            'capacitador' => 'nullable|string|max:150',
            'lugar' => 'nullable|string|max:150',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);

        $data = $request->except(['archivo']);
        $data['id_colaborador'] = $colaborador_id;
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/capacitaciones'), $filename);
            $data['archivo'] = $filename;
        }
        
        $capacitacion = Capacitacion::create($data);
        return response()->json(['Result' => 'OK', 'Record' => $capacitacion]);
    }

    public function update(Request $request, $colaborador_id, $id)
    {
        $request->validate([
            'curso' => 'required|string|max:200',
            'horas' => 'nullable|string|max:50',
            'fecha' => 'nullable|date',
            'capacitador' => 'nullable|string|max:150',
            'lugar' => 'nullable|string|max:150',
            'archivo' => 'nullable|file|mimes:pdf,jpg,jpeg,png|max:5120'
        ]);
        
        $capacitacion = Capacitacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        $data = $request->except(['archivo']);
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/colaboradores/capacitaciones'), $filename);
            $data['archivo'] = $filename;
            
            if ($capacitacion->archivo && file_exists(public_path('uploads/colaboradores/capacitaciones/' . $capacitacion->archivo))) {
                unlink(public_path('uploads/colaboradores/capacitaciones/' . $capacitacion->archivo));
            }
        }
        
        $capacitacion->update($data);
        
        return response()->json(['Result' => 'OK', 'Record' => $capacitacion]);
    }

    public function destroy($colaborador_id, $id)
    {
        $capacitacion = Capacitacion::where('id_colaborador', $colaborador_id)->findOrFail($id);
        
        if ($capacitacion->archivo && file_exists(public_path('uploads/colaboradores/capacitaciones/' . $capacitacion->archivo))) {
            unlink(public_path('uploads/colaboradores/capacitaciones/' . $capacitacion->archivo));
        }
        
        $capacitacion->delete();
        
        return response()->json(['Result' => 'OK']);
    }
}
