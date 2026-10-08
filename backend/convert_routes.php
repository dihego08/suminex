<?php
$content = file_get_contents('../backend/routes/web.php');
$content = str_replace('$router->', 'Route::', $content);
$content = preg_replace('/function\s*\(\)\s*use\s*\(\$router\)/', 'function ()', $content);
$content = str_replace('Route::app->version()', 'app()->version()', $content);
$content = "<?php\n\nuse Illuminate\Support\Facades\Route;\n\n" . substr($content, 6);
file_put_contents('routes/api.php', $content);
echo "Routes converted.\n";
