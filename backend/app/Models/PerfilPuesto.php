<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerfilPuesto extends Model
{
    use HasFactory;

    protected $table = 'perfil_puesto';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_puesto',
        'reporta_a',
        'supervisa_a',
        'interactua_con',
        'reemplazado_por',
        'objetivo',
        'funciones',
        'responsabilidades',
        'equipo_utilizado',
        'lugar_trabajo',
        'requerimientos_fisicos',
        'formacion_basica',
        'conocimientos_especificos',
        'experiencia_requerida',
        'idioma',
        'competencia_especifica',
        'elaborado_por',
        'aprobado_por',
        'fecha_aprobacion',
        'competencia_cardinal',
        'formacion_basica_optima',
        'experiencia_requerida_optima'
    ];

    public function puesto()
    {
        return $this->belongsTo(Puesto::class, 'id_puesto');
    }
}
