-- Categorías de productos y código automático de producto.
-- Formato del código: código de marca + 3 primeras letras de la categoría + correlativo (ej. 01ACC01).

-- 1) Código correlativo de marcas: se numeran las marcas existentes por orden de creación (id).
ALTER TABLE brand ADD COLUMN codigo VARCHAR(10) NULL AFTER id;

SET @n := 0;
UPDATE brand SET codigo = LPAD(@n := @n + 1, 2, '0') ORDER BY id;

ALTER TABLE brand ADD UNIQUE KEY uq_brand_codigo (codigo);

-- 2) Categoría del producto (los productos existentes quedan sin categoría y conservan su código).
ALTER TABLE productos
    ADD COLUMN id_categoria INT NULL AFTER marca,
    ADD KEY idx_productos_categoria (id_categoria);

-- 3) N y Ñ deben ser letras distintas en el código de producto y en el nombre de la categoría.
--    "as_ci" distingue tildes y Ñ, pero no mayúsculas: las búsquedas siguen encontrando "gen" y "GEN".
ALTER TABLE productos MODIFY codigo VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_uca1400_as_ci NOT NULL;
ALTER TABLE categorias MODIFY categoria VARCHAR(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_uca1400_as_ci NULL;

-- 4) Menú "Categorías" dentro de Catálogos, después de Marcas.
INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at)
VALUES (126, 'Categorías', '/categorias', 'fa fa-folder-open', 5, 'categories', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), label = VALUES(label), route = VALUES(route),
    icon = VALUES(icon), sort_order = VALUES(sort_order), is_active = 1, updated_at = NOW();

-- Acceso a los usuarios que ya tienen el menú "Productos" (id 128).
SET @menu_categorias = (SELECT id FROM app_menus WHERE module_key = 'categories');

INSERT INTO user_menus (user_id, menu_id)
SELECT um.user_id, @menu_categorias FROM user_menus um
WHERE um.menu_id = 128
  AND NOT EXISTS (SELECT 1 FROM user_menus x WHERE x.user_id = um.user_id AND x.menu_id = @menu_categorias);
