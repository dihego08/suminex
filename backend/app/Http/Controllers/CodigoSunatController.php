<?php

namespace App\Http\Controllers;

use App\Models\CodigoSunat;

class CodigoSunatController extends Controller
{
    public function index()
    {
        // Se asume que la tabla tiene columnas id/codigo/descripcion o similar.
        // all() retornará todos los registros.
        return response()->json(CodigoSunat::all());
    }
}
