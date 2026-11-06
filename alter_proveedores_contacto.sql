-- Datos adicionales del proveedor: persona de contacto, rubro, ubicación y observaciones.
ALTER TABLE proveedores
    ADD COLUMN contacto_nombre VARCHAR(150) NULL AFTER email,
    ADD COLUMN contacto_cargo VARCHAR(100) NULL AFTER contacto_nombre,
    ADD COLUMN rubro VARCHAR(100) NULL AFTER contacto_cargo,
    ADD COLUMN ubicacion VARCHAR(255) NULL AFTER rubro,
    ADD COLUMN observaciones TEXT NULL AFTER ubicacion;
