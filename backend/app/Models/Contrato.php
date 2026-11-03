<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contrato extends Model
{
    use HasFactory;

    protected $table = 'contratos';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'periodo',
        'fecha_inicio',
        'fecha_fin',
        'id_tipo_contrato',
        'observaciones',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
