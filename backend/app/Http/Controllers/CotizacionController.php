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
        $cotizaciones = Cotizacion::with(['cliente', 'detalles.producto'])->orderBy('id', 'desc')->get();
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
            // Generar número (COT-100, etc.)
            $ultimo = Cotizacion::orderBy('id', 'desc')->first();
            $num = $ultimo ? (int)str_replace('COT-', '', $ultimo->numero) + 1 : 100;
            $numeroGenerado = 'COT-' . $num;

            $cotizacion = Cotizacion::create([
                'numero' => $numeroGenerado,
                'id_cliente' => $request->id_cliente,
                'fecha' => $request->fecha,
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'base_imponible' => $request->base_imponible,
                'igv' => $request->igv,
                'total' => $request->total,
                'estado' => 'Pendiente',
                'terminos_condiciones' => $request->terminos_condiciones
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

    public function update(Request $request, $id)
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

        $cotizacion = Cotizacion::findOrFail($id);

        DB::beginTransaction();

        try {
            $cotizacion->update([
                'id_cliente' => $request->id_cliente,
                'fecha' => $request->fecha,
                'fecha_vencimiento' => $request->fecha_vencimiento,
                'base_imponible' => $request->base_imponible,
                'igv' => $request->igv,
                'total' => $request->total,
                'terminos_condiciones' => $request->terminos_condiciones
            ]);

            // Borrar detalles antiguos y crear los nuevos
            CotizacionDetalle::where('id_cotizacion', $cotizacion->id)->delete();

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
            return response()->json($cotizacion, 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar cotización', 'msg' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);
        
        DB::beginTransaction();
        try {
            CotizacionDetalle::where('id_cotizacion', $id)->delete();
            $cotizacion->delete();
            DB::commit();
            return response()->json(['message' => 'Cotización eliminada correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar cotización', 'msg' => $e->getMessage()], 500);
        }
    }
}
