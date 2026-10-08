<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\ProductoUnidad;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductoController extends Controller
{
    public function index()
    {
        $productos = Producto::with(['preciosClientes.cliente', 'unidadesSecundarias'])->get();
        return response()->json($productos);
    }

    public function show($id)
    {
        $producto = Producto::with('preciosClientes.cliente')->findOrFail($id);
        return response()->json($producto);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'codigo' => 'required|unique:productos',
            'descripcion' => 'required',
            'precio_base' => 'required|numeric',
        ]);

        $data = $request->except('unidades_secundarias');

        if ($request->hasFile('imagen')) {
            $file = $request->file('imagen');
            $filename = time() . '_img_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->move(base_path('public/uploads/productos'), $filename);
            $data['imagen'] = 'uploads/productos/' . $filename;
        }

        if ($request->hasFile('ficha_tecnica')) {
            $file = $request->file('ficha_tecnica');
            $filename = time() . '_ficha_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->move(base_path('public/uploads/fichas'), $filename);
            $data['ficha_tecnica'] = 'uploads/fichas/' . $filename;
        }

        DB::beginTransaction();
        try {
            $producto = Producto::create($data);

            $unidades = $request->input('unidades_secundarias');
            if (is_string($unidades)) {
                $unidades = json_decode($unidades, true);
            }

            if (!empty($unidades) && is_array($unidades)) {
                foreach ($unidades as $unidad) {
                    ProductoUnidad::create([
                        'id_producto' => $producto->id,
                        'unidad_medida' => $unidad['unidad_medida'],
                        'factor_conversion' => $unidad['factor_conversion'],
                        'precio' => $unidad['precio'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return response()->json($producto, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear producto', 'msg' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);
        $data = $request->except('unidades_secundarias');

        if ($request->hasFile('imagen')) {
            $file = $request->file('imagen');
            $filename = time() . '_img_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->move(base_path('public/uploads/productos'), $filename);
            $data['imagen'] = 'uploads/productos/' . $filename;
        }

        if ($request->hasFile('ficha_tecnica')) {
            $file = $request->file('ficha_tecnica');
            $filename = time() . '_ficha_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
            $file->move(base_path('public/uploads/fichas'), $filename);
            $data['ficha_tecnica'] = 'uploads/fichas/' . $filename;
        }

        DB::beginTransaction();
        try {
            $producto->update($data);

            if ($request->has('unidades_secundarias')) {
                $unidades = $request->input('unidades_secundarias');
                if (is_string($unidades)) {
                    $unidades = json_decode($unidades, true);
                }

                ProductoUnidad::where('id_producto', $producto->id)->delete();

                if (!empty($unidades) && is_array($unidades)) {
                    foreach ($unidades as $unidad) {
                        ProductoUnidad::create([
                            'id_producto' => $producto->id,
                            'unidad_medida' => $unidad['unidad_medida'],
                            'factor_conversion' => $unidad['factor_conversion'],
                            'precio' => $unidad['precio'] ?? null,
                        ]);
                    }
                }
            }

            DB::commit();
            return response()->json($producto);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar producto', 'msg' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        Producto::destroy($id);
        return response()->json(['message' => 'Producto eliminado con éxito']);
    }
}
