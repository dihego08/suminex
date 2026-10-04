<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Operation extends Model
{
    protected $table = 'operation';
    public $timestamps = false;

    protected $fillable = [
        'product_id',
        'stock_id',
        'stock_destination_id',
        'operation_from_id',
        'q',
        'price_in',
        'price_out',
        'operation_type_id',
        'sell_id',
        'status',
        'is_draft',
        'is_traspase',
        'created_at'
    ];

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'product_id');
    }

    public function tipoOperacion()
    {
        return $this->belongsTo(OperationType::class, 'operation_type_id');
    }
}
