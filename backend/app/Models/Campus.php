<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Campus extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'email_domain',
        'address',
        'status',
    ];

    public function students(): HasMany
    {
        return $this->hasMany(StudentProfile::class);
    }

    public function admins(): HasMany
    {
        return $this->hasMany(CampusProfile::class);
    }
}