<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Exige un token válido de un usuario activo que tenga asignado el menú indicado (user_menus).
 * Uso en rutas: ->middleware(AccesoMenu::class . ':users')
 */
class AccesoMenu
{
    public function handle(Request $request, Closure $next, string $moduleKey)
    {
        $token = $request->bearerToken();
        $usuario = $token
            ? DB::table('user')->where('api_token', $token)->where('status', 1)->first()
            : null;

        if (!$usuario) {
            return response()->json(['error' => 'Sesión no válida. Vuelva a iniciar sesión.'], 401);
        }

        $tieneAcceso = DB::table('user_menus')
            ->join('app_menus', 'app_menus.id', '=', 'user_menus.menu_id')
            ->where('user_menus.user_id', $usuario->id)
            ->where('app_menus.module_key', $moduleKey)
            ->exists();

        if (!$tieneAcceso) {
            return response()->json(['error' => 'No tiene permiso para realizar esta acción.'], 403);
        }

        $request->attributes->set('usuario_id', (int) $usuario->id);

        return $next($request);
    }
}
