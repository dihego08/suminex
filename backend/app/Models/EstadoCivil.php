<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EstadoCivil extends Model
{
    protected $table = 'estado_civil';
    public $timestamps = false;

    protected $fillable = ['estado_civil'];
}
