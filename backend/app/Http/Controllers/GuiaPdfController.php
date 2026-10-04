<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Dompdf\Dompdf;
use Dompdf\Options;

class GuiaPdfController extends Controller
{
    public function downloadGuiaPdf($id)
    {
        $guia = DB::table('guia_cabecera as g')
            ->join('motivos_traslado as m', 'm.codigo', '=', 'g.motivo_traslado')
            ->where('g.id', $id)
            ->select('g.*', 'm.motivo_traslado as desc_motivo_traslado')
            ->first();

        if (!$guia) {
            return response('Guía no encontrada', 404);
        }

        $conductor = DB::table('conductores')->where('ruc', $guia->ruc_conductor)->first();
        
        $data_transportista = '';
        $transportista = null;
        if (!empty($guia->ruc_transportista)) {
            $transportista = DB::table('transportistas')->where('ruc', $guia->ruc_transportista)->first();
            if ($transportista) {
                $data_transportista = "<tr>
                    <td style=\"width: 100%;\" >
                        <table style=\"width: 100%;\">
                            <tr>
                                <td style=\"padding: 5px; width: 70%;\">
                                    <strong>Razón Social: </strong>
                                    <span>" . e($transportista->razon_social) . "</span>
                                </td>
                                <td style=\"padding: 5px; width: 30%;\">
                                    <strong>RUC: </strong>
                                    " . e($transportista->ruc) . "
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>";
            }
        }

        $person = DB::table('person')->where('no', $guia->ruc_destinatario)->first();
        
        $cliente = [
            'direccion' => $person ? $person->address1 : '',
            'razon_social' => $person ? $person->name : '',
            'ruc' => $person ? $person->no : ''
        ];

        $detalle = DB::table('guia_detalle as vd')
            ->join('product as p', 'p.id', '=', 'vd.id_producto')
            ->leftJoin('codigos_sunat as cs', 'cs.codigo', '=', 'vd.unidad')
            ->where('vd.id_guia', $id)
            ->select('vd.*', 'p.name', 'p.code', 'cs.unidad as unidad_descripcion')
            ->get();

        $table = "<table id=\"tabla_detalles\" style=\"border: solid 1px #eeeeee; text-align: center; margin-top: 10px; width: 100%; font-size: 10px; border-collapse: collapse;\"><tr style=\"border-bottom: solid 1px;\">
            <th style=\"padding: 5px; border: 1px solid #e5e7eb;\">Cantidad</th>
            <th style=\"padding: 5px; border: 1px solid #e5e7eb;\">Pedido</th>
            <th style=\"padding: 5px; border: 1px solid #e5e7eb;\">Modelo</th>
            <th style=\"padding: 5px; border: 1px solid #e5e7eb;\">Descripción</th>
            <th style=\"padding: 5px; border: 1px solid #e5e7eb;\">Peso (Kg)</th>
        </tr>";
        
        $total_peso_items = 0;
        $total_cantidades_items = 0;

        foreach ($detalle as $res) {
            $desc = !empty($res->descripcion_producto) ? $res->descripcion_producto : $res->name;
            $peso_t = ($res->t_bruto == 0) ? $res->t_neto : $res->t_bruto;
            
            $table .= '<tr>
                <td style="width: 15%; padding: 5px; border: 1px solid #e5e7eb;"><p>' . $res->cantidad . ' ' . $res->unidad_descripcion . '</p></td>
                <td style="width: 15%; padding: 5px; border: 1px solid #e5e7eb;">' . $res->pedido . '</td>
                <td style="width: 20%; padding: 5px; border: 1px solid #e5e7eb;">' . $res->code . '</td>
                <td style="width: 35%; padding: 5px; border: 1px solid #e5e7eb; text-align: left;">' . $desc . '</td>	 	
                <td style="width: 15%; padding: 5px; border: 1px solid #e5e7eb;">' . $peso_t . '</td>
            </tr>';
            $total_peso_items += $peso_t;
            $total_cantidades_items += $res->cantidad;
        }

        $table .= '<tr>
            <th style="padding: 5px; border: 1px solid #e5e7eb; text-align: right;" colspan="4"><p>Total Items: ' . $total_cantidades_items . '</p></th>
            <th style="padding: 5px; border: 1px solid #e5e7eb; text-align: left;">Total Peso: ' . round($total_peso_items, 2) . '</th>
        </tr>';
        $table .= '</table>';

        $qrText = url('/api/guias/' . $id . '/pdf');
        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle(120),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
        );
        $writer = new \BaconQrCode\Writer($renderer);
        $qrSvg = $writer->writeString($qrText);
        $qrDataUri = 'data:image/svg+xml;base64,' . base64_encode($qrSvg);

