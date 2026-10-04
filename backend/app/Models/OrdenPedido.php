<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenPedido extends Model
{
    protected $table = 'ordenes_pedido';
    
    protected $fillable = [
        'id_cotizacion',
        'numero',
        'id_cliente',
        'fecha',
        'estado',
        'base_imponible',
        'igv',
        'total',
        'terminos_condiciones'
    ];

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'id_cotizacion');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente');
    }

    public function detalles()
    {
        return $this->hasMany(OrdenPedidoDetalle::class, 'id_orden_pedido');
    }
}
