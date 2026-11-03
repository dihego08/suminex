<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContenidoBiblioteca extends Model
{
    protected $table = 'contenido_biblioteca';
    public $timestamps = false;
    protected $fillable = ['archivo', 'id_carpeta', 'fecha_creacion'];
}
