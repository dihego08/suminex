<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenPedidoDetalle extends Model
{
    protected $table = 'ordenes_pedido_detalles';
    
    protected $fillable = [
        'id_orden_pedido',
        'id_producto',
        'descripcion_personalizada',
        'cantidad',
        'precio_unitario',
        'total'
    ];

    public function orden()
    {
        return $this->belongsTo(OrdenPedido::class, 'id_orden_pedido');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
