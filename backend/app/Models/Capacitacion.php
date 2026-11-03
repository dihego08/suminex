<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Capacitacion extends Model
{
    use HasFactory;

    protected $table = 'capacitaciones';
    public $timestamps = false;

    protected $fillable = [
        'id_colaborador',
        'curso',
        'horas',
        'fecha',
        'capacitador',
        'lugar',
        'archivo'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
