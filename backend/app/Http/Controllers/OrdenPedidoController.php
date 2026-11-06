<?php

namespace App\Http\Controllers;

use App\Models\OrdenPedido;
use App\Models\Cotizacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

use App\Models\OrdenPedidoDetalle;

class OrdenPedidoController extends Controller
{
    private const CARPETA_ORDEN_COMPRA = 'uploads/ordenes_compra';

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

                $ordenData = [
                    'id_cotizacion' => $cotizacion->id,
                    'numero' => $numeroGenerado,
                    'id_cliente' => $cotizacion->id_cliente,
                    'fecha' => date('Y-m-d'),
                    'estado' => 'Pendiente',
                    'base_imponible' => $cotizacion->base_imponible,
                    'igv' => $cotizacion->igv,
                    'aplica_igv' => $cotizacion->aplica_igv ?? 1,
                    'total' => $cotizacion->total,
                    'terminos_condiciones' => $cotizacion->terminos_condiciones
                ];
                if (Schema::hasColumn('ordenes_pedido', 'incluye_igv')) {
                    $ordenData['incluye_igv'] = $cotizacion->incluye_igv ?? 0;
                }
                $orden = OrdenPedido::create($ordenData);

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

                $ordenData = [
                    'numero' => $numeroGenerado,
                    'id_cliente' => $request->id_cliente,
                    'fecha' => $request->fecha,
                    'estado' => 'Pendiente',
                    'base_imponible' => $request->base_imponible,
                    'igv' => $request->igv,
                    'aplica_igv' => $request->has('aplica_igv') ? (int) $request->boolean('aplica_igv') : 1,
                    'total' => $request->total,
                    'terminos_condiciones' => $request->terminos_condiciones
                ];
                if (Schema::hasColumn('ordenes_pedido', 'incluye_igv')) {
                    $ordenData['incluye_igv'] = $request->has('incluye_igv') ? (int) $request->boolean('incluye_igv') : 0;
                }
                $orden = OrdenPedido::create($ordenData);

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
            $ordenData = [
                'id_cliente' => $request->id_cliente,
                'fecha' => $request->fecha,
                'base_imponible' => $request->base_imponible,
                'igv' => $request->igv,
                'aplica_igv' => $request->has('aplica_igv') ? (int) $request->boolean('aplica_igv') : 1,
                'total' => $request->total,
                'terminos_condiciones' => $request->terminos_condiciones
            ];
            if (Schema::hasColumn('ordenes_pedido', 'incluye_igv')) {
                $ordenData['incluye_igv'] = $request->has('incluye_igv') ? (int) $request->boolean('incluye_igv') : 0;
            }
            $orden->update($ordenData);

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

    /**
     * Adjunta (o reemplaza) el PDF de la orden de compra que envió el cliente.
     */
    public function subirOrdenCompra(Request $request, $id)
    {
        $orden = OrdenPedido::findOrFail($id);

        $this->validate($request, [
            'archivo' => 'required|file|mimes:pdf|max:10240',
        ], [
            'archivo.required' => 'Seleccione el archivo PDF de la orden de compra.',
            'archivo.mimes' => 'La orden de compra debe ser un archivo PDF.',
            'archivo.max' => 'El PDF no puede pesar más de 10 MB.',
        ]);

        $file = $request->file('archivo');
        $nombre = preg_replace('/[^A-Za-z0-9._-]/', '_', $file->getClientOriginalName());
        $filename = 'orden_' . $orden->id . '_' . time() . '_' . $nombre;
        $file->move(public_path(self::CARPETA_ORDEN_COMPRA), $filename);

        $anterior = $orden->orden_compra_archivo;
        $orden->orden_compra_archivo = $filename;
        $orden->save();
        $this->borrarArchivoOrdenCompra($anterior);

        return response()->json(['orden_compra_archivo' => $filename]);
    }

    public function quitarOrdenCompra($id)
    {
        $orden = OrdenPedido::findOrFail($id);
        $anterior = $orden->orden_compra_archivo;
        $orden->orden_compra_archivo = null;
        $orden->save();
        $this->borrarArchivoOrdenCompra($anterior);

        return response()->json(['message' => 'Orden de compra quitada']);
    }

    private function borrarArchivoOrdenCompra(?string $archivo): void
    {
        if ($archivo) {
            $ruta = public_path(self::CARPETA_ORDEN_COMPRA . '/' . basename($archivo));
            if (file_exists($ruta)) {
                unlink($ruta);
            }
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
            $archivoOrdenCompra = $orden->orden_compra_archivo;
            $orden->delete();
            DB::commit();
            $this->borrarArchivoOrdenCompra($archivoOrdenCompra);
            return response()->json(['message' => 'Orden eliminada correctamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al eliminar la orden', 'msg' => $e->getMessage()], 500);
        }
    }
}
