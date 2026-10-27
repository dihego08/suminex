-- Agrega (o reactiva) el menú "Marcas" dentro de Catálogos (id 126)
INSERT INTO app_menus (id, parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at)
VALUES (130, 126, 'Marcas', '/marcas', 'fa fa-tags', 4, 'brands', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    parent_id = 126,
    label = 'Marcas',
    route = '/marcas',
    icon = 'fa fa-tags',
    is_active = 1,
    updated_at = NOW();

-- Dar acceso a todos los usuarios que ya tienen acceso a Productos (id 128)
INSERT INTO user_menus (user_id, menu_id)
SELECT um.user_id, 130 FROM user_menus um
WHERE um.menu_id = 128
  AND NOT EXISTS (SELECT 1 FROM user_menus x WHERE x.user_id = um.user_id AND x.menu_id = 130);
