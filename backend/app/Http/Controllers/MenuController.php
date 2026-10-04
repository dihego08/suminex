<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    public function navigation(Request $request)
    {
        $token = $request->bearerToken();
        $user = DB::table('user')->where('api_token', $token)->first();

        if (!$user) {
            return response()->json([]);
        }

        $menus = DB::table('app_menus')
            ->join('user_menus', 'app_menus.id', '=', 'user_menus.menu_id')
            ->where('user_menus.user_id', $user->id)
            ->where('app_menus.is_active', 1)
            ->orderBy('app_menus.sort_order')
            ->get([
                'app_menus.id', 
                'app_menus.label as name', 
                'app_menus.route as path', 
                'app_menus.icon', 
                'app_menus.parent_id'
            ]);

        return response()->json($menus);
    }
    
    public function users()
    {
        $users = DB::table('user')->select('id', 'name', 'username')->where('status', 1)->get();
        return response()->json($users);
    }

    public function userMenus($userId)
    {
        $allMenus = DB::table('app_menus')->orderBy('sort_order')->get([
            'id', 'label as name', 'parent_id', 'icon'
        ]);
        $userMenus = DB::table('user_menus')->where('user_id', $userId)->pluck('menu_id')->toArray();

        $menus = $allMenus->map(function ($menu) use ($userMenus) {
            $menu->checked = in_array($menu->id, $userMenus);
            return $menu;
        });

        return response()->json($menus);
    }

    public function saveUserMenus(Request $request)
    {
        $userId = $request->idUsuario;
        $menuIds = $request->menuIds;

        DB::table('user_menus')->where('user_id', $userId)->delete();

        $inserts = [];
        foreach ($menuIds as $menuId) {
            $inserts[] = ['user_id' => $userId, 'menu_id' => $menuId];
        }

        DB::table('user_menus')->insert($inserts);

        return response()->json(['success' => true]);
    }
}
