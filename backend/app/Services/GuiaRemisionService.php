<?php

namespace App\Services;

use DateTime;
use DOMDocument;
use Illuminate\Support\Facades\DB;
use Greenter\Model\Client\Client;
use Greenter\Model\Company\Company;
use Greenter\Model\Despatch\Despatch;
use Greenter\Model\Despatch\DespatchDetail;
use Greenter\Model\Despatch\Direction;
use Greenter\Model\Despatch\Driver;
use Greenter\Model\Despatch\Shipment;
use Greenter\Model\Despatch\Transportist;
use Greenter\Model\Despatch\Vehicle;
use Greenter\See;
use Greenter\Ws\Services\SunatEndpoints;

class GuiaRemisionService
{
    private const RUC_EMPRESA = '20615095932';
    private const RAZON_SOCIAL_EMPRESA = 'CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.';
    // guia_cabecera.estado
    public const ESTADO_NO_ENVIADA = 0;
    public const ESTADO_ACEPTADA = 1;
    public const ESTADO_EN_PROCESO = 2;

    private const CODIGO_EN_PROCESO = '98';     // respuesta de SUNAT mientras procesa el ticket
    private const INTENTOS_ENVIO = 3;           // consultas dentro de la misma petición de envío
    private const ESPERA_ENTRE_CONSULTAS = 5;   // segundos

    public function createSee(): \Greenter\Api
    {
        $api = new \Greenter\Api([
            'auth' => 'https://api-seguridad.sunat.gob.pe/v1',
            'cpe' => 'https://api-cpe.sunat.gob.pe/v1',
        ]);

        $certificate = file_get_contents(storage_path('app/greenter/certificado_sn_2026.pem'));

        $api->setBuilderOptions([
            'strict_variables' => true,
            'optimizations' => 0,
            'debug' => true,
            'cache' => false,
        ])
            ->setApiCredentials(env('SUNAT_GRE_CLIENT_ID', '6a50f084-e372-442d-bbac-9f4d75edbf42'), env('SUNAT_GRE_CLIENT_SECRET', 'OMhKW+01+YbJHNo2+HJZDQ=='))
            ->setClaveSOL(env('SUNAT_RUC', '20615095932'), env('SUNAT_USUARIO', 'SISTEM25'), env('SUNAT_CLAVE', 'Logistica25'))
            ->setCertificate($certificate);

        return $api;
    }

    /**
     * Paso 1: envía la guía a SUNAT y guarda el ticket de inmediato (estado = 2, "en proceso").
     * Luego intenta consultar el ticket unos pocos segundos; si SUNAT aún no responde,
     * devuelve PENDIENTE y el frontend sigue consultando con consultarGuia().
     * Así ninguna petición HTTP dura más de ~20 s (antes dormía 60 s y el hosting cortaba con 504).
     */
    public function enviarGuia(int $idGuia): array
    {
        try {
            $guia = $this->obtenerGuia($idGuia);
            if (!$guia) {
                return ['Result' => 'ERROR', 'Message' => 'Guía no encontrada'];
            }
            if ((int) $guia['estado'] === self::ESTADO_ACEPTADA) {
                return ['Result' => 'OK', 'Message' => 'La guía ya fue aceptada por SUNAT.'];
            }
            // Ya se envió antes y tiene ticket: no reenviar, solo consultar
            if ((int) $guia['estado'] === self::ESTADO_EN_PROCESO && !empty($guia['ticket'])) {
                return $this->consultarGuia($idGuia);
            }

            $despatch = $this->construirDespatch($guia, $idGuia);

            $api = $this->createSee();
            $res = $api->send($despatch);
            $this->saveXml($despatch, $api->getLastXml());

            if (!$res->isSuccess()) {
                $errorMsg = $res->getError()->getCode() . ' - ' . $res->getError()->getMessage();
                $this->guardarRespuestaSunat($idGuia, $errorMsg);
                return ['Result' => 'ERROR', 'Message' => $errorMsg];
            }

            // Guardar el ticket ANTES de esperar: si algo se corta, la guía se puede seguir consultando
            $ticket = $res->getTicket();
            DB::table('guia_cabecera')->where('id', $idGuia)->update([
                'estado' => self::ESTADO_EN_PROCESO,
                'ticket' => $ticket,
            ]);

            return $this->consultarTicket($idGuia, $api, $ticket, self::INTENTOS_ENVIO);
        } catch (\Throwable $e) {
            return $this->manejarExcepcion($idGuia, $e);
        }
    }

