-- Agrega el campo 'incluye_igv' a las cotizaciones y órdenes de pedido
ALTER TABLE cotizaciones ADD COLUMN incluye_igv TINYINT(1) NOT NULL DEFAULT 0 AFTER aplica_igv;
ALTER TABLE ordenes_pedido ADD COLUMN incluye_igv TINYINT(1) NOT NULL DEFAULT 0 AFTER aplica_igv;

