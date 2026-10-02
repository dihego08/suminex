<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

use Illuminate\Support\Facades\DB;

$tables = DB::select('SHOW TABLES');
echo "Tables:\n";
print_r($tables);

try {
    $desc = DB::select('DESCRIBE codigos_sunat');
    echo "\ncodigos_sunat:\n";
    print_r($desc);
} catch (Exception $e) {
    echo "\nError describing codigos_sunat: " . $e->getMessage() . "\n";
}
