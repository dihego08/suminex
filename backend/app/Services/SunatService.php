<?php

namespace App\Services;

use Greenter\Model\Company\Address;
use Greenter\Model\Company\Company;
use Greenter\Model\Client\Client;
use Greenter\Model\Sale\Charge;
use Greenter\Model\Sale\FormaPagos\FormaPagoContado;
use Greenter\Model\Sale\Invoice;
use Greenter\Model\Sale\Note;
use Greenter\Model\Sale\Legend;
use Greenter\Model\Sale\SaleDetail;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;

// Load legacy Greenter autoload if present (keeps global classes available)

class SunatService
{
    public function createSee(): See
    {
        $see = new See();
        $see->setCertificate(file_get_contents(storage_path('app/certs/certificado_pv_2026.pem')));
        $see->setService(SunatEndpoints::FE_PRODUCCION);
        $see->setClaveSOL(env('SUNAT_RUC', '20455175781'), env('SUNAT_USUARIO', 'PERUVI11'), env('SUNAT_CLAVE', 'Omcipier11'));

        return $see;
    }

    public function buildClient(array $customer): Client
    {
        return (new Client())
            ->setTipoDoc('6')
            ->setNumDoc(str_replace(' ', '', $customer['ruc'] ?? ''))
            ->setRznSocial($customer['razon_social'] ?? '-');
    }

    public function buildCompany(): Company
    {
        $address = (new Address())
            ->setUbigueo('040109')
            ->setDepartamento('AREQUIPA')
            ->setProvincia('AREQUIPA')
            ->setDistrito('MARIANO MELGAR')
            ->setUrbanizacion('-')
            ->setDireccion('CAL.BELEN MZA. B LOTE. 8 AREQUIPA - AREQUIPA - MARIANO MELGAR')
            ->setCodLocal('0000');

        return (new Company())
            ->setRuc(env('SUNAT_RUC', '20455175781'))
            ->setRazonSocial(env('SUNAT_RAZON_SOCIAL', 'PERUVIAN DRESS TPX S.A.C.'))
            ->setNombreComercial('PERUVIAN DRESS TPX S.A.C.')
            ->setAddress($address);
    }

