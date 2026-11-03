-- Menú SIG: Perfil de Puesto, Áreas, Puestos, Personal y Documentos.
-- Se puede ejecutar más de una vez: si los menús ya existen (mismo module_key), solo actualiza ruta, ícono y orden.

-- 1) Grupo SIG
INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at)
VALUES (0, 'SIG', NULL, 'fa fa-building', 50, 'grp_sig', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE parent_id = 0, label = 'SIG', route = NULL, icon = 'fa fa-building',
    sort_order = 50, is_active = 1, updated_at = NOW();

SET @sig = (SELECT id FROM app_menus WHERE module_key = 'grp_sig');

-- 2) Opciones del grupo
INSERT INTO app_menus (parent_id, label, route, icon, sort_order, module_key, is_active, created_at, updated_at) VALUES
    (@sig, 'Perfil de Puesto', '/sig/perfil-puesto', 'fa fa-id-card',  1, 'sig_perfil_puesto', 1, NOW(), NOW()),
    (@sig, 'Áreas',            '/sig/areas',         'fa fa-map',      2, 'sig_areas',         1, NOW(), NOW()),
    (@sig, 'Puestos',          '/sig/puestos',       'fa fa-suitcase', 3, 'sig_puestos',       1, NOW(), NOW()),
    (@sig, 'Personal',         '/sig/colaboradores', 'fa fa-users',    4, 'sig_colaboradores', 1, NOW(), NOW()),
    (@sig, 'Documentos',       '/sig/documents',     'fa fa-book',     5, 'sig_documents',     1, NOW(), NOW())
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id), label = VALUES(label), route = VALUES(route),
    icon = VALUES(icon), sort_order = VALUES(sort_order), is_active = 1, updated_at = NOW();

-- 3) Acceso: a los usuarios que tienen el menú "Accesos" (administradores, menú 125).
--    A los demás usuarios se les puede asignar después desde la pantalla de Accesos.
INSERT INTO user_menus (user_id, menu_id)
SELECT DISTINCT um.user_id, m.id
FROM user_menus um
JOIN app_menus m ON m.module_key IN ('grp_sig', 'sig_perfil_puesto', 'sig_areas', 'sig_puestos', 'sig_colaboradores', 'sig_documents')
WHERE um.menu_id = 125
  AND NOT EXISTS (SELECT 1 FROM user_menus x WHERE x.user_id = um.user_id AND x.menu_id = m.id);

-- 4) Verificación
SELECT id, parent_id, label, route, icon, sort_order FROM app_menus
WHERE module_key IN ('grp_sig', 'sig_perfil_puesto', 'sig_areas', 'sig_puestos', 'sig_colaboradores', 'sig_documents')
ORDER BY parent_id, sort_order;
