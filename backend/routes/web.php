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

    // Rutas para Órdenes de Pedido
    $router->get('ordenes', 'OrdenPedidoController@index');
    $router->post('ordenes', 'OrdenPedidoController@store');

});
