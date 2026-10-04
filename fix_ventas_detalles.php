<?php
$pdo = new PDO('mysql:host=193.203.175.216;dbname=u622044135_suminex', 'u622044135_suminex', '@q2Gw6tka^Y');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$detalles_legacy = $pdo->query("SELECT vd.*, p.name as product_name, p.code as product_code, vc.codigo_venta as codigo_venta
    FROM ventas_detalle vd 
    JOIN product p ON vd.id_producto = p.id
    JOIN ventas_cabecera vc ON vd.codigo_venta_cabecera = vc.codigo_venta
")->fetchAll(PDO::FETCH_ASSOC);

$count = 0;
foreach ($detalles_legacy as $d) {
    $parts = explode('-', $d['codigo_venta']);
    if (count($parts) != 2) continue;
    $serie = $parts[0];
    $correlativo = (int)$parts[1];

    $venta = $pdo->prepare("SELECT id FROM ventas WHERE serie = ? AND correlativo = ?");
    $venta->execute([$serie, $correlativo]);
    $id_venta = $venta->fetchColumn();

    if (!$id_venta) continue;

    // Check if details already exist to avoid duplicates
    $check_dup = $pdo->prepare("SELECT COUNT(*) FROM ventas_detalles WHERE id_venta = ?");
    $check_dup->execute([$id_venta]);
    if ($check_dup->fetchColumn() > 0) continue; 

    $prod = $pdo->prepare("SELECT id FROM productos WHERE nombre = ?");
    $prod->execute([$d['product_name']]);
    $id_producto_nuevo = $prod->fetchColumn();

    if (!$id_producto_nuevo) {
        $prod_code = $pdo->prepare("SELECT id FROM productos WHERE codigo = ? AND codigo != '-'");
        $prod_code->execute([$d['product_code']]);
        $id_producto_nuevo = $prod_code->fetchColumn();
    }

    if (!$id_producto_nuevo) {
        $ins_prod = $pdo->prepare("INSERT INTO productos (nombre, codigo, descripcion, precio_base) VALUES (?, ?, ?, ?)");
        try {
            $ins_prod->execute([$d['product_name'], $d['product_code'] ?: '-', 'Migrado', $d['precio_unitario'] ?: 0]);
            $id_producto_nuevo = $pdo->lastInsertId();
        } catch(Exception $e) {
            // Probably duplicate code
            $ins_prod = $pdo->prepare("INSERT INTO productos (nombre, codigo, descripcion, precio_base) VALUES (?, ?, ?, ?)");
            $ins_prod->execute([$d['product_name'], '-' . uniqid(), 'Migrado', $d['precio_unitario'] ?: 0]);
            $id_producto_nuevo = $pdo->lastInsertId();
        }
    }

    $cantidad = $d['cantidad'] ?: 1;
    $pu = $d['precio_unitario'] ?: 0;
    $pb = $d['precio_bordado'] ?: 0;
    $total_linea = ($cantidad * $pu) + $pb;
    $pu_calculado = $total_linea / $cantidad;

    $stmt_det = $pdo->prepare("INSERT INTO ventas_detalles (id_venta, id_producto, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)");
    $stmt_det->execute([
        $id_venta,
        $id_producto_nuevo,
        $cantidad,
        $pu_calculado,
        $total_linea
    ]);
    $count++;
}
echo "Fixed $count detalles!\n";