    /*public function buildItems($detalle): array
    {
        $items = [];
        foreach ($detalle as $res) {
            $monto_valor_venta = number_format($res->precio_unitario * $res->cantidad, 2, '.', '');
            $precio_bordado = empty($res->precio_bordado) ? 0 : $res->precio_bordado;

            $item = new SaleDetail();
            $item->setCodProducto($res->id_producto)
                ->setUnidad('NIU')
                ->setDescripcion($res->tipo ?? ($res->producto_nombre ?? ''))
                ->setCantidad($res->cantidad)
                ->setMtoValorUnitario($res->precio_unitario)
                ->setMtoValorVenta($monto_valor_venta + $precio_bordado)
                ->setMtoBaseIgv(($monto_valor_venta + $precio_bordado))
                ->setPorcentajeIgv(18)
                ->setIgv(number_format(($monto_valor_venta + $precio_bordado) * 0.18, 2, '.', ''))
                ->setTipAfeIgv('10')
                ->setTotalImpuestos(number_format(($monto_valor_venta + $precio_bordado) * 0.18, 2, '.', ''))
                ->setMtoPrecioUnitario(number_format((($monto_valor_venta + $precio_bordado) * 0.18) + ($monto_valor_venta + $precio_bordado), 2, '.', ''));

            $items[] = $item;
        }

        return $items;
    }*/
    public function buildItems($detalle): array
    {
        $items = [];
        foreach ($detalle as $res) {
            $monto_valor_venta = number_format($res->precio_unitario * $res->cantidad, 2, '.', '');
            $precio_bordado = empty($res->precio_bordado) ? 0 : $res->precio_bordado;

            $valor_venta_total = $monto_valor_venta + $precio_bordado; // total de línea sin IGV
            $igv_total = $valor_venta_total * 0.18;                    // IGV de la línea
            $precio_unitario_con_igv = ($valor_venta_total + $igv_total) / $res->cantidad; // ✅ por unidad

            $item = new SaleDetail();
            $item->setCodProducto($res->id_producto)
                ->setUnidad('NIU')
                ->setDescripcion($res->tipo ?? ($res->producto_nombre ?? ''))
                ->setCantidad($res->cantidad)
                ->setMtoValorUnitario($res->precio_unitario)
                ->setMtoValorVenta(number_format($valor_venta_total, 2, '.', ''))
                ->setMtoBaseIgv(number_format($valor_venta_total, 2, '.', ''))
                ->setPorcentajeIgv(18)
                ->setIgv(number_format($igv_total, 2, '.', ''))
                ->setTipAfeIgv('10')
                ->setTotalImpuestos(number_format($igv_total, 2, '.', ''))
                ->setMtoPrecioUnitario(number_format($precio_unitario_con_igv, 2, '.', ''));

            $items[] = $item;
        }

        return $items;
    }
    public function buildInvoice(array $cabecera, array $items, Client $client, Company $company): Invoice
    {
        $num_factura = explode('-', $cabecera['codigo_venta']);

        $invoice = (new Invoice())
            ->setUblVersion('2.1')
            ->setFecVencimiento(new \DateTime($cabecera['fecha_vencimiento']))
            ->setTipoOperacion('0101')
            ->setTipoDoc('01')
            ->setSerie($num_factura[0])
            ->setCorrelativo($num_factura[1])
            ->setFechaEmision(new \DateTime($cabecera['fecha_creacion']))
            ->setTipoMoneda('PEN')
            ->setCompany($company)
            ->setClient($client)
            ->setMtoOperExoneradas(0)
            ->setMtoIGV($cabecera['igv'])
            ->setMtoOperGravadas($cabecera['subtotal'])
            ->setTotalImpuestos($cabecera['igv'])
            ->setValorVenta($cabecera['subtotal'])
            ->setSubTotal($cabecera['total'])
            ->setMtoImpVenta($cabecera['total'])
            ->setFormaPago(new FormaPagoContado());

        if (isset($cabecera['descuento']) && $cabecera['descuento'] > 0) {
            $invoice->setDescuentos([
                (new Charge())
                    ->setCodTipo('02')
                    ->setMontoBase($cabecera['descuento'])
                    ->setFactor(1)
                    ->setMonto($cabecera['descuento'])
            ]);
        }

        $invoice->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue($this->getTotalEnLetras($cabecera['total']))
            ]);

        return $invoice;
    }

    protected function getTotalEnLetras($total): string
    {
        $total_letras = @file_get_contents('https://dbusinessaqp.com/numero_2_letras/conversor.php?total=' . $total);
        $data = json_decode($total_letras);
        return $data->letras ?? '';
    }

    public function sendInvoice(Invoice $invoice, See $see): array
    {
        $result = $see->send($invoice);

        $sunatPath = storage_path('app/sunat');
        $xmlPath = $sunatPath . DIRECTORY_SEPARATOR . 'xml';
        $cdrPath = $sunatPath . DIRECTORY_SEPARATOR . 'cdr';

        if (!file_exists($xmlPath)) {
            mkdir($xmlPath, 0755, true);
        }

        if (!file_exists($cdrPath)) {
            mkdir($cdrPath, 0755, true);
        }

        file_put_contents($xmlPath . DIRECTORY_SEPARATOR . $invoice->getName() . '.xml', $see->getFactory()->getLastXml());

        if (!$result->isSuccess()) {
            return [
                'success' => false,
                'code' => $result->getError()->getCode(),
                'message' => $result->getError()->getMessage(),
            ];
        }

        $cdr = $result->getCdrResponse();
        file_put_contents($cdrPath . DIRECTORY_SEPARATOR . 'R-' . $invoice->getName() . '.zip', $result->getCdrZip());

        return [
            'success' => true,
            'code' => (int) $cdr->getCode(),
            'message' => $cdr->getDescription() ?? null,
        ];
    }

    public function buildCreditNote(array $cabecera, array $items, Client $client, Company $company, string $codMotivo, string $motivo, string $correlativoNc): Note
    {
        $num_factura = explode('-', $cabecera['codigo_venta']);

        $note = (new Note())
            ->setUblVersion('2.1')
            ->setTipDocAfectado('01') // Factura
            ->setNumDocfectado($cabecera['codigo_venta'])
            ->setCodMotivo($codMotivo)
            ->setDesMotivo($motivo)
            ->setTipoDoc('07') // Nota de Crédito
            ->setSerie('FF01')
            ->setFechaEmision(new \DateTime())
            ->setCorrelativo($correlativoNc)
            ->setTipoMoneda('PEN')
            ->setCompany($company)
            ->setClient($client)
            ->setMtoOperGravadas($cabecera['subtotal'])
            ->setMtoIGV($cabecera['igv'])
            ->setTotalImpuestos($cabecera['igv'])
            ->setMtoImpVenta($cabecera['total']);

        $note->setDetails($items)
            ->setLegends([
                (new Legend())
                    ->setCode('1000')
                    ->setValue($this->getTotalEnLetras($cabecera['total']))
            ]);

        return $note;
    }

    public function sendCreditNote(Note $note, See $see): array
    {
        $result = $see->send($note);

        $sunatPath = storage_path('app/sunat');
        $xmlPath = $sunatPath . DIRECTORY_SEPARATOR . 'xml';
        $cdrPath = $sunatPath . DIRECTORY_SEPARATOR . 'cdr';

        if (!file_exists($xmlPath)) {
            mkdir($xmlPath, 0755, true);
        }

        if (!file_exists($cdrPath)) {
            mkdir($cdrPath, 0755, true);
        }

        file_put_contents($xmlPath . DIRECTORY_SEPARATOR . $note->getName() . '.xml', $see->getFactory()->getLastXml());

        if (!$result->isSuccess()) {
            return [
                'success' => false,
                'code' => $result->getError()->getCode(),
                'message' => $result->getError()->getMessage(),
            ];
        }

        $cdr = $result->getCdrResponse();
        file_put_contents($cdrPath . DIRECTORY_SEPARATOR . 'R-' . $note->getName() . '.zip', $result->getCdrZip());

        return [
            'success' => true,
            'code' => (int) $cdr->getCode(),
            'message' => $cdr->getDescription() ?? null,
            'notaName' => $note->getName()
        ];
    }
}
