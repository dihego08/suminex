<?php

namespace App\Http\Controllers;

use App\Models\OrdenPedido;
use App\Models\Cotizacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Models\OrdenPedidoDetalle;

class OrdenPedidoController extends Controller
{
    public function index()
    {
        // Traemos el cliente y detalles nativos, o el cliente y detalles de la cotización asociada (por compatibilidad)
        $ordenes = OrdenPedido::with(['cliente', 'detalles.producto', 'cotizacion.cliente', 'cotizacion.detalles.producto'])->orderBy('id', 'desc')->get();
        return response()->json($ordenes);
    }

    public function show($id)
    {
        $orden = OrdenPedido::with(['cliente', 'detalles.producto', 'cotizacion.cliente', 'cotizacion.detalles.producto'])->findOrFail($id);
        
        // Si no tiene cliente o detalles nativos, rellenarlos virtualmente con los de la cotización para que el front end funcione
        if (!$orden->id_cliente && $orden->cotizacion) {
            $orden->cliente = $orden->cotizacion->cliente;
            $orden->detalles = $orden->cotizacion->detalles;
            $orden->id_cliente = $orden->cotizacion->id_cliente;
        }

        return response()->json($orden);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            // Generar número (ORD-100, etc.)
            $ultimo = OrdenPedido::orderBy('id', 'desc')->first();
            $num = $ultimo ? (int)str_replace('ORD-', '', $ultimo->numero) + 1 : 100;
            $numeroGenerado = 'ORD-' . $num;

            if ($request->has('id_cotizacion')) {
                // Creación desde cotización
                $cotizacion = Cotizacion::with('detalles')->findOrFail($request->id_cotizacion);
                
                if ($cotizacion->estado === 'Aprobada') {
                    return response()->json(['error' => 'La cotización ya fue convertida a orden de pedido'], 400);
                }

                $cotizacion->estado = 'Aprobada';
                $cotizacion->save();

                $orden = OrdenPedido::create([
                    'id_cotizacion' => $cotizacion->id,
                    'numero' => $numeroGenerado,
                    'id_cliente' => $cotizacion->id_cliente,
                    'fecha' => date('Y-m-d'),
                    'estado' => 'Pendiente',
                    'base_imponible' => $cotizacion->base_imponible,
                    'igv' => $cotizacion->igv,
                    'total' => $cotizacion->total,
                    'terminos_condiciones' => $cotizacion->terminos_condiciones
                ]);

                foreach ($cotizacion->detalles as $det) {
                    OrdenPedidoDetalle::create([
                        'id_orden_pedido' => $orden->id,
                        'id_producto' => $det->id_producto,
                        'descripcion_personalizada' => $det->descripcion_personalizada,
                        'cantidad' => $det->cantidad,
                        'precio_unitario' => $det->precio_unitario,
                        'total' => $det->total,
                    ]);
                }

            } else {
                // Creación independiente
                $this->validate($request, [
                    'id_cliente' => 'required|exists:clientes,id',
                    'fecha' => 'required|date',
                    'base_imponible' => 'required|numeric',
                    'igv' => 'required|numeric',
                    'total' => 'required|numeric',
                    'detalles' => 'required|array',
                ]);

                $orden = OrdenPedido::create([
                    'numero' => $numeroGenerado,
                    'id_cliente' => $request->id_cliente,
                    'fecha' => $request->fecha,
                    'estado' => 'Pendiente',
                    'base_imponible' => $request->base_imponible,
                    'igv' => $request->igv,
                    'total' => $request->total,
                    'terminos_condiciones' => $request->terminos_condiciones
                ]);

                foreach ($request->detalles as $det) {
                    OrdenPedidoDetalle::create([
                        'id_orden_pedido' => $orden->id,
                        'id_producto' => $det['id_producto'],
                        'descripcion_personalizada' => $det['descripcion_personalizada'] ?? null,
                        'cantidad' => $det['cantidad'],
                        'precio_unitario' => $det['precio_unitario'],
                        'total' => $det['total'],
                    ]);
                }
            }

            DB::commit();
            return response()->json($orden, 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al generar la orden', 'msg' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'id_cliente' => 'required|exists:clientes,id',
            'fecha' => 'required|date',
            'base_imponible' => 'required|numeric',
            'igv' => 'required|numeric',
            'total' => 'required|numeric',
            'detalles' => 'required|array',
        ]);

        $orden = OrdenPedido::findOrFail($id);

        DB::beginTransaction();

        try {
            $orden->update([
                'id_cliente' => $request->id_cliente,
                'fecha' => $request->fecha,
                'base_imponible' => $request->base_imponible,
                'igv' => $request->igv,
                'total' => $request->total,
                'terminos_condiciones' => $request->terminos_condiciones
            ]);

            // Borrar detalles antiguos y crear los nuevos (solo si es nativa o queremos forzar nativos)
            OrdenPedidoDetalle::where('id_orden_pedido', $orden->id)->delete();

            foreach ($request->detalles as $det) {
                OrdenPedidoDetalle::create([
                    'id_orden_pedido' => $orden->id,
                    'id_producto' => $det['id_producto'],
                    'descripcion_personalizada' => $det['descripcion_personalizada'] ?? null,
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'total' => $det['total'],
                ]);
            }

            DB::commit();
            return response()->json($orden, 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar la orden', 'msg' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $orden = OrdenPedido::findOrFail($id);
        
        DB::beginTransaction();
        try {
            // Si la orden viene de una cotizacion, opcionalmente volverla a Pendiente
            if ($orden->id_cotizacion) {
                $cot = Cotizacion::find($orden->id_cotizacion);
                if ($cot) {
                    $cot->estado = 'Pendiente';
                    $cot->save();
                }
            }

            OrdenPedidoDetalle::where('id_orden_pedido', $id)->delete();
            $orden->delete();
            DB::commit();
            return response()->json(['message' => 'Orden eliminada correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar la orden', 'msg' => $e->getMessage()], 500);
        }
    }
}
