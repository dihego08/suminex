<?php

namespace App\Http\Controllers;

use App\Models\Producto;
use Illuminate\Http\Request;

class ProductoController extends Controller
{
    public function index()
    {
        $productos = Producto::with('preciosClientes.cliente')->get();
        return response()->json($productos);
    }

    public function show($id)
    {
        $producto = Producto::with('preciosClientes.cliente')->findOrFail($id);
        return response()->json($producto);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'codigo' => 'required|unique:productos',
            'descripcion' => 'required',
            'precio_base' => 'required|numeric',
            'stock' => 'integer',
        ]);

        $producto = Producto::create($request->all());
        return response()->json($producto, 201);
    }

    public function update(Request $request, $id)
    {
        $producto = Producto::findOrFail($id);
        $producto->update($request->all());
        return response()->json($producto);
    }

    public function destroy($id)
    {
        Producto::destroy($id);
        return response()->json(['message' => 'Producto eliminado con éxito']);
    }
}
