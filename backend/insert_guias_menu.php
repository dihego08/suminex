<?php
require __DIR__.'/bootstrap/app.php';

$app->make('db');

$menuId = DB::table('app_menus')->insertGetId([
    'label' => 'Guías de Remisión',
    'route' => '/guias',
    'icon' => 'fa-truck',
    'parent_id' => 0,
    'sort_order' => 50,
    'is_active' => 1
]);

$users = DB::table('user')->get();
foreach($users as $u) {
    DB::table('user_menus')->insert([
        'user_id' => $u->id,
        'menu_id' => $menuId
    ]);
}

echo "Guías de Remisión menu inserted successfully.";
