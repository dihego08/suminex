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

        DB::beginTransaction();
        try {
            $producto = Producto::create($request->all());

            if ($request->has('unidades_secundarias') && is_array($request->unidades_secundarias)) {
                foreach ($request->unidades_secundarias as $unidad) {
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
        $producto->update($request->all());
        return response()->json($producto);
    }

    public function destroy($id)
    {
        Producto::destroy($id);
        return response()->json(['message' => 'Producto eliminado con éxito']);
    }
}
