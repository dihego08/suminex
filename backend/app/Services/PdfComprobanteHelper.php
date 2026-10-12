<?php

namespace App\Services;

/**
 * Utilidades compartidas para las representaciones impresas (factura, boleta, guía).
 */
class PdfComprobanteHelper
{
    public const RUC = '20615095932';
    public const RAZON_SOCIAL = 'CORPORACION DE SERVICIOS MULTIPLES SUMINEX S.A.C.';
    public const DIRECCION = 'JR. MANTARO 100 SEMI RURAL PACHACUTEC ZON FRENTE A LA INTERSECCION AREQUIPA-AREQUIPA-CERRO COLORADO';
    public const EMAIL = 'suminexsac@gmail.com';
    public const CONTACTO = '929288621 / 920870534';

    public const COLOR = '#34445c';

    public static function logoSrc(): string
    {
        $candidatos = [
            base_path('public/img/logo-4.png'),
            base_path('../frontend/public/logo-4.png'),
        ];
        foreach ($candidatos as $path) {
            if (file_exists($path)) {
                return 'data:image/png;base64,' . base64_encode(file_get_contents($path));
            }
        }
        return '';
    }

    /** "F001", 1 => "F001 - 00000001" */
    public static function numeroDocumento(string $serie, $correlativo): string
    {
        return $serie . ' - ' . str_pad((string) $correlativo, 8, '0', STR_PAD_LEFT);
    }

    /** "T001-1" => "T001 - 00000001" */
    public static function numeroDesdeTexto(?string $numero): string
    {
        $partes = explode('-', (string) $numero, 2);
        if (count($partes) === 2 && is_numeric(trim($partes[1]))) {
            return self::numeroDocumento(trim($partes[0]), (int) trim($partes[1]));
        }
        return (string) $numero;
    }

    public static function fecha($fecha): string
    {
        if (empty($fecha)) {
            return '—';
        }
        $ts = strtotime((string) $fecha);
        return $ts ? date('d/m/Y', $ts) : (string) $fecha;
    }

    public static function valor($valor): string
    {
        $valor = trim((string) $valor);
        return $valor === '' ? '—' : e($valor);
    }

    /** Devuelve un data URI SVG con el QR, o null si la librería no está disponible. */
    public static function qrDataUri(string $texto, int $size = 110): ?string
    {
        if (!class_exists(\BaconQrCode\Writer::class)) {
            return null;
        }
        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            new \BaconQrCode\Renderer\RendererStyle\RendererStyle($size, 0),
            new \BaconQrCode\Renderer\Image\SvgImageBackEnd()
        );
        $svg = (new \BaconQrCode\Writer($renderer))->writeString($texto);
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    public static function estilosBase(string $margenInferior): string
    {
        $c = self::COLOR;
        return '@page{margin: 32px 36px ' . $margenInferior . ' 36px;}'
            . 'body{font-family: Helvetica, Arial, sans-serif; font-size: 10.5px; color: #222; margin: 0; padding: 0;}'
            . 'table{border-collapse: collapse; width: 100%;}'
            . 'td, th{vertical-align: top;}'
            . '.lbl{font-weight: bold; color: #222;}'
            . '.box{border: 1px solid #cfd3da; padding: 8px 12px;}'
            . '.box-dark{border: 1px solid #555;  padding: 10px 14px;}'
            . '.sec-title{font-weight: bold; font-size: 11px; letter-spacing: 0.3px; margin: 0 0 6px 0;}'
            . '.items th{background: ' . $c . '; color: #fff; font-weight: bold; padding: 7px 6px; font-size: 10.5px;}'
            . '.items td{padding: 6px 6px; font-size: 10.5px;}'
            . '.muted{color: #555;}';
    }

    /** Cabecera: logo + datos del emisor a la izquierda, recuadro del documento a la derecha. */
    public static function cabecera(string $tituloDocumento, string $numero, bool $bandaOscura = true): string
    {
        $logo = self::logoSrc();
        $c = self::COLOR;

        if ($bandaOscura) {
            $recuadro = '<table style="border: 1px solid ' . $c . ';">'
                . '<tr><td style="text-align:center; padding: 10px 6px; font-size: 13px; font-weight: bold;">R.U.C. ' . self::RUC . '</td></tr>'
                . '<tr><td style="text-align:center; padding: 9px 6px; font-size: 13px; font-weight: bold; background: ' . $c . '; color: #fff; letter-spacing: 0.5px;">' . $tituloDocumento . '</td></tr>'
                . '<tr><td style="text-align:center; padding: 10px 6px; font-size: 15px; font-weight: bold;">' . e($numero) . '</td></tr>'
                . '</table>';
        } else {
            $recuadro = '<table style="border: 1px solid ' . $c . ';">'
                . '<tr><td style="text-align:center; padding: 12px 8px 4px 8px; font-size: 13px; font-weight: bold;">R.U.C. ' . self::RUC . '</td></tr>'
                . '<tr><td style="text-align:center; padding: 4px 8px; font-size: 13px; font-weight: bold;">' . $tituloDocumento . '</td></tr>'
                . '<tr><td style="text-align:center; padding: 6px 8px 12px 8px; font-size: 15px; font-weight: bold;">' . e($numero) . '</td></tr>'
                . '</table>';
        }

        return '<table style="margin-bottom: 16px;"><tr>'
            . '<td style="width: 62%; padding-right: 20px;">'
            . ($logo ? '<img src="' . $logo . '" style="width: 115px; margin-bottom: 8px;" /><br/>' : '')
            . '<div style="font-size: 13px; font-weight: bold; color: ' . $c . '; margin-bottom: 3px;">' . self::RAZON_SOCIAL . '</div>'
            . '<div class="muted" style="line-height: 1.45;">RUC: ' . self::RUC . '<br/>'
            . 'Dirección: ' . self::DIRECCION . '<br/>'
            . self::EMAIL . ' · Contacto: ' . self::CONTACTO . '</div>'
            . '</td>'
            . '<td style="width: 38%;">' . $recuadro . '</td>'
            . '</tr></table>';
    }