    /**
     * Paso 2: consulta el ticket guardado. Se llama desde el frontend cada pocos segundos
     * mientras la respuesta sea PENDIENTE.
     */
    public function consultarGuia(int $idGuia): array
    {
        try {
            $guia = $this->obtenerGuia($idGuia);
            if (!$guia) {
                return ['Result' => 'ERROR', 'Message' => 'Guía no encontrada'];
            }
            if ((int) $guia['estado'] === self::ESTADO_ACEPTADA) {
                return ['Result' => 'OK', 'Message' => 'La guía ya fue aceptada por SUNAT.'];
            }
            if (empty($guia['ticket'])) {
                return ['Result' => 'ERROR', 'Message' => 'La guía no tiene ticket de SUNAT. Envíela primero.'];
            }

            return $this->consultarTicket($idGuia, $this->createSee(), $guia['ticket'], 1);
        } catch (\Throwable $e) {
            return $this->manejarExcepcion($idGuia, $e);
        }
    }

    private function consultarTicket(int $idGuia, \Greenter\Api $api, string $ticket, int $intentos): array
    {
        $res = null;
        for ($i = 0; $i < $intentos; $i++) {
            if ($i > 0) {
                sleep(self::ESPERA_ENTRE_CONSULTAS);
            }
            $res = $api->getStatus($ticket);
            if ($res->getCode() !== self::CODIGO_EN_PROCESO) {
                break;
            }
        }

        if ($res->getCode() === self::CODIGO_EN_PROCESO) {
            return [
                'Result' => 'PENDIENTE',
                'Message' => 'SUNAT aún está procesando la guía (ticket ' . $ticket . ').',
                'ticket' => $ticket,
            ];
        }

        if (!$res->isSuccess()) {
            $errorMsg = $res->getError()->getCode() . ' - ' . $res->getError()->getMessage();
            $this->guardarRespuestaSunat($idGuia, $errorMsg);
            $this->marcarGuiaRechazada($idGuia);
            return ['Result' => 'ERROR', 'Message' => $errorMsg];
        }

        $cdr = $res->getCdrResponse();
        $guia = $this->obtenerGuia($idGuia);
        $this->saveCdrPorNumero($guia['num_guia'], $res->getCdrZip());
        $respuesta = $this->formatearRespuestaCdr($cdr);
        $this->guardarRespuestaSunat($idGuia, $respuesta);

        if ($cdr->isAccepted()) {
            $this->actualizarGuiaAceptada($idGuia, $ticket);
            return ['Result' => 'OK', 'Message' => $cdr->getDescription()];
        }

        $this->marcarGuiaRechazada($idGuia);
        return ['Result' => 'ERROR', 'Message' => $respuesta];
    }

    /**
     * Rechazada: vuelve a "no enviada" para poder corregirla y reenviarla.
     */
    private function marcarGuiaRechazada(int $idGuia): void
    {
        DB::table('guia_cabecera')->where('id', $idGuia)->update([
            'estado' => self::ESTADO_NO_ENVIADA,
            'ticket' => null,
        ]);
    }

    private function manejarExcepcion(int $idGuia, \Throwable $e): array
    {
        $errorMsg = "Excepción: " . $e->getMessage() . " | Línea: " . $e->getLine();
        $this->guardarRespuestaSunat($idGuia, $errorMsg);
        return ['Result' => 'ERROR', 'Message' => $errorMsg];
    }

