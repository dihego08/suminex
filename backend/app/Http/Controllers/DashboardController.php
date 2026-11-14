<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Total de ventas (S/.) por mes de un año. Excluye ventas anuladas.
     */
    public function ventasPorMes(Request $request)
    {
        $anio = (int) $request->input('anio', date('Y'));

        $filas = DB::table('ventas')
            ->selectRaw('MONTH(fecha_emision) as mes, SUM(total) as total')
            ->whereYear('fecha_emision', $anio)
            ->where(function ($q) {
                $q->whereNull('estado')->orWhere('estado', '!=', 'Anulada');
            })
            ->groupBy(DB::raw('MONTH(fecha_emision)'))
            ->pluck('total', 'mes');

        $meses = [];
        for ($m = 1; $m <= 12; $m++) {
            $meses[] = round((float) ($filas[$m] ?? 0), 2);
        }

        $anios = DB::table('ventas')
            ->selectRaw('DISTINCT YEAR(fecha_emision) as anio')
            ->orderByDesc('anio')
            ->pluck('anio');

        return response()->json([
            'anio'  => $anio,
            'meses' => $meses,
            'anios' => $anios,
        ]);
    }
}