    /** Datos bancarios completos (factura / boleta). */
    public static function datosBancarios(): string
    {
        $c = self::COLOR;
        $fila = function ($label, $valor) {
            return '<tr><td style="padding: 2px 8px; width: 48%; font-weight: bold;">' . $label . '</td><td style="padding: 2px 8px;">' . $valor . '</td></tr>';
        };
        $banco = function ($nombre) use ($c) {
            return '<tr><td colspan="2" style="background: #e8eaef; color: ' . $c . '; font-weight: bold; padding: 5px 8px; margin-top: 4px;">' . $nombre . '</td></tr>';
        };

        return '<table>'
            . '<tr><td colspan="2" style="background: ' . $c . '; color: #fff; font-weight: bold; text-align: center; padding: 8px; font-size: 11px;">DATOS BANCARIOS PARA DEPÓSITO / TRANSFERENCIA</td></tr>'
            . '<tr><td colspan="2" style="height: 6px;"></td></tr>'
            . $banco('INTERBANK')
            . $fila('Cuenta Corriente Soles:', '300-3008153316')
            . $fila('Cuenta Interbancaria (CCI) Soles:', '003-300-003008153316-15')
            . $fila('Cuenta Corriente Dólares:', '300-3008153323')
            . $fila('Cuenta Interbancaria (CCI) Dólares:', '003-300-003008153323-11')
            . '<tr><td colspan="2" style="height: 4px;"></td></tr>'
            . $banco('BCP')
            . $fila('Cuenta Corriente Soles:', '2157415302056')
            . $fila('Cuenta Interbancaria (CCI):', '00221500741530205620')
            . '</table>';
    }

    /** Datos bancarios compactos (guía). */
    public static function datosBancariosCompactos(): string
    {
        return '<div class="box-dark" style="font-size: 9.5px; line-height: 1.6;">'
            . '<div class="sec-title" style="font-size: 10px; margin-bottom: 2px;">DATOS BANCARIOS</div>'
            . '<strong>INTERBANK</strong> – Soles: 300-3008153316 / CCI: 003-300-003008153316-15 · Dólares: 300-3008153323 / CCI: 003-300-003008153323-11<br/>'
            . '<strong>BCP</strong> – Soles: 2157415302056 / CCI: 00221500741530205620'
            . '</div>';
    }

    public static function montoEnLetras(float $monto, string $moneda = 'PEN'): string
    {
        $entero = (int) floor(round($monto, 2));
        $centimos = (int) round(($monto - $entero) * 100);
        if ($centimos === 100) {
            $entero++;
            $centimos = 0;
        }
        $nombreMoneda = $moneda === 'USD' ? 'DÓLARES AMERICANOS' : 'SOLES';
        $letras = $entero === 0 ? 'CERO' : self::numeroALetras($entero);
        return $letras . ' CON ' . str_pad((string) $centimos, 2, '0', STR_PAD_LEFT) . '/100 ' . $nombreMoneda;
    }

    private static function numeroALetras(int $n): string
    {
        if ($n >= 1000000) {
            $millones = intdiv($n, 1000000);
            $resto = $n % 1000000;
            $txt = $millones === 1 ? 'UN MILLÓN' : self::numeroALetras($millones) . ' MILLONES';
            return trim($txt . ($resto ? ' ' . self::numeroALetras($resto) : ''));
        }
        if ($n >= 1000) {
            $miles = intdiv($n, 1000);
            $resto = $n % 1000;
            $txt = $miles === 1 ? 'MIL' : self::centenas($miles, true) . ' MIL';
            return trim($txt . ($resto ? ' ' . self::centenas($resto) : ''));
        }
        return self::centenas($n);
    }

    private static function centenas(int $n, bool $apocope = false): string
    {
        $centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
        if ($n === 100) {
            return 'CIEN';
        }
        $c = intdiv($n, 100);
        $resto = $n % 100;
        return trim($centenas[$c] . ($resto ? ' ' . self::decenas($resto, $apocope) : ''));
    }

    private static function decenas(int $n, bool $apocope): string
    {
        $unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
            'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
            'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
        $decenas = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];

        if ($n < 30) {
            $txt = $unidades[$n];
            if ($apocope && $n === 1) return 'UN';
            if ($apocope && $n === 21) return 'VEINTIÚN';
            return $txt;
        }
        $d = intdiv($n, 10);
        $u = $n % 10;
        if ($u === 0) {
            return $decenas[$d];
        }
        return $decenas[$d] . ' Y ' . ($apocope && $u === 1 ? 'UN' : $unidades[$u]);
    }
}
