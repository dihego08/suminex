<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Formacion extends Model
{
    use HasFactory;

    protected $table = 'formacion';
    public $timestamps = false;

    protected $fillable = [
        'formacion',
        'lugar',
        'archivo',
        'id_colaborador'
    ];

    public function colaborador()
    {
        return $this->belongsTo(Colaborador::class, 'id_colaborador', 'id');
    }
}
