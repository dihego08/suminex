-- Notas de Ingreso (NI) y Notas de Salida (NS) de almacén.
-- Son los únicos documentos que mueven el stock y el kardex (además del ajuste manual de Inventario).

CREATE TABLE IF NOT EXISTS notas_almacen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo ENUM('INGRESO', 'SALIDA') NOT NULL,
    serie VARCHAR(4) NOT NULL,                 -- NI / NS
    numero INT NOT NULL,                       -- correlativo por tipo
    fecha DATE NOT NULL,
    id_almacen INT NOT NULL,                   -- tabla stock: almacén de origen (salida) o de destino (ingreso)
    area VARCHAR(255) NULL,                    -- Destino / Área (salida) o Procedencia (ingreso)
    doc_referencia VARCHAR(100) NULL,
    persona VARCHAR(255) NULL,                 -- Entregado a (salida) o Recibido de (ingreso)
    motivo VARCHAR(100) NOT NULL,
    detalle_motivo VARCHAR(255) NULL,
    observaciones TEXT NULL,
    estado TINYINT(1) NOT NULL DEFAULT 1,      -- 1: registrada, 0: anulada
    id_usuario INT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_notas_almacen_serie_numero (serie, numero),
    KEY idx_notas_almacen_tipo_fecha (tipo, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notas_almacen_detalle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_nota INT NOT NULL,
    id_producto INT NOT NULL,
    descripcion VARCHAR(255) NULL,
    cantidad DECIMAL(12,2) NOT NULL,
    unidad VARCHAR(20) NULL,
    observacion VARCHAR(255) NULL,
    KEY idx_notas_almacen_detalle_nota (id_nota),
    CONSTRAINT fk_notas_almacen_detalle_nota FOREIGN KEY (id_nota) REFERENCES notas_almacen(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vincula cada movimiento del kardex con la nota que lo generó
ALTER TABLE operation ADD COLUMN id_nota_almacen INT NULL AFTER sell_id;

-- Menú "Notas de Almacén" dentro de Transacciones (139), junto a Kardex / Inventario
INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at)
VALUES (139, 'Notas de Almacén', '/notas-almacen', 'fa fa-exchange', 11, 'notas_almacen', 1, NOW(), NOW());

-- Dar acceso a los usuarios que ya tienen acceso a Kardex / Inventario (176)
INSERT INTO user_menus (user_id, menu_id)
SELECT um.user_id, (SELECT id FROM app_menus WHERE module_key = 'notas_almacen')
FROM user_menus um
WHERE um.menu_id = 176;
