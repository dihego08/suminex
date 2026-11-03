<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExperienciaLaboral extends Model
{
    use HasFactory;

    protected $table = 'experiencia_laboral';
    public $timestamps = false;

    protected $fillable = [
        'empresa',
        'cargo',
        'responsabilidades',
        'fecha_ingreso',
        'fecha_termino',
        'tiempo_servicio',
        'motivo_cese',
        'archivo',
        'id_colaborador'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
