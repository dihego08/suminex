<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Services\GuiaRemisionService;

class GuiaController extends Controller
{
    public function index(Request $request)
    {
        $query = DB::table('guia_cabecera as g')
            ->leftJoin('person as p', 'p.no', '=', 'g.ruc_destinatario')
            ->select('g.*', 'p.name')
            ->orderBy('g.id', 'DESC');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('g.num_guia', 'like', "%$search%")
                  ->orWhere('g.ruc_destinatario', 'like', "%$search%")
                  ->orWhere('p.name', 'like', "%$search%")
                  ->orWhere('g.ruc_transportista', 'like', "%$search%");
            });
        }

        if ($request->filled('desde') && $request->filled('hasta')) {
            $query->whereBetween('g.fecha_emision', [$request->desde, $request->hasta]);
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        $cabecera = DB::table('guia_cabecera as g')
            ->leftJoin('person as p', 'p.no', '=', 'g.ruc_destinatario')
            ->select('g.*', 'p.name')
            ->where('g.id', $id)
            ->first();

        if ($cabecera) {
            $cabecera->ubigeo_origen_obj = [
                'departamento' => $cabecera->ubigeo ? substr($cabecera->ubigeo, 0, 2) : '',
                'provincia'    => $cabecera->ubigeo ? substr($cabecera->ubigeo, 0, 4) : '',
                'distrito'     => $cabecera->ubigeo ?? '',
            ];
            $cabecera->ubigeo_destino_obj = [
                'departamento' => $cabecera->ubigeo_destino ? substr($cabecera->ubigeo_destino, 0, 2) : '',
                'provincia'    => $cabecera->ubigeo_destino ? substr($cabecera->ubigeo_destino, 0, 4) : '',
                'distrito'     => $cabecera->ubigeo_destino ?? '',
            ];
        }

        $detalle = DB::table('guia_detalle as vd')
            ->leftJoin('productos as p', 'p.id', '=', 'vd.id_producto')
            ->select('vd.*', 'vd.descripcion_producto as descripcion_producto', 'p.codigo as code', 'p.nombre as producto_nombre')
            ->where('vd.id_guia', $id)
            ->get();

        return response()->json([
            'cabecera' => $cabecera,
            'detalle'  => $detalle,
        ]);
    }

    /**
     * Get the next guide number (T001-XXXX) based on the aux table
     */
    public function nextNumGuia()
    {
        try {
            $aux = DB::table('aux')->where('i', 12)->first();
            $next = $aux ? ($aux->id + 1) : 1;
            return response()->json(['num_guia' => 'T001-' . $next]);
        } catch (\Exception $e) {
            $count = DB::table('guia_cabecera')->count();
            return response()->json(['num_guia' => 'T001-' . ($count + 1)]);
        }
    }

    public function getDepartamentos()
    {
        return response()->json(DB::table('departamento')->get());
    }

    public function getProvincias(Request $request)
    {
        return response()->json(
            DB::table('provincia')->where('departamento', $request->departamento)->get()
        );
    }

    public function getDistritos(Request $request)
    {
        return response()->json(
            DB::table('distrito')->where('provincia', $request->provincia)->get()
        );
    }

    /**
     * Search products for adding to guide
     */
    public function searchProducts(Request $request)
    {
        $query = DB::table('productos as p')
            ->select('p.id', 'p.nombre as name', 'p.codigo as code', 'p.precio_base as price_in', 'p.unidad_medida as unit', 'p.peso as weight');

        if ($request->filled('nombre')) {
            $query->where('p.nombre', 'like', '%' . $request->nombre . '%');
        } elseif ($request->filled('codigo')) {
            $query->where('p.codigo', 'like', '%' . $request->codigo . '%');
        }

        return response()->json($query->limit(30)->get());
    }

    public function store(Request $request)
    {
        $items = $request->input('items', []);

        if (empty($items)) {
            return response()->json(['Result' => 'ERROR', 'Message' => 'Debe agregar al menos un ítem'], 422);
        }

        try {
            DB::beginTransaction();

            // Insert cabecera
            $guiaId = DB::table('guia_cabecera')->insertGetId([
                'num_guia'             => $request->num_guia,
                'fecha_emision'        => $request->fecha_emision,
                'fecha_traslado'       => $request->fecha_traslado,
                'ruc_destinatario'     => $request->ruc_destinatario,
                'destino'              => $request->destino,
                'ruc_transportista'    => $request->ruc_transportista ?? '',
                'ruc_conductor'        => $request->ruc_conductor ?? '',
                'placa'                => $request->placa ?? '',
                'comentario'           => $request->comentario ?? '',
                'total_bruto'          => $request->total_bruto ?? 0,
                'total_neto'           => $request->total_neto ?? 0,
                'estado'               => 0,
                'origen'               => $request->origen,
                'ubigeo'               => $request->ubigeo ?? '',
                'ubigeo_destino'       => $request->ubigeo_destino ?? '',
                'modalidad_trasnporte' => str_pad($request->modalidad_trasnporte ?? '01', 2, '0', STR_PAD_LEFT),
                'motivo_traslado'      => str_pad($request->motivo_traslado ?? '01', 2, '0', STR_PAD_LEFT),
                'descripcion_motivo'   => $request->descripcion_motivo ?? '',
            ]);

            // Insert detalle items
            foreach ($items as $item) {
                DB::table('guia_detalle')->insert([
                    'id_guia'             => $guiaId,
                    'id_producto'         => $item['id_producto'],
                    'cantidad'            => $item['cantidad'] ?? 0,
                    'pedido'              => $item['pedido'] ?? '',
                    'unidad'              => $item['unidad'] ?? 'NIU',
                    'descripcion_producto'=> $item['descripcion_producto'] ?? '',
                    't_neto'              => $item['t_neto'] ?? 0,
                    't_bruto'             => $item['t_bruto'] ?? 0,
                ]);
            }

            // Increment aux counter
            DB::table('aux')->where('i', 12)->increment('id');

            DB::commit();

            return response()->json([
                'Result'  => 'OK',
                'Message' => 'Guía registrada correctamente',
                'id'      => $guiaId,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['Result' => 'ERROR', 'Message' => $e->getMessage()], 500);
        }
    }

    public function sendToSunat($id, GuiaRemisionService $service)
    {
        $resultado = $service->procesarGuia($id);

        if (isset($resultado['Result']) && $resultado['Result'] === 'OK') {
            return response()->json($resultado);
        }

        return response()->json($resultado, 500);
    }

    public function update(Request $request, $id)
    {
        $guia = DB::table('guia_cabecera')->where('id', $id)->first();
        if (!$guia) {
            return response()->json(['Result' => 'ERROR', 'Message' => 'Guía de remisión no encontrada'], 404);
        }

        if ($guia->estado == 1) {
            return response()->json([
                'Result' => 'ERROR',
                'Message' => 'No se puede editar una guía que ya ha sido emitida o aceptada por SUNAT'
            ], 422);
        }

        $items = $request->input('items', []);
        if (empty($items)) {
            return response()->json(['Result' => 'ERROR', 'Message' => 'Debe agregar al menos un ítem'], 422);
        }

        try {
            DB::beginTransaction();

            DB::table('guia_cabecera')->where('id', $id)->update([
                'num_guia'             => $request->num_guia ?? $guia->num_guia,
                'fecha_emision'        => $request->fecha_emision,
                'fecha_traslado'       => $request->fecha_traslado,
                'ruc_destinatario'     => $request->ruc_destinatario,
                'destino'              => $request->destino,
                'ruc_transportista'    => $request->ruc_transportista ?? '',
                'ruc_conductor'        => $request->ruc_conductor ?? '',
                'placa'                => $request->placa ?? '',
                'comentario'           => $request->comentario ?? '',
                'total_bruto'          => $request->total_bruto ?? 0,
                'total_neto'           => $request->total_neto ?? 0,
                'origen'               => $request->origen,
                'ubigeo'               => $request->ubigeo ?? '',
                'ubigeo_destino'       => $request->ubigeo_destino ?? '',
                'modalidad_trasnporte' => str_pad($request->modalidad_trasnporte ?? '01', 2, '0', STR_PAD_LEFT),
                'motivo_traslado'      => str_pad($request->motivo_traslado ?? '01', 2, '0', STR_PAD_LEFT),
                'descripcion_motivo'   => $request->descripcion_motivo ?? '',
            ]);

            // Replace items in guia_detalle
            DB::table('guia_detalle')->where('id_guia', $id)->delete();

            foreach ($items as $item) {
                DB::table('guia_detalle')->insert([
                    'id_guia'              => $id,
                    'id_producto'          => $item['id_producto'],
                    'cantidad'             => $item['cantidad'] ?? 0,
                    'pedido'               => $item['pedido'] ?? '',
                    'unidad'               => $item['unidad'] ?? 'NIU',
                    'descripcion_producto' => $item['descripcion_producto'] ?? '',
                    't_neto'               => $item['t_neto'] ?? 0,
                    't_bruto'              => $item['t_bruto'] ?? 0,
                ]);
            }

            DB::commit();

            return response()->json([
                'Result'  => 'OK',
                'Message' => 'Guía de remisión actualizada correctamente',
                'id'      => $id,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['Result' => 'ERROR', 'Message' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $guia = DB::table('guia_cabecera')->where('id', $id)->first();
        if (!$guia) {
            return response()->json(['Result' => 'ERROR', 'Message' => 'Guía no encontrada'], 404);
        }

        if ($guia->estado == 1) {
            return response()->json([
                'Result' => 'ERROR',
                'Message' => 'No se puede eliminar una guía que ya ha sido emitida o aceptada por SUNAT'
            ], 422);
        }

        try {
            DB::beginTransaction();
            DB::table('guia_detalle')->where('id_guia', $id)->delete();
            DB::table('guia_cabecera')->where('id', $id)->delete();
            DB::commit();
            return response()->json(['Result' => 'OK']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['Result' => 'ERROR', 'Message' => $e->getMessage()], 500);
        }
    }
}
