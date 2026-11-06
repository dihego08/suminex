<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    private const REGLAS_CONTACTO = [
        'contacto_nombre' => 'nullable|string|max:150',
        'rubro' => 'nullable|string|max:100',
    ];

    public function index()
    {
        $clientes = Cliente::activos()->get();
        return response()->json($clientes);
    }

    public function show($id)
    {
        $cliente = Cliente::activos()->findOrFail($id);
        return response()->json($cliente);
    }

    public function store(Request $request)
    {
        // Si el RUC pertenece a un cliente dado de baja, se reactiva con los datos nuevos
        $eliminado = Cliente::where('ruc', $request->ruc)->where('estado', 0)->first();
        if ($eliminado) {
            $this->validate($request, ['razon_social' => 'required'] + self::REGLAS_CONTACTO);
            $eliminado->update(array_merge($request->except('estado'), ['estado' => 1]));
            return response()->json($eliminado, 200);
        }

        $this->validate($request, [
            'razon_social' => 'required',
            'ruc' => 'required|unique:clientes',
        ] + self::REGLAS_CONTACTO);

        $cliente = Cliente::create(array_merge($request->except('estado'), ['estado' => 1]));
        return response()->json($cliente, 201);
    }

    public function update(Request $request, $id)
    {
        $cliente = Cliente::activos()->findOrFail($id);

        $this->validate($request, [
            'razon_social' => 'required',
            'ruc' => 'required|unique:clientes,ruc,' . $cliente->id,
        ] + self::REGLAS_CONTACTO);

        $cliente->update($request->except('estado'));
        return response()->json($cliente);
    }

    public function destroy($id)
    {
        // Baja lógica: el cliente se conserva por sus documentos (cotizaciones, órdenes, ventas, guías)
        $cliente = Cliente::activos()->findOrFail($id);
        $cliente->estado = 0;
        $cliente->save();

        return response()->json(['message' => 'Cliente eliminado con éxito']);
    }
}
