<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $this->validate($request, [
            'username' => 'required',
            'password' => 'required'
        ]);

        $user = DB::table('user')->where('username', $request->username)->first();

        if (!$user) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        // Verify SHA1 password (legacy systems often use sha1)
        if (sha1(md5($request->password)) !== $user->password && sha1($request->password) !== $user->password && md5($request->password) !== $user->password && $request->password !== $user->password) {
            return response()->json(['error' => 'Credenciales inválidas'], 401);
        }

        $token = Str::random(60);
        
        DB::table('user')->where('id', $user->id)->update(['api_token' => $token]);

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
            ]
        ]);
    }

    public function me(Request $request)
    {
        $token = $request->bearerToken();
        if (!$token) return response()->json(['error' => 'No token'], 401);

        $user = DB::table('user')->where('api_token', $token)->first();
        if (!$user) return response()->json(['error' => 'Invalid token'], 401);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
        ]);
    }
}
