<?php

namespace App\Http\Controllers;

use App\Services\CodigoProductoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class CategoriaController extends Controller
{
    public function index()
    {
        $categorias = DB::table('categorias')->orderBy('categoria')->get();

        $conteo = DB::table('productos')
            ->select('id_categoria', DB::raw('COUNT(*) as total'))
            ->whereNotNull('id_categoria')
            ->where('estado', 1)
            ->groupBy('id_categoria')
            ->pluck('total', 'id_categoria');

        $categorias->each(function ($c) use ($conteo) {
            $c->prefijo = CodigoProductoService::prefijoCategoria((string) $c->categoria);
            $c->productos_count = (int) ($conteo[$c->id] ?? 0);
        });

        return response()->json($categorias);
    }

    public function store(Request $request)
    {
        $this->validate($request, ['categoria' => $this->reglasNombre()]);

        $id = DB::table('categorias')->insertGetId(['categoria' => trim($request->categoria)]);

        return response()->json(DB::table('categorias')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        if (!DB::table('categorias')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Categoría no encontrada'], 404);
        }

        $this->validate($request, ['categoria' => $this->reglasNombre($id)]);

        DB::table('categorias')->where('id', $id)->update(['categoria' => trim($request->categoria)]);

        return response()->json(DB::table('categorias')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        if (!DB::table('categorias')->where('id', $id)->exists()) {
            return response()->json(['error' => 'Categoría no encontrada'], 404);
        }

        $enUso = DB::table('productos')->where('id_categoria', $id)->where('estado', 1)->count();
        if ($enUso > 0) {
            return response()->json([
                'error' => "No se puede eliminar la categoría porque tiene {$enUso} producto(s) asociado(s).",
            ], 409);
        }

        DB::table('categorias')->where('id', $id)->delete();
        return response()->json(['message' => 'Categoría eliminada con éxito']);
    }

    private function reglasNombre($ignorarId = null): array
    {
        return [
            'required',
            'string',
            'max:50',
            Rule::unique('categorias', 'categoria')->ignore($ignorarId),
            function ($attribute, $value, $fail) {
                if (mb_strlen(CodigoProductoService::prefijoCategoria((string) $value), 'UTF-8') < 3) {
                    $fail('La categoría debe tener al menos 3 letras para generar el código de producto.');
                }
            },
        ];
    }
}
