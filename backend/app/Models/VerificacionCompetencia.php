<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VerificacionCompetencia extends Model
{
    use HasFactory;

    protected $table = 'verificacion_competencias';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'periodo',
        'fecha_inicio',
        'observaciones',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
