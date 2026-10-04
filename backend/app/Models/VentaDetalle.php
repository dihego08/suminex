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
}
