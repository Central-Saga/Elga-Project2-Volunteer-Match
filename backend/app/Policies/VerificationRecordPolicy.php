<?php

namespace App\Policies;

use App\Models\User;
use App\Models\VerificationRecord;

class VerificationRecordPolicy
{
    public function approve(User $user, VerificationRecord $verification): bool
    {
        return $user->role === 'admin';
    }

    public function reject(User $user, VerificationRecord $verification): bool
    {
        return $user->role === 'admin';
    }
}
