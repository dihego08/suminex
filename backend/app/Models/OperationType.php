<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationType extends Model
{
    protected $table = 'operation_type';
    public $timestamps = false;

    protected $fillable = [
        'name'
    ];
}
