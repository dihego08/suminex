<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Area extends Model
{
    use HasFactory;

    protected $table = 'areas';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'area'
    ];

    public function puestos()
    {
        return $this->hasMany(Puesto::class, 'id_area');
    }
}
