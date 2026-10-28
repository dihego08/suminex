-- Indica si la orden de pedido aplica IGV (1) o no (0). Las órdenes existentes quedan con IGV.
ALTER TABLE ordenes_pedido
ADD COLUMN aplica_igv TINYINT(1) NOT NULL DEFAULT 1 AFTER igv;

-- Las órdenes ya generadas desde cotizaciones sin IGV heredan ese valor
-- (requiere haber ejecutado antes alter_cotizaciones_aplica_igv.sql)
UPDATE ordenes_pedido o
JOIN cotizaciones c ON c.id = o.id_cotizacion
SET o.aplica_igv = c.aplica_igv;