    /**
     * Greenter escribe las fechas del XML en hora de Perú. Si la fecha (sin hora) se crea en la
     * zona del servidor (UTC), medianoche UTC pasa a ser las 19:00 del día ANTERIOR en Lima.
     */
    private function fechaPeru(?string $fecha): DateTime
    {
        return new DateTime($fecha ?? 'now', new \DateTimeZone('America/Lima'));
    }

    private function obtenerGuia(int $idGuia): ?array
    {
        $guia = DB::table('guia_cabecera')->where('id', $idGuia)->first();
        return $guia ? (array) $guia : null;
    }

    private function construirDespatch(array $guia, int $idGuia): Despatch
    {
        $company = (new Company())
            ->setRuc(self::RUC_EMPRESA)
            ->setRazonSocial(self::RAZON_SOCIAL_EMPRESA);

        $envio = $this->construirShipment($guia);

        [$serie, $correlativo] = explode('-', $guia['num_guia']);
        $destinatario = $this->obtenerDestinatario($guia['ruc_destinatario']);

        $despatch = (new Despatch())
            ->setVersion('2022')
            ->setTipoDoc('09')
            ->setSerie($serie)
            ->setCorrelativo($correlativo)
            ->setFechaEmision($this->fechaPeru($guia['fecha_emision']))
            ->setCompany($company)
            ->setDestinatario((new Client())
                ->setTipoDoc('6')
                ->setNumDoc($guia['ruc_destinatario'])
                ->setRznSocial($destinatario['name'] ?? '-'))
            ->setEnvio($envio);

        $items = $this->obtenerDetallesGuia($idGuia);
        $despatch->setDetails($items);

        return $despatch;
    }

    private function construirShipment(array $guia): Shipment
    {
        $totalPeso = $guia['total_neto'] > 0 ? $guia['total_neto'] : $guia['total_bruto'];

        $envio = (new Shipment())
            ->setCodTraslado($guia['motivo_traslado'])
            ->setModTraslado($guia['modalidad_trasnporte'])
            ->setFecTraslado($this->fechaPeru($guia['fecha_traslado']))
            ->setPesoTotal(floatval($totalPeso))
            ->setUndPesoTotal('KGM');

        if ($guia['motivo_traslado'] == 13) {
            $envio->setDesTraslado($guia['descripcion_motivo'] ?? '');
        }

        $envio->setLlegada(new Direction($guia['ubigeo_destino'], $guia['destino']))
            ->setPartida(new Direction($guia['ubigeo'], $guia['origen']));

        if (!empty($guia['ruc_transportista'])) {
            $transportista = $this->obtenerTransportista($guia['ruc_transportista']);
            if ($transportista) {
                $transp = (new Transportist())
                    ->setTipoDoc($transportista['tipoDocumento'] ?? '6')
                    ->setNumDoc($transportista['ruc'] ?? '')
                    ->setRznSocial($transportista['razon_social'] ?? '')
                    ->setNroMtc($transportista['nro_mtc'] ?? '0001');

                $envio->setTransportista($transp);
            }
        }

        if (!empty($guia['ruc_conductor'])) {
            $conductor = $this->obtenerConductor($guia['ruc_conductor']);
            if ($conductor) {
                $chofer = (new Driver())
                    ->setTipo('Principal')
                    ->setTipoDoc('1')
                    ->setNroDoc($conductor['ruc'] ?? '')
                    ->setLicencia($conductor['licencia'] ?? '')
                    ->setNombres($conductor['nombres'] ?? '')
                    ->setApellidos($conductor['apellidos'] ?? '');

                $envio->setChoferes([$chofer]);

                if (!empty($guia['placa'])) {
                    $vehiculo = (new Vehicle())->setPlaca($guia['placa']);
                    $envio->setVehiculo($vehiculo);
                }
            }
        }

        return $envio;
    }

