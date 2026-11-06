-- Número de orden de compra del cliente, digitado en la venta. Se muestra en el PDF de la factura / boleta.
ALTER TABLE ventas
ADD COLUMN orden_compra VARCHAR(50) NULL AFTER id_orden_pedido;
