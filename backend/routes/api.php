<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\CodigoSunatController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CotizacionController;
use App\Http\Controllers\OrdenPedidoController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\PrecioClienteController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\GuiaController;
use App\Http\Controllers\GuiaPdfController;



/** @var \Laravel\Lumen\Routing\Router $router */

Route::get('test', function () {
    return class_exists(\App\Http\Controllers\AuthController::class) ? 'exists' : 'not';
});




Route::get('/', function () {
    return app()->version();
});


    
    // Rutas para Productos
    Route::get('productos', [ProductoController::class, 'index']);
    Route::get('productos/{id}', [ProductoController::class, 'show']);
    Route::post('productos', [ProductoController::class, 'store']);
    Route::put('productos/{id}', [ProductoController::class, 'update']);
    Route::delete('productos/{id}', [ProductoController::class, 'destroy']);

    // Rutas para Códigos SUNAT y Marcas
    Route::get('codigos-sunat', [CodigoSunatController::class, 'index']);
    Route::get('marcas', [MarcaController::class, 'index']);
    Route::get('marcas/{id}', [MarcaController::class, 'show']);
    Route::post('marcas', [MarcaController::class, 'store']);
    Route::put('marcas/{id}', [MarcaController::class, 'update']);
    Route::delete('marcas/{id}', [MarcaController::class, 'destroy']);

    // Rutas para Clientes
    Route::get('clientes', [ClienteController::class, 'index']);
    Route::get('clientes/{id}', [ClienteController::class, 'show']);
    Route::post('clientes', [ClienteController::class, 'store']);
    Route::put('clientes/{id}', [ClienteController::class, 'update']);
    Route::delete('clientes/{id}', [ClienteController::class, 'destroy']);

    // Rutas para Cotizaciones
    Route::get('cotizaciones', [CotizacionController::class, 'index']);
    Route::get('cotizaciones/{id}', [CotizacionController::class, 'show']);
    Route::post('cotizaciones', [CotizacionController::class, 'store']);
    Route::put('cotizaciones/{id}', [CotizacionController::class, 'update']);
    Route::delete('cotizaciones/{id}', [CotizacionController::class, 'destroy']);

    // Rutas para Órdenes de Pedido
    Route::get('ordenes', [OrdenPedidoController::class, 'index']);
    Route::get('ordenes/{id}', [OrdenPedidoController::class, 'show']);
    Route::post('ordenes', [OrdenPedidoController::class, 'store']);
    Route::put('ordenes/{id}', [OrdenPedidoController::class, 'update']);
    Route::delete('ordenes/{id}', [OrdenPedidoController::class, 'destroy']);

    // Rutas para Ventas y Facturación Electrónica (Greenter)
    Route::get('ventas', [VentaController::class, 'index']);
    Route::get('ventas/{id}', [VentaController::class, 'show']);
    Route::get('ventas/correlativo/{serie}', [VentaController::class, 'proximoCorrelativo']);
    Route::post('ventas', [VentaController::class, 'store']);
    Route::put('ventas/{id}', [VentaController::class, 'update']);
    Route::delete('ventas/{id}', [VentaController::class, 'destroy']);
    Route::post('ventas/{id}/enviar-sunat', [VentaController::class, 'enviarSunat']);

    // Precios por Cliente
    Route::get('precios-cliente', [PrecioClienteController::class, 'index']);
    Route::post('precios-cliente', [PrecioClienteController::class, 'store']);
    Route::put('precios-cliente/{id}', [PrecioClienteController::class, 'update']);
    Route::delete('precios-cliente/{id}', [PrecioClienteController::class, 'destroy']);

    // Autenticación
    Route::post('auth/login', [AuthController::class, 'login']);
    Route::get('auth/me', [AuthController::class, 'me']);

    // Menús
    Route::get('menu/navigation', [MenuController::class, 'navigation']);
    Route::get('permissions/users', [MenuController::class, 'users']);
    Route::get('permissions/menus/{userId}', [MenuController::class, 'userMenus']);
    Route::post('permissions/save', [MenuController::class, 'saveUserMenus']);

    // Rutas para Compras
    Route::get('compras', [CompraController::class, 'index']);
    Route::get('compras/{id}', [CompraController::class, 'show']);
    Route::post('compras', [CompraController::class, 'store']);
    Route::delete('compras/{id}', [CompraController::class, 'destroy']);

    // Rutas para Proveedores
    Route::get('proveedores', [ProveedorController::class, 'index']);
    Route::get('proveedores/{id}', [ProveedorController::class, 'show']);
    Route::post('proveedores', [ProveedorController::class, 'store']);
    Route::put('proveedores/{id}', [ProveedorController::class, 'update']);
    Route::delete('proveedores/{id}', [ProveedorController::class, 'destroy']);

    // Rutas para Inventario y Kardex
    Route::get('inventario', [InventarioController::class, 'index']);
    Route::get('inventario/{id}/kardex', [InventarioController::class, 'kardex']);
    Route::post('inventario/ajuste', [InventarioController::class, 'ajusteStock']);

    Route::get('ventas/{id}/pdf', [VentaController::class, 'descargarPdf']);
    Route::get('ventas/{id}/pdf_nc', [VentaController::class, 'descargarPdfNC']);
    Route::get('ventas/{id}/xml', [VentaController::class, 'descargarXml']);
    Route::get('ventas/{id}/cdr', [VentaController::class, 'descargarCdr']);
    Route::post('ventas/{id}/anular', [VentaController::class, 'anularVenta']);

    // Rutas para Guías de Remisión
    Route::get('guias/next-num', [GuiaController::class, 'nextNumGuia']);
    Route::get('guias/search-products', [GuiaController::class, 'searchProducts']);
    Route::get('guias/departamentos', [GuiaController::class, 'getDepartamentos']);
    Route::get('guias/provincias', [GuiaController::class, 'getProvincias']);
    Route::get('guias/distritos', [GuiaController::class, 'getDistritos']);
    Route::get('guias', [GuiaController::class, 'index']);
    Route::post('guias', [GuiaController::class, 'store']);
    Route::get('guias/{id}/detalle', [GuiaController::class, 'show']);
    Route::put('guias/{id}', [GuiaController::class, 'update']);
    Route::delete('guias/{id}', [GuiaController::class, 'destroy']);
    Route::get('guias/{id}/pdf', [GuiaPdfController::class, 'downloadGuiaPdf']);
    Route::post('guias/{id}/send-sunat', [GuiaController::class, 'sendToSunat']);

    // Órdenes de compra
    Route::get('ordenes-compra/siguiente', [\App\Http\Controllers\OrdenCompraController::class, 'siguiente']);
    Route::get('ordenes-compra', [\App\Http\Controllers\OrdenCompraController::class, 'index']);
    Route::post('ordenes-compra', [\App\Http\Controllers\OrdenCompraController::class, 'store']);
    Route::get('ordenes-compra/{id}', [\App\Http\Controllers\OrdenCompraController::class, 'show']);
    Route::put('ordenes-compra/{id}', [\App\Http\Controllers\OrdenCompraController::class, 'update']);
    Route::post('ordenes-compra/{id}/anular', [\App\Http\Controllers\OrdenCompraController::class, 'anular']);
    Route::get('ordenes-compra/{id}/pdf', [\App\Http\Controllers\OrdenCompraController::class, 'pdf']);

    // Notas de Ingreso / Salida de almacén (mueven el kardex)
    Route::get('notas-almacen/form-data', [\App\Http\Controllers\NotaAlmacenController::class, 'formData']);
    Route::get('notas-almacen', [\App\Http\Controllers\NotaAlmacenController::class, 'index']);
    Route::post('notas-almacen', [\App\Http\Controllers\NotaAlmacenController::class, 'store']);
    Route::get('notas-almacen/{id}', [\App\Http\Controllers\NotaAlmacenController::class, 'show']);
    Route::post('notas-almacen/{id}/anular', [\App\Http\Controllers\NotaAlmacenController::class, 'anular']);
    Route::get('notas-almacen/{id}/pdf', [\App\Http\Controllers\NotaAlmacenController::class, 'pdf']);
    Route::get('guias/{id}/sunat-status', [GuiaController::class, 'checkSunatStatus']);

    // =====================================================================
    // SIG: Perfil de Puesto, Áreas, Puestos, Personal (colaboradores) y Documentos
    // =====================================================================
    Route::get('sig/puestos', [\App\Http\Controllers\PerfilPuestoController::class, 'getPuestos']);
    Route::get('sig/perfil/{id}', [\App\Http\Controllers\PerfilPuestoController::class, 'show']);
    Route::post('sig/perfil', [\App\Http\Controllers\PerfilPuestoController::class, 'store']);

    // Áreas, Puestos y Colaboradores no tienen update: el store crea o actualiza según el id enviado
    Route::apiResource('sig/areas', \App\Http\Controllers\AreaController::class)->except(['update']);
    Route::apiResource('sig/puestos-crud', \App\Http\Controllers\PuestoController::class)->except(['update']);
    Route::apiResource('tipos_contratos', \App\Http\Controllers\TipoContratoController::class);

    Route::get('sig/colaboradores/metadata', [\App\Http\Controllers\ColaboradorController::class, 'getMetadata']);
    Route::apiResource('sig/colaboradores', \App\Http\Controllers\ColaboradorController::class)->except(['update']);

    // Sub-recursos del colaborador. Los que suben archivos actualizan por POST (multipart).
    $subrecursos = [
        'familiares' => [\App\Http\Controllers\ColaboradorFamiliarController::class, 'put'],
        'formacion' => [\App\Http\Controllers\ColaboradorFormacionController::class, 'post'],
        'experiencia' => [\App\Http\Controllers\ColaboradorExperienciaLaboralController::class, 'post'],
        'habilidades' => [\App\Http\Controllers\ColaboradorHabilidadController::class, 'put'],
        'capacitaciones' => [\App\Http\Controllers\ColaboradorCapacitacionController::class, 'post'],
        'vacaciones' => [\App\Http\Controllers\ColaboradorVacacionController::class, 'post'],
        'contratos' => [\App\Http\Controllers\ColaboradorContratoController::class, 'post'],
        'examenes_medicos' => [\App\Http\Controllers\ColaboradorExamenMedicoController::class, 'post'],
        'recomendaciones_sst' => [\App\Http\Controllers\ColaboradorRecomendacionSstController::class, 'post'],
        'verificacion_competencias' => [\App\Http\Controllers\ColaboradorVerificacionCompetenciaController::class, 'post'],
    ];
    foreach ($subrecursos as $ruta => [$controller, $metodoUpdate]) {
        Route::get("sig/colaboradores/{colaborador}/{$ruta}", [$controller, 'index']);
        Route::post("sig/colaboradores/{colaborador}/{$ruta}", [$controller, 'store']);
        Route::$metodoUpdate("sig/colaboradores/{colaborador}/{$ruta}/{id}", [$controller, 'update']);
        Route::delete("sig/colaboradores/{colaborador}/{$ruta}/{id}", [$controller, 'destroy']);
    }

    // Biblioteca de documentos
    Route::get('library', [\App\Http\Controllers\DocumentController::class, 'index']);
    Route::get('library/search', [\App\Http\Controllers\DocumentController::class, 'search']);
    Route::post('library/folders', [\App\Http\Controllers\DocumentController::class, 'createFolder']);
    Route::post('library/files', [\App\Http\Controllers\DocumentController::class, 'uploadFile']);
    Route::delete('library/folders/{id}', [\App\Http\Controllers\DocumentController::class, 'deleteFolder']);
    Route::delete('library/files/{id}', [\App\Http\Controllers\DocumentController::class, 'deleteFile']);

    // Indica si un archivo ya está en la API o solo en el sistema anterior.
    // Mismas carpetas que usan los controladores (convención del sistema: public/images y public/uploads).
    Route::get('documento-existe/{carpeta}/{archivo}', function ($carpeta, $archivo) {
        $carpeta = basename($carpeta);
        $archivo = basename($archivo);
        $carpetas = [
            'img-colaboradores' => 'images/colaboradores',
            'doc-colaboradores' => 'uploads/colaboradores/dni',
            'biblioteca' => 'uploads/biblioteca',
        ];
        $ruta = public_path(($carpetas[$carpeta] ?? "uploads/colaboradores/{$carpeta}") . "/{$archivo}");
        return response()->json(['exists' => file_exists($ruta)]);
    });
