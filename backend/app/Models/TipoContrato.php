<?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;

    class TipoContrato extends Model
    {
        protected $table = 'tipo_contrato';
        public $timestamps = false;

        protected $fillable = [
            'tipo_contrato'
        ];
    }
