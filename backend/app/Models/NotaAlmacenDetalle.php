<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotaAlmacenDetalle extends Model
{
    protected $table = 'notas_almacen_detalle';
    public $timestamps = false;

    protected $fillable = [
        'id_nota',
        'id_producto',
        'descripcion',
        'cantidad',
        'unidad',
        'observacion',
    ];

    public function nota()
    {
        return $this->belongsTo(NotaAlmacen::class, 'id_nota');
    }

    public function producto()
    {
        return $this->belongsTo(Producto::class, 'id_producto');
    }
}
