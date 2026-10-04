<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'id_cliente',
        'id_orden_pedido',
        'id_forma_pago',
        'id_estado_pago',
        'id_estado_entrega',
        'descuento',
        'desc_descuento',
        'incluye_igv',
        'tipo_documento',
        'serie',
        'correlativo',
        'fecha_emision',
        'fecha_vencimiento',
        'moneda',
        'subtotal',
        'igv',
        'total',
        'estado',
        'sunat_ticket',
        'sunat_hash',
        'xml_path',
        'cdr_path',
        'pdf_path',
        'envio_sunat'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente');
    }

    public function ordenPedido()
    {
        return $this->belongsTo(OrdenPedido::class, 'id_orden_pedido');
    }

    public function detalles()
    {
        return $this->hasMany(VentaDetalle::class, 'id_venta');
    }

    public function cuotas()
    {
        return $this->hasMany(VentaCuota::class, 'id_venta');
    }
}
