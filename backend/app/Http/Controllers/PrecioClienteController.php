<?php

namespace App\Http\Controllers;

use App\Models\PrecioCliente;
use Illuminate\Http\Request;

class PrecioClienteController extends Controller
{
    public function index()
    {
        $precios = PrecioCliente::with(['producto', 'cliente'])->get();
        return response()->json($precios);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'id_producto' => 'required|integer',
            'id_cliente' => 'required|integer',
            'unidad_medida' => 'nullable|string|max:20',
            'precio_personalizado' => 'required|numeric'
        ]);

        // Evitar duplicados para la misma unidad
        $precio = PrecioCliente::where('id_producto', $request->id_producto)
            ->where('id_cliente', $request->id_cliente)
            ->where('unidad_medida', $request->unidad_medida)
            ->first();

        if ($precio) {
            $precio->update(['precio_personalizado' => $request->precio_personalizado]);
        } else {
            $precio = PrecioCliente::create($request->all());
        }

        return response()->json($precio->load(['producto', 'cliente']), 201);
    }

    public function update(Request $request, $id)
    {
        $precio = PrecioCliente::findOrFail($id);
        
        $this->validate($request, [
            'precio_personalizado' => 'required|numeric'
        ]);

        $precio->update(['precio_personalizado' => $request->precio_personalizado]);
        return response()->json($precio->load(['producto', 'cliente']));
    }

    public function destroy($id)
    {
        PrecioCliente::destroy($id);
        return response()->json(['message' => 'Precio personalizado eliminado']);
    }
}
