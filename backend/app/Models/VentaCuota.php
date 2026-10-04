<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VentaCuota extends Model
{
    protected $table = 'venta_cuotas';
    public $timestamps = false;
    
    protected $fillable = [
        'id_venta',
        'monto',
        'fecha_pago'
    ];

    public function venta()
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
