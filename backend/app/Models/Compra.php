<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Compra extends Model
{
    protected $table = 'compras';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'serie',
        'numeracion',
        'id_proveedor',
        'proveedor',
        'igv',
        'gravado',
        'exonerado',
        'otros_no_gravado',
        'total',
        'fecha_creacion',
        'tipo_documento',
        'id_forma_pago',
        'fecha_detraccion',
        'numero_detraccion',
        'tipo_cambio',
        'fecha_comprobante',
        'serie_comprobante',
        'documento_comprobante',
        'fproceso'
    ];

    public function proveedorRel()
    {
        return $this->belongsTo(Proveedor::class, 'id_proveedor');
    }

    public function detalles()
    {
        return $this->hasMany(CompraDetalle::class, 'id_compra');
    }
}
