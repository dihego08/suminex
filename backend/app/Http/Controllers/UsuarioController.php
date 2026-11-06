<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Usuarios del sistema (tabla user). El cargo se guarda en user.kind.
 * Nunca se devuelven password ni api_token. No se eliminan: se desactivan con status = 0.
 */
class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = DB::table('user as u')
            ->leftJoin('cargos as c', 'c.id', '=', 'u.kind')
            ->select('u.id', 'u.name', 'u.lastname', 'u.username', 'u.email', 'u.celular', 'u.status', 'u.kind', 'u.created_at', 'c.cargo')
            ->orderBy('u.name')
            ->get();

        return response()->json($usuarios);
    }

    public function cargos()
    {
        return response()->json(DB::table('cargos')->select('id', 'cargo')->orderBy('cargo')->get());
    }

    public function store(Request $request)
    {
        $this->validarUsuario($request);

        $id = DB::table('user')->insertGetId(array_merge($this->datos($request), [
            'password' => password_hash($request->password, PASSWORD_BCRYPT),
            'status' => 1,
            'created_at' => now(),
        ]));

        return response()->json(['id' => $id, 'message' => 'Usuario creado'], 201);
    }

    public function update(Request $request, $id)
    {
        $this->buscar($id);
        $this->validarUsuario($request, (int) $id);

        $datos = $this->datos($request);
        if ($request->filled('password')) {
            $datos['password'] = password_hash($request->password, PASSWORD_BCRYPT);
            // Cierra la sesión abierta del usuario, salvo que esté cambiando su propia contraseña
            if ((int) $id !== $request->attributes->get('usuario_id')) {
                $datos['api_token'] = null;
            }
        }

        DB::table('user')->where('id', $id)->update($datos);

        return response()->json(['message' => 'Usuario actualizado']);
    }

    /**
     * Activa o desactiva un usuario. Al desactivarlo se cierra su sesión.
     */
    public function cambiarEstado(Request $request, $id)
    {
        $this->buscar($id);
        $this->validate($request, ['status' => 'required|in:0,1']);
        $activar = (int) $request->status === 1;

        if (!$activar && (int) $id === $request->attributes->get('usuario_id')) {
            return response()->json(['error' => 'No puede desactivar su propio usuario.'], 422);
        }

        $datos = ['status' => $activar ? 1 : 0];
        if (!$activar) {
            $datos['api_token'] = null;
        }
        DB::table('user')->where('id', $id)->update($datos);

        return response()->json(['message' => $activar ? 'Usuario activado' : 'Usuario desactivado']);
    }

    private function buscar($id)
    {
        $usuario = DB::table('user')->where('id', $id)->first();
        abort_if(!$usuario, 404, 'Usuario no encontrado');
        return $usuario;
    }

    private function validarUsuario(Request $request, ?int $id = null): void
    {
        $this->validate($request, [
            'name' => 'required|string|max:50',
            'lastname' => 'nullable|string|max:50',
            'username' => ['required', 'string', 'max:50', Rule::unique('user', 'username')->ignore($id)],
            'email' => 'nullable|string|max:255',
            'celular' => 'nullable|string|max:15',
            'kind' => 'required|integer|exists:cargos,id',
            'password' => [$id ? 'nullable' : 'required', 'string', 'min:8', 'max:72', 'confirmed'],
        ], [
            'username.unique' => 'Ese nombre de usuario ya está en uso.',
            'kind.required' => 'Seleccione el cargo.',
            'kind.exists' => 'El cargo seleccionado no existe.',
            'password.required' => 'Ingrese la contraseña.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
            'password.confirmed' => 'Las contraseñas no coinciden.',
        ]);
    }

    private function datos(Request $request): array
    {
        return [
            'name' => $request->name,
            'lastname' => $request->lastname ?? '',
            'username' => $request->username,
            'email' => $request->email ?? '',
            'celular' => $request->celular,
            'kind' => $request->kind,
        ];
    }
}
