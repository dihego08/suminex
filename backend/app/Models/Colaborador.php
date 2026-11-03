<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Colaborador extends Model
{
    protected $table = 'colaboradores';
    public $timestamps = false;

    protected $fillable = [
        'dni',
        'nombres',
        'apellido_paterno',
        'apellido_materno',
        'foto',
        'fecha_nacimiento',
        'lugar_nacimiento',
        'id_estado_civil',
        'celular',
        'correo',
        'brevette',
        'direccion',
        'telefono_emergencia',
        'id_sistema_pension',
        'id_entidad_pension',
        'codigo',
        'asegurado',
        'proceso',
        'sueldo',
        'genero',
        'estado_laboral',
        'fecha_ingreso',
        'fecha_salida',
        'id_cargo',
        'linea',
        'estado',
        'archivo',
        'contrato',
        'sst',
        'competencias',
        'dni_archivo'
    ];

    public function area()
    {
        return $this->belongsTo(Area::class, 'proceso');
    }

    public function puesto()
    {
        return $this->belongsTo(Puesto::class, 'id_cargo');
    }

    public function estadoCivil()
    {
        return $this->belongsTo(EstadoCivil::class, 'id_estado_civil');
    }
    public function ultimoExamenMedico()
    {
        return $this->hasOne(ExamenMedico::class, 'id_colaborador')
            ->latestOfMany();
    }

    public function ultimoContrato()
    {
        return $this->hasOne(Contrato::class, 'id_colaborador')
            ->latestOfMany();
    }

    public function ultimaRecomendacionSst()
    {
        return $this->hasOne(RecomendacionSst::class, 'id_colaborador')
            ->latestOfMany();
    }

    public function ultimaVerificacionCompetencias()
    {
        return $this->hasOne(VerificacionCompetencia::class, 'id_colaborador')
            ->latestOfMany();
    }
}