        $logoDataUri = 'https://peruvian.dbusinessaqp.com/assets/logo_2-DmLP2iC3.png';

        $modalidad_trasnporte = ($guia->modalidad_trasnporte == '01' || $guia->modalidad_trasnporte == 1) ? 'Transporte público' : 'Transporte privado';
        $motivo_traslado = ($guia->motivo_traslado == 13) ? "OTROS " . $guia->descripcion_motivo : $guia->desc_motivo_traslado;
        $peso_total = (empty($guia->total_bruto) || $guia->total_bruto == 0) ? $guia->total_neto : $guia->total_bruto;

        $pipi = '<!DOCTYPE html><html><head><meta charset="UTF-8" /><style>'
            . 'body{font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #1f2937; margin: 0; padding: 0;}'
            . 'table{border-collapse: collapse; width: 100%;}'
            . 'td, th{padding: 5px; vertical-align: top;}'
            . '</style></head><body>'
            . '<div style="width: 100%; margin: 0 auto;">'
            . '<table id="encabezado" style="margin-bottom: 25px; font-size: 11px; width: 100%;">'
            . '<tr>'
            . '<td style="padding: 5px; border-radius: 4px; width: 50%; text-align: left;">'
            . '<table style="width: 100%;">'
            . '<tr><td style="text-align: center;">' . ($logoDataUri ? '<img src="' . $logoDataUri . '" align="left" border="0" style="width: 200px;" />' : '') . '</td></tr>'
            . '<tr><td style="opacity: 0 !important; text-align: center; font-weight: bold; font-size: 20px;">PERUVIAN DRESS TPX S.A.C.</td></tr>'
            . '<tr><td style="text-align: left;"><strong>Dirección: </strong>CAL.BELEN MZA. B LOTE. 8 JERUSALEN - MARIANO - MELGAR - AREQUIPA - AREQUIPA</td></tr>'
            . '</table></td>'
            . '<td style="width: 10%;"></td>'
            . '<td style="padding: 5px; border-radius: 4px; width: 40%; text-align: center;">'
            . '<table style="width: 100%;">'
            . '<tr><td style="text-align: center;"><span style="font-weight: bold; font-size: 20px;">Guía de Remisión Electrónica</span></td></tr>'
            . '<tr><td style="text-align: center; font-weight: bold;">R.U.C.: 20455175781</td></tr>'
            . '<tr><td style="text-align: center;">Nro. ' . $guia->num_guia . '</td></tr>'
            . '</table></td></tr></table>'
            . '<div style="border: solid 1px; border-radius: 10px; padding: 10px; width: 100%; margin-bottom: 12px; box-sizing: border-box;">'
            . '<h5 style="margin-bottom: 5px; margin-top: 0px;">Datos del Traslado</h5>'
            . '<table style="width: 100%; font-size: 11px;">'
            . '<tr>'
            . '<td style="padding: 5px; width: 33%;"><strong>Fecha Emisión: </strong><span>' . $guia->fecha_emision . '</span></td>'
            . '<td style="padding: 5px; width: 33%;"><strong>Fecha Inicio Traslado: </strong>' . $guia->fecha_traslado . '</td>'
            . '<td style="padding: 5px; width: 33%;"><strong>Motivo de Traslado: </strong>' . $motivo_traslado . '</td>'
            . '</tr>'
            . '<tr>'
            . '<td style="padding: 5px; width: 50%;" colspan="2"><strong>Modalidad de Transporte: </strong><span>' . $modalidad_trasnporte . '</span></td>'
            . '<td style="padding: 5px; width: 50%;"><strong>Peso Bruto Total (KG): </strong>' . $peso_total . '</td>'
            . '</tr>'
            . '<tr>'
            . '<td style="padding: 5px; width: 100%;" colspan="3"><strong>Observaciones: </strong><span>' . $guia->comentario . '</span></td>'
            . '</tr>'
            . '</table>'
            . '</div>'
            . '<div style="border: solid 1px; border-radius: 10px; padding: 10px; width: 100%; margin-bottom: 12px; box-sizing: border-box;">'
            . '<h5 style="margin-bottom: 5px; margin-top: 0px;">Datos del Destinatario</h5>'
            . '<table style="width: 100%; font-size: 11px;">'
            . '<tr>'
            . '<td style="padding: 5px; width: 70%;"><strong>Razón Social: </strong><span>' . e($cliente['razon_social']) . '</span></td>'
            . '<td style="padding: 5px; width: 30%;"><strong>RUC: </strong>' . e($cliente['ruc']) . '</td>'
            . '</tr>'
            . '</table>'
            . '</div>'
            . '<div style="border: solid 1px; border-radius: 10px; padding: 10px; width: 100%; margin-bottom: 12px; box-sizing: border-box;">'
            . '<h5 style="margin-bottom: 5px; margin-top: 0px;">Datos del punto de partida y llegada</h5>'
            . '<table style="width: 100%; font-size: 11px;">'
            . '<tr><td style="padding: 5px; width: 100%"><strong>Punto de Partida: </strong><span>' . e($guia->origen) . '</span></td></tr>'
            . '<tr><td style="padding: 5px; width: 100%"><strong>Punto de Llegada: </strong><span>' . e($guia->destino) . '</span></td></tr>'
            . '</table>'
            . '</div>'
            . '<div style="border: solid 1px; border-radius: 10px; padding: 10px; width: 100%; margin-bottom: 12px; box-sizing: border-box;">'
            . '<h5 style="margin-bottom: 5px; margin-top: 0px;">Datos del Transporte</h5>'
            . '<table style="width: 100%; font-size: 11px;">'
            . $data_transportista
            . '<tr><td style="width: 100%;"><table style="width: 100%;">'
            . '<tr><td style="padding: 5px; width: 15%;"><strong>Nro. Placa: </strong></td><td style="padding: 5px; width: 15%;"><span>' . e($guia->placa) . '</span></td>'
            . '<td style="padding: 5px; width: 20%;"><strong>Documento Conductor: </strong></td><td style="padding: 5px; width: 15%;">' . e($guia->ruc_conductor) . '</td>'
            . '<td style="padding: 5px; width: 15%;"><strong>Nombres Conductor: </strong></td><td style="padding: 5px; width: 20%;">' . e($conductor ? $conductor->razon_social : '') . '</td></tr>'
            . '</table></td></tr>'
            . '</table>'
            . '</div>'
            . $table
            . '<hr style="margin-top: 30px; width: 100%; border: 1px solid #d1d5db;" />'
            . '<table style="width: 100%; font-size: 11px; margin-top: 20px; border-collapse: collapse;">'
            . '<tr><td style="width: 70%; border: solid 1px #aaaaaa; padding: 8px;">'
            . '<p style="margin: 0;">consulte en www.peruviandress.com (https://www.peruviandress.com/fe)</p>'
            . '<p style="margin-top: 5px;">Representación Impresa de la GUÍA DE REMISIÓN ELECTRÓNICA.</p>'
            . '</td><td style="width: 200px; vertical-align: top; padding-top: 8px;">'
            . '<img src="' . $qrDataUri . '" align="left" border="0" style="width: 120px;" />'
            . '</td></tr></table>'
            . '</div></body></html>';

        $options = new Options();
        $options->set('isRemoteEnabled', true);
        $options->set('isHtml5ParserEnabled', true);

        $dompdf = new Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml($pipi);
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="Guia-' . $guia->num_guia . '.pdf"',
        ]);
    }
}
