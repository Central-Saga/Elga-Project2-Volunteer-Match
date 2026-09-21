<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'name',
    'email',
    'password',
    'role',
])]
#[Hidden([
    'password',
    'remember_token',
])]
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    public function ngoProfile(): HasOne
    {
        return $this->hasOne(NgoProfile::class);
    }

    public function campusProfile(): HasOne
    {
        return $this->hasOne(CampusProfile::class);
    }

    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isNgo(): bool
    {
        return $this->role === 'ngo';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isCampus(): bool
    {
        return $this->role === 'campus';
    }
}