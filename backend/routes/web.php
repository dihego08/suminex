<?php

/** @var \Laravel\Lumen\Routing\Router $router */

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It is a breeze. Simply tell Lumen the URIs it should respond to
| and give it the Closure to call when that URI is requested.
|
*/

$router->get('/', function () use ($router) {
    return $router->app->version();
});

$router->group(['prefix' => 'api'], function () use ($router) {
    
    // Rutas para Productos
    $router->get('productos', 'ProductoController@index');
    $router->get('productos/{id}', 'ProductoController@show');
    $router->post('productos', 'ProductoController@store');
    $router->put('productos/{id}', 'ProductoController@update');
    $router->delete('productos/{id}', 'ProductoController@destroy');

    // Rutas para Códigos SUNAT y Marcas
    $router->get('codigos-sunat', 'CodigoSunatController@index');
    $router->get('marcas', 'MarcaController@index');

    // Rutas para Clientes
    $router->get('clientes', 'ClienteController@index');
    $router->get('clientes/{id}', 'ClienteController@show');
    $router->post('clientes', 'ClienteController@store');
    $router->put('clientes/{id}', 'ClienteController@update');
    $router->delete('clientes/{id}', 'ClienteController@destroy');

    // Rutas para Cotizaciones
    $router->get('cotizaciones', 'CotizacionController@index');
    $router->get('cotizaciones/{id}', 'CotizacionController@show');
    $router->post('cotizaciones', 'CotizacionController@store');
    $router->put('cotizaciones/{id}', 'CotizacionController@update');
    $router->delete('cotizaciones/{id}', 'CotizacionController@destroy');

    // Rutas para Órdenes de Pedido
    $router->get('ordenes', 'OrdenPedidoController@index');
    $router->get('ordenes/{id}', 'OrdenPedidoController@show');
    $router->post('ordenes', 'OrdenPedidoController@store');
    $router->put('ordenes/{id}', 'OrdenPedidoController@update');
    $router->delete('ordenes/{id}', 'OrdenPedidoController@destroy');

    // Rutas para Ventas y Facturación Electrónica (Greenter)
    $router->get('ventas', 'VentaController@index');
    $router->get('ventas/{id}', 'VentaController@show');
    $router->get('ventas/correlativo/{serie}', 'VentaController@proximoCorrelativo');
    $router->post('ventas', 'VentaController@store');
    $router->put('ventas/{id}', 'VentaController@update');
    $router->delete('ventas/{id}', 'VentaController@destroy');
    $router->post('ventas/{id}/enviar-sunat', 'VentaController@enviarSunat');

    // Precios por Cliente
    $router->get('precios-cliente', 'PrecioClienteController@index');
    $router->post('precios-cliente', 'PrecioClienteController@store');
    $router->put('precios-cliente/{id}', 'PrecioClienteController@update');
    $router->delete('precios-cliente/{id}', 'PrecioClienteController@destroy');

    // Autenticación
    $router->post('auth/login', 'AuthController@login');
    $router->get('auth/me', 'AuthController@me');

    // Menús
    $router->get('menu/navigation', 'MenuController@navigation');
    $router->get('permissions/users', 'MenuController@users');
    $router->get('permissions/menus', 'MenuController@userMenus');
    $router->post('permissions/save', 'MenuController@saveUserMenus');

    $router->get('ventas/{id}/pdf', 'VentaController@descargarPdf');
    $router->get('ventas/{id}/pdf_nc', 'VentaController@descargarPdfNC');
    $router->get('ventas/{id}/xml', 'VentaController@descargarXml');
    $router->get('ventas/{id}/cdr', 'VentaController@descargarCdr');
    $router->post('ventas/{id}/anular', 'VentaController@anularVenta');

});
