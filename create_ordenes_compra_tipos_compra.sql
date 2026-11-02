-- =====================================================================
-- 1) Tipos de compra: CATALOGO (productos del catálogo),
--    SUMINISTROS (útiles de oficina, etc.) y AGASAJOS (para los trabajadores).
--    Suministros y agasajos se ingresan con descripción manual (sin producto).
-- =====================================================================
ALTER TABLE compras
    ADD COLUMN tipo_compra ENUM('CATALOGO', 'SUMINISTROS', 'AGASAJOS') NOT NULL DEFAULT 'CATALOGO' AFTER codigo;

ALTER TABLE compras_detalle
    ADD COLUMN descripcion VARCHAR(255) NULL AFTER id_insumo,
    MODIFY cantidad DECIMAL(12,2) NULL;

-- =====================================================================
-- 2) Órdenes de compra (OC-0001)
-- =====================================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    tipo_compra ENUM('CATALOGO', 'SUMINISTROS', 'AGASAJOS') NOT NULL DEFAULT 'CATALOGO',
    fecha_emision DATE NOT NULL,
    solicitante VARCHAR(150) NOT NULL,
    area VARCHAR(150) NULL,
    fecha_requerida DATE NULL,
    lugar_entrega VARCHAR(255) NULL,
    observaciones TEXT NULL,
    total DECIMAL(12,2) NOT NULL DEFAULT 0,
    estado ENUM('PENDIENTE', 'ATENDIDA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
    id_usuario INT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ordenes_compra_numero (numero),
    KEY idx_ordenes_compra_tipo_fecha (tipo_compra, fecha_emision)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ordenes_compra_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_orden INT NOT NULL,
    id_producto INT NULL,                       -- solo para tipo CATALOGO
    descripcion VARCHAR(255) NOT NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    unidad VARCHAR(20) NULL,
    proveedor VARCHAR(255) NULL,                -- Proveedor / Lugar de compra
    fecha_compra DATE NULL,
    precio_unitario DECIMAL(12,2) NULL,
    total DECIMAL(12,2) NULL,
    KEY idx_ordenes_compra_detalle_orden (id_orden),
    CONSTRAINT fk_ordenes_compra_detalle_orden FOREIGN KEY (id_orden) REFERENCES ordenes_compra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Menú "Órdenes de Compra" junto a Compras (174), en Transacciones (139)
INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at)
VALUES (139, 'Órdenes de Compra', '/ordenes-compra', 'fa fa-file-text-o', 8, 'ordenes_compra', 1, NOW(), NOW());

-- Dar acceso a los usuarios que ya tienen acceso a Compras (174)
INSERT INTO user_menus (user_id, menu_id)
SELECT um.user_id, (SELECT id FROM app_menus WHERE module_key = 'ordenes_compra')
FROM user_menus um
WHERE um.menu_id = 174;
