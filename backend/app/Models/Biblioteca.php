<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Biblioteca extends Model
{
    protected $table = 'biblioteca';
    public $timestamps = false;
    protected $fillable = ['nombre_carpeta', 'id_padre', 'mostrar'];
    
    public function children()
    {
        return $this->hasMany(Biblioteca::class, 'id_padre', 'id');
    }
    
    public function files()
    {
        return $this->hasMany(ContenidoBiblioteca::class, 'id_carpeta', 'id');
    }
}
