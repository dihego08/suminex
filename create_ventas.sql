CREATE TABLE ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    id_orden_pedido INT NULL,
    tipo_documento VARCHAR(2) NOT NULL DEFAULT '01', -- 01: Factura, 03: Boleta
    serie VARCHAR(4) NOT NULL,
    correlativo INT NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NULL,
    moneda VARCHAR(3) NOT NULL DEFAULT 'PEN',
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('Emitida', 'Anulada', 'Pendiente') DEFAULT 'Emitida',
    sunat_ticket VARCHAR(255) NULL,
    sunat_hash VARCHAR(255) NULL,
    xml_path VARCHAR(255) NULL,
    cdr_path VARCHAR(255) NULL,
    pdf_path VARCHAR(255) NULL,
    envio_sunat TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_orden_pedido) REFERENCES ordenes_pedido(id) ON DELETE SET NULL
);

CREATE TABLE ventas_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    id_producto INT NOT NULL,
    descripcion_personalizada TEXT NULL,
    cantidad DECIMAL(10,2) NOT NULL,
    precio_unitario DECIMAL(10,6) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE RESTRICT
);
