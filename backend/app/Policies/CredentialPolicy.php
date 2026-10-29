<?php

namespace App\Policies;

use App\Models\Credential;
use App\Models\User;

class CredentialPolicy
{
    public function revoke(User $user, Credential $credential): bool
    {
        return $user->role === 'admin';
    }
}
