<?php
$file = 'routes/api.php';
$content = file_get_contents($file);

// Find all controllers used
preg_match_all("/'([A-Za-z0-9_]+Controller)@([A-Za-z0-9_]+)'/", $content, $matches);
$controllers = array_unique($matches[1]);

$useStatements = "";
foreach ($controllers as $ctrl) {
    $useStatements .= "use App\\Http\\Controllers\\{$ctrl};\n";
}

// Add the use statements right after use Illuminate\Support\Facades\Route;
$content = str_replace("use Illuminate\\Support\\Facades\\Route;\n", "use Illuminate\\Support\\Facades\\Route;\n" . $useStatements . "\n", $content);

// Replace string routes with tuple arrays
$content = preg_replace_callback("/'([A-Za-z0-9_]+Controller)@([A-Za-z0-9_]+)'/", function($m) {
    return "[{$m[1]}::class, '{$m[2]}']";
}, $content);

file_put_contents($file, $content);
echo "Converted strings to arrays.\n";
