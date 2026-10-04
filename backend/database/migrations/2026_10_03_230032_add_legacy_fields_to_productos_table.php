<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->integer('tipo')->default(1)->after('id');
            $table->string('nombre')->nullable()->after('codigo');
            $table->string('codigo_barras')->nullable()->after('codigo');
            $table->string('presentacion')->nullable();
            $table->string('largo')->nullable();
            $table->string('ancho')->nullable();
            $table->string('alto')->nullable();
            $table->string('peso')->nullable();
            $table->integer('stock_minimo')->default(10);
            $table->decimal('precio_compra', 10, 2)->nullable();
            $table->date('fecha_actualizacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('productos', function (Blueprint $table) {
            $table->dropColumn([
                'tipo',
                'nombre',
                'codigo_barras',
                'presentacion',
                'largo',
                'ancho',
                'alto',
                'peso',
                'stock_minimo',
                'precio_compra',
                'fecha_actualizacion'
            ]);
        });
    }
};
