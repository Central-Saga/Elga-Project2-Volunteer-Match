<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StudentProfile extends Model
{
    protected $fillable = [
        'user_id',
        'campus_id',
        'student_id',
        'faculty',
        'study_program',
        'semester',
        'bio',
        'skills',
        'interests',
        'availability',
        'location',
    ];

    protected $casts = [
        'skills' => 'array',
        'interests' => 'array',
        'availability' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campus(): BelongsTo
    {
        return $this->belongsTo(Campus::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}