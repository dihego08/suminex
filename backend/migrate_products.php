<?php

require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

try {
    $oldProducts = DB::table('product')
        ->leftJoin('brand', 'product.brand_id', '=', 'brand.id')
        ->select('product.*', 'brand.name as brand_name')
        ->get();

    $count = 0;
    foreach($oldProducts as $op) {
        // Verificar si el código ya existe para no duplicarlo
        $codigo = $op->code;
        if (empty($codigo)) {
            $codigo = 'GEN-' . $op->id;
        }

        $exists = DB::table('productos')->where('codigo', $codigo)->exists();
        
        if (!$exists) {
            DB::table('productos')->insert([
                'tipo' => $op->kind,
                'codigo' => $codigo,
                'nombre' => $op->name,
                'codigo_barras' => $op->barcode,
                'descripcion' => $op->description,
                'marca' => $op->brand_name,
                'presentacion' => $op->presentation,
                'largo' => $op->large,
                'ancho' => $op->width,
                'alto' => $op->height,
                'peso' => $op->weight,
                'stock_minimo' => $op->inventary_min ?: 10,
                'precio_compra' => $op->price_in,
                'precio_base' => $op->price_in_2,
                'unidad_medida' => $op->unit ?: 'UND',
                'stock' => 0, 
                'estado' => 1,
                'fecha_actualizacion' => $op->expire_at,
                'created_at' => $op->created_at ?: date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            $count++;
        }
    }
    echo "Migración completada exitosamente. Se migraron $count productos.\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
