<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrdenCompra extends Model
{
    protected $table = 'ordenes_compra';

    public const PENDIENTE = 'PENDIENTE';
    public const ATENDIDA = 'ATENDIDA';
    public const ANULADA = 'ANULADA';

    protected $fillable = [
        'numero',
        'tipo_compra',
        'fecha_emision',
        'solicitante',
        'area',
        'fecha_requerida',
        'lugar_entrega',
        'observaciones',
        'total',
        'estado',
        'id_usuario',
    ];

    protected $appends = ['codigo'];

    /** "OC-0001" */
    public function getCodigoAttribute(): string
    {
        return 'OC-' . str_pad((string) $this->numero, 4, '0', STR_PAD_LEFT);
    }

    public function detalles()
    {
        return $this->hasMany(OrdenCompraDetalle::class, 'id_orden');
    }
}
