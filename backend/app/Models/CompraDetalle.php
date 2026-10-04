<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompraDetalle extends Model
{
    protected $table = 'compras_detalle';
    public $timestamps = false;

    protected $fillable = [
        'codigo_compra',
        'id_compra',
        'id_insumo',
        'precio',
        'cantidad',
        'unidad',
        'total'
    ];

    public function compra()
    {
        return $this->belongsTo(Compra::class, 'id_compra');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_insumo');
    }
}
