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
        $this->validate($request, [
            'id_proveedor' => 'required',
            'serie' => 'required|string',
            'numeracion' => 'required|string',
            'fecha_creacion' => 'required|date',
            'detalles' => 'required|array|min:1',
            'detalles.*.id_producto' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|numeric|min:0.01',
            'detalles.*.precio' => 'required|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $proveedor = Proveedor::find($request->id_proveedor);
            $nombreProveedor = $proveedor ? $proveedor->razon_social : ($request->proveedor ?? '');

            $codigo = $request->id_proveedor . '-';

            $compra = Compra::create([
                'codigo' => $codigo,
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

            $stockId = $request->stock_id ?? 1; // 1: Almacén Principal

            foreach ($request->detalles as $det) {
                $cantidad = floatval($det['cantidad']);
                $precio = floatval($det['precio']);
                $subtotalItem = $cantidad * $precio;

                CompraDetalle::create([
                    'codigo_compra' => $codigo,
                    'id_compra' => $compra->id,
                    'id_insumo' => $det['id_producto'],
                    'precio' => $precio,
                    'cantidad' => $cantidad,
                    'unidad' => $det['unidad'] ?? 'NIU',
                    'total' => $subtotalItem,
                ]);

                // 1. Aumentar el stock del producto y actualizar su precio de compra
                $producto = Producto::find($det['id_producto']);
                if ($producto) {
                    $producto->stock = floatval($producto->stock) + $cantidad;
                    $producto->precio_compra = $precio;
                    $producto->fecha_actualizacion = date('Y-m-d H:i:s');
                    $producto->save();
                }

                // 2. Registrar movimiento de entrada en el Kardex (tabla operation)
                Operation::create([
                    'product_id' => $det['id_producto'],
                    'stock_id' => $stockId,
                    'q' => $cantidad,
                    'price_in' => $precio,
                    'price_out' => 0,
                    'operation_type_id' => 1, // 1: Entrada
                    'status' => 1,
                    'is_draft' => 0,
                    'is_traspase' => 0,
                    'created_at' => $request->fecha_creacion . ' ' . date('H:i:s'),
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compra registrada exitosamente y stock actualizado.',
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
            // Revertir el stock agregado por esta compra
            foreach ($compra->detalles as $det) {
                $producto = Producto::find($det->id_insumo);
                if ($producto) {
                    $producto->stock = max(0, floatval($producto->stock) - floatval($det->cantidad));
                    $producto->save();
                }

                // Registrar salida de anulación en Kardex
                Operation::create([
                    'product_id' => $det->id_insumo,
                    'stock_id' => 1,
                    'q' => $det->cantidad,
                    'price_in' => 0,
                    'price_out' => $det->precio,
                    'operation_type_id' => 2, // 2: Salida por reversión/anulación
                    'status' => 1,
                    'is_draft' => 0,
                    'is_traspase' => 0,
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
            }

            $compra->detalles()->delete();
            $compra->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Compra eliminada y stock revertido correctamente.'
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
