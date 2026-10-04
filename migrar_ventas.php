<?php
$pdo = new PDO('mysql:host=193.203.175.216;dbname=u622044135_suminex', 'u622044135_suminex', '@q2Gw6tka^Y');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$ventas_legacy = $pdo->query("SELECT * FROM ventas_cabecera")->fetchAll(PDO::FETCH_ASSOC);

foreach ($ventas_legacy as $v) {
    $parts = explode('-', $v['codigo_venta']);
    if (count($parts) != 2) continue;
    $serie = $parts[0];
    $correlativo = (int)$parts[1];

    $fecha_e = !empty($v['fecha_emision']) ? date('Y-m-d', strtotime($v['fecha_emision'])) : date('Y-m-d', strtotime($v['fecha_creacion']));
    $fecha_v = !empty($v['fecha_vencimiento']) ? date('Y-m-d', strtotime($v['fecha_vencimiento'])) : null;

    $stmt = $pdo->prepare("INSERT INTO ventas (id_cliente, tipo_documento, serie, correlativo, fecha_emision, fecha_vencimiento, subtotal, igv, total, envio_sunat, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    // In legacy, 2 is Factura (01) and 1 is Boleta (03). Let's guess 2 -> 01, 1 -> 03
    $tipo = ($v['tipo_documento'] == 2 || substr($serie, 0, 1) == 'F') ? '01' : '03';

    // id_cliente fallback to 1 if not exists or null
    $id_person = $v['id_person'];
    $check_cliente = $pdo->query("SELECT id FROM clientes WHERE id = " . (int)$id_person)->fetchColumn();
    if (!$check_cliente) {
        $id_person = 1; // Default
    }

    $stmt->execute([
        $id_person,
        $tipo,
        $serie,
        $correlativo,
        $fecha_e,
        $fecha_v,
        $v['subtotal'] ?: 0,
        $v['igv'] ?: 0,
        $v['total'] ?: 0,
        $v['envio_sunat'] ?: 0,
        $v['fecha_creacion'] ?: date('Y-m-d H:i:s')
    ]);

    $new_id = $pdo->lastInsertId();

    // Migrar detalles
    $detalles = $pdo->prepare("SELECT * FROM ventas_detalle WHERE codigo_venta_cabecera = ?");
    $detalles->execute([$v['codigo_venta']]);
    $detalles = $detalles->fetchAll(PDO::FETCH_ASSOC);

    foreach ($detalles as $d) {
        $cantidad = $d['cantidad'] ?: 1;
        $pu = $d['precio_unitario'] ?: 0;
        $pb = $d['precio_bordado'] ?: 0;
        $total_linea = ($cantidad * $pu) + $pb;
        $pu_calculado = $total_linea / $cantidad;

        // check id_producto
        $check_prod = $pdo->query("SELECT id FROM productos WHERE id = " . (int)$d['id_producto'])->fetchColumn();
        if (!$check_prod) continue; // Skip invalid products

        $stmt_det = $pdo->prepare("INSERT INTO ventas_detalles (id_venta, id_producto, cantidad, precio_unitario, total) VALUES (?, ?, ?, ?, ?)");
        $stmt_det->execute([
            $new_id,
            $d['id_producto'],
            $cantidad,
            $pu_calculado,
            $total_linea
        ]);
    }
}

echo "Migracion completada!\n";
