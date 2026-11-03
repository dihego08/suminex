<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecomendacionSst extends Model
{
    use HasFactory;

    protected $table = 'recomendaciones_sst';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'fecha_recomendacion',
        'fecha_capacitacion',
        'tipo_recomendacion',
        'referencia_recomendacion',
        'observaciones',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
