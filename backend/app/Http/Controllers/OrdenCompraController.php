<?php

namespace App\Http\Controllers;

use App\Models\OrdenCompra;
use App\Models\OrdenCompraDetalle;
use App\Models\Producto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Órdenes de compra (OC-0001). Se crean con lo solicitado; el proveedor, la fecha y el
 * precio de cada ítem se completan después, al realizar la compra.
 * Cuando todos los ítems tienen precio, la orden pasa a ATENDIDA.
 */
class OrdenCompraController extends Controller
{
    public const TIPOS_COMPRA = [
        'CATALOGO' => 'Catálogo de productos',
        'SUMINISTROS' => 'Suministros',
        'AGASAJOS' => 'Agasajos',
    ];

    public function index(Request $request)
    {
        $query = OrdenCompra::withCount('detalles');

        if ($request->filled('tipo_compra')) {
            $query->where('tipo_compra', strtoupper($request->tipo_compra));
        }
        if ($request->filled('estado')) {
            $query->where('estado', strtoupper($request->estado));
        }
        if ($request->filled('desde')) {
            $query->whereDate('fecha_emision', '>=', $request->desde);
        }
        if ($request->filled('hasta')) {
            $query->whereDate('fecha_emision', '<=', $request->hasta);
        }
        if ($request->filled('search')) {
            $s = trim($request->search);
            $numero = (int) preg_replace('/\D/', '', $s);
            $query->where(function ($q) use ($s, $numero) {
                $q->where('solicitante', 'like', "%{$s}%")
                  ->orWhere('area', 'like', "%{$s}%")
                  ->orWhere('lugar_entrega', 'like', "%{$s}%");
                if ($numero > 0) {
                    $q->orWhere('numero', $numero);
                }
            });
        }

        return response()->json($query->orderBy('fecha_emision', 'desc')->orderBy('id', 'desc')->paginate(20));
    }

    public function siguiente()
    {
        $numero = (int) OrdenCompra::max('numero') + 1;
        return response()->json(['codigo' => 'OC-' . str_pad((string) $numero, 4, '0', STR_PAD_LEFT)]);
    }

