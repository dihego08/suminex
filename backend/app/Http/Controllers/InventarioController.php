<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use App\Models\Operation;
use App\Models\Venta;
use App\Models\Compra;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventarioController extends Controller
{
    public function index(Request $request)
    {
        $query = Producto::query();

        if ($request->has('search') && !empty($request->search)) {
            $s = trim($request->search);
            $query->where(function($q) use ($s) {
                $q->where('nombre', 'like', "%{$s}%")
                  ->orWhere('codigo', 'like', "%{$s}%")
                  ->orWhere('marca', 'like', "%{$s}%");
            });
        }

        // Filtro por estado de stock
        if ($request->has('estado_stock')) {
            if ($request->estado_stock === 'bajo_stock') {
                $query->whereRaw('stock > 0 AND stock <= stock_minimo');
            } elseif ($request->estado_stock === 'sin_stock') {
                $query->whereRaw('stock <= 0');
            } elseif ($request->estado_stock === 'con_stock') {
                $query->whereRaw('stock > 0');
            }
        }

        // Estadísticas generales para los KPI cards
        $stats = [
            'total_productos' => Producto::count(),
            'valor_inventario' => (float)Producto::selectRaw('SUM(stock * precio_compra) as total')->value('total') ?? 0,
            'bajo_stock' => Producto::whereRaw('stock > 0 AND stock <= stock_minimo')->count(),
            'sin_stock' => Producto::whereRaw('stock <= 0')->count(),
        ];

        $perPage = $request->get('per_page', 20);
        $productos = $query->orderBy('nombre', 'asc')->paginate($perPage);

        return response()->json([
            'stats' => $stats,
            'productos' => $productos
        ]);
    }

    public function kardex($id)
    {
        $producto = Producto::findOrFail($id);

        // Obtener operaciones de la tabla operation ordenadas cronológicamente
        $operaciones = Operation::where('product_id', $id)
            ->where('status', 1)
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $kardexItems = [];
        $saldoAcumulado = 0;

        foreach ($operaciones as $op) {
            $tipo = 'Ajuste';
            $referencia = '-';
            $entrada = 0;
            $salida = 0;
            $precio = $op->price_in > 0 ? $op->price_in : $op->price_out;

            switch ($op->operation_type_id) {
                case 1: // Entrada (Compra o Ajuste positivo)
                    $entrada = (float)$op->q;
                    $saldoAcumulado += $entrada;
                    $tipo = 'Entrada / Compra';
                    if ($op->operation_from_id) {
                        $referencia = 'Op #' . $op->operation_from_id;
                    }
                    break;

                case 2: // Salida (Venta o Ajuste negativo)
                    $salida = (float)$op->q;
                    $saldoAcumulado -= $salida;
                    $tipo = 'Salida / Venta';
                    if ($op->sell_id) {
                        $venta = Venta::find($op->sell_id);
                        if ($venta) {
                            $referencia = $venta->serie . '-' . $venta->correlativo;
                        } else {
                            $referencia = 'Venta #' . $op->sell_id;
                        }
                    }
                    break;

                case 5: // Devolución / Anulación
                    $entrada = (float)$op->q;
                    $saldoAcumulado += $entrada;
                    $tipo = 'Devolución / NC';
                    if ($op->sell_id) {
                        $venta = Venta::find($op->sell_id);
                        $referencia = $venta ? ($venta->correlativo_nc ?? $venta->serie . '-' . $venta->correlativo) : 'Venta #' . $op->sell_id;
                    }
                    break;

                default:
                    if ($op->q >= 0) {
                        $entrada = (float)$op->q;
                        $saldoAcumulado += $entrada;
                        $tipo = 'Entrada';
                    } else {
                        $salida = abs((float)$op->q);
                        $saldoAcumulado -= $salida;
                        $tipo = 'Salida';
                    }
                    break;
            }

            $kardexItems[] = [
                'id' => $op->id,
                'fecha' => $op->created_at,
                'tipo_id' => $op->operation_type_id,
                'tipo' => $tipo,
                'referencia' => $referencia,
                'precio_unitario' => (float)$precio,
                'entrada' => $entrada,
                'salida' => $salida,
                'saldo' => $saldoAcumulado,
            ];
        }

        // Si no hubiera operaciones registradas en 'operation' para este producto pero tiene stock, mostrar saldo inicial
        if (count($kardexItems) === 0 && $producto->stock > 0) {
            $kardexItems[] = [
                'id' => 0,
                'fecha' => $producto->created_at ?? date('Y-m-d H:i:s'),
                'tipo_id' => 1,
                'tipo' => 'Stock Inicial',
                'referencia' => 'Apertura de Inventario',
                'precio_unitario' => (float)$producto->precio_compra,
                'entrada' => (float)$producto->stock,
                'salida' => 0,
                'saldo' => (float)$producto->stock,
            ];
        }

        return response()->json([
            'producto' => $producto,
            'kardex' => array_reverse($kardexItems), // Mostrar los más recientes primero para UI
            'saldo_actual' => $producto->stock
        ]);
    }

    public function ajusteStock(Request $request)
    {
        $this->validate($request, [
            'id_producto' => 'required|exists:productos,id',
            'tipo_movimiento' => 'required|in:entrada,salida',
            'cantidad' => 'required|numeric|min:0.01',
            'motivo' => 'required|string|max:255',
            'precio_unitario' => 'nullable|numeric|min:0',
        ]);

        DB::beginTransaction();
        try {
            $producto = Producto::findOrFail($request->id_producto);
            $cantidad = floatval($request->cantidad);
            $precio = floatval($request->precio_unitario ?? $producto->precio_compra);

            if ($request->tipo_movimiento === 'salida' && $producto->stock < $cantidad) {
                return response()->json([
                    'error' => 'Stock insuficiente',
                    'message' => "El stock actual es de {$producto->stock}, no se pueden retirar {$cantidad} unidades."
                ], 400);
            }

            if ($request->tipo_movimiento === 'entrada') {
                $producto->stock = floatval($producto->stock) + $cantidad;
                $opTypeId = 1; // Entrada
                $pIn = $precio;
                $pOut = 0;
            } else {
                $producto->stock = floatval($producto->stock) - $cantidad;
                $opTypeId = 2; // Salida
                $pIn = 0;
                $pOut = $precio;
            }

            $producto->fecha_actualizacion = date('Y-m-d H:i:s');
            $producto->save();

            // Registrar en Operation
            Operation::create([
                'product_id' => $producto->id,
                'stock_id' => $request->stock_id ?? 1,
                'q' => $cantidad,
                'price_in' => $pIn,
                'price_out' => $pOut,
                'operation_type_id' => $opTypeId,
                'status' => 1,
                'is_draft' => 0,
                'is_traspase' => 0,
                'created_at' => date('Y-m-d H:i:s'),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Ajuste de inventario aplicado correctamente.',
                'stock_nuevo' => $producto->stock
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al procesar el ajuste de stock',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
