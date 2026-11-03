<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vacacion extends Model
{
    use HasFactory;

    protected $table = 'vacaciones';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'periodo',
        'fecha_salida',
        'fecha_retorno',
        'dias',
        'observaciones',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