    public function show($id)
    {
        return response()->json(OrdenCompra::with('detalles.producto')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $this->validarOrden($request);

        DB::beginTransaction();
        try {
            $numero = (int) OrdenCompra::lockForUpdate()->max('numero') + 1;

            $orden = OrdenCompra::create(array_merge($this->datosCabecera($request), [
                'numero' => $numero,
                'estado' => OrdenCompra::PENDIENTE,
                'id_usuario' => $this->idUsuario($request),
            ]));
            $this->guardarDetalles($orden, $request);

            DB::commit();
            return response()->json($orden->load('detalles'), 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al registrar la orden de compra', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Permite completar proveedor, fecha de compra y precio de cada ítem (o corregir la orden).
     */
    public function update(Request $request, $id)
    {
        $orden = OrdenCompra::findOrFail($id);
        if ($orden->estado === OrdenCompra::ANULADA) {
            return response()->json(['error' => 'No se puede editar una orden anulada'], 400);
        }

        $this->validarOrden($request);

        DB::beginTransaction();
        try {
            $orden->update($this->datosCabecera($request));
            $orden->detalles()->delete();
            $this->guardarDetalles($orden, $request);

            DB::commit();
            return response()->json($orden->fresh('detalles'));
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al actualizar la orden de compra', 'message' => $e->getMessage()], 500);
        }
    }

    public function anular($id)
    {
        $orden = OrdenCompra::findOrFail($id);
        if ($orden->estado === OrdenCompra::ANULADA) {
            return response()->json(['error' => 'La orden ya está anulada'], 400);
        }
        $orden->estado = OrdenCompra::ANULADA;
        $orden->save();

        return response()->json(['success' => true, 'message' => "Orden {$orden->codigo} anulada."]);
    }

    private function validarOrden(Request $request): void
    {
        $esCatalogo = strtoupper((string) $request->tipo_compra) === 'CATALOGO';

        $this->validate($request, [
            'tipo_compra' => 'required|in:' . implode(',', array_keys(self::TIPOS_COMPRA)),
            'fecha_emision' => 'required|date',
            'solicitante' => 'required|string|max:150',
            'area' => 'nullable|string|max:150',
            'fecha_requerida' => 'nullable|date',
            'lugar_entrega' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'detalles' => 'required|array|min:1',
            // Catálogo: producto obligatorio. Suministros / Agasajos: descripción manual
            'detalles.*.id_producto' => $esCatalogo ? 'required|exists:productos,id' : 'nullable',
            'detalles.*.descripcion' => $esCatalogo ? 'nullable|string|max:255' : 'required|string|max:255',
            'detalles.*.cantidad' => 'required|numeric|gt:0',
            'detalles.*.unidad' => 'nullable|string|max:20',
            'detalles.*.proveedor' => 'nullable|string|max:255',
            'detalles.*.fecha_compra' => 'nullable|date',
            'detalles.*.precio_unitario' => 'nullable|numeric|min:0',
        ], [
            'detalles.required' => 'Agregue al menos un ítem.',
            'detalles.*.descripcion.required' => 'Ingrese la descripción de cada ítem.',
            'detalles.*.id_producto.required' => 'Seleccione un producto del catálogo en cada ítem.',
            'detalles.*.cantidad.gt' => 'La cantidad de cada ítem debe ser mayor a 0.',
        ]);
    }

    private function datosCabecera(Request $request): array
    {
        return [
            'tipo_compra' => strtoupper($request->tipo_compra),
            'fecha_emision' => $request->fecha_emision,
            'solicitante' => trim($request->solicitante),
            'area' => $request->area,
            'fecha_requerida' => $request->fecha_requerida ?: null,
            'lugar_entrega' => $request->lugar_entrega,
            'observaciones' => $request->observaciones,
        ];
    }

    private function guardarDetalles(OrdenCompra $orden, Request $request): void
    {
        $esCatalogo = $orden->tipo_compra === 'CATALOGO';
        $total = 0;
        $todosConPrecio = true;

        foreach ($request->detalles as $det) {
            $producto = $esCatalogo ? Producto::find($det['id_producto']) : null;
            $cantidad = (float) $det['cantidad'];
            $precio = isset($det['precio_unitario']) && $det['precio_unitario'] !== '' && $det['precio_unitario'] !== null
                ? (float) $det['precio_unitario'] : null;
            $totalItem = $precio !== null ? round($cantidad * $precio, 2) : null;

            OrdenCompraDetalle::create([
                'id_orden' => $orden->id,
                'id_producto' => $producto?->id,
                'descripcion' => $producto ? $producto->nombre : trim($det['descripcion']),
                'cantidad' => $cantidad,
                'unidad' => $det['unidad'] ?? ($producto->unidad_medida ?? 'UND'),
                'proveedor' => $det['proveedor'] ?? null,
                'fecha_compra' => ($det['fecha_compra'] ?? null) ?: null,
                'precio_unitario' => $precio,
                'total' => $totalItem,
            ]);

            $total += $totalItem ?? 0;
            $todosConPrecio = $todosConPrecio && $precio !== null;
        }

        $orden->total = round($total, 2);
        $orden->estado = $todosConPrecio ? OrdenCompra::ATENDIDA : OrdenCompra::PENDIENTE;
        $orden->save();
    }

    public function pdf($id)
    {
        $orden = OrdenCompra::with('detalles')->findOrFail($id);
        $h = \App\Services\PdfComprobanteHelper::class;
        $c = $h::COLOR;
        $v = fn ($x) => e((string) ($x ?? ''));
        $logo = $h::logoSrc();
        $num = fn ($n) => $n === null ? '' : number_format((float) $n, 2);
        $cant = fn ($n) => rtrim(rtrim(number_format((float) $n, 2, '.', ''), '0'), '.');

        $campo = fn ($label, $valor) => '<td class="lbl">' . $label . '</td><td class="val">' . $valor . '</td>';

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"/><style>'
            . '@page{margin: 26px 30px;}'
            . 'body{font-family: Helvetica, Arial, sans-serif; font-size: 10px; color:#222; margin:0;}'
            . 'table{border-collapse: collapse; width:100%;}'
            . 'td,th{vertical-align: middle;}'
            . '.datos td{padding: 5px 4px; border-bottom: 1px solid #d0d3d8;}'
            . '.datos .lbl{font-weight:bold; width: 22%;}'
            . '.datos .val{width: 28%;}'
            . '.items th{background:' . $c . '; color:#fff; padding:5px 4px; font-size:9.5px; border:1px solid #222;}'
            . '.items td{border:1px solid #222; padding:4px; height:13px; font-size:9.5px;}'
            . '.firma{text-align:center; font-size:9px; vertical-align: bottom;}'
            . '.anulada{position:fixed; top:300px; left:0; right:0; text-align:center; font-size:90px; color:rgba(200,0,0,0.15); font-weight:bold; transform: rotate(-30deg);}'
            . '</style></head><body>'

            . ($orden->estado === OrdenCompra::ANULADA ? '<div class="anulada">ANULADA</div>' : '')

            . '<div style="background:' . $c . '; color:#fff; text-align:center; font-size:14px; font-weight:bold; padding:7px; margin-bottom:12px;">ORDEN DE COMPRA</div>'

            . '<table class="datos" style="margin-bottom:14px;">'
            . '<tr>' . $campo('Orden N°:', $v($orden->codigo)) . $campo('Fecha de emisión:', $h::fecha($orden->fecha_emision)) . '</tr>'
            . '<tr>' . $campo('Solicitante:', $v($orden->solicitante)) . $campo('Área:', $v($orden->area)) . '</tr>'
            . '<tr>' . $campo('Fecha requerida de entrega:', $orden->fecha_requerida ? $h::fecha($orden->fecha_requerida) : '') . $campo('Lugar de entrega:', $v($orden->lugar_entrega)) . '</tr>'
            . '<tr>' . $campo('Tipo de compra:', $v(self::TIPOS_COMPRA[$orden->tipo_compra] ?? $orden->tipo_compra)) . '<td></td><td></td></tr>'
            . '</table>'

            . '<table class="items">'
            . '<tr>'
            . '<th style="width:4%;">ITE</th>'
            . '<th>Descripción</th>'
            . '<th style="width:7%;">Cantidad</th>'
            . '<th style="width:6%;">Und</th>'
            . '<th style="width:20%;">Proveedor / Lugar de compra</th>'
            . '<th style="width:10%;">Fecha de compra</th>'
            . '<th style="width:9%;">Precio Unit. (S/)</th>'
            . '<th style="width:10%;">Total (S/)</th>'
            . '</tr>';

        $filas = max(10, $orden->detalles->count());
        for ($i = 0; $i < $filas; $i++) {
            $d = $orden->detalles[$i] ?? null;
            $html .= '<tr>'
                . '<td style="text-align:center;">' . ($i + 1) . '</td>'
                . '<td>' . ($d ? $v($d->descripcion) : '') . '</td>'
                . '<td style="text-align:center;">' . ($d ? $cant($d->cantidad) : '') . '</td>'
                . '<td style="text-align:center;">' . ($d ? $v($d->unidad) : '') . '</td>'
                . '<td>' . ($d ? $v($d->proveedor) : '') . '</td>'
                . '<td style="text-align:center;">' . ($d && $d->fecha_compra ? $h::fecha($d->fecha_compra) : '') . '</td>'
                . '<td style="text-align:right;">' . ($d ? $num($d->precio_unitario) : '') . '</td>'
                . '<td style="text-align:right;">' . ($d ? $num($d->total) : '') . '</td>'
                . '</tr>';
        }

        $hayPrecios = $orden->detalles->whereNotNull('precio_unitario')->count() > 0;
        $html .= '<tr>'
            . '<td colspan="7" style="background:' . $c . '; color:#fff; text-align:right; font-weight:bold; border:1px solid ' . $c . ';">TOTAL S/:</td>'
            . '<td style="text-align:right; font-weight:bold;">' . ($hayPrecios ? $num($orden->total) : '') . '</td>'
            . '</tr>'
            . '</table>'

            . '<div style="border:1px solid #222; margin-top:16px; padding:5px 6px; height:52px;">'
            . '<b>Observaciones:</b><br/>' . nl2br($v($orden->observaciones))
            . '</div>'
            . '<div style="font-size:8px; font-style:italic; color:#444; margin-top:3px;">Nota: Documento de uso interno. Al reverso se adjuntan los comprobantes de pago de las compras realizadas.</div>'

            // Firmas con el logo al centro
            . '<table style="margin-top:50px;"><tr>'
            . '<td class="firma" style="width:38%;">'
            . '<div style="border-top:1px solid #222; margin:0 10px 4px 10px;"></div>'
            . '<div style="font-size:10px; font-weight:bold;">Firma y nombre</div>'
            . '<div style="margin:3px 0 8px 0;">ORDENADO POR</div>'
            . '<div>DNI: ________________ &nbsp; Fecha: ____/____/______</div>'
            . '</td>'
            . '<td style="width:24%; text-align:center; vertical-align: middle;">' . ($logo ? '<img src="' . $logo . '" style="width:110px;"/>' : '') . '</td>'
            . '<td class="firma" style="width:38%;">'
            . '<div style="border-top:1px solid #222; margin:0 10px 4px 10px;"></div>'
            . '<div style="font-size:10px; font-weight:bold;">Firma y nombre</div>'
            . '<div style="margin:3px 0 8px 0;">COMPRA REALIZADA POR</div>'
            . '<div>DNI: ________________ &nbsp; Fecha: ____/____/______</div>'
            . '</td>'
            . '</tr></table>'
            . '</body></html>';

        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="' . $orden->codigo . '.pdf"',
        ]);
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
