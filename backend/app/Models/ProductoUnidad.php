<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductoUnidad extends Model
{
    protected $table = 'producto_unidades';
    public $timestamps = false;
    
    protected $fillable = [
        'id_producto',
        'unidad_medida',
        'factor_conversion',
        'precio'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
