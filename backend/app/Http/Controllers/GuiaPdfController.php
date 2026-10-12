<?php

namespace App\Http\Controllers;

use App\Services\PdfComprobanteHelper as H;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Dompdf\Dompdf;
use Dompdf\Options;

class GuiaPdfController extends Controller
{
    public function downloadGuiaPdf($id)
    {
        $guia = DB::table('guia_cabecera as g')
            ->leftJoin('motivos_traslado as m', 'm.codigo', '=', 'g.motivo_traslado')
            ->where('g.id', $id)
            ->select('g.*', 'm.motivo_traslado as desc_motivo_traslado')
            ->first();

        if (!$guia) {
            return response('Guía no encontrada', 404);
        }

        $conductor = !empty($guia->ruc_conductor)
            ? DB::table('conductores')->where('ruc', $guia->ruc_conductor)->first()
            : null;
        $transportista = !empty($guia->ruc_transportista)
            ? DB::table('transportistas')->where('ruc', $guia->ruc_transportista)->first()
            : null;
        $person = DB::table('person')->where('no', $guia->ruc_destinatario)->first();

        $detalle = DB::table('guia_detalle as vd')
            ->leftJoin('productos as p', 'p.id', '=', 'vd.id_producto')
            ->where('vd.id_guia', $id)
            ->select('vd.*', 'p.nombre as name', 'p.codigo as code')
            ->get();

        $esPublico = $guia->modalidad_trasnporte == '01' || $guia->modalidad_trasnporte == 1;
        $modalidad = $esPublico ? 'Transporte público' : 'Transporte privado';
        $descMotivo = ($guia->motivo_traslado == 13) ? 'OTROS ' . $guia->descripcion_motivo : $guia->desc_motivo_traslado;
        $motivo = str_pad((string) $guia->motivo_traslado, 2, '0', STR_PAD_LEFT) . ($descMotivo ? ' – ' . $descMotivo : '');
        $pesoTotal = (empty($guia->total_bruto) || $guia->total_bruto == 0) ? $guia->total_neto : $guia->total_bruto;

        $nombreConductor = '';
        if ($conductor) {
            $nombreConductor = trim(($conductor->nombres ?? '') . ' ' . ($conductor->apellidos ?? '')) ?: $conductor->razon_social;
        }

        $qr = H::qrDataUri(url('/api/guias/' . $id . '/pdf'));

        $fila = function ($label, $valor, $anchoLabel = '18%', $anchoValor = '32%') {
            return '<td class="lbl" style="padding: 3px 0; width: ' . $anchoLabel . ';">' . $label . '</td>'
                . '<td style="padding: 3px 8px 3px 0; width: ' . $anchoValor . ';">' . $valor . '</td>';
        };

        $html = '<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>'
            . H::estilosBase('120px')
            . '#footer{position: fixed; left: 0; right: 0; bottom: -100px; height: 90px;}'
            . '.box-dark{margin-bottom: 12px;}'
            . '</style></head><body>'

            . '<div id="footer">'
            . H::datosBancariosCompactos()
            . '<div style="margin-top: 8px; text-align: center; font-size: 8.5px; color: #666;">'
            . 'Representación impresa de la Guía de Remisión Electrónica – Remitente. Puede consultar su validez en www.sunat.gob.pe.'
            . '</div>'
            . '</div>'

            . H::cabecera('GUÍA DE REMISIÓN ELECTRÓNICA<br/>REMITENTE', H::numeroDesdeTexto($guia->num_guia), false)

            // Datos del traslado
            . '<div class="box-dark">'
            . '<div class="sec-title">DATOS DEL TRASLADO</div>'
            . '<table>'
            . '<tr>' . $fila('Fecha de emisión:', H::fecha($guia->fecha_emision)) . $fila('Inicio de traslado:', H::fecha($guia->fecha_traslado), '18%', '32%') . '</tr>'
            . '<tr>' . $fila('Motivo de traslado:', e($motivo)) . $fila('Modalidad:', $modalidad) . '</tr>'
            . '<tr>' . $fila('Peso bruto total:', number_format((float) $pesoTotal, 3) . ' KGM') . '<td></td><td></td></tr>'
            . '</table>'
            . '</div>'

            // Destinatario
            . '<div class="box-dark">'
            . '<div class="sec-title">DESTINATARIO</div>'
            . '<table><tr>'
            . $fila('Razón social:', H::valor($person->name ?? ''))
            . $fila('RUC:', H::valor($person->no ?? $guia->ruc_destinatario))
            . '</tr></table>'
            . '</div>'

            // Partida / llegada
            . '<table style="margin-bottom: 12px;"><tr>'
            . '<td style="width: 49%;">'
            . '<div class="box-dark" style="margin-bottom: 0; height: 88px;">'
            . '<div class="sec-title">PUNTO DE PARTIDA</div>'
            . '<div style="line-height: 1.45;">' . H::valor($guia->origen) . '</div>'
            . '<div style="margin-top: 3px;"><span class="lbl">Ubigeo:</span> ' . H::valor($guia->ubigeo) . '</div>'
            . '</div>'
            . '</td>'
            . '<td style="width: 2%;"></td>'
            . '<td style="width: 49%;">'
            . '<div class="box-dark" style="margin-bottom: 0; height: 88px;">'
            . '<div class="sec-title">PUNTO DE LLEGADA</div>'
            . '<div style="line-height: 1.45;">' . H::valor($guia->destino) . '</div>'
            . '<div style="margin-top: 3px;"><span class="lbl">Ubigeo:</span> ' . H::valor($guia->ubigeo_destino) . '</div>'
            . '</div>'
            . '</td>'
            . '</tr></table>'

            // Transporte
            . '<div class="box-dark">'
            . '<div class="sec-title">TRANSPORTE <span style="font-weight: normal; color: #777;">(' . $modalidad . ')</span></div>'
            . '<table>'
            . ($esPublico || $transportista
                ? '<tr>' . $fila('Transportista (RUC):', H::valor($transportista->ruc ?? $guia->ruc_transportista)) . $fila('Razón social:', H::valor($transportista->razon_social ?? '')) . '</tr>'
                : '')
            . '<tr>' . $fila('Conductor (DNI):', H::valor($guia->ruc_conductor)) . $fila('Nombres y apellidos:', H::valor($nombreConductor)) . '</tr>'
            . '<tr>' . $fila('Licencia de conducir:', H::valor($conductor->licencia ?? '')) . $fila('Placa del vehículo:', H::valor($guia->placa)) . '</tr>'
            . '</table>'
            . '</div>'

            // Ítems
            . '<div style="border: 1px solid #555; border-top: none;">'
            . '<table class="items">'
            . '<tr>'
            . '<th style="width: 7%; text-align: center;">ÍTEM</th>'
            . '<th style="width: 12%; text-align: center;">CÓDIGO</th>'
            . '<th style="text-align: center;">Descripción</th>'
            . '<th style="width: 9%; text-align: center;">Und</th>'
            . '<th style="width: 10%; text-align: center;">Cantidad</th>'
            . '</tr>';

        $i = 0;
        foreach ($detalle as $res) {
            $i++;
            $desc = !empty($res->descripcion_producto) ? $res->descripcion_producto : e($res->name);
            $html .= '<tr>'
                . '<td style="text-align: center;">' . $i . '</td>'
                . '<td style="text-align: center;">' . e($res->code) . '</td>'
                . '<td>' . $desc . '</td>'
                . '<td style="text-align: center;">' . e($res->unidad) . '</td>'
                . '<td style="text-align: center;">' . number_format((float) $res->cantidad, 2) . '</td>'
                . '</tr>';
        }

        $relleno = max(0, 110 - $i * 24);
        $html .= '<tr><td colspan="5" style="height: ' . $relleno . 'px;"></td></tr>'
            . '</table></div>'

            // QR + observaciones
            . '<table style="margin-top: 14px;"><tr>'
            . '<td style="width: 104px;">'
            . ($qr
                ? '<img src="' . $qr . '" style="width: 92px; height: 92px;" />'
                : '<div style="width: 92px; height: 92px; border: 1px dashed #999;"></div>')
            . '</td>'
            . '<td style="font-size: 9.5px; line-height: 1.5;">'
            . (!empty($guia->ticket) ? '<span class="lbl" style="color: #555;">Ticket SUNAT:</span> <span class="muted">' . e($guia->ticket) . '</span><br/>' : '')
            . '<span class="lbl" style="color: #555;">Observaciones:</span> <span class="muted">' . H::valor($guia->comentario) . '</span>'
            . '</td>'
            . '</tr></table>'

            . '</body></html>';

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($html);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Guia-' . $guia->num_guia . '.pdf"',
        ]);
    }
}
