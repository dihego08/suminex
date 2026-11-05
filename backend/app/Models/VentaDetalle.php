<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaDetalle extends Model
{
    protected $table = 'ventas_detalles';

    protected $fillable = [
        'id_venta',
        'id_producto',
        'descripcion_personalizada',
        'cantidad',
        'precio_unitario',
        'total'
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }

    /**
     * Descripción del ítem en todos los documentos (PDF y XML de SUNAT de factura, boleta y nota de crédito,
     * y al importar la venta en una guía): "Nombre del producto - Descripción personalizada".
     */
    public function getDescripcionCompletaAttribute(): string
    {
        return implode(' - ', array_filter([
            trim((string) ($this->producto->nombre ?? '')),
            trim((string) ($this->descripcion_personalizada ?? '')),
        ], fn ($parte) => $parte !== ''));
    }
}
