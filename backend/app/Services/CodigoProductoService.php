<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Genera el código automático de producto:
 * código de marca + 3 primeras letras de la categoría + correlativo de 2 dígitos (ej. 01ACC01).
 */
class CodigoProductoService
{
    public static function prefijoCategoria(string $categoria): string
    {
        $mayusculas = mb_strtoupper($categoria, 'UTF-8');
        $sinTildes = strtr($mayusculas, ['Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U']);
        $letras = preg_replace('/[^A-ZÑ]/u', '', $sinTildes);

        return mb_substr($letras, 0, 3, 'UTF-8');
    }

    /**
     * Dentro de una transacción, el bloqueo sobre la marca hace que dos productos
     * de la misma marca guardados a la vez no obtengan el mismo correlativo.
     */
    public static function generar(string $marca, int $idCategoria): string
    {
        $codigoMarca = DB::table('brand')->where('name', $marca)->lockForUpdate()->value('codigo');
        if (!$codigoMarca) {
            throw ValidationException::withMessages(['marca' => "La marca \"{$marca}\" no tiene código asignado."]);
        }

        $categoria = DB::table('categorias')->where('id', $idCategoria)->value('categoria');
        $prefijoCategoria = self::prefijoCategoria((string) $categoria);
        if (mb_strlen($prefijoCategoria, 'UTF-8') < 3) {
            throw ValidationException::withMessages(['id_categoria' => 'La categoría debe tener al menos 3 letras para generar el código.']);
        }

        $prefijo = $codigoMarca . $prefijoCategoria;

        // Se incluyen los productos dados de baja: el código es único también para ellos.
        $ultimo = DB::table('productos')
            ->where('codigo', 'like', $prefijo . '%')
            ->pluck('codigo')
            ->map(fn ($codigo) => mb_substr($codigo, mb_strlen($prefijo, 'UTF-8'), null, 'UTF-8'))
            ->filter(fn ($correlativo) => ctype_digit($correlativo))
            ->map(fn ($correlativo) => (int) $correlativo)
            ->max() ?? 0;

        return $prefijo . str_pad((string) ($ultimo + 1), 2, '0', STR_PAD_LEFT);
    }
}
