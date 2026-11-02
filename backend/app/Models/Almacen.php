<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Almacenes (tabla legacy "stock").
 */
class Almacen extends Model
{
    protected $table = 'stock';
    public $timestamps = false;

    protected $fillable = ['name', 'address', 'phone', 'email', 'is_principal'];
}
