-- Corrige ventas creadas con "Precios incluyen IGV" ANTES del ajuste del 2026-10-28.
-- Esas ventas guardaron en ventas_detalles el precio CON IGV, pero precio_unitario debe ser SIN IGV
-- (SUNAT las rechazaba con error 3277).
--
-- IMPORTANTE: ejecutar UNA SOLA VEZ. Solo afecta ventas no enviadas a SUNAT con id <= 66
-- (las creadas después del despliegue ya se guardan correctamente y no deben tocarse).

-- 1) Revisar qué se va a corregir
SELECT v.id, CONCAT(v.serie, '-', v.correlativo) AS comprobante, v.subtotal, v.total,
       SUM(d.total) AS suma_lineas_actual
FROM ventas v
JOIN ventas_detalles d ON d.id_venta = v.id
WHERE v.incluye_igv = 1 AND v.envio_sunat = 0 AND v.id <= 66
GROUP BY v.id, v.serie, v.correlativo, v.subtotal, v.total;

-- 2) Corregir (MySQL asigna de izquierda a derecha: total usa el precio_unitario ya corregido)
UPDATE ventas_detalles d
JOIN ventas v ON v.id = d.id_venta
SET d.precio_unitario = ROUND(d.precio_unitario / 1.18, 6),
    d.total = ROUND(d.cantidad * d.precio_unitario, 2)
WHERE v.incluye_igv = 1 AND v.envio_sunat = 0 AND v.id <= 66;

-- 3) Limpiar el mensaje de error guardado para que se puedan reenviar
UPDATE ventas SET sunat_hash = NULL
WHERE envio_sunat = 0 AND sunat_hash LIKE 'ERROR:%';
