<?php

namespace App\Http\Controllers;

use App\Models\Compra;
use App\Models\CompraDetalle;
use App\Models\Producto;
use App\Models\Operation;
use App\Models\Proveedor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CompraController extends Controller
{
    public const TIPO_CATALOGO = 'CATALOGO';
    public const TIPOS_COMPRA = ['CATALOGO', 'SUMINISTROS', 'AGASAJOS'];

    public function index(Request $request)
    {
        $query = Compra::with(['proveedorRel', 'detalles.producto']);

        if ($request->has('search') && !empty($request->search)) {
            $s = trim($request->search);
            $query->where(function($q) use ($s) {
                $q->where('serie', 'like', "%{$s}%")
                  ->orWhere('numeracion', 'like', "%{$s}%")
                  ->orWhere('proveedor', 'like', "%{$s}%")
                  ->orWhere(DB::raw("CONCAT(COALESCE(serie, ''), '-', COALESCE(numeracion, ''))"), 'like', "%{$s}%")
                  ->orWhereHas('proveedorRel', function($sub) use ($s) {
                      $sub->where('razon_social', 'like', "%{$s}%")
                          ->orWhere('ruc', 'like', "%{$s}%");
                  });
            });
        }

        if ($request->has('fecha_desde') && !empty($request->fecha_desde)) {
            $query->whereDate('fecha_creacion', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta') && !empty($request->fecha_hasta)) {
            $query->whereDate('fecha_creacion', '<=', $request->fecha_hasta);
        }

        if ($request->filled('tipo_compra')) {
            $query->where('tipo_compra', strtoupper($request->tipo_compra));
        }

        if ($request->has('id_proveedor') && !empty($request->id_proveedor)) {
            $query->where('id_proveedor', $request->id_proveedor);
        }

        $perPage = $request->get('per_page', 15);
        $compras = $query->orderBy('fecha_creacion', 'desc')
                         ->orderBy('id', 'desc')
                         ->paginate($perPage);

        return response()->json($compras);
    }

    public function show($id)
    {
        $compra = Compra::with(['proveedorRel', 'detalles.producto'])->findOrFail($id);
        return response()->json($compra);
    }

    public function store(Request $request)
    {
        $tipoCompra = strtoupper($request->tipo_compra ?? self::TIPO_CATALOGO);
        $esCatalogo = $tipoCompra === self::TIPO_CATALOGO;

        $this->validate($request, [
            'tipo_compra' => 'nullable|in:' . implode(',', self::TIPOS_COMPRA),
            'id_proveedor' => 'required',
            'serie' => 'required|string',
            'numeracion' => 'required|string',
            'fecha_creacion' => 'required|date',
            'detalles' => 'required|array|min:1',
            // Catálogo: producto obligatorio. Suministros / Agasajos: descripción manual
            'detalles.*.id_producto' => $esCatalogo ? 'required|exists:productos,id' : 'nullable',
            'detalles.*.descripcion' => $esCatalogo ? 'nullable|string|max:255' : 'required|string|max:255',
            'detalles.*.cantidad' => 'required|numeric|min:0.01',
            'detalles.*.precio' => 'required|numeric|min:0',
        ], [
            'detalles.*.descripcion.required' => 'Ingrese la descripción de cada ítem.',
            'detalles.*.id_producto.required' => 'Seleccione un producto del catálogo en cada ítem.',
        ]);

        DB::beginTransaction();
        try {
            $proveedor = Proveedor::find($request->id_proveedor);
            $nombreProveedor = $proveedor ? $proveedor->razon_social : ($request->proveedor ?? '');

            $codigo = $request->id_proveedor . '-';

            $compra = Compra::create([
                'codigo' => $codigo,
                'tipo_compra' => $tipoCompra,
                'serie' => strtoupper(trim($request->serie)),
                'numeracion' => trim($request->numeracion),
                'id_proveedor' => $request->id_proveedor,
                'proveedor' => $nombreProveedor,
                'igv' => $request->igv ?? 0.00,
                'gravado' => $request->gravado ?? ($request->total - ($request->igv ?? 0)),
                'exonerado' => $request->exonerado ?? 0.00,
                'otros_no_gravado' => 0.00,
                'total' => $request->total,
                'fecha_creacion' => $request->fecha_creacion,
                'tipo_documento' => $request->tipo_documento ?? 1, // 1: Factura, 2: Boleta, etc.
                'id_forma_pago' => $request->id_forma_pago ?? 1,
                'tipo_cambio' => $request->tipo_cambio ?? 1.00,
                'fecha_comprobante' => $request->fecha_comprobante ?? $request->fecha_creacion,
                'serie_comprobante' => strtoupper(trim($request->serie)),
                'documento_comprobante' => trim($request->numeracion),
                'fproceso' => date('Y-m-d H:i:s'),
            ]);


            foreach ($request->detalles as $det) {
                $cantidad = floatval($det['cantidad']);
                $precio = floatval($det['precio']);
                $subtotalItem = $cantidad * $precio;

                $producto = $esCatalogo ? Producto::find($det['id_producto']) : null;

                CompraDetalle::create([
                    'codigo_compra' => $codigo,
                    'id_compra' => $compra->id,
                    'id_insumo' => $producto ? $producto->id : null,
                    'descripcion' => $producto ? $producto->nombre : trim($det['descripcion']),
                    'precio' => $precio,
                    'cantidad' => $cantidad,
                    'unidad' => $det['unidad'] ?? 'NIU',
                    'total' => $subtotalItem,
                ]);

                // Catálogo: solo se actualiza el precio de compra del producto.
                // Las compras no mueven el kardex ni el stock (eso lo hacen las Notas de Ingreso / Salida).
                if ($producto) {
                    $producto->precio_compra = $precio;
                    $producto->fecha_actualizacion = date('Y-m-d H:i:s');
                    $producto->save();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compra registrada exitosamente.',
                'compra' => $compra->load(['proveedorRel', 'detalles.producto'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al registrar la compra',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $compra = Compra::with('detalles')->findOrFail($id);

        DB::beginTransaction();
        try {
            // Las compras no mueven el kardex ni el stock, así que al eliminarla no hay nada que revertir
            $compra->detalles()->delete();
            $compra->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compra eliminada correctamente.'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al eliminar la compra',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
