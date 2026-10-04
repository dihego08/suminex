<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class MarcaController extends Controller
{
    public function index()
    {
        $marcas = DB::table('brand')->select('id', 'name')->orderBy('name')->get();
        return response()->json($marcas);
    }
}
