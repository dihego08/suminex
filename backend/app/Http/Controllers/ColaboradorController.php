<?php

namespace App\Http\Controllers;

use App\Models\Colaborador;
use App\Models\Area;
use App\Models\Puesto;
use App\Models\ExamenMedico;
use App\Models\Contrato;
use App\Models\RecomendacionSst;
use App\Models\VerificacionCompetencia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ColaboradorController extends Controller
{
    public function index(Request $request)
    {
        //$query = Colaborador::with(['area', 'puesto']);
        /*$query = Colaborador::with([
            'area',
            'puesto',
            'ultimoExamenMedico:id, id_colaborador,archivo',
            'ultimoContrato:id, id_colaborador,archivo',
            'ultimaRecomendacionSst:id, id_colaborador,archivo',
            'ultimaVerificacionCompetencias:id, id_colaborador,archivo'
        ]);*/
        $query = Colaborador::query()
            ->with(['area', 'puesto'])
            ->select('colaboradores.*')
            ->selectSub(
                ExamenMedico::select('archivo')
                    ->whereColumn('id_colaborador', 'colaboradores.id')
                    ->latest('id')
                    ->limit(1),
                'certificado_medico'
            )
            ->selectSub(
                Contrato::select('archivo')
                    ->whereColumn('id_colaborador', 'colaboradores.id')
                    ->latest('id')
                    ->limit(1),
                'contrato'
            )
            ->selectSub(
                RecomendacionSst::select('archivo')
                    ->whereColumn('id_colaborador', 'colaboradores.id')
                    ->latest('id')
                    ->limit(1),
                'recomendacion_sst'
            )
            ->selectSub(
                VerificacionCompetencia::select('archivo')
                    ->whereColumn('id_colaborador', 'colaboradores.id')
                    ->latest('id')
                    ->limit(1),
                'verificacion_competencias'
            );

        if ($request->has('mes_cumpleanos') && $request->mes_cumpleanos != 0) {
            $query->whereMonth('fecha_nacimiento', $request->mes_cumpleanos);
        }

        if ($request->has('linea') && $request->linea != 0) {
            $query->where('linea', $request->linea);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('dni', 'like', "%$search%")
                    ->orWhere('nombres', 'like', "%$search%")
                    ->orWhere('apellido_paterno', 'like', "%$search%")
                    ->orWhere('apellido_materno', 'like', "%$search%");
            });
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $id = $request->input('id');

        $data = $request->all();

        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . $file->getClientOriginalName();
            $destinationPath = public_path('images/colaboradores');
            $file->move($destinationPath, $filename);
            $data['foto'] = $filename;
        }

        if ($request->hasFile('dni_archivo')) {
            $file = $request->file('dni_archivo');
            $filename = time() . '_dni_' . $file->getClientOriginalName();
            $destinationPath = public_path('uploads/colaboradores/dni');
            $file->move($destinationPath, $filename);
            $data['dni_archivo'] = $filename;
        }

        // Handle checkboxes/boolean
        $data['asegurado'] = $request->boolean('asegurado') ? 1 : 0;
        $data['estado'] = $request->boolean('estado') ? 1 : 0;

        $colaborador = Colaborador::updateOrCreate(
            ['id' => $id],
            $data
        );

        return response()->json([
            'Result' => 'OK',
            'Message' => 'Colaborador guardado correctamente',
            'Record' => $colaborador
        ]);
    }

    public function show($id)
    {
        return response()->json(Colaborador::with(['area', 'puesto'])->find($id));
    }

    public function destroy($id)
    {
        $colaborador = Colaborador::find($id);
        if ($colaborador) {
            $colaborador->delete();
            return response()->json(['Result' => 'OK', 'Message' => 'Colaborador eliminado']);
        }
        return response()->json(['Result' => 'ERROR', 'Message' => 'Colaborador no encontrado'], 404);
    }

    public function getMetadata()
    {
        return response()->json([
            'areas' => Area::all(),
            'puestos' => Puesto::all(),
            'estado_civil' => DB::table('estado_civil')->get(),
            'sistema_pensiones' => DB::table('sistema_pensiones')->get(),
            'afps' => DB::table('afps')->get()
        ]);
    }
}
