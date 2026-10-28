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
        $items = [];
        $sumaValorLineas = 0;
        $sumaIgvLineas = 0;
        foreach ($detalles as $d) {
            $cantidad = (float) $d->cantidad;
            $valorUnitario = (float) $d->precio_unitario; // sin IGV
            $valorLinea = round($cantidad * $valorUnitario, 2);
            $igvLinea = round($valorLinea * 0.18, 2);

            $items[] = (new SaleDetail())
                ->setCodProducto($d->id_producto)
                ->setUnidad('NIU') // Asumir Unidad estándar
                ->setDescripcion($d->descripcion_personalizada ?: $d->producto->nombre)
                ->setCantidad($cantidad)
                ->setMtoValorUnitario(round($valorUnitario, 6))
                ->setMtoValorVenta($valorLinea)
                ->setMtoBaseIgv($valorLinea)
                ->setPorcentajeIgv(18)
                ->setIgv($igvLinea)
                ->setTipAfeIgv('10')
                ->setTotalImpuestos($igvLinea)
                ->setMtoPrecioUnitario($cantidad > 0 ? round(($valorLinea + $igvLinea) / $cantidad, 2) : 0);

            $sumaValorLineas += $valorLinea;
            $sumaIgvLineas += $igvLinea;
        }
        $sumaValorLineas = round($sumaValorLineas, 2);

        $descuento = min(round((float) $venta->descuento, 2), $sumaValorLineas);
        $gravadas = round($sumaValorLineas - $descuento, 2);
        $igvTotal = $descuento > 0 ? round($gravadas * 0.18, 2) : round($sumaIgvLineas, 2);
        $totalVenta = round($gravadas + $igvTotal, 2);

        $invoice = (new Invoice())
            ->setUblVersion('2.1')
            ->setFecVencimiento(new DateTime($venta->fecha_vencimiento ?? $venta->fecha_emision))
            ->setTipoOperacion('0101')
            ->setTipoDoc($venta->tipo_documento) // '01' factura, '03' boleta
            ->setSerie($venta->serie)
            ->setCorrelativo($venta->correlativo)
            ->setFechaEmision(new DateTime($venta->fecha_emision))
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
                    ->setFechaPago(new DateTime($cuota['fecha_pago']));
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
            ->setFechaEmision(new DateTime())
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
                ->setDescripcion($d->descripcion_personalizada ?: $d->producto->nombre)
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
}
