<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PrecioCliente extends Model
{
    protected $table = 'precios_cliente';
    public $timestamps = false; // La tabla que creamos no tiene timestamps

    protected $fillable = [
        'id_producto',
        'id_cliente',
        'precio_personalizado'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente');
    }
}
