<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenCompraDetalle extends Model
{
    protected $table = 'ordenes_compra_detalle';
    public $timestamps = false;

    protected $fillable = [
        'id_orden',
        'id_producto',
        'descripcion',
        'cantidad',
        'unidad',
        'proveedor',
        'fecha_compra',
        'precio_unitario',
        'total',
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenCompra::class, 'id_orden');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
