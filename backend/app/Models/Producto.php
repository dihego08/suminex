<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';
    
    protected $fillable = [
        'codigo',
        'descripcion',
        'precio_base',
        'stock',
        'unidad_medida',
        'estado'
    ];

    public function preciosClientes()
    {
        return $this->hasMany(PrecioCliente::class, 'id_producto');
    }
}
