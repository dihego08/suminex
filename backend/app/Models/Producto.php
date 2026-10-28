<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Producto extends Model
{
    protected $table = 'productos';

    // estado: 1 = activo, 0 = eliminado (baja lógica, nunca se borra físicamente)
    protected $attributes = [
        'estado' => 1,
    ];

    public function scopeActivos($query)
    {
        return $query->where($this->getTable() . '.estado', 1);
    }

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
