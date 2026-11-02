<?php

namespace App\Http\Controllers;

use App\Models\Almacen;
use App\Models\NotaAlmacen;
use App\Models\NotaAlmacenDetalle;
use App\Models\Operation;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Notas de Ingreso (NI) y Notas de Salida (NS) de almacén.
 * Son los documentos que mueven el stock y el kardex (tabla operation).
 */
class NotaAlmacenController extends Controller
{
    public const MOTIVOS = [
        NotaAlmacen::INGRESO => [
            'Compra',
            'Devolución de cliente',
            'Traslado entre almacenes',
            'Inventario inicial',
            'Ajuste de inventario',
            'Otros',
        ],
        NotaAlmacen::SALIDA => [
            'Venta',
            'Consumo interno',
            'Traslado entre almacenes',
            'Merma / Pérdida',
            'Devolución a proveedor',
            'Ajuste de inventario',
            'Otros',
        ],
    ];

    private const SERIES = [NotaAlmacen::INGRESO => 'NI', NotaAlmacen::SALIDA => 'NS'];

    // operation_type: 1 = entrada, 2 = salida
    private const TIPO_OPERACION = [NotaAlmacen::INGRESO => 1, NotaAlmacen::SALIDA => 2];

    public function index(Request $request)
    {
        $query = NotaAlmacen::with('almacen')->withCount('detalles');

        if ($request->filled('tipo')) {
            $query->where('tipo', strtoupper($request->tipo));
        }
        if ($request->filled('desde')) {
            $query->whereDate('fecha', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha', '<=', $request->hasta);
        }
        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where(DB::raw("CONCAT(serie, '-', LPAD(numero, 8, '0'))"), 'like', "%{$s}%")
                  ->orWhere('motivo', 'like', "%{$s}%")
                  ->orWhere('persona', 'like', "%{$s}%")
                  ->orWhere('area', 'like', "%{$s}%")
                  ->orWhere('doc_referencia', 'like', "%{$s}%");
            });
        }

        return response()->json($query->orderBy('fecha', 'desc')->orderBy('id', 'desc')->paginate(20));
    }

    /**
     * Datos para el formulario: almacenes, motivos y el próximo número de cada tipo.
     */
    public function formData()
    {
        return response()->json([
            'almacenes' => Almacen::orderByDesc('is_principal')->orderBy('name')->get(['id', 'name', 'is_principal']),
            'motivos' => self::MOTIVOS,
            'siguiente' => [
                NotaAlmacen::INGRESO => $this->codigoSiguiente(NotaAlmacen::INGRESO),
                NotaAlmacen::SALIDA => $this->codigoSiguiente(NotaAlmacen::SALIDA),
            ],
        ]);
    }

    public function show($id)
    {
        return response()->json(NotaAlmacen::with(['almacen', 'detalles.producto'])->findOrFail($id));
    }

    public function store(Request $request)
    {
        $tipo = strtoupper((string) $request->tipo);

        $this->validate($request, [
            'tipo' => ['required', Rule::in(['INGRESO', 'SALIDA', 'ingreso', 'salida'])],
            'fecha' => 'required|date',
            'id_almacen' => 'required|integer|exists:stock,id',
            'motivo' => ['required', 'string', Rule::in(self::MOTIVOS[$tipo] ?? [])],
            'detalle_motivo' => 'nullable|string|max:255',
            'area' => 'nullable|string|max:255',
            'doc_referencia' => 'nullable|string|max:100',
            'persona' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            'detalles.*.id_producto' => 'required|integer|exists:productos,id',
            'detalles.*.cantidad' => 'required|numeric|gt:0',
            'detalles.*.unidad' => 'nullable|string|max:20',
            'detalles.*.observacion' => 'nullable|string|max:255',
        ], [
            'motivo.in' => 'El motivo seleccionado no es válido para este tipo de nota.',
            'detalles.required' => 'Agregue al menos un producto.',
            'detalles.*.cantidad.gt' => 'La cantidad de cada producto debe ser mayor a 0.',
        ]);

        DB::beginTransaction();
        try {
            // Bloquea los productos involucrados para que dos notas simultáneas no lean el mismo stock
            $cantidadesPorProducto = [];
            foreach ($request->detalles as $det) {
                $cantidadesPorProducto[$det['id_producto']] = ($cantidadesPorProducto[$det['id_producto']] ?? 0) + (float) $det['cantidad'];
            }
            $productos = Producto::whereIn('id', array_keys($cantidadesPorProducto))->lockForUpdate()->get()->keyBy('id');

            if ($tipo === NotaAlmacen::SALIDA) {
                $faltantes = [];
                foreach ($cantidadesPorProducto as $idProducto => $cantidad) {
                    $p = $productos[$idProducto];
                    if ((float) $p->stock < $cantidad) {
                        $faltantes[] = "{$p->codigo} - {$p->nombre}: stock {$p->stock}, se intenta retirar {$cantidad}";
                    }
                }
                if ($faltantes) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'Stock insuficiente',
                        'message' => "No hay stock suficiente para:\n" . implode("\n", $faltantes),
                    ], 422);
                }
            }

            $serie = self::SERIES[$tipo];
            $numero = (int) NotaAlmacen::where('serie', $serie)->lockForUpdate()->max('numero') + 1;

            $nota = NotaAlmacen::create([
                'tipo' => $tipo,
                'serie' => $serie,
                'numero' => $numero,
                'fecha' => $request->fecha,
                'id_almacen' => $request->id_almacen,
                'area' => $request->area,
                'doc_referencia' => $request->doc_referencia,
                'persona' => $request->persona,
                'motivo' => $request->motivo,
                'detalle_motivo' => $request->detalle_motivo,
                'observaciones' => $request->observaciones,
                'estado' => 1,
                'id_usuario' => $this->idUsuario($request),
            ]);

            $signo = $tipo === NotaAlmacen::INGRESO ? 1 : -1;
            foreach ($request->detalles as $det) {
                $producto = $productos[$det['id_producto']];
                $cantidad = (float) $det['cantidad'];

                NotaAlmacenDetalle::create([
                    'id_nota' => $nota->id,
                    'id_producto' => $producto->id,
                    'descripcion' => $producto->nombre,
                    'cantidad' => $cantidad,
                    'unidad' => $det['unidad'] ?? $producto->unidad_medida,
                    'observacion' => $det['observacion'] ?? null,
                ]);

                $producto->stock = (float) $producto->stock + $signo * $cantidad;
                $producto->fecha_actualizacion = date('Y-m-d');
                $producto->save();

                $costo = (float) $producto->precio_compra;
                Operation::create([
                    'product_id' => $producto->id,
                    'stock_id' => $nota->id_almacen,
                    'q' => $cantidad,
                    'price_in' => $signo > 0 ? $costo : 0,
                    'price_out' => $signo < 0 ? $costo : 0,
                    'operation_type_id' => self::TIPO_OPERACION[$tipo],
                    'id_nota_almacen' => $nota->id,
                    'status' => 1,
                    'is_draft' => 0,
                    'is_traspase' => 0,
                    'created_at' => $nota->fecha . ' ' . date('H:i:s'),
                ]);
            }

            DB::commit();
            return response()->json($nota->load(['almacen', 'detalles.producto']), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar la nota', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Anula la nota: revierte el stock y desactiva sus movimientos en el kardex.
     */
    public function anular($id)
    {
        DB::beginTransaction();
        try {
            $nota = NotaAlmacen::with('detalles')->lockForUpdate()->findOrFail($id);
            if ((int) $nota->estado === 0) {
                DB::rollBack();
                return response()->json(['error' => 'La nota ya está anulada'], 400);
            }

            $productos = Producto::whereIn('id', $nota->detalles->pluck('id_producto'))->lockForUpdate()->get()->keyBy('id');

            // Anular un ingreso retira stock: no permitir que quede negativo
            if ($nota->tipo === NotaAlmacen::INGRESO) {
                $faltantes = [];
                foreach ($nota->detalles->groupBy('id_producto') as $idProducto => $dets) {
                    $p = $productos[$idProducto] ?? null;
                    $cantidad = (float) $dets->sum('cantidad');
                    if ($p && (float) $p->stock < $cantidad) {
                        $faltantes[] = "{$p->codigo} - {$p->nombre}: stock {$p->stock}, la nota ingresó {$cantidad}";
                    }
                }
                if ($faltantes) {
                    DB::rollBack();
                    return response()->json([
                        'error' => 'No se puede anular',
                        'message' => "Parte de lo ingresado ya salió del almacén:\n" . implode("\n", $faltantes),
                    ], 422);
                }
            }

            $signo = $nota->tipo === NotaAlmacen::INGRESO ? -1 : 1; // lo inverso a lo que hizo la nota
            foreach ($nota->detalles as $det) {
                $p = $productos[$det->id_producto] ?? null;
                if ($p) {
                    $p->stock = (float) $p->stock + $signo * (float) $det->cantidad;
                    $p->fecha_actualizacion = date('Y-m-d');
                    $p->save();
                }
            }

            Operation::where('id_nota_almacen', $nota->id)->update(['status' => 0]);

            $nota->estado = 0;
            $nota->save();

            DB::commit();
            return response()->json(['success' => true, 'message' => "Nota {$nota->codigo} anulada."]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al anular la nota', 'message' => $e->getMessage()], 500);
        }
    }

    public function pdf($id)
    {
        $nota = NotaAlmacen::with(['almacen', 'detalles.producto'])->findOrFail($id);
        $h = \App\Services\PdfComprobanteHelper::class;
        $c = $h::COLOR;
        $esSalida = $nota->tipo === NotaAlmacen::SALIDA;

        // Etiquetas según el tipo (la plantilla es la de la nota de salida)
        $titulo = $esSalida ? 'NOTA DE SALIDA' : 'NOTA DE INGRESO';
        $lblAlmacen = $esSalida ? 'Almacén de origen:' : 'Almacén de destino:';
        $lblArea = $esSalida ? 'Destino / Área:' : 'Procedencia:';
        $lblPersona = $esSalida ? 'Entregado a:' : 'Recibido de:';
        $firmas = $esSalida
            ? ['DESPACHADO POR', 'AUTORIZADO POR', 'RECIBIDO POR']
            : ['ENTREGADO POR', 'AUTORIZADO POR', 'RECIBIDO POR'];

        $v = fn ($x) => e((string) ($x ?? ''));
        $logo = $h::logoSrc();

        $campo = fn ($label, $valor, $sombreado = false) =>
            '<td class="lbl">' . $label . '</td>'
            . '<td class="val' . ($sombreado ? ' sombra' : '') . '">' . $valor . '</td>';

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>'
            . '@page{margin: 28px 32px;}'
            . 'body{font-family: Helvetica, Arial, sans-serif; font-size: 10px; color:#222; margin:0;}'
            . 'table{border-collapse: collapse; width:100%;}'
            . 'td,th{vertical-align: middle;}'
            . '.datos td{padding: 4px 4px; border-bottom: 1px solid #d0d3d8;}'
            . '.datos .lbl{font-weight:bold; width: 17%; white-space: nowrap;}'
            . '.datos .val{width: 33%;}'
            . '.datos .sombra{background:#eef0f3;}'
            . '.items th{background:' . $c . '; color:#fff; padding:5px 4px; font-size:10px; border:1px solid #222;}'
            . '.items td{border:1px solid #222; padding:3px 4px; height:14px; font-size:9.5px;}'
            . '.firma{width:33%; text-align:center; font-size:9px; padding-top:4px;}'
            . '.anulada{position:fixed; top:330px; left:0; right:0; text-align:center; font-size:90px; color:rgba(200,0,0,0.15); font-weight:bold; transform: rotate(-30deg);}'
            . '</style></head><body>'

            . ((int) $nota->estado === 0 ? '<div class="anulada">ANULADA</div>' : '')

            // Encabezado
            . '<table style="margin-bottom:10px;"><tr>'
            . '<td style="width:70%;">'
            . '<div style="font-size:14px; font-weight:bold; color:' . $c . '; margin-bottom:6px;">' . $h::RAZON_SOCIAL . '</div>'
            . '<div style="color:#555; margin-bottom:6px;">RUC: ' . $h::RUC . '</div>'
            . '<div style="color:#555;">' . $h::EMAIL . '</div>'
            . '</td>'
            . '<td style="width:30%; text-align:right;">' . ($logo ? '<img src="' . $logo . '" style="width:95px;"/>' : '') . '</td>'
            . '</tr></table>'

            // Banda de título
            . '<div style="background:' . $c . '; color:#fff; text-align:center; font-size:13px; font-weight:bold; padding:6px; margin-bottom:6px;">' . $titulo . '</div>'

            // Datos de la nota
            . '<table class="datos" style="margin-bottom:12px;">'
            . '<tr>' . $campo('N° de nota:', $v($nota->codigo)) . $campo('Fecha:', $h::fecha($nota->fecha)) . '</tr>'
            . '<tr>' . $campo($lblAlmacen, $v($nota->almacen->name ?? '')) . $campo('Doc. referencia:', $v($nota->doc_referencia)) . '</tr>'
            . '<tr>' . $campo($lblArea, $v($nota->area)) . $campo($lblPersona, $v($nota->persona)) . '</tr>'
            . '<tr><td class="lbl">Motivo:</td><td class="val sombra" colspan="3">' . $v($nota->motivo) . '</td></tr>'
            . '<tr><td class="lbl">Detalle del motivo:</td><td class="val" colspan="3">' . $v($nota->detalle_motivo) . '</td></tr>'
            . '</table>'

            // Ítems
            . '<table class="items">'
            . '<tr>'
            . '<th style="width:5%;">ITE</th>'
            . '<th style="width:15%;">Código</th>'
            . '<th>Descripción del producto</th>'
            . '<th style="width:10%;">Cantidad</th>'
            . '<th style="width:8%;">Und</th>'
            . '<th style="width:22%;">Observación</th>'
            . '</tr>';

        $filas = max(16, $nota->detalles->count());
        for ($i = 0; $i < $filas; $i++) {
            $d = $nota->detalles[$i] ?? null;
            $html .= '<tr>'
                . '<td style="text-align:center;">' . ($i + 1) . '</td>'
                . '<td style="text-align:center;">' . ($d ? $v($d->producto->codigo ?? '') : '') . '</td>'
                . '<td>' . ($d ? $v($d->descripcion ?: ($d->producto->nombre ?? '')) : '') . '</td>'
                . '<td style="text-align:center;">' . ($d ? rtrim(rtrim(number_format((float) $d->cantidad, 2, '.', ''), '0'), '.') : '') . '</td>'
                . '<td style="text-align:center;">' . ($d ? $v($d->unidad) : '') . '</td>'
                . '<td>' . ($d ? $v($d->observacion) : '') . '</td>'
                . '</tr>';
        }

        $html .= '</table>'

            // Observaciones
            . '<div style="border:1px solid #222; margin-top:14px; padding:5px 6px; height:48px;">'
            . '<b>Observaciones:</b><br/>' . nl2br($v($nota->observaciones))
            . '</div>'
            . '<div style="font-size:8px; font-style:italic; color:#444; margin-top:3px;">Documento de uso interno para control de almacén.</div>'

            // Firmas
            . '<table style="margin-top:60px;"><tr>';
        foreach ($firmas as $f) {
            $html .= '<td class="firma">'
                . '<div style="border-top:1px solid #222; width:80%; margin:0 auto 4px auto;"></div>'
                . '<div style="font-size:10px; font-weight:bold;">Firma y nombre</div>'
                . '<div style="margin:3px 0;">' . $f . '</div>'
                . '<div>DNI: ____________________</div>'
                . '<div style="margin-top:3px;">Fecha: ____/____/________</div>'
                . '</td>';
        }
        $html .= '</tr></table></body></html>';

        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $nota->codigo . '.pdf"',
        ]);
    }

    private function codigoSiguiente(string $tipo): string
    {
        $serie = self::SERIES[$tipo];
        $numero = (int) NotaAlmacen::where('serie', $serie)->max('numero') + 1;
        return $serie . '-' . str_pad((string) $numero, 8, '0', STR_PAD_LEFT);
    }

    private function idUsuario(Request $request): ?int
    {
        $token = $request->bearerToken();
        if (!$token) {
            return null;
        }
        $id = DB::table('user')->where('api_token', $token)->value('id');
        return $id ? (int) $id : null;
    }
}
