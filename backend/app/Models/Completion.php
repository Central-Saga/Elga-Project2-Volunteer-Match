<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Completion extends Model
{
    protected $fillable = [
        'application_id',
        'status',
        'total_hours',
        'confirmed_at',
        'notes',
    ];

    protected $casts = [
        'total_hours' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }
}