<?php

namespace App\Services;

use Greenter\Ws\Services\SunatEndpoints;
use Greenter\See;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Company;
use Greenter\Model\Company\Address;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\FormaPagos\FormaPagoCredito;
use Greenter\Model\Sale\Cuota;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\SaleDetail;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\Charge;
use DateTime;

class GreenterService
{
    protected $see;
    protected $company;

    public function __construct()
    {
        $this->see = new See();
        // Path al certificado PEM
        $certPath = storage_path('app/greenter/certificado_sn_2026.pem');
        $this->see->setCertificate(file_get_contents($certPath));

        // Enviar a produccion o beta
        $this->see->setService(SunatEndpoints::FE_PRODUCCION);
        $this->see->setClaveSOL('20615095932', 'SISTEM25', 'Logistica25');

        $address = (new Address())
            ->setUbigueo('040104')
            ->setDepartamento('AREQUIPA')
            ->setProvincia('AREQUIPA')
            ->setDistrito('CERRO COLORADO')
            ->setUrbanizacion('-')
            ->setDireccion('R. MANTARO 100 SEMI RURAL PACHACUTEC')
            ->setCodLocal('0000');

        $this->company = (new Company())
            ->setRuc('20615095932')
            ->setRazonSocial('CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.')
            ->setNombreComercial('CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.')
            ->setAddress($address);
    }

