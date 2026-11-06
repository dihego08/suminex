<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Cargos de los usuarios (tabla cargos). id_referencia es el cliente de referencia (person.id).
 */
class CargoController extends Controller
{
    public function index()
    {
        $cargos = DB::table('cargos as c')
            ->leftJoin('person as p', 'p.id', '=', 'c.id_referencia')
            ->select('c.id', 'c.cargo', 'c.id_referencia', 'p.name as cliente')
            ->orderBy('c.cargo')
            ->get();

        $usuarios = DB::table('user')->where('status', 1)
            ->select('kind', DB::raw('COUNT(*) as total'))
            ->groupBy('kind')
            ->pluck('total', 'kind');

        $cargos->each(function ($c) use ($usuarios) {
            $c->usuarios_count = (int) ($usuarios[$c->id] ?? 0);
        });

        return response()->json($cargos);
    }

    public function clientes()
    {
        return response()->json(DB::table('person')->where('kind', 1)->select('id', 'name')->orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $this->validarCargo($request);

        $id = DB::table('cargos')->insertGetId($this->datos($request));

        return response()->json(['id' => $id, 'message' => 'Cargo creado'], 201);
    }

    public function update(Request $request, $id)
    {
        abort_if(!DB::table('cargos')->where('id', $id)->exists(), 404, 'Cargo no encontrado');
        $this->validarCargo($request, (int) $id);

        DB::table('cargos')->where('id', $id)->update($this->datos($request));

        return response()->json(['message' => 'Cargo actualizado']);
    }

    public function destroy($id)
    {
        abort_if(!DB::table('cargos')->where('id', $id)->exists(), 404, 'Cargo no encontrado');

        // Cuenta también los usuarios inactivos, porque conservan su cargo
        $enUso = DB::table('user')->where('kind', $id)->count();
        if ($enUso > 0) {
            return response()->json(['error' => "No se puede eliminar: {$enUso} usuario(s) tienen este cargo."], 409);
        }

        DB::table('cargos')->where('id', $id)->delete();

        return response()->json(['message' => 'Cargo eliminado']);
    }

    private function validarCargo(Request $request, ?int $id = null): void
    {
        $this->validate($request, [
            'cargo' => ['required', 'string', 'max:50', Rule::unique('cargos', 'cargo')->ignore($id)],
            'id_referencia' => 'nullable|integer|exists:person,id',
        ], [
            'cargo.required' => 'Ingrese el nombre del cargo.',
            'cargo.unique' => 'Ya existe un cargo con ese nombre.',
        ]);
    }

    private function datos(Request $request): array
    {
        return [
            'cargo' => trim($request->cargo),
            'id_referencia' => $request->id_referencia ?: null,
        ];
    }
}
