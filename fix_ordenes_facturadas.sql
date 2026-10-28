-- Marca como Facturada las órdenes de pedido que ya fueron jaladas en una venta vigente (no anulada)
-- y que quedaron en Pendiente porque antes no se actualizaba el estado.

-- 1) Revisar cuáles se van a actualizar
SELECT o.id, o.numero, o.estado, CONCAT(v.serie, '-', v.correlativo) AS venta
FROM ordenes_pedido o
JOIN ventas v ON v.id_orden_pedido = o.id AND v.estado <> 'Anulada'
WHERE o.estado = 'Pendiente';

-- 2) Actualizar
UPDATE ordenes_pedido o
JOIN ventas v ON v.id_orden_pedido = o.id AND v.estado <> 'Anulada'
SET o.estado = 'Facturada'
WHERE o.estado = 'Pendiente';
