-- 1. Actualizar tabla cotizaciones para agregar campos de la proforma
ALTER TABLE cotizaciones 
ADD COLUMN numero VARCHAR(20) NOT NULL AFTER id,
ADD COLUMN fecha_vencimiento DATE NOT NULL AFTER fecha,
ADD COLUMN base_imponible DECIMAL(10,2) NOT NULL AFTER fecha_vencimiento,
ADD COLUMN igv DECIMAL(10,2) NOT NULL AFTER base_imponible;

-- 2. Crear la tabla de detalles de la cotización
CREATE TABLE IF NOT EXISTS cotizacion_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion INT NOT NULL,
    id_producto INT NOT NULL,
    descripcion_personalizada VARCHAR(255) NULL, -- Por si le cambian el nombre al cotizar
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
