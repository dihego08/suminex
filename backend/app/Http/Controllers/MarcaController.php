<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class MarcaController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('brand')->select('id', 'name', 'description', 'image', 'created_at');

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $marcas = $query->orderBy('name')->get();

        // Cantidad de productos por marca (los productos guardan el nombre de la marca)
        $conteo = DB::table('productos')
            ->select('marca', DB::raw('COUNT(*) as total'))
            ->whereNotNull('marca')
            ->where('estado', 1)
            ->groupBy('marca')
            ->pluck('total', 'marca');

        $marcas->each(function ($m) use ($conteo) {
            $m->productos_count = (int) ($conteo[$m->name] ?? 0);
        });

        return response()->json($marcas);
    }

    public function show($id)
    {
        $marca = DB::table('brand')->where('id', $id)->first();
        if (!$marca) {
            return response()->json(['error' => 'Marca no encontrada'], 404);
        }
        return response()->json($marca);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'name' => 'required|string|max:50|unique:brand,name',
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
        ]);

        $id = DB::table('brand')->insertGetId([
            'name' => trim($request->name),
            'description' => $request->description,
            'image' => $this->guardarImagen($request),
            'created_at' => now(),
        ]);

        return response()->json(DB::table('brand')->where('id', $id)->first(), 201);
    }

    public function update(Request $request, $id)
    {
        $marca = DB::table('brand')->where('id', $id)->first();
        if (!$marca) {
            return response()->json(['error' => 'Marca no encontrada'], 404);
        }

        $this->validate($request, [
            'name' => ['required', 'string', 'max:50', Rule::unique('brand', 'name')->ignore($id)],
            'description' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
        ]);

        $nuevoNombre = trim($request->name);
        $data = [
            'name' => $nuevoNombre,
            'description' => $request->description,
        ];

        $imagen = $this->guardarImagen($request);
        if ($imagen) {
            $data['image'] = $imagen;
        }

        DB::transaction(function () use ($id, $data, $marca, $nuevoNombre) {
            DB::table('brand')->where('id', $id)->update($data);

            // Los productos referencian la marca por nombre: mantenerlos sincronizados
            if ($marca->name !== $nuevoNombre) {
                DB::table('productos')->where('marca', $marca->name)->update(['marca' => $nuevoNombre]);
            }
        });

        return response()->json(DB::table('brand')->where('id', $id)->first());
    }

    public function destroy($id)
    {
        $marca = DB::table('brand')->where('id', $id)->first();
        if (!$marca) {
            return response()->json(['error' => 'Marca no encontrada'], 404);
        }

        $enUso = DB::table('productos')->where('marca', $marca->name)->where('estado', 1)->count();
        if ($enUso > 0) {
            return response()->json([
                'error' => "No se puede eliminar la marca porque tiene {$enUso} producto(s) asociado(s).",
            ], 409);
        }

        DB::table('brand')->where('id', $id)->delete();
        return response()->json(['message' => 'Marca eliminada con éxito']);
    }

    private function guardarImagen(Request $request): ?string
    {
        if (!$request->hasFile('image') || !$request->file('image')->isValid()) {
            return null;
        }
        $file = $request->file('image');
        $filename = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
        $file->move(public_path('images/brands'), $filename);
        return $filename;
    }
}
