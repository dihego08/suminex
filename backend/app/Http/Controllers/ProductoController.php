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
        $productos = Producto::activos()->with(['preciosClientes.cliente', 'unidadesSecundarias'])->get();
        return response()->json($productos);
    }

    public function show($id)
    {
        $producto = Producto::activos()->with('preciosClientes.cliente')->findOrFail($id);
        return response()->json($producto);
    }

    public function store(Request $request)
    {
        // El código es único en BD también para productos dados de baja
        $eliminado = Producto::where('codigo', $request->codigo)->where('estado', 0)->exists();
        if ($eliminado) {
            return response()->json([
                'message' => 'El código ya pertenece a un producto eliminado.',
                'errors' => ['codigo' => ['El código "' . $request->codigo . '" ya pertenece a un producto eliminado. Use otro código.']],
            ], 422);
        }

        $this->validate($request, [
            'codigo' => 'required|unique:productos',
            'descripcion' => 'nullable|string',
            'precio_base' => 'required|numeric',
            'precio_compra' => 'nullable|numeric',
            'imagen' => 'nullable|image|max:5120',
        ]);

        $data = $this->prepararDatos($request);
        $data['estado'] = 1;

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
        $producto = Producto::activos()->findOrFail($id);

        $this->validate($request, [
            'codigo' => 'required|unique:productos,codigo,' . $producto->id,
            'descripcion' => 'nullable|string',
            'precio_base' => 'required|numeric',
            'precio_compra' => 'nullable|numeric',
            'imagen' => 'nullable|image|max:5120',
        ]);

        $data = $this->prepararDatos($request);

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

    /**
     * Normaliza los campos del formulario y guarda los archivos adjuntos.
     * La imagen se guarda en public/images/products y se registra solo el nombre del archivo,
     * que es como el frontend la muestra (SERVER_URL/images/products/{imagen}).
     */
    private function prepararDatos(Request $request): array
    {
        $data = $request->except(['unidades_secundarias', 'imagen', 'ficha_tecnica', '_method', 'estado']);

        $data['descripcion'] = $request->input('descripcion') ?? '';

        $precioCompra = $request->input('precio_compra');
        $data['precio_compra'] = is_numeric($precioCompra) ? $precioCompra : 0;

        if ($request->hasFile('imagen') && $request->file('imagen')->isValid()) {
            $file = $request->file('imagen');
            $filename = time() . '_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
            $file->move(public_path('images/products'), $filename);
            $data['imagen'] = $filename;
        }

        if ($request->hasFile('ficha_tecnica') && $request->file('ficha_tecnica')->isValid()) {
            $file = $request->file('ficha_tecnica');
            $filename = time() . '_ficha_' . preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
            $file->move(public_path('uploads/fichas'), $filename);
            $data['ficha_tecnica'] = 'uploads/fichas/' . $filename;
        }

        return $data;
    }

    public function destroy($id)
    {
        // Baja lógica: el producto se conserva para el historial (ventas, compras, kardex, etc.)
        $producto = Producto::activos()->findOrFail($id);
        $producto->estado = 0;
        $producto->save();

        return response()->json(['message' => 'Producto eliminado con éxito']);
    }
}
