<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenPedido extends Model
{
    protected $table = 'ordenes_pedido';
    
    protected $fillable = [
        'id_cotizacion',
        'fecha',
        'estado'
    ];

    public function cotizacion()
    {
        return $this->belongsTo(Cotizacion::class, 'id_cotizacion');
    }
}
