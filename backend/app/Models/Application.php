<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;


class Application extends Model
{
    protected $fillable = [
        'project_id',
        'student_profile_id',
        'motivation',
        'status',
        'applied_at',
        'reviewed_at',
        'rejection_reason',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function studentProfile(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class);
    }

    public function attendance(): HasOne
    {
        return $this->hasOne(Attendance::class);
    }

    public function completion(): HasOne
    {
        return $this->hasOne(Completion::class);
    }

    public function credential(): HasOne
    {
        return $this->hasOne(Credential::class);
    }
}