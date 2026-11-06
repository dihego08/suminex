-- Datos adicionales del cliente: rubro y nombre de la persona de contacto.
ALTER TABLE clientes
    ADD COLUMN contacto_nombre VARCHAR(150) NULL AFTER email,
    ADD COLUMN rubro VARCHAR(100) NULL AFTER contacto_nombre;
