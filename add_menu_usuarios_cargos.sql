-- Menús "Usuarios" y "Cargos" dentro de Administración, antes de Accesos.
-- Se puede ejecutar más de una vez: si ya existen (mismo module_key), solo actualiza ruta, ícono y orden.

SET @admin = (SELECT id FROM app_menus WHERE module_key = 'grp_admin');

INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at) VALUES
    (@admin, 'Usuarios', '/usuarios', 'fa fa-users',     1, 'users',  1, NOW(), NOW()),
    (@admin, 'Cargos',   '/cargos',   'fa fa-briefcase', 2, 'cargos', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), label = VALUES(label), route = VALUES(route),
    icon = VALUES(icon), sort_order = VALUES(sort_order), is_active = 1, updated_at = NOW();

-- Acceso a los usuarios que ya tienen el menú "Accesos" (administradores).
-- A los demás se les asigna desde la pantalla de Accesos.
INSERT IGNORE INTO user_menus (user_id, menu_id)
SELECT um.user_id, m.id
FROM user_menus um
JOIN app_menus acc ON acc.id = um.menu_id AND acc.module_key = 'permissions'
JOIN app_menus m ON m.module_key IN ('users', 'cargos');

-- Verificación
SELECT id, parent_id, label, route, icon, sort_order FROM app_menus
WHERE module_key IN ('grp_admin', 'users', 'cargos', 'permissions')
ORDER BY parent_id, sort_order;
