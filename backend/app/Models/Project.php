<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'ngo_profile_id',
        'title',
        'description',
        'location',
        'start_at',
        'end_at',
        'capacity',
        'required_skills',
        'required_interests',
        'status',
        'risk_level',
        'rejection_reason',
    ];

    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
        'required_skills' => 'array',
        'required_interests' => 'array',
    ];

    public function ngoProfile(): BelongsTo
    {
        return $this->belongsTo(NgoProfile::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }
}