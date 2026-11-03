<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Puesto extends Model
{
    use HasFactory;

    protected $table = 'puestos';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_area',
        'puesto'
    ];

    public function area()
    {
        return $this->belongsTo(Area::class, 'id_area');
    }

    public function perfil()
    {
        return $this->hasOne(PerfilPuesto::class, 'id_puesto');
    }
}