    private function obtenerDetallesGuia(int $idGuia): array
    {
        $detalles = DB::table('guia_detalle as g')
            ->leftJoin('product as p', 'g.id_producto', '=', 'p.id')
            ->select('g.*', 'p.code', 'p.description')
            ->where('g.id_guia', $idGuia)
            ->get();

        $items = [];
        foreach ($detalles as $row) {
            $row = (array) $row;
            $descripcion = !empty($row['descripcion_producto'])
                ? $row['descripcion_producto']
                : $row['description'];

            $item = (new DespatchDetail())
                ->setCantidad(floatval($row['cantidad']))
                ->setUnidad($row['unidad'] ?? 'NIU')
                ->setDescripcion($this->sanitizarTexto($descripcion))
                ->setCodigo($row['code'] ?? '');

            $items[] = $item;
        }

        return $items;
    }

    private function obtenerDestinatario(string $ruc): array
    {
        $dest = DB::table('person')->select('no', 'email1', 'phone1', 'address1', 'name')->where('no', $ruc)->first();
        return $dest ? (array) $dest : [];
    }

    private function obtenerTransportista(string $ruc): ?array
    {
        $transp = DB::table('transportistas')->where('ruc', $ruc)->first();
        return $transp ? (array) $transp : null;
    }

    private function obtenerConductor(string $ruc): ?array
    {
        $cond = DB::table('conductores')->where('ruc', $ruc)->first();
        return $cond ? (array) $cond : null;
    }

    private function actualizarGuiaAceptada(int $idGuia, string $ticket): void
    {
        DB::table('guia_cabecera')
            ->where('id', $idGuia)
            ->update([
                'estado' => 1,
                'ticket' => $ticket
            ]);
    }

    private function guardarRespuestaSunat(int $idGuia, string $respuesta): void
    {
        try {
            DB::table('respuesta_sunat_guias')->insert([
                'id_guia' => $idGuia,
                'respuesta' => $respuesta
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("guardarRespuestaSunat error: " . $e->getMessage());
        }
    }

    private function formatearRespuestaCdr($cdr): string
    {
        return sprintf(
            "ID: %s | Código: %s | Descripción: %s",
            $cdr->getId(),
            $cdr->getCode(),
            $cdr->getDescription()
        );
    }

    private function sanitizarTexto(string $texto): string
    {
        if (strpos($texto, '<table') === false) {
            return trim(strip_tags(str_replace('<br>', ' ', $texto)));
        }

        $partes = explode('<table', $texto, 2);
        $encabezado = trim(strip_tags(str_replace('<br>', ' ', $partes[0])));

        libxml_use_internal_errors(true);
        $dom = new DOMDocument();
        @$dom->loadHTML('<table' . $partes[1], LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $rows = $dom->getElementsByTagName('tr');

        if ($rows->length < 2) {
            return $encabezado;
        }

        $cantidadFila = $rows->item(0)->getElementsByTagName('td');
        $tallaFila = $rows->item(1)->getElementsByTagName('td');
        $pares = [];

        $maxColumnas = min($cantidadFila->length, $tallaFila->length);
        for ($i = 0; $i < $maxColumnas; $i++) {
            $cantidad = trim($cantidadFila->item($i)->nodeValue);
            $talla = trim($tallaFila->item($i)->nodeValue);
            if (!empty($cantidad) && !empty($talla)) {
                $pares[] = "$talla/$cantidad";
            }
        }

        return trim("$encabezado " . implode(' ', $pares));
    }

    private function saveXml(Despatch $despatch, ?string $xml): void
    {
        $path = storage_path('app/sunat/guias/xml');
        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }
        file_put_contents($path . DIRECTORY_SEPARATOR . $despatch->getName() . '.xml', $xml);
    }

    /**
     * Guarda el CDR con el mismo nombre que genera Greenter (RUC-09-SERIE-CORRELATIVO).
     */
    private function saveCdrPorNumero(string $numGuia, ?string $zip): void
    {
        $path = storage_path('app/sunat/guias/cdr');
        if (!file_exists($path)) {
            mkdir($path, 0755, true);
        }
        [$serie, $correlativo] = array_pad(explode('-', $numGuia, 2), 2, '');
        $nombre = self::RUC_EMPRESA . '-09-' . trim($serie) . '-' . trim($correlativo);
        file_put_contents($path . DIRECTORY_SEPARATOR . 'R-' . $nombre . '.zip', $zip);
    }
}
