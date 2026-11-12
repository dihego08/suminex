-- Amplía la precisión de precio_unitario en cotizaciones y órdenes de pedido para evitar truncamiento de decimales
ALTER TABLE `cotizacion_detalles` MODIFY `precio_unitario` DECIMAL(14,6) NOT NULL;
ALTER TABLE `ordenes_pedido_detalles` MODIFY `precio_unitario` DECIMAL(14,6) NOT NULL;

