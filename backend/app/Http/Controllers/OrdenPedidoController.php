<?php

namespace App\Http\Controllers;

use App\Models\OrdenPedido;
use App\Models\Cotizacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrdenPedidoController extends Controller
{
    public function index()
    {
        $ordenes = OrdenPedido::with(['cotizacion.cliente', 'cotizacion.detalles.producto'])->orderBy('id', 'desc')->get();
        return response()->json($ordenes);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'id_cotizacion' => 'required|exists:cotizaciones,id'
        ]);

        DB::beginTransaction();

        try {
            $cotizacion = Cotizacion::findOrFail($request->id_cotizacion);
            
            // Si ya está aprobada, no duplicar orden
            if ($cotizacion->estado === 'Aprobada') {
                return response()->json(['error' => 'La cotización ya fue convertida a orden de pedido'], 400);
            }

            // Cambiar estado de la cotización
            $cotizacion->estado = 'Aprobada';
            $cotizacion->save();

            // Crear la orden de pedido
            $orden = OrdenPedido::create([
                'id_cotizacion' => $cotizacion->id,
                'fecha' => date('Y-m-d'),
                'estado' => 'Pendiente'
            ]);

            DB::commit();
            return response()->json($orden, 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al generar la orden', 'msg' => $e->getMessage()], 500);
        }
    }
}
