<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    // estado: 1 = activo, 0 = eliminado (baja lógica, se conserva por los documentos asociados)
    protected $attributes = [
        'estado' => 1,
    ];

    public function scopeActivos($query)
    {
        return $query->where($this->getTable() . '.estado', 1);
    }

    protected $fillable = [
        'razon_social',
        'ruc',
        'direccion',
        'telefono',
        'email',
        'estado',
        'tipo_pago',
        'banco',
        'nro_cuenta',
        'whatsapp',
        'tiene_credito',
        'limite_credito'
    ];

    public function preciosPersonalizados()
    {
        return $this->hasMany(PrecioCliente::class, 'id_cliente');
    }
}
