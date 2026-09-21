<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NgoProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'organization_name',
        'description',
        'focus_areas',
        'contact_email',
        'contact_phone',
        'address',
        'verification_tier',
        'verification_status',
        'risk_level',
    ];

    protected function casts(): array
    {
        return [
            'focus_areas' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function verificationRecords(): HasMany
    {
        return $this->hasMany(VerificationRecord::class, 'ngo_id');
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }
}