    public function emitirFactura($venta, $cliente, $detalles)
    {
        $numDoc = trim((string) ($cliente->ruc ?? ''));
        $client = (new Client())
            ->setTipoDoc(strlen($numDoc) === 8 ? '1' : '6') // 6: RUC, 1: DNI
            ->setNumDoc($numDoc !== '' ? $numDoc : '00000000')
            ->setRznSocial($cliente->razon_social);

        // Las líneas y los totales se calculan desde el detalle para que cuadren siempre
        // (SUNAT valida: suma de valor venta de líneas - descuento global = op. gravadas).
        $lineas = [];
        foreach ($detalles as $d) {
            $cantidad = (float) $d->cantidad;
            $valorUnitario = (float) $d->precio_unitario; // sin IGV
            $valorLinea = round($cantidad * $valorUnitario, 2);
            $igvLinea = round($valorLinea * 0.18, 2);

            $lineas[] = [
                'cod_producto' => $d->id_producto,
                'descripcion' => $d->descripcion_completa,
                'cantidad' => $cantidad,
                'valor_unitario' => $valorUnitario,
                'valor_linea' => $valorLinea,
                'igv_linea' => $igvLinea,
            ];
        }

        $sumaValorLineas = round(array_sum(array_column($lineas, 'valor_linea')), 2);
        $descuento = min(round((float) $venta->descuento, 2), $sumaValorLineas);

        $objetivoSubtotal = round((float) $venta->subtotal, 2);
        $objetivoTotal = round((float) $venta->total, 2);
        $toleranciaMax = max(0.05, count($lineas) * 0.01);

        // Alinear suma de valor venta de líneas con el subtotal esperado (solo diferencias por redondeo)
        $objetivoValorBruto = round($objetivoSubtotal + $descuento, 2);
        $diffValor = round($objetivoValorBruto - $sumaValorLineas, 2);
        if (count($lineas) > 0 && abs($diffValor) > 0 && abs($diffValor) <= $toleranciaMax) {
            $centavos = (int) round(abs($diffValor) * 100);
            $paso = $diffValor > 0 ? 0.01 : -0.01;
            for ($c = 0; $c < $centavos; $c++) {
                $mejorIdx = null;
                $mejorError = PHP_FLOAT_MAX;
                foreach ($lineas as $idx => $l) {
                    if ($l['valor_linea'] + $paso <= 0) {
                        continue;
                    }
                    $valorTeorico = $l['cantidad'] * $l['valor_unitario'];
                    $error = abs(($l['valor_linea'] + $paso) - $valorTeorico);
                    if ($error < $mejorError) {
                        $mejorError = $error;
                        $mejorIdx = $idx;
                    }
                }
                if ($mejorIdx === null) {
                    break;
                }
                $lineas[$mejorIdx]['valor_linea'] = round($lineas[$mejorIdx]['valor_linea'] + $paso, 2);
                $cant = $lineas[$mejorIdx]['cantidad'];
                if ($cant > 0) {
                    $lineas[$mejorIdx]['valor_unitario'] = round($lineas[$mejorIdx]['valor_linea'] / $cant, 6);
                }
                $lineas[$mejorIdx]['igv_linea'] = round($lineas[$mejorIdx]['valor_linea'] * 0.18, 2);
            }
            $sumaValorLineas = round(array_sum(array_column($lineas, 'valor_linea')), 2);
        }

        $descuento = min(round((float) $venta->descuento, 2), $sumaValorLineas);
        $gravadas = round($sumaValorLineas - $descuento, 2);
        $sumaIgvLineas = round(array_sum(array_column($lineas, 'igv_linea')), 2);
        $igvCalculado = $descuento > 0 ? round($gravadas * 0.18, 2) : $sumaIgvLineas;
        $totalCalculado = round($gravadas + $igvCalculado, 2);

        // Si no hay descuento global y el total difiere por redondeo de IGV por línea, ajustar céntimos en las líneas
        $diffTotal = round($objetivoTotal - $totalCalculado, 2);
        if ($descuento <= 0 && count($lineas) > 0 && abs($diffTotal) > 0 && abs($diffTotal) <= $toleranciaMax) {
            $centavos = (int) round(abs($diffTotal) * 100);
            $paso = $diffTotal > 0 ? 0.01 : -0.01;
            for ($c = 0; $c < $centavos; $c++) {
                $mejorIdx = null;
                $mejorError = PHP_FLOAT_MAX;
                foreach ($lineas as $idx => $l) {
                    if ($l['igv_linea'] + $paso < 0) {
                        continue;
                    }
                    $igvTeorico = $l['valor_linea'] * 0.18;
                    $error = abs(($l['igv_linea'] + $paso) - $igvTeorico);
                    if ($error < $mejorError) {
                        $mejorError = $error;
                        $mejorIdx = $idx;
                    }
                }
                if ($mejorIdx === null) {
                    break;
                }
                $lineas[$mejorIdx]['igv_linea'] = round($lineas[$mejorIdx]['igv_linea'] + $paso, 2);
            }
            $sumaIgvLineas = round(array_sum(array_column($lineas, 'igv_linea')), 2);
        }

        $igvTotal = $descuento > 0 ? round($gravadas * 0.18, 2) : $sumaIgvLineas;
        $totalVenta = round($gravadas + $igvTotal, 2);

        $items = [];
        foreach ($lineas as $l) {
            $cantidad = $l['cantidad'];
            $valorLinea = $l['valor_linea'];
            $igvLinea = $l['igv_linea'];

            $items[] = (new SaleDetail())
                ->setCodProducto($l['cod_producto'])
                ->setUnidad('NIU') // Asumir Unidad estándar
                ->setDescripcion($l['descripcion'])
                ->setCantidad($cantidad)
                ->setMtoValorUnitario(round($l['valor_unitario'], 6))
                ->setMtoValorVenta($valorLinea)
                ->setMtoBaseIgv($valorLinea)
                ->setPorcentajeIgv(18)
                ->setIgv($igvLinea)
                ->setTipAfeIgv('10')
                ->setTotalImpuestos($igvLinea)
                ->setMtoPrecioUnitario($cantidad > 0 ? round(($valorLinea + $igvLinea) / $cantidad, 6) : 0);
        }

        $invoice = (new Invoice())
            ->setUblVersion('2.1')
            ->setFecVencimiento($this->fechaPeru($venta->fecha_vencimiento ?? $venta->fecha_emision))
            ->setTipoOperacion('0101')
            ->setTipoDoc($venta->tipo_documento) // '01' factura, '03' boleta
            ->setSerie($venta->serie)
            ->setCorrelativo($venta->correlativo)
            ->setFechaEmision($this->fechaPeru($venta->fecha_emision))
            ->setTipoMoneda($venta->moneda)
            ->setCompany($this->company)
            ->setClient($client)
            ->setMtoOperExoneradas(0)
            ->setMtoIGV($igvTotal)
            ->setMtoOperGravadas($gravadas)
            ->setTotalImpuestos($igvTotal)
            ->setValorVenta($sumaValorLineas)
            ->setSubTotal($totalVenta)
            ->setMtoImpVenta($totalVenta);

        $cuotasAjustadas = [];
        if ($venta->id_forma_pago == 2 && $venta->cuotas && count($venta->cuotas) > 0) {
            // SUNAT (3265): el monto pendiente no puede superar el importe total, y la suma de
            // cuotas debe ser igual al monto pendiente. Si por redondeo las cuotas exceden el
            // total, se descuenta la diferencia de la última cuota.
            foreach ($venta->cuotas as $cuota) {
                $cuotasAjustadas[] = ['id' => $cuota->id, 'monto' => round((float) $cuota->monto, 2), 'fecha_pago' => $cuota->fecha_pago];
            }
            $sumaCuotas = round(array_sum(array_column($cuotasAjustadas, 'monto')), 2);
            $exceso = round($sumaCuotas - $totalVenta, 2);
            for ($i = count($cuotasAjustadas) - 1; $i >= 0 && $exceso > 0; $i--) {
                $descontar = min($exceso, $cuotasAjustadas[$i]['monto']);
                $cuotasAjustadas[$i]['monto'] = round($cuotasAjustadas[$i]['monto'] - $descontar, 2);
                $exceso = round($exceso - $descontar, 2);
            }
            $cuotasAjustadas = array_values(array_filter($cuotasAjustadas, fn ($c) => $c['monto'] > 0));
            $montoNetoPendiente = round(array_sum(array_column($cuotasAjustadas, 'monto')), 2);

            $invoice->setFormaPago(new FormaPagoCredito($montoNetoPendiente));
            $cuotasArr = [];
            foreach ($cuotasAjustadas as $cuota) {
                $cuotasArr[] = (new Cuota())
                    ->setMonto($cuota['monto'])
                    ->setFechaPago($this->fechaPeru($cuota['fecha_pago']));
            }
            $invoice->setCuotas($cuotasArr);
        } else {
            $invoice->setFormaPago(new FormaPagoContado());
        }

        if ($descuento > 0) {
            $invoice->setDescuentos([
                (new Charge())
                    ->setCodTipo('02') // Descuento global que afecta la base imponible
                    ->setMontoBase($sumaValorLineas)
                    ->setFactor(round($descuento / $sumaValorLineas, 5))
                    ->setMonto($descuento)
            ]);
        }

        // Add legends (e.g. monto en letras)
        $invoice->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue(PdfComprobanteHelper::montoEnLetras($totalVenta, $venta->moneda))
            ]);

        $res = $this->see->send($invoice);

        $xml = $this->see->getFactory()->getLastXml();
        $fileName = $invoice->getName();

        // Save XML and CDR
        $storagePath = storage_path('app/greenter/');
        file_put_contents($storagePath . $fileName . '.xml', $xml);

        $success = false;
        $errorMsg = null;

        if ($res->isSuccess()) {
            file_put_contents($storagePath . 'R-' . $fileName . '.zip', $res->getCdrZip());
            
            $cdr = $res->getCdrResponse();
            $code = (int)$cdr->getCode();

            if ($code === 0) {
                $success = true;
            } else if ($code >= 2000 && $code <= 3999) {
                $errorMsg = 'Rechazada por SUNAT: ' . $cdr->getDescription();
            } else {
                $errorMsg = 'Aceptada con observaciones: ' . implode(', ', $cdr->getNotes());
                $success = true; // Typically accepted with observations is still success
            }
        } else {
            $errorMsg = $res->getError()->getCode() . ' - ' . $res->getError()->getMessage();
        }

        return [
            'success' => $success,
            'fileName' => $fileName,
            'errorMsg' => $errorMsg,
            'xml_path' => 'greenter/' . $fileName . '.xml',
            'cdr_path' => $res->isSuccess() ? 'greenter/R-' . $fileName . '.zip' : null,
            'totales' => ['subtotal' => $gravadas, 'igv' => $igvTotal, 'total' => $totalVenta],
            'cuotas' => $cuotasAjustadas,
        ];
    }

    public function emitirNotaCredito($venta, $cliente, $detalles, $motivoCodigo, $motivoDescripcion, $serieNC, $correlativoNC)
    {
        $client = (new Client())
            ->setTipoDoc('6') // 6: RUC, 1: DNI
            ->setNumDoc($cliente->ruc ?? '00000000')
            ->setRznSocial($cliente->razon_social);

        $note = new \Greenter\Model\Sale\Note();
        $note
            ->setUblVersion('2.1')
            ->setTipDocAfectado($venta->tipo_documento) // '01' o '03'
            ->setNumDocfectado($venta->serie . '-' . $venta->correlativo)
            ->setCodMotivo($motivoCodigo)
            ->setDesMotivo($motivoDescripcion)
            ->setTipoDoc('07') // Nota de crédito
            ->setSerie($serieNC)
            ->setCorrelativo($correlativoNC)
            ->setFechaEmision($this->fechaPeru('now'))
            ->setTipoMoneda($venta->moneda)
            ->setCompany($this->company)
            ->setClient($client)
            ->setMtoOperGravadas($venta->subtotal)
            ->setMtoIGV($venta->igv)
            ->setTotalImpuestos($venta->igv)
            ->setMtoImpVenta($venta->total);

        $items = [];
        foreach ($detalles as $d) {
            $item = (new SaleDetail())
                ->setCodProducto($d->id_producto)
                ->setUnidad('NIU')
                ->setDescripcion($d->descripcion_completa)
                ->setCantidad($d->cantidad)
                ->setMtoValorUnitario($d->precio_unitario)
                ->setMtoValorVenta($d->cantidad * $d->precio_unitario)
                ->setMtoBaseIgv($d->cantidad * $d->precio_unitario)
                ->setPorcentajeIgv(18)
                ->setIgv(number_format(($d->cantidad * $d->precio_unitario) * 0.18, 2, ".", ""))
                ->setTipAfeIgv('10')
                ->setTotalImpuestos(number_format(($d->cantidad * $d->precio_unitario) * 0.18, 2, ".", ""))
                ->setMtoPrecioUnitario(number_format(($d->cantidad * $d->precio_unitario) * 1.18 / $d->cantidad, 2, ".", ""));

            $items[] = $item;
        }

        $note->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue($this->getMontoEnLetras($venta->total))
            ]);

        $res = $this->see->send($note);
        $xml = $this->see->getFactory()->getLastXml();
        $fileName = $note->getName();

        $storagePath = storage_path('app/greenter/');
        if (!file_exists($storagePath)) {
            mkdir($storagePath, 0777, true);
        }
        file_put_contents($storagePath . $fileName . '.xml', $xml);

        $success = false;
        $errorMsg = null;

        if ($res->isSuccess()) {
            file_put_contents($storagePath . 'R-' . $fileName . '.zip', $res->getCdrZip());
            $cdr = $res->getCdrResponse();
            $code = (int)$cdr->getCode();

            if ($code === 0) {
                $success = true;
            } else if ($code >= 2000 && $code <= 3999) {
                $errorMsg = 'Rechazada por SUNAT: ' . $cdr->getDescription();
            } else {
                $errorMsg = 'Aceptada con observaciones: ' . implode(', ', $cdr->getNotes());
                $success = true;
            }
        } else {
            $errorMsg = $res->getError()->getCode() . ' - ' . $res->getError()->getMessage();
        }

        return [
            'success' => $success,
            'fileName' => $fileName,
            'errorMsg' => $errorMsg,
            'xml_path' => 'greenter/' . $fileName . '.xml',
            'cdr_path' => $res->isSuccess() ? 'greenter/R-' . $fileName . '.zip' : null
        ];
    }

    private function getMontoEnLetras($monto)
    {
        return "SON " . number_format($monto, 2) . " SOLES";
    }

    /**
     * Greenter escribe las fechas del XML en hora de Perú. Si la fecha (sin hora) se crea en la
     * zona del servidor (UTC), medianoche UTC pasa a ser las 19:00 del día ANTERIOR en Lima.
     */
    private function fechaPeru(?string $fecha): DateTime
    {
        return new DateTime($fecha ?? 'now', new \DateTimeZone('America/Lima'));
    }
}
