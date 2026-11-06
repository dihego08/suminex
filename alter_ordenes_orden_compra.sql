-- PDF de la orden de compra que envía el cliente, adjunto a la orden de pedido.
-- Guarda solo el nombre del archivo; el archivo queda en public/uploads/ordenes_compra de la API.
ALTER TABLE ordenes_pedido
ADD COLUMN orden_compra_archivo VARCHAR(255) NULL AFTER terminos_condiciones;
