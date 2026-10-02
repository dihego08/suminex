<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CotizacionDetalle extends Model
{
    protected $table = 'cotizacion_detalles';
    public $timestamps = false;
    
    protected $fillable = [
        'id_cotizacion',
        'id_producto',
        'descripcion_personalizada',
        'cantidad',
        'precio_unitario',
        'total'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
