CREATE TABLE IF NOT EXISTS producto_unidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    unidad_medida VARCHAR(20) NOT NULL,
    factor_conversion DECIMAL(8,2) NOT NULL DEFAULT 1.00,
    precio DECIMAL(10,2) NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
