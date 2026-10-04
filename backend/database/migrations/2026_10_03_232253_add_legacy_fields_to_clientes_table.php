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
        Schema::table('clientes', function (Blueprint $table) {
            $table->integer('tipo_pago')->default(0)->after('email');
            $table->string('banco')->nullable()->after('tipo_pago');
            $table->string('nro_cuenta')->nullable()->after('banco');
            $table->string('whatsapp')->nullable()->after('telefono');
            $table->boolean('tiene_credito')->default(false)->after('nro_cuenta');
            $table->decimal('limite_credito', 10, 2)->nullable()->after('tiene_credito');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clientes', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_pago',
                'banco',
                'nro_cuenta',
                'whatsapp',
                'tiene_credito',
                'limite_credito'
            ]);
        });
    }
};
