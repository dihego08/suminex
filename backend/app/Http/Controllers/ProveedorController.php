<?php

namespace App\Http\Controllers;

use App\Models\Proveedor;
use Illuminate\Http\Request;

class ProveedorController extends Controller
{
    public function index(Request $request)
    {
        $query = Proveedor::query();

        if ($request->has('search') && !empty($request->search)) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('razon_social', 'like', "%{$s}%")
                  ->orWhere('ruc', 'like', "%{$s}%");
            });
        }

        if ($request->has('all') && $request->all == 'true') {
            return response()->json($query->orderBy('razon_social')->get());
        }

        $perPage = $request->get('per_page', 15);
        $proveedores = $query->orderBy('razon_social')->paginate($perPage);

        return response()->json($proveedores);
    }

    public function show($id)
    {
        $proveedor = Proveedor::findOrFail($id);
        return response()->json($proveedor);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'razon_social' => 'required|string|max:255',
            'ruc' => 'required|string|max:20',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
        ]);

        $proveedor = Proveedor::create([
            'razon_social' => $request->razon_social,
            'ruc' => $request->ruc,
            'direccion' => $request->direccion,
            'telefono' => $request->telefono,
            'email' => $request->email,
            'estado' => $request->estado ?? 1,
        ]);

        return response()->json($proveedor, 201);
    }

    public function update(Request $request, $id)
    {
        $proveedor = Proveedor::findOrFail($id);

        $this->validate($request, [
            'razon_social' => 'required|string|max:255',
            'ruc' => 'required|string|max:20',
            'direccion' => 'nullable|string',
            'telefono' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
        ]);

        $proveedor->update($request->only([
            'razon_social', 'ruc', 'direccion', 'telefono', 'email', 'estado'
        ]));

        return response()->json($proveedor);
    }

    public function destroy($id)
    {
        $proveedor = Proveedor::findOrFail($id);
        $proveedor->delete();

        return response()->json(['message' => 'Proveedor eliminado correctamente']);
    }
}
