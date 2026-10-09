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
