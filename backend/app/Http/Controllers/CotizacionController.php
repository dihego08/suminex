<?php

namespace App\Http\Controllers;

use App\Models\Cotizacion;
use App\Models\CotizacionDetalle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CotizacionController extends Controller
{
    public function index()
    {
        $cotizaciones = Cotizacion::with('cliente')->orderBy('id', 'desc')->get();
        return response()->json($cotizaciones);
    }

    public function show($id)
    {
        $cotizacion = Cotizacion::with(['cliente', 'detalles.producto'])->findOrFail($id);
        return response()->json($cotizacion);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'id_cliente' => 'required|exists:clientes,id',
            'fecha' => 'required|date',
            'fecha_vencimiento' => 'required|date',
            'base_imponible' => 'required|numeric',
            'igv' => 'required|numeric',
            'total' => 'required|numeric',
            'detalles' => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            // Generar número (CT00000001)
            $ultimo = Cotizacion::orderBy('id', 'desc')->first();
            $num = $ultimo ? (int)substr($ultimo->numero, 2) + 1 : 1;
            $numeroGenerado = 'CT' . str_pad($num, 8, '0', STR_PAD_LEFT);

            $cotizacion = Cotizacion::create([
                'numero' => $numeroGenerado,
                'id_cliente' => $request->id_cliente,
                'fecha' => $request->fecha,
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'base_imponible' => $request->base_imponible,
                'igv' => $request->igv,
                'total' => $request->total,
                'estado' => 'Pendiente'
            ]);

            foreach ($request->detalles as $det) {
                CotizacionDetalle::create([
                    'id_cotizacion' => $cotizacion->id,
                    'id_producto' => $det['id_producto'],
                    'descripcion_personalizada' => $det['descripcion_personalizada'] ?? null,
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'total' => $det['total'],
                ]);
            }

            DB::commit();
            return response()->json($cotizacion, 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear cotización', 'msg' => $e->getMessage()], 500);
        }
    }
}
