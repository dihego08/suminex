<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotaAlmacen extends Model
{
    protected $table = 'notas_almacen';

    public const INGRESO = 'INGRESO';
    public const SALIDA = 'SALIDA';

    protected $fillable = [
        'tipo',
        'serie',
        'numero',
        'fecha',
        'id_almacen',
        'area',
        'doc_referencia',
        'persona',
        'motivo',
        'detalle_motivo',
        'observaciones',
        'estado',
        'id_usuario',
    ];

    protected $appends = ['codigo'];

    /** "NS-00000001" */
    public function getCodigoAttribute(): string
    {
        return $this->serie . '-' . str_pad((string) $this->numero, 8, '0', STR_PAD_LEFT);
    }

    public function detalles()
    {
        return $this->hasMany(NotaAlmacenDetalle::class, 'id_nota');
    }

    public function almacen()
    {
        return $this->belongsTo(Almacen::class, 'id_almacen');
    }
}
