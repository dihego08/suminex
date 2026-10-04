<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';
    
    protected $fillable = [
        'codigo',
        'descripcion',
        'marca',
        'precio_base',
        'stock',
        'unidad_medida',
        'estado',
        'tipo',
        'nombre',
        'codigo_barras',
        'presentacion',
        'largo',
        'ancho',
        'alto',
        'peso',
        'stock_minimo',
        'precio_compra',
        'fecha_actualizacion',
        'imagen',
        'ficha_tecnica'
    ];

    public function preciosClientes()
    {
        return $this->hasMany(PrecioCliente::class, 'id_producto');
    }

    public function unidadesSecundarias()
    {
        return $this->hasMany(ProductoUnidad::class, 'id_producto');
    }
}
