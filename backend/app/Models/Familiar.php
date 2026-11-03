<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Familiar extends Model
{
    use HasFactory;

    protected $table = 'familiares';
    public $timestamps = false;

    protected $fillable = [
        'dni',
        'nombre',
        'apellidos',
        'fecha_nacimiento',
        'lugar_nacimiento',
        'telefono',
        'parentesco',
        'id_colaborador'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
