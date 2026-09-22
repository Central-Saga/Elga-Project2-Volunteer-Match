<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'ngo_id',
        'reviewer_id',
        'status',
        'notes',
        'evidence_reference',
        'submitted_at',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function ngo(): BelongsTo
    {
        return $this->belongsTo(NgoProfile::class, 'ngo_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function ngoProfile(): BelongsTo
    {
        return $this->belongsTo(NgoProfile::class, 'ngo_id');
    }
}