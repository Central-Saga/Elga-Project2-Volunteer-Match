<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;

class AttendancePolicy
{
    public function validateAttendance(User $user, Attendance $attendance): bool
    {
        return $user->role === 'ngo'
            && $user->ngoProfile?->id !== null
            && $user->ngoProfile->id === $attendance->application->project->ngo_profile_id;
    }
}
