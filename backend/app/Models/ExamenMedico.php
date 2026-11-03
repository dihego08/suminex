<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamenMedico extends Model
{
    use HasFactory;

    protected $table = 'examenes_medicos';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'periodo',
        'fecha',
        'id_tipo_examen',
        'id_aptitud',
        'observaciones',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
