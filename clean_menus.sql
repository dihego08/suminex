-- Update paths
UPDATE app_menus SET route = '/clientes' WHERE id = 127;
UPDATE app_menus SET route = '/productos' WHERE id = 128;
UPDATE app_menus SET route = '/ventas' WHERE id = 140;
UPDATE app_menus SET route = '/ventas/nueva' WHERE id = 141;
UPDATE app_menus SET route = '/ordenes' WHERE id = 143;
UPDATE app_menus SET route = '/ordenes/nueva' WHERE id = 144;
UPDATE app_menus SET route = '/cotizaciones' WHERE id = 145;
UPDATE app_menus SET route = '/cotizaciones/nueva' WHERE id = 146;

-- Delete unbuilt menus
DELETE FROM app_menus WHERE id NOT IN (
    122, 125, -- Admin & Accesos
    126, 127, 128, -- Catalogos, Clientes, Productos
    139, 140, 141, 143, 144, 145, 146 -- Transacciones & Ventas, Pedidos, Cotiz.
);

-- Delete orphans in user_menus
DELETE FROM user_menus WHERE menu_id NOT IN (SELECT id FROM app_menus);

-- Optionally add Dashboard at the top
INSERT INTO app_menus (id, parent_id, label, route, icon, sort_order, is_active)
VALUES (1, 0, 'Dashboard', '/', 'fa fa-home', 1, 1);

INSERT INTO user_menus (user_id, menu_id) VALUES (1, 1);

