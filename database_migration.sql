-- =======================================================
-- MIGRACIÓN DE BASE DE DATOS PARA SISTEMA DE SUMINISTROS
-- =======================================================

-- 1. TABLA: CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    estado TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. TABLA: PROVEEDORES
CREATE TABLE IF NOT EXISTS proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    razon_social VARCHAR(255) NOT NULL,
    ruc VARCHAR(20) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(100),
    estado TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. TABLA: PRODUCTOS
CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    precio_base DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    unidad_medida VARCHAR(20) DEFAULT 'UND',
    estado TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. TABLA: PRECIOS_CLIENTE (Precios personalizados por cliente)
CREATE TABLE IF NOT EXISTS precios_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_producto INT NOT NULL,
    id_cliente INT NOT NULL,
    precio_personalizado DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (id_producto) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE CASCADE,
    UNIQUE(id_producto, id_cliente)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. TABLA: COMPRAS
CREATE TABLE IF NOT EXISTS compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_proveedor INT NOT NULL,
    fecha_compra DATE NOT NULL,
    numero_comprobante VARCHAR(50),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'Completada',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. TABLA: COTIZACIONES
CREATE TABLE IF NOT EXISTS cotizaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    fecha DATE NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. TABLA: ORDENES_PEDIDO
CREATE TABLE IF NOT EXISTS ordenes_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_cotizacion INT NOT NULL,
    fecha DATE NOT NULL,
    estado ENUM('Pendiente', 'Facturada', 'Anulada') DEFAULT 'Pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cotizacion) REFERENCES cotizaciones(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. TABLA: VENTAS (Facturación de Órdenes)
CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_orden_pedido INT NOT NULL,
    tipo_comprobante ENUM('Factura', 'Boleta') NOT NULL,
    numero_comprobante VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    igv DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    estado ENUM('Emitida', 'Anulada') DEFAULT 'Emitida',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_orden_pedido) REFERENCES ordenes_pedido(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. TABLA: GUIAS_REMISION
CREATE TABLE IF NOT EXISTS guias_remision (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_venta INT NOT NULL,
    numero_guia VARCHAR(50) NOT NULL UNIQUE,
    fecha_emision DATE NOT NULL,
    motivo_traslado VARCHAR(100) DEFAULT 'Venta',
    punto_partida VARCHAR(255) NOT NULL,
    punto_llegada VARCHAR(255) NOT NULL,
    estado ENUM('Emitida', 'Anulada') DEFAULT 'Emitida',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_venta) REFERENCES ventas(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- (Opcional) Script para limpiar tablas antiguas de suminex si es la misma base de datos
-- DROP TABLE IF EXISTS marcaciones, colaborador_horarios, horario_dias, horarios;
-- DROP TABLE IF EXISTS colaboradores, permisos, feriados, areas, aptitud, afps, actas_reunion;
