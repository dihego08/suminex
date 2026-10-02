<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';
    
    protected $fillable = [
        'razon_social',
        'ruc',
        'direccion',
        'telefono',
        'email',
        'estado'
    ];

    public function preciosPersonalizados()
    {
        return $this->hasMany(PrecioCliente::class, 'id_cliente');
    }
}
