CREATE TABLE IF NOT EXISTS app_menus (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    path VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    parent_id INT DEFAULT 0,
    order_index INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_menus (
    user_id INT NOT NULL,
    menu_id INT NOT NULL,
    PRIMARY KEY (user_id, menu_id)
);

TRUNCATE TABLE app_menus;
INSERT INTO app_menus (id, name, path, icon, order_index) VALUES
(1, 'Dashboard', '/', 'LayoutDashboard', 1),
(2, 'Productos', '/productos', 'Package', 2),
(3, 'Clientes', '/clientes', 'Users', 3),
(4, 'Cotizaciones', '/cotizaciones', 'FileText', 4),
(5, 'Órdenes de Pedido', '/ordenes', 'ClipboardList', 5),
(6, 'Ventas', '/ventas', 'ShoppingCart', 6),
(7, 'Guías de Remisión', '/guias', 'Truck', 7),
(8, 'Configuración', '/configuracion', 'Settings', 8);

-- Asignar todos a superadmin (user_id 1)
TRUNCATE TABLE user_menus;
INSERT INTO user_menus (user_id, menu_id)
SELECT 1, id FROM app_menus;

