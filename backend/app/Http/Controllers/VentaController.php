<?php

namespace App\Http\Controllers;

use App\Models\Venta;
use App\Models\VentaDetalle;
use App\Models\Cliente;
use App\Services\GreenterService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    public function index(Request $request)
    {
        $query = Venta::with(['cliente', 'detalles.producto']);

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('serie', 'like', "%{$search}%")
                  ->orWhere('correlativo', 'like', "%{$search}%")
                  ->orWhere(\Illuminate\Support\Facades\DB::raw("CONCAT(serie, '-', correlativo)"), 'like', "%{$search}%")
                  ->orWhereHas('cliente', function($qc) use ($search) {
                      $qc->where('razon_social', 'like', "%{$search}%")
                         ->orWhere('ruc', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('fecha_desde') && $request->fecha_desde != '') {
            $query->whereDate('fecha_emision', '>=', $request->fecha_desde);
        }

        if ($request->has('fecha_hasta') && $request->fecha_hasta != '') {
            $query->whereDate('fecha_emision', '<=', $request->fecha_hasta);
        }

        if ($request->has('estado_sunat') && $request->estado_sunat != '') {
            $query->where('envio_sunat', $request->estado_sunat);
        }

        $ventas = $query->orderBy('id', 'desc')->paginate(20);
        return response()->json($ventas);
    }

    public function show($id)
    {
        $venta = Venta::with(['cliente', 'detalles.producto', 'cuotas'])->findOrFail($id);
        return response()->json($venta);
    }

    public function proximoCorrelativo($serie)
    {
        $max = Venta::where('serie', $serie)->max('correlativo');
        return response()->json(['correlativo' => $max ? $max + 1 : 1]);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'id_cliente' => 'required|exists:clientes,id',
            'tipo_documento' => 'required|in:01,03',
            'serie' => 'required|string',
            'correlativo' => 'required|numeric',
            'fecha_emision' => 'required|date',
            'subtotal' => 'required|numeric',
            'igv' => 'required|numeric',
            'total' => 'required|numeric',
            'detalles' => 'required|array',
        ]);

        DB::beginTransaction();

        try {
            $venta = Venta::create([
                'id_cliente' => $request->id_cliente,
                'id_orden_pedido' => $request->id_orden_pedido ?? null,
                'id_forma_pago' => $request->id_forma_pago ?? null,
                'id_estado_pago' => $request->id_estado_pago ?? null,
                'id_estado_entrega' => $request->id_estado_entrega ?? null,
                'descuento' => $request->descuento ?? 0.00,
                'desc_descuento' => $request->desc_descuento ?? null,
                'incluye_igv' => $request->incluye_igv ? 1 : 0,
                'tipo_documento' => $request->tipo_documento,
                'serie' => $request->serie,
                'correlativo' => $request->correlativo,
                'fecha_emision' => $request->fecha_emision,
                'fecha_vencimiento' => $request->fecha_vencimiento ?? $request->fecha_emision,
                'moneda' => 'PEN',
                'subtotal' => $request->subtotal,
                'igv' => $request->igv,
                'total' => $request->total,
                'estado' => 'Emitida',
            ]);

            foreach ($request->detalles as $det) {
                VentaDetalle::create([
                    'id_venta' => $venta->id,
                    'id_producto' => $det['id_producto'],
                    'descripcion_personalizada' => $det['descripcion_personalizada'] ?? null,
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'total' => $det['total'],
                ]);

                // Descontar stock del producto y registrar salida en Kardex
                $producto = Producto::find($det['id_producto']);
                if ($producto) {
                    $producto->stock = max(0, floatval($producto->stock) - floatval($det['cantidad']));
                    $producto->fecha_actualizacion = date('Y-m-d H:i:s');
                    $producto->save();
                }

                \App\Models\Operation::create([
                    'product_id' => $det['id_producto'],
                    'stock_id' => 1,
                    'q' => $det['cantidad'],
                    'price_in' => 0,
                    'price_out' => $det['precio_unitario'],
                    'operation_type_id' => 2, // 2: Salida por Venta
                    'sell_id' => $venta->id,
                    'status' => 1,
                    'is_draft' => 0,
                    'is_traspase' => 0,
                    'created_at' => $venta->fecha_emision . ' ' . date('H:i:s'),
                ]);
            }

            if ($request->id_forma_pago == 2 && !empty($request->cuotas)) {
                foreach ($request->cuotas as $cuota) {
                    \App\Models\VentaCuota::create([
                        'id_venta' => $venta->id,
                        'monto' => $cuota['monto'],
                        'fecha_pago' => $cuota['fecha_pago']
                    ]);
                }
            }

            DB::commit();
            return response()->json($venta, 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al generar la venta', 'msg' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $venta = Venta::findOrFail($id);
        
        if ($venta->envio_sunat == 1) {
            return response()->json(['error' => 'No se puede editar una venta ya enviada a SUNAT'], 400);
        }

        DB::beginTransaction();
        try {
            $venta->update([
                'id_cliente' => $request->id_cliente,
                'id_orden_pedido' => $request->id_orden_pedido ?? null,
                'id_forma_pago' => $request->id_forma_pago ?? null,
                'id_estado_pago' => $request->id_estado_pago ?? null,
                'id_estado_entrega' => $request->id_estado_entrega ?? null,
                'descuento' => $request->descuento ?? 0.00,
                'desc_descuento' => $request->desc_descuento ?? null,
                'incluye_igv' => $request->incluye_igv ? 1 : 0,
                'tipo_documento' => $request->tipo_documento,
                'serie' => $request->serie,
                'correlativo' => $request->correlativo,
                'fecha_emision' => $request->fecha_emision,
                'fecha_vencimiento' => $request->fecha_vencimiento ?? $request->fecha_emision,
                'subtotal' => $request->subtotal,
                'igv' => $request->igv,
                'total' => $request->total,
            ]);

            VentaDetalle::where('id_venta', $venta->id)->delete();
            foreach ($request->detalles as $det) {
                VentaDetalle::create([
                    'id_venta' => $venta->id,
                    'id_producto' => $det['id_producto'],
                    'descripcion_personalizada' => $det['descripcion_personalizada'] ?? null,
                    'cantidad' => $det['cantidad'],
                    'precio_unitario' => $det['precio_unitario'],
                    'total' => $det['total'],
                ]);
            }

            \App\Models\VentaCuota::where('id_venta', $venta->id)->delete();
            if ($request->id_forma_pago == 2 && !empty($request->cuotas)) {
                foreach ($request->cuotas as $cuota) {
                    \App\Models\VentaCuota::create([
                        'id_venta' => $venta->id,
                        'monto' => $cuota['monto'],
                        'fecha_pago' => $cuota['fecha_pago']
                    ]);
                }
            }

            DB::commit();
            return response()->json($venta, 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al editar la venta', 'msg' => $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        $venta = Venta::findOrFail($id);
        if ($venta->envio_sunat == 1) {
            return response()->json(['error' => 'No se puede eliminar una venta ya enviada a SUNAT'], 400);
        }
        $venta->delete();
        return response()->json(['success' => true]);
    }

    public function enviarSunat($id)
    {
        $venta = Venta::findOrFail($id);

        if ($venta->envio_sunat == 1) {
            return response()->json(['error' => 'Esta venta ya fue enviada a SUNAT'], 400);
        }

        try {
            $greenter = new GreenterService();
            $cliente = Cliente::find($venta->id_cliente);
            $detallesObj = VentaDetalle::with('producto')->where('id_venta', $venta->id)->get();
            
            $sunatRes = $greenter->emitirFactura($venta, $cliente, $detallesObj);

            if ($sunatRes['success']) {
                $venta->envio_sunat = 1;
                $venta->xml_path = $sunatRes['xml_path'];
                $venta->cdr_path = $sunatRes['cdr_path'];
                $venta->save();
                return response()->json(['success' => true, 'msg' => 'Factura enviada a SUNAT correctamente']);
            } else {
                $venta->sunat_hash = 'ERROR: ' . $sunatRes['errorMsg'];
                $venta->save();
                return response()->json(['error' => 'Rechazado por SUNAT', 'msg' => $sunatRes['errorMsg']], 400);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al enviar a SUNAT', 'msg' => $e->getMessage()], 500);
        }
    }

    public function descargarPdf($id)
    {
        $venta = Venta::with(['cliente', 'detalles.producto', 'cuotas'])->findOrFail($id);
        
        $logoPath = base_path("public/img/logo-4.png");
        if (file_exists($logoPath)) {
            $logoBase64 = base64_encode(file_get_contents($logoPath));
            $logoSrc = 'data:image/png;base64,' . $logoBase64;
        } else {
            $logoSrc = '';
        }
        
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>'
            . 'body{font-family: Arial, sans-serif; font-size: 11px; color: #000; margin: 0; padding: 0;}'
            . 'table{border-collapse: collapse; width: 100%;}'
            . 'td, th{vertical-align: top;}'
            . '</style></head><body>'
            . '<div style="width: 700px; margin: 0 auto;">'
            . '  <table style="margin-bottom: 15px; width: 100%;">'
            . '    <tr>'
            . '      <td style="width: 320px;">'
            . '        <img src="' . $logoSrc . '" style="width: 150px; margin-bottom: 10px;" />'
            . '        <p style="margin:2px 0;"><strong>Dirección: </strong>JR. MANTARO 100 SEMI RURAL PACHACUTEC ZON FRENTE A LA INTERSECCION AREQUIPA-AREQUIPA-CERRO COLORADO</p>'
            . '        <p style="margin:2px 0;"><strong>Celular.: </strong>929288621 / 973411490</p>'
            . '        <p style="margin:2px 0;"><strong>Correo : </strong>suminexsac@gmail.com</p>'
            . '      </td>'
            . '      <td style="width: 50px;"></td>'
            . '      <td style="width: 330px; text-align: center; border: 1px solid #000; border-radius: 5px; padding: 10px;">'
            . '        <h2 style="margin: 0; font-size: 20px;">' . ($venta->tipo_documento == "01" ? "FACTURA ELECTRÓNICA" : "BOLETA ELECTRÓNICA") . '</h2>'
            . '        <p style="margin: 5px 0; font-weight: bold; font-size: 14px;">R.U.C.: 20615095932</p>'
            . '        <p style="margin: 5px 0;">Nro. ' . $venta->serie . ' - ' . $venta->correlativo . '</p>'
            . '        <p style="margin: 5px 0;">Nro. R.I. Emisor: 212321</p>'
            . ($venta->guia ? '<p style="margin: 5px 0;"><strong>Guía de Remisión:</strong><br/>' . htmlspecialchars($venta->guia) . '</p>' : '')
            . '      </td>'
            . '    </tr>'
            . '  </table>'
            
            . '  <div style="border: 1px solid #000; border-radius: 10px; padding: 10px; margin-bottom: 15px;">'
            . '    <table style="width: 100%;">'
            . '      <tr>'
            . '        <td style="width: 55%;">'
            . '          <p style="margin:2px 0;"><strong>Razón Social: </strong>' . htmlspecialchars($venta->cliente->razon_social ?? '-') . '</p>'
            . '          <p style="margin:2px 0;"><strong>Fecha Emisión: </strong>' . $venta->fecha_emision . '</p>'
            . '          <p style="margin:2px 0;"><strong>Tipo Moneda: </strong>SOLES</p>'
            . '        </td>'
            . '        <td style="width: 45%;">'
            . '          <p style="margin:2px 0;"><strong>RUC: </strong>' . htmlspecialchars($venta->cliente->ruc ?? '-') . '</p>'
            . '          <p style="margin:2px 0;"><strong>Dirección: </strong>' . htmlspecialchars($venta->cliente->direccion ?? '-') . '</p>'
            . '        </td>'
            . '      </tr>'
            . '    </table>'
            . '  </div>'
            
            . '  <table style="width: 100%; border: 1px solid #000; margin-bottom: 15px; text-align: center;">'
            . '    <tr style="border-bottom: 1px solid #000;">'
            . '      <th style="padding: 5px; border-right: 1px solid #000; width: 100px;">Cantidad</th>'
            . '      <th style="padding: 5px; border-right: 1px solid #000; text-align: left;">Descripción</th>'
            . '      <th style="padding: 5px; border-right: 1px solid #000; width: 100px;">Valor Unitario</th>'
            . '      <th style="padding: 5px; width: 100px;">Valor Total</th>'
            . '    </tr>';
            
        foreach ($venta->detalles as $item) {
            $desc = htmlspecialchars($item->producto->nombre ?? '');
            if ($item->descripcion_personalizada) $desc .= ' - ' . htmlspecialchars($item->descripcion_personalizada);
            $html .= '    <tr style="border-bottom: 1px solid #ccc;">'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc;">' . $item->cantidad . ' ' . ($item->unidad_medida ?? 'UND') . '</td>'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc; text-align: left;">' . $desc . '</td>'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc;">S/ ' . number_format($item->precio_unitario, 2) . '</td>'
                . '      <td style="padding: 5px;">S/ ' . number_format($item->total, 2) . '</td>'
                . '    </tr>';
        }
        
        if ($venta->descuento > 0) {
            $html .= '    <tr style="border-bottom: 1px solid #ccc;">'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc;"></td>'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc; text-align: left; font-weight: bold; text-transform: uppercase;">' . ($venta->desc_descuento ?: 'DESCUENTO') . '</td>'
                . '      <td style="padding: 5px; border-right: 1px solid #ccc;">S/ -' . number_format($venta->descuento, 2) . '</td>'
                . '      <td style="padding: 5px;">S/ -' . number_format($venta->descuento, 2) . '</td>'
                . '    </tr>';
        }
        
        $html .= '  </table>'
            
            . '  <table style="width: 100%;">'
            . '    <tr>'
            . '      <td style="width: 65%; padding-right: 20px;">'
            . '        <p style="font-weight: bold; margin-bottom: 15px;">Son: ' . number_format($venta->total, 2) . ' SOLES</p>'
            . '        <p style="border-bottom: 1px solid #000; font-weight: bold; padding-bottom: 5px;">Información Adicional</p>'
            . '        <table style="width: 100%; margin-top: 5px;">'
            . '          <tr><td style="font-weight: bold; width: 150px; padding: 2px 0;">Tipo de Transacción:</td><td style="border-bottom: 1px solid #ccc;">' . htmlspecialchars($venta->forma_pago->nombre ?? 'Contado') . '</td></tr>'
            . '          <tr><td style="font-weight: bold; padding: 2px 0;">Condición de Pago:</td><td style="border-bottom: 1px solid #ccc;">' . htmlspecialchars($venta->estado_pago->nombre ?? 'Pagado') . '</td></tr>'
            . '          <tr><td style="font-weight: bold; padding: 2px 0;">Fecha de Vencimiento:</td><td style="border-bottom: 1px solid #ccc;">' . $venta->fecha_vencimiento . '</td></tr>'
            . '        </table>'
            . '      </td>'
            . '      <td style="width: 35%;">'
            . '        <table style="width: 100%;">';
            
        if ($venta->descuento > 0) {
            $html .= '          <tr><td style="text-align:right; font-weight:bold; padding: 5px;">Descuento:</td><td style="padding: 5px; border-bottom: 1px solid #ccc; width: 80px;">S/ ' . number_format($venta->descuento, 2) . '</td></tr>';
        }
        
        $html .= '          <tr><td style="text-align:right; font-weight:bold; padding: 5px;">Subtotal:</td><td style="padding: 5px; border-bottom: 1px solid #ccc; width: 80px;">S/ ' . number_format($venta->subtotal, 2) . '</td></tr>'
            . '          <tr><td style="text-align:right; font-weight:bold; padding: 5px;">I.G.V.:</td><td style="padding: 5px; border-bottom: 1px solid #ccc; width: 80px;">S/ ' . number_format($venta->igv, 2) . '</td></tr>'
            . '          <tr><td style="text-align:right; font-weight:bold; padding: 5px;">Total:</td><td style="padding: 5px; border-bottom: 1px solid #ccc; width: 80px;">S/ ' . number_format($venta->total, 2) . '</td></tr>'
            . '        </table>'
            . '      </td>'
            . '    </tr>'
            . '  </table>';
            
        if ($venta->id_forma_pago == 2 && count($venta->cuotas) > 0) {
            $html .= '  <div style="border: 1px solid #000; border-radius: 10px; padding: 10px; margin-top: 15px;">'
                . '    <h3 style="margin: 0 0 10px 0; font-size: 13px;">Información del Crédito</h3>'
                . '    <table style="width: 100%; text-align: center; font-size: 11px;">'
                . '      <tr style="border-bottom: 1px solid #000;">'
                . '        <th style="padding: 5px; width: 33%;">Número de Cuota</th>'
                . '        <th style="padding: 5px; width: 33%;">Fecha Vencimiento</th>'
                . '        <th style="padding: 5px; width: 33%;">Monto</th>'
                . '      </tr>';
            foreach ($venta->cuotas as $index => $cuota) {
                $html .= '      <tr style="border-bottom: 1px solid #ccc;">'
                    . '        <td style="padding: 5px;">Cuota ' . ($index + 1) . '</td>'
                    . '        <td style="padding: 5px;">' . $cuota->fecha_pago . '</td>'
                    . '        <td style="padding: 5px;">S/ ' . number_format($cuota->monto, 2) . '</td>'
                    . '      </tr>';
            }
            $html .= '    </table>'
                . '  </div>';
        }
            
        $html .= '  <div style="border: 1px solid #000; border-radius: 10px; padding: 10px; margin-top: 15px;">'
            . '    <p style="font-weight: bold; margin: 0 0 5px 0;">DATOS BANCARIOS (M.N. SOLES):</p>'
            . '    <p style="margin: 2px 0;"><strong>CTA. CTE BANCO DE CREDITO DEL PERÚ: </strong> 2157415302056  /  C.C.I.: 00221500741530205620</p>'
            . '    <p style="margin: 2px 0;"><strong>CTA. CTE BANCO INTERBANK: </strong> 300-3008153316  /  C.C.I: 003-300-003008153316-15</p>'
            . '  </div>'
            
            . '</div></body></html>';

        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="venta-' . $venta->serie . '-' . $venta->correlativo . '.pdf"',
        ]);
    }

    public function descargarPdfNC($id)
    {
        $venta = Venta::with(['cliente', 'detalles.producto', 'cuotas'])->findOrFail($id);
        
        if ($venta->estado !== 'Anulada' || !$venta->correlativo_nc) {
            return response()->json(['error' => 'La venta no tiene una Nota de Crédito asociada'], 400);
        }

        $empresa = [
            'razon_social' => 'SUMINEX',
            'ruc' => '20615095932',
            'direccion' => 'CALLE SAN MATEO NRO. 177 - URB. SANTA TERESA - ATE - LIMA',
            'telefono' => '988582772',
            'email' => 'ventas@suminex.com'
        ];

        // Base64 logo
        $logoPath = '/home/diego/Downloads/logo-4.png';
        $logoData = file_exists($logoPath) ? base64_encode(file_get_contents($logoPath)) : '';
        $logoSrc = 'data:image/png;base64,' . $logoData;

        // Html
        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><style>'
            . 'body { font-family: "Helvetica", "Arial", sans-serif; font-size: 11px; }'
            . 'table { width: 100%; border-collapse: collapse; }'
            . '.header { text-align: center; margin-bottom: 20px; }'
            . '.box-ruc { border: 2px solid #000; border-radius: 10px; padding: 15px; text-align: center; font-size: 14px; font-weight: bold; }'
            . 'th { background-color: #f2f2f2; font-weight: bold; border-bottom: 1px solid #ccc; padding: 5px; }'
            . 'td { padding: 5px; border-bottom: 1px dashed #eee; }'
            . '.totals td { border: none; padding: 2px 5px; }'
            . '</style></head><body>'
            . '<table style="margin-bottom: 20px;">'
            . '<tr>'
            . '<td style="width: 60%; border: none;">'
            . '<img src="' . $logoSrc . '" width="200" style="margin-bottom: 10px;"/><br>'
            . '<strong>' . $empresa['razon_social'] . '</strong><br>'
            . $empresa['direccion'] . '<br>'
            . 'Cel: ' . $empresa['telefono'] . '<br>'
            . 'Email: ' . $empresa['email'] . '<br>'
            . '</td>'
            . '<td style="width: 40%; border: none;">'
            . '<div class="box-ruc">'
            . 'RUC: ' . $empresa['ruc'] . '<br><br>'
            . 'NOTA DE CRÉDITO ELECTRÓNICA<br><br>'
            . $venta->correlativo_nc
            . '</div>'
            . '</td>'
            . '</tr>'
            . '</table>'

            . '<table style="margin-bottom: 15px;">'
            . '<tr><td style="width: 15%; border: none;"><strong>CLIENTE:</strong></td><td style="width: 85%; border: none;">' . ($venta->cliente->razon_social ?? 'N/A') . '</td></tr>'
            . '<tr><td style="border: none;"><strong>RUC/DNI:</strong></td><td style="border: none;">' . ($venta->cliente->ruc ?? 'N/A') . '</td></tr>'
            . '<tr><td style="border: none;"><strong>FECHA E.:</strong></td><td style="border: none;">' . $venta->fecha_emision . '</td></tr>'
            . '<tr><td style="border: none;"><strong>MONEDA:</strong></td><td style="border: none;">' . ($venta->moneda == 'PEN' ? 'Soles' : 'Dólares') . '</td></tr>'
            . '<tr><td style="border: none;"><strong>MOTIVO:</strong></td><td style="border: none;">' . ($venta->motivo_anulacion) . '</td></tr>'
            . '<tr><td style="border: none;"><strong>DOC AFECTADO:</strong></td><td style="border: none;">' . $venta->serie . '-' . $venta->correlativo . '</td></tr>'
            . '</table>'

            . '<table style="margin-bottom: 20px;">'
            . '<thead><tr>'
            . '<th>CANT.</th>'
            . '<th>UNIDAD</th>'
            . '<th>DESCRIPCIÓN</th>'
            . '<th style="text-align: right;">V. UNITARIO</th>'
            . '<th style="text-align: right;">TOTAL</th>'
            . '</tr></thead>'
            . '<tbody>';

        foreach ($venta->detalles as $d) {
            $desc = htmlspecialchars($d->descripcion_personalizada ?? $d->producto->nombre);
            $html .= '<tr>'
                . '<td style="text-align: center;">' . $d->cantidad . '</td>'
                . '<td style="text-align: center;">NIU</td>'
                . '<td>' . $desc . '</td>'
                . '<td style="text-align: right;">' . number_format($d->precio_unitario, 2) . '</td>'
                . '<td style="text-align: right;">' . number_format($d->cantidad * $d->precio_unitario, 2) . '</td>'
                . '</tr>';
        }

        $html .= '</tbody></table>'
            . '<table class="totals" style="width: 40%; margin-left: 60%; margin-bottom: 20px;">'
            . '<tr><td style="text-align: right;"><strong>OP. GRAVADA:</strong></td><td style="text-align: right;">' . number_format($venta->subtotal, 2) . '</td></tr>'
            . '<tr><td style="text-align: right;"><strong>I.G.V. (18%):</strong></td><td style="text-align: right;">' . number_format($venta->igv, 2) . '</td></tr>'
            . '<tr><td style="text-align: right;"><strong>TOTAL A DEVOLVER:</strong></td><td style="text-align: right;">' . number_format($venta->total, 2) . '</td></tr>'
            . '</table>'
            . '</body></html>';

        $options = new \Dompdf\Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);
        
        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="nc-' . $venta->correlativo_nc . '.pdf"',
        ]);
    }

    public function anularVenta(Request $request, $id)
    {
        $this->validate($request, [
            'cod_motivo' => 'required|string',
            'motivo' => 'required|string'
        ]);

        $venta = Venta::findOrFail($id);
        
        if ($venta->envio_sunat != 1) {
            return response()->json(['error' => 'La venta no ha sido enviada a SUNAT'], 400);
        }
        
        if ($venta->estado == 'Anulada') {
            return response()->json(['error' => 'La venta ya se encuentra anulada'], 400);
        }

        try {
            // Determinar serie NC (Facturas F001 -> FF01, Boletas B001 -> BB01)
            $esFactura = substr($venta->serie, 0, 1) === 'F';
            $serieNC = $esFactura ? 'FF01' : 'BB01';

            // Buscar último correlativo en BD
            $maxCorrelativo = Venta::where('correlativo_nc', 'like', $serieNC . '-%')
                                  ->select(\Illuminate\Support\Facades\DB::raw("CAST(SUBSTRING_INDEX(correlativo_nc, '-', -1) AS UNSIGNED) as num"))
                                  ->orderBy('num', 'desc')
                                  ->first();

            // También verificar correlativo en la tabla legacy aux por consistencia
            $auxNC = \Illuminate\Support\Facades\DB::table('aux')->where('tabla', 'nota_credito')->first();
            $numFromAux = $auxNC ? (int)$auxNC->id : 0;
            $numFromVentas = $maxCorrelativo ? (int)$maxCorrelativo->num : 0;
            
            $ultimoCorrelativo = max($numFromAux, $numFromVentas);
            $correlativoNCNum = $ultimoCorrelativo + 1;

            $greenter = new GreenterService();
            $cliente = Cliente::find($venta->id_cliente);
            $detallesObj = VentaDetalle::with('producto')->where('id_venta', $venta->id)->get();
            
            $sunatRes = $greenter->emitirNotaCredito(
                $venta, 
                $cliente, 
                $detallesObj, 
                $request->cod_motivo, 
                $request->motivo, 
                $serieNC, 
                $correlativoNCNum
            );

            if ($sunatRes['success']) {
                $venta->estado = 'Anulada';
                $venta->cod_motivo_anulacion = $request->cod_motivo;
                $venta->motivo_anulacion = $request->motivo;
                $venta->correlativo_nc = $serieNC . '-' . $correlativoNCNum;
                $venta->save();

                // Reponer stock de los productos vendidos e ingresar movimiento a Kardex
                foreach ($detallesObj as $det) {
                    $producto = Producto::find($det->id_producto);
                    if ($producto) {
                        $producto->stock = floatval($producto->stock) + floatval($det->cantidad);
                        $producto->fecha_actualizacion = date('Y-m-d H:i:s');
                        $producto->save();
                    }

                    \App\Models\Operation::create([
                        'product_id' => $det->id_producto,
                        'stock_id' => 1,
                        'q' => $det->cantidad,
                        'price_in' => $det->precio_unitario,
                        'price_out' => 0,
                        'operation_type_id' => 5, // 5: Devolución / Anulación
                        'sell_id' => $venta->id,
                        'status' => 1,
                        'is_draft' => 0,
                        'is_traspase' => 0,
                        'created_at' => date('Y-m-d H:i:s'),
                    ]);
                }

                // Sincronizar con legacy aux y ventas_cabecera si existen
                try {
                    \Illuminate\Support\Facades\DB::table('aux')
                        ->where('tabla', 'nota_credito')
                        ->update(['id' => $correlativoNCNum]);

                    \Illuminate\Support\Facades\DB::table('ventas_cabecera')
                        ->where('codigo_venta', $venta->serie . '-' . $venta->correlativo)
                        ->update([
                            'estado_anulado' => 1,
                            'correlativo_nc' => $correlativoNCNum,
                            'motivo' => $request->motivo,
                            'fecha_anulacion' => date('Y-m-d')
                        ]);
                } catch (\Exception $eSync) {
                    \Illuminate\Support\Facades\Log::warning("Error sincronizando anulación con legacy: " . $eSync->getMessage());
                }

                return response()->json([
                    'success' => true, 
                    'msg' => 'Venta anulada correctamente. Nota de crédito ' . $venta->correlativo_nc . ' generada y enviada a SUNAT.'
                ]);
            } else {
                return response()->json(['error' => 'Rechazado por SUNAT', 'msg' => $sunatRes['errorMsg']], 400);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al anular en SUNAT', 'msg' => $e->getMessage()], 500);
        }
    }

    public function descargarXml($id)
    {
        $venta = Venta::findOrFail($id);
        $path = storage_path('app/' . $venta->xml_path);
        
        if (!$venta->xml_path || !file_exists($path)) {
            return response()->json(['error' => 'Archivo XML no encontrado'], 404);
        }
        
        return response()->download($path, basename($path), [
            'Content-Type' => 'application/xml',
        ]);
    }

    public function descargarCdr($id)
    {
        $venta = Venta::findOrFail($id);
        $path = storage_path('app/' . $venta->cdr_path);
        
        if (!$venta->cdr_path || !file_exists($path)) {
            return response()->json(['error' => 'Archivo CDR no encontrado'], 404);
        }
        
        return response()->download($path, basename($path), [
            'Content-Type' => 'application/zip',
        ]);
    }
}
